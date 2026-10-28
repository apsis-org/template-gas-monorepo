# Google Apps Script Monorepo Template

**English** | [日本語](README.ja.md)

A template for managing multiple Google Apps Script (GAS) projects in one repository. You write TypeScript locally, bundle it with esbuild, and push it to Apps Script with clasp.

## Toolchain

| Tool                                                       | Role                                          |
| ---------------------------------------------------------- | --------------------------------------------- |
| [clasp](https://github.com/google/clasp)                   | Pulls and pushes Apps Script projects         |
| TypeScript                                                 | Type checking                                 |
| [esbuild](https://esbuild.github.io/)                      | Bundles each project into a single file       |
| [esbuild-gas-plugin](https://github.com/mahaker/esbuild-gas-plugin) | Makes the bundle runnable on Apps Script |
| [Biome](https://biomejs.dev/)                              | Linter and formatter                          |
| [Vitest](https://vitest.dev/)                              | Test runner                                   |
| [lefthook](https://github.com/evilmartians/lefthook)       | Runs Biome on staged files before each commit |

## Repository structure

```
.
├── packages/
│   ├── _common/        ← code shared by every project
│   │   ├── config/     ← esbuild.config.js copied into new projects
│   │   └── src/
│   └── sample/         ← a minimal sample project (delete it when you no longer need it)
├── scripts/            ← clone / build / deploy / open scripts
├── template/           ← README.md copied into new projects
└── esbuild.config.js   ← base esbuild settings shared by every project
```

Each directory under `packages/` (except `_common`) is one Apps Script project.

```
packages/<projectName>/
├── src/                ← source code (TypeScript)
├── dist/               ← build output pushed to Apps Script (gitignored)
├── appsscript.json     ← Apps Script manifest (time zone, OAuth scopes, …)
├── esbuild.config.js   ← entry point and output file
├── package.json        ← build / deploy commands and spreadsheet URLs
├── .clasp.dev.json     ← script ID of the development environment (gitignored)
└── .clasp.prod.json    ← script ID of the production environment (gitignored)
```

## Prerequisites

- [Node.js 24](https://nodejs.org/)
- [pnpm 12+](https://pnpm.io/installation)
- [clasp](https://github.com/google/clasp) (`npm install -g @google/clasp`)
- A Google account that can use Apps Script

## Setup

1. Install the dependencies. This also enables the git hooks.

   ```bash
   pnpm install
   ```

2. Log in to Google with clasp. To switch accounts, run `clasp logout` first.

   ```bash
   clasp login
   ```

3. Turn on **Google Apps Script API** at <https://script.google.com/home/usersettings>.

## Adding a project

`pnpm clone` pulls an Apps Script project into `packages/`. Use it for a new project as well: create the Apps Script project first (for a script bound to a spreadsheet, open the spreadsheet and choose **Extensions → Apps Script**), then copy its script ID from **Project Settings**.

```bash
pnpm clone
Project name (e.g. my-project): <projectName>
Script ID: <scriptId>
dev spreadsheet URL (optional): ...
prod spreadsheet URL (optional): ...
```

- Project names are kebab-case (lowercase letters, digits, and hyphens). If the name is invalid or already used, you are asked again
- The downloaded `.gs` / `.js` / `.html` files are moved into `src/`
- `.clasp.json` is split into `.clasp.prod.json` and `.clasp.dev.json`. **Both point at the script you cloned**, so set the development script ID in `.clasp.dev.json` yourself
- `esbuild.config.js`, `README.md`, and `package.json` are generated. The spreadsheet URLs go into `package.json` and `README.md`

Then:

1. Rename the entry file to `src/index.ts` (or change `entryPoints` in `esbuild.config.js`). The entry file must be in `src/` and the output file in `dist/`
2. Expose the functions that Apps Script calls (menus, triggers, `onOpen`, …) on `global`. See `packages/sample/src/index.ts`

   ```typescript
   declare const global: { [x: string]: unknown };

   global.onOpen = onOpen;
   ```

## Building

```bash
cd packages/<projectName>
pnpm build
```

- esbuild bundles `src/` into one file in `dist/` and prepends a banner warning against edits in the script editor
- `appsscript.json` and every `.html` file under `src/` are copied into `dist/`. HTML files are flattened into `dist/` regardless of their subdirectory, so file names must be unique

`pnpm build:time` shows when the project was last built and whether `src/` has commits newer than that build. Uncommitted edits are not taken into account.

To build every project at once, run `pnpm build` in the repository root.

## Deploying

> [!WARNING]
> Deploying **overwrites** the code in Apps Script. Build first.

1. Put the script ID of each environment in `.clasp.dev.json` / `.clasp.prod.json`. You can find it in **Project Settings** of the Apps Script editor.

   ```json
   {
     "scriptId": "your-script-id",
     "rootDir": "./dist"
   }
   ```

2. Deploy from the project directory.

   ```bash
   cd packages/<projectName>
   pnpm deploy:dev    # development
   pnpm deploy:prod   # production
   ```

   The matching `.clasp.<env>.json` is copied to `.clasp.json` and `dist/` is pushed with `clasp push`.

## Opening the spreadsheet

Set the URLs in `spreadsheetUrls` of the project's `package.json` (`pnpm clone` fills them in for you).

```json
"spreadsheetUrls": {
  "dev": "https://docs.google.com/spreadsheets/d/.../edit",
  "prod": "https://docs.google.com/spreadsheets/d/.../edit"
}
```

```bash
cd packages/<projectName>
pnpm open:dev
pnpm open:prod
```

## Shared code

`packages/_common/src/` holds helpers you can import from any project. esbuild bundles what you import into each project.

```typescript
import { getSheet } from "../../_common/src/spreadsheet";
```

| File                       | Contents                                                    |
| -------------------------- | ----------------------------------------------------------- |
| `spreadsheet.ts`           | Reading and writing sheets, A1 notation, script properties |
| `http.ts` / `utils.ts`     | Calling external APIs, current date and month               |
| `date.ts`                  | `YYYY-MM-DD` date helpers                                   |
| `logger.ts`                | Logs in a consistent format                                 |
| `trigger.ts`               | Recreating a daily time-driven trigger                      |
| `setupScriptProperties.ts` | Registering missing script properties with a dummy value    |

## Commands

Run in the repository root:

```bash
pnpm clone          # add a project
pnpm build          # build every project
pnpm check          # lint and format check (Biome)
pnpm lint           # lint only
pnpm format         # format
pnpm typecheck      # tsc --noEmit
pnpm test           # Vitest (single run)
pnpm test:watch     # Vitest (watch mode)
```

Run in `packages/<projectName>`:

```bash
pnpm build
pnpm build:time
pnpm deploy:dev / pnpm deploy:prod
pnpm open:dev / pnpm open:prod
```

## Testing

Tests are `*.test.ts` files next to the code. Apps Script services (`SpreadsheetApp`, `UrlFetchApp`, …) do not exist in Node.js, so either keep the logic in plain functions (see `packages/sample/src/greeting.ts`) or replace the services with `vi.stubGlobal` (see `packages/_common/src/http.test.ts`).

## Troubleshooting

### `User has not enabled the Apps Script API`

Turn on **Google Apps Script API** at <https://script.google.com/home/usersettings> and deploy again. It can take a few minutes to take effect.

### `.clasp.dev.json not found`

The `.clasp.*.json` files are gitignored, so they are missing right after cloning this repository. Create them as shown in [Deploying](#deploying).

## License

[MIT](LICENSE)
