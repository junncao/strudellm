export type TagGameStyleTag = {
  id: string;
  label: string;
  kind: "style";
  description: string;
  promptCue: string;
  tempoHint: string;
  paletteHint: string;
  energyHint: string;
  colorToken: "violet" | "blue" | "pink" | "emerald" | "amber";
};

export type TagGameGeneCategoryId =
  | "skeleton"
  | "groove"
  | "bass"
  | "harmony"
  | "texture"
  | "timbre"
  | "behavior"
  | "arrangement";

export type TagGameGeneTag = {
  id: string;
  name: string;
  label: string;
  kind: "gene";
  category: TagGameGeneCategoryId;
  description: string;
  definition: string;
  effect: string;
  type: string;
  promptCue: string;
  colorToken: "lime" | "sky" | "rose" | "orange" | "teal";
};

export type TagGameCustomTag = {
  id: string;
  name: string;
  label: string;
  kind: "custom";
  category: "custom";
  description: string;
  definition: string;
  effect: string;
  type: "custom prompt";
  promptCue: string;
  colorToken: "pink";
};

export type TagGameTag = TagGameStyleTag | TagGameGeneTag | TagGameCustomTag;

export const styleTags: TagGameStyleTag[] = [
  {
    id: "house",
    label: "House",
    kind: "style",
    description: "稳定四拍推进、明亮律动、适合舞池循环。",
    promptCue:
      "Use a house framework with a club-ready pulse, clear groove, and uplifting repetition.",
    tempoHint: "118-126 BPM",
    paletteHint: "punchy drums, warm bass, bright stabs or chords",
    energyHint: "steady, danceable, medium-high energy",
    colorToken: "violet",
  },
  {
    id: "techno",
    label: "Techno",
    kind: "style",
    description: "更硬朗、更催眠、更机械的俱乐部推进。",
    promptCue:
      "Use a hypnotic techno frame with repetition, mechanical focus, and gradual motion.",
    tempoHint: "126-134 BPM",
    paletteHint: "driving kick, dry percussion, dark synth pressure",
    energyHint: "focused, relentless, high energy",
    colorToken: "blue",
  },
  {
    id: "ambient",
    label: "Ambient",
    kind: "style",
    description: "空间感、延展感、弱打击、氛围优先。",
    promptCue:
      "Use an ambient frame with spacious texture, soft attacks, and floating harmony.",
    tempoHint: "60-100 BPM or implied pulse",
    paletteHint: "pads, drones, air, soft keys, sparse percussion",
    energyHint: "low, drifting, immersive",
    colorToken: "emerald",
  },
  {
    id: "disco",
    label: "Disco",
    kind: "style",
    description: "带抬升感的舞池律动、亮色和弦、弹跳低音。",
    promptCue:
      "Use a disco-inspired frame with buoyant rhythm, celebratory harmony, and lively bass motion.",
    tempoHint: "110-124 BPM",
    paletteHint: "claps, open hats, bright chords, rubbery bass",
    energyHint: "joyful, lifted, medium-high energy",
    colorToken: "amber",
  },
  {
    id: "uk-garage",
    label: "UK Garage",
    kind: "style",
    description: "跳跃、切分、车库感强的律动。",
    promptCue:
      "Use a UK garage frame with two-step syncopation, bouncy offbeats, and agile low-end movement.",
    tempoHint: "128-134 BPM",
    paletteHint: "skippy drums, shuffled hats, warm chords, elastic bass",
    energyHint: "nimble, playful, high energy",
    colorToken: "pink",
  },
  {
    id: "jungle",
    label: "Jungle",
    kind: "style",
    description: "高速 break、低频冲击、切片与野性运动。",
    promptCue:
      "Use a jungle frame with chopped breaks, fast motion, deep sub pressure, and restless edits.",
    tempoHint: "158-172 BPM",
    paletteHint: "breaks, sub bass, edits, rave fragments",
    energyHint: "wild, kinetic, high energy",
    colorToken: "violet",
  },
  {
    id: "trap",
    label: "Trap",
    kind: "style",
    description: "重低音、稀疏主鼓、快速帽子与滑音。",
    promptCue:
      "Use a trap frame with sparse heavy drums, long low-end, and fast hi-hat articulation.",
    tempoHint: "130-150 BPM with half-time feel",
    paletteHint: "808s, sparse snares, hat rolls, dark melodic fragments",
    energyHint: "heavy, ominous, punchy",
    colorToken: "blue",
  },
  {
    id: "electro",
    label: "Electro",
    kind: "style",
    description: "机械律动、合成器驱动、电子边缘更明显。",
    promptCue:
      "Use an electro frame with synthetic percussion, robotic funk, and crisp machine energy.",
    tempoHint: "118-132 BPM",
    paletteHint: "synthetic drums, plucks, sequenced bass, bright machine tones",
    energyHint: "wired, crisp, medium-high energy",
    colorToken: "emerald",
  },
  {
    id: "neo-soul",
    label: "Neo Soul",
    kind: "style",
    description: "更松弛、更温暖、更和声导向。",
    promptCue:
      "Use a neo-soul frame with warm harmony, laid-back groove, and expressive chord color.",
    tempoHint: "82-108 BPM",
    paletteHint: "soft keys, warm bass, jazzy chords, subtle drums",
    energyHint: "relaxed, intimate, medium-low energy",
    colorToken: "pink",
  },
  {
    id: "cinematic",
    label: "Cinematic",
    kind: "style",
    description: "更叙事、更空间、更有推进和张力。",
    promptCue:
      "Use a cinematic frame with dramatic space, tension arcs, and scene-setting layers.",
    tempoHint: "70-120 BPM",
    paletteHint: "drones, impacts, swells, modal harmony, wide textures",
    energyHint: "expansive, narrative, shape-shifting",
    colorToken: "amber",
  },
];

