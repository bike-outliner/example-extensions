import { Image, MenuItem, SymbolConfiguration } from 'bike/app'

// Menu demo: add a `task` attribute to any row and click the checklist badge.
// Menus (see `bike/app` menu.d.ts) are static native snapshots of buttons and
// separators. `render` returns only the glyph; the menu is built in `onClick`
// from the row. Buttons report through `onAction(id, ctx)` or dispatch a
// command via a `command:<id>` id. Checkbox/radio state comes from `state: 'on'`.

bike.badge('task', {
  where: '.@task',
  inputs: { task: '@task' },
  render: (values, env) =>
    Image.fromSymbol(
      new SymbolConfiguration('checklist').withHierarchicalColor(env.color.alphaSet(0.6)).withFont(env.font)
    ),
  onClick: ({ editor, row }) => {
    const attr = (name: string) => row.getAttribute(name) ?? undefined
    const items: MenuItem[] = [
      // Radio group: checked buttons, exclusivity handled in onAction.
      ...['todo', 'doing', 'done'].map(
        (status): MenuItem => ({
          type: 'button',
          id: `status:${status}`,
          title: status[0].toUpperCase() + status.slice(1),
          state: attr('status') === status ? 'on' : 'off',
        })
      ),
      { type: 'separator' },
      // `command:<id>` ids dispatch that command with this row selected
      // (unregistered commands are hidden; see `bike.commands.toString()`).
      // To filter, use an onAction button that sets `editor.filter`.
      { type: 'button', id: 'command:edit:copy-row-link', title: 'Copy Row Link' },
      { type: 'button', id: 'clear', title: 'Clear Task' },
    ]

    editor.showMenu({ row, anchor: 'task' }, {
      items,
      onAction: (id) => {
        if (id.startsWith('status:')) {
          const status = id.slice('status:'.length)
          row.outline.transaction({ label: 'Edit Task' }, () => {
            row.setAttribute('status', status)
          })
          return
        }
        if (id !== 'clear') return
        row.outline.transaction({ label: 'Clear Task' }, () => {
          for (const name of ['task', 'status', 'due', 'estimate', 'color', 'flagged']) {
            row.removeAttribute(name)
          }
        })
      },
    })
  },
})
