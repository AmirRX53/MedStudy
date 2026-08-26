# MedStudy Dev Server

## Reproduce artifacts
No environment files or other uncommitted artifacts are required. Install the locked dependencies from the repository root with:

```bash
npm ci
```

## Run the dev server
The Vite default port is `5173`, but it was already occupied in this thread, so the live preview uses `5174`:

```bash
npm run dev -- --port 5174
```

The dev server is available at `http://localhost:5174/`.
