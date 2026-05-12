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

export type TagGameBubbleDimensions = {
  widthPx: number;
  heightPx: number;
};

export type TagGameBubbleFootprint = {
  halfWidth: number;
  halfHeight: number;
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

export type PlacementMode = "field" | "selected";

export const TAGGAME_SELECTED_BUBBLE_SCALE = 0.84;

type Slot = {
  x: number;
  y: number;
};

type PlacedBubble = {
  x: number;
  y: number;
  footprint: TagGameBubbleFootprint;
};

const LAYOUT_CANVAS_WIDTH = 1220;
const LAYOUT_CANVAS_HEIGHT = 768;
const SLOT_XS = [8, 17, 26, 35, 44, 53, 62, 71, 80, 89];
const SLOT_YS = [9, 15, 21, 27, 33, 39, 45, 51, 57, 63, 69, 75, 81, 87];
const groupAnchors: Record<LayoutGroupId, Slot> = {
  style: { x: 15, y: 16 },
  custom: { x: 89, y: 9 },
  groove: { x: 35, y: 18 },
  skeleton: { x: 12, y: 47 },
  bass: { x: 16, y: 77 },
  harmony: { x: 71, y: 77 },
  texture: { x: 53, y: 77 },
  timbre: { x: 35, y: 77 },
  behavior: { x: 62, y: 15 },
  arrangement: { x: 80, y: 15 },
};

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

function pickSignedRange(seed: number, minAbs: number, maxAbs: number) {
  const magnitude = pickRange(seed, minAbs, maxAbs);
  const sign = seed % 2 === 0 ? 1 : -1;
  return magnitude * sign;
}

function toPercentX(px: number) {
  return (px / LAYOUT_CANVAS_WIDTH) * 100;
}

function toPercentY(px: number) {
  return (px / LAYOUT_CANVAS_HEIGHT) * 100;
}

export function getTagGameBubbleDimensions(
  tag: TagGameTag,
  mode: PlacementMode = "field",
): TagGameBubbleDimensions {
  const labelLength = tag.label.trim().length;

  let dimensions: TagGameBubbleDimensions;

  if (tag.kind === "style") {
    dimensions = {
      widthPx: Math.max(96, Math.min(112, 96 + Math.max(0, labelLength - 8) * 2)),
      heightPx: labelLength > 11 ? 42 : 38,
    };
  } else if (tag.kind === "custom") {
    dimensions = {
      widthPx: Math.max(112, Math.min(140, 112 + Math.max(0, labelLength - 12) * 2.2)),
      heightPx: labelLength > 20 ? 46 : 40,
    };
  } else {
    dimensions = {
      widthPx: Math.max(
        82,
        Math.min(
          108,
          Math.max(
            82 + Math.max(0, labelLength - 10) * 2.5,
            84 + Math.max(0, tag.category.length - 7) * 4,
          ),
        ),
      ),
      heightPx: labelLength > 14 ? 40 : 34,
    };
  }

  if (mode === "field") {
    return dimensions;
  }

  return {
    widthPx: Math.max(74, Math.round(dimensions.widthPx * TAGGAME_SELECTED_BUBBLE_SCALE)),
    heightPx: Math.max(30, Math.round(dimensions.heightPx * TAGGAME_SELECTED_BUBBLE_SCALE)),
  };
}

export function getTagGameBubbleFootprint(
  tag: TagGameTag,
  mode: PlacementMode = "field",
): TagGameBubbleFootprint {
  const { widthPx, heightPx } = getTagGameBubbleDimensions(tag, mode);
  const paddingX = mode === "field" ? 3 : 3;
  const paddingY = mode === "field" ? 3 : 2;
  const floatX = mode === "field" ? 2.5 : 1.2;
  const floatY = mode === "field" ? 2 : 1;

  return {
    halfWidth: toPercentX(widthPx / 2 + paddingX + floatX),
    halfHeight: toPercentY(heightPx / 2 + paddingY + floatY),
  };
}

function getGroupId(tag: TagGameTag): LayoutGroupId {
  if (tag.kind === "style") return "style";
  if (tag.kind === "custom") return "custom";
  return tag.category;
}

function isUsableFieldSlot(slot: Slot) {
  const dx = slot.x - 50;
  const dy = slot.y - 50;
  if (Math.hypot(dx / 30, dy / 26.5) < 1) {
    return false;
  }

  if (slot.x > 75 && slot.y > 28 && slot.y < 74) {
    return false;
  }

  return true;
}

const fieldSlots: Slot[] = SLOT_YS.flatMap((y) => SLOT_XS.map((x) => ({ x, y }))).filter(isUsableFieldSlot);

function overlapsPlacedBubble(slot: Slot, footprint: TagGameBubbleFootprint, placed: PlacedBubble) {
  return Math.abs(slot.x - placed.x) < footprint.halfWidth + placed.footprint.halfWidth
    && Math.abs(slot.y - placed.y) < footprint.halfHeight + placed.footprint.halfHeight;
}

function scoreSlot(slot: Slot, anchor: Slot, seed: number) {
  const distance = Math.hypot(slot.x - anchor.x, slot.y - anchor.y);
  const jitter = pickRange(seed + slot.x * 10 + slot.y * 10, 0, 0.12);
  return distance + jitter;
}

export function createTagGameLayout(tags: TagGameTag[]): Record<string, TagGameBubbleLayout> {
  const placementOrder = tags
    .map((tag, index) => ({
      tag,
      index,
      dimensions: getTagGameBubbleDimensions(tag),
      footprint: getTagGameBubbleFootprint(tag, "field"),
    }))
    .sort((left, right) => right.dimensions.widthPx * right.dimensions.heightPx - left.dimensions.widthPx * left.dimensions.heightPx || left.index - right.index);

  const placed: PlacedBubble[] = [];
  const layouts = new Map<string, TagGameBubbleLayout>();

  for (const { tag, index, footprint } of placementOrder) {
    const groupId = getGroupId(tag);
    const anchor = groupAnchors[groupId];
    const seed = hashString(`${tag.id}-${index}`);
    const slot = fieldSlots
      .filter((candidate) => !placed.some((item) => overlapsPlacedBubble(candidate, footprint, item)))
      .sort((left, right) => scoreSlot(left, anchor, seed) - scoreSlot(right, anchor, seed))[0]
      ?? anchor;

    placed.push({ x: slot.x, y: slot.y, footprint });
    layouts.set(tag.id, {
      id: tag.id,
      x: slot.x + pickRange(seed * 3, -0.18, 0.18),
      y: slot.y + pickRange(seed * 5, -0.14, 0.14),
      floatX: pickSignedRange(seed * 7, 1.4, 2.8),
      floatY: pickSignedRange(seed * 11, 0.9, 1.9),
      duration: pickRange(seed * 13, 7.2, 9.4),
      delay: pickRange(seed * 17, 0, 1.6),
      scale: pickRange(seed * 19, 0.994, 1.012),
    });
  }

  return Object.fromEntries(
    tags.map((tag) => [
      tag.id,
      layouts.get(tag.id) ?? {
        id: tag.id,
        x: 50,
        y: 50,
        floatX: 0,
        floatY: 0,
        duration: 12,
        delay: 0,
        scale: 1,
      },
    ]),
  );
}
