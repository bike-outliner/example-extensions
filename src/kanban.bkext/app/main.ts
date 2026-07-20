import { AppExtensionContext, CommandContext, Row } from 'bike/app'
import { KanbanProtocol, KanbanData } from '../dom/protocols'

export async function activate(context: AppExtensionContext) {
  bike.commands.addCommands({
    commands: {
      'kanban:show': showKanban,
    },
  })
}

async function showKanban(context: CommandContext): Promise<boolean> {
  let window = bike.frontmostWindow
  let editor = window?.currentOutlineEditor
  if (!window || !editor) return false

  let outline = editor.outline
  const v = bike.mainScreen.visibleFrame
  const width = 800
  const height = 500
  let handle = await bike.showPanel<KanbanProtocol>({
    script: 'kanban.js',
    title: 'Kanban',
    role: 'window',
    frame: { x: v.x + (v.width - width) / 2, y: v.y + (v.height - height) / 2, width, height },
    id: 'kanban',
  }, window)

  let focus = editor.focus
  let changeDisposable: { dispose(): void } | null = null

  handle.onmessage = (message) => {
    if (message.type === 'bike:dismissed') {
      changeDisposable?.dispose()
      return
    }

    if (message.type === 'ready') {
      handle.postMessage({ type: 'update', data: buildKanbanData(focus) })
      changeDisposable = outline.observeChanges((change) => {
        if (change.type === 'endTransaction') {
          handle.postMessage({ type: 'update', data: buildKanbanData(focus) })
        }
      })
    } else if (message.type === 'moveCard') {
      let card = outline.getRowById(message.cardId)
      let column = outline.getRowById(message.toColumnId)
      if (card && column) {
        // The library reports toIndex in the list after removing the card.
        // When moving forward in the same column, offset by +1 to get the
        // correct position in the original children array.
        let index = message.toIndex
        let sameColumn = message.fromColumnId === message.toColumnId
        if (sameColumn && index > message.fromIndex) {
          index++
        }
        let before = column.children[index]
        outline.transaction({ label: 'Kanban Move', animate: 'default' }, () => {
          outline.moveRows([card], column, before)
        })
      }
    } else if (message.type === 'moveColumn') {
      let column = outline.getRowById(message.columnId)
      if (column) {
        let index = message.toIndex
        if (index > message.fromIndex) {
          index++
        }
        let before = focus.children[index]
        outline.transaction({ label: 'Kanban Move', animate: 'default' }, () => {
          outline.moveRows([column], focus, before)
        })
      }
    }
  }

  return true
}

function buildKanbanData(focus: Row): KanbanData {
  return {
    columns: focus.children.map((column) => ({
      id: column.id,
      title: column.text.string || 'Untitled',
      cards: column.children.map((card) => ({
        id: card.id,
        title: card.text.string || 'Untitled',
      })),
    })),
  }
}
