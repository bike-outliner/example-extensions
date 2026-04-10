import { 
  defineEditorStyleModifier, 
  FontWeight 
} from 'bike/style'

const modifier = defineEditorStyleModifier('headinglevels', 'Heading Levels')

// Use different font sizes and weights for up to six levels of heading
// We'll use a numeric factor to modify font size for different levels of header
// As font weights are a type (FontWeight) in Bike, let's create a type to avoid casting later
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
  // Register one styling rule per heading level
  // Each rule matches rows whose outline heading level is H1, H2, and so on
  for (const [index, style] of headingStyles.entries()) {
    const level = index + 1
    const [scale, weight] = style

    row(`.heading level() = ${level}`, (context, row) => {
      // Get the row's current font size
      const pointSize = row.text.font.resolve(context).pointSize

      // Apply the heading style: scale the base size for hierarchy, then set the desired font weight
      row.text.font = row.text.font
        .withPointSize(pointSize * scale)
        .withWeight(weight)

      // Use a heading-specific theme color when one exists,
      // otherwise fall back to the default text color
      row.text.color =
        context.theme.colors.get(`heading${level}`) ??
        context.theme.colors.text
    })
  }
})
