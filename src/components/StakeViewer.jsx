import React, { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { NETWORKS } from "../constants/networks";
import { sortData, getSortIcon } from "../utils/sorting";
import NetworkSelector from "./NetworkSelector";
import ChainSummaryTable from "./ChainSummaryTable";
import StakesTable from "./StakesTable";

export default function StakeViewer() {
  const [address, setAddress] = useState("");
  const [stakes, setStakes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [network, setNetwork] = useState("bsc");
  const [chainTotals, setChainTotals] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [hideCompleted, setHideCompleted] = useState(true);
  const [stakesCache, setStakesCache] = useState({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const networkRef = useRef(network);
  const pollingIntervalRef = useRef(null);

  // Update ref when network changes
  useEffect(() => {
    networkRef.current = network;
  }, [network]);

  const fetchRewards = useCallback(
    async (chainId) => {
      // console.log(`fetchRewards for ${chainId}`);
      if (!address) return null;

      try {
        const provider = new ethers.JsonRpcProvider(NETWORKS[chainId].rpc);
        const viewRewardsContract = new ethers.Contract(
          NETWORKS[chainId].contract,
          NETWORKS[chainId].abi,
          provider
        );

        const rewardsData = await viewRewardsContract.viewRewards(address);
        return Number(
          ethers.formatUnits(rewardsData, NETWORKS[chainId].decimals)
        );
      } catch (error) {
        console.error(`Error fetching ${chainId} rewards:`, error);
        return 0;
      }
    },
    [address]
  );

  const fetchChainData = useCallback(
    async (chainId) => {
      // console.log(`fetchChainData for ${chainId}`);
      if (!address) return null;

      try {
        const provider = new ethers.JsonRpcProvider(NETWORKS[chainId].rpc);
        const getStakesContract = new ethers.Contract(
          NETWORKS[chainId].contract,
          NETWORKS[chainId].abi,
          provider
        );

        const stakeData = await getStakesContract.getStakes(address);
        const rewardsData = await fetchRewards(chainId);

        const stakesWithIds = stakeData.map((stake, index) => {
          const amount = Number(
            ethers.formatUnits(stake.amount, NETWORKS[chainId].decimals)
          );
          const dailyRate = Number(stake.dailyRewardRate) / 100;
          const dailyEarnings = (amount * dailyRate) / 100;

          return {
            ...stake,
            id: index,
            amount: stake.amount.toString(),
            lastClaimed: stake.lastClaimed.toString(),
            unlockTime: stake.unlockTime.toString(),
            dailyRewardRate: stake.dailyRewardRate.toString(),
            dailyEarnings,
            complete: Boolean(stake.complete),
          };
        });

        const chainTotalStaked = stakesWithIds.reduce(
          (acc, s) =>
            acc +
            Number(ethers.formatUnits(s.amount, NETWORKS[chainId].decimals)),
          0
        );

        const chainDailyEarnings = stakesWithIds.reduce(
          (acc, s) => acc + s.dailyEarnings,
          0
        );

        return {
          stakes: stakesWithIds,
          totalStaked: chainTotalStaked,
          rewards: rewardsData,
          dailyEarnings: chainDailyEarnings,
        };
      } catch (error) {
        console.error(`Error fetching ${chainId} data:`, error);
        return null;
      }
    },
    [address, fetchRewards]
  );

  const fetchAllChains = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    setError("");

    try {
      // Fetch data from all chains in parallel
      const chainPromises = Object.keys(NETWORKS).map((chainId) =>
        fetchChainData(chainId)
      );
      const results = await Promise.all(chainPromises);

      // Update chain totals and cache
      const newChainTotals = {};
      const newStakesCache = {};

      Object.keys(NETWORKS).forEach((chainId, index) => {
        const result = results[index];
        if (result) {
          newChainTotals[chainId] = {
            totalStaked: result.totalStaked,
            rewards: result.rewards,
            dailyEarnings: result.dailyEarnings,
          };
          newStakesCache[chainId] = result.stakes;
        }
      });

      setChainTotals(newChainTotals);
      setStakesCache(newStakesCache);

      // Update current stakes for the current network using ref
      if (newStakesCache[networkRef.current]) {
        setStakes(newStakesCache[networkRef.current]);
      }

      setIsInitialLoad(false);
    } catch (error) {
      console.error("Error fetching chain data:", error);
      setError("Failed to fetch data. Make sure the address is correct.");
      setStakes([]);
    } finally {
      setLoading(false);
    }
  }, [address, fetchChainData]);

  // Poll rewards every minute
  const startPolling = useCallback(() => {
    if (!address) return;

    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Start polling every minute (60000ms)
    pollingIntervalRef.current = setInterval(async () => {
      console.log("🔄 Polling for updated rewards...");

      try {
        // Fetch fresh rewards for all chains
        const rewardsPromises = Object.keys(NETWORKS).map(async (chainId) => {
          const rewards = await fetchRewards(chainId);
          return { chainId, rewards };
        });

        const rewardsResults = await Promise.all(rewardsPromises);

        // Update chain totals with fresh rewards
        setChainTotals((prev) => {
          const updated = { ...prev };
          rewardsResults.forEach(({ chainId, rewards }) => {
            if (updated[chainId]) {
              updated[chainId] = {
                ...updated[chainId],
                rewards: rewards,
              };
            }
          });
          return updated;
        });

        console.log("✅ Rewards updated via polling");
      } catch (error) {
        console.error("❌ Error polling rewards:", error);
      }
    }, 60000); // 60 seconds
  }, [address, fetchRewards]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Only fetch all chains when address changes
  useEffect(() => {
    if (address) {
      fetchAllChains();
      startPolling();
    } else {
      stopPolling();
    }

    // Cleanup polling on unmount or address change
    return () => {
      stopPolling();
    };
  }, [address, fetchAllChains, startPolling, stopPolling]);

  // Update stakes when network changes (if we have cached data)
  useEffect(() => {
    if (stakesCache[network] && !isInitialLoad) {
      setStakes(stakesCache[network]);
    }
  }, [network, stakesCache, isInitialLoad]);

  const updateChain = async (chain) => {
    setNetwork(chain);

    if (stakesCache[chain]) {
      setStakes(stakesCache[chain]);
      // Only fetch rewards for the selected chain
      const rewards = await fetchRewards(chain);
      setChainTotals((prev) => ({
        ...prev,
        [chain]: {
          ...prev[chain],
          rewards: rewards,
        },
      }));
    } else if (!isInitialLoad) {
      // If we don't have cached data and it's not the initial load,
      // fetch data for this chain
      const result = await fetchChainData(chain);
      if (result) {
        setStakes(result.stakes);
        setChainTotals((prev) => ({
          ...prev,
          [chain]: {
            totalStaked: result.totalStaked,
            rewards: result.rewards,
            dailyEarnings: result.dailyEarnings,
          },
        }));
      }
    }
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedStakes = sortData(
    stakes.filter((stake) => !hideCompleted || !stake.complete),
    sortConfig,
    NETWORKS[network].decimals
  );

  return (
    <div className="w-full max-w-5xl mx-auto p-2 sm:p-4 md:p-6 bg-white shadow rounded">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Stake Viewer ({NETWORKS[network].name})
      </h1>
      <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full">
        <input
          type="text"
          placeholder="Enter wallet address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="border p-2 w-full rounded shadow-sm text-base"
        />
        <button
          onClick={fetchAllChains}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
        >
          {loading ? "Loading..." : "Get Stakes"}
        </button>
      </div>
      <NetworkSelector network={network} onNetworkChange={updateChain} />
      {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
      {Object.keys(chainTotals).length > 0 && (
        <ChainSummaryTable chainTotals={chainTotals} />
      )}
      {stakes?.length > 0 && (
        <StakesTable
          stakes={filteredAndSortedStakes}
          network={network}
          hideCompleted={hideCompleted}
          setHideCompleted={setHideCompleted}
          requestSort={requestSort}
          getSortIcon={(key) => getSortIcon(sortConfig, key)}
        />
      )}
    </div>
  );
}
