import { DOMExtensionContext } from 'bike/dom'

export async function activate(context: DOMExtensionContext) {
  context.element.textContent = 'Loading...'
  context.onmessage = (message) => {
    if (message.type === 'archiveCount') {
      context.element.textContent = String(message['count'])
    }
  }
}
