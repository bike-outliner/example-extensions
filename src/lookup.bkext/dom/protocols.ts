// App/DOM messaging protocol. Typechecked in both contexts, so both sides
// import this single definition.

import { DOMProtocol } from 'bike/core'

export interface LookupProtocol extends DOMProtocol {
  toDOM:
    | { type: 'clear' }
    | { type: 'wordData'; word: string; definitions: string[]; synonyms: string[] }
  toApp:
    | { type: 'visible'; value: boolean }
    | { type: 'changeWord'; word: string }
}
