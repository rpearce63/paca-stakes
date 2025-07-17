import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { ethers } from "ethers";
import { NETWORKS } from "../constants/networks";

const DataContext = createContext();

export function DataProvider({ children }) {
  const [stakesCache, setStakesCache] = useState({});
  const [chainTotals, setChainTotals] = useState({});
  const [poolRates, setPoolRates] = useState({});
  const [network, setNetwork] = useState("bsc");

  // Fetch pool rates for all chains
  const fetchRates = useCallback(async () => {
    const rates = {};
    await Promise.all(
      Object.keys(NETWORKS).map(async (chainId) => {
        try {
          const provider = new ethers.JsonRpcProvider(NETWORKS[chainId].rpc);
          const contract = new ethers.Contract(
            NETWORKS[chainId].contract,
            NETWORKS[chainId].abi,
            provider
          );
          const pool = await contract.pool();
          // pool.dailyRewardRate is in basis points (e.g., 1234 = 12.34%)
          rates[chainId] = Number(pool.dailyRewardRate) / 100;
        } catch {
          rates[chainId] = null;
        }
      })
    );
    setPoolRates(rates);
  }, []);

  // Fetch pool rates on mount and set up interval to refresh every 5 minutes
  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [fetchRates]);

  return (
    <DataContext.Provider
      value={{
        stakesCache,
        setStakesCache,
        chainTotals,
        setChainTotals,
        poolRates,
        setPoolRates,
        network,
        setNetwork,
        refreshPoolRates: fetchRates,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
