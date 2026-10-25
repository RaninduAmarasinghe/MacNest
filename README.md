<div align="center">

# 🪺 MacNest

A modern package manager for macOS developers

Manage your developer tools, discover Homebrew packages, track downloads, and keep your development environment organized — all from one native-style macOS application.

Features · Installation · Troubleshooting · Development · Contributing

</div>

⸻

 ## Overview

MacNest is a desktop application designed to simplify package management on macOS. Built with Tauri, React, TypeScript, and Rust, it combines a modern interface inspired by native macOS design with the power of Homebrew.

Instead of managing everything through terminal commands, MacNest aims to provide a convenient graphical interface for discovering packages, managing installed tools, monitoring downloads, and reviewing available updates.

## Features

#### *  Dashboard — Access your development environment and package management overview.
#### *  Explore Packages — Search the Homebrew catalog to discover available formulae and casks.
#### *  Installed Packages — View and manage installed development tools.
#### *  Download Progress — Monitor package installation progress.
#### *  Updates — Review available package updates and manage your update workflow.
#### *  Activity Tracking — Review package management activities.
#### *  System Scan — Discover development tools available on your Mac.
#### *  Native macOS-Inspired UI — Clean layouts, familiar controls, and system appearance support.
#### *  Light and Dark Appearance — Adapt the interface to your preferred appearance.
#### *  Desktop Performance — Use a lightweight desktop architecture powered by Tauri and Rust.
#### *  In-App Updates — Check for new MacNest releases and install published updates from Settings.

Note: Available features depend on the current implementation, Homebrew, and your local environment. Package installation, update detection, progress reporting, and system scanning may have environment-specific limitations.

## Screenshots

Screenshots of the actual application can be added here.

Recommended structure:

docs/
└── screenshots/
    ├── dashboard.png
    ├── explore.png
    ├── installed.png
    └── settings.png

Once the images have been added, display them below.

Dashboard

Explore Packages

Remove or replace these image references until the corresponding screenshot files exist in the repository.

⸻

## Requirements

For installing MacNest

* A compatible Mac running macOS.
* The appropriate MacNest release for your processor.

For developing MacNest from source

* macOS
* Node.js and npm
* Rust and Cargo
* Homebrew
* The development prerequisites required by Tauri for macOS

Useful resources:

* Node.js
* Rust
* Homebrew
* Tauri v2 prerequisites

⸻

## Installation

#### Option 1: Download MacNest

1. Visit the MacNest Releases page.
2. Open the latest release.
3. Download the appropriate .dmg installer for your Mac.
4. Open the downloaded disk image.
5. Follow the installation instructions and copy MacNest into your Applications folder if required.
6. Launch MacNest from Applications.

Choose the correct release for your processor when separate builds are provided:

* Apple Silicon: M1, M2, M3, M4, and compatible later processors.
* Intel: Intel-based Macs.

If a universal build is provided, it supports both architectures.

macOS Security and Gatekeeper Troubleshooting

macOS includes Gatekeeper, a security feature that helps protect your Mac from applications that Apple cannot verify.

Depending on the release’s code-signing and notarization status, macOS may display a warning such as:

“MacNest” Not Opened
Apple could not verify “MacNest” is free of malware that may harm your Mac or compromise your privacy.

This warning does not, by itself, establish that an application contains malware. It can indicate that macOS cannot verify the application’s developer or notarization status.

If you downloaded MacNest from the official repository, follow the appropriate steps below.

#### Method 1: Open Anyway in System Settings

1. Try opening MacNest once.
2. Close the warning.
3. Open System Settings.
4. Select Privacy & Security.
5. Scroll to the Security section.
6. If an Open Anyway option appears for MacNest, select it.
7. Authenticate if requested.
8. Review the confirmation prompt before proceeding.

The option may only appear after macOS has blocked an attempted launch, and it may not be available for every type of security block.

#### Method 2: Open Using Finder

If macOS says the developer cannot be verified:

1. Open Finder.
2. Navigate to your Applications folder.
3. Locate MacNest.
4. Control-click or right-click the application.
5. Select Open.
6. Review the warning and confirm only if macOS offers an option to proceed and you trust the application.

This can provide an additional approval option compared with opening the application normally.

# Important Security Notice

Only use these methods if you downloaded MacNest from the official repository and have a reason to trust the release.

Do not bypass macOS security protections if your Mac reports that an application contains malware, will damage your computer, or has been blocked for another serious security reason.

If you encounter one of these warnings, stop and contact the maintainer.

