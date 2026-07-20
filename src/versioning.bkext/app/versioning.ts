import { Outline, OutlineEditor, Row } from 'bike/app'

// Branch versioning core. A "versioned" branch is a row whose subtree can be
// captured as named snapshots and swapped in place.
//
// Storage is split into two places on purpose:
//
//   • Row attributes on the versioned root (undoable, travel with the row, and
//     usable as badge `where`/`inputs`):
//       - `versioned`     the marker enabling `.@versioned` selection
//       - `version`       id of the version currently live in the subtree
//       - `versionlist`   JSON `[{id,name,created}]` index (names only)
//     Keeping the active pointer in an attribute (not metadata) is what makes a
//     switch undo-atomic: the structural swap and the pointer revert together.
//
//   • persistentMetadata key `versions:<root.persistentId>` — the full source
//     of truth, saved in file frontmatter:
//       { active, index:[{id,name,created}], blobs:{ <id>:{data,format} } }
//     The heavy archive blobs must NOT live in a data-* attribute (that bloats
//     the text model and is re-parsed on every render), so they live here.
//
// The live children of the versioned root are the working copy. The root row
// itself is never archived/removed/reinserted — only its children are — so the
// root's persistentId, attributes, and inbound links stay stable across swaps.

const VERSIONED = 'versioned'
const ACTIVE = 'version'
const LIST = 'versionlist'
const BIKEMD = 'bikemd'

export type VersionMeta = { id: string; name: string; created: number }
type Blob = { data: string; format: 'bike' | 'opml' | 'plaintext' }
type VersionStore = { active: string; index: VersionMeta[]; blobs: Record<string, Blob> }

function newId(): string {
  return 'v-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 0xffffff).toString(36)
}

function storeKey(root: Row): string {
  return 'versions:' + root.ensuredPersistentId
}

// Snapshot the current live children (never the root itself).
function snapshot(root: Row): Blob {
  return new Outline(root.children).archive('bike') as Blob
}

function loadStore(root: Row): VersionStore | undefined {
  const raw = root.outline.persistentMetadata.get(storeKey(root))
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  return raw as unknown as VersionStore
}

// Persist the store as the source of truth and mirror the render/undo cache
// (versioned + active + index) into row attributes, all in one transaction.
function saveStore(root: Row, store: VersionStore): void {
  root.outline.persistentMetadata.set(storeKey(root), store as any)
  root.setAttribute(VERSIONED, '1')
  root.setAttribute(ACTIVE, store.active)
  root.setAttribute(LIST, JSON.stringify(store.index))
}

export function isVersioned(row: Row): boolean {
  return row.getAttribute(VERSIONED) != null
}

function versionedAncestor(row: Row): Row | undefined {
  return row.ancestors.find((a) => isVersioned(a))
}

function activeId(root: Row, store: VersionStore): string {
  return (root.getAttribute(ACTIVE) as string | undefined) ?? store.active
}

// Dirty iff the live subtree diverges from the outgoing active snapshot.
function isDirty(root: Row, store: VersionStore): boolean {
  const id = activeId(root, store)
  const active = store.blobs[id]
  if (!active) return true
  return snapshot(root).data !== active.data
}

export async function toggleVersioning(_editor: OutlineEditor | undefined, root: Row): Promise<boolean> {
  const outline = root.outline

  if (isVersioned(root)) {
    const result = await bike.showAlert({
      title: 'Turn Off Versioning',
      message: 'Keep the saved versions in the file, or discard them? The current content stays either way.',
      buttons: ['Keep', 'Discard', 'Cancel'],
      style: 'warning',
    })
    if (result.button === 'Cancel') return false
    const key = storeKey(root)
    outline.transaction({ label: 'Turn Off Versioning' }, () => {
      root.removeAttribute(VERSIONED)
      root.removeAttribute(ACTIVE)
      root.removeAttribute(LIST)
      if (result.button === 'Discard') outline.persistentMetadata.delete(key)
    })
    return true
  }

  if (versionedAncestor(root)) {
    await bike.showAlert({
      title: 'Nested Versioning Not Supported',
      message: "This row is already inside a versioned branch. Nested versioned branches aren't supported yet.",
      buttons: ['OK'],
      style: 'warning',
    })
    return false
  }

  outline.transaction({ label: 'Turn On Versioning' }, () => {
    // Ensure metadata (the blobs) persists even for plain-text documents.
    outline.persistentMetadata.set(BIKEMD, true)
    const existing = loadStore(root)
    if (existing && existing.index.length > 0 && Object.keys(existing.blobs).length > 0) {
      // Re-enabling a branch whose versions were Kept — restore, don't reinit.
      if (!existing.blobs[existing.active]) existing.active = existing.index[existing.index.length - 1].id
      saveStore(root, existing)
    } else {
      const v0 = newId()
      saveStore(root, {
        active: v0,
        index: [{ id: v0, name: 'Version 1', created: Date.now() }],
        blobs: { [v0]: snapshot(root) },
      })
    }
  })
  return true
}

