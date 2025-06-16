# Governance Seatbelt Test Repository

This repository generates realistic dummy data that matches the exact format and structure of the [governance-seatbelt](https://github.com/uniswapfoundation/governance-seatbelt) project. It's designed for testing GitHub Apps and systems that consume governance check artifacts.

## Purpose

This test environment allows developers to:
- Test GitHub Apps that download governance check artifacts
- Validate artifact processing systems
- Develop against realistic governance data without affecting production repos

## Generated Output

### File Formats (per proposal)
- **JSON** (`.json`): Structured simulation reports with checks, state changes, events, and metadata
- **Markdown** (`.md`): Human-readable reports with formatted sections
- **HTML** (`.html`): Web-friendly versions of the reports
- **PDF** (`.pdf`): Downloadable document format

### Directory Structure
```
reports/
├── Uniswap/0x408ED6354d4973f66138C91495F2f2FCbd8724C3/
│   ├── 42.json
│   ├── 42.md
│   ├── 42.html
│   ├── 42.pdf
│   └── ... (more proposals)
├── Compound/0xc0Da02939E1441F497fd74F78cE7Decb17B66529/
└── ENS/0x323A76393544d5ecca80cd6ef2A560C6a395b7E3/

frontend/public/
└── simulation-results.json  # Combined frontend data
```

### Test DAOs & Data
- **Uniswap**: 3 proposals (42, 43, 44)
- **Compound**: 3 proposals (120, 121, 122)  
- **ENS**: 3 proposals (15, 16, 17)

Each proposal includes realistic:
- State changes with storage slots and values
- Event logs with decoded parameters
- Security checks with various status levels
- Metadata with block numbers and timestamps

## Usage

### Local Development
```bash
# Install dependencies
bun install

# Generate reports
bun run generate

# Clean previous reports
bun run clean
```

### GitHub Actions
The repository automatically generates fresh reports every 3 hours via GitHub Actions, matching the real governance-seatbelt schedule. Artifacts are uploaded with the same naming conventions:

- `Uniswap` - Uniswap DAO reports
- `Compound` - Compound DAO reports  
- `ENS` - ENS DAO reports
- `frontend-data` - Combined frontend JSON

## Type Definitions

The `types.d.ts` file contains exact type definitions copied from the real governance-seatbelt, including:

- `StructuredSimulationReport` - Main report interface
- `SimulationCheck` - Individual check results
- `SimulationStateChange` - Storage modifications
- `SimulationEvent` - Blockchain events
- `FrontendData` - Frontend consumption format

## GitHub App Testing

To test your GitHub App:

1. Install your GitHub App on this repository
2. The workflow runs every 3 hours or can be manually triggered
3. Your app can download artifacts using the same patterns as production
4. All file formats and structures match the real governance-seatbelt exactly

## Dependencies

- **Bun**: TypeScript runtime and package manager
- **md-to-pdf**: PDF generation from markdown
- **remark/rehype**: Markdown and HTML processing
- **TypeScript**: Type safety and development experience

---

*This is a test repository that generates dummy data for development and testing purposes. It is not affiliated with any real governance proposals or DAOs.*