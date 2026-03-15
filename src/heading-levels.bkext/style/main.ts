import { Color, defineEditorStyleModifier } from 'bike/style'

let modifier = defineEditorStyleModifier('headinglevels', 'Heading Levels')

modifier.layer('row-formatting', (row) => {
  for (let level = 1; level <= 6; level++) {
    row(`.heading level() = ${level}`, (context, row) => {
      row.text.color = context.theme.colors.get(`heading${level}`)
    })
  }
})
