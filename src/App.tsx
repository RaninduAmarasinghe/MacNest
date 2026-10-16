import { useState } from "react";
import "./App.css";

type Package = {
  name: string;
  description: string;
  category: string;
  version: string;
  icon: string;
  installed: boolean;
};

const initialPackages: Package[] = [
  {
    name: "Node.js",
    description: "JavaScript runtime for building applications.",
    category: "Development",
    version: "22.x",
    icon: "⬢",
    installed: true,
  },
  {
    name: "Python",
    description: "A versatile programming language.",
    category: "Languages",
    version: "3.x",
    icon: "🐍",
    installed: true,
  },
  {
    name: "Git",
    description: "Distributed version control system.",
    category: "Development",
    version: "2.x",
    icon: "⌘",
    installed: true,
  },
  {
    name: "PostgreSQL",
    description: "Powerful open-source relational database.",
    category: "Databases",
    version: "—",
    icon: "◉",
    installed: false,
  },
  {
    name: "Rust",
    description: "A language for reliable, efficient software.",
    category: "Languages",
    version: "—",
    icon: "⚙",
    installed: false,
  },
  {
    name: "ripgrep",
    description: "Fast command-line text search utility.",
    category: "Utilities",
    version: "—",
    icon: "⌕",
    installed: false,
  },
];

function App() {
  const [packages, setPackages] = useState(initialPackages);
  const [activePage, setActivePage] = useState("Dashboard");
  const [search, setSearch] = useState("");

  const installedPackages = packages.filter(
    (pkg) => pkg.installed,
  );

  const visiblePackages = packages.filter((pkg) => {
    const matchesSearch =
      pkg.name.toLowerCase().includes(search.toLowerCase()) ||
      pkg.description.toLowerCase().includes(search.toLowerCase());

    if (activePage === "Installed") {
      return pkg.installed && matchesSearch;
    }

    if (activePage === "Explore") {
      return matchesSearch;
    }

    return matchesSearch;
  });

  function togglePackage(name: string) {
    setPackages((current) =>
      current.map((pkg) =>
        pkg.name === name
          ? {
              ...pkg,
              installed: !pkg.installed,
              version: !pkg.installed ? "Latest" : "—",
            }
          : pkg,
      ),
    );
  }

  const navigation = [
    { name: "Dashboard", icon: "▦" },
    { name: "Explore", icon: "⌕" },
    { name: "Installed", icon: "▣" },
    { name: "Updates", icon: "↻" },
    { name: "Activity", icon: "◷" },
  ];

  return (
    <div className="app-shell">
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
              <div className="page-heading">
                <span className="eyebrow">YOUR DEVELOPMENT WORKSPACE</span>
                <h2>
                  {activePage === "Dashboard"
                    ? "Everything in its place."
                    : activePage === "Explore"
                      ? "Explore packages."
                      : activePage === "Installed"
                        ? "Your installed packages."
                        : activePage === "Updates"
                          ? "Package updates."
                          : activePage === "Activity"
                            ? "Recent activity."
                            : activePage}
                </h2>

                <p>
                  Manage your developer tools from one place.
                </p>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-top">
                    <span>Managed packages</span>
                    <span className="stat-icon purple">▦</span>
                  </div>
                  <strong>{installedPackages.length}</strong>
                  <span className="stat-caption">
                    Packages in this demo workspace
                  </span>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Available packages</span>
                    <span className="stat-icon green">⌘</span>
                  </div>
                  <strong>{packages.length}</strong>
                  <span className="stat-caption">
                    Sample package catalog
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

              <div className="section-heading">
                <div>
                  <h3>
                    {activePage === "Installed"
                      ? "Installed packages"
                      : activePage === "Updates"
                        ? "Update manager"
                        : activePage === "Activity"
                          ? "Activity overview"
                          : activePage === "Explore"
                            ? "Package catalog"
                            : "Your packages"}
                  </h3>
                  <p>
                    {activePage === "Updates"
                      ? "Live update detection will be added later."
                      : activePage === "Activity"
                        ? "Installation history will be connected later."
                        : "Explore the sample catalog and interface."}
                  </p>
                </div>

                <label className="search-box">
                  <span>⌕</span>
                  <input
                    type="search"
                    placeholder="Search packages..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <kbd>⌘ F</kbd>
                </label>
              </div>

              <div className="package-grid">
                {visiblePackages.map((pkg) => (
                  <article className="package-card" key={pkg.name}>
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
                        {pkg.installed ? "Installed" : "Available"}
                      </span>
                    </div>

                    <h4>{pkg.name}</h4>
                    <p className="package-description">
                      {pkg.description}
                    </p>

                    <div className="package-meta">
                      <span>{pkg.category}</span>
                      <span>v{pkg.version}</span>
                    </div>

                    <button
                      className={`package-action ${
                        pkg.installed ? "secondary-action" : ""
                      }`}
                      onClick={() => togglePackage(pkg.name)}
                    >
                      {pkg.installed ? "Uninstall" : "Install"}
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

              <div className="demo-notice">
                <span>ⓘ</span>
                <p>
                  <strong>Preview mode</strong>
                  {" "}Package status is simulated. Install and uninstall
                  buttons currently update the interface only; they do
                  not install software on your Mac.
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