export async function saveVersion(_editor: OutlineEditor | undefined, root: Row): Promise<boolean> {
  const store = loadStore(root)
  if (!isVersioned(root) || !store) return false

  const defaultName = `Version ${store.index.length + 1}`
  const result = await bike.showAlert({
    title: 'Save Version',
    message: 'Save the current branch content as a version.',
    buttons: ['Save as New', 'Update Current', 'Cancel'],
    fields: [{ id: 'name', type: 'text', label: 'Name', defaultValue: defaultName, placeholder: defaultName }],
  })
  if (result.button === 'Cancel') return false
  const name = String(result.values['name'] ?? '').trim() || defaultName
  const snap = snapshot(root)

  root.outline.transaction({ label: 'Save Version' }, () => {
    if (result.button === 'Update Current') {
      const id = activeId(root, store)
      store.blobs[id] = snap
      const entry = store.index.find((v) => v.id === id)
      if (entry) entry.name = name
      store.active = id
    } else {
      const id = newId()
      store.blobs[id] = snap
      store.index.push({ id, name, created: Date.now() })
      store.active = id
    }
    saveStore(root, store)
  })
  return true
}

export async function switchVersion(
  editor: OutlineEditor | undefined,
  root: Row,
  targetId?: string
): Promise<boolean> {
  const store = loadStore(root)
  if (!isVersioned(root) || !store) return false

  let target = targetId
  if (!target) {
    const picked = await bike.showChoiceBox({
      placeholder: 'Switch to version…',
      defaultSymbol: 'clock.arrow.circlepath',
      items: store.index.map((v) => ({ name: v.name })),
    })
    if (!picked || picked.indices.length === 0) return false
    target = store.index[picked.indices[0]].id
  }
  if (!target || !store.blobs[target]) return false

  const current = activeId(root, store)
  if (target === current) return true

  // Prompt before abandoning unsaved edits to the outgoing version.
  if (isDirty(root, store)) {
    const result = await bike.showAlert({
      title: 'Unsaved Changes',
      message: "The current branch has changes that aren't saved to a version. Save them before switching?",
      buttons: ['Save Changes', 'Discard', 'Cancel'],
      style: 'warning',
    })
    if (result.button === 'Cancel') return false
    if (result.button === 'Save Changes') {
      root.outline.transaction({ label: 'Save Version' }, () => {
        store.blobs[current] = snapshot(root)
        store.active = current
        saveStore(root, store)
      })
    }
  }

  root.outline.transaction({ label: 'Switch Version', animate: { spring: 'row' } }, () => {
    root.outline.breakUndoCoalescing()
    // Remove-before-insert guarantees no live copy of the target's rows exists,
    // so insertRows preserves their original persistentIds (A→B→A round-trips).
    if (root.children.length > 0) root.outline.removeRows(root.children)
    root.outline.insertRows(store.blobs[target!], root)
    store.active = target!
    saveStore(root, store)
  })
  editor?.revealRow(root, true)
  return true
}

export async function renameVersion(
  _editor: OutlineEditor | undefined,
  root: Row,
  id?: string
): Promise<boolean> {
  const store = loadStore(root)
  if (!isVersioned(root) || !store) return false
  const targetId = id ?? activeId(root, store)
  const entry = store.index.find((v) => v.id === targetId)
  if (!entry) return false

  const result = await bike.showAlert({
    title: 'Rename Version',
    buttons: ['Rename', 'Cancel'],
    fields: [{ id: 'name', type: 'text', label: 'Name', defaultValue: entry.name }],
  })
  if (result.button !== 'Rename') return false
  const name = String(result.values['name'] ?? '').trim()
  if (!name) return false

  root.outline.transaction({ label: 'Rename Version' }, () => {
    entry.name = name
    saveStore(root, store)
  })
  return true
}

export async function deleteVersion(
  editor: OutlineEditor | undefined,
  root: Row,
  id?: string
): Promise<boolean> {
  const store = loadStore(root)
  if (!isVersioned(root) || !store) return false
  const targetId = id ?? activeId(root, store)
  const entry = store.index.find((v) => v.id === targetId)
  if (!entry) return false

  if (store.index.length <= 1) {
    await bike.showAlert({
      title: 'Cannot Delete',
      message: 'A versioned branch must keep at least one version.',
      buttons: ['OK'],
      style: 'warning',
    })
    return false
  }

  const result = await bike.showAlert({
    title: `Delete “${entry.name}”?`,
    message: 'This permanently removes the saved version.',
    buttons: ['Delete', 'Cancel'],
    style: 'critical',
  })
  if (result.button !== 'Delete') return false

  // If deleting the active version, switch to a neighbor first (this also runs
  // the dirty-check prompt), then delete from a freshly reloaded store.
  if (activeId(root, store) === targetId) {
    const idx = store.index.findIndex((v) => v.id === targetId)
    const fallback = store.index[idx + 1] ?? store.index[idx - 1]
    const switched = await switchVersion(editor, root, fallback.id)
    if (!switched) return false
  }

  const fresh = loadStore(root)
  if (!fresh) return false
  root.outline.transaction({ label: 'Delete Version' }, () => {
    fresh.index = fresh.index.filter((v) => v.id !== targetId)
    delete fresh.blobs[targetId]
    saveStore(root, fresh)
  })
  return true
}
