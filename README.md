<div align="center">

🪺 MacNest

A modern package manager for macOS developers.

Manage your developer tools, discover Homebrew packages, track downloads, and keep your development environment organized — all from one native-style macOS application.

</div>

⸻

✨ Overview

MacNest is a desktop application designed to simplify package management on macOS. Built with Tauri, React, TypeScript, and Rust, it combines a modern interface inspired by native macOS design with the power of Homebrew.

Instead of managing everything through terminal commands, MacNest aims to provide a convenient graphical interface for discovering packages, managing installed tools, monitoring downloads, and reviewing available updates.

🚀 Features

- 🏠 Dashboard — Access your development environment and package management overview.
- 🔍 Explore Packages — Search the Homebrew catalog to discover available formulae and casks.
- 📦 Installed Packages — View and manage installed development tools.
- ⬇️ Download Progress — Monitor package installation progress.
- 🔄 Updates — Review available package updates and manage your update workflow.
- 📋 Activity Tracking — Review package management activities.
- 🖥️ System Scan — Discover development tools available on your Mac.
- 🎨 Native macOS-Inspired UI — Clean layouts, familiar controls, and system appearance support.
- 🌗 Light and Dark Appearance — Adapt the interface to your preferred system appearance.
- ⚡ Desktop Performance — Use a lightweight desktop architecture powered by Tauri and Rust.

Note: Available features depend on the current implementation. Package installation, update detection, progress reporting, and system scanning may depend on Homebrew and your local environment.

🛠️ Tech Stack

Technology Purpose
Tauri 2 Desktop application framework
React User interface
TypeScript Type-safe frontend development
Vite Frontend development and production builds
Rust Native backend functionality
Homebrew macOS package management

📸 Screenshots

Add screenshots of your actual application here to showcase its interface.

For example:

docs/
└── screenshots/
├── dashboard.png
├── explore.png
├── installed.png
└── settings.png

Once you add these images to your repository, display them in this section:

### Dashboard

![MacNest Dashboard](docs/screenshots/dashboard.png)

### Explore Packages

![MacNest Explore](docs/screenshots/explore.png)

📋 Requirements

Before running MacNest from source, make sure you have:

- macOS
- Node.js and npm
- Rust and Cargo
- Homebrew
- The development prerequisites required by Tauri for macOS

Useful installation resources:

- Node.js
- Rust
- Homebrew
- Tauri prerequisites

📥 Installation

Option 1: Download MacNest

Download the latest available macOS installer from GitHub Releases.

1. Download the .dmg file compatible with your Mac.
2. Open the downloaded disk image.
3. Follow the installation instructions.
4. Launch MacNest from your Applications folder.

Note: The current development build targets Apple Silicon Macs (aarch64). Public distribution may require Apple Developer ID signing and notarization.

Option 2: Run from Source

Prerequisites

Before running MacNest, install:

- Node.js and npm
- Rust and Cargo
- Homebrew
- Tauri prerequisites for macOS

Clone the Repository

git clone https://github.com/RaninduAmarasinghe/MacNest.git
cd MacNest

Install Dependencies

npm install

Start Development Mode

npm run tauri dev

This starts the frontend development server and launches the MacNest desktop application.

Build for Production

npm run tauri build

The generated application and installer bundles are available under:

src-tauri/target/release/bundle/

The exact output depends on the build configuration and target platform.

⸻

🧑‍💻 Development

MacNest uses a desktop architecture powered by Tauri, React, TypeScript, and Rust.

Architecture

MacNest combines a modern React frontend with a native Rust backend using Tauri 2.

Component Technology Responsibility
Frontend React Renders the application interface
Language TypeScript Provides type safety
Build Tool Vite Builds and serves the frontend
Desktop Framework Tauri 2 Connects the frontend to native functionality
Backend Rust Handles native application operations
Package Manager Homebrew Provides package discovery and management

The frontend communicates with the native backend through Tauri commands.

Project Structure

MacNest/
├── public/ # Static assets
├── src/ # React frontend
│ ├── App.tsx # Main application interface
│ └── ...
├── src-tauri/ # Native Tauri application
│ ├── icons/ # Application icons
│ ├── src/ # Rust backend
│ ├── Cargo.toml # Rust dependencies
│ └── tauri.conf.json # Tauri configuration
├── package.json # npm scripts and dependencies
├── tsconfig.json # TypeScript configuration
└── README.md

Note: This is an illustrative structure. Some filenames or directories may differ in the actual repository.

The structure above is illustrative. Individual filenames may differ in the current repository.

⸻

🗺️ Roadmap

Potential future improvements include:

- Publish the first public release.
- Improve package search and filtering.
- Add package details and dependency information.
- Improve installation and uninstallation feedback.
- Enhance download progress reporting.
- Improve update management.
- Add package categories and favorites.
- Add application signing and notarization.
- Expand documentation and automated testing.

Roadmap items may change as development progresses.

🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome.

1. Fork the repository.
2. Create a feature branch:

git checkout -b feature/your-feature

3. Commit your changes:

git commit -m "feat: add your feature"

4. Push your branch:

git push origin feature/your-feature

5. Open a pull request describing your changes.

For substantial changes, consider opening an issue first to discuss your proposal.

🐛 Reporting Issues

Found a bug or have an idea?

Open an issue in the MacNest GitHub repository.

Include relevant details, reproduction steps, and error messages when possible.

🔒 Security

MacNest interacts with local package-management tools. Review installation commands and package sources carefully.

Please report security vulnerabilities privately rather than publishing sensitive exploit details in public issues.

📄 License

MacNest is intended to use the MIT License.

Before distributing the project under this license, add a LICENSE file containing the appropriate MIT License text and confirm that the project’s dependencies and assets permit your intended distribution.

👨‍💻 Author

Ranindu Amarasinghe

- GitHub: @RaninduAmarasinghe

⸻

<div align="center">

Built for developers who love macOS. 🍎

⭐ If you find MacNest useful, consider starring the repository!

</div>
