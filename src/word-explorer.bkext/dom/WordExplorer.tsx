import { DOMExtensionContext } from 'bike/dom'
import { createRoot } from 'react-dom/client'
import { useState, useEffect } from 'react'

type DOMToAppMessage =
  | { type: 'visible'; value: boolean }
  | { type: 'changeWord'; word: string }

type AppToDOMMessage =
  | { type: 'clear' }
  | { type: 'wordData'; word: string; definitions: string[]; synonyms: string[] }

export async function activate(context: DOMExtensionContext<DOMToAppMessage, AppToDOMMessage>) {
  const container = context.element
  const root = createRoot(container)
  root.render(<WordExplorer context={context} />)
}

type WordExplorerProps = {
  context: DOMExtensionContext<DOMToAppMessage, AppToDOMMessage>
}

const WordExplorer: React.FC<WordExplorerProps> = ({ context }) => {
  const [currentWord, setCurrentWord] = useState('')
  const [currentDefinitions, setCurrentDefinitions] = useState([] as string[])
  const [currentSynonyms, setCurrentSynonyms] = useState([] as string[])

  useEffect(() => {
    context.onmessage = (message: AppToDOMMessage) => {
      switch (message.type) {
        case 'clear':
          setCurrentWord('')
          setCurrentDefinitions([])
          setCurrentSynonyms([])
          break
        case 'wordData':
          setCurrentWord(message.word)
          setCurrentDefinitions(message.definitions)
          setCurrentSynonyms(message.synonyms)
          break
      }
    }

    const observer = new IntersectionObserver(([entry]) => {
      context.postMessage({ type: 'visible', value: entry.isIntersecting })
    })
    
    observer.observe(context.element)

    return () => {
      observer.disconnect()
      context.onmessage = undefined
      context.postMessage({ type: 'visible', value: false })
    }
  }, [])

  const changeWord = (word: string) => {
    context.postMessage({ type: 'changeWord', word })
  }

  if (!currentWord) {
    return (
      <div style={{ padding: '1em', color: 'var(--label)' }}>
        <p>Fully select a word to explore its definitions and synonyms.</p>
      </div>
    )
  }

  return (
    <div>
      <h1>{currentWord}</h1>
      <div>
        <h2>Definition:</h2>
        <p>{currentDefinitions[0] || ''}</p>
        <h2>Synonyms:</h2>
        <ul
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            listStyle: 'none',
            padding: 0,
            margin: 0,
            gap: '0.25em',
          }}
        >
          {currentSynonyms.map((syn) => (
            <li key={syn}>
              <button onClick={() => changeWord(syn)}>{syn}</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
