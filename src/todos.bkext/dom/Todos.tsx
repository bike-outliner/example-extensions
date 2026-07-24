import { DOMExtensionContext } from 'bike/dom'
import { Disclosure, Label, SFSymbol } from 'bike/components'
import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'

export async function activate(context: DOMExtensionContext) {
  createRoot(context.element).render(<Todos />)
}

type Todo = {
  id: SessionId
  text: string
}

// Collapsed, the list shows PAGE_SIZE items. The query asks for one more than that so a full
// page tells us there are more to show without observing the whole (possibly huge) result set.
const PAGE_SIZE = 10

function collectTodos(snapshot: SessionOutline | null): Todo[] {
  return (
    snapshot?.root.children?.map((row) => ({
      id: row.id,
      text: row.text.map((run) => run.string).join(''),
    })) ?? []
  )
}

const Todos: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([])
  const [checkedIds, setCheckedIds] = useState<Set<SessionId>>(new Set())
  const [closed, setClosed] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let sub: SessionSubscription | undefined
    let canceled = false
    bike.session
      .observeOutlineQuery(
        // `[1:n]` is a step slice: 1-based, inclusive at both ends.
        { path: showAll ? '//task not @done' : `//task not @done[1:${PAGE_SIZE + 1}]`, shape: 'flat' },
        (snapshot) => {
          const next = collectTodos(snapshot)
          setTodos(next)
          setCheckedIds((prev) => {
            const ids = new Set(next.map((t) => t.id))
            return new Set([...prev].filter((id) => ids.has(id)))
          })
        },
        { onClose: () => setClosed(true) },
      )
      .then((s) => {
        if (canceled) {
          s.dispose()
        } else {
          sub = s
        }
      })
    return () => {
      canceled = true
      sub?.dispose()
    }
  }, [showAll])

  const checkOff = (todo: Todo) => {
    setCheckedIds((prev) => new Set(prev).add(todo.id))
    bike.session.evaluateCommands({ ids: ['row:toggle-done'], rows: [todo.id] })
  }

  // `activate` matters here: clicking in the inspector made its webview first
  // responder, so a bare `select` would leave the caret in an editor that isn't
  // taking keystrokes.
  const goToTodo = (todo: Todo) => {
    bike.session.updateEditor({ select: todo.id, activate: true })
  }

  const hasMore = todos.length > PAGE_SIZE
  const visible = showAll ? todos : todos.slice(0, PAGE_SIZE)

  return (
    <Disclosure
      label="Todos"
      accessory={
        // Collapsed, `todos.length` is capped at PAGE_SIZE + 1, so show it as "10+" instead.
        <Label color="secondary">{hasMore && !showAll ? `${PAGE_SIZE}+` : todos.length}</Label>
      }
      expanded={expanded}
      onChange={setExpanded}
    >
      {!expanded ? null : todos.length === 0 ? (
        <Label color="secondary">{closed ? 'Outline closed' : 'No unchecked tasks'}</Label>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25em' }}>
          {visible.map((todo) => (
            <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4em' }}>
              {/* Matches the editor's task mark, which draws the same symbol in the row's own
                  text color — so inherit the color here rather than setting one. */}
              <SFSymbol
                name={checkedIds.has(todo.id) ? 'checkmark.square' : 'square'}
                scale="small"
                style={{ cursor: 'pointer', flex: 'none' }}
                onClick={() => checkOff(todo)}
              />
              <span
                role="button"
                style={{
                  cursor: 'pointer',
                  minWidth: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                onClick={() => goToTodo(todo)}
              >
                {todo.text || 'Untitled task'}
              </span>
            </div>
          ))}
          {hasMore && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4em' }}>
              {/* An invisible checkbox, so the link's leading edge lines up with the task text
                  no matter what size the symbol image measures out to. */}
              <SFSymbol
                name="square"
                scale="small"
                aria-hidden
                style={{ visibility: 'hidden', flex: 'none' }}
              />
              <span
                role="button"
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? 'Show Less' : 'Show More…'}
              </span>
            </div>
          )}
        </div>
      )}
    </Disclosure>
  )
}
