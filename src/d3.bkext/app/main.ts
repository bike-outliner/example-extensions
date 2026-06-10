import { AppExtensionContext } from 'bike/app'

export async function activate(context: AppExtensionContext) {
  bike.commands.addCommands({
    commands: {
      'd3:show-tree-view': {
        button: { symbol: 'tree', location: 'titlebar' },
        action: () => {
          bike.showPanel({ 
            script: 'tree-view.js', 
            title: 'D3 Tree View', 
            id: 'd3:tree-view' 
          }, bike.frontmostWindow!)
          return true
        },
      },
      'd3:show-radial-view': {
        button: { symbol: 'circle.hexagongrid', location: 'titlebar' },
        action: () => {
          bike.showPanel({ 
            script: 'radial-view.js', 
            title: 'D3 Radial View', 
            id: 'd3:radial-view' 
          }, bike.frontmostWindow!)
          return true
        },
      },
    },
  })
}