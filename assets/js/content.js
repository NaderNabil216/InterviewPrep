// content.js — loads content packs, diffs disk manifest against the stored snapshot,
// and merges updates in without ever touching Store progress state.
import { Store, deriveSnapshot } from './store.js';

async function fetchJSON(url) {
  const bust = url.includes('?') ? '&' : '?';
  const res = await fetch(url + bust + 't=' + Date.now());
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

async function loadManifestAndPacks(manifestUrl = 'content/manifest.json') {
  const manifest = await fetchJSON(manifestUrl);
  const packs = {};
  for (const p of manifest.packs) {
    packs[p.id] = await fetchJSON('content/' + p.file);
  }
  const plans = {};
  for (const planMeta of manifest.plans || []) {
    plans[planMeta.id] = await fetchJSON('content/' + planMeta.file);
  }
  return { manifest, packs, plans };
}

function flattenItems(packs) {
  const all = [];
  for (const packId of Object.keys(packs)) {
    const pack = packs[packId];
    for (const item of pack.items) all.push(item);
  }
  return all;
}

// Builds exactly the record that gets persisted — one copy of every item, inside packs — and then
// derives items/byId in memory so every view sees the shape it already expects. The derived fields
// are never written to disk; deriveSnapshot rebuilds them on each load.
function buildSnapshot(manifest, packs, plans) {
  return deriveSnapshot({
    version: manifest.version,
    generatedAt: manifest.generatedAt,
    stackSnapshot: manifest.stackSnapshot || {},
    releases: manifest.releases || [],
    packMeta: manifest.packs,
    packs,          // packId -> { id, title, track, items: [...] }
    plans,          // planId -> plan doc
    fetchedAt: new Date().toISOString(),
  });
}

// Boot: render from stored snapshot instantly if present; otherwise do the first fetch.
export async function boot(onStorageFailure) {
  let snapshot = await Store.getSnapshot();
  if (!snapshot) {
    const { manifest, packs, plans } = await loadManifestAndPacks();
    snapshot = buildSnapshot(manifest, packs, plans);
    // A first-boot storage failure must not end the session — the in-memory copy still works for
    // this tab, so report it and carry on rather than throwing the candidate out of the app.
    try {
      await Store.setSnapshot(snapshot);
    } catch (e) {
      if (onStorageFailure) onStorageFailure(e); else throw e;
    }
  }
  return snapshot;
}

// Background check: fetch disk manifest only (cheap) and compare version + per-pack checksums
// against the stored snapshot. Returns a diff descriptor; does NOT mutate the snapshot.
export async function checkForUpdates(current) {
  const snapshot = current || await Store.getSnapshot();
  if (!snapshot) return null;
  const diskManifest = await fetchJSON('content/manifest.json');
  if (diskManifest.version === snapshot.version) return { hasUpdates: false };

  // Need full pack contents to compute an accurate item-level diff.
  const { packs: diskPacks, plans: diskPlans } = await loadManifestAndPacks();
  const diskItems = flattenItems(diskPacks);
  const diskById = {}; for (const it of diskItems) diskById[it.id] = it;

  const added = [];
  const updated = [];
  const removedIds = [];

  for (const it of diskItems) {
    const old = snapshot.byId[it.id];
    if (!old) added.push(it);
    else if ((it.updatedIn && it.updatedIn !== old.updatedIn) || JSON.stringify(it) !== JSON.stringify(old)) {
      updated.push(it);
    }
  }
  for (const id of Object.keys(snapshot.byId)) {
    if (!diskById[id]) removedIds.push(id);
  }

  const newReleases = (diskManifest.releases || []).filter(r =>
    !(snapshot.releases || []).some(sr => sr.version === r.version)
  );

  return {
    hasUpdates: added.length > 0 || updated.length > 0 || removedIds.length > 0 || diskManifest.version !== snapshot.version,
    fromVersion: snapshot.version,
    toVersion: diskManifest.version,
    added, updated, removedIds, newReleases,
    _diskManifest: diskManifest, _diskPacks: diskPacks, _diskPlans: diskPlans,
  };
}

// Apply a previously-computed diff: replace the snapshot wholesale with disk content.
// Progress/session/plan-ticks in Store are untouched because they live in a separate namespace
// keyed by item id, and ids are permanent across releases.
// Throws StorageFailure if the new snapshot cannot be persisted, leaving the previous one intact —
// the candidate stays on the library they had rather than silently losing offline access.
export async function applyUpdate(diff) {
  const snapshot = buildSnapshot(diff._diskManifest, diff._diskPacks, diff._diskPlans);
  await Store.setSnapshot(snapshot);
  return snapshot;
}

export function getTrackLabel(trackId, snapshot) {
  const pack = snapshot.packMeta.find(p => p.track === trackId || p.id === trackId);
  return pack ? pack.title : trackId;
}
