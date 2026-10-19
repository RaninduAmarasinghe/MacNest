import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

// Development tools detected on the Mac
type DetectedTool = {
  name: string;
  installed: boolean;
  version: string | null;
};

// Packages managed by Homebrew
type HomebrewPackage = {
  name: string;
  version: string;
  package_type: string;
};

// Dashboard package catalog
type Package = {
  name: string;
  description: string;
  category: string;
  version: string | null;
  icon: string;
  installed: boolean;
  homebrewName: string;
};

const initialPackages: Package[] = [
  {
    name: "Node.js",
    description: "JavaScript runtime for building applications.",
    category: "Development",
    version: null,
    icon: "⬢",
    installed: false,
    homebrewName: "node",
  },
  {
    name: "Python",
    description: "A versatile programming language.",
    category: "Languages",
    version: null,
    icon: "🐍",
    installed: false,
    homebrewName: "python",
  },
  {
    name: "Git",
    description: "Distributed version control system.",
    category: "Development",
    version: null,
    icon: "⌘",
    installed: false,
    homebrewName: "git",
  },
  {
    name: "PostgreSQL",
    description: "Powerful open-source relational database.",
    category: "Databases",
    version: null,
    icon: "◉",
    installed: false,
    homebrewName: "postgresql",
  },
  {
    name: "Rust",
    description: "A language for reliable, efficient software.",
    category: "Languages",
    version: null,
    icon: "⚙",
    installed: false,
    homebrewName: "rust",
  },
  {
    name: "ripgrep",
    description: "Fast command-line text search utility.",
    category: "Utilities",
    version: null,
    icon: "⌕",
    installed: false,
    homebrewName: "ripgrep",
  },
];

const navigation = [
  { name: "Dashboard", icon: "▦" },
  { name: "Explore", icon: "⌕" },
  { name: "Installed", icon: "▣" },
  { name: "Updates", icon: "↻" },
  { name: "Activity", icon: "◷" },
];

