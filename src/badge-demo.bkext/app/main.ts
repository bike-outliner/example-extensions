import { Image, MenuItem, SymbolConfiguration } from 'bike/app'

// Menu demo: one badge whose onClick presents a menu exercising every item
// type (the menu vocabulary in `bike/app`'s menu.d.ts). Add a `task`
// attribute to any row and click the checklist badge.
//
// The badge itself is decoration only — `render` returns the glyph. The
// menu is built imperatively in `onClick` by reading the row, and its
// handlers are per-presentation: all valued types (toggle, calendar,
// palette, choice, field, duration) commit through the single
// `onChange(id, value, ctx)` with TYPED values — the item id is the
// attribute name, so the handler is one line. Buttons route through
// `onAction` (or dispatch a command via the `command:<id>` id convention).

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
      // Checkbox: commits a BOOLEAN and closes the menu.
      { type: 'toggle', id: 'flagged', title: 'Flagged', value: attr('flagged') === 'true' },
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
      // Choice group: exclusive checkmark rows, choose = commit + dismiss.
      {
        type: 'choice',
        id: 'status',
        options: [
          { value: 'todo', title: 'Todo' },
          { value: 'doing', title: 'Doing' },
          { value: 'done', title: 'Done' },
        ],
        value: attr('status'),
      },
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
      { type: 'button', id: 'clear', title: 'Clear Task', destructive: true },
    ]

    editor.showMenu(row, {
      items,
      // Anchor at this badge's glyph (falls back to the row's text line).
      anchor: 'task',
      onAction: (id, { row }) => {
        if (id !== 'clear') return
        row.outline.transaction({ label: 'Clear Task' }, () => {
          for (const name of ['task', 'status', 'due', 'estimate', 'color', 'flagged']) {
            row.removeAttribute(name)
          }
        })
      },
      onChange: (id, value, { row }) => {
        // Values are TYPED (string/number/boolean); attributes store strings.
        row.outline.transaction({ label: 'Edit Task' }, () => {
          row.setAttribute(id, String(value))
        })
      },
    })
  },
})
