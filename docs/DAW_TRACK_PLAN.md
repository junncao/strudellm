# 技术方案：DAW Multi-Track 界面

## 1. 核心发现

### Strudel `$name:` 语法是天然的轨道边界

Strudel 的 `$name:` 语法本身就是多轨设计：每个 `$` 前缀的命名块独立并行播放，这正是 DAW 轨道的语义：

```javascript
$kick: s("bd ~ bd ~").bank("RolandTR909").gain(0.95)
$snare: s("~ sd ~ sd").bank("RolandTR909")
$bass: note("g1 ~ g1").s("sawtooth").lpf(400)
$pad: note("<[g3,bb3]>").s("supersaw").gain(0.25)
```

Mute 天然由 `_$name:` 支持（underscore 前缀），无需额外 Strudel API。Volume 通过修改 `.gain(value)` 实现。

---

## 2. 整体架构变化

**当前布局**：`左-REPL编辑器 | 右-AI 聊天`

**目标布局**：`左-DAW 轨道面板（主体，可滚动）| 右-AI 聊天侧栏`

隐藏的 CodeMirror 编辑器（`position: fixed; top: -9999px`）保留在 DOM 中，仍驱动音频引擎，对用户不可见。

---

## 3. 数据模型

```typescript
type Track = {
  id: string           // 生成的唯一ID
  name: string         // "$kick" → "kick"
  code: string         // 不含 $name: 前缀的纯 pattern 代码
  muted: boolean       // 对应 _$name: 语法
  soloed: boolean      // UI状态，影响其他轨道mute
  volume: number       // 0..1，映射到 .gain()
}

type DawState = {
  preamble: string     // setCpm() 等全局设置行
  tracks: Track[]
  rawCode: string      // 无法解析为 $name: 时的 fallback
  isMultiTrack: boolean
}
```

---

## 4. 代码解析/编译层（`src/strudel/lib/track-parser.ts`）

**解析**：`parseTracksFromCode(code: string) → DawState`

- 用正则提取 `$name:` 和 `_$name:` 命名块
- 识别 `_$name:` 为已 muted 状态
- 用 `/\.gain\(([\d.]+)\)/` 提取当前 volume 值（不存在则默认 `0.8`）
- 剩余头部行（`setCpm` 等）进入 `preamble`
- 无 `$name:` 块时：`isMultiTrack: false`，整体作为单 "Main" 轨道

**编译**：`compileTracksToCode(state: DawState) → string`

- 将 `preamble` 放最前
- 遍历 tracks：
  - `muted || (anySoloed && !track.soloed)` → `_$name: code`
  - 否则 → `$name: code`
  - 将 volume 注入为 `.gain(volume)`（替换已有 `.gain()` 或追加）

---

## 5. 轨道状态管理（`src/strudel/context/track-context.tsx`）

React Context + Reducer 管理 `DawState`：

```
Actions: PARSE_FROM_CODE | SET_MUTE | SET_SOLO | SET_VOLUME | ADD_TRACK | CLEAR_SOLO
```

**关键数据流**：

```
AI 调用 updateRepl(fullCode)
  → StrudelService.updateAndPlay()
  → onStateChange 回调
    → TrackContext.dispatch(PARSE_FROM_CODE, newCode)
      → parseTracksFromCode() → 更新轨道 UI

用户操作 Mute/Solo/Volume
  → TrackContext.dispatch()
    → compileTracksToCode() → 生成新 fullCode
      → StrudelService.updateAndPlay(newCode)
        → 音频引擎重新评估
```

TrackContext 需订阅 `StrudelService.onStateChange`，在代码变化时重新解析。

---

## 6. 新增 AI 工具：`updateTrack`

在 `src/lib/tambo.ts` 新增工具，让 AI 可以有针对性地更新单个轨道：

```typescript
defineTool({
  name: "updateTrack",
  description: "Update a specific instrument track...",
  inputSchema: z.object({
    trackName: z.string(),
    code: z.string(),  // 只需 pattern 部分，不含 $name: 前缀
  })
})
// 工具内部：取当前 DawState → 替换对应 track.code → 编译 → updateAndPlay
```

同时修改 `updateRepl` 工具，在执行后触发 track 重解析。

---