function App() {
  const [packages, setPackages] =
    useState<Package[]>(initialPackages);

  const [activePage, setActivePage] =
    useState("Dashboard");

  const [search, setSearch] = useState("");

  // System scanner state
  const [detectedTools, setDetectedTools] =
    useState<DetectedTool[]>([]);

  const [isScanning, setIsScanning] = useState(false);

  const [scanError, setScanError] =
    useState<string | null>(null);

  // Homebrew inventory state
  const [homebrewPackages, setHomebrewPackages] =
    useState<HomebrewPackage[]>([]);

  const [isLoadingHomebrew, setIsLoadingHomebrew] =
    useState(false);

  const [homebrewError, setHomebrewError] =
    useState<string | null>(null);

  const [homebrewSearch, setHomebrewSearch] =
    useState("");

  const [homebrewType, setHomebrewType] =
    useState("All");

  // Detect installed development tools
  async function scanSystem() {
    setIsScanning(true);
    setScanError(null);

    try {
      const result = await invoke<DetectedTool[]>(
        "scan_development_tools"
      );

      setDetectedTools(result);

      // Update the catalog using detected tool information.
      setPackages((currentPackages) =>
        currentPackages.map((pkg) => {
          const detectedTool = result.find(
            (tool) =>
              tool.name.toLowerCase() ===
              pkg.name.toLowerCase()
          );

          if (!detectedTool) {
            return pkg;
          }

          return {
            ...pkg,
            installed: detectedTool.installed,
            version: detectedTool.installed
              ? detectedTool.version
              : null,
          };
        })
      );
    } catch (error) {
      setScanError(String(error));
    } finally {
      setIsScanning(false);
    }
  }

  // Load Homebrew formulae and casks
  async function loadHomebrewPackages() {
    setIsLoadingHomebrew(true);
    setHomebrewError(null);

    try {
      const result = await invoke<HomebrewPackage[]>(
        "get_homebrew_packages"
      );

      setHomebrewPackages(result);

      // Match Homebrew formulae against catalog entries.
      setPackages((currentPackages) =>
        currentPackages.map((pkg) => {
          const homebrewPackage = result.find(
            (item) =>
              item.package_type === "Formula" &&
              item.name.toLowerCase() ===
                pkg.homebrewName.toLowerCase()
          );

          const detectedTool = detectedTools.find(
            (tool) =>
              tool.name.toLowerCase() ===
              pkg.name.toLowerCase()
          );

          const isInstalled =
            Boolean(homebrewPackage) ||
            Boolean(detectedTool?.installed);

          const version =
            homebrewPackage?.version ??
            detectedTool?.version ??
            null;

          return {
            ...pkg,
            installed: isInstalled,
            version,
          };
        })
      );
    } catch (error) {
      setHomebrewError(String(error));
    } finally {
      setIsLoadingHomebrew(false);
    }
  }

  // Load system information when the application opens.
  useEffect(() => {
    void scanSystem();
    void loadHomebrewPackages();
  }, []);

  // Homebrew search and type filters
  const filteredHomebrewPackages =
    homebrewPackages.filter((pkg) => {
      const matchesSearch = pkg.name
        .toLowerCase()
        .includes(homebrewSearch.toLowerCase().trim());

      const matchesType =
        homebrewType === "All" ||
        pkg.package_type === homebrewType;

      return matchesSearch && matchesType;
    });

  // Catalog statistics
  const installedPackages = packages.filter(
    (pkg) => pkg.installed
  );

  // Catalog search
  const visiblePackages = packages.filter((pkg) => {
    const query = search.toLowerCase().trim();

    const matchesSearch =
      pkg.name.toLowerCase().includes(query) ||
      pkg.description.toLowerCase().includes(query);

    if (activePage === "Installed") {
      return pkg.installed && matchesSearch;
    }

    return matchesSearch;
  });

  // Page headings
  const pageTitle =
    activePage === "Dashboard"
      ? "Everything in its place."
      : activePage === "Explore"
        ? "Explore packages."
        : activePage === "Installed"
          ? "Your installed packages."
          : activePage === "Updates"
            ? "Package updates."
            : activePage === "Activity"
              ? "Recent activity."
              : activePage;

  const catalogTitle =
    activePage === "Installed"
      ? "Installed packages"
      : activePage === "Updates"
        ? "Update manager"
        : activePage === "Activity"
          ? "Activity overview"
          : activePage === "Explore"
            ? "Package catalog"
            : "Your packages";

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">M</div>

          <div>
            <h1>MacNest</h1>
            <span>Package Manager</span>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="navigation">
          {navigation.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => setActivePage(item.name)}
            >
              <span className="nav-icon">
                {item.icon}
              </span>

              {item.name}

              {item.name === "Installed" && (
                <span className="nav-count">
                  {installedPackages.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            className={`nav-item ${
              activePage === "Settings" ? "active" : ""
            }`}
            onClick={() => setActivePage("Settings")}
          >
            <span className="nav-icon">⚙</span>
            Settings
          </button>

          <div className="system-card">
            <div className="system-dot" />

            <div>
              <strong>MacNest is ready</strong>
              <span>macOS · Apple Silicon</span>
            </div>
          </div>

          <div className="sidebar-footer">
            <span className="footer-avatar">R</span>

            <div>
              <strong>Local machine</strong>
              <span>Personal workspace</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>MacNest</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            <span className="status-indicator" />
            <span>System ready</span>

            <button
              className="settings-button"
              onClick={() => setActivePage("Settings")}
              aria-label="Settings"
            >
              ⚙
            </button>
          </div>
        </header>

        <section className="page-content">
          {activePage === "Settings" ? (
            <div className="page-heading">
              <span className="eyebrow">PREFERENCES</span>

              <h2>Settings</h2>

              <p>
                Configure your MacNest package management
                workspace.
              </p>

              <div className="settings-panel">
                <h3>About MacNest</h3>

                <p>
                  Your personal macOS package management
                  workspace.
                </p>

                <span className="settings-version">
                  Development build · v0.1.0
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Page heading */}
              <div className="page-heading">
                <span className="eyebrow">
                  YOUR DEVELOPMENT WORKSPACE
                </span>

                <h2>{pageTitle}</h2>

                <p>
                  Manage your developer tools from one place.
                </p>
              </div>

              {/* Dashboard statistics */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-top">
                    <span>Detected catalog packages</span>
                    <span className="stat-icon purple">
                      ▦
                    </span>
                  </div>

                  <strong>
                    {installedPackages.length}
                  </strong>

                  <span className="stat-caption">
                    Installed tools matched in the catalog
                  </span>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Homebrew packages</span>
                    <span className="stat-icon green">
                      ⌘
                    </span>
                  </div>

                  <strong>
                    {homebrewPackages.length}
                  </strong>

                  <span className="stat-caption">
                    {isLoadingHomebrew
                      ? "Loading inventory..."
                      : "Formulae and casks detected"}
                  </span>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Updates available</span>
                    <span className="stat-icon orange">
                      ↻
                    </span>
                  </div>

                  <strong>—</strong>

                  <span className="stat-caption">
                    Update detection not configured
                  </span>
                </div>
              </div>

              {/* System Scan */}
              <section className="system-scan">
                <div className="section-heading">
                  <div>
                    <h3>System Scan</h3>

                    <p>
                      Developer tools detected on this Mac.
                    </p>
                  </div>

                  <button
                    className="scan-button"
                    onClick={() => void scanSystem()}
                    disabled={isScanning}
                  >
                    {isScanning
                      ? "Scanning..."
                      : "Scan Again"}
                  </button>
                </div>

                {scanError && (
                  <p className="scan-error">
                    Scan failed: {scanError}
                  </p>
                )}

                {isScanning &&
                  detectedTools.length === 0 && (
                    <p className="scan-message">
                      Scanning your Mac...
                    </p>
                  )}

                {!isScanning &&
                  !scanError &&
                  detectedTools.length === 0 && (
                    <p className="scan-message">
                      No results yet.
                    </p>
                  )}

                <div className="detected-tools">
                  {detectedTools.map((tool) => (
                    <article
                      className="detected-tool"
                      key={tool.name}
                    >
                      <div>
                        <strong>{tool.name}</strong>

                        <p>
                          {tool.version ?? "Not detected"}
                        </p>
                      </div>

                      <span
                        className={`package-status ${
                          tool.installed ? "installed" : ""
                        }`}
                      >
                        <span />

                        {tool.installed
                          ? "Detected"
                          : "Not detected"}
                      </span>
                    </article>
                  ))}
                </div>
              </section>

              {/* Homebrew Inventory */}
              <section className="system-scan">
                <div className="section-heading">
                  <div>
                    <h3>Homebrew Inventory</h3>

                    <p>
                      Packages managed by Homebrew on this Mac.
                    </p>
                  </div>

                  <button
                    className="scan-button"
                    onClick={() =>
                      void loadHomebrewPackages()
                    }
                    disabled={isLoadingHomebrew}
                  >
                    {isLoadingHomebrew
                      ? "Loading..."
                      : "Refresh Inventory"}
                  </button>
                </div>

                {homebrewError && (
                  <p className="scan-error">
                    Could not load Homebrew packages:{" "}
                    {homebrewError}
                  </p>
                )}

                {/* Search and type filters */}
                <div className="homebrew-controls">
                  <input
                    type="search"
                    className="homebrew-search"
                    placeholder="Search installed packages..."
                    value={homebrewSearch}
                    onChange={(event) =>
                      setHomebrewSearch(event.target.value)
                    }
                    aria-label="Search Homebrew packages"
                  />

                  <select
                    className="homebrew-filter"
                    value={homebrewType}
                    onChange={(event) =>
                      setHomebrewType(event.target.value)
                    }
                    aria-label="Filter Homebrew packages by type"
                  >
                    <option value="All">All types</option>
                    <option value="Formula">Formula</option>
                    <option value="Cask">Cask</option>
                  </select>
                </div>

                {isLoadingHomebrew &&
                  homebrewPackages.length === 0 && (
                    <p className="scan-message">
                      Loading Homebrew inventory...
                    </p>
                  )}

                {!isLoadingHomebrew &&
                  !homebrewError &&
                  homebrewPackages.length === 0 && (
                    <p className="scan-message">
                      No Homebrew packages found.
                    </p>
                  )}

                {/* Filtered Homebrew package list */}
                <div className="detected-tools">
                  {filteredHomebrewPackages.map((pkg) => (
                    <article
                      className="detected-tool"
                      key={`${pkg.package_type}-${pkg.name}`}
                    >
                      <div>
                        <strong>{pkg.name}</strong>

                        <p>
                          {pkg.package_type} · Version{" "}
                          {pkg.version}
                        </p>
                      </div>

                      <span className="package-status installed">
                        <span />
                        Installed
                      </span>
                    </article>
                  ))}
                </div>

                {!isLoadingHomebrew &&
                  !homebrewError &&
                  filteredHomebrewPackages.length === 0 &&
                  homebrewPackages.length > 0 && (
                    <div className="empty-state">
                      <span>⌕</span>

                      <h3>No packages found</h3>

                      <p>
                        Try another name or select a different
                        package type.
                      </p>
                    </div>
                  )}

                {!homebrewError && (
                  <p className="scan-message">
                    Showing {filteredHomebrewPackages.length} of{" "}
                    {homebrewPackages.length} Homebrew packages
                  </p>
                )}
              </section>

              {/* Package catalog */}
              <div className="section-heading">
                <div>
                  <h3>{catalogTitle}</h3>

                  <p>
                    {activePage === "Updates"
                      ? "Live update detection will be added later."
                      : activePage === "Activity"
                        ? "Installation history will be connected later."
                        : activePage === "Installed"
                          ? "Catalog tools detected as installed."
                          : "Explore the sample catalog and interface."}
                  </p>
                </div>

                <label className="search-box">
                  <span>⌕</span>

                  <input
                    type="search"
                    placeholder="Search packages..."
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                  />

                  <kbd>⌘ F</kbd>
                </label>
              </div>

              <div className="package-grid">
                {visiblePackages.map((pkg) => (
                  <article
                    className="package-card"
                    key={pkg.name}
                  >
                    <div className="package-card-top">
                      <div className="package-icon">
                        {pkg.icon}
                      </div>

                      <span
                        className={`package-status ${
                          pkg.installed ? "installed" : ""
                        }`}
                      >
                        <span />

                        {pkg.installed
                          ? "Installed"
                          : "Available"}
                      </span>
                    </div>

                    <h4>{pkg.name}</h4>

                    <p className="package-description">
                      {pkg.description}
                    </p>

                    <div className="package-meta">
                      <span>{pkg.category}</span>

                      <span>
                        {pkg.version
                          ? `v${pkg.version}`
                          : "Version unknown"}
                      </span>
                    </div>

                    <button
                      className={`package-action ${
                        pkg.installed
                          ? "secondary-action"
                          : ""
                      }`}
                      onClick={() => {
                        window.alert(
                          "Package management is not enabled yet. " +
                            "This preview does not install or " +
                            "uninstall software."
                        );
                      }}
                    >
                      {pkg.installed
                        ? "Uninstall"
                        : "Install"}

                      <span>→</span>
                    </button>
                  </article>
                ))}
              </div>

              {visiblePackages.length === 0 && (
                <div className="empty-state">
                  <span>⌕</span>

                  <h3>No packages found</h3>

                  <p>Try a different search term.</p>
                </div>
              )}

              {/* Preview notice */}
              <div className="demo-notice">
                <span>ⓘ</span>

                <p>
                  <strong>Preview mode</strong>
                  {" "}System Scan and Homebrew Inventory read
                  information from your Mac. The catalog is
                  limited to sample entries, and its Install and
                  Uninstall buttons do not modify your software.
                </p>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;