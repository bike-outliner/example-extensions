import { DOMExtensionContext } from 'bike/dom'
import { Label } from 'bike/components'
import { createRoot } from 'react-dom/client'
import { ResourceDemoProtocol } from './protocols'

export function activate(context: DOMExtensionContext<ResourceDemoProtocol>) {
  const logoURL = extensionURL('resources/logo.svg')
  const root = createRoot(context.element)
  root.render(<ResourceDemo logoURL={logoURL} />)
}

function ResourceDemo({ logoURL }: { logoURL: string }) {
  return (
    <div style={{ padding: 24 }}>
      <Label font="headline">Extension Resources Demo</Label>

      <div style={{ marginTop: 16 }}>
        <Label font="subheadline">Image via extensionURL</Label>
        <div style={{ marginTop: 8 }}>
          <img src={logoURL} width={64} height={64} alt="Extension logo" />
          <Label color="tertiary" font="caption" style={{ marginTop: 4, display: 'block' }}>
            {logoURL}
          </Label>
        </div>
      </div>
    </div>
  )
}
