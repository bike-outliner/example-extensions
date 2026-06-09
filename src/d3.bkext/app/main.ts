import { AppExtensionContext, DOMScript } from 'bike/app'

export async function activate(context: AppExtensionContext) {
  bike.commands.addCommands({
    commands: {
      'd3:show-tree-view': {
        button: { symbol: 'tree', location: 'titlebar' },
        action: () => {
          showD3Panel('tree-view.js', 'D3 Tree View', 'd3:tree-view')
          return true
        },
      },
      'd3:show-radial-view': {
        button: { symbol: 'circle.hexagongrid', location: 'titlebar' },
        action: () => {
          showD3Panel('radial-view.js', 'D3 Radial View', 'd3:radial-view')
          return true
        },
      },
    },
  })
}

// The panel's DOM script streams the focused subtree itself via `bike.session`
// (which resolves `@focused` / the outline against this panel's host window) and
// selects rows directly, so the app side only has to open the panel.
async function showD3Panel(script: DOMScript, title: string, id: string) {
  const window = bike.frontmostWindow
  if (!window) return
  await bike.showPanel({ script, title, id }, window)
}
