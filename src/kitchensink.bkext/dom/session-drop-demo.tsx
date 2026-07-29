import { DOMExtensionContext } from 'bike/dom'
import { Label } from 'bike/components'
import { createRoot } from 'react-dom/client'
import { useEffect, useRef, useState } from 'react'
import { SessionDropDemoProtocol } from './protocols'

// Runnable homes for the DOM-context API examples that used to live as
// `@example` blocks in extension-kit's .d.ts docs:
// - bike.session — the async bridge for reading, observing, and mutating
//   outlines from a DOM extension: a one-shot getOutlines() plus a live
//   observeOutlineQuery() stream.
// - bike:rowdragover / bike:rowdrop — accepting rows dragged from the editor.

export function activate(context: DOMExtensionContext<SessionDropDemoProtocol>) {
  createRoot(context.element).render(<SessionDropDemo />)
}

function SessionDropDemo() {
  const [outlines, setOutlines] = useState<string[]>([])
  const [tasks, setTasks] = useState<string[]>([])
  const [droppedCount, setDroppedCount] = useState(0)
  const zoneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // bike.session.getOutlines — one-shot summary of every open outline.
    bike.session.getOutlines().then((all) => setOutlines(all.map((outline) => outline.displayName)))

    // bike.session.observeOutlineQuery — stream live snapshots of a query
    // until the subscription is disposed (it's also auto-disposed when the
    // script unloads; the cancel dance covers unmounting before it arrives).
    let subscription: { dispose(): void } | undefined
    let canceled = false
    bike.session
      .observeOutlineQuery({ path: '//task', shape: 'flat' }, (doc) => {
        setTasks((doc?.root.children ?? []).map((row) => row.text.map((run) => run.string).join('')))
      })
      .then((s) => {
        if (canceled) s.dispose()
        else subscription = s
      })
    return () => {
      canceled = true
      subscription?.dispose()
    }
  }, [])

  useEffect(() => {
    const zone = zoneRef.current
    if (!zone) return
    // bike:rowdragover — calling preventDefault() while the drag is over
    // this element accepts the drop (bike:rowdragenter works the same way).
    const dragOver = (event: GlobalEventHandlersEventMap['bike:rowdragover']) => {
      event.preventDefault()
    }
    // bike:rowdrop — the accepted drop; the detail names the source outline
    // and dragged rows, valid even when they came from another document.
    const drop = (event: GlobalEventHandlersEventMap['bike:rowdrop']) => {
      const { outline, rows } = event.detail
      bike.session.updateRows({ outline, rows, attributes: { tagged: '' } })
      setDroppedCount((count) => count + rows.length)
    }
    zone.addEventListener('bike:rowdragover', dragOver)
    zone.addEventListener('bike:rowdrop', drop)
    return () => {
      zone.removeEventListener('bike:rowdragover', dragOver)
      zone.removeEventListener('bike:rowdrop', drop)
    }
  }, [])

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Label font="headline">Session &amp; Drop Demo</Label>

      <div>
        <Label font="subheadline">Open outlines (session.getOutlines)</Label>
        {outlines.map((name, i) => (
          <div key={i}>
            <Label color="secondary" font="caption">{name}</Label>
          </div>
        ))}
      </div>

      <div>
        <Label font="subheadline">Live tasks (session.observeOutlineQuery '//task')</Label>
        {tasks.length === 0 && <div><Label color="secondary" font="caption">No task rows yet</Label></div>}
        {tasks.map((text, i) => (
          <div key={i}>
            <Label color="secondary" font="caption">{text || 'Untitled'}</Label>
          </div>
        ))}
      </div>

      <div
        ref={zoneRef}
        style={{
          border: '2px dashed color-mix(in srgb, currentColor 30%, transparent)',
          borderRadius: 8,
          padding: 20,
          textAlign: 'center',
        }}
      >
        <Label color="secondary">
          {droppedCount === 0
            ? 'Drag rows from the editor here to tag them'
            : `Tagged ${droppedCount} dropped row(s) with @tagged`}
        </Label>
      </div>
    </div>
  )
}
