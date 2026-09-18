import {
  Color,
  Font,
  Image,
  Insets,
  Path,
  Rect,
  Shape,
  StyleContext,
  defineEditorStyleModifier,
} from 'bike/style'

const modifier = defineEditorStyleModifier('lined-paper', 'Lined Paper')

/**
 * Tile width. A pattern repeats on both axes, so this only sets how often the
 * horizontal seam recurs — the rule spans the tile edge to edge, so the line
 * reads as continuous at any width.
 */
const TILE_WIDTH = 512

/**
 * Where the hairline sits inside its tile, 0..1. This is the knob that decides
 * whether text sits on the rules or floats above them: it slides the rule
 * within the line box without moving the grid off the row boxes.
 */
const RULE_POSITION = 0

/** Margin rule position, as a fraction of one indent left of the text column. */
const MARGIN_RULE_FRACTION = 0.45

/** How far ruling continues past the last row, in viewport heights. */
const OVERSCAN = 1

interface Paper {
  /** Height of one line box, and so the pitch of the rule grid. */
  pitch: number
  hairline: number
  /** Point size every row and run is pinned to, so every line box is `pitch`. */
  pointSize: number
  /** Multiple that turns a font's natural height into exactly `pitch`. */
  lineHeightMultiple: number
  rule: Color
  margin: Color
  /** Viewport side padding, so a band can widen from the text column to the sheet. */
  padLeft: number
  padRight: number
}

/**
 * Paper metrics, derived once per editor state from the *base* font.
 *
 * Seeded from the viewport rule, which runs before any row rule and whose font
 * is the settings font after Bike's font-scaling tiers. Row rules then read the
 * same numbers, so a heading can't derive a different grid.
 */
function paper(context: StyleContext, baseFont: Font, padding?: Insets): Paper {
  const cached = context.userCache.get('linedPaper') as Paper | undefined
  if (cached) {
    return cached
  }

  const fa = baseFont.resolve(context)
  const naturalHeight = fa.ascender - fa.descender

  // Round the pitch to a whole point. A fractional pitch accumulates rounding
  // error down the page and the text drifts off the rules.
  const pitch = Math.max(2, Math.round(naturalHeight * context.settings.lineHeightMultiple))
  const colors = context.theme.colors

  const result: Paper = {
    pitch,
    hairline: Math.max(1 * fa.uiScale, 0.5),
    pointSize: fa.pointSize,
    lineHeightMultiple: naturalHeight > 0 ? pitch / naturalHeight : 1,
    rule: colors.get('paperRule') ?? colors.guideLine,
    margin: colors.get('paperMargin') ?? colors.guideLine,
    padLeft: padding?.left ?? 0,
    padRight: padding?.right ?? 0,
  }

  context.userCache.set('linedPaper', result)
  return result
}

/** One cell of the ruling: transparent, `pitch` tall, a hairline across it. */
function ruleTile(p: Paper): Image {
  const shape = new Shape(Path.rect(new Rect(0, 0, TILE_WIDTH, p.hairline)))
  shape.fill.color = p.rule
  shape.line.width = 0
  // Image.fromShape sizes the image to the path's drawn bounds, so the tile's
  // full height comes from padding — split above and below the hairline to
  // place the rule within the line box.
  const slack = Math.max(0, p.pitch - p.hairline)
  const above = Math.round(slack * RULE_POSITION)
  shape.padding = new Insets(above, 0, slack - above, 0)
  return Image.fromShape(shape)
}

/**
 * Paints the ruling over one top-level row's box.
 *
 * The grid cannot live on the root row: `EditorStyle.prepareStyledRow` returns
 * a hardcoded default style for the root and never runs stylesheet rules
 * against it, so the root carries no decorations. Top-level rows are the
 * largest boxes a rule can attach to. Their phases stay in step because the
 * rhythm lock below makes every branch a whole multiple of `pitch` tall.
 */
function ruleBand(row: any, p: Paper, tailHeight: number) {
  const tile = ruleTile(p)

  row.decoration('paperRules', (rules: any, layout: any) => {
    rules.color = Color.pattern(tile)
    rules.zPosition = -100
    rules.transitions.clear()
    // Widen from the text column out to the sheet edges.
    rules.anchor.x = 0
    rules.x = layout.leading.offset(-p.padLeft)
    rules.width = layout.width.offset(p.padLeft + p.padRight)
    if (tailHeight > 0) {
      rules.anchor.y = 0
      rules.y = layout.top
      rules.height = layout.height.offset(tailHeight)
    }
  })

  row.decoration('paperMargin', (margin: any, layout: any) => {
    margin.color = p.margin
    margin.zPosition = -99
    margin.transitions.clear()
    margin.anchor.x = 0
    margin.x = layout.leading.offset(-row.padding.left * MARGIN_RULE_FRACTION)
    margin.width = layout.fixed(p.hairline)
    if (tailHeight > 0) {
      margin.anchor.y = 0
      margin.y = layout.top
      margin.height = layout.height.offset(tailHeight)
    }
  })
}

modifier.layer('base', (row, run, caret, viewport) => {
  viewport((context, viewport) => {
    const p = paper(context, viewport.font, viewport.padding)
    // Start the text column on the grid, and reclaim most of the half-viewport
    // of blank page Bike leaves at the bottom.
    viewport.padding.top = Math.round(viewport.padding.top / p.pitch) * p.pitch
    viewport.padding.bottom = Math.max(p.pitch * 4, viewport.padding.bottom * 0.2)
  })

  row(`.*`, (context, row) => {
    const p = paper(context, row.text.font)

    // Rows have to butt together or the grid and the text fall out of step —
    // and the per-branch pattern phases stop lining up.
    row.padding.top = 0
    row.padding.bottom = 0
    row.text.margin.top = 0
    row.text.margin.bottom = 0
    row.text.padding.top = 0
    row.text.padding.bottom = 0
    row.text.lineHeightMultiple = p.lineHeightMultiple
  })

  // Every visible top-level row rules its own branch...
  row(`.focused-level() = 0`, (context, row) => {
    ruleBand(row, paper(context, row.text.font), 0)
  })

  // ...and the last one carries the ruling on into the blank page below.
  row(`.focused-level() = 0 and count(following-sibling::*) = 0`, (context, row) => {
    ruleBand(row, paper(context, row.text.font), context.viewportSize.height * OVERSCAN)
  })
})

// Pin every row back to the base point size. Bike's row formatting has already
// run by this layer, so headings keep their weight and notes their italics —
// but a taller line box anywhere would break the grid.
modifier.layer('row-formatting', (row) => {
  row(`.*`, (context, row) => {
    const p = paper(context, row.text.font)
    row.text.font = row.text.font.withPointSize(p.pointSize)
    row.text.lineHeightMultiple = p.lineHeightMultiple
  })
})

// Same for inline runs: code and sub/sup would otherwise change a line's
// metrics and lift that one line off the ruling.
modifier.layer('run-formatting', (row, run) => {
  run(`.*`, (context, text) => {
    const p = paper(context, text.font)
    text.font = text.font.withPointSize(p.pointSize)
  })
})
