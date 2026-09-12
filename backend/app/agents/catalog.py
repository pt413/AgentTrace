BUILTIN_AGENTS = [
    {
        "id": "llm", "name": "LLM agent", "description": "Send input to a chat model and forward its answer.",
        "accent": "#0d9488",
        "fields": [
            {"key": "endpoint", "label": "Chat completions endpoint", "type": "url", "default": "", "required": True, "placeholder": "http://localhost:11434/v1/chat/completions"},
            {"key": "model", "label": "Model", "type": "text", "default": "", "required": True},
            {"key": "system_prompt", "label": "Instructions", "type": "textarea", "default": "You are a helpful assistant."},
            {"key": "token_env", "label": "API key environment variable (optional)", "type": "text", "default": "", "placeholder": "MY_MODEL_API_KEY"},
        ],
    },
    {
        "id": "template", "name": "Prompt template", "description": "Wrap incoming text or JSON using {{input}}.", "accent": "#6554c0",
        "fields": [{"key": "template", "label": "Template", "type": "textarea", "default": "Summarize the following:\n{{input}}", "required": True}],
    },
    {
        "id": "json_extract", "name": "JSON extractor", "description": "Read a field from JSON, including nested objects and arrays.", "accent": "#2563eb",
        "fields": [{"key": "path", "label": "Field path", "type": "text", "default": "output", "required": True, "placeholder": "results.0.text"}],
    },
    {
        "id": "text_transform", "name": "Text transformer", "description": "Clean whitespace or change the case of incoming text.", "accent": "#d97706",
        "fields": [{"key": "operation", "label": "Operation", "type": "select", "default": "trim", "options": ["trim", "uppercase", "lowercase"]}],
    },
]
