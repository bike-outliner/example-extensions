import { defineEditorStyleModifier } from 'bike/style'

// Draw a subtle accent rule to the left of a versioned branch root, so a
// versioned branch is identifiable even when its badge card is closed.
const modifier = defineEditorStyleModifier('versioning', 'Versioning')

modifier.layer('row-formatting', (row) => {
  row('.@versioned', (context, row) => {
    const colors = context.theme.colors
    const accent = colors.get('accent') ?? colors.text

    row.text.decoration('versioned-rule', (mark, layout) => {
      mark.anchor.x = 0
      mark.anchor.y = 0
      mark.x = layout.leading.offset(-6)
      mark.y = layout.top
      mark.height = layout.height.offset(row.text.margin.top + row.text.margin.bottom)
      mark.width = layout.fixed(2)
      mark.color = accent.alphaSet(0.5)
      mark.corners.radius = 1
      mark.zPosition = -2
    })
  })
})
