---
tags:
  - gene
  - rhythm
  - strudel
  - handbook
---

# Open Hat 在反拍

## 是什么

这是典型的 offbeat open hat：open hat 不打在正拍，而是打在每一拍的后半拍。

## 听感

它会立刻让 groove 更有弹性，也会让四拍 kick 听起来更像 house / disco 的语言。

## Strudel 示例

```js
$: s("[~ oh]*4").bank("RolandTR909")
```

这个结构的意思是：每一拍先空一下，再在后半拍打一个 open hat。

## 使用提醒

- 它和 `4-4 kick` 是很经典的一对。
- 如果 open hat 太长，可能会和 clap 或 snare 打架，要控制 release。

