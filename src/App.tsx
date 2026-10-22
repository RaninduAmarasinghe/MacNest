import { useEffect, useRef, useState } from "react";
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

type OutdatedPackage = {
  name: string;
  package_type: string;
  installed_version: string;
  available_version: string;
};

type ActivityRecord = {
  id: string;
  action: "Install" | "Uninstall" | "Update" | "Update all";
  package_name: string;
  package_type: string;
  status: "Completed" | "Failed";
  timestamp: number;
  message?: string;
};

const ACTIVITY_STORAGE_KEY = "macnest.packageActivity";

function loadActivityRecords(): ActivityRecord[] {
  try {
    const stored = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? (parsed as ActivityRecord[]) : [];
  } catch {
    return [];
  }
}

const navigation = [
  { name: "Dashboard" },
  { name: "Explore" },
  { name: "Installed" },
  { name: "Updates" },
  { name: "Activity" },
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

  // Outdated Homebrew packages.
  const [outdatedPackages, setOutdatedPackages] = useState<OutdatedPackage[]>(
    []
  );
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [updatingPackages, setUpdatingPackages] = useState<string[]>([]);
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);

  // Recent package activity is stored locally in this app's WebView.
  const [activityRecords, setActivityRecords] = useState<ActivityRecord[]>(
    loadActivityRecords
  );

  // Explore catalog state.
  const [catalogSearch, setCatalogSearch] = useState("");
  const [availablePackages, setAvailablePackages] = useState<
    AvailablePackage[]
  >([]);
  const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [hasSearchedCatalog, setHasSearchedCatalog] = useState(false);
  const catalogSearchId = useRef(0);

  // Installation state.
  const [installingPackages, setInstallingPackages] = useState<string[]>(
    []
  );
  const [installMessage, setInstallMessage] = useState<string | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);

  // Uninstallation state.
  const [uninstallingPackages, setUninstallingPackages] = useState<
    string[]
  >([]);
  const [confirmingUninstall, setConfirmingUninstall] = useState<string | null>(
    null
  );
  const [uninstallMessage, setUninstallMessage] = useState<string | null>(
    null
  );
  const [uninstallError, setUninstallError] = useState<string | null>(null);

  function recordActivity(
    action: ActivityRecord["action"],
    packageName: string,
    packageType: string,
    status: ActivityRecord["status"],
    message?: string
  ) {
    setActivityRecords((current) => {
      const record: ActivityRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        action,
        package_name: packageName,
        package_type: packageType,
        status,
        timestamp: Date.now(),
        message,
      };
      const next = [record, ...current].slice(0, 200);
      return next;
    });
  }

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

  async function loadOutdatedPackages() {
    setIsLoadingUpdates(true);
    setUpdateError(null);

    try {
      const result = await invoke<OutdatedPackage[]>(
        "get_outdated_homebrew_packages"
      );
      setOutdatedPackages(result);
      return result;
    } catch (error) {
      setUpdateError(String(error));
      return null;
    } finally {
      setIsLoadingUpdates(false);
    }
  }

  // Install a Homebrew formula or cask.
  async function installPackage(pkg: AvailablePackage) {
    const packageKey = `${pkg.package_type}-${pkg.name}`;

    // Prevent duplicate operations.
    if (
      installingPackages.includes(packageKey) ||
      uninstallingPackages.includes(packageKey) ||
      updatingPackages.includes(packageKey) ||
      isUpdatingAll
    ) {
      return;
    }

    // Check whether the package is already installed.
    const alreadyInstalled = homebrewPackages.some(
      (item) =>
        item.name.toLowerCase() === pkg.name.toLowerCase() &&
        item.package_type.toLowerCase() ===
          pkg.package_type.toLowerCase()
    );

    if (alreadyInstalled) {
      setInstallMessage(`${pkg.name} is already installed.`);
      setInstallError(null);
      return;
    }

    setInstallingPackages((current) => [...current, packageKey]);
    setInstallMessage(null);
    setInstallError(null);
    setUninstallMessage(null);
    setUninstallError(null);

    try {
      const result = await invoke<string>(
        "install_homebrew_package",
        {
          name: pkg.name,
          packageType: pkg.package_type,
        }
      );

      setInstallMessage(result);
      recordActivity("Install", pkg.name, pkg.package_type, "Completed");

      // Refresh inventory after installation.
      await loadHomebrewPackages();
    } catch (error) {
      recordActivity(
        "Install",
        pkg.name,
        pkg.package_type,
        "Failed",
        String(error)
      );
      setInstallError(
        `Could not install ${pkg.name}: ${String(error)}`
      );
    } finally {
      setInstallingPackages((current) =>
        current.filter((key) => key !== packageKey)
      );
    }
  }

  // Uninstall an installed Homebrew formula or cask.
  async function uninstallPackage(pkg: HomebrewPackage) {
    const packageKey = `${pkg.package_type}-${pkg.name}`;

    // Prevent duplicate operations.
    if (
      uninstallingPackages.includes(packageKey) ||
      installingPackages.includes(packageKey) ||
      updatingPackages.includes(packageKey) ||
      isUpdatingAll
    ) {
      return;
    }

    // Use an in-app confirmation instead of a WebView-native modal.
    if (confirmingUninstall !== packageKey) {
      setConfirmingUninstall(packageKey);
      return;
    }

    setConfirmingUninstall(null);
    setUninstallingPackages((current) => [...current, packageKey]);
    setUninstallMessage(null);
    setUninstallError(null);
    setInstallMessage(null);
    setInstallError(null);

    try {
      const result = await invoke<string>(
        "uninstall_homebrew_package",
        {
          name: pkg.name,
          packageType: pkg.package_type,
        }
      );

      setUninstallMessage(result);
      recordActivity("Uninstall", pkg.name, pkg.package_type, "Completed");

      // Refresh inventory after successful removal.
      await loadHomebrewPackages();
    } catch (error) {
      recordActivity(
        "Uninstall",
        pkg.name,
        pkg.package_type,
        "Failed",
        String(error)
      );
      setUninstallError(
        `Could not uninstall ${pkg.name}: ${String(error)}`
      );
    } finally {
      setUninstallingPackages((current) =>
        current.filter((key) => key !== packageKey)
      );
    }
  }

  async function updatePackage(pkg: OutdatedPackage) {
    const packageKey = `${pkg.package_type}-${pkg.name}`;
    if (
      updatingPackages.includes(packageKey) ||
      installingPackages.includes(packageKey) ||
      uninstallingPackages.includes(packageKey) ||
      isUpdatingAll
    ) return;

    setUpdatingPackages((current) => [...current, packageKey]);
    setUpdateError(null);
    setUpdateMessage(null);

    try {
      const result = await invoke<string>("update_homebrew_package", {
        name: pkg.name,
        packageType: pkg.package_type,
      });
      setUpdateMessage(result);
      recordActivity("Update", pkg.name, pkg.package_type, "Completed");
      await Promise.all([loadOutdatedPackages(), loadHomebrewPackages()]);
    } catch (error) {
      recordActivity(
        "Update",
        pkg.name,
        pkg.package_type,
        "Failed",
        String(error)
      );
      setUpdateError(`Could not update ${pkg.name}: ${String(error)}`);
    } finally {
      setUpdatingPackages((current) =>
        current.filter((key) => key !== packageKey)
      );
    }
  }

  async function updateAllPackages() {
    if (
      isUpdatingAll ||
      updatingPackages.length > 0 ||
      installingPackages.length > 0 ||
      uninstallingPackages.length > 0
    ) return;

    const packagesToUpdate = outdatedPackages;
    setIsUpdatingAll(true);
    setUpdateError(null);
    setUpdateMessage(null);

    try {
      const result = await invoke<string>("update_all_homebrew_packages");
      setUpdateMessage(result);
      recordActivity(
        "Update all",
        `${packagesToUpdate.length} packages`,
        "Formulae and casks",
        "Completed"
      );
      await Promise.all([loadOutdatedPackages(), loadHomebrewPackages()]);
    } catch (error) {
      recordActivity(
        "Update all",
        `${packagesToUpdate.length} packages`,
        "Formulae and casks",
        "Failed",
        String(error)
      );
      setUpdateError(`Could not update packages: ${String(error)}`);
    } finally {
      setIsUpdatingAll(false);
    }
  }

  // Search real Homebrew formulae and casks.
  async function searchCatalog(query: string) {
    const searchId = ++catalogSearchId.current;
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

      if (searchId !== catalogSearchId.current) return;
      setAvailablePackages(result);
    } catch (error) {
      if (searchId !== catalogSearchId.current) return;
      setCatalogError(String(error));
      setAvailablePackages([]);
    } finally {
      if (searchId === catalogSearchId.current) {
        setIsSearchingCatalog(false);
      }
    }
  }

  // Load system information when the application opens.
  useEffect(() => {
    void scanSystem();
    void loadHomebrewPackages();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activityRecords));
    } catch {
      // Keep the current session usable if local storage is unavailable.
    }
  }, [activityRecords]);

  useEffect(() => {
    if (activePage === "Updates") {
      void loadOutdatedPackages();
    }
  }, [activePage]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void searchCatalog(catalogSearch);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [catalogSearch]);

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
      ? "Overview"
      : activePage === "Explore"
        ? "Explore packages"
        : activePage === "Installed"
          ? "Installed packages"
          : activePage === "Updates"
            ? "Updates"
            : activePage === "Activity"
              ? "Activity"
              : activePage === "Settings"
                ? "Settings"
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
              aria-current={activePage === item.name ? "page" : undefined}
              aria-label={item.name}
              onClick={() => setActivePage(item.name)}
            >
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
            Settings
          </button>

          <div className="system-card">
            <div className="system-dot" />

            <div>
              <strong>MacNest is ready</strong>
              <span>macOS · Local machine</span>
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
              <span className="breadcrumb-divider">›</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            <span className="status-indicator" />
            <span>System ready</span>

          </div>
        </header>

        <section className="page-content">
          {installingPackages.map((packageKey) => {
            const packageName = packageKey.replace(/^(Formula|Cask)-/, "");

            return (
              <div className="package-progress" key={packageKey} role="status">
                <div className="package-progress-heading">
                  <strong>Downloading and installing {packageName}</strong>
                  <span>In progress</span>
                </div>

                <div
                  className="package-progress-track"
                  role="progressbar"
                  aria-label={`Installing ${packageName}`}
                  aria-valuetext="Homebrew is downloading and installing the package"
                >
                  <span />
                </div>

                <p>Homebrew is downloading and installing this package.</p>
              </div>
            );
          })}

          {updatingPackages.map((packageKey) => {
            const packageName = packageKey.replace(/^(Formula|Cask)-/, "");

            return (
              <div className="package-progress" key={`update-${packageKey}`} role="status">
                <div className="package-progress-heading">
                  <strong>Updating {packageName}</strong>
                  <span>In progress</span>
                </div>
                <div
                  className="package-progress-track"
                  role="progressbar"
                  aria-label={`Updating ${packageName}`}
                  aria-valuetext="Homebrew is downloading and updating this package"
                >
                  <span />
                </div>
                <p>Homebrew is downloading and installing the update.</p>
              </div>
            );
          })}

          {isUpdatingAll && (
            <div className="package-progress" role="status">
              <div className="package-progress-heading">
                <strong>Updating all outdated packages</strong>
                <span>In progress</span>
              </div>
              <div
                className="package-progress-track"
                role="progressbar"
                aria-label="Updating all outdated packages"
                aria-valuetext="Homebrew is updating outdated packages"
              >
                <span />
              </div>
              <p>Homebrew is downloading and installing updates.</p>
            </div>
          )}

          {/* SETTINGS */}
          {activePage === "Settings" ? (
            <div className="page-heading">
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
                            {tool.installed
                              ? "Detected"
                              : "Not detected"}
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

                        catalogSearchId.current += 1;
                        setCatalogSearch(query);
                        setAvailablePackages([]);
                        setCatalogError(null);
                        setIsSearchingCatalog(false);
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

                  {installMessage && (
                    <p className="install-success" role="status">
                      {installMessage}
                    </p>
                  )}

                  {installError && (
                    <p className="scan-error" role="alert">
                      {installError}
                    </p>
                  )}

                  {uninstallMessage && (
                    <p className="install-success" role="status">
                      {uninstallMessage}
                    </p>
                  )}

                  {uninstallError && (
                    <p className="scan-error" role="alert">
                      {uninstallError}
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
                      const packageKey =
                        `${pkg.package_type}-${pkg.name}`;

                      const installed = homebrewPackages.some(
                        (item) =>
                          item.name.toLowerCase() ===
                            pkg.name.toLowerCase() &&
                          item.package_type.toLowerCase() ===
                            pkg.package_type.toLowerCase()
                      );

                      const isInstalling =
                        installingPackages.includes(packageKey);

                      const isUpdating = updatingPackages.includes(packageKey);

                      const isUninstalling =
                        uninstallingPackages.includes(packageKey);

                      return (
                        <article
                          className="package-card"
                          key={packageKey}
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
                            type="button"
                            className="package-action"
                            disabled={
                              installed ||
                              isInstalling ||
                              isUninstalling ||
                              isUpdating ||
                              isUpdatingAll
                            }
                            onClick={() => void installPackage(pkg)}
                          >
                            {installed
                              ? "Installed"
                              : isInstalling
                                ? "Installing..."
                                : isUninstalling
                                  ? "Uninstalling..."
                                  : "Install"}

                            <span>
                              {isInstalling || isUninstalling
                                ? "…"
                                : installed
                                  ? "✓"
                                  : "→"}
                            </span>
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

                        <p>Try another package name.</p>
                      </div>
                    )}

                  <div className="demo-notice">
                    <span>ⓘ</span>

                    <p>
                      <strong>Homebrew Catalog</strong>{" "}
                      Search results come from Homebrew. Packages can be
                      installed through MacNest, and installed packages can
                      be removed from the Installed page.
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

                  {uninstallMessage && (
                    <p className="install-success" role="status">
                      {uninstallMessage}
                    </p>
                  )}

                  {uninstallError && (
                    <p className="scan-error" role="alert">
                      {uninstallError}
                    </p>
                  )}

                  {installMessage && (
                    <p className="install-success" role="status">
                      {installMessage}
                    </p>
                  )}

                  {installError && (
                    <p className="scan-error" role="alert">
                      {installError}
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
                    {filteredHomebrewPackages.map((pkg) => {
                      const packageKey =
                        `${pkg.package_type}-${pkg.name}`;

                      const isUninstalling =
                        uninstallingPackages.includes(packageKey);

                      const isInstalling =
                        installingPackages.includes(packageKey);

                      const isUpdating = updatingPackages.includes(packageKey);

                      return (
                        <article
                          className="detected-tool"
                          key={packageKey}
                        >
                          <div>
                            <strong>{pkg.name}</strong>

                            <p>
                              {pkg.package_type} · Version {pkg.version}
                            </p>
                          </div>

                          <div className="installed-actions">
                            <span className="package-status installed">
                              <span />
                              Installed
                            </span>

                            {confirmingUninstall === packageKey && (
                              <span className="uninstall-confirmation">
                                Remove this package?
                              </span>
                            )}

                            <button
                              type="button"
                              className="uninstall-button"
                              disabled={
                                isUninstalling || isInstalling || isUpdating || isUpdatingAll
                              }
                              onClick={() => {
                                if (confirmingUninstall === packageKey) {
                                  void uninstallPackage(pkg);
                                } else {
                                  setConfirmingUninstall(packageKey);
                                }
                              }}
                            >
                              {isUninstalling
                                ? "Uninstalling..."
                                : confirmingUninstall === packageKey
                                  ? "Confirm uninstall"
                                  : "Uninstall"}
                            </button>

                            {confirmingUninstall === packageKey && (
                              <button
                                type="button"
                                className="cancel-uninstall-button"
                                onClick={() => setConfirmingUninstall(null)}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </article>
                      );
                    })}
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
                      <h3>Available updates</h3>
                      <p>
                        {outdatedPackages.length === 1
                          ? "1 Homebrew package can be updated."
                          : `${outdatedPackages.length} Homebrew packages can be updated.`}
                      </p>
                    </div>

                    <div className="update-controls">
                      <button
                        type="button"
                        className="scan-button"
                        onClick={() => void loadOutdatedPackages()}
                        disabled={isLoadingUpdates || isUpdatingAll}
                      >
                        {isLoadingUpdates ? "Checking..." : "Check again"}
                      </button>
                      <button
                        type="button"
                        className="update-all-button"
                        onClick={() => void updateAllPackages()}
                        disabled={
                          isLoadingUpdates ||
                          outdatedPackages.length === 0 ||
                          isUpdatingAll ||
                          updatingPackages.length > 0 ||
                          installingPackages.length > 0 ||
                          uninstallingPackages.length > 0
                        }
                      >
                        {isUpdatingAll ? "Updating..." : "Update all"}
                      </button>
                    </div>
                  </div>

                  {updateError && (
                    <p className="scan-error" role="alert">
                      Could not check or update packages: {updateError}
                    </p>
                  )}

                  {updateMessage && (
                    <p className="install-success" role="status">
                      {updateMessage}
                    </p>
                  )}

                  {isLoadingUpdates && outdatedPackages.length === 0 && (
                    <p className="scan-message">Checking Homebrew for updates...</p>
                  )}

                  {!isLoadingUpdates && !updateError && outdatedPackages.length === 0 && (
                    <div className="empty-state">
                      <h3>Everything is up to date</h3>
                      <p>Homebrew did not report any outdated formulae or casks.</p>
                    </div>
                  )}

                  {outdatedPackages.length > 0 && (
                    <div className="update-list">
                      {outdatedPackages.map((pkg) => {
                        const packageKey = `${pkg.package_type}-${pkg.name}`;
                        const isUpdating = updatingPackages.includes(packageKey);

                        return (
                          <article className="update-row" key={packageKey}>
                            <div className="update-package-name">
                              <strong>{pkg.name}</strong>
                              <span>{pkg.package_type}</span>
                            </div>
                            <div className="update-version">
                              <span>Installed</span>
                              <strong>{pkg.installed_version || "Unknown"}</strong>
                            </div>
                            <div className="update-version available-version">
                              <span>Available</span>
                              <strong>{pkg.available_version}</strong>
                            </div>
                            <button
                              type="button"
                              className="update-all-button"
                              onClick={() => void updatePackage(pkg)}
                              disabled={
                                isUpdating ||
                                isUpdatingAll ||
                                installingPackages.includes(packageKey) ||
                                uninstallingPackages.includes(packageKey)
                              }
                            >
                              {isUpdating ? "Updating..." : "Update"}
                            </button>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              {/* ACTIVITY */}
              {activePage === "Activity" && (
                <section className="system-scan">
                  <div className="section-heading">
                    <div>
                      <h3>Recent activity</h3>
                      <p>Package operations recorded on this Mac.</p>
                    </div>
                  </div>

                  {activityRecords.length === 0 ? (
                    <div className="empty-state">
                      <h3>No package activity yet</h3>
                      <p>Installs, removals, and updates will appear here.</p>
                    </div>
                  ) : (
                    <div className="activity-list">
                      {activityRecords.map((record) => (
                        <article className="activity-row" key={record.id}>
                          <span
                            className={`activity-indicator ${
                              record.status === "Failed" ? "failed" : "completed"
                            }`}
                          />
                          <div className="activity-main">
                            <strong>
                              {record.action} · {record.package_name}
                            </strong>
                            <span>
                              {record.package_type}
                              {record.message ? ` · ${record.message}` : ""}
                            </span>
                          </div>
                          <span className={`activity-status ${record.status.toLowerCase()}`}>
                            {record.status}
                          </span>
                          <time dateTime={new Date(record.timestamp).toISOString()}>
                            {new Intl.DateTimeFormat(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(record.timestamp)}
                          </time>
                        </article>
                      ))}
                    </div>
                  )}
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
