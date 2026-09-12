import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import HTTPRedirectHandler, Request, build_opener

from app.schemas.agent import validate_endpoint


class AgentExecutionError(Exception):
    """A safe error message suitable for recording in an execution trace."""


class NoRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class AgentHttpClient:
    MAX_BYTES = 2 * 1024 * 1024

    def post(self, endpoint: str, payload: dict, token_env: str, timeout: float):
        validate_endpoint(endpoint)
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        if token_env:
            token = os.environ.get(token_env)
            if not token:
                raise AgentExecutionError(f"Set {token_env} in the backend environment before running")
            if "\r" in token or "\n" in token:
                raise AgentExecutionError("The configured token contains invalid characters")
            headers["Authorization"] = f"Bearer {token}"
        body = json.dumps(payload, allow_nan=False).encode("utf-8")
        if len(body) > self.MAX_BYTES:
            raise AgentExecutionError("Agent request exceeds the 2 MB limit")
        request = Request(endpoint, data=body, headers=headers, method="POST")
        try:
            with build_opener(NoRedirects()).open(request, timeout=timeout) as response:
                raw = response.read(self.MAX_BYTES + 1)
                if len(raw) > self.MAX_BYTES:
                    raise AgentExecutionError("Agent response exceeds the 2 MB limit")
                return json.loads(raw, parse_constant=self._reject_constant)
        except HTTPError as exc:
            # Provider bodies/URLs may contain credentials; do not echo them into traces.
            raise AgentExecutionError(f"Agent endpoint returned HTTP {exc.code}") from None
        except (URLError, TimeoutError, OSError):
            raise AgentExecutionError("Could not reach the agent endpoint or the request timed out") from None
        except (ValueError, UnicodeError):
            raise AgentExecutionError("Agent endpoint did not return valid JSON") from None

    @staticmethod
    def _reject_constant(value):
        raise ValueError("Non-finite JSON value")
