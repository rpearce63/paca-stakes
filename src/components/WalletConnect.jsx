import React, { useState, useEffect, useRef } from "react";
import { NETWORKS } from "../constants/networks";

const WalletConnect = ({ onAddressChange, currentNetwork }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);
  const lastSwitchedNetwork = useRef(null);

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkConnection();
  }, []);

  // Switch chain when currentNetwork changes
  useEffect(() => {
    // Clear any previous errors when network changes
    setError("");

    if (
      isConnected &&
      currentNetwork &&
      !isSwitchingChain &&
      lastSwitchedNetwork.current !== currentNetwork
    ) {
      lastSwitchedNetwork.current = currentNetwork;
      switchChain(currentNetwork);
    }
  }, [currentNetwork, isConnected, isSwitchingChain]);

  const checkConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          onAddressChange(accounts[0]);
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    }
  };

  const switchChain = async (networkKey) => {
    if (
      typeof window.ethereum === "undefined" ||
      !isConnected ||
      isSwitchingChain
    )
      return;

    const targetNetwork = NETWORKS[networkKey];
    if (!targetNetwork) return;

    setIsSwitchingChain(true);

    try {
      // Add a small delay to prevent conflicts
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get current chain ID
      const currentChainId = await window.ethereum.request({
        method: "eth_chainId",
      });
      const targetChainId = `0x${targetNetwork.chainId.toString(16)}`;

      // Only switch if we're not already on the target chain
      if (currentChainId !== targetChainId) {
        try {
          // Try to switch to the target chain
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: targetChainId }],
          });
        } catch (switchError) {
          // If switch fails, try to add the chain first
          if (switchError.code === 4902 || switchError.code === -32603) {
            try {
              await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: targetChainId,
                    chainName: targetNetwork.name,
                    nativeCurrency: {
                      name: targetNetwork.token,
                      symbol: targetNetwork.token,
                      decimals: targetNetwork.decimals,
                    },
                    rpcUrls: [targetNetwork.rpc],
                    blockExplorerUrls: [
                      networkKey === "bsc"
                        ? "https://bscscan.com"
                        : networkKey === "base"
                        ? "https://basescan.org"
                        : "https://explorer.soniclabs.com",
                    ],
                  },
                ],
              });

              // Now try to switch again
              await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: targetChainId }],
              });
            } catch (addError) {
              console.error("Error adding chain:", addError);
              setError(
                `Failed to add ${targetNetwork.name} network to wallet: ${addError.message}`
              );
            }
          } else {
            console.error("Error switching chain:", switchError);
            setError(
              `Failed to switch to ${targetNetwork.name} network: ${switchError.message}`
            );
          }
        }
      }
    } catch (error) {
      console.error(
        `Unexpected error switching to ${targetNetwork.name}:`,
        error
      );
      setError(
        `Unexpected error switching to ${targetNetwork.name}: ${error.message}`
      );
    } finally {
      setIsSwitchingChain(false);
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      setError(
        "MetaMask is not installed. Please install MetaMask to connect your wallet."
      );
      return;
    }

    setIsConnecting(true);
    setError("");

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        onAddressChange(accounts[0]);

        // Switch to the current network after connecting
        if (currentNetwork) {
          await switchChain(currentNetwork);
        }
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      if (error.code === 4001) {
        setError("Connection rejected by user.");
      } else {
        setError("Failed to connect wallet. Please try again.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAddress("");
    setIsConnected(false);
    onAddressChange("");
    setError("");
  };

  const shortenAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          disconnectWallet();
        } else if (accounts[0] !== address) {
          // User switched accounts
          setAddress(accounts[0]);
          onAddressChange(accounts[0]);
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);

      return () => {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
      };
    }
  }, [address, onAddressChange]);

  return (
    <div className="flex items-center">
      {error && (
        <div className="mr-2 p-1 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
          {error}
        </div>
      )}

      {isConnected ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded text-xs">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span className="font-medium text-green-800 dark:text-green-200">
              {shortenAddress(address)}
            </span>
          </div>
          <button
            onClick={disconnectWallet}
            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200 text-xs"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors duration-200 text-xs"
        >
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
      )}
    </div>
  );
};

export default WalletConnect;
