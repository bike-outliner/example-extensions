import * as d3 from 'd3'
import { NodeData, activateD3View, D3Protocol } from './d3-common'
import { DOMExtensionContext } from 'bike/dom'

export async function activate(context: DOMExtensionContext<D3Protocol>) {
  activateD3View(context, {
    createLayout(root, width, height) {
      const radius = Math.min(width, height) / 2
      return d3
        .tree<NodeData>()
        .size([2 * Math.PI, radius])
        .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth)(root)
    },

    createSvg(_layoutRoot, width, height) {
      return d3
        .create('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [-width / 2, -height / 2, width, height])
        .attr('style', 'width: 100%; height: auto')
    },

    createLink() {
      return (d) => {
        const gen = d3
          .linkRadial<d3.HierarchyPointLink<NodeData>, d3.HierarchyPointNode<NodeData>>()
          .angle((d) => d.x)
          .radius((d) => d.y)
        return gen(d)
      }
    },

    positionNode: (d) => `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0)`,
    labelX: (d) => (d.x < Math.PI === !d.children ? 6 : -6),
    labelAnchor: (d) => (d.x < Math.PI === !d.children ? 'start' : 'end'),
    labelTransform: (d) => `rotate(${d.x >= Math.PI ? 180 : 0})`,
  })
}
