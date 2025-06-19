import React, { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { NETWORKS } from "../constants/networks";
import { sortData, getSortIcon } from "../utils/sorting";
import NetworkSelector from "./NetworkSelector";
import ChainSummaryTable from "./ChainSummaryTable";
import StakesTable from "./StakesTable";

export default function StakeViewer() {
  const [address, setAddress] = useState("");
  const [addressList, setAddressList] = useState([]);
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
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Update ref when network changes
  useEffect(() => {
    networkRef.current = network;
  }, [network]);

  // Load address list and address from localStorage on mount
  useEffect(() => {
    const savedAddress = localStorage.getItem("paca_stakes_address");
    if (savedAddress) {
      setAddress(savedAddress);
    }
    const savedList = localStorage.getItem("paca_stakes_address_list");
    if (savedList) {
      try {
        setAddressList(JSON.parse(savedList));
      } catch {
        setAddressList([]);
      }
    }
  }, []);

  // Save address to localStorage whenever it changes, and update address list
  useEffect(() => {
    if (address) {
      localStorage.setItem("paca_stakes_address", address);
      setAddressList((prevList) => {
        if (!prevList.includes(address)) {
          const newList = [address, ...prevList].slice(0, 10); // keep max 10
          localStorage.setItem(
            "paca_stakes_address_list",
            JSON.stringify(newList)
          );
          return newList;
        }
        return prevList;
      });
    } else {
      localStorage.removeItem("paca_stakes_address");
    }
  }, [address]);

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

  // Handler to delete a single address from the list
  const handleDeleteAddress = (addr) => {
    setAddressList((prevList) => {
      const newList = prevList.filter((a) => a !== addr);
      localStorage.setItem("paca_stakes_address_list", JSON.stringify(newList));
      // If the deleted address is the current address, clear the input
      if (address === addr) {
        setAddress("");
        localStorage.removeItem("paca_stakes_address");
      }
      return newList;
    });
  };

  // Handler to clear all addresses
  const handleClearAllAddresses = () => {
    setAddressList([]);
    localStorage.removeItem("paca_stakes_address_list");
    setAddress("");
    localStorage.removeItem("paca_stakes_address");
    setShowDropdown(false);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div className="w-full max-w-5xl mx-auto p-2 sm:p-4 md:p-6 bg-white shadow rounded">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Stake Viewer ({NETWORKS[network].name})
      </h1>
      <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full">
        <div className="relative w-full flex flex-row gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Enter wallet address"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setShowDropdown(false); // close dropdown on manual input
            }}
            onFocus={() => {
              if (addressList.length > 0 && address !== "")
                setShowDropdown(true);
            }}
            className="border p-2 w-full rounded shadow-sm text-base"
            autoComplete="off"
            onPaste={(e) => {
              // Ensure pasted value replaces the input
              e.preventDefault();
              const pasted = e.clipboardData.getData("text");
              setAddress(pasted);
              setShowDropdown(false);
              setTimeout(() => {
                if (inputRef.current) inputRef.current.select();
              }, 0);
            }}
          />
          {addressList.length > 0 && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 bg-white px-1"
              onClick={() => setShowDropdown((v) => !v)}
              tabIndex={-1}
              aria-label="Show previous addresses"
            >
              ▼
            </button>
          )}
          {showDropdown && addressList.length > 0 && (
            <ul
              ref={dropdownRef}
              className="absolute z-10 left-0 right-0 mt-1 bg-white border rounded shadow max-h-64 overflow-auto text-base"
            >
              <li
                className="px-3 py-2 cursor-pointer hover:bg-blue-100 font-semibold text-blue-700 border-b"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setShowDropdown(false);
                  setAddress("");
                  setTimeout(() => {
                    if (inputRef.current) {
                      inputRef.current.focus();
                      inputRef.current.select();
                    }
                  }, 0);
                }}
              >
                + Add new address…
              </li>
              {addressList.map((addr) => (
                <li
                  key={addr}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-blue-100 ${
                    addr === address ? "bg-blue-50" : ""
                  }`}
                >
                  <span
                    className="flex-1"
                    onClick={() => {
                      setAddress(addr);
                      setShowDropdown(false);
                      setTimeout(() => {
                        if (inputRef.current) {
                          inputRef.current.blur(); // blur to prevent dropdown reopening
                        }
                      }, 0);
                    }}
                  >
                    {addr}
                  </span>
                  <button
                    className="ml-2 text-gray-400 hover:text-red-500 px-1"
                    title="Delete address"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAddress(addr);
                    }}
                  >
                    ×
                  </button>
                </li>
              ))}
              <li className="border-t px-3 py-2 text-center">
                <button
                  className="text-sm text-red-600 hover:underline"
                  onClick={handleClearAllAddresses}
                >
                  Clear All
                </button>
              </li>
            </ul>
          )}
        </div>
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
