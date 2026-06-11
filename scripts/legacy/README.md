# Legacy Content Scripts

These scripts are one-off content migration helpers kept for audit history.
They directly rewrite JSON files under `src/content`, so do not wire them into
`npm run dev`, `npm run build`, or deployment hooks.

Use `scripts/sync-a1trategize.cjs` for the active local A1trategize mock sync.
