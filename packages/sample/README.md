## Overview

A minimal sample project. It adds a **Sample** menu to a spreadsheet; **Write a greeting** writes a greeting with the current date to the selected cell.

Use it to see how a project is laid out, then replace it with your own code or delete this directory.

## Features

- `onOpen`: adds the **Sample** menu when the spreadsheet is opened
- `writeGreeting`: writes a greeting to the active cell

## Triggers

None. `onOpen` is a simple trigger and runs without setup.

## Environments

### Production
- [Spreadsheet]()
- [Apps Script]()

### Development
- [Spreadsheet]()
- [Apps Script]()

## How to verify

1. Deploy with `pnpm deploy:dev`
2. Reload the spreadsheet and choose **Sample** → **Write a greeting**
3. The selected cell shows `Hello, <your email>! (<date>)`

## Development

See the [root README](../../README.md) for the development workflow.
