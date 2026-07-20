import { DOMProtocol } from 'bike/core'

export interface CardData {
  id: number
  title: string
}

export interface ColumnData {
  id: number
  title: string
  cards: CardData[]
}

export interface KanbanData {
  columns: ColumnData[]
}

export interface KanbanProtocol extends DOMProtocol {
  toDOM: { type: 'update'; data: KanbanData }
  toApp:
    | { type: 'ready' }
    | { type: 'moveCard'; cardId: number; fromColumnId: number; fromIndex: number; toColumnId: number; toIndex: number }
    | { type: 'moveColumn'; columnId: number; fromIndex: number; toIndex: number }
}
