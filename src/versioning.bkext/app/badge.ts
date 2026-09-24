import { Image, MenuItem, OutlineEditor, Row, SymbolConfiguration } from 'bike/app'
import { VersionMeta, deleteVersion, renameVersion, saveVersion, switchVersion, toggleVersioning } from './versioning'

// Versioned-branch badge. `render` draws only the glyph; clicking builds a menu
// from the `@version`/`@versionlist` attributes and routes to the shared commands.
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
    // Radio group: the active version is checked; ids encode the version.
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

  editor.showMenu({ row, anchor: 'versioning' }, {
    items,
    onAction: (id) => {
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
