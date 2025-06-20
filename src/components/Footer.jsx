import React from "react";

const Footer = () => {
  // Get build information from environment variables or use defaults
  const buildNumber = import.meta.env.VITE_BUILD_NUMBER || "dev";
  const buildDate =
    import.meta.env.VITE_BUILD_DATE || new Date().toISOString().split("T")[0];
  const version = import.meta.env.VITE_APP_VERSION || "1.0.0";

  return (
    <footer className="bg-gray-800 dark:bg-gray-900 text-white py-6 mt-8">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-300 dark:text-gray-400 mb-4 md:mb-0">
            <p>
              © {new Date().getFullYear()} Paca Stakes Viewer. All rights
              reserved.
            </p>
            <p className="mt-1">Pelican Point Consulting</p>
          </div>
          <div className="text-sm text-gray-400 dark:text-gray-500 text-center md:text-right">
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
