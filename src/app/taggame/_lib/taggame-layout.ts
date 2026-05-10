import type { TagGameTag } from "./taggame-tags";

export type TagGameBubbleLayout = {
  id: string;
  x: number;
  y: number;
  floatX: number;
  floatY: number;
  duration: number;
  delay: number;
  scale: number;
};

type LayoutGroupId =
  | "style"
  | "custom"
  | "skeleton"
  | "groove"
  | "bass"
  | "harmony"
  | "texture"
  | "timbre"
  | "behavior"
  | "arrangement";

type GroupAnchor = {
  x: number;
  y: number;
  spreadX: number;
  spreadY: number;
  avoidCenter?: boolean;
};

const groupAnchors: Record<LayoutGroupId, GroupAnchor> = {
  style: { x: 18, y: 16, spreadX: 11, spreadY: 8, avoidCenter: true },
  custom: { x: 88, y: 12, spreadX: 6, spreadY: 5, avoidCenter: true },
  skeleton: { x: 12, y: 42, spreadX: 10, spreadY: 9, avoidCenter: true },
  groove: { x: 34, y: 22, spreadX: 9, spreadY: 8, avoidCenter: true },
  bass: { x: 16, y: 78, spreadX: 9, spreadY: 8, avoidCenter: true },
  harmony: { x: 86, y: 42, spreadX: 10, spreadY: 9, avoidCenter: true },
  texture: { x: 86, y: 78, spreadX: 9, spreadY: 8, avoidCenter: true },
  timbre: { x: 50, y: 88, spreadX: 9, spreadY: 6, avoidCenter: true },
  behavior: { x: 66, y: 22, spreadX: 9, spreadY: 8, avoidCenter: true },
  arrangement: { x: 50, y: 11, spreadX: 9, spreadY: 5, avoidCenter: true },
};

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickRange(seed: number, min: number, max: number) {
  const normalized = (seed % 1000) / 1000;
  return min + (max - min) * normalized;
}

function getGroupId(tag: TagGameTag): LayoutGroupId {
  if (tag.kind === "style") return "style";
  if (tag.kind === "custom") return "custom";
  return tag.category;
}

function isInsideCenterExclusionZone(x: number, y: number) {
  const centerX = 50;
  const centerY = 50;
  const dx = x - centerX;
  const dy = y - centerY;
  return Math.hypot(dx / 28, dy / 24.5) < 1;
}

function buildCandidatePosition({
  anchor,
  localIndex,
  totalInGroup,
  seed,
  attempt,
}: {
  anchor: GroupAnchor;
  localIndex: number;
  totalInGroup: number;
  seed: number;
  attempt: number;
}) {
  const ringIndex = localIndex + attempt * Math.max(totalInGroup, 1);
  const radiusFactor = 0.22 + Math.sqrt(ringIndex + 1) * 0.24;
  const angle = (seed % 360) * (Math.PI / 180) + ringIndex * GOLDEN_ANGLE;

  return {
    x: Math.max(7, Math.min(93, anchor.x + Math.cos(angle) * anchor.spreadX * radiusFactor)),
    y: Math.max(9, Math.min(91, anchor.y + Math.sin(angle) * anchor.spreadY * radiusFactor)),
  };
}

export function createTagGameLayout(tags: TagGameTag[]): Record<string, TagGameBubbleLayout> {
  const placed: Array<{ x: number; y: number; minDistance: number }> = [];
  const groupCounts = tags.reduce<Record<LayoutGroupId, number>>((counts, tag) => {
    const groupId = getGroupId(tag);
    counts[groupId] = (counts[groupId] ?? 0) + 1;
    return counts;
  }, {} as Record<LayoutGroupId, number>);
  const groupIndices = new Map<LayoutGroupId, number>();

  return Object.fromEntries(
    tags.map((tag, index) => {
      const seed = hashString(`${tag.id}-${index}`);
      const groupId = getGroupId(tag);
      const anchor = groupAnchors[groupId];
      const totalInGroup = groupCounts[groupId] ?? 1;
      const localIndex = groupIndices.get(groupId) ?? 0;
      groupIndices.set(groupId, localIndex + 1);

      const minDistance =
        tag.kind === "style" ? 16.5 : tag.kind === "custom" ? 20 : 13.5;

      let x = anchor.x;
      let y = anchor.y;

      for (let attempt = 0; attempt < 36; attempt += 1) {
        const candidate = buildCandidatePosition({
          anchor,
          localIndex,
          totalInGroup,
          seed,
          attempt,
        });
        const hasCollision = placed.some((item) => {
          const dx = candidate.x - item.x;
          const dy = candidate.y - item.y;
          return Math.hypot(dx, dy) < Math.max(minDistance, item.minDistance);
        });
        const entersCenter = anchor.avoidCenter && isInsideCenterExclusionZone(candidate.x, candidate.y);

        if (!hasCollision && !entersCenter) {
          x = candidate.x;
          y = candidate.y;
          break;
        }

        if (attempt === 35) {
          const fallbackRadiusX = Math.max(anchor.spreadX * 1.6, 14);
          const fallbackRadiusY = Math.max(anchor.spreadY * 1.6, 12);
          const fallbackAngle = (seed % 360) * (Math.PI / 180) + localIndex * GOLDEN_ANGLE;
          x = Math.max(6, Math.min(94, anchor.x + Math.cos(fallbackAngle) * fallbackRadiusX));
          y = Math.max(8, Math.min(92, anchor.y + Math.sin(fallbackAngle) * fallbackRadiusY));

          if (anchor.avoidCenter && isInsideCenterExclusionZone(x, y)) {
            const pushAngle = Math.atan2(y - 50, x - 50) || fallbackAngle;
            x = 50 + Math.cos(pushAngle) * 29;
            y = 50 + Math.sin(pushAngle) * 25.5;
          }
          break;
        }
      }

      placed.push({ x, y, minDistance });

      return [
        tag.id,
        {
          id: tag.id,
          x,
          y,
          floatX: pickRange(seed * 3, -6.5, 6.5),
          floatY: pickRange(seed * 7, -5.2, 5.2),
          duration: pickRange(seed * 11, 10, 16),
          delay: pickRange(seed * 13, 0, 2.8),
          scale: pickRange(seed * 17, 0.95, 1.04),
        } satisfies TagGameBubbleLayout,
      ];
    }),
  );
}
