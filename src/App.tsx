import { useEffect, useRef, useState } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { listen } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";
import macnestIcon from "../macnest-icon.png";
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

type Appearance = "system" | "light" | "dark";

const ACTIVITY_STORAGE_KEY = "macnest.packageActivity";
const AUTO_UPDATE_CHECK_KEY = "macnest.autoUpdateCheck";
const APPEARANCE_STORAGE_KEY = "macnest.appearance";
const LAST_UPDATE_CHECK_KEY = "macnest.lastUpdateCheck";
const MACNEST_REPOSITORY_URL = "https://github.com/RaninduAmarasinghe/MacNest";
const MACNEST_RELEASES_URL = `${MACNEST_REPOSITORY_URL}/releases`;
const APPEARANCE_OPTIONS: Array<{ value: Appearance; label: string; description: string }> = [
  { value: "system", label: "System", description: "Follow macOS system appearance." },
  { value: "light", label: "Light", description: "Always use light mode." },
  { value: "dark", label: "Dark", description: "Always use dark mode." },
];

function loadActivityRecords(): ActivityRecord[] {
  try {
    const stored = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? (parsed as ActivityRecord[]) : [];
  } catch {
    return [];
  }
}

function loadLastUpdateCheck(): number | null {
  try {
    const stored = localStorage.getItem(LAST_UPDATE_CHECK_KEY);
    const timestamp = stored ? Number(stored) : NaN;
    return Number.isFinite(timestamp) ? timestamp : null;
  } catch {
    return null;
  }
}

function loadAppearancePreference(): Appearance {
  try {
    const stored = localStorage.getItem(APPEARANCE_STORAGE_KEY);
    return stored === "light" || stored === "dark" || stored === "system"
      ? stored
      : "system";
  } catch {
    return "system";
  }
}

const navigation = [
  { name: "Dashboard", icon: "overview" },
  { name: "Explore", icon: "search" },
  { name: "Installed", icon: "box" },
  { name: "Updates", icon: "refresh" },
  { name: "Activity", icon: "activity" },
];