## 7. UI 组件规划

**新增文件：**

| 文件 | 职责 |
|------|------|
| `src/components/daw/daw-panel.tsx` | 主面板，轨道列表 + Add Track 按钮 |
| `src/components/daw/track-card.tsx` | 单轨卡片（名称、SOLO/MUTE、音量、代码预览） |
| `src/components/daw/volume-fader.tsx` | 音量 slider，styled 为 knob 样式 |
| `src/components/daw/add-track-dialog.tsx` | 弹窗输入新轨道名 |

**修改文件：**

| 文件 | 改动 |
|------|------|
| `src/app/chat/page.tsx` | Main 区域用 `DawPanel` 替换 `StrudelRepl`，保留隐藏编辑器 |
| `src/strudel/tools/validateAndUpdateRepl.ts` | 成功后通知 TrackContext 重解析 |
| `src/app/chat/page.tsx` | 加 `TrackContextProvider` |

---

## 8. 设计系统（对应 docs/DESIGN.md）

| 元素 | 规格 |
|------|------|
| 背景 | `bg-[#ecffe4]`（matte sage） |
| 轨道卡外容器 | `bg-[#e7f9de]`（surface-container-low），`rounded-2xl`，无 border |
| 轨道控制区 | `bg-[#d6e8ce]`（surface-container-highest），`rounded-xl` |
| 代码展示区 | `bg-white/50`（surface-container-lowest），`rounded-xl`，monospace |
| MUTE 激活 | `bg-[#ffdad6] text-[#93000a]`（error container） |
| SOLO 激活 | `bg-[#ffd9df] text-[#6d3543]`（secondary container） |
| 音量 slider | 轨道 `bg-[#cddfc6]`，拇指 `bg-white rounded-full` + hover glow `shadow-[0_0_12px_#ffe087]` |
| 字体 | Manrope（轨道名），Inter（代码/标签），全大写 + 宽字距 for labels |
| Add Track FAB | 左下角，`bg-[#ffe087]`，`rounded-full` |

---

## 9. Solo 逻辑

Solo 是 UI-only 状态（Strudel 无原生 solo）：

- 任意轨道 soloed → 编译时所有 non-soloed 轨道加 `_` 前缀
- 再次点击 solo → 取消所有 solo，恢复 mute 原始状态
- 多轨 solo：允许同时 solo 多个轨道

---

## 10. 边界情况处理

| 场景 | 处理 |
|------|------|
| AI 生成非 `$name:` 代码（如 `stack(...)`） | 显示为单 "Main" 轨道，不显示 Add Track |
| 轨道代码跨多行 | 正则用 multiline 模式，整块捕获 |
| `.gain()` 嵌套在 `stack()` 里 | 只解析顶层 `$name:` 块内的第一个 `.gain()`，其余保留 |
| 添加新空轨道 | 生成 `$trackN: s("~")` 占位，提示用户通过 AI 填充 |
| 代码包含 `slider()` | volume fader 显示"由 slider 控制"，禁用 slider，不覆盖 |

---

## 11. 分阶段实施

### Phase 1 — 核心基础（解析 + 布局 + 展示）

目标：轨道能从 AI 生成代码自动解析并展示，布局切换为 DAW 风格。

- [ ] `src/strudel/lib/track-parser.ts` — 解析/编译函数
- [ ] `src/strudel/context/track-context.tsx` — 状态管理
- [ ] `src/components/daw/daw-panel.tsx` — 主面板
- [ ] `src/components/daw/track-card.tsx` — 轨道卡（只展示，无交互）
- [ ] 修改 `src/app/chat/page.tsx` — 布局切换，隐藏编辑器

### Phase 2 — 交互功能（Mute/Solo/Volume）

目标：轨道控件接入音频引擎。

- [ ] TrackCard 加 MUTE/SOLO 按钮逻辑
- [ ] `src/components/daw/volume-fader.tsx`
- [ ] compileTracksToCode → StrudelService.updateAndPlay 接入

### Phase 3 — 增强功能

目标：完整 DAW 体验。

- [ ] Add Track 对话框 + FAB
- [ ] `updateTrack` AI 工具
- [ ] 设计系统精修（Manrope 字体、色彩细节）
- [ ] 轨道名称标记支持
