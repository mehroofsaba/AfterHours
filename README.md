# AFTERHOURS

A private antique archive for memories, unfinished thoughts and unsent letters. Three rooms, one candlelit world, and a small open-weight language model that runs entirely in your browser.

## Rooms

- **The Memory Cabinet** – save memories as keepsakes with a date, mood and tags; organise them in drawers (People, Places, Versions of Me, Almost Forgotten, or your own); search and filter by date, drawer and tag; favourite and archive. AI can turn a memory into a poem, literary passage or polished keepsake, saved *beside* the original.
- **The Lost & Found** – leave a thought without choosing a category; fragments gather as paper cards you can search and filter. Optionally find themes, get reflective prompts or hear it said differently. Link related fragments, see local "echoes" of shared words with other entries, and move a fragment into the Cabinet or the Unsent Archive.
- **The Unsent Archive** – write letters you never send. Drafts autosave, letters are sealed with wax, and AI can rewrite a draft as a poem, a letter or something more reflective, shown side by side with your words. Nothing is ever sent anywhere.

## Details

The landing page swaps the pointer for a small candle whose flame sits on the real pointer position (fine pointers only; touch devices keep the normal cursor). Settings include reading size and a cards/list layout for memories.

## Principles

AI output is always a suggestion you can keep, edit, or ignore. Your original text is never overwritten unless you press *Replace*, and even then the earlier words are kept as a version. AI never interprets your personality or mental state; prompts forbid it and the UI doesn't offer it. Loading, downloading and failure are shown as they are. There are no fake responses.

## Stack

React 19 · Vite · Tailwind CSS 4 · Motion · Transformers.js (`@huggingface/transformers`) · IndexedDB · Lucide · React Router (hash routing, so a static host needs no rewrites).

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # outputs dist/
npm run preview
```

If `npm install` fails while fetching `onnxruntime-node` binaries on a restricted network, use `npm install --ignore-scripts`. The browser build never uses that package.

## Local AI

Inference runs in a Web Worker through Transformers.js, on WebGPU when available and WebAssembly otherwise. The model downloads on first use from the Hugging Face Hub and is cached by the browser (Cache API), so later sessions load from disk. No API key, no inference server, and your writing never leaves the device.

Selectable models (`src/lib/models.js`):

| Model | Approx. download | Licence |
| --- | --- | --- |
| SmolLM2 360M Instruct (default) | ~0.3 GB | Apache-2.0 |
| Qwen2.5 0.5B Instruct | ~0.4 GB | Apache-2.0 |
| SmolLM2 135M Instruct | ~0.1 GB | Apache-2.0 |
| Phi-3.5 mini (WebGPU only) | ~2 GB | MIT |

**Before you submit, verify** each model card's licence, the ONNX repo id and its real download size, and test speed on an ordinary laptop. Open-weight is not automatically open-source, so confirm it meets the hackathon's definition. Sizes above are estimates, not measurements.

Honest network note: local inference does not mean zero network access. The page loads Google Fonts, and the model weights (and possibly the ONNX runtime WebAssembly files) are fetched once.

## Privacy and storage

Memories, fragments, letters, drawers and settings live in IndexedDB in this browser profile only. Clearing browser data or switching devices loses them, so **Settings → Export archive** writes a JSON backup and **Import archive** merges one back. There are no accounts and no analytics.

## Deploy on Render (static site)

Push to GitHub, then create a **Static Site** with build command `npm install && npm run build` and publish directory `dist` (a `render.yaml` is included). Hash routing means no rewrite rules are needed.

## Limitations

Small models write plainly and sometimes drift from the source, which is why every result is editable and optional. The first AI action needs a download. Echoes are lexical (shared words), not semantic. Data is per-browser. Some browsers disable IndexedDB in private mode; the app warns when that happens.

## Structure

```
src/
  lib/        db, store, ai client + worker, prompts, models, echoes, import/export
  components/ Shell, Art (SVG scenes, wax seal, motifs), AIPanel, MemoryEditor, ui
  pages/      Landing, Archive, Cabinet, Lost, Unsent, Settings
```

MIT licensed.