function SidebarIcon({ name }: { name: string }) {
  const shared = {
    width: 17,
    height: 17,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "overview":
      return <svg {...shared}><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></svg>;
    case "search":
      return <svg {...shared}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.2 4.2" /></svg>;
    case "box":
      return <svg {...shared}><path d="m12 3.7 8.2 4.1v8.4L12 20.3l-8.2-4.1V7.8L12 3.7Z" /><path d="m3.8 7.8 8.2 4.1 8.2-4.1M12 12v8.3" /></svg>;
    case "refresh":
      return <svg {...shared}><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6 9a6.5 6.5 0 0 1 11-2L20 12M4 12l3 5a6.5 6.5 0 0 0 11-2" /></svg>;
    case "activity":
      return <svg {...shared}><path d="M3 12h4l2.2-6 4.1 12 2.2-6H21" /></svg>;
    case "settings":
      return <svg {...shared}><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.1 1.9-1.8 3.1-2.2-.4a8 8 0 0 1-1.6.9l-1.1 1.8h-3.6l-1.1-1.8a8 8 0 0 1-1.6-.9l-2.2.4-1.8-3.1 1.1-1.9a7 7 0 0 1 0-1.9l-1.1-1.9 1.8-3.1 2.2.4a8 8 0 0 1 1.6-.9l1.1-1.8h3.6l1.1 1.8a8 8 0 0 1 1.6.9l2.2-.4 1.8 3.1-1.1 1.9a7 7 0 0 1 0 1.8Z" transform="translate(0 -1) scale(.92)" /></svg>;
    case "brew":
      return <svg {...shared}><path d="M7 6h10l-.7 14H7.7L7 6Z" /><path d="M6 6h12M9 3.5h6M9 10h6M9 13h6" /></svg>;
    case "app":
      return <svg {...shared}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M4 8h16M7 6h.01M10 6h.01" /></svg>;
    case "terminal":
      return <svg {...shared}><rect x="3.5" y="4" width="17" height="16" rx="3" /><path d="m7 9 3 3-3 3m6 0h4" /></svg>;
    case "info":
      return <svg {...shared}><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></svg>;
    case "check":
      return <svg {...shared}><path d="m5 12.5 4.2 4.2L19 7" /></svg>;
    case "arrow":
      return <svg {...shared}><path d="M5 12h14m-6-6 6 6-6 6" /></svg>;
    default:
      return null;
  }
}

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const mainContentRef = useRef<HTMLElement | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (activePage === "Settings") mainContentRef.current?.scrollTo(0, 0);
  }, [activePage]);
  const [appearance, setAppearance] = useState<Appearance>(loadAppearancePreference);
  const [appVersion, setAppVersion] = useState("0.1.0");
  const [autoUpdateCheck, setAutoUpdateCheck] = useState(() => {
    try {
      return localStorage.getItem(AUTO_UPDATE_CHECK_KEY) !== "false";
    } catch {
      return true;
    }
  });
  const [availableAppUpdate, setAvailableAppUpdate] = useState<Update | null>(null);
  const [isCheckingAppUpdate, setIsCheckingAppUpdate] = useState(false);
  const [isInstallingAppUpdate, setIsInstallingAppUpdate] = useState(false);
  const [appUpdateProgress, setAppUpdateProgress] = useState<string | null>(null);
  const [appUpdateMessage, setAppUpdateMessage] = useState<string | null>(null);
  const [appUpdateError, setAppUpdateError] = useState<string | null>(null);
  const [lastUpdateCheck, setLastUpdateCheck] = useState<number | null>(
    loadLastUpdateCheck
  );

  // System scan state.
  const [detectedTools, setDetectedTools] = useState<DetectedTool[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Installed Homebrew packages state.
  const [homebrewPackages, setHomebrewPackages] = useState<
    HomebrewPackage[]
  >([]);
  const [isLoadingHomebrew, setIsLoadingHomebrew] = useState(true);
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
  const availableAppUpdateRef = useRef<Update | null>(null);
  const isCheckingAppUpdateRef = useRef(false);
  const checkForAppUpdateRef = useRef<() => Promise<void>>(async () => undefined);

  availableAppUpdateRef.current = availableAppUpdate;

  async function checkForAppUpdate() {
    if (!isTauri()) {
      setAppUpdateMessage("App updates are available in the installed MacNest app.");
      return;
    }
    if (isCheckingAppUpdateRef.current) return;
    isCheckingAppUpdateRef.current = true;
    setIsCheckingAppUpdate(true);
    setAppUpdateError(null);
    setAppUpdateMessage("Checking for updates…");
    try {
      const update = await check();
      const previousUpdate = availableAppUpdateRef.current;
      if (previousUpdate) {
        try {
          await previousUpdate.close();
        } catch {
          // The newly checked update is still usable if closing the old one fails.
        }
      }
      availableAppUpdateRef.current = update;
      setAvailableAppUpdate(update);
      setAppUpdateMessage(update ? null : "You’re up to date.");
      if (!update) setAppUpdateProgress(null);
    } catch (error) {
      setAppUpdateMessage(null);
      setAppUpdateError(`Could not check for updates: ${String(error)}`);
    } finally {
      const completedAt = Date.now();
      setLastUpdateCheck(completedAt);
      isCheckingAppUpdateRef.current = false;
      setIsCheckingAppUpdate(false);
    }
  }

  checkForAppUpdateRef.current = checkForAppUpdate;

  async function installAppUpdate() {
    if (!availableAppUpdate) return;
    setIsInstallingAppUpdate(true);
    setAppUpdateError(null);
    setAppUpdateProgress("Preparing update…");
    try {
      await availableAppUpdate.downloadAndInstall((event) => {
        if (event.event === "Started") {
          setAppUpdateProgress("Downloading update…");
        } else if (event.event === "Progress") {
          setAppUpdateProgress("Downloading update…");
        } else if (event.event === "Finished") {
          setAppUpdateProgress("Installing update…");
        }
      });
      setAppUpdateProgress("Update installed. Restarting MacNest…");
      await relaunch();
    } catch (error) {
      setAppUpdateError(`Update could not be installed: ${String(error)}`);
      setAppUpdateProgress(null);
      setIsInstallingAppUpdate(false);
    }
  }

  useEffect(() => {
    if (isTauri()) void getVersion().then(setAppVersion).catch(() => undefined);
    if (autoUpdateCheck && isTauri()) void checkForAppUpdate();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const systemAppearance = window.matchMedia("(prefers-color-scheme: dark)");
    const applyAppearance = () => {
      root.dataset.theme = appearance === "system"
        ? systemAppearance.matches ? "dark" : "light"
        : appearance;
    };

    applyAppearance();
    if (appearance !== "system") return;

    systemAppearance.addEventListener("change", applyAppearance);
    return () => systemAppearance.removeEventListener("change", applyAppearance);
  }, [appearance]);

  useEffect(() => {
    try {
      localStorage.setItem(APPEARANCE_STORAGE_KEY, appearance);
    } catch {
      // The selected appearance remains active for this session if storage is unavailable.
    }
  }, [appearance]);

  useEffect(() => {
    if (!isTauri()) return;

    let disposed = false;
    let unlisten: Array<() => void> = [];

    void Promise.all([
      listen("macnest-open-settings", () => setActivePage("Settings")),
      listen("macnest-check-for-updates", () => {
        setActivePage("Settings");
        void checkForAppUpdateRef.current();
      }),
    ])
      .then((listeners) => {
        if (disposed) {
          listeners.forEach((stopListening) => stopListening());
        } else {
          unlisten = listeners;
        }
      })
      .catch((error) => {
        console.error("MacNest could not listen for application menu actions:", error);
      });

    return () => {
      disposed = true;
      unlisten.forEach((stopListening) => stopListening());
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(AUTO_UPDATE_CHECK_KEY, String(autoUpdateCheck));
    } catch {
      // Keep the setting available for this session if storage is unavailable.
    }
  }, [autoUpdateCheck]);

  useEffect(() => {
    if (lastUpdateCheck === null) return;
    try {
      localStorage.setItem(LAST_UPDATE_CHECK_KEY, String(lastUpdateCheck));
    } catch {
      // The current session can still show the completed check time.
    }
  }, [lastUpdateCheck]);

  async function openExternalUrl(url: string) {
    if (isTauri()) {
      await openUrl(url);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

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
    void loadOutdatedPackages();
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
  const homebrewMissing = Boolean(
    homebrewError && /could not execute homebrew|no such file|not found/i.test(homebrewError)
  );
  const homebrewStatus = homebrewError
    ? homebrewMissing ? "Not installed" : "Unavailable"
    : isLoadingHomebrew
      ? "Checking"
      : "Ready";
  const dashboardStatus = isScanning
    ? "Scanning development tools"
    : scanError
      ? "Scan unavailable"
      : isLoadingHomebrew
        ? "Checking Homebrew"
        : homebrewError
          ? "Homebrew unavailable"
          : "Your Mac is ready";
  const dashboardStatusTone = scanError || homebrewError
    ? "offline"
    : isScanning || isLoadingHomebrew
      ? "checking"
      : "";

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
  const pageDescription = activePage === "Explore"
    ? "Find formulae and apps available through Homebrew."
    : activePage === "Installed"
      ? "Review and manage packages installed on this Mac."
      : activePage === "Updates"
        ? "Keep your Homebrew packages current."
        : activePage === "Activity"
          ? "Recent package changes made from MacNest."
          : "Manage your developer tools from one place.";
  const greeting = currentTime.getHours() < 12
    ? "Good morning"
    : currentTime.getHours() < 18
      ? "Good afternoon"
      : "Good evening";

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
              <img className="brand-icon" src={macnestIcon} alt="" />

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
              <SidebarIcon name={item.icon} />
              {item.name}

              {item.name === "Installed" && (
                <span className="nav-count">
                  {isLoadingHomebrew ? "…" : homebrewError ? "—" : homebrewPackages.length}
                </span>
              )}
              {item.name === "Updates" && (
                <span className="nav-count update-count">
                  {isLoadingUpdates ? "…" : updateError ? "—" : outdatedPackages.length}
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
            <SidebarIcon name="settings" />
            Settings
          </button>

          <div className="environment-card" role="status">
            <div className="environment-topline">
              <span className="environment-icon"><SidebarIcon name="brew" /></span>
              <div className="environment-title">
                <strong>Homebrew</strong>
                <span>Package source</span>
              </div>
              <span className={`environment-state ${homebrewError ? "offline" : isLoadingHomebrew ? "checking" : ""}`}>
                <span className="environment-dot" aria-hidden="true" />
                {homebrewStatus}
              </span>
            </div>
            <div className="environment-divider" />
            <div className="environment-details">
              <span className="environment-machine">This Mac</span>
              <span className="environment-package-count">
                {homebrewError
                  ? homebrewMissing ? "Install Homebrew to manage packages" : "Homebrew unavailable"
                  : isLoadingHomebrew
                    ? "Scanning packages…"
                    : `${homebrewPackages.length} packages`}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content" ref={mainContentRef}>
        {/* Top navigation */}
        <header className="topbar">
          <div className="breadcrumb">
            <span>MacNest</span>
              <span className="breadcrumb-divider">›</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            <span className={`status-indicator ${homebrewError ? "offline" : isLoadingHomebrew ? "checking" : ""}`} aria-hidden="true" />
            <span>{homebrewError ? homebrewMissing ? "Homebrew not installed" : "Homebrew unavailable" : isLoadingHomebrew ? "Checking Homebrew" : "Homebrew ready"}</span>

          </div>
        </header>

        <section className={`page-content ${activePage === "Settings" ? "settings-content" : ""} ${activePage === "Dashboard" ? "dashboard-content" : "workspace-content"}`}>
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
            <div className="settings-page">
              <div className="settings-page-heading">
                <h2>Settings</h2>
                <p>Manage your MacNest appearance, workspace, and application updates.</p>
              </div>

              <section className="about-card" aria-labelledby="about-macnest-heading">
                <img className="about-app-icon" src={macnestIcon} alt="MacNest application icon" />
                <h3 id="about-macnest-heading">MacNest</h3>
                <span className="about-version">Version {appVersion}</span>
                <p>Your personal macOS package management workspace.</p>
                <div className="about-actions">
                  <button className="settings-secondary-button" onClick={() => void openExternalUrl(MACNEST_RELEASES_URL)}>
                    Release Notes
                  </button>
                  <button className="settings-secondary-button" onClick={() => void openExternalUrl(MACNEST_REPOSITORY_URL)}>
                    View on GitHub
                  </button>
                </div>
              </section>

              <section className="appearance-card" aria-labelledby="appearance-card-heading">
                <div className="settings-card-heading">
                  <div>
                    <h3 id="appearance-card-heading">Appearance</h3>
                  </div>
                </div>

                <div className="appearance-setting">
                  <div className="appearance-setting-copy">
                    <strong>Appearance</strong>
                    <p>Choose how MacNest looks on your device.</p>
                  </div>

                  <div className="appearance-options" role="group" aria-label="Appearance">
                    {APPEARANCE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`appearance-option ${appearance === option.value ? "selected" : ""}`}
                        aria-pressed={appearance === option.value}
                        onClick={() => setAppearance(option.value)}
                      >
                        <span className="appearance-option-heading">
                          <strong>{option.label}</strong>
                          {appearance === option.value && <SidebarIcon name="check" />}
                        </span>
                        <span className="appearance-option-description">{option.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="software-updates-card" aria-labelledby="software-updates-heading">
                <div className="settings-card-heading">
                  <div>
                    <h3 id="software-updates-heading">Software Updates</h3>
                    <p>Keep MacNest current with the latest fixes and improvements.</p>
                  </div>
                  {availableAppUpdate && <span className="app-update-badge">Update available</span>}
                </div>

                <label className="auto-update-setting">
                  <span>
                    <strong>Check for updates automatically</strong>
                    <small>Check when MacNest opens. You choose when to install.</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={autoUpdateCheck}
                    onChange={(event) => setAutoUpdateCheck(event.target.checked)}
                    aria-label="Check for MacNest updates automatically"
                  />
                  <span className="macos-switch" aria-hidden="true"><span /></span>
                </label>

                <div className="update-status-row" aria-live="polite">
                  <div>
                    <span className={`update-status-dot ${appUpdateError ? "error" : availableAppUpdate ? "available" : isCheckingAppUpdate ? "checking" : ""}`} aria-hidden="true" />
                    <strong>Update status</strong>
                  </div>
                  <span>
                    {appUpdateError
                      ? appUpdateError
                      : isCheckingAppUpdate
                        ? "Checking for updates…"
                        : availableAppUpdate
                          ? "Update available"
                          : appUpdateMessage ?? "No update check has been completed yet."}
                  </span>
                </div>

                {availableAppUpdate && (
                  <div className="app-update-details">
                    <strong>MacNest {availableAppUpdate.version} is ready</strong>
                    {availableAppUpdate.date && <span>Released {new Date(availableAppUpdate.date).toLocaleDateString()}</span>}
                    {availableAppUpdate.body && <p>{availableAppUpdate.body}</p>}
                  </div>
                )}

                {appUpdateProgress && <p className="app-update-message" role="status">{appUpdateProgress}</p>}

                <div className="app-update-footer">
                  <span className="last-checked">
                    Last checked: {lastUpdateCheck ? new Date(lastUpdateCheck).toLocaleString() : "Never"}
                  </span>
                  <div className="app-update-actions">
                    <button className="settings-primary-button" onClick={() => void checkForAppUpdate()} disabled={isCheckingAppUpdate || isInstallingAppUpdate || !isTauri()}>
                      {isCheckingAppUpdate ? "Checking…" : "Check for updates"}
                    </button>
                    {availableAppUpdate && (
                      <button className="settings-install-button" onClick={() => void installAppUpdate()} disabled={isInstallingAppUpdate}>
                        {isInstallingAppUpdate ? "Installing…" : `Install ${availableAppUpdate.version}`}
                      </button>
                    )}
                  </div>
                </div>
                {!isTauri() && <span className="settings-version">Update checks run in the installed desktop app.</span>}
              </section>
            </div>
          ) : (
            <>
              {/* PAGE HEADING */}
              <div className={`page-heading ${activePage === "Dashboard" ? "dashboard-heading" : ""}`}>
                {activePage === "Dashboard" ? (
                  <div className="dashboard-heading-copy">
                    <h2>{`${greeting},`}</h2>
                    <p>Your developer tools are ready to go.</p>
                  </div>
                ) : (
                  <>
                    <h2>{pageTitle}</h2>
                    <p>{pageDescription}</p>
                  </>
                )}
              </div>

              {/* DASHBOARD */}
              {activePage === "Dashboard" && (
                <>
                  <section className="dashboard-hero" aria-labelledby="dashboard-hero-title">
                    <div className="dashboard-hero-copy">
                      <span className={`hero-status ${dashboardStatusTone}`} role="status">
                        <span className="hero-status-dot" aria-hidden="true" />
                        {dashboardStatus}
                      </span>
                      <h3 id="dashboard-hero-title">
                        {scanError || homebrewError
                          ? "Your setup needs attention."
                          : isScanning || isLoadingHomebrew
                            ? "Checking your setup…"
                            : "All tools are set up."}
                      </h3>
                      <p>
                        {scanError || homebrewError
                          ? "Review the status below, then retry the scan or refresh Homebrew."
                          : "Scan for additional tools or check for updates."}
                      </p>
                      <div className="hero-actions">
                        <button className="hero-primary" onClick={() => void scanSystem()} disabled={isScanning}>
                          <SidebarIcon name="search" />
                          {isScanning ? "Scanning development tools…" : "Scan development tools"}
                        </button>
                        <button className="hero-secondary" onClick={() => setActivePage("Updates")}>
                          <SidebarIcon name="refresh" />
                          Check for updates
                        </button>
                      </div>
                    </div>
                    <div className="dashboard-hero-art" aria-hidden="true">
                      <svg className="dashboard-hero-waves" viewBox="0 0 640 300" preserveAspectRatio="none">
                        <path className="hero-wave hero-wave-blue" d="M0 172C92 138 128 104 217 120c95 17 131 89 226 83 72-5 132-59 197-89v186H0Z" />
                        <path className="hero-wave hero-wave-lavender" d="M0 231c93-48 146-108 245-106 94 2 142 75 224 76 72 1 119-47 171-75v174H0Z" />
                        <path className="hero-wave hero-wave-periwinkle" d="M0 267c100-27 152-77 245-72 91 5 140 65 230 64 69-1 115-31 165-54v95H0Z" />
                      </svg>
                      <span className="hero-orb" />
                      <span className="hero-float-tile hero-tile-brew">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6.5 8h10v8.5a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V8Z" />
                          <path d="M16.5 10h1.2a2.5 2.5 0 0 1 0 5h-1.2M7 7c-.6-1.1.7-1.5.2-2.5M11.5 7c-.6-1.1.7-1.5.2-2.5M16 7c-.6-1.1.7-1.5.2-2.5" />
                        </svg>
                      </span>
                      <span className="hero-float-tile hero-tile-package"><SidebarIcon name="box" /></span>
                      <span className="hero-float-tile hero-tile-settings"><SidebarIcon name="settings" /></span>
                      <div className="dashboard-terminal">
                        <div className="dashboard-terminal-chrome"><i /><i /><i /></div>
                        <div className="dashboard-terminal-body">
                          <span className="terminal-prompt-mark">›_</span><span>brew list</span>
                          <span className="terminal-result">local package inventory</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="stats-grid">
                    <div className="stat-card">
                      <span className="stat-icon purple"><SidebarIcon name="box" /></span>
                      <div className="stat-copy"><strong>{isScanning ? "…" : scanError ? "—" : detectedCount}</strong><span>Development tools</span><small>{isScanning ? "Scanning this Mac" : scanError ? "Unavailable" : "Detected on your Mac"}</small></div>
                    </div>

                    <div className="stat-card">
                      <span className="stat-icon green"><SidebarIcon name="box" /></span>
                      <div className="stat-copy"><strong>{isLoadingHomebrew ? "…" : homebrewError ? "—" : homebrewPackages.length}</strong><span>Homebrew packages</span><small>{isLoadingHomebrew ? "Loading inventory…" : homebrewError ? "Unavailable" : "Installed"}</small></div>
                    </div>

                    <div className="stat-card">
                      <span className="stat-icon orange"><SidebarIcon name="refresh" /></span>
                      <div className="stat-copy"><strong>{isLoadingUpdates ? "…" : updateError ? "—" : outdatedPackages.length}</strong><span>Updates available</span><small>{isLoadingUpdates ? "Checking Homebrew…" : updateError ? "Unavailable" : "Packages ready to update"}</small></div>
                    </div>
                  </div>

                  <div className="dashboard-panel-grid">
                    {/* System Scan */}
                    <section className="system-scan dashboard-scan">
                      <div className="section-heading">
                        <div>
                          <h3>System Scan</h3>
                          <p>Developer tools detected on this Mac.</p>
                        </div>
                        <button className="scan-button" onClick={() => void scanSystem()} disabled={isScanning}>
                          <SidebarIcon name="refresh" />
                          {isScanning ? "Scanning…" : "Scan Again"}
                        </button>
                      </div>

                      {scanError ? (
                        <p className="scan-error" role="alert">Scan failed: {scanError}</p>
                      ) : isScanning ? (
                        <p className="scan-message" role="status">Scanning development tools on this Mac…</p>
                      ) : (
                        <div className="detected-tools">
                          {detectedTools.map((tool) => (
                            <article className="detected-tool" key={tool.name}>
                              <span className={`tool-mark tool-${tool.name.toLowerCase().replace(/[^a-z]/g, "")}`}>
                                {tool.name === "Homebrew"
                                  ? <SidebarIcon name="brew" />
                                  : tool.name === "Git"
                                    ? "G"
                                    : tool.name === "Node.js"
                                      ? "n"
                                      : tool.name === "Python"
                                        ? "Py"
                                        : tool.name === "Rust"
                                          ? "R"
                                          : tool.name === "npm"
                                            ? "npm"
                                            : "C"}
                              </span>
                              <strong className="tool-name">{tool.name}</strong>
                              <div className="tool-version">
                                <p>{tool.version ?? "Not detected"}</p>
                              </div>
                              <span className={`package-status ${tool.installed ? "installed" : ""}`}>
                                <span />
                                {tool.installed ? "Detected" : "Not detected"}
                              </span>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>

                  {/* Homebrew Overview */}
                    <section className="system-scan dashboard-homebrew">
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
                        <p className="scan-error" role="alert">
                          Could not load packages: {homebrewError}
                        </p>
                      )}

                      {!homebrewError && isLoadingHomebrew && (
                        <p className="scan-message" role="status">Loading Homebrew packages…</p>
                      )}

                      {!homebrewError && !isLoadingHomebrew && (
                        <div className="detected-tools">
                          {homebrewPackages.slice(0, 8).map((pkg) => (
                            <article className="detected-tool" key={`${pkg.package_type}-${pkg.name}`}>
                              <div>
                                <strong>{pkg.name}</strong>
                                <p>{pkg.package_type} · Version {pkg.version}</p>
                              </div>

                              <span className="package-status installed">
                                <span />
                                Installed
                              </span>
                            </article>
                          ))}
                        </div>
                      )}

                      {!isLoadingHomebrew && !homebrewError && homebrewPackages.length === 0 && (
                        <p className="scan-message">No Homebrew packages found.</p>
                      )}

                      {!homebrewError && !isLoadingHomebrew && (
                        <p className="scan-message">
                          Showing {Math.min(8, homebrewPackages.length)} of {homebrewPackages.length} packages.
                        </p>
                      )}

                      <button className="scan-button" onClick={() => setActivePage("Installed")}>
                        View all installed packages
                      </button>
                    </section>
                  </div>
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
                    <SidebarIcon name="search" />

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
                      <SidebarIcon name="search" />

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
                              <SidebarIcon name={pkg.package_type === "Cask" ? "app" : "terminal"} />
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
                                : <SidebarIcon name={installed ? "check" : "arrow"} />}
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
                        <SidebarIcon name="search" />

                        <h3>No packages found</h3>

                        <p>Try another package name.</p>
                      </div>
                    )}

                  <div className="demo-notice">
                      <SidebarIcon name="info" />

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
                <section className="system-scan installed-inventory">
                  <div className="section-heading">
                    <div>
                      <h3>Installed Homebrew Packages</h3>

                      <p>
                        {filteredHomebrewPackages.length === homebrewPackages.length
                          ? `${homebrewPackages.length} packages currently tracked by Homebrew on this Mac.`
                          : `Showing ${filteredHomebrewPackages.length} of ${homebrewPackages.length} packages.`}
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

                  <div className="homebrew-controls installed-controls">
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

                  <div className="detected-tools installed-package-list">
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
                          className="detected-tool installed-package-row"
                          key={packageKey}
                        >
                          <div className="installed-package-info">
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
                        <SidebarIcon name="search" />

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
