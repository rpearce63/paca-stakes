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
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-300 dark:text-gray-400 mb-4 md:mb-0">
            <p>
              © {new Date().getFullYear()} Paca Stakes Viewer. All rights
              reserved.
            </p>
            <p className="mt-1">
              brought to you by rpearce63 & Pelican Point Consulting
            </p>
          </div>
          <div className="text-sm text-gray-400 dark:text-gray-500 text-center md:text-right">
            <p>Version: {version}</p>
            <p>Build: {buildNumber}</p>
            <p>Date: {buildDate}</p>
          </div>
        </div>

        {/* Contract Links Section */}
        <div className="mt-6 pt-6 border-t border-gray-700 dark:border-gray-600">
          <h3 className="text-sm font-semibold text-gray-300 dark:text-gray-400 mb-3 text-center">
            Smart Contracts
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {Object.entries(NETWORKS).map(([networkId, network]) => (
              <a
                key={networkId}
                href={getContractCodeUrl(network, network.contract)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-gray-700 dark:bg-gray-800 hover:bg-gray-600 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 text-sm"
                title={`View ${
                  network.name
                } contract code on ${network.explorer.replace("https://", "")}`}
              >
                {/* Network-specific icons */}
                {networkId === "bsc" && (
                  <svg
                    className="w-4 h-4 text-yellow-500"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M16.624 13.9202l2.7175 2.7154-7.353 7.353-7.353-7.352 2.7175-2.7164 4.6355 4.6595 4.6356-4.6595zm3.8396-.6037L16.6749 7.26l-3.502 3.5611 3.502 3.5609 3.7887-3.5609zM7.3376 12.7978l3.502-3.5611-3.502-3.5611-3.7887 3.5611 3.7887 3.5611z" />
                  </svg>
                )}
                {networkId === "base" && (
                  <svg
                    className="w-4 h-4 text-blue-500"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                )}
                {networkId === "sonic" && (
                  <svg
                    className="w-4 h-4 text-purple-500"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                )}
                <span className="font-medium">{network.name}</span>
                <span className="text-gray-400 dark:text-gray-500 text-xs">
                  {network.contract.slice(0, 6)}...{network.contract.slice(-4)}
                </span>
                <svg
                  className="w-3 h-3 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
