# ClawGuard

English | [中文](README.md)

Configuration management tool for OpenClaw, providing backup, restore, migration, and workspace management capabilities.

## Features

- **Three-Level Backup Strategy**: Config files / System files / Full workspace
- **Encryption Support**: AES-256-GCM encryption for sensitive data protection
- **Scheduled Tasks**: Automated backups with retention policies
- **Diff Comparison**: Compare backup versions
- **Web Interface**: Visual configuration management
- **Operation Logs**: Complete operation audit trail

## Quick Start

### Installation

```bash
# Using pnpm
pnpm install

# Build all packages
pnpm build
```

### CLI Usage

```bash
# Create a backup
clawguard backup --level config --name my-backup

# List backups
clawguard backup list

# Compare two backups
clawguard diff <backup-id-1> <backup-id-2>

# Verify backup integrity
clawguard verify <backup-id>

# Set up scheduled backup
clawguard schedule enable "daily-backup" "config" "0 2 * * *" 30

# View operation logs
clawguard logs --limit 50

# Start Web Gateway
clawguard gateway start --port 3000
```

### Web Interface

```bash
# Start development server
pnpm web

# Or access via Gateway after build
pnpm gateway
```

## Project Structure

```
packages/
├── core/          # Core library (backup, encryption, logs, etc.)
├── cli/           # Command line tool
├── gateway/       # Web API gateway
└── web/           # React frontend
```

## Tech Stack

- **Language**: TypeScript
- **Build**: tsup / Vite
- **Testing**: Vitest / Playwright
- **CLI**: cac
- **Web**: React + Tailwind CSS + Radix UI
- **API**: Hono

## Development Commands

```bash
pnpm dev          # Development mode
pnpm build        # Build all packages
pnpm test         # Run tests
pnpm lint         # Lint code
pnpm typecheck    # Type checking
```

## License

MIT
