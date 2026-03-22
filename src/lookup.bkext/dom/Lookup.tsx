import { DOMExtensionContext } from 'bike/dom'
import { Disclosure, Label } from 'bike/components'
import { createRoot } from 'react-dom/client'
import { useState, useEffect } from 'react'
import { LookupProtocol } from './protocols'

export async function activate(context: DOMExtensionContext<LookupProtocol>) {
  const container = context.element
  const root = createRoot(container)
  root.render(<Lookup context={context} />)
}

type LookupProps = {
  context: DOMExtensionContext<LookupProtocol>
}

const Lookup: React.FC<LookupProps> = ({ context }) => {
  const [currentWord, setCurrentWord] = useState('')
  const [currentDefinitions, setCurrentDefinitions] = useState([] as string[])
  const [currentSynonyms, setCurrentSynonyms] = useState([] as string[])

  useEffect(() => {
    context.onmessage = (message) => {
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

  return (
    <Disclosure label="Look Up" accessory={currentWord ? <Label>&ldquo;{currentWord}&rdquo;</Label> : undefined} defaultExpanded>
      {currentWord ? (
        <div>
          <div style={{ WebkitUserSelect: 'text', userSelect: 'text' }}><i style={{ fontStyle: 'italic' }}>def.</i> {currentDefinitions[0] || 'No definition found.'}</div>
          {currentSynonyms.length > 0 && (
            <>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.25em',
                  marginTop: '0.5em',
                }}
              >
                <span><i style={{ fontStyle: 'italic' }}>syn.</i></span>
                {currentSynonyms.map((syn, i) => (
                  <span key={syn}>
                    <span
                      role="button"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                      onClick={() => changeWord(syn)}
                    >{syn}</span>
                    {i < currentSynonyms.length - 1 && ','}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}
    </Disclosure>
  )
}
