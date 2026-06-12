import { DOMExtensionContext } from 'bike/dom'
import { Checkbox, Disclosure, Label } from 'bike/components'
import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'

export async function activate(context: DOMExtensionContext) {
  createRoot(context.element).render(<Todos />)
}

type Todo = {
  id: SessionId
  text: string
}

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

  useEffect(() => {
    let sub: SessionSubscription | undefined
    let canceled = false
    bike.session
      .observeOutlineQuery(
        { path: '//task not @done', shape: 'flat' },
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
  }, [])

  const checkOff = (todo: Todo) => {
    setCheckedIds((prev) => new Set(prev).add(todo.id))
    bike.session.evaluateCommands({ ids: ['row:toggle-done'], rows: [todo.id] })
  }

  return (
    <Disclosure
      label="Todos"
      accessory={<Label color="secondary">{todos.length}</Label>}
      expanded={expanded}
      onChange={setExpanded}
    >
      {!expanded ? null : todos.length === 0 ? (
        <Label color="secondary">{closed ? 'Outline closed' : 'No unchecked tasks'}</Label>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25em' }}>
          {todos.map((todo) => (
            <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4em' }}>
              <Checkbox checked={checkedIds.has(todo.id)} onChange={() => checkOff(todo)} />
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
                onClick={() => bike.session.updateEditor({ select: todo.id })}
              >
                {todo.text || 'Untitled task'}
              </span>
            </div>
          ))}
        </div>
      )}
    </Disclosure>
  )
}
