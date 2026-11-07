# TheProfilez

A minimal personal profile / link-in-bio site, built on Cloudflare.

## About

TheProfilez is a lightweight personal profile page. It's designed as a simple, fast, single-page presence you can point your bio links at.

## Tech stack

- [Cloudflare](https://cloudflare.com) — hosting (Workers / Pages)
- [TypeScript](https://www.typescriptlang.org) — language
- [Vitest](https://vitest.dev) — testing
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) — development & deployment

## Project structure

```
theprofilez/
├── README.md
├── wrangler.jsonc          # Cloudflare Workers configuration
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript configuration
├── vitest.config.ts        # Vitest configuration
├── .dev.vars.example       # Example environment variables
├── .gitignore              # Git ignore rules
├── package-lock.json       # Locked dependency versions
├── assets/                 # Static assets
├── migrations/             # Database migrations
├── seed/                   # Seed data
└── src/                    # Source code
    ├── index.ts            # Public entry point
    ├── env.ts              # Environment bindings
    ├── public/             # Public-facing routes
    │   └── index.ts
    ├── admin/              # Admin routes
    │   ├── api.ts
    │   └── routes.ts
    └── lib/                # Shared libraries
        ├── access-jwt.ts
        ├── cache.ts
        ├── csrf.ts
        ├── db.ts
        ├── headers.ts
        ├── i18n.ts
        ├── sanitize.ts
        ├── slug.ts
        └── validate.ts
```

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [pnpm](https://pnpm.io/) (recommended)
- A [Cloudflare](https://cloudflare.com) account
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### Install

```bash
pnpm install
```

### Configure environment

Copy the example environment file and fill in your values:

```bash
cp .dev.vars.example .dev.vars
```

### Develop locally

```bash
pnpm run dev
```

### Deploy

```bash
pnpm run deploy
```

### Run tests

```bash
pnpm run test
```

## License

MIT
