import React from "react";
import { NETWORKS } from "../constants/networks";

export default function NetworkSelector({
  network,
  onNetworkChange,
  chainsWithStakes,
}) {
  const chainIds =
    Array.isArray(chainsWithStakes) && chainsWithStakes.length > 0
      ? chainsWithStakes
      : Object.keys(NETWORKS);
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {chainIds.map((chainId) => (
        <button
          key={chainId}
          onClick={() => onNetworkChange(chainId)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
            network === chainId
              ? "bg-blue-600 dark:bg-blue-500 text-white shadow-md"
              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          {NETWORKS[chainId].name}
        </button>
      ))}
    </div>
  );
}
