import { DOMExtensionContext } from 'bike/dom'
import * as d3 from 'd3'

// `SessionRow` / `SessionOutline` / `SessionEditor` are ambient globals from
// extension-kit's `api/dom/session.d.ts` (the `bike.session` types) — no import
// needed, the same way Todos.tsx uses `SessionOutline`.

export interface D3ViewConfig {
  createLayout(
    root: d3.HierarchyNode<SessionRow>,
    width: number,
    height: number,
  ): d3.HierarchyPointNode<SessionRow>
  /**
   * Apply view-specific sizing (width / height / viewBox) to the persistent
   * SVG. Called on every render so the frame can track the current layout.
   */
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
const SELECTED = 'var(--control-accent, AccentColor)' // accent for the editor's selected rows
const LABEL = 'var(--label)' // system text color for unselected labels

const trim = (s: string, max: number) => (s.length <= max ? s : s.slice(0, max - 1) + '…')

// Flatten session text runs into a plain label string.
const labelText = (n: SessionRow): string => n.text.map((r) => r.string).join('')

// Render every row, including empty ones. (Filtering empties out of the
// hierarchy meant a freshly-created blank row was dropped and never picked back
// up when text was typed into it later.)
const childrenOf = (n: SessionRow): SessionRow[] => n.children ?? []

// Depth-first lookup of a row by id within a subtree (used to resolve the focus
// row in the maintained outline). `observeEditor({ outline: true })` guarantees
// editor row ids are valid against the outline, so this finds the focus row.
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
  // Build the SVG and its two layers once. Every render reuses these elements
  // and diffs into them with keyed data joins, so unchanged rows are left
  // untouched instead of rebuilding the whole tree on each change.
  const svg = d3.create('svg')

  const linkGroup = svg
    .append('g')
    .attr('fill', 'none')
    .attr('stroke', '#555')
    .attr('stroke-opacity', 0.4)
    .attr('stroke-width', 1.5)

  const nodeGroup = svg.append('g').attr('stroke-linejoin', 'round').attr('stroke-width', 3)

  context.element.appendChild(svg.node()!)

  // Maintained workspace state — kept in sync by `observeEditor({ outline: true })`.
  let outlineRoot: SessionRow | null = null
  let editor: SessionEditor | null = null

  // The editor's focus row roots the layout: the last id in the focus stack
  // (`[outlineRoot, …, focus]`), resolved in the maintained outline.
  const focusRow = (): SessionRow | null => {
    const stack = editor?.focused
    const id = stack && stack.length ? stack[stack.length - 1] : outlineRoot?.id
    return (id != null && findRow(outlineRoot, id)) || outlineRoot
  }

  // The editor's selected rows, highlighted in the layout.
  const selectedIds = (): Set<number> => new Set(editor?.selection?.rows ?? [])

  // Cmd-click: focus the row in the editor, or focus one level back out if it's
  // already the focus — mirrors the editor's toggle-focus. The focus stack is
  // `[outlineRoot, …, focus]`, so one level out is the next-to-last entry.
  const toggleFocus = (id: number) => {
    const stack = editor?.focused ?? []
    if (stack.length && stack[stack.length - 1] === id) {
      const out = stack[stack.length - 2]
      if (out != null) bike.session.updateEditor({ focus: out })
    } else {
      bike.session.updateEditor({ focus: id })
    }
  }

  // Layout position (x/y in layout space) of each row from the previous render,
  // keyed by row id. New rows animate out from their parent's old spot; this is
  // what makes additions "grow" from their parent instead of popping in.
  const prevPositions = new Map<number, { x: number; y: number }>()

  // A node-shaped object with overridden coordinates, for feeding a specific
  // position into the view's transform/link helpers. Intentionally drops the
  // hierarchy prototype — only x / y / data are read off it.
  const at = (d: PointNode, pos: { x: number; y: number }): PointNode =>
    ({ ...d, x: pos.x, y: pos.y } as unknown as PointNode)

  // Apply the selection highlight to the current nodes (no re-layout).
  const applyHighlight = (sel: Set<number>) => {
    const nodes = nodeGroup.selectAll<SVGGElement, PointNode>('g.node')
    // `style` (not `attr`) so the `var(--control-accent)` resolves on the SVG.
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
    // Shared transition so every selection animates on the same clock. Typed
    // loosely because it's reused across path / g selections with differing
    // element types.
    const t: any = svg.transition().duration(DURATION).ease(d3.easeCubicInOut)

    // Where a freshly-added node/link should start: its parent's previous
    // position if we have it, otherwise its own final spot (e.g. first render).
    const originOf = (d: PointNode): { x: number; y: number } =>
      (d.parent && prevPositions.get(d.parent.data.id)) || { x: d.x, y: d.y }

    // LINKS — keyed by target row id (each row has exactly one parent).
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

    // NODES — keyed by row id.
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
      .attr('data-id', (d) => d.data.id) // for O(1) lookup on the content fast-path
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
        // Cmd-click focuses (toggles) the row; a plain click selects it.
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

    // Remember this render's positions so the next one can animate from them.
    prevPositions.clear()
    root.each((d) => prevPositions.set(d.data.id, { x: d.x, y: d.y }))
  }

  // Patch one row's label in place from its (already-mutated) bound datum. The
  // maintained tree mutates SessionRow objects in place, so the joined node's
  // `d.data` already holds the new text — no re-layout, join, or transition.
  const patchLabel = (id: number) => {
    const el = nodeGroup.node()?.querySelector<SVGGElement>(`g.node[data-id="${id}"]`)
    if (el) {
      d3.select<SVGGElement, PointNode>(el)
        .select<SVGTextElement>('text.label')
        .text((d) => trim(labelText(d.data), MAX_LABEL))
    }
  }

  // Observe the editor + its outline in sync: `outline` roots the layout at the
  // editor's focus row, `selection` highlights the selected rows, and outline
  // changes arrive in the same batch so row ids are always valid. session
  // auto-disposes when the panel closes (domUnloaded).
  bike.session.observeEditor({ debounce: 250, outline: true }, (ed, outline, changes) => {
    editor = ed
    outlineRoot = outline?.root ?? null
    if (!outlineRoot) return

    const seed = changes.outline.length === 0 && changes.editor.length === 0
    const structural = changes.outline.some((c) => c.type !== 'rowChanged')
    const focusChanged = changes.editor.some((c) => c.type === 'focus')

    // A re-layout is needed for the seed/reload, any structural outline edit, or
    // a focus change (the layout root moves). Otherwise stay incremental:
    if (seed || structural || focusChanged) {
      render()
      return
    }
    for (const c of changes.outline) if (c.type === 'rowChanged') patchLabel(c.row)
    if (changes.editor.some((c) => c.type === 'selection')) applyHighlight(selectedIds())
  })

  // Re-fit the layout when the panel is resized.
  window.addEventListener('resize', () => render())
}