Still Cannot Open MacNest?

If neither method works:

1. Verify that you downloaded the correct release.
2. Download the installer again from the official MacNest Releases page.
3. Ensure the application was copied into Applications correctly.
4. Review the exact error displayed by macOS.
5. Report the problem through GitHub Issues.

When reporting an issue, include your macOS version, Mac processor architecture, MacNest version, and the exact error message.

For more information, see Apple’s documentation on safely opening apps on your Mac.

Code Signing and Notarization

MacNest may display Gatekeeper warnings if a distributed release is not signed and notarized in a way that macOS accepts.

For a more seamless installation experience, MacNest should be signed using an Apple Developer ID Application certificate and notarized through Apple’s service.

The Apple Developer Program generally costs US$99 per year, subject to local pricing and eligibility.

* Apple Developer Program
* Tauri macOS code signing
* Apple notarization documentation

Until signing and notarization are configured, some users may need to approve the application manually. Approval is not guaranteed to be available for every warning.

#### Option 2: Run from Source

Developers can clone the repository and run MacNest locally.

Clone the Repository

git clone https://github.com/RaninduAmarasinghe/MacNest.git
cd MacNest

Install Dependencies
```bash
npm install
```

Start Development Mode

```bash
npm run tauri dev
```
This starts the frontend development server and launches the MacNest desktop application.

Build for Production

```bash
npm run build:macos
```
The generated application and installer bundles are available under:

```bash
src-tauri/target/
```
For a universal macOS build, the DMG is typically generated under:

```bash
src-tauri/target/universal-apple-darwin/release/bundle/dmg/
```

The universal build requires both Rust compilation targets:

rustup target add aarch64-apple-darwin
rustup target add x86_64-apple-darwin

Note: Building from source requires the development prerequisites listed above. Exact output paths may vary depending on the build target and Tauri configuration.


⸻

## Development

MacNest combines a React frontend with a Rust backend through Tauri.

##### Technology Stack

Technology	Purpose
Tauri 2	Native desktop application framework
React	User interface
TypeScript	Type-safe frontend development
Vite	Frontend development and production builds
Rust	Native backend functionality
Homebrew	macOS package management

##### How MacNest Works

* The frontend displays the dashboard, package catalog, installed packages, updates, and activity.
* The Rust backend handles native application operations.
* Homebrew provides access to available packages and package-management commands.
* Tauri connects the frontend to the native backend.

##### Development Commands

Install dependencies:

```bash
npm install
```

Start the development application:

```bash
npm run tauri dev
```

Build the frontend:

```bash
npm run build
```

Build the macOS distribution:

```bash
npm run build:macos
```

The exact available scripts are defined in package.json.

⸻

## Roadmap

Potential future improvements include:

* Improve package search and filtering.
* Add package details and dependency information.
* Improve installation and uninstallation feedback.
* Enhance download progress reporting.
* Improve update management.
* Add package categories and favorites.
* Improve automated testing.
* Expand installation and troubleshooting documentation.
* Add or improve Apple code signing and notarization for public releases.

Roadmap items may change as development progresses.

⸻

## Contributing

Contributions, bug reports, and feature suggestions are welcome!

1. Fork the repository.
2. Create a feature branch:

```bash
git checkout -b feature/your-feature
```

3. Make your changes and test them.
   
5. Commit your changes:

```bash
git commit -m "feat: add your feature"
```

5. Push your branch:

```bash
git push origin feature/your-feature
```

6. Open a pull request describing your changes.

For substantial changes, consider opening an issue first to discuss your proposal.

⸻

## Reporting Issues

Found a bug or have an idea?

Open an issue in the MacNest GitHub repository.

Include relevant details, reproduction steps, your macOS version, and error messages when possible.

⸻

## Security

MacNest interacts with local package-management tools and may execute package-management operations on your Mac.

* Review package sources and installation commands carefully.
* Download MacNest only from the official repository.
* Never bypass serious malware or security warnings.
* Report suspected security vulnerabilities privately to the maintainer rather than publishing sensitive exploit details in public issues.

⸻

📄 License

MacNest is licensed under the MIT License.

Copyright © 2026 Ranindu Amarasinghe.

You are free to use, modify, and distribute this software in accordance with the terms of the MIT License.

See the LICENSE file for details.

⸻

👨‍💻 Author

Ranindu Amarasinghe

* GitHub: @RaninduAmarasinghe

⸻

<div align="center">

Built for developers who love macOS. 🍎

⭐ If you find MacNest useful, consider starring the repository!

</div>
