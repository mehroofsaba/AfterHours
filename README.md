# AFTERHOURS

*A private antique archive for memories, unfinished thoughts, and letters that were never sent.*

AFTERHOURS is a quiet, candlelit space for keeping the things that might otherwise be forgotten. It has three rooms to wander through, a collection of personal archives, and a small open-weight language model that runs locally in your browser.

No accounts. No cloud database for your writing. No pressure to turn every thought into something meaningful.

Just you, your words, and a place to keep them.

## The Rooms

### The Memory Cabinet

A place for memories worth keeping.

- Save memories as keepsakes with dates, moods, and tags.
- Organise entries into drawers: **People, Places, Versions of Me, Almost Forgotten**, or your own custom drawers.
- Search and filter memories by date, drawer, and tag.
- Favourite entries and archive the ones you want to put away.
- Use AI to reshape a memory into a poem, a literary passage, or a polished keepsake.

AI-generated versions sit beside the original, so the memory remains yours.

### The Lost & Found

For thoughts that don't fit neatly into a category.

- Leave fragments without deciding what they mean or where they belong.
- Search and filter fragments displayed as paper cards.
- Explore recurring themes, reflective prompts, or alternative ways of expressing a thought with optional AI assistance.
- Link related fragments and discover local *echoes* — entries connected by shared words.
- Move fragments into the Memory Cabinet or the Unsent Archive whenever they find their place.

Not everything needs a label. Some things just need somewhere to land.

### The Unsent Archive

For letters that were never meant to leave the page.

- Write letters you don't intend to send.
- Let drafts autosave as you write.
- Seal letters with wax and keep them in your private archive.
- Ask AI to reshape a draft into a poem, a letter, or a more reflective version.
- Compare the suggestion with your original words before deciding what to keep.

Nothing is sent to anyone. These letters are yours to write, change, keep, or leave unfinished.

## A Small World After Dark

AFTERHOURS is designed as one connected, atmospheric space rather than a collection of generic productivity screens.

- **Candle cursor:** On the landing page, a small candle follows the real pointer position on devices with fine pointers. Touch devices retain their normal interaction.
- **Quiet customisation:** Adjust reading size and choose between card and list layouts for memories.
- **An archive that stays yours:** Keep your writing organised without accounts or a remote journal database.

The interface is intentionally restrained: dark wine tones, aged paper, wax seals, and the feeling of opening a letter long after midnight.

## AI, Without Taking Over

AI in AFTERHOURS is a writing companion, not an authority on your life.

- Generated text is always optional. You can keep it, edit it, or ignore it.
- Your original writing is never silently overwritten. Replacing it preserves the earlier version.
- Prompts are designed to avoid diagnosing, profiling, or making claims about your personality or mental state.
- Loading, downloading, and failure states are shown honestly. The app does not pretend an operation succeeded when it did not.

The point isn't to let a model tell you what your memories mean. It's to give you another way to work with your own words.

## Local AI

AFTERHOURS uses [Transformers.js](https://huggingface.co/docs/transformers.js) to run supported language models in the browser.

Inference runs in a Web Worker, using WebGPU when available and WebAssembly otherwise, depending on the selected model and browser capabilities.

- Model weights are downloaded on first use from the Hugging Face Hub.
- Downloaded assets can be cached by the browser for subsequent sessions.
- No inference API key or separate AI inference server is required.
- Your writing is processed locally by the browser-based model rather than sent to a remote inference service.

**Local inference still requires network access** to obtain model weights and, where needed, runtime assets. The interface also loads Google Fonts. Browser caching and storage behaviour can vary.

### Available Models

The application includes model options configured in `src/lib/models.js`.

| Model | Approximate download size | Listed licence |
|---|---:|---|
| SmolLM2 360M Instruct | ~0.3 GB | Apache-2.0 |
| Qwen2.5 0.5B Instruct | ~0.4 GB | Apache-2.0 |
| SmolLM2 135M Instruct | ~0.1 GB | Apache-2.0 |
| Phi-3.5 mini | ~2 GB | MIT |

Sizes are approximate and can vary with the model files and runtime configuration. Phi-3.5 mini is intended for WebGPU-capable environments. Model availability and performance depend on browser support, device resources, and the configured model files.

Small models can produce generic text or drift from the original meaning. Every result is therefore presented as an editable suggestion rather than a replacement for your own judgement.

## Privacy & Storage

Your archive is stored locally in **IndexedDB**, within the browser profile you use.

This includes memories, fragments, letters, custom drawers, and settings.

- There are no user accounts.
- There is no remote journal database.
- The application does not include analytics.
- AI writing operations are designed to run in the browser rather than through a remote inference API.

**Your data is tied to your browser profile and device.** Clearing site data, losing browser storage, or switching devices can make your archive unavailable.

To protect your writing, use **Settings → Export archive** to create a JSON backup. You can restore or merge an archive using **Import archive**.

Private browsing modes and browser storage restrictions may limit IndexedDB availability. The application warns when storage is unavailable.

## Tech Stack

- **React 19** — interface and component architecture
- **Vite** — development server and production builds
- **Tailwind CSS 4** — styling
- **Motion** — interface animations
- **Transformers.js** — browser-based language model inference
- **IndexedDB** — local archive storage
- **Lucide** — icons
- **React Router** — hash-based navigation for static hosting

## Getting Started

### Prerequisites

- Node.js and npm
- A modern browser for the full application experience

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/mehroofsaba/AfterHours.git
cd AfterHours
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will print the local development URL, typically `http://localhost:5173`.

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

The production build is generated in `dist/`.

If installation fails while fetching optional `onnxruntime-node` binaries on a restricted network, `npm install --ignore-scripts` may help. Use this workaround only if necessary, and verify that the browser build still works correctly in your environment.

## Deployment

### Deployed Link - https://afterhours-cszu.onrender.com/

The configured build command for local host is:

```bash
npm install && npm run build
```

The publish directory is:

```text
dist
```

The application uses hash-based routing, so the static host does not need additional rewrite rules for its client-side routes.

## Project Structure

```text
AfterHours/
├── public/
├── src/
│   ├── components/
│   │   ├── AIPanel.jsx
│   │   ├── Art.jsx
│   │   ├── CandleCursor.jsx
│   │   ├── MemoryEditor.jsx
│   │   ├── Shell.jsx
│   │   └── ui.jsx
│   ├── lib/
│   │   ├── ai.js
│   │   ├── ai.worker.js
│   │   ├── archiveIO.js
│   │   ├── db.js
│   │   ├── echoes.js
│   │   ├── models.js
│   │   ├── prompts.js
│   │   ├── sample.js
│   │   ├── store.jsx
│   │   ├── toast.jsx
│   │   └── utils.js
│   ├── pages/
│   │   ├── Archive.jsx
│   │   ├── Cabinet.jsx
│   │   ├── Landing.jsx
│   │   ├── Lost.jsx
│   │   ├── Settings.jsx
│   │   └── Unsent.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── render.yaml
└── vite.config.js
```

## Limitations

- The first AI operation may require downloading a substantial model.
- Inference speed and output quality depend on the selected model and the user's device.
- AI suggestions can be imperfect or lose details from the original text.
- Echoes are based on shared words, not semantic similarity.
- Archive data is local to the browser profile; there is no automatic cross-device synchronisation.
- Browser storage restrictions can affect archive availability.

## Contributing

Contributions, thoughtful improvements, and bug reports are welcome. If you are changing the AI experience, please preserve the project's emphasis on user control, transparent behaviour, and keeping original writing intact.

## Licence

AFTERHOURS is released under the [MIT License](LICENSE).
