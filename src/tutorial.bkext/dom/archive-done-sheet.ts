import { DOMExtensionContext } from 'bike/dom'
import { ArchiveDoneProtocol } from './protocols'

export async function activate(context: DOMExtensionContext<ArchiveDoneProtocol>) {
  context.element.textContent = 'Loading...'
  context.onmessage = (message) => {
    if (message.type === 'archiveCount') {
      context.element.textContent = String(message.count)
    }
  }
}
