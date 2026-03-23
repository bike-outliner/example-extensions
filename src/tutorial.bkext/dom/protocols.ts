import { DOMProtocol } from 'bike/core'

export interface ArchiveDoneProtocol extends DOMProtocol {
  toDOM: { type: 'archiveCount'; count: number }
}
