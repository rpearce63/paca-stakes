import React, { useState, useEffect, useRef } from "react";
import {
  calculateSimpleStake,
  calculateCompoundStake,
  formatCurrency,
  formatPercentage,
} from "../utils/stakeCalculator";

export default function StakeCalculator({ isOpen, onClose }) {
  const [stakeAmount, setStakeAmount] = useState("");
  const [dailyRate, setDailyRate] = useState("0.33");
  const [stakeDuration, setStakeDuration] = useState(250);
  const [useCompounding, setUseCompounding] = useState(false);
  const [enableRestaking, setEnableRestaking] = useState(false);
  const [results, setResults] = useState(null);
  const modalRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close modal with Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Calculate results when inputs change
  useEffect(() => {
    if (stakeAmount && dailyRate && stakeDuration) {
      const amount = parseFloat(stakeAmount);
      const rate = parseFloat(dailyRate);
      const days = parseInt(stakeDuration);

      if (amount > 0 && rate > 0 && days > 0) {
        if (useCompounding) {
          const compoundResults = calculateCompoundStake(
            amount,
            rate,
            days,
            enableRestaking
          );
          setResults(compoundResults);
        } else {
          const simpleResults = calculateSimpleStake(amount, rate, days);
          setResults(simpleResults);
        }
      } else {
        setResults(null);
      }
    } else {
      setResults(null);
    }
  }, [stakeAmount, dailyRate, stakeDuration, useCompounding, enableRestaking]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Stake Calculator
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Stake Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stake Amount ($)
              </label>
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                min="0"
                step="0.01"
              />
            </div>

            {/* Daily Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Daily Rate (%)
              </label>
              <input
                type="number"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                placeholder="0.33"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                min="0"
                step="0.01"
              />
            </div>

            {/* Stake Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stake Duration
              </label>
              <select
                value={stakeDuration}
                onChange={(e) => setStakeDuration(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value={250}>250 Days</option>
                <option value={365}>365 Days</option>
              </select>
            </div>

            {/* Compounding Toggle */}
            <div className="flex items-center">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={useCompounding}
                  onChange={(e) => setUseCompounding(e.target.checked)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                Daily Compounding
              </label>
            </div>

            {/* Restaking Toggle - only show when compounding is enabled */}
            {useCompounding && (
              <div className="flex items-center">
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={enableRestaking}
                    onChange={(e) => setEnableRestaking(e.target.checked)}
                    className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  Restake Expired Stakes (0.37% bonus rate)
                </label>
              </div>
            )}
          </div>

          {/* Results */}
          {results && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Calculation Results
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-600 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Initial Investment
                  </h4>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(parseFloat(stakeAmount))}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-600 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Total Return
                  </h4>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(results.totalReturn)}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-600 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Final Value
                  </h4>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(results.totalValue)}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-600 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Final Daily Return
                  </h4>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(results.dailyReturn)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Avg: {formatCurrency(results.averageDailyReturn)}/day
                  </p>
                </div>
              </div>

              {/* Compound-specific results */}
              {useCompounding && results.stakeHistory && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
                    Compounding Details
                  </h4>
                  <div className="bg-white dark:bg-gray-600 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Total Staked Value:{" "}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(results.totalStakedValue)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Final Active Stakes:{" "}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {results.finalActiveStakes}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Total Return %:{" "}
                        </span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatPercentage(
                            (results.totalReturn / parseFloat(stakeAmount)) *
                              100
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Average Daily Rate:{" "}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatPercentage(results.averageDailyRate)}
                        </span>
                      </div>
                      {enableRestaking && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Final Expired Compound Stakes:{" "}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {results.finalExpiredCompoundStakes}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Simple interest results */}
              {!useCompounding && (
                <div className="mt-6">
                  <div className="bg-white dark:bg-gray-600 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Total Return %:{" "}
                        </span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatPercentage(
                            (results.totalReturn / parseFloat(stakeAmount)) *
                              100
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Daily Rate:{" "}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatPercentage(parseFloat(dailyRate))}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">
                          Stake Duration:{" "}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {stakeDuration} days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info Text */}
          <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">
              <strong>Simple Interest:</strong> Daily rewards are calculated but
              not reinvested.
            </p>
            <p className="mb-2">
              <strong>Daily Compounding:</strong> Daily rewards are
              automatically reinvested as new stakes at 0.33% daily rate for 250
              days.
            </p>
            <p className="mb-2">
              <strong>Restaking:</strong> When enabled, expired compound stakes
              (created from daily rewards) are automatically restaked at 0.37%
              daily rate for 250 days. The initial stake is not restaked.
            </p>
            <p className="text-xs">
              Note: New stakes created from compounding always use 0.33% daily
              rate and 250-day duration, regardless of your input values.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
