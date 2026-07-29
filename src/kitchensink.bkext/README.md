# Kitchen Sink

This extension demonstrates Bike extension API features including commands, panels, inspector items, components, color API, and themes.

## API examples

The API reference (`extension-kit/api/**/*.d.ts`) deliberately carries no
`@example` blocks — examples rot when they can't compile. They live here
instead, as runnable commands (`app/api-examples.ts`):

- **`kitchensink:value-codec-demo`** — `bike.systemLocale` with `Intl`,
  `bike.formatDate`, and the wire codecs `bike.encodeValue` / `bike.decodeValue`.
- **`kitchensink:defaults-demo`** — `bike.defaults` get/set/observe.
- **`kitchensink:keychain-demo`** — `bike.keychain` set/get/keys/delete
  (the `keychain` permission in this manifest is what unlocks it).
- **`kitchensink:choice-box-demo`** — `bike.showChoiceBox`: item symbols and
  containers on the default source, plus a `">"`-prefixed lazy second source.
- **`kitchensink:panel-standalone`** — `bike.showPanel` with no window
  argument: a standalone panel whose `id` autosaves its frame.
- **`kitchensink:session-drop-demo`** — the DOM context's `bike.session`
  (getOutlines + a live observeOutlineQuery stream) and the `bike:rowdragover` /
  `bike:rowdrop` row-drop events (`dom/session-drop-demo.tsx`).
- **`kitchensink:show-alert-demo`** — `bike.showAlert` with every field type.
- **`kitchensink:panel-inspector` / `-utility` / `-window`** — window-associated
  `bike.showPanel` roles with typed messaging.

## Components

The components panel (`dom/components-demo.tsx`) demonstrates the `bike/components` library:

- **SFSymbol** — SF Symbols at various scales and weights.
- **Button** — capsule buttons in mini / small / regular / large.
- **Label** — system font and color variants.
- **SegmentedControl** — tab-like control in each size.
- **FormRow** — label + content rows for inspector forms.
- **Box** — a filled, rounded container for grouping related controls, with an optional `label` header.

It also shows the available system fonts, text colors, backgrounds, fills, and hues.
