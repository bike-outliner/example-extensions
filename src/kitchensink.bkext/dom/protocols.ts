// App/DOM messaging protocol. Typechecked in both contexts, so both sides
// import this single definition.

import { DOMProtocol } from 'bike/core'

export interface PanelDemoProtocol extends DOMProtocol {
  toDOM: { type: 'role'; role: string }
}

export interface ResourceDemoProtocol extends DOMProtocol {
}

export interface SessionDropDemoProtocol extends DOMProtocol {
}
