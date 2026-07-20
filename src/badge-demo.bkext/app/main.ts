import { Image, MenuItem, SymbolConfiguration } from 'bike/app'

// Menu demo: one badge whose onClick presents a menu exercising every item
// type (the menu vocabulary in `bike/app`'s menu.d.ts). Add a `task`
// attribute to any row and click the checklist badge.
//
// The badge itself is decoration only — `render` returns the glyph. The
// menu is built imperatively in `onClick` by reading the row, and its
// handler is per-presentation: everything reports through the single
// `onAction(id, value, ctx)` — buttons with an undefined value (or
// dispatching a command via the `command:<id>` id convention), valued
// items (calendar, palette) with their committed value. Checkbox/radio
// semantics come from buttons with `state: 'on'`.

bike.badge('task', {
  where: '.@task',
  render: (values, env) =>
    Image.fromSymbol(
      new SymbolConfiguration('checklist').withHierarchicalColor(env.color.alphaSet(0.6)).withFont(env.font)
    ),
  onClick: ({ editor, row }) => {
    const attr = (name: string) => row.getAttribute(name) ?? undefined
    const items: MenuItem[] = [
      /*
      // Checkbox: a button with state — flip the attribute in onAction.
      { type: 'button', id: 'flagged', title: 'Flagged', state: attr('flagged') === 'true' ? 'on' : 'off' },
      // Inline month calendar: picking a day commits ISO `YYYY-MM-DD` and
      // closes the menu.
      { type: 'calendar', id: 'due', label: 'Due', value: attr('due') },
      // Duration picker: digit fields, commits whole seconds as a NUMBER;
      // menu stays open.
      { type: 'duration', id: 'estimate', label: 'Estimate', value: Number(attr('estimate')) || 0 },
      // Palette: tinted-symbol strip (this is where color swatches map);
      // choosing commits the option's value and closes the menu.
      {
        type: 'palette',
        id: 'color',
        title: 'Color',
        options: ['#e5484d', '#f5a623', '#46a758', '#0091ff', '#8e4ec6'].map((c) => ({
          value: c,
          title: c,
          color: c,
        })),
        value: attr('color'),
      },
      { type: 'separator' },
      // Radio group: checked buttons, exclusivity handled in onAction.
      ...['todo', 'doing', 'done'].map((status) => ({
        type: 'button',
        id: `status:${status}`,
        title: status[0].toUpperCase() + status.slice(1),
        state: attr('status') === status ? 'on' : 'off',
      })),
      { type: 'separator' },
      // Free-text field: commits on Return / end of editing / menu close.
      { type: 'field', id: 'task', label: 'Task', value: attr('task') ?? '', placeholder: 'name' },
      { type: 'separator' },
      */
      // Buttons route to onAction — except `command:<id>` ids, which
      // dispatch the registered command with this row as its selection
      // (unregistered commands are hidden from the menu; see
      // `bike.commands.toString()`). To filter, use an onAction button
      // that sets `editor.filter`.
      { type: 'button', id: 'command:edit:copy-row-link', title: 'Copy Row Link' },
      { type: 'button', id: 'clear', title: 'Clear Task' },
    ]

    editor.showMenu(row, {
      items: () => items,
      // Anchor at this badge's glyph (falls back to the row's text line).
      anchor: 'task',
      onAction: (id, value, { row }) => {
        // One merged handler: buttons arrive with an undefined value, valued
        // items (calendar/palette) with their committed value — the item id
        // is the attribute name, so the valued branch is one line.
        if (value !== undefined) {
          row.outline.transaction({ label: 'Edit Task' }, () => {
            row.setAttribute(id, String(value))
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
