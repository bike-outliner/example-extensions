import { DOMExtensionContext } from 'bike/dom'
import { Label } from 'bike/components'
import { createRoot } from 'react-dom/client'
import { PanelDemoProtocol } from './protocols'

export function activate(context: DOMExtensionContext<PanelDemoProtocol>) {
  const root = createRoot(context.element)
  root.render(<PanelDemo />)

  context.onmessage = (message) => {
    if (message.type === 'role') {
      root.render(<PanelDemo role={message.role} />)
    }
  }
}

function PanelDemo({ role }: { role?: string }) {
  return (
    <div style={{ padding: 24 }}>
      <Label font="headline">Panel Demo</Label>
      <div style={{ marginTop: 12 }}>
        <Label color="secondary">
          {role ? `Role: ${role}` : 'Loading…'}
        </Label>
      </div>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Label font="subheadline">Role Behaviors</Label>
        {role === 'inspector' && (
          <>
            <Label color="secondary" font="caption">Floating, cannot become main window</Label>
            <Label color="secondary" font="caption">Stays visible when app deactivates</Label>
          </>
        )}
        {role === 'utility' && (
          <>
            <Label color="secondary" font="caption">Floating, cannot become main window</Label>
            <Label color="secondary" font="caption">Hides when app deactivates</Label>
          </>
        )}
        {role === 'window' && (
          <>
            <Label color="secondary" font="caption">Non-floating, can become main window</Label>
            <Label color="secondary" font="caption">Stays visible when app deactivates</Label>
          </>
        )}
      </div>
    </div>
  )
}
