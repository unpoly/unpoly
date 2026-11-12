// Watches a directory tree with one non-recursive fs.watch() per directory, adding and dropping
// directory watches as directories appear, vanish or move. watchpack and chokidar work the same
// way.
//
// Why not fs.watch(root, { recursive: true }): on Linux, Node implements that with one inotify
// watch per *file*. A file that is replaced on disk (a new inode) loses its watch for good, and
// that is how most writes happen: atomic editor saves, Claude Code's Edit tool, and every
// `git checkout`, `stash`, `rebase` or `switch`. From then on, edits to that file triggered no
// rebuild, and `bin/test` ran against a stale bundle. Node also keeps watching a renamed directory
// under its old name. A directory watch has neither problem: it reports every name that is
// written, created, renamed or deleted in it, whatever happens to the inodes.

import { lstatSync, readdirSync, watch as fsWatch } from 'node:fs'
import path from 'node:path'

// Calls `onChange(file, { directory })` for every event under `root`, with the absolute path
// of the entry that changed. `directory` is true when that entry is (or was) a directory: its
// contents appeared or went away as a whole, without an event of their own. `file` is null when
// Node could not name the entry. Directories whose name `skip()` returns true for are not watched.
// `onError(error, dir)` hears of a directory we could not watch, or stopped watching. `watch`
// is a seam for the self-tests.
//
// Returns `{ close() }`.
export function watchTree(root, onChange, { skip = () => false, onError = () => {}, watch = fsWatch } = {}) {
  // Directory path → its FSWatcher.
  let watched = new Map()

  function add(dir) {
    let watcher
    try {
      watcher = watch(dir, (_event, name) => changed(dir, watcher, name))
    } catch (error) {
      // Gone before we got to it, or out of inotify watches (ENOSPC). Say so: a directory we
      // cannot watch is one whose edits no longer rebuild anything.
      if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') onError(error, dir)
      return
    }
    watcher.on('error', (error) => {
      if (watched.get(dir) !== watcher) return
      drop(dir)
      // A directory that went away takes its watch with it, and its parent's event says so.
      if (isDirectory(dir)) onError(error, dir)
    })
    watched.set(dir, watcher)
    for (let child of subdirectories(dir)) add(child)
  }

  // Stops watching `dir` and everything below it.
  function drop(dir) {
    for (let [other, watcher] of watched) {
      if (other === dir || other.startsWith(dir + path.sep)) {
        watcher.close()
        watched.delete(other)
      }
    }
  }

  function changed(dir, watcher, name) {
    // A watch that outlived its directory (renamed or deleted, and its parent's event already
    // handled) can still report, under the old path, and so can one for a directory of the same
    // name that has since replaced it. Its events mean nothing.
    if (watched.get(dir) !== watcher) return
    if (!name) {
      // Node could not tell us what changed. Look at the whole directory again.
      for (let child of [...watched.keys()]) {
        if (path.dirname(child) === dir) drop(child)
      }
      for (let child of subdirectories(dir)) add(child)
      onChange(null, { directory: true })
      return
    }
    let file = path.join(dir, name)
    // A directory only shows up in its parent's events when it is created, deleted or renamed,
    // never for what happens inside it. So whatever now has this name, our watches below it
    // (if any) belong to a directory that is gone, or that we only know under another name. The
    // inode would not tell us: a deleted directory's inode is free for reuse right away.
    let wasDirectory = watched.has(file)
    drop(file)
    let nowDirectory = !skip(name) && isDirectory(file)
    if (nowDirectory) add(file)
    onChange(file, { directory: wasDirectory || nowDirectory })
  }

  // The root, too, only shows up in its parent's events. Watching those for its name keeps a
  // root watched that is deleted and created again (`rm -rf tmp`, a checkout that replaces `spec`).
  let parent
  try {
    parent = watch(path.dirname(root), (event, name) => {
      if (event === 'rename' && (!name || name === path.basename(root))) rootChanged()
    })
    parent.on('error', (error) => onError(error, path.dirname(root)))
  } catch (error) {
    onError(error, path.dirname(root))
  }

  function rootChanged() {
    let wasWatched = watched.has(root)
    drop(root)
    add(root)
    if (wasWatched || watched.has(root)) onChange(root, { directory: true })
  }

  add(root)

  return {
    close() {
      parent?.close()
      drop(root)
    },
    // For the self-tests.
    get directories() { return [...watched.keys()] },
  }

  function subdirectories(dir) {
    try {
      return readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && !skip(entry.name))
        .map((entry) => path.join(dir, entry.name))
    } catch {
      return []
    }
  }
}

// Not a symlink to a directory. We don't follow those, like subdirectories() (and newestSource()
// in build_sync.mjs): there are none in the source directories, and one could form a cycle.
function isDirectory(file) {
  try {
    return lstatSync(file).isDirectory()
  } catch {
    return false
  }
}
