import { DOMExtensionContext } from 'bike/dom'
import * as d3 from 'd3'

export interface D3ViewConfig {
  createLayout(
    root: d3.HierarchyNode<SessionRow>,
    width: number,
    height: number,
  ): d3.HierarchyPointNode<SessionRow>
  configureSvg(
    svg: d3.Selection<SVGSVGElement, undefined, null, undefined>,
    root: d3.HierarchyPointNode<SessionRow>,
    width: number,
    height: number,
  ): void
  createLink(
    root: d3.HierarchyNode<SessionRow>,
  ): (d: d3.HierarchyPointLink<SessionRow>) => string | null
  positionNode(d: d3.HierarchyPointNode<SessionRow>): string
  labelX(d: d3.HierarchyPointNode<SessionRow>): number
  labelAnchor(d: d3.HierarchyPointNode<SessionRow>): string
  labelTransform?(d: d3.HierarchyPointNode<SessionRow>): string
}

type PointNode = d3.HierarchyPointNode<SessionRow>
type PointLink = d3.HierarchyPointLink<SessionRow>

const MAX_LABEL = 32
const DURATION = 400
const SELECTED = 'var(--control-accent, AccentColor)'
const LABEL = 'var(--label)'

const trim = (s: string, max: number) => (s.length <= max ? s : s.slice(0, max - 1) + '…')

const labelText = (n: SessionRow): string => n.text.map((r) => r.string).join('')

const childrenOf = (n: SessionRow): SessionRow[] => n.children ?? []

const findRow = (root: SessionRow | null, id: number): SessionRow | null => {
  if (!root) return null
  if (root.id === id) return root
  for (const child of root.children ?? []) {
    const found = findRow(child, id)
    if (found) return found
  }
  return null
}

