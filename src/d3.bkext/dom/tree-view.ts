import { DOMExtensionContext } from 'bike/dom'
import * as d3 from 'd3'
import { NodeData, activateD3View } from './d3-common'

export async function activate(context: DOMExtensionContext) {
  activateD3View(context, {
    createLayout(root, width) {
      const dx = 14
      const dy = width / (root.height + 1)
      return d3.tree<NodeData>().nodeSize([dx, dy])(root)
    },

    createSvg(layoutRoot, width) {
      const dx = 14
      let x0 = Infinity
      let x1 = -Infinity
      layoutRoot.each((d) => {
        if (d.x > x1) x1 = d.x
        if (d.x < x0) x0 = d.x
      })
      const height = x1 - x0 + dx * 2
      const dy = width / (layoutRoot.height + 1)

      return d3
        .create('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [-dy / 3, x0 - dx, width, height])
        .attr('style', 'max-width: 100%; height: auto;')
    },

    createLink() {
      return (d) => {
        const gen = d3
          .linkHorizontal<d3.HierarchyPointLink<NodeData>, d3.HierarchyPointNode<NodeData>>()
          .x((d) => d.y)
          .y((d) => d.x)
        return gen(d)
      }
    },

    positionNode: (d) => `translate(${d.y},${d.x})`,
    labelX: (d) => (d.children ? -6 : 6),
    labelAnchor: (d) => (d.children ? 'end' : 'start'),
  })
}
