// Define the messaging protocol between app and DOM contexts here.
// This file is typechecked in both contexts, so app/main.ts and DOM
// scripts can import from it to share a single protocol definition.

import { DOMProtocol } from 'bike/core'

export interface PanelDemoProtocol extends DOMProtocol {
  toDOM: { type: 'role'; role: string }
}
