---
tags:
  - gene
  - rhythm
  - strudel
  - handbook
---

# Clap on 2 and 4

## 是什么

这是最经典的 backbeat clap 骨架：clap 落在 2 和 4 拍。

## 听感

它会立刻让节奏听起来更像流行、house、disco 或 funk 的基础骨架。

## Strudel 示例

```js
$: s("[~ cp]*2").bank("RolandTR909")
```

这句的意思是：每半小节先空一下，再打一个 clap，所以一整小节会落在 2 和 4。

## 使用提醒

- 很适合和 `4/4 kick` 搭配。
- 如果想更硬一点，可以把 `cp` 换成 `sd`。

