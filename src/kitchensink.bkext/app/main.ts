import { AppExtensionContext, Row, RowType, CommandContext, PanelHandle } from 'bike/app'
import { PanelDemoProtocol } from '../dom/protocols'

export async function activate(context: AppExtensionContext) {
  bike.observeWindows(async (window) => {
    await window.inspector.addItem({
      label: 'Details',
      script: 'inspector-details.js',
    })
    await window.inspector.addItem({
      label: 'Options',
      script: 'inspector-options.js',
    })
  })

  bike.commands.addCommands({
    commands: {
      'kitchensink:set-row-type': setRowTypeCommand,
      'kitchensink:insert-color-api-demo': insertColorApiDemoCommand,
      'kitchensink:status-message-demo': statusMessageDemoCommand,
      'kitchensink:components-demo': componentsDemoCommand,
      'kitchensink:panel-inspector': panelInspectorCommand,
      'kitchensink:panel-utility': panelUtilityCommand,
      'kitchensink:panel-window': panelWindowCommand,
    },
  })
}

async function setRowTypeCommand(context: CommandContext): Promise<boolean> {
  let editor = context.editor
  if (!editor) return false

  // Define available row types with SF Symbols
  const rowTypes: { name: string; symbol: string; type: RowType }[] = [
    { name: 'Body', symbol: 'text.alignleft', type: 'body' },
    { name: 'Heading', symbol: 'textformat.size', type: 'heading' },
    { name: 'Ordered List', symbol: 'list.number', type: 'ordered' },
    { name: 'Unordered List', symbol: 'list.bullet', type: 'unordered' },
    { name: 'Task', symbol: 'square', type: 'task' },
    { name: 'Note', symbol: 'note.text', type: 'note' },
    { name: 'Blockquote', symbol: 'text.quote', type: 'quote' },
    { name: 'Code Block', symbol: 'chevron.left.forwardslash.chevron.right', type: 'code' },
  ]

  // Show choice box to select a row type
  const indices = await bike.showChoiceBox(
    rowTypes.map((t) => ({ name: t.name, symbol: t.symbol })),
    {
      placeholder: 'Set Row Type…',
      allowsEmptySelection: false,
      allowsMultipleSelection: false,
    },
  )

  if (indices === null || indices.length === 0) {
    return false
  }

  // Apply the selected type to all selected rows
  const selectedType = rowTypes[indices[0]].type
  const selectedRows = editor.selection?.rows ?? []

  editor.outline.transaction({ animate: 'default' }, () => {
    for (const row of selectedRows) {
      row.type = selectedType
    }
  })

  return true
}

function statusMessageDemoCommand(context: CommandContext): boolean {
  let editor = context.editor
  if (!editor) return false

  // Show a persistent message, then replace it after 2 seconds
  let handle = editor.showStatusMessage('Processing items…')

  setTimeout(() => {
    // Dispose the old message and show a temporary one
    handle.dispose()
    editor!.showStatusMessage('Done — 42 items processed', 3000)
  }, 2000)

  return true
}

function componentsDemoCommand(context: CommandContext): boolean {
  bike.frontmostWindow?.presentSheet('components-demo.js')
  return true
}

async function showPanelWithRole(role: 'inspector' | 'utility' | 'window'): Promise<boolean> {
  let handle: PanelHandle<PanelDemoProtocol> = await bike.showPanel<PanelDemoProtocol>({
    script: 'panel-demo.js',
    title: `Panel (${role})`,
    role,
    width: 580,
    height: 400,
    id: `panel-demo-${role}`,
  }, bike.frontmostWindow)
  handle.postMessage({ type: 'role', role })
  return true
}

function panelInspectorCommand(): boolean {
  showPanelWithRole('inspector')
  return true
}

function panelUtilityCommand(): boolean {
  showPanelWithRole('utility')
  return true
}

function panelWindowCommand(): boolean {
  showPanelWithRole('window')
  return true
}

function insertColorApiDemoCommand(context: CommandContext): boolean {
  let editor = context.editor
  if (!editor) return false

  let outline = editor.outline

  // Define demo rows showcasing the new color API
  const demoRows = [
    {
      text: 'Color API Demo',
      type: 'heading' as RowType,
    },
    {
      text: 'HSL Color (coral background)',
      attributes: { tags: 'coral' },
    },
    {
      text: 'OKLch Color (perceptual blue)',
      attributes: { tags: 'perceptual' },
    },
    {
      text: 'OKLab Color (muted purple)',
      attributes: { tags: 'lab' },
    },
    {
      text: 'Color Mixing in OKLch (red + blue)',
      attributes: { tags: 'mixed' },
    },
    {
      text: 'Auto Contrast Selection (WCAG AA)',
      attributes: { tags: 'contrast' },
    },
    {
      text: 'HSL Mixing (yellow + cyan → green)',
      attributes: { tags: 'hslmix' },
    },
  ]

  outline.transaction({ animate: 'default' }, () => {
    // Insert at selection or end of document
    let insertLocation = editor.selection?.rows[0] ?? outline.root
    outline.insertRows(demoRows, insertLocation)
  })

  return true
}
