import { 
  defineEditorStyleModifier, 
  FontWeight 
} from 'bike/style'

const modifier = defineEditorStyleModifier('headinglevels', 'Heading Levels')

// Font size factor and weight for up to six heading levels.
// Typing the weight as FontWeight avoids casting later.
type HeadingStyle = readonly [scaleFactor: number, fontWeight: FontWeight]

const headingStyles: HeadingStyle[] = [
  [ 1.4, "heavy" ],
  [ 1.3, "bold" ],
  [ 1.2, "semibold" ],
  [ 1.1, "semibold" ],
  [ 1.0, "semibold" ],
  [ 1.0, "medium" ],
]

modifier.layer('row-formatting', (row) => {
  // One rule per heading level
  for (const [index, style] of headingStyles.entries()) {
    const level = index + 1
    const [scale, weight] = style

    row(`.heading level() = ${level}`, (context, row) => {
      const pointSize = row.text.font.resolve(context).pointSize

      row.text.font = row.text.font
        .withPointSize(pointSize * scale)
        .withWeight(weight)

      // Theme's heading color if defined, else the text color
      row.text.color =
        context.theme.colors.get(`heading${level}`) ??
        context.theme.colors.text
    })
  }
})
