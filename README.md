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

* 🏠 Dashboard — Access your development environment and package management overview.
* 🔍 Explore Packages — Search the Homebrew catalog to discover available formulae and casks.
* 📦 Installed Packages — View and manage installed development tools.
* ⬇️ Download Progress — Monitor package installation progress.
* 🔄 Updates — Review available package updates and manage your update workflow.
* 📋 Activity Tracking — Review package management activities.
* 🖥️ System Scan — Discover development tools available on your Mac.
* 🎨 Native macOS-Inspired UI — Clean layouts, familiar controls, and system appearance support.
* 🌗 Light and Dark Appearance — Adapt the interface to your preferred system appearance.
* ⚡ Desktop Performance — Use a lightweight desktop architecture powered by Tauri and Rust.

Note: Available features depend on the current implementation. Package installation, update detection, progress reporting, and system scanning may depend on Homebrew and your local environment.

🛠️ Tech Stack

Technology	Purpose
Tauri 2	Desktop application framework
React	User interface
TypeScript	Type-safe frontend development
Vite	Frontend development and production builds
Rust	Native backend functionality
Homebrew	macOS package management

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

* macOS
* Node.js and npm
* Rust and Cargo
* Homebrew
* The development prerequisites required by Tauri for macOS

Useful installation resources:

* Node.js
* Rust
* Homebrew
* Tauri prerequisites

📥 Installation

Option 1: Download the application

Download the latest macOS installer from the repository’s Releases page.

1. Download the .dmg file compatible with your Mac.
2. Open the downloaded disk image.
3. Follow the installation instructions provided.
4. Launch MacNest from Applications.

Current development build: The available aarch64 package targets Apple Silicon Macs. Public distribution may require code signing and notarization for a smoother installation experience.

Releases will appear here once a release has been published.

Option 2: Run from source

Clone the repository:

git clone https://github.com/RaninduAmarasinghe/MacNest.git

Navigate into the project:

cd MacNest

Install frontend dependencies:

npm install

Start the application in development mode:

npm run tauri dev

Build for production

Create a production build:

npm run tauri build

Tauri generates the application bundles under:

src-tauri/target/release/bundle/

The exact output depends on your build configuration and target platform.

🧑‍💻 Development

MacNest uses a Tauri architecture:

* Frontend: React and TypeScript render the application interface.
* Backend: Rust handles native application functionality.
* Package management: Homebrew provides the underlying package catalog and installation capabilities.

The frontend communicates with the native backend through Tauri commands.

Project structure

MacNest/
├── src/                    # React frontend
├── public/                 # Static frontend assets
├── src-tauri/
│   ├── src/                # Rust backend
│   ├── icons/              # Application icons
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── package.json            # npm scripts and dependencies
├── tsconfig.json           # TypeScript configuration
└── README.md

Your actual project may contain additional files and directories.

🗺️ Roadmap

Potential future improvements include:

* Publish the first public release.
* Improve package search and filtering.
* Add package details and dependency information.
* Improve installation and uninstallation feedback.
* Enhance download progress reporting.
* Improve update management.
* Add package categories and favorites.
* Add application signing and notarization.
* Expand documentation and automated testing.

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

* GitHub: @RaninduAmarasinghe

⸻

<div align="center">

Built for developers who love macOS. 🍎

⭐ If you find MacNest useful, consider starring the repository!

</div>