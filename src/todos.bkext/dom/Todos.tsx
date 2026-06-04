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

/** The streamed snapshot contains only rows matching the observe path. */
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
  const [closed, setClosed] = useState(false)

  useEffect(() => {
    // Stream just the unchecked tasks — the path query filters natively, so
    // snapshots stay small no matter how large the outline is. Inspector
    // items are bound to their window, so omitting `outline` pins this
    // subscription to the host window's outline — it doesn't retarget when
    // another window becomes frontmost.
    let sub: SessionSubscription | undefined
    let canceled = false
    bike.session
      .observeOutline(
        { path: '//task not @done', shape: 'flat' },
        (snapshot) => setTodos(collectTodos(snapshot)),
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
    // Same timestamp convention as the editor's toggle-done command.
    bike.session.updateRows({
      rows: [todo.id],
      attributes: { done: new Date().toISOString() },
    })
  }

  const reveal = async (todo: Todo) => {
    // Focus the task's parent, then select the task. The flat task stream
    // doesn't carry parents, so look the parent up with a one-shot read.
    // All calls default to the host window's outline/editor.
    const doc = await bike.session.getOutline({ shape: 'tree' })
    let parent: SessionRow | undefined
    const walk = (row: SessionRow) => {
      for (const child of row.children ?? []) {
        if (child.id === todo.id) parent = row
        walk(child)
      }
    }
    walk(doc.root)
    if (parent && parent.id !== doc.root.id) {
      bike.session.updateEditor({ focus: parent.id, select: todo.id })
    } else {
      bike.session.updateEditor({ select: todo.id })
    }
  }

  return (
    <Disclosure
      label="Todos"
      accessory={<Label color="secondary">{todos.length}</Label>}
      defaultExpanded
    >
      {todos.length === 0 ? (
        <Label color="secondary">{closed ? 'Outline closed' : 'No unchecked tasks'}</Label>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25em' }}>
          {todos.map((todo) => (
            <div key={todo.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4em' }}>
              <Checkbox checked={false} onChange={() => checkOff(todo)} />
              <span
                role="button"
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                onClick={() => reveal(todo)}
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
