# Paca Stakes Viewer

A React application for viewing and managing stakes across multiple blockchain networks (BSC, Base, Sonic).

## Features

- Multi-chain support (BSC, Base, Sonic)
- Real-time stake data viewing
- Cached data for improved performance
- Sortable stake tables
- Chain summary overview
- Responsive design
- Automatic build information tracking

## Project Structure

```ini
src/
├── components/           # React components
│   ├── StakeViewer.jsx  # Main component
│   ├── NetworkSelector.jsx
│   ├── ChainSummaryTable.jsx
│   ├── StakesTable.jsx
│   └── Footer.jsx
├── contracts/           # Contract ABIs
├── constants/           # Configuration constants
├── utils/              # Utility functions
└── assets/             # Static assets
```

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## Build Information

The footer displays build information that can be configured using environment variables:

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Build Information
VITE_APP_VERSION=1.0.0
VITE_BUILD_NUMBER=001
VITE_BUILD_DATE=2024-01-15
```

### Automated Build Information

For automated deployments, you can set these variables in your CI/CD pipeline:

```bash
# Example for GitHub Actions
VITE_APP_VERSION=${{ github.ref_name }}
VITE_BUILD_NUMBER=${{ github.run_number }}
VITE_BUILD_DATE=$(date +%Y-%m-%d)
```

### Default Values

If environment variables are not set, the footer will display:

- Version: "1.0.0"
- Build: "dev"
- Date: Current date

## Commit Hook - Automatic Build Increment

This project includes a Git commit hook that automatically increments the build number on each commit.

### How it Works

1. **Pre-commit Hook**: Before each commit, the hook runs `scripts/increment-build.js`
2. **Build Increment**: The script reads the current `.env` file and increments the build number
3. **Auto-commit**: The updated `.env` file is automatically added to the commit

### Manual Build Increment

You can manually increment the build information without committing:

```bash
npm run increment-build
```

### Customizing Build Logic

The build increment logic can be customized in `scripts/increment-build.js`:

- **Build Number**: Automatically increments (001, 002, 003, etc.)
- **Version**: Currently keeps the same version (can be customized for semantic versioning)
- **Build Date**: Updates to current date

### Disabling the Hook

To temporarily disable the commit hook:

```bash
# Skip the pre-commit hook for one commit
git commit --no-verify -m "Your commit message"

# Or disable husky entirely
npm run prepare -- --disable
```

## Adding New Networks

To add a new blockchain network:

1. Add the contract ABI to `src/contracts/`
2. Update `src/constants/networks.js` with the new network configuration
3. The UI will automatically include the new network in the selector

## Technologies Used

- React 18
- Vite
- Ethers.js
- Tailwind CSS
- React Hooks
- Husky (Git hooks)

## License

© 2024 Paca Stakes Viewer. All rights reserved.
Registered with Pelican Point
