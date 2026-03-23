import { DOMExtensionContext } from 'bike/dom'
import { Disclosure, Label, FormRow, FormGroup, SegmentedControl } from 'bike/components'
import { createRoot } from 'react-dom/client'
import { useState } from 'react'

export function activate(context: DOMExtensionContext) {
  createRoot(context.element).render(<Details />)
}

function Details() {
  const [format, setFormat] = useState('plain')

  return (
    <Disclosure label="Details" defaultExpanded>
      <FormGroup>
        <FormRow label="Format">
          <SegmentedControl
            size="small"
            items={[
              { value: 'plain', label: 'Plain' },
              { value: 'rich', label: 'Rich' },
            ]}
            value={format}
            onChange={setFormat}
          />
        </FormRow>
        <FormRow label="Status">
          <Label color="secondary">Active</Label>
        </FormRow>
      </FormGroup>
    </Disclosure>
  )
}
