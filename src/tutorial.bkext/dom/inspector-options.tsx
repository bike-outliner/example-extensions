import { DOMExtensionContext } from 'bike/dom'
import { Disclosure, Label, FormRow, FormGroup, Button } from 'bike/components'
import { createRoot } from 'react-dom/client'
import { useState } from 'react'

export function activate(context: DOMExtensionContext) {
  createRoot(context.element).render(<Options />)
}

function Options() {
  const [count, setCount] = useState(0)

  return (
    <Disclosure label="Options" summary={<Label color="secondary">{count} selected</Label>}>
      <FormGroup>
        <FormRow label="Count">
          <Button size="small" onClick={() => setCount(c => c + 1)}>Increment</Button>
        </FormRow>
        <FormRow label="Value">
          <Label>{count}</Label>
        </FormRow>
      </FormGroup>
    </Disclosure>
  )
}
