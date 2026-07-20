import { DOMExtensionContext } from 'bike/dom'
import { createRoot } from 'react-dom/client'
import { useState, useEffect, useCallback } from 'react'
import { Board } from '@caldwell619/react-kanban'
import '@caldwell619/react-kanban/dist/styles.css'
import { KanbanProtocol, KanbanData } from './protocols'

type Context = DOMExtensionContext<KanbanProtocol>

interface KCard {
  id: number
  title: string
  description: string
}

let dataListener: ((data: KanbanData) => void) | null = null
let pendingMoves = 0

export function activate(context: Context) {
  context.onmessage = (message) => {
    if (message.type === 'update') {
      if (pendingMoves > 0) {
        pendingMoves--
        return
      }
      if (dataListener) dataListener(message.data)
    }
  }

  let style = document.createElement('style')
  style.textContent = CSS
  document.head.appendChild(style)

  let root = createRoot(context.element)
  root.render(<Kanban context={context} />)

  context.postMessage({ type: 'ready' })
}

function Kanban({ context }: { context: Context }) {
  // Key forces Board to remount with new initialBoard when external changes arrive
  let [revision, setRevision] = useState(0)
  let [data, setData] = useState<KanbanData | null>(null)

  useEffect(() => {
    dataListener = (newData) => {
      setData(newData)
      setRevision((r) => r + 1)
    }
    return () => { dataListener = null }
  }, [])

  // Uncontrolled mode passes (board, subject, source, destination) at runtime,
  // but the types only declare 3 args. Use rest args to capture all four.
  let handleCardDragEnd = useCallback((...args: any[]) => {
    let [, card, source, destination] = args
    if (destination?.toColumnId == null || destination?.toPosition == null) return
    pendingMoves++
    context.postMessage({
      type: 'moveCard',
      cardId: card.id,
      fromColumnId: source.fromColumnId,
      fromIndex: source.fromPosition,
      toColumnId: destination.toColumnId,
      toIndex: destination.toPosition,
    })
  }, [context])

  let handleColumnDragEnd = useCallback((...args: any[]) => {
    let [, column, source, destination] = args
    if (destination?.toPosition == null) return
    pendingMoves++
    context.postMessage({
      type: 'moveColumn',
      columnId: column.id,
      fromIndex: source.fromPosition,
      toIndex: destination.toPosition,
    })
  }, [context])

  if (!data) return null

  let board = {
    columns: data.columns.map((col) => ({
      id: col.id,
      title: col.title,
      cards: col.cards.map((card) => ({
        id: card.id,
        title: card.title,
        description: '',
      })),
    })),
  }

  return (
    <Board
      key={revision}
      initialBoard={board}
      onCardDragEnd={handleCardDragEnd}
      onColumnDragEnd={handleColumnDragEnd}
      allowAddCard={false}
      allowAddColumn={false}
      allowRemoveColumn={false}
      allowRemoveCard={false}
      allowRenameColumn={false}
    />
  )
}

const CSS = `
  body {
    margin: 0;
    overflow: hidden;
    background: var(--background);
  }

  .react-kanban-board {
    padding: 16px;
    height: 100vh;
    overflow-x: auto;
  }

  .react-kanban-column {
    background: var(--secondary-background);
    border: 1px solid var(--separator);
    border-radius: 8px;
    padding: 0 12px 8px;
    margin: 0 6px;
    width: 260px;
    min-width: 260px;
  }

  .react-kanban-column-header {
    padding: 10px 0;
    font: -apple-system-headline;
    color: var(--label);
    border-bottom: 1px solid var(--separator);
    cursor: grab;
    word-wrap: break-word;
    overflow-wrap: break-word;
    white-space: normal;
  }

  .react-kanban-card-skeleton,
  .react-kanban-card-adder-form,
  .react-kanban-card {
    min-width: unset !important;
    max-width: unset !important;
    box-sizing: border-box;
  }

  /* Override inline-block on the card wrapper div */
  [data-testid^="card-"] > div {
    display: block !important;
  }

  .react-kanban-card {
    background: var(--text-background);
    border: 1px solid var(--separator);
    border-radius: 6px;
    padding: 8px 10px;
    margin: 6px 0;
    color: var(--label);
    cursor: grab;
    box-shadow: none;
    transition: border-color 0.15s;
  }

  .react-kanban-card:hover {
    border-color: var(--control-accent);
  }

  .react-kanban-card--dragging {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    border-color: var(--control-accent);
  }

  .react-kanban-card__title {
    border-bottom: none;
    padding-bottom: 0;
    font-weight: normal;
    font: -apple-system-body;
    color: var(--label);
    white-space: normal;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .react-kanban-card__description {
    display: none;
  }
`
