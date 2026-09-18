# Lined Paper

Ruled notebook paper: a uniform grid of horizontal rules across the page, a red
margin rule down the left, and text sitting on the lines.

Select it in Bike > Settings > Appearance > Light Theme > "Lined Paper".

## Why this is an extension and not just a theme

A `.bktheme` is pure configuration — colors, window materials, and row/run text
styles. It has no decorations, no geometry, and its material `fill` has no image
or pattern case, so it cannot draw a rule. This extension therefore ships two
halves that work together:

- `theme/lined-paper.bktheme` — the paper and ink palette, plus two **custom**
  colors, `paperRule` and `paperMargin`.
- `style/main.ts` — a `defineEditorStyleModifier` that draws the ruling and
  reads those colors back via `context.theme.colors.get(...)`.

Edit the `.bktheme` to recolor the paper; edit `style/main.ts` to change the
ruling itself.

## How the ruling is drawn

One decoration per **visible top-level row** (`.focused-level() = 0`), filled
with a tiling pattern color (`Color.pattern`) whose tile is one line-box tall
with a hairline across it. Each band covers that row's whole branch and is
widened from the text column out to the sheet edges.

**It cannot live on the root row**, which would otherwise be ideal — one
decoration spanning the entire document. `EditorStyle.prepareStyledRow` returns
a hardcoded default style for the root and never runs stylesheet rules against
it ("Root isn't visible and should always have default style"), so the root
carries no decorations at all. Top-level rows are the largest boxes a rule can
attach to.

Because each band is a separate layer, each restarts the pattern's phase at its
own origin. They stay in step only because the rhythm lock below makes every
branch a whole multiple of the pitch tall — that is what keeps the grid from
drifting between branches.

The last top-level row (`count(following-sibling::*) = 0`) gets a taller band so
the ruling carries on into the blank page below the outline.

Row and `row.text` decorations get exactly one layout each, so they cannot
repeat per wrapped line — but they do not need to here, because the pattern
tiles. Only *run* decorations repeat per line fragment
(`fragmentPlacement: 'all'`), and their layout box is the run's extent on that
line rather than the page width, so that route would emit a pile of overlapping
partial rules.

## Keeping text on the lines

The grid is uniform by construction. Getting the *text* to sit on it is the
harder half, because Bike's line height is per line — `(ascent + descent) ×
lineHeightMultiple` — so anything that changes a line's font metrics changes its
height and walks the text off the ruling. The modifier locks the rhythm:

- every line box is pinned to exactly one `pitch`, via a computed
  `lineHeightMultiple`;
- inter-row gaps are removed (`row.padding` top/bottom, text margin and padding),
  which overrides the Row Spacing setting;
- every row and run is pinned back to the base point size after Bike's own
  formatting has run, so headings keep their weight and notes their italics but
  nothing changes size.

## Knobs

All at the top of `style/main.ts`:

| Constant | What it does |
| --- | --- |
| `RULE_POSITION` | Where the hairline sits inside its line box, 0..1. **Turn this first** if text floats above or below the rules rather than sitting on them. |
| `MARGIN_RULE_FRACTION` | Where the red margin rule sits, as a fraction of one indent. |
| `OVERSCAN` | How far ruling continues past the last row, in viewport heights. |
| `TILE_WIDTH` | Pattern tile width. Cosmetic; only affects how often the tile seam recurs. |

## Known limits

- **Inline images and attachments** set their own line heights and will bump
  those lines off the grid. Prefer attachments in `"file"` chip mode.
- **Ruling belongs to the document, not the window.** It stops `OVERSCAN`
  viewports past the last row. Truly page-infinite ruling would need a pattern
  or image `fill` in the theme's material grammar — which is also the one
  addition that would make this expressible as a plain `.bktheme`.
- **Branch phase depends on the rhythm lock.** Anything that makes a branch a
  non-multiple of the pitch tall (an inline image, a future row type with its
  own spacing) shifts the ruling for every branch after it.
- **Sub/superscript** keep their baseline offset but lose their size change,
  because a larger run would make its line taller.
- Light mode only (`metadata.appearance: "light"`).