export function activateD3View(context: DOMExtensionContext, config: D3ViewConfig) {
  const svg = d3.create('svg')

  const linkGroup = svg
    .append('g')
    .attr('fill', 'none')
    .attr('stroke', '#555')
    .attr('stroke-opacity', 0.4)
    .attr('stroke-width', 1.5)

  const nodeGroup = svg.append('g').attr('stroke-linejoin', 'round').attr('stroke-width', 3)

  context.element.appendChild(svg.node()!)

  let outlineRoot: SessionRow | null = null
  let editor: SessionEditor | null = null

  const focusRow = (): SessionRow | null => {
    const stack = editor?.focused
    const id = stack && stack.length ? stack[stack.length - 1] : outlineRoot?.id
    return (id != null && findRow(outlineRoot, id)) || outlineRoot
  }

  const selectedIds = (): Set<number> => new Set(editor?.selection?.rows ?? [])

  const toggleFocus = (id: number) => {
    const stack = editor?.focused ?? []
    if (stack.length && stack[stack.length - 1] === id) {
      const out = stack[stack.length - 2]
      if (out != null) bike.session.updateEditor({ focus: out })
    } else {
      bike.session.updateEditor({ focus: id })
    }
  }

  const prevPositions = new Map<number, { x: number; y: number }>()

  const at = (d: PointNode, pos: { x: number; y: number }): PointNode =>
    ({ ...d, x: pos.x, y: pos.y } as unknown as PointNode)

  const applyHighlight = (sel: Set<number>) => {
    const nodes = nodeGroup.selectAll<SVGGElement, PointNode>('g.node')
    nodes
      .select<SVGCircleElement>('circle')
      .style('fill', (d) => (sel.has(d.data.id) ? SELECTED : d.children ? '#555' : '#999'))
    nodes
      .select<SVGTextElement>('text.label')
      .style('fill', (d) => (sel.has(d.data.id) ? SELECTED : LABEL))
  }

  const render = () => {
    const data = focusRow()
    if (!data) return
    const sel = selectedIds()
    const width = window.innerWidth
    const height = window.innerHeight
    const root = config.createLayout(d3.hierarchy(data, childrenOf), width, height)
    config.configureSvg(svg, root, width, height)

    const link = config.createLink(root)
    const t: any = svg.transition().duration(DURATION).ease(d3.easeCubicInOut)

    const originOf = (d: PointNode): { x: number; y: number } =>
      (d.parent && prevPositions.get(d.parent.data.id)) || { x: d.x, y: d.y }

    const links = linkGroup
      .selectAll<SVGPathElement, PointLink>('path')
      .data(root.links(), (d) => d.target.data.id)

    links
      .exit<PointLink>()
      .transition(t)
      .attr('d', (d) => link({ source: d.source, target: d.source }))
      .style('opacity', 0)
      .remove()

    const linkEnter = links
      .enter()
      .append('path')
      .style('opacity', 0)
      .attr('d', (d) => {
        const o = at(d.source, originOf(d.target))
        return link({ source: o, target: o })
      })

    linkEnter
      .merge(links)
      .transition(t)
      .style('opacity', 1)
      .attr('d', (d) => link(d))

    const nodes = nodeGroup
      .selectAll<SVGGElement, PointNode>('g.node')
      .data(root.descendants(), (d) => d.data.id)

    nodes
      .exit<PointNode>()
      .transition(t)
      .attr('transform', (d) => config.positionNode(d.parent ?? d))
      .style('opacity', 0)
      .remove()

    const nodeEnter = nodes
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('data-id', (d) => d.data.id)
      .style('opacity', 0)
      .attr('transform', (d) => config.positionNode(at(d, originOf(d))))
    nodeEnter.append('circle').attr('r', 2.5)
    nodeEnter
      .append('text')
      .attr('class', 'label')
      .attr('dy', '0.31em')
      .style('cursor', 'default')
      .on('mouseover', function () {
        d3.select(this).style('text-decoration', 'underline')
      })
      .on('mouseout', function () {
        d3.select(this).style('text-decoration', 'none')
      })
      .on('click', (event, d) => {
        if (event.metaKey) toggleFocus(d.data.id)
        else bike.session.updateEditor({ select: d.data.id })
      })

    const node = nodeEnter.merge(nodes)

    node.transition(t).style('opacity', 1).attr('transform', (d) => config.positionNode(d))

    const text = node
      .select<SVGTextElement>('text.label')
      .attr('x', (d) => config.labelX(d))
      .attr('text-anchor', (d) => config.labelAnchor(d))
      .text((d) => trim(labelText(d.data), MAX_LABEL))

    if (config.labelTransform) {
      text.attr('transform', (d) => config.labelTransform!(d))
    } else {
      text.attr('transform', null)
    }

    applyHighlight(sel)

    prevPositions.clear()
    root.each((d) => prevPositions.set(d.data.id, { x: d.x, y: d.y }))
  }

  const patchLabel = (id: number) => {
    const el = nodeGroup.node()?.querySelector<SVGGElement>(`g.node[data-id="${id}"]`)
    if (el) {
      d3.select<SVGGElement, PointNode>(el)
        .select<SVGTextElement>('text.label')
        .text((d) => trim(labelText(d.data), MAX_LABEL))
    }
  }

  bike.session.observeEditor({ debounce: 250, outline: true }, (ed, outline, changes) => {
    editor = ed
    outlineRoot = outline?.root ?? null
    if (!outlineRoot) return

    const seed = changes.outline.length === 0 && changes.editor.length === 0
    const structural = changes.outline.some((c) => c.type !== 'rowChanged')
    const focusChanged = changes.editor.some((c) => c.type === 'focus')

    if (seed || structural || focusChanged) {
      render()
      return
    }
    for (const c of changes.outline) if (c.type === 'rowChanged') patchLabel(c.row)
    if (changes.editor.some((c) => c.type === 'selection')) applyHighlight(selectedIds())
  })

  window.addEventListener('resize', () => render())
}
