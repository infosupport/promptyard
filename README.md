# Promptyard

Promptyard is a CLI tool that installs agents, prompts, and skills from Git repositories into your local project. It supports [Claude](https://claude.ai/code), [GitHub Copilot](https://github.com/features/copilot), and [OpenCode](https://opencode.ai) as deployment targets.

## Installation

Download the latest binary for your platform from the [GitHub Releases page](https://github.com/willem-meints/promptyard/releases) and place it somewhere on your `PATH`.

| Platform       | File                    |
|----------------|-------------------------|
| Linux x64      | `promptyard-linux-x64`  |
| Linux ARM64    | `promptyard-linux-arm64`|
| macOS (Apple Silicon) | `promptyard-mac-arm64` |
| Windows x64    | `promptyard-win-x64.exe`|
| Windows ARM64  | `promptyard-win-arm64.exe` |

## Usage

### Initialize a project

Run this once in the root of your project to set up Promptyard:

```bash
promptyard init --tool <claude|copilot|opencode>
```

This creates a `.promptyard/` directory with your configuration.

### Add a repository

Install agents and skills from a Git repository:

```bash
promptyard add <name> <url>
```

Example:

```bash
promptyard add my-agents https://github.com/example/ai-agents.git
```

Use `--force` to overwrite existing files without being prompted.

### Update repositories

Pull the latest changes and redeploy:

```bash
promptyard update            # updates all repositories
promptyard update <name>     # updates a specific repository
```

### Remove a repository

Unregister a repository from the project:

```bash
promptyard remove <name>
```

Note: deployed files are left in place and must be removed manually.

## Contributing

Contributions are welcome. Bun is required to build and test the project.

```bash
# Install dependencies
bun install

# Run tests
bun test

# Type-check
bun run typecheck

# Lint
bun run lint
```

Follow the red-green-refactor approach: write a failing test first, make it pass, then clean up. Keep tests focused — one test per behavior.

When adding a new deployment target, implement the `Deployer` interface in `src/deployment/` and register it in `src/deployment/index.ts`.

Open a pull request against `main` with a clear description of what changed and why.

## Authors

- Willem Meints
- Mika Krooswijk
