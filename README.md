# CodeForge village (local integration branch)

This focused `web-coc` branch connects a Phaser village client to the CodeForge competitive-programming backend. CodeForge accounts link a verified Codeforces handle; accepted solves progress topic buildings and earn cosmetic-only coins and gems. Attacks use Codeforces problem solving rather than the original local raid simulation. It includes curated CodeForge static assets; bulk upstream game art and unrelated visual-test fixtures are omitted. See [local setup](docs/CODEFORGE-LOCAL.md).

The CodeForge entry point is `src/cp/main.ts`; its backend is in `backend/`. The underlying village source remains, but full upstream art assets are not part of this focused branch. The original project's reuse and asset-rights notice remains below and applies to any retained code and artwork.

## Original Crown & Clan project

A browser village-building and strategy game built with TypeScript, Phaser and Vite.
Build a village, train an army, raid campaign maps and replay battles. Saves stay in
your browser; there is no backend or account system.

**[Play the game](https://coc.teozeng.dev)**

## Run CodeForge locally

Use Node.js 24 (`nvm use` if you have nvm) and Docker Compose. From this repository root:

```sh
docker compose -p webcoc-codeforge -f docker-compose.codeforge.yml up --build -d
npm ci
npm run dev
```

Open <http://localhost:5174>. API runs at <http://localhost:8001>; the frontend proxies `/api` and `/ws/events` to it. See [local setup](docs/CODEFORGE-LOCAL.md) for migrations, port overrides, and shutdown. Do not use these development credentials for deployment.

## Check and build

```sh
npm run typecheck       # CodeForge frontend types
npm test -- tests/cp-client.test.ts tests/cp-village-boot.test.ts tests/cp-village-presentation.test.ts tests/cp-admin.test.ts
npm run build           # CodeForge production frontend bundle
npm run preview         # Serve dist/ locally
```

The upstream-wide `npm run check` and [original QA guide](docs/QA.md) also cover the retained Crown & Clan source, not just this CodeForge integration.

## Contribute

Start with [CONTRIBUTING.md](CONTRIBUTING.md), the [architecture guide](docs/ARCHITECTURE.md)
and the [documentation index](docs/README.md). [Release instructions](docs/RELEASE-VERIFICATION.md)
cover hosting, verification and rollback.

This is an independent educational fan project. Clash of Clans assets and trademarks
belong to Supercell. No project-wide open-source license has been granted; do not assume
code or bundled artwork is licensed for redistribution.
