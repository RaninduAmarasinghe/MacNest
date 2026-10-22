# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Inferred from the app and request: an individual Mac user who manages developer packages with Homebrew.

## Product Purpose

Inferred from the app and request: MacNest provides a graphical way to search, install, remove, update, and review Homebrew packages on the local Mac. Success means users can understand package state and complete those tasks reliably.

## Positioning

Inferred from the existing implementation: local Homebrew package management through a focused desktop interface, with package discovery, installed inventory, outdated package updates, and a history of actions.

## Operating Context

The app runs as a macOS desktop app built with Tauri and React. Package operations run through Homebrew on the local machine.

## Capabilities and Constraints

- Existing sections: Dashboard, Explore, Installed, Updates, Activity, and Settings.
- Installs, uninstalls, single-package updates, and update-all are backed by Homebrew commands.
- Search results include Homebrew formulae and casks.
- Download/install activity is surfaced in the interface.
- These capabilities are inferred from the repository and may need confirmation.

## Brand Commitments

The user asked for a minimalist macOS interface, a distinct contemporary redesign, and a replacement for the sidebar's “Local machine / Personal workspace” area.

## Evidence on Hand

The working implementation is in `src/App.tsx`, `src/App.css`, and `src-tauri/src/lib.rs`. No customer evidence, external brand assets, or product-specific accessibility requirements are present in the repository.

## Product Principles

- Make local package state easy to understand.
- Keep package actions visible beside the package they affect.
- Show progress and outcomes for long-running Homebrew operations.
- Keep the product centered on one Mac and its Homebrew installation.
