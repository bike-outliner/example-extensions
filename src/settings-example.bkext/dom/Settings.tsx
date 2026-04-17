import { DOMExtensionContext } from 'bike/dom'
import { Checkbox, Disclosure } from 'bike/components'
import { createRoot } from 'react-dom/client'
import { useState } from 'react'

export function activate(context: DOMExtensionContext) {
  createRoot(context.element).render(<SettingsPanel />)
}

function SettingsPanel() {
  const [enabled, setEnabled] = useState(() => bike.defaults.get('enabled') === true)

  function onChange(value: boolean) {
    setEnabled(value)
    bike.defaults.set('enabled', value)
  }

  return (
    <Disclosure label="Settings Example" defaultExpanded>
      <Checkbox checked={enabled} onChange={(e) => onChange(e.target.checked)}>
        Enabled
      </Checkbox>
    </Disclosure>
  )
}
