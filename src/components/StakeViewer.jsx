import React, { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { NETWORKS } from "../constants/networks";
import { sortData, getSortIcon } from "../utils/sorting";
import NetworkSelector from "./NetworkSelector";
import ChainSummaryTable from "./ChainSummaryTable";
import StakesTable from "./StakesTable";
import MultiWalletSummary from "./MultiWalletSummary";
import WithdrawalsTable from "./WithdrawalsTable";
import { Interface } from "ethers";
import { zeroPadValue, getAddress } from "ethers";

// BscScan API key from environment
const BSCSCAN_API_KEY = import.meta.env.VITE_BSCSCAN_API_KEY;
if (!BSCSCAN_API_KEY) {
  console.warn(
    "BscScan API key is missing. Please set VITE_BSCSCAN_API_KEY in your .env file."
  );
}

// Utility to fetch logs from BscScan API
async function fetchLogsFromBscScan({
  address,
  topics,
  fromBlock = 0,
  toBlock = "latest",
}) {
  const baseUrl = "https://api.bscscan.com/api";
  const params = new URLSearchParams({
    module: "logs",
    action: "getLogs",
    address,
    fromBlock: fromBlock.toString(),
    toBlock: toBlock.toString(),
    apikey: BSCSCAN_API_KEY,
  });
  topics.forEach((topic, i) => {
    if (topic) params.append(`topic${i}`, topic);
  });
  const url = `${baseUrl}?${params.toString()}`;
  console.debug("BscScan logs URL:", url);
  const resp = await fetch(url);
  const data = await resp.json();
  if (data.status !== "1" || !data.result) {
    throw new Error(`BscScan API error: ${data.message}`);
  }
  console.debug("BscScan logs API result:", data.result);
  return data.result;
}

export default function StakeViewer() {
  const [address, setAddress] = useState("");
  const [addressList, setAddressList] = useState([]);
  const [stakes, setStakes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [network, setNetwork] = useState("bsc");
  const [chainTotals, setChainTotals] = useState({});
  const [sortConfig, setSortConfig] = useState({
    key: "daysLeft",
    direction: "asc",
  });
  const [hideCompleted, setHideCompleted] = useState(true);
  const [stakesCache, setStakesCache] = useState({});
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [viewMode, setViewMode] = useState("single");
  const networkRef = useRef(network);
  const pollingIntervalRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [showCompletedWithdrawals, setShowCompletedWithdrawals] =
    useState(false);
  const [withdrawnAmountsByStakeId, setWithdrawnAmountsByStakeId] = useState(
    {}
  );
  const filteredAndSortedStakes = sortData(
    stakes.filter((stake) => !hideCompleted || !stake.complete),
    sortConfig,
    NETWORKS[network].decimals
  );
  const [stakesPage, setStakesPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const totalStakesPages = Math.max(
    1,
    Math.ceil(filteredAndSortedStakes.length / rowsPerPage)
  );
  const pagedStakes = filteredAndSortedStakes.slice(
    (stakesPage - 1) * rowsPerPage,
    stakesPage * rowsPerPage
  );

  // State for current pool rates
  const [poolRates, setPoolRates] = useState({});

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

  // Fetch pool rates on mount
  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

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
    // Only save valid addresses to localStorage
    if (address && ethers.isAddress(address)) {
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
    } else if (!address) {
      // Clear localStorage if address is empty
      localStorage.removeItem("paca_stakes_address");
    }
  }, [address]);

  // Clear validation error when user types a new address
  useEffect(() => {
    if (error) {
      setError("");
    }
  }, [address, error]);

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
    if (!ethers.isAddress(address)) {
      setError("Invalid EVM address. Please check and try again.");
      setStakes([]);
      setChainTotals({});
      return;
    }

    if (!address) return;

    setLoading(true);
    setError("");

    try {
      // Fetch pool rates in parallel with stakes
      fetchRates();
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
  }, [address, fetchChainData, fetchRates]);

  // Poll rewards every minute
  const startPolling = useCallback(() => {
    if (!address) return;

    // Clear any existing intervals
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    if (pollingIntervalRef.currentStake) {
      clearInterval(pollingIntervalRef.currentStake);
    }

    // Start polling rewards every minute (60000ms)
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const rewardsPromises = Object.keys(NETWORKS).map(async (chainId) => {
          const rewards = await fetchRewards(chainId);
          return { chainId, rewards };
        });
        const rewardsResults = await Promise.all(rewardsPromises);
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
      } catch (error) {
        console.error("❌ Error polling rewards:", error);
      }
    }, 60000); // 1 minute

    // Start polling stake data every 5 minutes (300000ms)
    pollingIntervalRef.currentStake = setInterval(() => {
      fetchAllChains();
    }, 300000); // 5 minutes
  }, [address, fetchRewards, fetchAllChains]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (pollingIntervalRef.currentStake) {
      clearInterval(pollingIntervalRef.currentStake);
      pollingIntervalRef.currentStake = null;
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

  // Reset to page 1 if stakes or network changes
  useEffect(() => {
    setStakesPage(1);
  }, [stakes, network, address, rowsPerPage]);

  // Fetch withdrawals for the current address and network
  const fetchWithdrawals = useCallback(async () => {
    if (!address || !ethers.isAddress(address)) {
      setWithdrawals([]);
      return;
    }
    try {
      const provider = new ethers.JsonRpcProvider(NETWORKS[network].rpc);
      const contract = new ethers.Contract(
        NETWORKS[network].contract,
        NETWORKS[network].abi,
        provider
      );
      const result = await contract.getAllWithdrawStakes(address);
      // result is array of { stakeId, amount, unlockTime }
      setWithdrawals(
        result.map((w) => ({
          stakeId: w.stakeId?.toString?.() ?? w.stakeId,
          amount: w.amount?.toString?.() ?? w.amount,
          unlockTime: w.unlockTime?.toString?.() ?? w.unlockTime,
        }))
      );
    } catch {
      setWithdrawals([]);
      // Optionally log error
    }
  }, [address, network]);

  // Fetch withdrawals when address or network changes
  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  // Fetch withdrawn amounts from logs for completed withdrawals
  useEffect(() => {
    async function fetchWithdrawnLogs() {
      if (
        !address ||
        !ethers.isAddress(address) ||
        !withdrawals ||
        withdrawals.length === 0
      ) {
        setWithdrawnAmountsByStakeId({});
        return;
      }
      const completed = withdrawals.filter((w) => Number(w.amount) === 0);
      if (completed.length === 0) {
        setWithdrawnAmountsByStakeId({});
        return;
      }
      try {
        const provider = new ethers.JsonRpcProvider(NETWORKS[network].rpc);
        const iface = new Interface(NETWORKS[network].abi);
        const eventTopic = iface.getEvent("StakeWithdrawn").topicHash;
        const logsByStakeId = {};
        // Get latest block
        const latestBlock = await provider.getBlockNumber();
        const fromBlock = 0; // Use full history for BscScan
        for (const w of completed) {
          const userTopic = zeroPadValue(getAddress(address), 32);
          const topics = [eventTopic, userTopic];
          let allLogs = [];
          try {
            allLogs = await fetchLogsFromBscScan({
              address: NETWORKS[network].contract,
              topics,
              fromBlock,
              toBlock: latestBlock,
            });
          } catch (apiErr) {
            console.error("BscScan API error:", apiErr);
            continue;
          }
          console.debug(
            `Merged logs for user ${address} and stakeId ${w.stakeId}:`,
            allLogs
          );
          let found = null;
          let foundBlockNumber = null;
          for (const log of allLogs) {
            // BscScan returns logs as raw objects, need to parse topics/data
            let parsed;
            try {
              parsed = iface.parseLog({
                topics: log.topics,
                data: log.data,
              });
            } catch (parseErr) {
              console.error("Error parsing log from BscScan:", parseErr, log);
              continue;
            }
            console.debug("Parsed log:", parsed);
            const parsedStakeId =
              parsed.args.stakeId?.toString?.() ?? String(parsed.args.stakeId);
            const wantedStakeId = w.stakeId?.toString?.() ?? String(w.stakeId);
            console.debug(
              `Comparing parsedStakeId=${parsedStakeId} to wantedStakeId=${wantedStakeId}`
            );
            if (parsedStakeId === wantedStakeId) {
              found = parsed.args.amount?.toString?.() ?? null;
              foundBlockNumber = log.blockNumber;
              console.debug(
                `Found withdrawn amount for stakeId ${wantedStakeId}:`,
                found,
                "blockNumber:",
                foundBlockNumber
              );
              break;
            }
          }
          if (found) {
            logsByStakeId[w.stakeId] = {
              amount: found,
              blockNumber: foundBlockNumber,
            };
          }
        }
        // Fetch timestamps for each blockNumber
        const blockNumbers = Object.values(logsByStakeId)
          .map((obj) => obj.blockNumber)
          .filter(Boolean);
        const uniqueBlockNumbers = [...new Set(blockNumbers)];
        const blockTimestamps = {};
        for (const bn of uniqueBlockNumbers) {
          try {
            const block = await provider.getBlock(Number(bn));
            blockTimestamps[bn] = block.timestamp;
          } catch (err) {
            console.error("Error fetching block for timestamp:", bn, err);
          }
        }
        // Add timestamp to each entry
        for (const stakeId in logsByStakeId) {
          const obj = logsByStakeId[stakeId];
          if (obj && obj.blockNumber && blockTimestamps[obj.blockNumber]) {
            obj.timestamp = blockTimestamps[obj.blockNumber];
          }
        }
        console.debug("logsByStakeId mapping with timestamps:", logsByStakeId);
        setWithdrawnAmountsByStakeId(logsByStakeId);
      } catch (err) {
        setWithdrawnAmountsByStakeId({});
        console.error("Error fetching or parsing StakeWithdrawn logs:", err);
      }
    }
    fetchWithdrawnLogs();
  }, [address, network, withdrawals]);

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

  const handleAddressClick = (clickedAddress) => {
    setAddress(clickedAddress);
    setViewMode("single");
  };

  const handleBackToSingle = () => {
    setViewMode("single");
  };

  const handleToggleViewMode = () => {
    setViewMode(viewMode === "single" ? "multi" : "single");
  };

  // Show multi-wallet view if multiple addresses and in multi mode
  if (viewMode === "multi" && addressList.length > 1) {
    return (
      <MultiWalletSummary
        addressList={addressList}
        onAddressClick={handleAddressClick}
        onBackToSingle={handleBackToSingle}
      />
    );
  }

  // Determine if user has any stakes on any chain
  const hasAnyStakes = Object.values(stakesCache).some(
    (arr) => Array.isArray(arr) && arr.length > 0
  );
  // Determine if user has stakes on the current chain
  const hasStakesOnCurrentChain =
    Array.isArray(stakesCache[network]) && stakesCache[network].length > 0;

  // List of chainIds with stakes
  const chainsWithStakes = Object.keys(stakesCache).filter(
    (chainId) =>
      Array.isArray(stakesCache[chainId]) &&
      stakesCache[chainId].length > 0 &&
      chainTotals[chainId] &&
      chainTotals[chainId].totalStaked > 0
  );

  // Export address list to file
  const handleExportAddresses = () => {
    const dataStr = JSON.stringify(addressList, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "paca_stakes_addresses.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import address list from file
  const handleImportAddresses = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!Array.isArray(imported)) throw new Error("Invalid format");
        // Merge, dedupe, and keep max 10
        const merged = Array.from(new Set([...imported, ...addressList])).slice(
          0,
          10
        );
        setAddressList(merged);
        localStorage.setItem(
          "paca_stakes_address_list",
          JSON.stringify(merged)
        );
      } catch {
        alert("Failed to import addresses. Please select a valid JSON file.");
      }
    };
    reader.readAsText(file);
    // Reset input value so same file can be re-imported if needed
    e.target.value = "";
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-800 shadow rounded">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-center">
          Stake Viewer ({NETWORKS[network].name})
        </h1>
        {addressList.length > 1 && (
          <button
            onClick={handleToggleViewMode}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {viewMode === "single" ? "Multi-Wallet View" : "Single Wallet"}
          </button>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full">
        <div className="flex flex-row gap-2 mb-2">
          <button
            type="button"
            className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
            onClick={handleExportAddresses}
            disabled={addressList.length === 0}
          >
            Export Addresses
          </button>
          <label className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm cursor-pointer">
            Import Addresses
            <input
              type="file"
              accept="application/json"
              onChange={handleImportAddresses}
              style={{ display: "none" }}
            />
          </label>
        </div>
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
            className={`border p-2 w-full rounded shadow-sm text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none ${
              error
                ? "border-red-500 dark:border-red-400 focus:border-red-500 dark:focus:border-red-400"
                : "border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
            }`}
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
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-white dark:bg-gray-700 px-1"
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
              className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow max-h-64 overflow-auto text-base"
            >
              <li
                className="px-3 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-gray-600 font-semibold text-blue-700 dark:text-blue-400 border-b border-gray-200 dark:border-gray-600"
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
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-gray-600 ${
                    addr === address ? "bg-blue-50 dark:bg-gray-600" : ""
                  }`}
                >
                  <span
                    className="flex-1 dark:text-white"
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
                    className="ml-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 px-1"
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
              <li className="border-t border-gray-200 dark:border-gray-600 px-3 py-2 text-center">
                <button
                  className="text-sm text-red-600 dark:text-red-400 hover:underline"
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
          className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-600 w-full sm:w-auto transition-colors duration-200"
        >
          {loading ? "Loading..." : "Get Stakes"}
        </button>
      </div>
      {/* Pool rates line */}
      <div className="w-full text-center text-sm text-gray-700 dark:text-gray-200 mb-2">
        <span className="font-semibold">Current Rates:</span>{" "}
        {Object.keys(NETWORKS).map((chainId, idx, arr) => {
          const rate = poolRates[chainId];
          const highlight = rate != null && rate > 0.33;
          const highlightClass = highlight
            ? "text-green-700 dark:text-green-400 font-bold"
            : "";
          return (
            <span key={chainId}>
              <span className={highlightClass}>{NETWORKS[chainId].name}</span>{" "}
              {rate != null ? (
                <span className={highlightClass}>{rate.toFixed(2)}%</span>
              ) : (
                "N/A"
              )}
              {idx < arr.length - 1 ? ", " : ""}
            </span>
          );
        })}
      </div>
      {hasAnyStakes && (
        <>
          <NetworkSelector
            network={network}
            onNetworkChange={updateChain}
            chainsWithStakes={chainsWithStakes}
          />
          {error && (
            <p className="text-red-600 dark:text-red-400 mb-4 text-sm">
              {error}
            </p>
          )}
          {chainsWithStakes.length > 0 && (
            <ChainSummaryTable chainTotals={chainTotals} />
          )}
          {hasStakesOnCurrentChain && (
            <>
              {/* Withdrawals section logic - moved after summary table */}
              {(() => {
                if (!withdrawals || withdrawals.length === 0) return null;
                const pending = withdrawals.filter((w) => Number(w.amount) > 0);
                const completed = withdrawals.filter(
                  (w) => Number(w.amount) === 0
                );
                if (pending.length > 0 || showCompletedWithdrawals) {
                  return (
                    <WithdrawalsTable
                      withdrawals={
                        showCompletedWithdrawals ? withdrawals : pending
                      }
                      network={network}
                      showCompleted={showCompletedWithdrawals}
                      onShowCompletedChange={setShowCompletedWithdrawals}
                      withdrawnAmountsByStakeId={withdrawnAmountsByStakeId}
                    />
                  );
                } else if (completed.length > 0) {
                  return (
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-gray-700 dark:text-gray-200">
                          No pending withdrawals.
                        </span>
                        <button
                          className="text-blue-600 dark:text-blue-400 underline text-sm"
                          onClick={() => setShowCompletedWithdrawals(true)}
                        >
                          Show completed withdrawals
                        </button>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              {filteredAndSortedStakes?.length > 0 && (
                <>
                  <StakesTable
                    stakes={pagedStakes}
                    network={network}
                    hideCompleted={hideCompleted}
                    setHideCompleted={setHideCompleted}
                    requestSort={requestSort}
                    getSortIcon={(key) => getSortIcon(sortConfig, key)}
                  />
                  {/* Pagination controls */}
                  {filteredAndSortedStakes.length > 10 && (
                    <div className="flex flex-row flex-nowrap justify-between items-center gap-2 mt-4 w-full overflow-x-auto">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <label
                          htmlFor="stakes-rows-per-page"
                          className="text-sm dark:text-white"
                        >
                          Rows per page:
                        </label>
                        <select
                          id="stakes-rows-per-page"
                          className="border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
                          value={rowsPerPage}
                          onChange={(e) =>
                            setRowsPerPage(Number(e.target.value))
                          }
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                        <button
                          className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
                          onClick={() => setStakesPage(1)}
                          disabled={stakesPage === 1}
                          aria-label="First page"
                        >
                          {"|<"}
                        </button>
                        <button
                          className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
                          onClick={() =>
                            setStakesPage((p) => Math.max(1, p - 1))
                          }
                          disabled={stakesPage === 1}
                          aria-label="Previous page"
                        >
                          {"<"}
                        </button>
                        <span className="text-sm dark:text-white">
                          Page {stakesPage} of {totalStakesPages}
                        </span>
                        <button
                          className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
                          onClick={() =>
                            setStakesPage((p) =>
                              Math.min(totalStakesPages, p + 1)
                            )
                          }
                          disabled={stakesPage === totalStakesPages}
                          aria-label="Next page"
                        >
                          {">"}
                        </button>
                        <button
                          className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
                          onClick={() => setStakesPage(totalStakesPages)}
                          disabled={stakesPage === totalStakesPages}
                          aria-label="Last page"
                        >
                          {">|"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
