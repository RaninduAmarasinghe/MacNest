---
name: MacNest
description: A focused macOS workspace for managing local Homebrew packages.
colors:
  canvas: "#f5f5f7"
  sidebar: "#f1f1f4"
  surface: "#fff"
  surface-soft: "#f5f5f7"
  border: "#e3e3e8"
  text: "#1d1d1f"
  muted: "#6e6e73"
  accent: "#007aff"
  success: "#248a3d"
  danger: "#d70015"
typography:
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "26px"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.55px"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif"
    fontSize: "10px"
    fontWeight: 600
rounded:
  xs: "4px"
  sm: "7px"
  md: "10px"
  lg: "12px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  navigation-active:
    backgroundColor: "#e4e4e8"
    textColor: "#1d1d1f"
    rounded: "7px"
    padding: "7px 10px"
    height: "36px"
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#fff"
    rounded: "7px"
    padding: "5px 10px"
    height: "30px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "11px"
    padding: "16px 17px"
---

# Design System: MacNest

## Overview

MacNest uses a SwiftUI-inspired macOS utility style: a compact sidebar, a native-feeling toolbar, system typography, grouped surfaces, quiet separators, and familiar blue actions. The app supports light and dark appearances through the system setting.

The interface keeps Homebrew package state and controls easy to scan. It uses native-feeling patterns without depending on SwiftUI or copying another product's branding.

## Colors

- **Canvas and sidebar:** Soft system grays frame the work area.
- **Surface:** White in light mode and dark elevated gray in dark mode.
- **Accent:** System blue identifies primary actions and focus.
- **State:** Green marks installed or completed states; red marks errors and destructive actions.

## Typography

System UI throughout. Page titles use a 26px semibold scale, section titles use 13px semibold, and interface copy uses compact 10–12px sizes. Numeric counts use tabular numerals.

## Layout

The desktop sidebar is 246px wide and contains navigation, settings, and Homebrew status. A 52px toolbar frames the work area. At widths below 900px, the sidebar and content spacing contract; below 680px, the sidebar becomes icon-led and content grids collapse for narrow screens.

## Components

- **Navigation:** 36px rows with a soft gray selected state and blue selected icon.
- **Panels:** White or dark elevated surfaces with 10–12px corners, fine borders, and restrained shadows.
- **Controls:** Compact bordered secondary controls and blue primary actions, with visible keyboard focus.
- **Lists:** Updates, activity, and installed packages use aligned rows with fine separators.
- **Status:** Small badges distinguish installed, available, completed, and failed states.
- **Motion:** Short state transitions; long-running Homebrew operations use a progress indicator. Reduced-motion settings disable animation.

## Do and Don't

- Keep navigation, package state, and actions close together.
- Use system colors and typography in a way that remains legible in both appearances.
- Keep blue for primary actions, green for success, and red for failure or removal.
- Avoid decorative gradients, heavy blur, oversized display type, and deep card stacks.
