import React from "react";
import { NETWORKS } from "../constants/networks";

const NetworkSelector = ({ network, onNetworkChange }) => {
  return (
    <div className="flex gap-4 mb-6">
      {Object.entries(NETWORKS).map(([chainId, networkConfig]) => (
        <label key={chainId} className="flex items-center">
          <input
            type="radio"
            name="network"
            value={chainId}
            checked={network === chainId}
            onChange={() => onNetworkChange(chainId)}
            className="mr-2"
          />
          {networkConfig.name} ({networkConfig.token})
        </label>
      ))}
    </div>
  );
};

export default NetworkSelector;
