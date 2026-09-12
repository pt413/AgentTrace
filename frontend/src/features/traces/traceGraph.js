import { MarkerType, Position } from 'reactflow';

const TYPE_COLORS = { agent: '#5b5bd6', llm: '#0d9488', tool: '#d97706', retriever: '#2563eb' };

export const formatDuration = (duration) => {
  if (duration === null || duration === undefined) return '—';
  return duration >= 1000 ? `${(duration / 1000).toFixed(2)} s` : `${Math.round(duration)} ms`;
};

const spanDepth = (span, byId) => {
  let depth = 0;
  let parentId = span.parent_span_id;
  const visited = new Set([span.id]);
  while (parentId && byId.has(parentId) && !visited.has(parentId)) {
    visited.add(parentId);
    depth += 1;
    parentId = byId.get(parentId).parent_span_id;
  }
  return depth;
};

export const traceToGraph = (spans = []) => {
  const byId = new Map(spans.map((span) => [span.id, span]));
  const rowsAtDepth = new Map();
  const nodes = spans.map((span) => {
    const depth = spanDepth(span, byId);
    const row = rowsAtDepth.get(depth) || 0;
    rowsAtDepth.set(depth, row + 1);
    const normalizedType = span.span_type?.toLowerCase();
    return {
      id: span.id,
      type: 'traceNode',
      position: { x: 70 + depth * 280, y: 70 + row * 160 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: { ...span, accent: TYPE_COLORS[normalizedType] || '#64748b', durationLabel: formatDuration(span.duration_ms) },
    };
  });
  const edges = spans.filter((span) => span.parent_span_id && byId.has(span.parent_span_id)).map((span) => ({
    id: `${span.parent_span_id}-${span.id}`,
    source: span.parent_span_id,
    target: span.id,
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
    style: { stroke: '#94a3b8', strokeWidth: 2 },
  }));
  return { nodes, edges };
};
