import { Store } from '../store.js';
import { toast, navigate } from '../app.js';

export function renderSettings(el, { snapshot }) {
  const settings = Store.getSettings();

  el.innerHTML = `
    <div class="eyebrow">Settings</div>
    <h1>Settings & data</h1>

    <div class="grid grid-2" style="margin-top:16px; align-items:start;">
      <div class="card">
        <h3>Interview date</h3>
        <p class="faint">Drives the dashboard countdown.</p>
        <input type="date" id="interview-date" value="${settings.interviewDate || ''}" style="background:var(--bg-card); border:1px solid var(--border); color:var(--text); padding:8px; border-radius:8px;">
      </div>

      <div class="card">
        <h3>Theme</h3>
        <p class="faint">Also toggleable from the 🌙 icon in the top bar.</p>
        <select id="theme-select" style="background:var(--bg-card); border:1px solid var(--border); color:var(--text); padding:8px; border-radius:8px;">
          <option value="dark" ${settings.theme==='dark'?'selected':''}>Dark</option>
          <option value="light" ${settings.theme==='light'?'selected':''}>Light</option>
        </select>
      </div>

      <div class="card">
        <h3>Code runner</h3>
        <p class="faint">DSA <strong>Run</strong> executes your code on the free <a href="https://ce.judge0.com" target="_blank" rel="noopener">Judge0 CE</a> public instance. No account, no API key, and no payment details are needed — press Run on any DSA problem and it just works.</p>
      </div>

      <div class="card">
        <h3>Export progress</h3>
        <p class="faint">Downloads a JSON file with your drill schedule, notes, plan checkmarks, and mock results. Content itself is not included — it's re-fetched from disk.</p>
        <button class="btn btn--primary" id="export-btn">⬇ Export progress.json</button>
      </div>

      <div class="card">
        <h3>Import progress</h3>
        <p class="faint">Restores progress from a previously exported file. This overwrites current progress.</p>
        <input type="file" id="import-file" accept="application/json">
      </div>

      <div class="card">
        <h3>Reset progress</h3>
        <p class="faint">Clears drill schedule, notes, plan checkmarks, and mock results. Content is untouched.</p>
        <button class="btn btn--danger" id="reset-progress-btn">Reset progress</button>
      </div>

      <div class="card">
        <h3>Reset content snapshot</h3>
        <p class="faint">Forces a full re-fetch of the manifest and all packs from disk on next load. Progress is untouched.</p>
        <button class="btn btn--danger" id="reset-content-btn">Reset content snapshot</button>
      </div>
    </div>

    <div class="card" style="margin-top:16px;">
      <h3>About this snapshot</h3>
      <p class="faint">Version <strong>${snapshot.version}</strong> · generated ${snapshot.generatedAt} · ${snapshot.items.length} items across ${snapshot.packMeta.length} packs.</p>
    </div>
  `;

  el.querySelector('#interview-date').addEventListener('change', (e) => {
    Store.setSettings({ interviewDate: e.target.value || null });
    toast('Interview date saved.');
  });
  el.querySelector('#theme-select').addEventListener('change', (e) => {
    Store.setSettings({ theme: e.target.value });
    location.reload();
  });
  el.querySelector('#export-btn').addEventListener('click', () => {
    const bundle = Store.exportProgress();
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `android-interview-prep-progress-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Progress exported.');
  });
  el.querySelector('#import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        // Pass the live snapshot so a bundle exported before the expansion has its positional
        // plan ticks re-anchored to material, exactly as boot does.
        Store.importProgress(JSON.parse(reader.result), snapshot);
        toast('Progress imported. Reloading…');
        setTimeout(() => location.reload(), 800);
      } catch (err) {
        toast('Import failed: ' + err.message);
      }
    };
    reader.readAsText(file);
  });
  el.querySelector('#reset-progress-btn').addEventListener('click', () => {
    if (confirm('This clears all drill history, notes, plan progress, and mock results. Continue?')) {
      Store.resetProgress();
      toast('Progress reset.');
      navigate('dashboard');
    }
  });
  el.querySelector('#reset-content-btn').addEventListener('click', async () => {
    if (confirm('This re-fetches the manifest and all packs from disk on next load. Continue?')) {
      // The snapshot lives in IndexedDB now — wait for the delete before reloading, or the reload
      // can race it and boot straight back onto the record we just tried to clear.
      await Store.resetContentSnapshot();
      toast('Content snapshot cleared. Reloading…');
      setTimeout(() => location.reload(), 600);
    }
  });
}
