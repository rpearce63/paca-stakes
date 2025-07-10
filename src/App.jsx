import React, { useState, useEffect } from "react";
import "./App.css";
import StakeViewer from "./components/StakeViewer";
import Footer from "./components/Footer";
import Marketplace from "./components/Marketplace";
// Marketplace import will be added after scaffold

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });
  const [activeTab, setActiveTab] = useState("stakes"); // "stakes" or "marketplace"
  const [showUpdate, setShowUpdate] = useState(false);
  const currentVersion = import.meta.env.VITE_APP_VERSION || "1.0.0";

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Poll for new version
  useEffect(() => {
    let interval;
    let cancelled = false;
    async function checkVersion() {
      try {
        const res = await fetch("/meta.json?ts=" + Date.now());
        if (!res.ok) return;
        const meta = await res.json();
        if (!cancelled && meta.version && meta.version !== currentVersion) {
          setShowUpdate(true);
        }
      } catch {
        // Ignore fetch errors (offline, etc.)
      }
    }
    checkVersion();
    interval = setInterval(checkVersion, 2 * 60 * 1000); // every 2 min
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentVersion]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 bg-white dark:bg-gray-900 ${
        darkMode ? "text-white" : "text-gray-900"
      }`}
    >
      {showUpdate && (
        <div className="fixed top-0 left-0 w-full z-50 bg-yellow-400 text-yellow-900 dark:bg-yellow-600 dark:text-yellow-100 py-3 px-4 flex items-center justify-center shadow-lg animate-fade-in">
          <span className="font-semibold mr-4">
            A new version is available.
          </span>
          <button
            className="bg-yellow-700 hover:bg-yellow-800 text-white font-bold py-1 px-4 rounded transition"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      )}
      <div className="flex-1">
        <div className="relative pt-20 sm:pt-16 md:pt-4">
          {/* Dark mode toggle button */}
          <button
            onClick={toggleDarkMode}
            className={`absolute top-4 right-4 z-10 p-2 rounded-lg transition-colors duration-200 ${
              darkMode
                ? "bg-gray-700 hover:bg-gray-600 text-yellow-300"
                : "bg-white hover:bg-gray-100 text-gray-700 shadow-md"
            }`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
          {/* Tabs */}
          <div className="flex justify-center mb-8 mt-2 gap-2">
            <button
              className={`px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                activeTab === "stakes"
                  ? "bg-blue-600 dark:bg-blue-500 text-white shadow"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
              onClick={() => setActiveTab("stakes")}
            >
              Stake Viewer
            </button>
            <button
              className={`px-4 py-2 rounded-t-lg font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                activeTab === "marketplace"
                  ? "bg-blue-600 dark:bg-blue-500 text-white shadow"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
              onClick={() => setActiveTab("marketplace")}
            >
              Marketplace
            </button>
          </div>
          {/* Tab Content */}
          {activeTab === "stakes" && <StakeViewer />}
          {activeTab === "marketplace" && <Marketplace />}
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default App;
