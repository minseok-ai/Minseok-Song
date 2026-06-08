# Minseok Song Site

Astro + React + Vercel foundation for the Minseok Song / A1 Firms site.

This repository is being built in layers. The current implemented scope is:

- Layer 0: project foundation, SSR-ready Astro, React integration, Vercel adapter.
- Layer 1: content contracts for navigation, pages, blocks, projects, writings, and contacts.
- Layer 2/3 draft: editorial shell, A1 Firm visual tokens, `/A1-Firm`
  product page for the standalone A1trategize app, and a password-protected
  writing admin.

Deferred layers:

- Interactions.
- GitHub App authentication.
- Git-backed draft and publish flow.

## Commands

```sh
npm run validate:content
npm run dev
npm run build
```

## Domains

This repository powers the portfolio site:

```txt
minseoksong.com
```

A1trategize is operated as a separate product application:

```txt
a1trategize.com
```

The portfolio links to A1trategize but does not mount its frontend or proxy its
API. App login, user sessions, provider keys, exports, and product data should
be managed by the A1trategize application repository/deployment.

## Admin Login

The writing desk lives at `/admin/writings` and is protected by an HttpOnly
session cookie. Admin login is designed to use GitHub OAuth first. Register a
GitHub OAuth App or GitHub App with this callback URL:

```txt
https://minseoksong.com/api/admin/github/callback
```

For local development, add the matching localhost callback URL for the dev port
you are using, for example:

```txt
http://localhost:4321/api/admin/github/callback
```

Set these values in `.env`:

```sh
GITHUB_OAUTH_CLIENT_ID=
GITHUB_OAUTH_CLIENT_SECRET=
ADMIN_GITHUB_IDS=
ADMIN_GITHUB_LOGINS=
SESSION_SECRET=
```

`ADMIN_GITHUB_IDS` is preferred because numeric GitHub user IDs are stable.
`ADMIN_GITHUB_LOGINS` is accepted as a convenience fallback. Both variables are
comma-separated allowlists.

The legacy password form is still available as a local fallback when these
values are set:

```sh
ADMIN_USERNAME=
ADMIN_PASSWORD=
SESSION_SECRET=
```

`SESSION_SECRET` should be at least 32 characters. You can generate one with:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

In development, the writing API saves JSON files to `src/content/writings`.
Production file publishing is intentionally disabled until the Git-backed
publish flow is connected.

The A1trategize launch URL can be configured for copy and links:

```sh
A1TRATEGIZE_URL=https://a1trategize.com
```

## Layer 1 Contract

The first navigation contract is:

1. About
2. A1 Firms
3. Projects
4. Writings
5. Contacts

`A1 Firms` is routed to `/A1-Firm`. That route is a public product page for
A1trategize and links out to `https://a1trategize.com`.

About uses a Notion-style block model. `deckEmbed` is included now so Canva,
presentation, and artifact embeds can be managed by data later instead of by
hand-editing iframe code.
