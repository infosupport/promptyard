# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project instructions

This project builds a CLI tool that installs agents, prompts, and skills from Git repositories into a local directory and manages them. It supports three deployment targets: Claude, GitHub Copilot, and OpenCode.

## Testing

- Store test files next to implementation files as `<file>.test.ts`.
- Use `bun:test` with `describe`, `it`, and `expect`.
- Write one test case per behavior or state.
- Minimize tests to keep things maintainable.
- Run `bun test` to execute all tests.
- Run `bun test src/path/to/file.test.ts` to run a single test file.

## Building the project

- `bun run compile-windows-x64` for Windows x64
- `bun run compile-windows-arm` for Windows ARM64
- `bun run compile-mac` for macOS
- `bun run compile-linux-x64` for Linux x64
- `bun run compile-linux-arm64` for Linux ARM64

## Development workflow

- Use red-green-refactor: write a failing test, make it pass, then refactor.
- Run `bun run typecheck` to check type safety.
- Run `bun run lint` to check code style (Biome); `bun run lint:fix` to auto-fix.
- Run `bun run format` to format code (Biome); `bun run format:check` to verify.
- Run `bun test` after writing new code to verify it works.

## Key conventions

- Repository names are validated against `/^(?![0-9]+$)(?!-)[a-zA-Z0-9-]{0,63}(?<!-)$/i`.
- Project config lives in `.promptyard/settings.json` (tool) and `.promptyard/repositories.json` (repos).
- Zod is used for all config schema validation.
- Adding a new deployment target means implementing the `Deployer` interface and registering it in `src/deployment/index.ts`.
