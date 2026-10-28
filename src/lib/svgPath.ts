import type { Bounds } from '@/types/models';

interface Point {
  x: number;
  y: number;
}

const COMMAND = /[MmLlHhVvCcSsQqTtAaZz]/;
const TOKEN = /[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;

/** Number of arguments per command letter. */
const ARITY: Record<string, number> = {
  m: 2,
  l: 2,
  h: 1,
  v: 1,
  c: 6,
  s: 4,
  q: 4,
  t: 2,
  a: 7,
  z: 0,
};

/**
 * Returns the absolute end/control points of an SVG path (all commands, absolute or relative).
 * Arc commands contribute their end point only. Returns `null` for malformed paths.
 */
export function getPathPoints(d: string): Point[] | null {
  const tokens = d.match(TOKEN);
  if (!tokens || !COMMAND.test(tokens[0])) return null;

  const points: Point[] = [];
  let current: Point = { x: 0, y: 0 };
  let start: Point = { x: 0, y: 0 };
  let command = '';
  let index = 0;

  const nextNumbers = (count: number): number[] | null => {
    const values: number[] = [];
    for (let i = 0; i < count; i += 1) {
      const token = tokens[index];
      if (token === undefined || COMMAND.test(token)) return null;
      values.push(Number(token));
      index += 1;
    }
    return values;
  };

  while (index < tokens.length) {
    let explicitCommand = false;
    if (COMMAND.test(tokens[index])) {
      command = tokens[index];
      index += 1;
      explicitCommand = true;
    } else if (!command) {
      return null;
    }

    const lower = command.toLowerCase();
    const relative = command !== command.toUpperCase();
    if (lower === 'z') {
      // Numbers right after "Z" are invalid (and would otherwise loop forever).
      if (!explicitCommand) return null;
      current = { ...start };
      continue;
    }

    const args = nextNumbers(ARITY[lower]);
    if (!args) return null;
    const base = relative ? current : { x: 0, y: 0 };

    switch (lower) {
      case 'm':
      case 'l':
      case 't': {
        current = { x: base.x + args[0], y: base.y + args[1] };
        points.push(current);
        if (lower === 'm') {
          start = { ...current };
          // Extra coordinate pairs after a moveto are implicit linetos.
          command = relative ? 'l' : 'L';
        }
        break;
      }
      case 'h':
        current = { x: (relative ? current.x : 0) + args[0], y: current.y };
        points.push(current);
        break;
      case 'v':
        current = { x: current.x, y: (relative ? current.y : 0) + args[0] };
        points.push(current);
        break;
      case 'c':
        points.push({ x: base.x + args[0], y: base.y + args[1] });
        points.push({ x: base.x + args[2], y: base.y + args[3] });
        current = { x: base.x + args[4], y: base.y + args[5] };
        points.push(current);
        break;
      case 's':
      case 'q':
        points.push({ x: base.x + args[0], y: base.y + args[1] });
        current = { x: base.x + args[2], y: base.y + args[3] };
        points.push(current);
        break;
      case 'a':
        current = { x: base.x + args[5], y: base.y + args[6] };
        points.push(current);
        break;
    }
  }

  return points.length > 0 ? points : null;
}

/**
 * Point on the object where its "found" check and label are placed: the hotspot's `anchor` when
 * given, else the top centre of the first sub-path (e.g. the left curtain of a pair).
 */
export function getHotspotAnchor(hotspot: {
  svgPath: string;
  anchor?: { x: number; y: number };
}): { x: number; y: number } | null {
  if (hotspot.anchor) return hotspot.anchor;
  const nextMove = hotspot.svgPath.slice(1).search(/[Mm]/);
  const firstSubpath = nextMove === -1 ? hotspot.svgPath : hotspot.svgPath.slice(0, nextMove + 1);
  const bounds = getPathBounds(firstSubpath);
  return bounds ? { x: bounds.x + bounds.width / 2, y: bounds.y } : null;
}

/** Approximate bounding box (control points included) of an SVG path, or `null` if malformed. */
export function getPathBounds(d: string): Bounds | null {
  const points = getPathPoints(d);
  if (!points) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const { x, y } of points) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
