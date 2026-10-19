import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

// Development tools detected on the Mac.
type DetectedTool = {
  name: string;
  installed: boolean;
  version: string | null;
};

// Packages installed through Homebrew.
type HomebrewPackage = {
  name: string;
  version: string;
  package_type: string;
};

// Packages returned by the Homebrew search command.
type AvailablePackage = {
  name: string;
  package_type: string;
};

const navigation = [
  { name: "Dashboard", icon: "▦" },
  { name: "Explore", icon: "⌕" },
  { name: "Installed", icon: "▣" },
  { name: "Updates", icon: "↻" },
  { name: "Activity", icon: "◷" },
];

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  // System scan state.
  const [detectedTools, setDetectedTools] = useState<DetectedTool[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Installed Homebrew packages state.
  const [homebrewPackages, setHomebrewPackages] = useState<
    HomebrewPackage[]
  >([]);
  const [isLoadingHomebrew, setIsLoadingHomebrew] = useState(false);
  const [homebrewError, setHomebrewError] = useState<string | null>(null);

  const [homebrewSearch, setHomebrewSearch] = useState("");
  const [homebrewType, setHomebrewType] = useState("All");

  // Explore catalog state.
  const [catalogSearch, setCatalogSearch] = useState("");
  const [availablePackages, setAvailablePackages] = useState<
    AvailablePackage[]
  >([]);
  const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [hasSearchedCatalog, setHasSearchedCatalog] = useState(false);

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

  // Search real Homebrew formulae and casks.
  async function searchCatalog(query: string) {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setAvailablePackages([]);
      setCatalogError(null);
      setHasSearchedCatalog(false);
      setIsSearchingCatalog(false);
      return;
    }

    setIsSearchingCatalog(true);
    setCatalogError(null);
    setHasSearchedCatalog(true);

    try {
      const result = await invoke<AvailablePackage[]>(
        "search_homebrew_packages",
        { query: trimmedQuery }
      );

      // Avoid displaying results for an older search.
      // The input may have changed while Homebrew was running.
      setAvailablePackages((currentResults) => {
        return result;
      });
    } catch (error) {
      setCatalogError(String(error));
      setAvailablePackages([]);
    } finally {
      setIsSearchingCatalog(false);
    }
  }

  // Load system information when the application opens.
  useEffect(() => {
    void scanSystem();
    void loadHomebrewPackages();
  }, []);

  // Filter installed Homebrew packages.
  const filteredHomebrewPackages = homebrewPackages.filter((pkg) => {
    const query = homebrewSearch.toLowerCase().trim();

    const matchesSearch = pkg.name.toLowerCase().includes(query);

    const matchesType =
      homebrewType === "All" || pkg.package_type === homebrewType;

    return matchesSearch && matchesType;
  });

  // Count detected development tools.
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
          {/* SETTINGS */}
          {activePage === "Settings" ? (
            <div className="page-heading">
              <span className="eyebrow">PREFERENCES</span>

              <h2>Settings</h2>

              <p>
                Configure your MacNest package management workspace.
              </p>

              <div className="settings-panel">
                <h3>About MacNest</h3>

                <p>
                  Your personal macOS package management workspace.
                </p>

                <span className="settings-version">
                  Development build · v0.1.0
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* PAGE HEADING */}
              <div className="page-heading">
                <span className="eyebrow">
                  YOUR DEVELOPMENT WORKSPACE
                </span>

                <h2>{pageTitle}</h2>

                <p>Manage your developer tools from one place.</p>
              </div>

              {/* DASHBOARD */}
              {activePage === "Dashboard" && (
                <>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-top">
                        <span>Detected development tools</span>
                        <span className="stat-icon purple">▦</span>
                      </div>

                      <strong>{detectedCount}</strong>

                      <span className="stat-caption">
                        Tools detected on your Mac
                      </span>
                    </div>

                    <div className="stat-card">
                      <div className="stat-top">
                        <span>Homebrew packages</span>
                        <span className="stat-icon green">⌘</span>
                      </div>

                      <strong>{homebrewPackages.length}</strong>

                      <span className="stat-caption">
                        {isLoadingHomebrew
                          ? "Loading inventory..."
                          : "Formulae and casks detected"}
                      </span>
                    </div>

                    <div className="stat-card">
                      <div className="stat-top">
                        <span>Updates available</span>
                        <span className="stat-icon orange">↻</span>
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
                        <p>Developer tools detected on this Mac.</p>
                      </div>

                      <button
                        className="scan-button"
                        onClick={() => void scanSystem()}
                        disabled={isScanning}
                      >
                        {isScanning ? "Scanning..." : "Scan Again"}
                      </button>
                    </div>

                    {scanError && (
                      <p className="scan-error">
                        Scan failed: {scanError}
                      </p>
                    )}

                    {isScanning && detectedTools.length === 0 && (
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
                            <p>{tool.version ?? "Not detected"}</p>
                          </div>

                          <span
                            className={`package-status ${
                              tool.installed ? "installed" : ""
                            }`}
                          >
                            <span />
                            {tool.installed ? "Detected" : "Not detected"}
                          </span>
                        </article>
                      ))}
                    </div>
                  </section>

                  {/* Homebrew Overview */}
                  <section className="system-scan">
                    <div className="section-heading">
                      <div>
                        <h3>Homebrew Overview</h3>
                        <p>A quick look at your installed packages.</p>
                      </div>

                      <button
                        className="scan-button"
                        onClick={() => void loadHomebrewPackages()}
                        disabled={isLoadingHomebrew}
                      >
                        {isLoadingHomebrew ? "Loading..." : "Refresh"}
                      </button>
                    </div>

                    {homebrewError && (
                      <p className="scan-error">
                        Could not load packages: {homebrewError}
                      </p>
                    )}

                    <div className="detected-tools">
                      {homebrewPackages.slice(0, 8).map((pkg) => (
                        <article
                          className="detected-tool"
                          key={`${pkg.package_type}-${pkg.name}`}
                        >
                          <div>
                            <strong>{pkg.name}</strong>

                            <p>
                              {pkg.package_type} · Version {pkg.version}
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
                      Showing {Math.min(8, homebrewPackages.length)} of{" "}
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

              {/* EXPLORE */}
              {activePage === "Explore" && (
                <section className="system-scan">
                  <div className="section-heading">
                    <div>
                      <h3>Homebrew Package Catalog</h3>

                      <p>
                        Search available Homebrew formulae and casks.
                      </p>
                    </div>
                  </div>

                  <label className="search-box">
                    <span>⌕</span>

                    <input
                      type="search"
                      placeholder="Search Homebrew packages..."
                      value={catalogSearch}
                      onChange={(event) => {
                        const query = event.target.value;

                        setCatalogSearch(query);
                        void searchCatalog(query);
                      }}
                    />

                    <kbd>⌘ F</kbd>
                  </label>

                  {isSearchingCatalog && (
                    <p className="scan-message">
                      Searching Homebrew packages...
                    </p>
                  )}

                  {catalogError && (
                    <p className="scan-error">
                      Search failed: {catalogError}
                    </p>
                  )}

                  {!catalogSearch.trim() && (
                    <div className="empty-state">
                      <span>⌕</span>

                      <h3>Discover Homebrew packages</h3>

                      <p>
                        Enter a package name above to search available
                        formulae and casks.
                      </p>
                    </div>
                  )}

                  {!isSearchingCatalog &&
                    !catalogError &&
                    hasSearchedCatalog &&
                    catalogSearch.trim() !== "" &&
                    availablePackages.length > 0 && (
                      <p className="scan-message">
                        Found {availablePackages.length} search results.
                      </p>
                    )}

                  <div className="package-grid">
                    {availablePackages.map((pkg) => {
                      const installed = homebrewPackages.some(
                        (item) =>
                          item.name.toLowerCase() ===
                            pkg.name.toLowerCase() &&
                          item.package_type === pkg.package_type
                      );

                      return (
                        <article
                          className="package-card"
                          key={`${pkg.package_type}-${pkg.name}`}
                        >
                          <div className="package-card-top">
                            <div className="package-icon">
                              {pkg.package_type === "Cask" ? "▣" : "⌘"}
                            </div>

                            <span
                              className={`package-status ${
                                installed ? "installed" : ""
                              }`}
                            >
                              <span />
                              {installed ? "Installed" : "Available"}
                            </span>
                          </div>

                          <h4>{pkg.name}</h4>

                          <p className="package-description">
                            {pkg.package_type === "Cask"
                              ? "macOS application available through Homebrew."
                              : "Command-line package available through Homebrew."}
                          </p>

                          <div className="package-meta">
                            <span>{pkg.package_type}</span>
                            <span>Homebrew</span>
                          </div>

                          <button
                            className="package-action"
                            disabled={installed}
                            onClick={() => {
                              window.alert(
                                "Installation is not implemented yet. " +
                                  "MacNest will not make system changes " +
                                  "until this feature is implemented."
                              );
                            }}
                          >
                            {installed ? "Installed" : "Install"}
                            <span>→</span>
                          </button>
                        </article>
                      );
                    })}
                  </div>

                  {!isSearchingCatalog &&
                    !catalogError &&
                    hasSearchedCatalog &&
                    catalogSearch.trim() !== "" &&
                    availablePackages.length === 0 && (
                      <div className="empty-state">
                        <span>⌕</span>

                        <h3>No packages found</h3>

                        <p>
                          Try another package name.
                        </p>
                      </div>
                    )}

                  <div className="demo-notice">
                    <span>ⓘ</span>

                    <p>
                      <strong>Homebrew Catalog</strong>{" "}
                      Search results come from Homebrew. Installation and
                      removal are not enabled yet.
                    </p>
                  </div>
                </section>
              )}

              {/* INSTALLED */}
              {activePage === "Installed" && (
                <section className="system-scan">
                  <div className="section-heading">
                    <div>
                      <h3>Installed Homebrew Packages</h3>

                      <p>
                        Software currently tracked by Homebrew on this Mac.
                      </p>
                    </div>

                    <button
                      className="scan-button"
                      onClick={() => void loadHomebrewPackages()}
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
                            {pkg.package_type} · Version {pkg.version}
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

              {/* UPDATES */}
              {activePage === "Updates" && (
                <section className="system-scan">
                  <div className="section-heading">
                    <div>
                      <h3>Update Manager</h3>
                      <p>Check for outdated Homebrew packages.</p>
                    </div>

                    <span className="package-status">
                      Not configured
                    </span>
                  </div>

                  <div className="empty-state">
                    <span>↻</span>

                    <h3>Update detection is coming soon</h3>

                    <p>
                      MacNest currently reads your installed Homebrew
                      packages. Detecting available updates and safely
                      applying them will be implemented separately.
                    </p>
                  </div>
                </section>
              )}

              {/* ACTIVITY */}
              {activePage === "Activity" && (
                <section className="system-scan">
                  <div className="section-heading">
                    <div>
                      <h3>Activity History</h3>
                      <p>Review package management activity.</p>
                    </div>
                  </div>

                  <div className="empty-state">
                    <span>◷</span>

                    <h3>No activity recorded yet</h3>

                    <p>
                      Installation, removal, and update history will
                      appear here once package management operations
                      and persistent logging are implemented.
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