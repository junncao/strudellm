import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { Prec, StateEffect } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

/**
 * High-contrast syntax theme tuned for the DAW's light sage background
 * (#f2faec). Strudel's bundled `strudelTheme` ships with pastel colors
 * (#c3e88d strings, #c792ea keywords) designed for a dark editor bg, so on
 * the light track panels they wash out and become unreadable.
 *
 * We define an additional HighlightStyle and attach it at the highest
 * precedence after the editor mounts, so it wins over Strudel's default
 * highlight rules for matching tags.
 */
const lightHighlight = HighlightStyle.define([
  { tag: t.keyword, color: "#7b3f00", fontWeight: "600" },
  { tag: t.string, color: "#1f5a3d" },
  { tag: t.special(t.string), color: "#1f5a3d" },
  { tag: t.number, color: "#8f3154" },
  { tag: t.bool, color: "#1d4e89" },
  { tag: t.atom, color: "#1d4e89" },
  { tag: t.null, color: "#1d4e89" },
  { tag: t.comment, color: "#6b7568", fontStyle: "italic" },
  { tag: t.lineComment, color: "#6b7568", fontStyle: "italic" },
  { tag: t.blockComment, color: "#6b7568", fontStyle: "italic" },
  { tag: t.variableName, color: "#2c2540" },
  { tag: t.definition(t.variableName), color: "#3d2860", fontWeight: "600" },
  { tag: t.propertyName, color: "#2c2540" },
  { tag: t.attributeName, color: "#2c2540" },
  { tag: t.labelName, color: "#0f5d74", fontWeight: "700" },
  { tag: t.function(t.variableName), color: "#3d2860", fontWeight: "600" },
  { tag: t.function(t.propertyName), color: "#3d2860", fontWeight: "600" },
  { tag: t.operator, color: "#525154" },
  { tag: t.punctuation, color: "#525154" },
  { tag: t.bracket, color: "#525154" },
  { tag: t.unit, color: "#1d4e89" },
  { tag: t.className, color: "#7b3f00" },
  { tag: t.typeName, color: "#0f5d74" },
  { tag: t.tagName, color: "#1f5a3d" },
  { tag: t.meta, color: "#7b3f00" },
  { tag: t.invalid, color: "#9b1c1c", textDecoration: "underline wavy" },
]);

/**
 * Attach the light-bg syntax theme to a CodeMirror EditorView. Safe to call
 * once per editor instance after mount.
 *
 * Note: typed loosely because `@strudel/codemirror`'s `initEditor` is declared
 * as returning `StrudelMirror` even though it actually constructs an
 * EditorView. We narrow at runtime via the `dispatch` method.
 */
export function applyLightSyntaxTheme(view: unknown): void {
  const v = view as EditorView | { dispatch?: EditorView["dispatch"] };
  if (typeof v.dispatch !== "function") return;
  (v as EditorView).dispatch({
    effects: StateEffect.appendConfig.of(
      Prec.highest(syntaxHighlighting(lightHighlight)),
    ),
  });
}
