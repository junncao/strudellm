# Design System Specification: Industrial Organic

## 1. Overview & Creative North Star

### The Creative North Star: "The Tactile Studio"
This design system moves away from the sterile, flat world of traditional SaaS and into the realm of the **Tactile Studio**. Inspired by high-end boutique electronic instruments (like those from Teenage Engineering or Love Hultén), the system treats the screen as a physical chassis. 

We break the "template" look by rejecting standard grids in favor of **intentional asymmetry** and **tonal depth**. The interface should feel like a matte-coated piece of hardware—approachable, premium, and deeply responsive. Instead of scrolling through a website, the user should feel as though they are operating a precision-engineered device. We achieve this through "super-radius" corners, a "no-line" philosophy, and a palette that favors soft, organic sage over clinical whites or harsh blacks.

---

## 2. Colors

The color strategy is defined by a "Matte Sage" foundation punctuated by the physical "white" of plastic knobs and the "glow" of status LEDs.

### Color Tokens (Material Design Convention)
*   **Surface (Base):** `#ecffe4` (A soft, matte sage green)
*   **Primary (Functional):** `#5c5f60` (Cool Gray)
*   **Secondary (Warm Accent):** `#894c5a` (Muted Pink/Rose)
*   **Tertiary (Warm Glow):** `#735c00` (Amber/Yellow)
*   **Surface Containers:** Ranging from `Lowest` (`#ffffff`) to `Highest` (`#d6e8ce`).

### The "No-Line" Rule
**Prohibit 1px solid borders for sectioning.** 
Structural boundaries must be defined solely through background color shifts. For example, a dashboard widget (using `surface-container-lowest`) should sit directly on the page background (`surface`) without a stroke. The contrast between the sage base and the off-white container provides all the separation needed.

### Surface Hierarchy & Nesting
Treat the UI as a series of nested layers. 
*   **Background:** `surface`
*   **Main Content Blocks:** `surface-container-low`
*   **Interactive Floating Elements:** `surface-container-lowest` (purest white, mimicking plastic knobs).
*   **Inset/Recessed Areas:** `surface-dim` or `surface-container-highest`.

### The "Glass & Glow" Rule
To mimic light-emitting diodes (LEDs) on a physical board, use semi-transparent overlays for "active" states. Utilize the `secondary_fixed` (`#ffd9df`) and `tertiary_fixed` (`#ffe087`) tokens with a `backdrop-blur` of 12px to create a soft, radiant glow that feels like light bleeding through a matte surface.

---

## 3. Typography

The typography is clean, functional, and editorial. It mimics the precision of industrial labeling.

*   **Display & Headlines (Manrope):** We use Manrope for its geometric yet friendly structure. High-contrast sizing (e.g., `display-lg` at 3.5rem) creates an authoritative editorial feel, reminiscent of manual covers or vintage gear branding.
*   **Body & Labels (Inter):** Inter provides maximum legibility for functional data. 
*   **Hierarchy Note:** Use all-caps with generous letter-spacing (0.05em) for `label-sm` to mimic the engraved text found next to instrument switches.

---

## 4. Elevation & Depth

In this system, depth is "Industrial Organic"—it feels physically machined rather than digitally rendered.

### The Layering Principle
Depth is achieved by "stacking" tonal tiers. To lift a component, do not change the shadow; change the surface token. 
*   **Flush:** `surface-container-low` on `surface`.
*   **Raised (Tactile):** `surface-container-lowest` on `surface-container-low`.

### Ambient Shadows
Shadows are reserved only for elements that "float" above the chassis (like tooltips or dropdowns).
*   **Formula:** `0px 20px 40px rgba(17, 31, 15, 0.06)`. 
*   The shadow color is derived from `on-surface` (a deep green-black), ensuring the shadow feels like a natural occlusion of light on the sage surface rather than a gray smudge.

### The "Ghost Border" Fallback
If accessibility requires a container boundary, use a "Ghost Border": the `outline-variant` token at 15% opacity. It should be felt, not seen.

---

## 5. Components

### Buttons & Knobs
*   **Primary:** Uses `primary` (`#5c5f60`) with a `full` (9999px) radius. Sizing should be chunky and tactile.
*   **Secondary (Knob Style):** Use `surface-container-lowest` (white) with a subtle inner shadow to mimic a physical button protruding from the sage chassis.
*   **States:** On hover, apply a `tertiary_fixed` glow effect (soft yellow) rather than a simple color darken.

### Inputs & Sliders
*   **Slider Track:** Use `surface-dim` for the track and `primary` for the thumb. 
*   **Thumb:** Should be a large, circular "knob" using the `xl` (3rem) or `full` radius.
*   **Input Fields:** Recessed style. Use `surface-container-highest` with a 2px inner-top shadow to simulate the field being "cut out" of the hardware.

### Cards
*   **Forbid Dividers:** Use vertical whitespace (32px or 48px) to separate content sections.
*   **Corner Treatment:** Always use `lg` (2rem) or `xl` (3rem) radius to maintain the organic, molded plastic aesthetic.

### Additional Component: The "LED Status"
A small circular component using `secondary` (pink) or `tertiary` (yellow) with a multi-layered box-shadow to simulate a glowing light. Use this for "Live," "Active," or "Warning" states.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts. Place a large knob (slider thumb) off-center to create visual interest.
*   **Do** lean into high roundedness. Sharp corners are forbidden in the "Industrial Organic" world.
*   **Do** use `surface-container` shifts to group related items instead of drawing boxes around them.
*   **Do** use the `manrope` font for large-scale numbers (e.g., data visualizations) to give them a "gauged" feel.

### Don't
*   **Don't** use 1px solid black or gray borders. This breaks the "matte chassis" illusion.
*   **Don't** use standard blue for links. Use the `primary` gray or `secondary` rose.
*   **Don't** use harsh drop shadows. If it doesn't look like a soft shadow in a photography studio, it’s too dark.
*   **Don't** crowd the interface. Physical instruments need "finger room"; your UI needs "breathing room." Use the `xl` spacing scale generously.