import { useMemo, useState } from 'react';
import { PAGE_LABEL_PRESETS } from './blockLabels';

const PRESET_KEY_SET = new Set(PAGE_LABEL_PRESETS.map((p) => p.key));

type Props = {
  labels: Record<string, string>;
  onChange: (labels: Record<string, string>) => void;
};

export function PageLabelsEditor({ labels, onChange }: Props) {
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');

  const merged = useMemo(() => ({ ...labels }), [labels]);

  function setKey(key: string, value: string) {
    const next = { ...merged, [key]: value };
    if (!value.trim()) delete next[key];
    onChange(next);
  }

  const customEntries = useMemo(() => {
    return Object.entries(merged).filter(([k]) => !PRESET_KEY_SET.has(k));
  }, [merged]);

  function addCustomRow() {
    const key = `custom_${Date.now().toString(36)}`;
    onChange({ ...merged, [key]: '' });
  }

  function setCustomKey(oldKey: string, newKey: string) {
    if (!newKey.trim() || newKey === oldKey) return;
    const v = merged[oldKey] ?? '';
    const next = { ...merged };
    delete next[oldKey];
    next[newKey.trim()] = v;
    onChange(next);
  }

  function removeCustomKey(key: string) {
    const next = { ...merged };
    delete next[key];
    onChange(next);
  }

  function applyJson() {
    try {
      const p = JSON.parse(jsonText);
      if (typeof p !== 'object' || p === null || Array.isArray(p)) {
        setJsonError('Labels must be a JSON object');
        return;
      }
      const flat: Record<string, string> = {};
      for (const [k, v] of Object.entries(p)) {
        if (typeof v === 'string') flat[k] = v;
        else flat[k] = String(v ?? '');
      }
      onChange(flat);
      setJsonError('');
    } catch {
      setJsonError('Invalid JSON');
    }
  }

  const hasAny = Object.keys(merged).length > 0;

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-600 leading-snug">
        Optional wording for titles and labels on this page. Leave blank to use defaults where the site provides them.
      </p>
      {!hasAny && <p className="text-xs text-slate-500 italic">No custom labels yet — fill only what you need.</p>}

      <div className="space-y-3">
        {PAGE_LABEL_PRESETS.map((preset) => (
          <div key={preset.key}>
            <label className="block text-xs font-medium text-slate-700">{preset.title}</label>
            <p className="text-[11px] text-slate-500 mb-1">{preset.hint}</p>
            <input
              type="text"
              className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg"
              value={merged[preset.key] ?? ''}
              onChange={(e) => setKey(preset.key, e.target.value)}
              aria-label={preset.title}
            />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600">Other labels</span>
          <button type="button" className="text-xs px-2 py-1 border border-slate-300 rounded hover:bg-slate-50" onClick={addCustomRow}>
            Add custom label
          </button>
        </div>
        {customEntries.map(([key, val]) => (
          <div key={key} className="border border-slate-200 rounded-lg p-2 space-y-1">
            <input
              className="w-full text-xs font-mono px-2 py-1 border border-slate-200 rounded"
              value={key}
              onChange={(e) => setCustomKey(key, e.target.value)}
              aria-label="Label key"
            />
            <input
              className="w-full text-sm px-2 py-1 border border-slate-200 rounded"
              value={val}
              onChange={(e) => setKey(key, e.target.value)}
              aria-label="Label value"
            />
            <button type="button" className="text-xs text-red-600" onClick={() => removeCustomKey(key)}>
              Remove
            </button>
          </div>
        ))}
      </div>

      <details
        className="rounded-lg border border-slate-200 bg-slate-50"
        onToggle={(e) => {
          const el = e.currentTarget;
          if (el.open) {
            setJsonText(JSON.stringify(merged, null, 2));
            setJsonError('');
          }
        }}
      >
        <summary className="px-3 py-2 text-xs font-medium text-slate-700 cursor-pointer">Advanced: edit as JSON</summary>
        <div className="px-3 pb-3 space-y-2 border-t border-slate-200 pt-2">
          <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            For support or bulk edits. Invalid JSON will not apply.
          </p>
          <textarea
            className="w-full min-h-[120px] font-mono text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            aria-label="Page labels JSON advanced"
          />
          {jsonError && <p className="text-xs text-red-600">{jsonError}</p>}
          <button type="button" className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg bg-white hover:bg-slate-50" onClick={applyJson}>
            Apply JSON
          </button>
        </div>
      </details>
    </div>
  );
}
