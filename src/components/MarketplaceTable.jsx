import React from "react";
import { NETWORKS } from "../constants/networks";
import { ethers } from "ethers";
import { formatCurrency } from "../utils/formatters";

export default function MarketplaceTable({ chainId, stakes }) {
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

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">
        Marketplace Stakes ({NETWORKS[chainId].name})
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold dark:text-white">
                Chain
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold dark:text-white">
                Stake ID
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold dark:text-white">
                Seller
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white">
                Price
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white">
                Stake Value
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white">
                Bonus Amount
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white">
                Buyer Receives
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white">
                Daily Reward Rate
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white">
                <span className="relative group cursor-help">
                  Effective Daily Rate
                  <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 z-20 hidden group-hover:block bg-gray-900 text-white text-xs rounded p-2 shadow-lg border border-gray-700 whitespace-normal">
                    Based on the net stake amount (Stake Value + Bonus) the
                    buyer receives. Does <b>not</b> include pending rewards,
                    which are received as a one-time bonus at purchase.
                  </span>
                </span>
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right font-semibold dark:text-white">
                Pending Rewards
              </th>
            </tr>
          </thead>
          <tbody>
            {stakes && stakes.length > 0 ? (
              stakes.map((stake, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                    {NETWORKS[chainId].name}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                    {stake.stakeId}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 dark:text-white">
                    {abbreviateAddress(stake.seller)}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                    {formatCurrency(
                      Number(ethers.formatUnits(stake.price || 0, decimals))
                    )}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                    {formatCurrency(
                      Number(ethers.formatUnits(stake.amount || 0, decimals))
                    )}
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
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
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                    {(Number(stake.dailyRewardRate) / 100).toFixed(2)}%
                  </td>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right dark:text-white">
                    {getEffectiveDailyRate(stake)}
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
    </div>
  );
}
