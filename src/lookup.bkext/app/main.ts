import { AppExtensionContext, Window, DOMScriptHandle } from 'bike/app'
import { LookupProtocol } from '../dom/protocols'

export async function activate(context: AppExtensionContext) {
  bike.observeWindows(async (window: Window) => {
    const handle = await window.inspector.addItem<LookupProtocol>({
      label: 'Lookup',
      script: 'Lookup.js',
    })

    let pendingWord = ''
    let visible = false

    handle.onmessage = (message) => {
      switch (message.type) {
        case 'visible':
          visible = message.value
          if (visible && pendingWord) {
            fetchAndPost(handle, pendingWord)
          }
          break
        case 'changeWord':
          if (visible) {
            fetchAndPost(handle, message.word)
          } else {
            pendingWord = message.word
          }
          break
      }
    }

    window.observeCurrentOutlineEditor(async (editor) => {
      if (editor) {
        editor.observeSelection((selection) => {
          if (
            !selection ||
            selection.type != 'text' ||
            selection.word != selection.detail.text.string
          ) {
            pendingWord = ''
            if (visible) {
              handle.postMessage({ type: 'clear' })
            }
            return
          }
          if (visible) {
            fetchAndPost(handle, selection.word)
          } else {
            pendingWord = selection.word
          }
        }, 250)
      }
    })
  })
}

async function fetchAndPost(handle: DOMScriptHandle<LookupProtocol>, word: string) {
  try {
    let [dictionaryJSON, synonymsJSON] = await Promise.all([
      (await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)).json(),
      (await fetch(`https://api.datamuse.com/words?rel_syn=${word}`)).json(),
    ])

    const normalizedWord = dictionaryJSON[0]?.word || word
    const definitions =
      dictionaryJSON[0]?.meanings?.flatMap((meaning: { definitions: { definition: string }[] }) =>
        meaning.definitions.map((definition) => definition.definition),
      ) || []
    const synonyms = (synonymsJSON as { word: string }[]).map((item) => item.word)
    handle.postMessage({
      type: 'wordData',
      word: normalizedWord,
      definitions: definitions,
      synonyms: synonyms,
    })
  } catch (error) {
    console.error('Error fetching synonyms:', error)
  }
}
