import { DOMExtensionContext } from 'bike/dom'
import { Label } from 'bike/components'
import { createRoot } from 'react-dom/client'
import { ResourceDemoProtocol } from './protocols'

export function activate(context: DOMExtensionContext<ResourceDemoProtocol>) {
  const logoURL = context.resourceURL('resources/logo.svg')
  const root = createRoot(context.element)
  root.render(<ResourceDemo logoURL={logoURL} />)

  context.onmessage = (message) => {
    if (message.type === 'manifest') {
      root.render(<ResourceDemo logoURL={logoURL} manifest={message.data} />)
    }
  }
}

function ResourceDemo({ logoURL, manifest }: { logoURL: string; manifest?: Record<string, unknown> }) {
  return (
    <div style={{ padding: 24 }}>
      <Label font="headline">Extension Resources Demo</Label>

      <div style={{ marginTop: 16 }}>
        <Label font="subheadline">Image via resourceURL</Label>
        <div style={{ marginTop: 8 }}>
          <img src={logoURL} width={64} height={64} alt="Extension logo" />
          <Label color="tertiary" font="caption" style={{ marginTop: 4, display: 'block' }}>
            {logoURL}
          </Label>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Label font="subheadline">Manifest via readFile</Label>
        {manifest ? (
          <pre style={{
            marginTop: 8,
            padding: 12,
            borderRadius: 6,
            fontSize: 11,
            fontFamily: 'ui-monospace, monospace',
            overflow: 'auto',
          }}>
            {JSON.stringify(manifest, null, 2)}
          </pre>
        ) : (
          <Label color="secondary" style={{ marginTop: 8 }}>Loading...</Label>
        )}
      </div>
    </div>
  )
}
