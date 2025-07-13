import React from "react";
import { NETWORKS } from "../constants/networks";

const Footer = () => {
  // Get build information from environment variables or use defaults
  const buildNumber = import.meta.env.VITE_BUILD_NUMBER || "dev";
  const buildDate =
    import.meta.env.VITE_BUILD_DATE || new Date().toISOString().split("T")[0];
  const version = import.meta.env.VITE_APP_VERSION || "1.0.0";

  // Get contract code URL for each network
  const getContractCodeUrl = (network, contractAddress) => {
    return `${network.explorer}/address/${contractAddress}#code`;
  };

  return (
    <footer className="bg-gray-800 dark:bg-gray-900 text-white py-6 mt-8">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-0 w-full">
          {/* Credits Section */}
          <div className="w-full md:w-1/3 text-sm text-gray-300 dark:text-gray-400 text-center md:text-left order-1 md:order-1">
            <p>
              © {new Date().getFullYear()} Paca Stakes Viewer. All rights
              reserved.
            </p>
            <p className="mt-1">
              brought to you by rpearce63 & Pelican Point Consulting
            </p>
          </div>

          {/* Icon Links Section */}
          <div className="flex flex-row flex-wrap justify-center gap-3 w-full md:w-1/3 order-2 md:order-2">
            {/* dApp link with app icon */}
            <a
              href="https://paca.finance"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors duration-200 shadow-sm"
              title="Open Paca dApp"
            >
              <img
                src="/paca.avif"
                alt="Paca dApp"
                className="w-5 h-5 rounded-full"
              />
            </a>
            {/* Telegram link */}
            <a
              href="https://t.me/pacafinance"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-400 hover:bg-blue-500 transition-colors duration-200 shadow-sm"
              title="Join Telegram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.036 16.569l-.398 5.617c.57 0 .816-.244 1.113-.537l2.668-2.558 5.528 4.04c1.012.558 1.73.264 1.98-.937l3.594-16.84c.328-1.522-.553-2.12-1.54-1.75L2.36 9.36c-1.49.58-1.477 1.41-.256 1.788l4.6 1.438 10.68-6.73c.5-.32.96-.143.58.177" />
              </svg>
            </a>
            {/* Contract links, icons only */}
            {Object.entries(NETWORKS).map(([networkId, network]) => (
              <a
                key={networkId}
                href={getContractCodeUrl(network, network.contract)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 dark:bg-gray-800 hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors duration-200 shadow-sm"
                title={`View ${
                  network.name
                } contract code on ${network.explorer.replace("https://", "")}`}
              >
                {networkId === "bsc" && (
                  <svg
                    className="w-4 h-4 text-yellow-400"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M16.624 13.9202l2.7175 2.7154-7.353 7.353-7.353-7.352 2.7175-2.7164 4.6355 4.6595 4.6356-4.6595zm3.8396-.6037L16.6749 7.26l-3.502 3.5611 3.502 3.5609 3.7887-3.5609zM7.3376 12.7978l3.502-3.5611-3.502-3.5611-3.7887 3.5611 3.7887 3.5611z" />
                  </svg>
                )}
                {networkId === "base" && (
                  <svg
                    className="w-4 h-4 text-blue-400"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                )}
                {networkId === "sonic" && (
                  <svg
                    className="w-4 h-4 text-purple-400"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                )}
              </a>
            ))}
          </div>

          {/* Build Info Section */}
          <div className="w-full md:w-1/3 text-sm text-gray-400 dark:text-gray-500 text-center md:text-right mt-4 md:mt-0 order-3 md:order-3">
            <p>Version: {version}</p>
            <p>Build: {buildNumber}</p>
            <p>Date: {buildDate}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