const geneColorByCategory: Record<TagGameGeneCategoryId, TagGameGeneTag["colorToken"]> = {
  skeleton: "orange",
  groove: "sky",
  bass: "teal",
  harmony: "rose",
  texture: "lime",
  timbre: "sky",
  behavior: "teal",
  arrangement: "orange",
};

function defineGene(
  id: string,
  name: string,
  category: TagGameGeneCategoryId,
  definition: string,
  effect: string,
  type: string,
  promptCue: string,
): TagGameGeneTag {
  return {
    id,
    name,
    label: name,
    kind: "gene",
    category,
    description: definition,
    definition,
    effect,
    type,
    promptCue,
    colorToken: geneColorByCategory[category],
  };
}

export function createCustomTag(value: string): TagGameCustomTag {
  const normalized = value.trim().replace(/\s+/g, " ");
  return {
    id: `custom-${normalized.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.random().toString(36).slice(2, 8)}`,
    name: normalized,
    label: normalized,
    kind: "custom",
    category: "custom",
    description: normalized,
    definition: normalized,
    effect: "Inject a direct user-authored musical instruction into the current fusion.",
    type: "custom prompt",
    promptCue: normalized,
    colorToken: "pink",
  };
}

export const geneTags: TagGameGeneTag[] = [
  defineGene("four-on-floor-kick", "4-4 kick", "skeleton", "四四拍底鼓骨架，每一拍都有 kick", "决定最基础的推进感", "rhythm / skeleton", "Use a four-on-the-floor kick pulse as the rhythmic spine."),
  defineGene("four-on-floor-snare", "4-4 snare", "skeleton", "每一拍都给 snare，形成更硬更满的军鼓脉冲", "让鼓组更密、更强硬、更机械", "rhythm / skeleton", "Use quarter-note snares on every beat for a rigid, driving snare pulse."),
  defineGene("sparse-kick", "sparse kick", "skeleton", "减少底鼓落点，保留更大空隙", "让 groove 更轻、更有呼吸和留白", "rhythm / skeleton", "Keep the kick sparse with fewer hits and more negative space."),
  defineGene("broken-beat", "broken beat", "skeleton", "非四拍地板、切分更明显的鼓骨架", "让律动更碎、更游移", "rhythm / skeleton", "Use syncopated, broken drum placement instead of a straight four-on-the-floor skeleton."),
  defineGene("snare-on-2-and-4", "snare on 2 and 4", "skeleton", "第 2 和第 4 拍打出稳定军鼓", "给节奏一个清晰直接的 backbeat", "rhythm / skeleton", "Place the snare clearly on beats 2 and 4."),
  defineGene("half-time-snare", "half-time snare", "skeleton", "军鼓落点更稀疏，整体听感更慢更重", "拉开空间感和重量感", "rhythm / skeleton", "Place the snare in a half-time feel with heavier spacing."),
  defineGene("two-step", "2-step", "skeleton", "kick 和 snare 错开，带 UK garage 弹性", "制造跳跃和空隙", "rhythm / skeleton", "Use a two-step skeleton with skipped downbeats and agile snare placement."),
  defineGene("dembow", "dembow", "skeleton", "拉丁化、身体感强的鼓组重音", "让律动更扭、更直接", "rhythm / skeleton", "Use a dembow-like kick and snare accent pattern."),

  defineGene("eighth-hihat", "8th hihat", "groove", "八分音符连续踩镲脉冲", "建立稳定推进和速度感", "groove", "Use steady eighth-note hi-hats."),
  defineGene("sixteenth-hihat", "16th hihat", "groove", "十六分音符踩镲，帽子更密更细", "让律动更快更绵密", "groove", "Use steady sixteenth-note hi-hats for dense hat motion."),
  defineGene("clap-on-2-and-4", "clap on 2 and 4", "groove", "第 2 和第 4 拍加入 clap", "带来经典舞曲 backbeat 提示", "groove", "Place claps on beats 2 and 4."),
  defineGene("ghost-snare", "ghost snare", "groove", "主军鼓之间藏着很轻的装饰军鼓", "增加人味和细密律动", "groove", "Add very light ghost snares between the main snare hits."),
  defineGene("offbeat-open-hat", "offbeat open hat", "groove", "反拍位置加入 open hat 抬升", "制造弹跳、空气和舞池上扬感", "groove", "Use open hats on the offbeats to lift the groove."),
  defineGene("triplet-pulse", "triplet pulse", "groove", "用三连音脉冲组织某个打击层", "让律动带上 triplet 摇摆和滚动感", "groove", "Introduce a triplet-based pulse in one rhythmic layer."),
  defineGene("swing", "swing", "groove", "拍点不是完全笔直，而是有摆动", "让 groove 更活", "groove", "Add swung timing and off-grid rhythmic feel."),
  defineGene("shuffle", "shuffle", "groove", "三连音感的摇摆节奏", "让节奏更滚动、更蓝调", "groove", "Use a shuffle feel with triplet-weighted subdivisions."),
  defineGene("tight-grid", "tight grid", "groove", "拍点贴近网格，几乎不拖不抢", "让律动更机械、更精确", "groove", "Keep timing tight, quantized, and grid-forward."),
  defineGene("laid-back-pocket", "laid-back pocket", "groove", "军鼓、和弦或低音略微靠后", "制造松弛、慵懒和 head-nod 感", "groove", "Make the groove feel slightly laid-back with late-feeling accents."),
  defineGene("offbeat-lift", "offbeat lift", "groove", "反拍上的帽子、和弦或低音抬升", "制造弹跳和上扬", "groove", "Emphasize offbeats to create bounce and lift."),
  defineGene("ghost-notes", "ghost notes", "groove", "主拍之间藏着轻声装饰音", "增加人味和细密律动", "groove", "Add ghost notes between the main hits for a more alive groove."),

  defineGene("funk-bass", "funk bass", "bass", "切分、弹跳、带空隙的低音线", "让音乐更有身体感和弹性", "bass", "Write a syncopated funk bassline with bounce and rests."),
  defineGene("acid-bass", "acid bass", "bass", "共振滤波、滑音、重复的酸性低音", "带来 acid / club 的咬合感", "bass", "Use a resonant acid bass pattern with filter movement."),
  defineGene("sub-bass", "sub bass", "bass", "低频为主、音色简洁的根音支撑", "增加重量和俱乐部下潜感", "bass", "Anchor the track with clean, deep sub bass."),
  defineGene("walking-bass", "walking bass", "bass", "连续移动、连接和声的低音线", "制造爵士或复古行进感", "bass", "Use a walking bassline that connects chord tones."),
  defineGene("reese-bass", "reese bass", "bass", "失谐、宽厚、缓慢摆动的低音", "制造压迫和厚度", "bass", "Use a detuned reese-style bass with slow movement."),
  defineGene("rubber-bass", "rubber bass", "bass", "短促有弹性的滤波低音", "增加 disco / funk 弹性", "bass", "Use a short rubbery bass with plucky articulation."),

  defineGene("jazzy-chord", "jazzy chord", "harmony", "七和弦、九和弦或更丰富的和声色彩", "让音乐更温暖、更复杂", "harmony", "Use extended jazzy chords and voicings."),
  defineGene("minor-mood", "minor mood", "harmony", "小调或偏暗的调式中心", "制造阴影、张力或夜晚感", "harmony", "Lean into a minor-mode harmonic mood."),
  defineGene("bright-major", "bright major", "harmony", "大调、明亮、上扬的和声重心", "让旋律更开放、更积极", "harmony", "Use bright major harmony with open, optimistic color."),
  defineGene("dorian-color", "dorian color", "harmony", "小调底色里带一点亮感", "让阴影里带微光", "harmony", "Use dorian color for minor warmth with a bright edge."),
  defineGene("sus-chords", "sus chords", "harmony", "悬挂和弦，弱化大小调落点", "让和声更漂浮和开放", "harmony", "Use suspended chords to keep harmony open and floating."),
  defineGene("chromatic-passing", "chromatic passing", "harmony", "半音经过连接稳定音", "增加滑动感和细节", "harmony", "Use chromatic passing tones between stable notes."),

  defineGene("pad-wash", "pad wash", "texture", "铺底、延展、模糊边界的和声垫", "增加空间、空气和连贯感", "texture", "Add a soft pad wash for width and atmosphere."),
  defineGene("grain-cloud", "grain cloud", "texture", "颗粒化、雾状的背景层", "让背景更梦幻和流动", "texture", "Use a grainy cloud-like background texture."),
  defineGene("vinyl-noise", "vinyl noise", "texture", "轻微噪声、底噪或老唱片颗粒", "增加 lo-fi 温度", "texture", "Add subtle vinyl-like noise under the groove."),
  defineGene("dub-space", "dub space", "texture", "大片 delay / reverb 尾音塑造空间", "让音乐更深更松散", "texture", "Use dubby delay and reverb space for depth."),
  defineGene("drone-bed", "drone bed", "texture", "持续音或根音长时间铺底", "制造催眠和调性锚点", "texture", "Use a sustained drone bed as a tonal anchor."),

  defineGene("dusty-drums", "dusty drums", "timbre", "带颗粒、旧采样或轻微失真的鼓声", "增加复古、lo-fi 和采样感", "timbre", "Make the drums dusty, sampled, and slightly worn."),
  defineGene("crispy-hats", "crispy hats", "timbre", "明亮、清脆、存在感强的 hi-hat", "提升速度感和高频细节", "timbre", "Use crisp hi-hats with clear high-frequency motion."),
  defineGene("acid-tone", "acid tone", "timbre", "高共振、咬耳、会扫动的合成器音色", "制造电子、锐利、迷幻的质感", "timbre", "Use a resonant acid synth tone with animated filtering."),
  defineGene("warm-analog", "warm analog", "timbre", "圆润、轻微失谐、不过分锋利的合成器", "让声音更厚、更亲近", "timbre", "Use warm analog-style synth tones with subtle detune."),
  defineGene("soft-keys", "soft keys", "timbre", "柔和电钢或 muted chord 音色", "让和声更温暖、更亲密", "timbre", "Use soft key-like tones for intimate chord support."),
  defineGene("fm-glass", "FM glass", "timbre", "金属、玻璃感、数字质地更强", "增加冷感和亮度", "timbre", "Use glassy FM-like tones for metallic brightness."),

  defineGene("hypnotic-loop", "hypnotic loop", "behavior", "重复性强、细节慢慢变化的循环", "形成沉浸、催眠、club 里的锁定感", "behavior", "Build a hypnotic loop that stays locked but compelling."),
  defineGene("micro-variation", "micro variation", "behavior", "小概率、小幅度的节奏或音色变化", "避免循环僵硬，同时不破坏稳定性", "behavior", "Add small probabilistic variations without destabilizing the groove."),
  defineGene("call-response", "call response", "behavior", "两个声部之间短句互相回应", "让 loop 像对话而不是平铺", "behavior", "Create call-and-response between two musical layers."),
  defineGene("filter-evolution", "filter evolution", "behavior", "滤波器随时间慢慢开合", "制造渐进变化", "behavior", "Animate filter cutoff slowly across the loop."),
  defineGene("phase-drift", "phase drift", "behavior", "相近但不同长度的循环慢慢错位", "制造长期变化感", "behavior", "Let one layer phase against another with a slightly different cycle."),

  defineGene("stabs", "stabs", "arrangement", "短促、切入式的和弦或采样点缀", "制造呼应、强调和段落感", "arrangement", "Add short stabs as rhythmic arrangement accents."),
  defineGene("fill-every-four", "4-bar fill", "arrangement", "每四小节出现一次小 fill", "帮助循环形成边界", "arrangement", "Add a small fill every fourth cycle."),
  defineGene("breakdown-gap", "breakdown gap", "arrangement", "短暂抽掉主鼓或低音", "制造呼吸和重新进入的冲击", "arrangement", "Create a brief breakdown gap before the groove returns."),
  defineGene("percussion-answer", "percussion answer", "arrangement", "主鼓之后由小打击乐回应", "填补空隙并增加舞动细节", "arrangement", "Let percussion answer the main kick and snare pattern."),
];

export const tagGameTags: TagGameTag[] = [...styleTags, ...geneTags];

const styleById = new Map(styleTags.map((tag) => [tag.id, tag]));
const geneById = new Map(geneTags.map((tag) => [tag.id, tag]));

export function getTagGameTagsByIds(ids: string[]): TagGameTag[] {
  return ids.reduce<TagGameTag[]>((result, id) => {
    const style = styleById.get(id);
    if (style) {
      result.push(style);
      return result;
    }

    const gene = geneById.get(id);
    if (gene) {
      result.push(gene);
    }

    return result;
  }, []);
}

export function getTagGameGenesByIds(ids: string[]): TagGameGeneTag[] {
  return ids.flatMap((id) => {
    const gene = geneById.get(id);
    return gene ? [gene] : [];
  });
}

export function getTagGameStylesByIds(ids: string[]): TagGameStyleTag[] {
  return ids.flatMap((id) => {
    const style = styleById.get(id);
    return style ? [style] : [];
  });
}
