import { Image, SymbolConfiguration } from 'bike/app'

// Badge card demo: one value-aware badge exercising every card item kind.
// Add a `task` attribute to any row and click the checklist badge.
//
// All valued kinds (toggle, date, color, radio, field) commit through the
// single `onChange(id, value, ctx)` — the item id is the attribute name, so
// the handler is one line. Triggered kinds route through `onAction`.

bike.badge('task', {
  where: '.@task',
  inputs: {
    task: '@task',
    flagged: '@flagged',
    due: '@due',
    estimate: '@estimate',
    color: '@color',
    status: '@status',
  },
  render: (values, env) => ({
    image: Image.fromSymbol(
      new SymbolConfiguration('checklist').withHierarchicalColor(env.color.alphaSet(0.6)).withFont(env.font)
    ),
    items: [
      { kind: 'header', title: 'Task' },
      // Checkbox: flips in place, card stays open.
      { kind: 'toggle', id: 'flagged', title: 'Flagged', value: values['flagged'] === 'true' },
      // Date picker: commits ISO per change. Default is the compact text
      // field with a calendar popover; `display: 'calendar'` shows the
      // inline graphical month view instead.
      { kind: 'date', id: 'due', label: 'Due', value: values['due'] },
      // Duration picker: hr/min/sec digit fields, commits whole seconds.
      { kind: 'duration', id: 'estimate', label: 'Estimate', value: values['estimate'] },
      // Swatch strip (choose = commit + dismiss) + custom color well.
      {
        kind: 'color',
        id: 'color',
        label: 'Color',
        swatches: ['#e5484d', '#f5a623', '#46a758', '#0091ff', '#8e4ec6'],
        value: values['color'],
      },
      { kind: 'separator' },
      // Radio group: exclusive choice, choose = commit + dismiss.
      {
        kind: 'radio',
        id: 'status',
        options: [
          { value: 'todo', label: 'Todo' },
          { value: 'doing', label: 'Doing' },
          { value: 'done', label: 'Done' },
        ],
        value: values['status'],
      },
      { kind: 'separator' },
      // Free-text field: commits on end of editing / Return.
      { kind: 'field', id: 'task', label: 'Task', value: values['task'] ?? '', placeholder: 'name' },
      { kind: 'separator' },
      // Action item → onAction; command item dispatches the registered
      // command with this row as its selection.
      { kind: 'action', id: 'clear', title: 'Clear Task', destructive: true },
      // Command items must name a REGISTERED command (see
      // `bike.commands.toString()`) — unregistered ones are hidden from the
      // card. The clicked row becomes the command's selection.
      { kind: 'command', command: 'edit:copy-row-link' },
    ],
  }),
  onAction: (id, { row }) => {
    if (id !== 'clear') return
    row.outline.transaction({ label: 'Clear Task' }, () => {
      for (const name of ['task', 'status', 'due', 'estimate', 'color', 'flagged']) {
        row.removeAttribute(name)
      }
    })
  },
  onChange: (id, value, { row }) => {
    row.outline.transaction({ label: 'Edit Task' }, () => {
      row.setAttribute(id, value)
    })
  },
})
