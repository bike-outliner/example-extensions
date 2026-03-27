import { Color, defineEditorStyleModifier } from 'bike/style'

let modifier = defineEditorStyleModifier('headinglevels', 'Heading Levels')
let size = [1.6, 1.4, 1.2, 1.1, 1, 0.9]

modifier.layer('row-formatting', (row) => {
  for (let level = 1; level <= 6; level++) {
    row(`.heading level() = ${level}`, (context, row) => {
      row.text.color = context.theme.colors.get(`heading${level}`) ?? context.theme.colors.text
      row.text.scale = size[level - 1]
    })
  }
})
