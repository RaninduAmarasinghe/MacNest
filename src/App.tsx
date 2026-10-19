import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

// Development tools detected on the Mac
type DetectedTool = {
  name: string;
  installed: boolean;
  version: string | null;
};

// Packages installed through Homebrew
type HomebrewPackage = {
  name: string;
  version: string;
  package_type: string;
};

// Sample packages available to explore
type Package = {
  name: string;
  description: string;
  category: string;
  version: string | null;
  icon: string;
  homebrewName: string;
};

const initialPackages: Package[] = [
  {
    name: "Node.js",
    description: "JavaScript runtime for building applications.",
    category: "Development",
    version: null,
    icon: "⬢",
    homebrewName: "node",
  },
  {
    name: "Python",
    description: "A versatile programming language.",
    category: "Languages",
    version: null,
    icon: "🐍",
    homebrewName: "python",
  },
  {
    name: "Git",
    description: "Distributed version control system.",
    category: "Development",
    version: null,
    icon: "⌘",
    homebrewName: "git",
  },
  {
    name: "PostgreSQL",
    description: "Powerful open-source relational database.",
    category: "Databases",
    version: null,
    icon: "◉",
    homebrewName: "postgresql",
  },
  {
    name: "Rust",
    description: "A language for reliable, efficient software.",
    category: "Languages",
    version: null,
    icon: "⚙",
    homebrewName: "rust",
  },
  {
    name: "ripgrep",
    description: "Fast command-line text search utility.",
    category: "Utilities",
    version: null,
    icon: "⌕",
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
  const [activePage, setActivePage] = useState("Dashboard");

  const [detectedTools, setDetectedTools] =
    useState<DetectedTool[]>([]);

  const [isScanning, setIsScanning] = useState(false);

  const [scanError, setScanError] =
    useState<string | null>(null);

  const [homebrewPackages, setHomebrewPackages] =
    useState<HomebrewPackage[]>([]);

  const [isLoadingHomebrew, setIsLoadingHomebrew] =
    useState(false);

  const [homebrewError, setHomebrewError] =
    useState<string | null>(null);

  const [homebrewSearch, setHomebrewSearch] = useState("");

  const [homebrewType, setHomebrewType] = useState("All");

  const [catalogSearch, setCatalogSearch] = useState("");

  // Detect development tools installed on this Mac.
  async function scanSystem() {
    setIsScanning(true);
    setScanError(null);

    try {
      const result = await invoke<DetectedTool[]>(
        "scan_development_tools"
      );

      setDetectedTools(result);
    } catch (error) {
      setScanError(String(error));
    } finally {
      setIsScanning(false);
    }
  }

  // Load installed Homebrew formulae and casks.
  async function loadHomebrewPackages() {
    setIsLoadingHomebrew(true);
    setHomebrewError(null);

    try {
      const result = await invoke<HomebrewPackage[]>(
        "get_homebrew_packages"
      );

      setHomebrewPackages(result);
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

  // Filter installed Homebrew packages.
  const filteredHomebrewPackages = homebrewPackages.filter(
    (pkg) => {
      const query = homebrewSearch.toLowerCase().trim();

      const matchesSearch = pkg.name
        .toLowerCase()
        .includes(query);

      const matchesType =
        homebrewType === "All" ||
        pkg.package_type === homebrewType;

      return matchesSearch && matchesType;
    }
  );

  // Filter the sample Explore catalog.
  const filteredCatalog = initialPackages.filter((pkg) => {
    const query = catalogSearch.toLowerCase().trim();

    return (
      pkg.name.toLowerCase().includes(query) ||
      pkg.description.toLowerCase().includes(query) ||
      pkg.category.toLowerCase().includes(query)
    );
  });

  // Count detected tools.
  const detectedCount = detectedTools.filter(
    (tool) => tool.installed
  ).length;

  // Page headings.
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
              <span className="nav-icon">{item.icon}</span>

              {item.name}

              {item.name === "Installed" && (
                <span className="nav-count">
                  {homebrewPackages.length}
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
        {/* Top navigation */}
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
          {/* Settings */}
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

              {/* ===================================== */}
              {/* DASHBOARD */}
              {/* ===================================== */}

              {activePage === "Dashboard" && (
                <>
                  {/* Dashboard statistics */}
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-top">
                        <span>Detected development tools</span>

                        <span className="stat-icon purple">
                          ▦
                        </span>
                      </div>

                      <strong>{detectedCount}</strong>

                      <span className="stat-caption">
                        Tools detected on your Mac
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

                  {/* Compact Homebrew overview */}
                  <section className="system-scan">
                    <div className="section-heading">
                      <div>
                        <h3>Homebrew Overview</h3>

                        <p>
                          A quick look at your installed packages.
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
                          : "Refresh"}
                      </button>
                    </div>

                    {homebrewError && (
                      <p className="scan-error">
                        Could not load packages: {homebrewError}
                      </p>
                    )}

                    <div className="detected-tools">
                      {homebrewPackages
                        .slice(0, 8)
                        .map((pkg) => (
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
                      homebrewPackages.length === 0 && (
                        <p className="scan-message">
                          No Homebrew packages found.
                        </p>
                      )}

                    <p className="scan-message">
                      Showing{" "}
                      {Math.min(8, homebrewPackages.length)} of{" "}
                      {homebrewPackages.length} packages.
                    </p>

                    <button
                      className="scan-button"
                      onClick={() => setActivePage("Installed")}
                    >
                      View All Installed Packages →
                    </button>
                  </section>
                </>
              )}

              {/* ===================================== */}
              {/* EXPLORE */}
              {/* ===================================== */}

              {activePage === "Explore" && (
                <section className="system-scan">
                  <div className="section-heading">
                    <div>
                      <h3>Package Catalog</h3>

                      <p>
                        Explore sample developer tools and
                        utilities.
                      </p>
                    </div>
                  </div>

                  <label className="search-box">
                    <span>⌕</span>

                    <input
                      type="search"
                      placeholder="Search packages..."
                      value={catalogSearch}
                      onChange={(event) =>
                        setCatalogSearch(event.target.value)
                      }
                    />

                    <kbd>⌘ F</kbd>
                  </label>

                  <div className="package-grid">
                    {filteredCatalog.map((pkg) => {
                      const installed = homebrewPackages.some(
                        (item) =>
                          item.package_type === "Formula" &&
                          item.name.toLowerCase() ===
                            pkg.homebrewName.toLowerCase()
                      );

                      const detected = detectedTools.some(
                        (tool) =>
                          tool.installed &&
                          (
                            tool.name.toLowerCase() ===
                              pkg.name.toLowerCase() ||
                            (
                              pkg.name === "Python" &&
                              tool.name.toLowerCase() === "python3"
                            )
                          )
                      );

                      return (
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
                                installed || detected
                                  ? "installed"
                                  : ""
                              }`}
                            >
                              <span />

                              {installed || detected
                                ? "Installed"
                                : "Catalog"}
                            </span>
                          </div>

                          <h4>{pkg.name}</h4>

                          <p className="package-description">
                            {pkg.description}
                          </p>

                          <div className="package-meta">
                            <span>{pkg.category}</span>

                            <span>
                              {installed
                                ? "Homebrew"
                                : "Sample package"}
                            </span>
                          </div>

                          <button
                            className="package-action"
                            onClick={() => {
                              if (installed || detected) {
                                window.alert(
                                  `${pkg.name} appears to be installed. ` +
                                  "Actual package management is not " +
                                  "implemented yet."
                                );
                              } else {
                                window.alert(
                                  "Installation is not implemented yet. " +
                                  "This catalog is currently a preview."
                                );
                              }
                            }}
                          >
                            {installed || detected
                              ? "View Status"
                              : "Install"}

                            <span>→</span>
                          </button>
                        </article>
                      );
                    })}
                  </div>

                  {filteredCatalog.length === 0 && (
                    <div className="empty-state">
                      <span>⌕</span>

                      <h3>No packages found</h3>

                      <p>
                        Try another search term.
                      </p>
                    </div>
                  )}

                  <div className="demo-notice">
                    <span>ⓘ</span>

                    <p>
                      <strong>Catalog preview</strong>{" "}
                      These are sample catalog entries. Actual
                      installation and removal are not enabled.
                    </p>
                  </div>
                </section>
              )}

              {/* ===================================== */}
              {/* INSTALLED */}
              {/* ===================================== */}

              {activePage === "Installed" && (
                <section className="system-scan">
                  <div className="section-heading">
                    <div>
                      <h3>Installed Homebrew Packages</h3>

                      <p>
                        Software currently tracked by Homebrew
                        on this Mac.
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
                      Could not load packages: {homebrewError}
                    </p>
                  )}

                  {/* Search and package type filters */}
                  <div className="homebrew-controls">
                    <input
                      type="search"
                      className="homebrew-search"
                      placeholder="Search installed packages..."
                      value={homebrewSearch}
                      onChange={(event) =>
                        setHomebrewSearch(event.target.value)
                      }
                      aria-label="Search installed packages"
                    />

                    <select
                      className="homebrew-filter"
                      value={homebrewType}
                      onChange={(event) =>
                        setHomebrewType(event.target.value)
                      }
                      aria-label="Filter installed packages"
                    >
                      <option value="All">All types</option>
                      <option value="Formula">Formula</option>
                      <option value="Cask">Cask</option>
                    </select>
                  </div>

                  {isLoadingHomebrew &&
                    homebrewPackages.length === 0 && (
                      <p className="scan-message">
                        Loading installed packages...
                      </p>
                    )}

                  {!isLoadingHomebrew &&
                    !homebrewError &&
                    homebrewPackages.length === 0 && (
                      <p className="scan-message">
                        No Homebrew packages were returned.
                      </p>
                    )}

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
                    homebrewPackages.length > 0 &&
                    filteredHomebrewPackages.length === 0 && (
                      <div className="empty-state">
                        <span>⌕</span>

                        <h3>No matching packages</h3>

                        <p>
                          Try another search or package type.
                        </p>
                      </div>
                    )}

                  {!homebrewError && (
                    <p className="scan-message">
                      Showing {filteredHomebrewPackages.length} of{" "}
                      {homebrewPackages.length} packages
                    </p>
                  )}
                </section>
              )}

              {/* ===================================== */}
              {/* UPDATES */}
              {/* ===================================== */}

              {activePage === "Updates" && (
                <section className="system-scan">
                  <div className="section-heading">
                    <div>
                      <h3>Update Manager</h3>

                      <p>
                        Check for outdated Homebrew packages.
                      </p>
                    </div>

                    <span className="package-status">
                      Not configured
                    </span>
                  </div>

                  <div className="empty-state">
                    <span>↻</span>

                    <h3>Update detection is coming soon</h3>

                    <p>
                      MacNest currently reads your installed
                      Homebrew packages. Detecting available
                      updates and safely applying them will be
                      implemented separately.
                    </p>
                  </div>
                </section>
              )}

              {/* ===================================== */}
              {/* ACTIVITY */}
              {/* ===================================== */}

              {activePage === "Activity" && (
                <section className="system-scan">
                  <div className="section-heading">
                    <div>
                      <h3>Activity History</h3>

                      <p>
                        Review package management activity.
                      </p>
                    </div>
                  </div>

                  <div className="empty-state">
                    <span>◷</span>

                    <h3>No activity recorded yet</h3>

                    <p>
                      Installation, removal, and update history
                      will appear here once package management
                      operations and persistent logging are
                      implemented.
                    </p>
                  </div>
                </section>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;