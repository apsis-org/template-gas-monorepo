# AGENTS.md

Guidelines for coding agents working in this repository. This file is the source of truth; `CLAUDE.md` only imports it with `@AGENTS.md`.

## Project overview

A Google Apps Script (GAS) monorepo template. TypeScript is bundled with esbuild and pushed to Apps Script with clasp. See [README.md](README.md) for setup and the full workflow.

## Commands

```bash
# Repository root
pnpm clone          # pull an Apps Script project into packages/ (interactive)
pnpm build          # build every project
pnpm check          # Biome lint + format check
pnpm format         # Biome format
pnpm typecheck      # tsc --noEmit
pnpm test           # Vitest

# packages/<projectName>
pnpm build
pnpm deploy:dev     # overwrites the development script
pnpm deploy:prod    # overwrites the production script
```

## Architecture

| Path                       | Role                                                         |
| -------------------------- | ------------------------------------------------------------ |
| `packages/<projectName>/`  | One Apps Script project                                      |
| `packages/_common/src/`    | Shared helpers, bundled into each project that imports them  |
| `packages/_common/config/` | `esbuild.config.js` copied into new projects by `pnpm clone` |
| `scripts/`                 | clone / build / build-time / deploy / open                   |
| `template/README.md`       | README copied into new projects by `pnpm clone`              |
| `esbuild.config.js`        | Base esbuild settings every project extends                  |

### Build and deploy flow

1. `scripts/build.js` bundles the project with its `esbuild.config.js`, copies `appsscript.json` into `dist/`, and copies every `.html` under `src/` into `dist/` (flattened)
2. `scripts/deploy.js` copies `.clasp.<env>.json` to `.clasp.json` and runs `clasp push`. `rootDir` is `./dist`, so only the build output is pushed

## Development guidelines

### Paths

- Source code must be under `src/`; build output must be under `dist/`. `scripts/build.js` and the clasp `rootDir` depend on this
- HTML files are flattened into `dist/`, so their names must be unique within a project

### esbuild

Keep these settings in the root `esbuild.config.js`; Apps Script needs them.

- `target: "es2019"` and `format: "iife"`
- `plugins: [GasPlugin]`
- `treeShaking: false`

### Exposing functions to Apps Script

Functions called by Apps Script (simple triggers, menu items, installable triggers) must be assigned to `global` in the entry file. Follow `packages/sample/src/index.ts`.

```typescript
declare const global: { [x: string]: unknown };

global.onOpen = onOpen;
```

### Shared code

- Import from `_common` with relative paths (`../../_common/src/spreadsheet`)
- Keep `_common` free of anything specific to one project or one external service

### Tests

- Put `*.test.ts` next to the code
- Apps Script services do not exist in Node.js. Keep logic in plain functions, or stub the services with `vi.stubGlobal`

### Versioning

- Commit messages follow Conventional Commits. Mark breaking changes with `feat!:` / `fix!:` or `BREAKING CHANGE:` in the body
- The whole monorepo shares one version: the root `package.json`. When bumping it, update every `packages/*/package.json` to the same value. `pnpm check` (`scripts/check-versions.js`) fails on a mismatch, and `pnpm clone` copies the root version into new projects

## Notes

- `.clasp*.json` under `packages/` is gitignored. Never commit script IDs
- `pnpm deploy:*` overwrites the code in Apps Script. Do not run it unless the user asks

### Handling sensitive files

**Do not read `.env` files** (`.env`, `.env.*`, and the same names in any subdirectory). Never commit them either. Secrets used at runtime belong in the script properties of each Apps Script project, not in the repository.

- `.env.example` may be read; it holds key names only
- To find out a value, ask the user instead of opening the file

For Claude Code, `.claude/settings.json` also blocks reading these files.
