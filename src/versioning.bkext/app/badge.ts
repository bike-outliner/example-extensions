import { Image, MenuItem, OutlineEditor, Row, SymbolConfiguration } from 'bike/app'
import { VersionMeta, deleteVersion, renameVersion, saveVersion, switchVersion, toggleVersioning } from './versioning'

// On-row indicator + switcher for versioned branches. `render` is pure — it
// draws only the glyph — while clicking shows a menu (built from the
// mirrored `@version`/`@versionlist` attributes at click time) whose
// radio/actions route back through the shared command functions.
export function registerVersioningBadge() {
  bike.badge('versioning', {
    where: '.@versioned',
    inputs: { active: '@version', list: '@versionlist' },
    render: (values, env) =>
      Image.fromSymbol(
        new SymbolConfiguration('clock.arrow.circlepath')
          .withHierarchicalColor(env.color.alphaSet(0.6))
          .withFont(env.font)
      ),
    onClick: ({ editor, row }) => showVersionsMenu(editor, row),
  })
}

function showVersionsMenu(editor: OutlineEditor, row: Row) {
  let list: VersionMeta[] = []
  try {
    list = JSON.parse(row.getAttribute('versionlist') ?? '[]')
  } catch {
    list = []
  }
  const activeId = row.getAttribute('version')
  const active = list.find((v) => v.id === activeId)

  const items: MenuItem[] = [
    // Non-interactive label (the `header` item type is not public API).
    {
      type: 'button',
      id: 'versions-label',
      title: active ? `${active.name} · ${list.length} version${list.length === 1 ? '' : 's'}` : 'Versions',
      enabled: false,
    },
    // Radio group from checked buttons: the active version carries the
    // checkmark; choosing routes through onAction with the id encoding
    // the version.
    ...list.map(
      (v): MenuItem => ({
        type: 'button',
        id: `switch:${v.id}`,
        title: v.name,
        state: v.id === activeId ? 'on' : 'off',
      })
    ),
    { type: 'separator' },
    { type: 'button', id: 'save', title: 'Save Version…', symbol: 'plus' },
    { type: 'button', id: 'rename', title: 'Rename Active…', symbol: 'pencil' },
    { type: 'button', id: 'delete', title: 'Delete Active…', symbol: 'trash' },
    { type: 'separator' },
    { type: 'button', id: 'command:versioning:toggle', title: 'Turn Off Versioning' },
  ]

  editor.showMenu(row, {
    items,
    anchor: 'versioning',
    onAction: (id, { editor, row }) => {
      if (id.startsWith('switch:')) {
        const versionId = id.slice('switch:'.length)
        if (versionId !== row.getAttribute('version')) switchVersion(editor, row, versionId)
      } else if (id === 'save') saveVersion(editor, row)
      else if (id === 'rename') renameVersion(editor, row, row.getAttribute('version'))
      else if (id === 'delete') deleteVersion(editor, row, row.getAttribute('version'))
      else if (id === 'toggle') toggleVersioning(editor, row)
    },
  })
}
