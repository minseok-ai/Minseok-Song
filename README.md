# Minseok Song Site

Astro + React + Vercel foundation for the Minseok Song / A1 Firms site.

This repository is being built in layers. The current implemented scope is:

- Layer 0: project foundation, SSR-ready Astro, React integration, Vercel adapter.
- Layer 1: content contracts for navigation, pages, blocks, projects, writings, and contacts.
- Layer 2/3 draft: editorial shell, A1 Firm visual tokens, and `/A1-Firm`
  route for mounting the existing A1trategize static app surface.

Deferred layers:

- Interactions.
- Admin mock.
- GitHub App authentication.
- Git-backed draft and publish flow.

## Commands

```sh
npm run validate:content
npm run dev
npm run build
```

## Layer 1 Contract

The first navigation contract is:

1. About
2. A1 Firms
3. Projects
4. Writings
5. Contacts

`A1 Firms` is routed to `/A1-Firm`. That route mounts the existing
`A1trategize/static` app files from `public/static` inside the site domain.
The mounted app calls `/api/*`; those requests are proxied to
`A1TRATEGIZE_API_ORIGIN` when configured.

About uses a Notion-style block model. `deckEmbed` is included now so Canva,
presentation, and artifact embeds can be managed by data later instead of by
hand-editing iframe code.
