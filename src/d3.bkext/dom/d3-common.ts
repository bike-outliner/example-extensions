import { DOMExtensionContext } from 'bike/dom'
import * as d3 from 'd3'

export interface NodeData {
  id: string
  name: string
  children?: NodeData[]
}

export interface D3ViewConfig {
  createLayout(
    root: d3.HierarchyNode<NodeData>,
    width: number,
    height: number,
  ): d3.HierarchyPointNode<NodeData>
  createSvg(
    root: d3.HierarchyPointNode<NodeData>,
    width: number,
    height: number,
  ): d3.Selection<SVGSVGElement, undefined, null, undefined>
  createLink(
    root: d3.HierarchyNode<NodeData>,
  ): (d: d3.HierarchyPointLink<NodeData>) => string | null
  positionNode(d: d3.HierarchyPointNode<NodeData>): string
  labelX(d: d3.HierarchyPointNode<NodeData>): number
  labelAnchor(d: d3.HierarchyPointNode<NodeData>): string
  labelTransform?(d: d3.HierarchyPointNode<NodeData>): string
}

export function activateD3View(context: DOMExtensionContext, config: D3ViewConfig) {
  context.onmessage = (message: { type: string; data: NodeData }) => {
    if (message.type == 'load' && message.data) {
      context.element.appendChild(generateSVG(message.data, context, config))
    }
  }
}

function generateSVG(data: NodeData, context: DOMExtensionContext, config: D3ViewConfig): any {
  const hierarchyRoot = d3.hierarchy(data)
  const width = window.innerWidth
  const height = window.innerHeight
  const layoutRoot = config.createLayout(hierarchyRoot, width, height)

  const svg = config.createSvg(layoutRoot, width, height)

  svg
    .append('g')
    .attr('fill', 'none')
    .attr('stroke', '#555')
    .attr('stroke-opacity', 0.4)
    .attr('stroke-width', 1.5)
    .selectAll()
    .data(hierarchyRoot.links())
    .join('path')
    .attr('d', (d) => config.createLink(hierarchyRoot)(d as d3.HierarchyPointLink<NodeData>))

  const node = svg
    .append('g')
    .attr('stroke-linejoin', 'round')
    .attr('stroke-width', 3)
    .selectAll()
    .data(layoutRoot.descendants())
    .join('g')
    .attr('transform', (d) => config.positionNode(d))

  node
    .append('circle')
    .attr('fill', (d) => (d.children ? '#555' : '#999'))
    .attr('r', 2.5)

  const text = node
    .append('text')
    .style('cursor', 'default')
    .on('mouseover', function () {
      d3.select(this).style('text-decoration', 'underline')
    })
    .on('mouseout', function () {
      d3.select(this).style('text-decoration', 'none')
    })
    .on('click', function (event, d) {
      context.postMessage({ type: 'select', id: d.data.id })
    })
    .attr('dy', '0.31em')
    .attr('x', (d) => config.labelX(d))
    .attr('text-anchor', (d) => config.labelAnchor(d))

  if (config.labelTransform) {
    text.attr('transform', (d) => config.labelTransform!(d))
  }

  text
    .text((d) => d.data.name)
    .clone(true)
    .lower()
    .attr('stroke', 'white')

  return svg.node()
}
