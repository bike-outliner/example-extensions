import { Outline } from 'bike/app'

// These tests exercise the load-bearing primitives the versioning feature is
// built on. The command flows themselves (toggle/save/switch) are interactive
// (showAlert/showChoiceBox) and are verified manually / via the MCP bridge.

describe('versioning: snapshot round-trip', () => {
  const outline = bike.testOutline()

  outline.transaction({ label: 'setup' }, () => {
    const roots = outline.insertRows([{ text: 'Root' }], outline.root)
    outline.insertRows([{ text: 'Child A' }, { text: 'Child B' }], roots[0])
  })

  const root = outline.root.firstChild!
  // Give children persistent ids so we can assert they survive the round-trip.
  const pidA = root.firstChild!.ensuredPersistentId
  const pidB = root.lastChild!.ensuredPersistentId

  it('archives the live children (not the root)', () => {
    const archive = new Outline(root.children).archive('bike')
    assert(typeof archive.data === 'string', 'archive data should be a string')
    assert(archive.data.length > 0, 'archive should not be empty')
    assert.equal(archive.format, 'bike')
  })

  it('archive of identical content is deterministic (dirty-check relies on this)', () => {
    const a = new Outline(root.children).archive('bike').data
    const b = new Outline(root.children).archive('bike').data
    assert.equal(a, b, 'archiving the same content twice should be byte-identical')
  })

  it('remove-then-insert preserves persistentIds and content (A→B→A invariant)', () => {
    const snap = new Outline(root.children).archive('bike')

    outline.transaction({ label: 'swap out' }, () => {
      outline.removeRows(root.children)
      outline.insertRows([{ text: 'Other' }], root)
    })
    assert.equal(root.children.length, 1)
    assert.equal(root.firstChild!.text.string, 'Other')

    outline.transaction({ label: 'swap back' }, () => {
      outline.removeRows(root.children)
      outline.insertRows(snap, root)
    })

    assert.equal(root.children.length, 2, 'both children restored')
    assert.equal(root.firstChild!.text.string, 'Child A')
    assert.equal(root.lastChild!.text.string, 'Child B')
    // Because no live copy existed at insert time, uniquify does not fire and
    // the original persistent ids come back unchanged.
    assert.equal(root.firstChild!.persistentId, pidA, 'Child A persistentId preserved')
    assert.equal(root.lastChild!.persistentId, pidB, 'Child B persistentId preserved')
  })

  it('re-archiving after a clean round-trip matches the snapshot (not dirty)', () => {
    const snap = new Outline(root.children).archive('bike')
    outline.transaction({ label: 'round trip' }, () => {
      outline.removeRows(root.children)
      outline.insertRows(snap, root)
    })
    const after = new Outline(root.children).archive('bike').data
    assert.equal(after, snap.data, 'restored branch should not read as dirty')
  })
})

describe('versioning: persistentMetadata store', () => {
  const outline = bike.testOutline()
  outline.insertRows([{ text: 'Root' }], outline.root)
  const root = outline.root.firstChild!
  const key = 'versions:' + root.ensuredPersistentId

  it('stores and retrieves the version store object', () => {
    const store = {
      active: 'v1',
      index: [{ id: 'v1', name: 'Version 1', created: 123 }],
      blobs: { v1: { data: '<ul></ul>', format: 'bike' } },
    }
    outline.persistentMetadata.set(key, store as any)
    const read = outline.persistentMetadata.get(key) as any
    assert(read, 'store should be retrievable')
    assert.equal(read.active, 'v1')
    assert.equal(read.index.length, 1)
    assert.equal(read.index[0].name, 'Version 1')
    assert.equal(read.blobs.v1.data, '<ul></ul>')
  })

  it('deletes the store', () => {
    outline.persistentMetadata.delete(key)
    assert.equal(outline.persistentMetadata.get(key), undefined)
  })
})

describe('versioning: marker attribute', () => {
  const outline = bike.testOutline()
  outline.insertRows([{ text: 'Root' }], outline.root)
  const root = outline.root.firstChild!

  it('mirrors active + index into non-hyphen attributes readable by the badge', () => {
    outline.transaction({ label: 'mark' }, () => {
      root.setAttribute('versioned', '1')
      root.setAttribute('version', 'v1')
      root.setAttribute('versionlist', JSON.stringify([{ id: 'v1', name: 'Version 1', created: 1 }]))
    })
    assert.equal(root.getAttribute('versioned'), '1')
    assert.equal(root.getAttribute('version'), 'v1')
    const list = JSON.parse(root.getAttribute('versionlist'))
    assert.equal(list[0].name, 'Version 1')
  })
})
