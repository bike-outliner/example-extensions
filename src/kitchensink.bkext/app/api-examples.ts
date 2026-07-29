import { CommandContext, PanelHandle } from 'bike/app'
import { PanelDemoProtocol, SessionDropDemoProtocol } from '../dom/protocols'

// Runnable homes for the API examples that used to live as `@example` blocks
// in extension-kit's .d.ts docs — here they compile and run, so they can't
// rot. Each demo names the API it demonstrates; keep them minimal and close
// to what a first-time reader of that API needs.

export function registerApiExamples() {
  bike.commands.addCommands({
    commands: {
      'kitchensink:value-codec-demo': valueCodecDemo,
      'kitchensink:defaults-demo': defaultsDemo,
      'kitchensink:keychain-demo': keychainDemo,
      'kitchensink:choice-box-demo': choiceBoxDemo,
      'kitchensink:panel-standalone': panelStandaloneDemo,
      'kitchensink:session-drop-demo': sessionDropDemo,
    },
  })
}

// bike.systemLocale / bike.formatDate / bike.encodeValue / bike.decodeValue —
// the locale constants, the pattern formatter, and the machine-facing wire
// codecs, side by side so the roles read clearly: Intl + formatDate make
// human labels, encode/decode make and read attribute WIRE strings.
async function valueCodecDemo(): Promise<boolean> {
  const now = new Date()
  const lines = [
    '— bike.systemLocale with the platform Intl APIs —',
    now.toLocaleDateString(bike.systemLocale),
    new Intl.DateTimeFormat(bike.systemLocale, { dateStyle: 'long' }).format(now),
    '',
    '— bike.formatDate (date-fns patterns) —',
    bike.formatDate(now, 'yyyy-MM-dd'),
    bike.formatDate(now, 'MMMM d, yyyy'),
    '',
    '— bike.encodeValue (typed JS value → wire string) —',
    `date, local day: ${bike.encodeValue('date', now)}`,
    `date, UTC instant: ${bike.encodeValue('date', now, { time: true })}`,
    `duration, 5400s: ${bike.encodeValue('duration', 5400)}`,
    '',
    '— bike.decodeValue (wire string → typed JS value) —',
    `'2026-07-28' hasTime: ${bike.decodeValue('date', '2026-07-28')?.hasTime}`,
    `'PT1H30M' seconds: ${bike.decodeValue('duration', 'PT1H30M')}`,
    `'' (valueless attribute): ${bike.decodeValue('date', '')}`,
  ]
  await bike.showAlert({ title: 'Value Codec Demo', message: lines.join('\n'), buttons: ['OK'] })
  return true
}

// bike.defaults — extension defaults backed by UserDefaults, with observers.
function defaultsDemo(context: CommandContext): boolean {
  const observer = bike.defaults.observe('theme', (value) => {
    context.editor?.showStatusMessage(`defaults 'theme' is now: ${value}`, 3000)
  })
  const value = bike.defaults.get('theme')
  bike.defaults.set('theme', value === 'dark' ? 'light' : 'dark')
  // A real extension keeps its observer for its lifetime; the demo's has
  // done its job once the change above is reported.
  setTimeout(() => observer.dispose(), 4000)
  return true
}

// bike.keychain — per-extension secret storage. Requires the `keychain`
// permission (declared in this extension's manifest.json).
function keychainDemo(context: CommandContext): boolean {
  bike.keychain.set('api-token', 'sk-abc123')
  const token = bike.keychain.get('api-token')
  const keys = bike.keychain.keys()
  bike.keychain.delete('api-token')
  context.editor?.showStatusMessage(
    `keychain: stored [${keys.join(', ')}], read back "${token}", then deleted`,
    4000
  )
  return true
}

// bike.showChoiceBox — the fuzzy picker. The default source shows item
// `symbol`s, a `container` category, and a `defaultSymbol` fallback; typing
// ">" switches to a second, LAZY source whose items are built only on first
// activation (so an expensive list costs nothing unless triggered).
async function choiceBoxDemo(context: CommandContext): Promise<boolean> {
  const result = await bike.showChoiceBox([
    {
      placeholder: 'Pick a fruit (type ">" for rows)…',
      defaultSymbol: 'circle',
      items: [
        { name: 'Apple', symbol: 'star' },
        { name: 'Banana', container: 'Yellow' },
        { name: 'Cherry' },
      ],
    },
    {
      prefix: '>',
      placeholder: 'Go to row…',
      defaultSymbol: 'doc.text',
      items: () =>
        (context.editor?.outline.root.descendants ?? []).map((row) => ({
          name: row.text.string || 'Untitled',
        })),
    },
  ])
  if (result !== null) {
    // `indices` index the ACTIVE source's items; `prefix` says which source
    // that was (null = the default one).
    const picked = result.items.map((item) => item.name).join(', ')
    context.editor?.showStatusMessage(
      `Picked ${picked} (indices [${result.indices.join(', ')}], source ${result.prefix ?? 'default'})`,
      4000
    )
  }
  return true
}

// bike.showPanel WITHOUT a window argument — a standalone panel tied to no
// document, open until disposed or closed. The `id` autosaves its frame, so
// reopening restores where the user left it (no `frame` given: the first
// open centers on the main screen).
async function panelStandaloneDemo(): Promise<boolean> {
  const handle: PanelHandle<PanelDemoProtocol> = await bike.showPanel<PanelDemoProtocol>({
    id: 'kitchensink:panel-standalone',
    script: 'panel-demo.js',
    title: 'Standalone Panel',
    role: 'window',
  })
  handle.postMessage({ type: 'role', role: 'window (standalone — no window argument)' })
  return true
}

// The DOM-context examples — bike.session streaming and bike:rowdrop —
// live in dom/session-drop-demo.tsx; this just opens that panel.
async function sessionDropDemo(): Promise<boolean> {
  await bike.showPanel<SessionDropDemoProtocol>({
    id: 'kitchensink:session-drop-demo',
    script: 'session-drop-demo.js',
    title: 'Session & Drop Demo',
    role: 'utility',
  }, bike.frontmostWindow)
  return true
}
