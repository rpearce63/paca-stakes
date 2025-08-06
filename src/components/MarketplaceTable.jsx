import React, { useState } from "react";
import { NETWORKS } from "../constants/networks";
import { ethers } from "ethers";
import { formatCurrency } from "../utils/formatters";
import { getSortIconUnicode } from "../utils/sorting";

// Mobile popup component for stake details
function MobileStakePopup({ stake, chainId, onClose, originRect }) {
  const [isVisible, setIsVisible] = React.useState(false);
  const cardRef = React.useRef(null);
  const decimals = NETWORKS[chainId].decimals;

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Get viewport size
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Centered card size
  const targetWidth = Math.min(360, vw - 32);
  const targetHeight = Math.min(600, vh - 32);
  const targetTop = (vh - targetHeight) / 2;
  const targetLeft = (vw - targetWidth) / 2;

  // Animation: from originRect to center, scale and rotateY
  let style = {
    position: "fixed",
    zIndex: 100,
    border: "2px solid #3b82f6", // blue border for debug
    borderRadius: "0.75rem",
    boxShadow: "0 10px 40px 0 rgba(0,0,0,0.25)",
    overflowY: "auto",
    maxHeight: "90vh",
    left: targetLeft,
    top: targetTop,
    width: targetWidth,
    height: targetHeight,
    transformOrigin: "center center",
    willChange: "transform,opacity",
    transition:
      "transform 0.5s cubic-bezier(0.4,0.2,0.2,1), opacity 0.3s cubic-bezier(0.4,0.2,0.2,1)",
    opacity: isVisible ? 1 : 0,
    transform: isVisible
      ? "scale(1) rotateY(360deg)"
      : "scale(0.2) rotateY(0deg)",
  };
  if (originRect) {
    // Animate from row position
    if (!isVisible) {
      style.left = originRect.left;
      style.top = originRect.top;
      style.width = originRect.width;
      style.height = originRect.height;
    }
  }

  // Calculate effective daily rate: (dailyRewardRate * netStakeAmount) / price
  const getEffectiveDailyRate = (stake) => {
    if (!stake.price || !stake.amount || !stake.dailyRewardRate) return "-";
    const netStake = BigInt(stake.amount || 0) + BigInt(stake.bonusAmount || 0);
    const netStakeNum = Number(
      ethers.formatUnits(netStake.toString(), decimals)
    );
    const price = Number(ethers.formatUnits(stake.price, decimals));
    // dailyRewardRate is in basis points (e.g., 1234 = 12.34%)
    const dailyRate = Number(stake.dailyRewardRate) / 10000;
    if (price === 0) return "-";
    return (((netStakeNum * dailyRate) / price) * 100).toFixed(2) + "%";
  };

  // Helper to abbreviate address
  const abbreviateAddress = (addr) => {
    if (!addr) return "-";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ease-out"
      onClick={() => {
        setIsVisible(false);
        setTimeout(onClose, 500);
      }}
    >
      <div
        ref={cardRef}
        style={style}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold dark:text-white">
              Stake #{stake.stakeId}
            </h3>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 500); // Wait for animation to complete
              }}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Chain
                </label>
                <div className="text-sm dark:text-white">
                  {NETWORKS[chainId].name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Stake ID
                </label>
                <div className="text-sm font-mono dark:text-white">
                  {stake.stakeId}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Seller
              </label>
              <div className="text-sm font-mono dark:text-white">
                {abbreviateAddress(stake.seller)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Price
                </label>
                <div className="text-lg font-semibold dark:text-white">
                  {formatCurrency(
                    Number(ethers.formatUnits(stake.price || 0, decimals))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Stake Value
                </label>
                <div className="text-lg font-semibold dark:text-white">
                  {formatCurrency(
                    Number(ethers.formatUnits(stake.amount || 0, decimals))
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Daily Reward Rate
                </label>
                <div className="text-lg font-semibold dark:text-white">
                  {(Number(stake.dailyRewardRate) / 100).toFixed(2)}%
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Bonus Amount
                </label>
                <div className="text-lg font-semibold dark:text-white">
                  {formatCurrency(
                    Number(ethers.formatUnits(stake.bonusAmount || 0, decimals))
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Buyer Receives
                </label>
                <div className="text-lg font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(
                    Number(
                      ethers.formatUnits(
                        (
                          BigInt(stake.amount || 0) +
                          BigInt(stake.bonusAmount || 0)
                        ).toString(),
                        decimals
                      )
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Effective Daily Rate
                </label>
                <div className="text-lg font-bold text-green-700 dark:text-green-300">
                  {getEffectiveDailyRate(stake)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Daily Rewards
                </label>
                <div className="text-lg font-semibold dark:text-white">
                  {(() => {
                    const netStake =
                      BigInt(stake.amount || 0) +
                      BigInt(stake.bonusAmount || 0);
                    const netStakeNum = Number(
                      ethers.formatUnits(netStake.toString(), decimals)
                    );
                    const dailyRate = Number(stake.dailyRewardRate) / 100;
                    return formatCurrency(netStakeNum * (dailyRate / 100));
                  })()}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Pending Rewards
                </label>
                <div className="text-lg font-semibold dark:text-white">
                  {formatCurrency(
                    Number(
                      ethers.formatUnits(stake.pendingRewards || 0, decimals)
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketplaceTable({ chainId, stakes, sortConfig, onSort }) {
  const [selectedStake, setSelectedStake] = useState(null);
  const [popupOrigin, setPopupOrigin] = useState(null); // {top, left, width, height}
  const decimals = NETWORKS[chainId].decimals;

  // Calculate effective daily rate: (dailyRewardRate * netStakeAmount) / price
  const getEffectiveDailyRate = (stake) => {
    if (!stake.price || !stake.amount || !stake.dailyRewardRate) return "-";
    const netStake = BigInt(stake.amount || 0) + BigInt(stake.bonusAmount || 0);
    const netStakeNum = Number(
      ethers.formatUnits(netStake.toString(), decimals)
    );
    const price = Number(ethers.formatUnits(stake.price, decimals));
    // dailyRewardRate is in basis points (e.g., 1234 = 12.34%)
    const dailyRate = Number(stake.dailyRewardRate) / 10000;
    if (price === 0) return "-";
    return (((netStakeNum * dailyRate) / price) * 100).toFixed(2) + "%";
  };

  // Helper to abbreviate address
  const abbreviateAddress = (addr) => {
    if (!addr) return "-";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
  };

  // Handle column sorting
  const handleSort = (key) => {
    if (sortConfig.key === key) {
      onSort({ key, direction: sortConfig.direction === "asc" ? "desc" : "asc" });
    } else {
      onSort({ key, direction: "asc" });
    }
  };

  const handleRowClick = (stake, e) => {
    if (window.innerWidth < 768) {
      const rect = e.currentTarget.getBoundingClientRect();
      setPopupOrigin({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
      setSelectedStake(stake);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold dark:text-white">
          Marketplace Stakes ({NETWORKS[chainId].name})
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Click column headers to sort
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold sm:table-cell hidden dark:text-white">
                Chain
              </th>
              <th 
                className={`border border-gray-300 dark:border-gray-600 px-1 py-2 text-left font-semibold dark:text-white w-16 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 ${
                  sortConfig.key === "stakeId" ? "bg-blue-100 dark:bg-blue-900/40" : ""
                }`}
                onClick={() => handleSort("stakeId")}
              >
                Stake ID {getSortIconUnicode(sortConfig, "stakeId")}
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold sm:table-cell hidden dark:text-white">
                Seller
              </th>
              <th 
                className={`border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 ${
                  sortConfig.key === "price" ? "bg-blue-100 dark:bg-blue-900/40" : ""
                }`}
                onClick={() => handleSort("price")}
              >
                Price {getSortIconUnicode(sortConfig, "price")}
              </th>
              <th 
                className={`border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold sm:table-cell hidden dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 ${
                  sortConfig.key === "amount" ? "bg-blue-100 dark:bg-blue-900/40" : ""
                }`}
                onClick={() => handleSort("amount")}
              >
                Stake Value {getSortIconUnicode(sortConfig, "amount")}
              </th>
              <th 
                className={`border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold sm:table-cell hidden dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 ${
                  sortConfig.key === "dailyRewardRate" ? "bg-blue-100 dark:bg-blue-900/40" : ""
                }`}
                onClick={() => handleSort("dailyRewardRate")}
              >
                Daily Reward Rate {getSortIconUnicode(sortConfig, "dailyRewardRate")}
              </th>
              <th 
                className={`border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold sm:table-cell hidden dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 ${
                  sortConfig.key === "bonusAmount" ? "bg-blue-100 dark:bg-blue-900/40" : ""
                }`}
                onClick={() => handleSort("bonusAmount")}
              >
                Bonus Amount {getSortIconUnicode(sortConfig, "bonusAmount")}
              </th>
              <th 
                className={`border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 ${
                  sortConfig.key === "buyerReceives" ? "bg-blue-100 dark:bg-blue-900/40" : ""
                }`}
                onClick={() => handleSort("buyerReceives")}
              >
                Buyer Receives {getSortIconUnicode(sortConfig, "buyerReceives")}
              </th>
              <th 
                className={`border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 ${
                  sortConfig.key === "effectiveDailyRate" ? "bg-blue-100 dark:bg-blue-900/40" : ""
                }`}
                onClick={() => handleSort("effectiveDailyRate")}
              >
                <span className="relative group cursor-help">
                  Effective Daily Rate {getSortIconUnicode(sortConfig, "effectiveDailyRate")}
                  <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 z-20 hidden group-hover:block bg-gray-900 text-white text-xs rounded p-2 shadow-lg border border-gray-700 whitespace-normal">
                    Based on the net stake amount (Stake Value + Bonus) the
                    buyer receives. Does <b>not</b> include pending rewards,
                    which are received as a one-time bonus at purchase.
                  </span>
                </span>
              </th>
              <th 
                className={`border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold sm:table-cell hidden dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 ${
                  sortConfig.key === "dailyRewards" ? "bg-blue-100 dark:bg-blue-900/40" : ""
                }`}
                onClick={() => handleSort("dailyRewards")}
              >
                Daily Rewards {getSortIconUnicode(sortConfig, "dailyRewards")}
              </th>
              <th 
                className={`border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 ${
                  sortConfig.key === "pendingRewards" ? "bg-blue-100 dark:bg-blue-900/40" : ""
                }`}
                onClick={() => handleSort("pendingRewards")}
              >
                Pending Rewards {getSortIconUnicode(sortConfig, "pendingRewards")}
              </th>
            </tr>
          </thead>
          <tbody>
            {stakes && stakes.length > 0 ? (
              stakes.map((stake, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer md:cursor-default"
                  onClick={(e) => handleRowClick(stake, e)}
                >
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white sm:table-cell hidden">
                    {NETWORKS[chainId].name}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-1 py-2 dark:text-white w-16">
                    {stake.stakeId}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white sm:table-cell hidden">
                    {abbreviateAddress(stake.seller)}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                    {formatCurrency(
                      Number(ethers.formatUnits(stake.price || 0, decimals))
                    )}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white sm:table-cell hidden">
                    {formatCurrency(
                      Number(ethers.formatUnits(stake.amount || 0, decimals))
                    )}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white sm:table-cell hidden">
                    {(Number(stake.dailyRewardRate) / 100).toFixed(2)}%
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white sm:table-cell hidden">
                    {formatCurrency(
                      Number(
                        ethers.formatUnits(stake.bonusAmount || 0, decimals)
                      )
                    )}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white font-semibold">
                    {formatCurrency(
                      Number(
                        ethers.formatUnits(
                          (
                            BigInt(stake.amount || 0) +
                            BigInt(stake.bonusAmount || 0)
                          ).toString(),
                          decimals
                        )
                      )
                    )}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white font-semibold">
                    <span className="font-bold text-green-700 dark:text-green-300">
                      {getEffectiveDailyRate(stake)}
                    </span>
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white font-semibold sm:table-cell hidden">
                    {(() => {
                      const netStake =
                        BigInt(stake.amount || 0) +
                        BigInt(stake.bonusAmount || 0);
                      const netStakeNum = Number(
                        ethers.formatUnits(netStake.toString(), decimals)
                      );
                      const dailyRate = Number(stake.dailyRewardRate) / 100;
                      return formatCurrency(netStakeNum * (dailyRate / 100));
                    })()}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                    {formatCurrency(
                      Number(
                        ethers.formatUnits(stake.pendingRewards || 0, decimals)
                      )
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={9}
                  className="text-center py-8 text-gray-500 dark:text-gray-400"
                >
                  No marketplace stakes found for this chain.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile popup for stake details */}
      {selectedStake && (
        <MobileStakePopup
          stake={selectedStake}
          chainId={chainId}
          onClose={() => setSelectedStake(null)}
          originRect={popupOrigin}
        />
      )}
    </div>
  );
}
