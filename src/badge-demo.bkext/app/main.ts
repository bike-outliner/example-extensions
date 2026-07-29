import { Image, MenuItem, SymbolConfiguration } from 'bike/app'

// Menu demo: one badge whose onClick presents a menu exercising the item
// vocabulary (the menu vocabulary in `bike/app`'s menu.d.ts — buttons and
// separators; menus are static native snapshots). Add a `task` attribute to
// any row and click the checklist badge.
//
// The badge itself is decoration only — `render` returns the glyph. The
// menu is built imperatively in `onClick` by reading the row, and its
// handler is per-presentation: buttons report through `onAction(id, ctx)`,
// or dispatch a command via the `command:<id>` id convention.
// Checkbox/radio semantics come from buttons with `state: 'on'`.

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
      // Buttons route to onAction — except `command:<id>` ids, which
      // dispatch the registered command with this row as its selection
      // (unregistered commands are hidden from the menu; see
      // `bike.commands.toString()`). To filter, use an onAction button
      // that sets `editor.filter`.
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
