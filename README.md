# Minseok Song Site

Astro + React + Vercel foundation for the Minseok Song / A1 Firms site.

This repository is being built in layers. The current implemented scope is:

- Layer 0: project foundation, SSR-ready Astro, React integration, Vercel adapter.
- Layer 1: content contracts for navigation, pages, blocks, projects, writings, and contacts.

Deferred layers:

- Design tokens and visual system.
- Page shell and renderers.
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

About uses a Notion-style block model. `deckEmbed` is included now so Canva,
presentation, and artifact embeds can be managed by data later instead of by
hand-editing iframe code.
