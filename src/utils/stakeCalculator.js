/**
 * Calculate simple interest stake returns
 * @param {number} stakeAmount - Initial stake amount
 * @param {number} dailyRate - Daily interest rate as percentage (e.g., 0.33 for 0.33%)
 * @param {number} days - Number of days to stake
 * @returns {object} - Returns object with totalReturn and totalValue
 */
export const calculateSimpleStake = (stakeAmount, dailyRate, days) => {
  if (!stakeAmount || !dailyRate || !days) {
    return { totalReturn: 0, totalValue: stakeAmount || 0 };
  }

  const dailyRateDecimal = dailyRate / 100;
  const totalReturn = stakeAmount * dailyRateDecimal * days;
  const totalValue = stakeAmount + totalReturn;

  return {
    totalReturn,
    totalValue,
    dailyReturn: stakeAmount * dailyRateDecimal,
  };
};

/**
 * Calculate compound interest stake returns with daily compounding
 * @param {number} stakeAmount - Initial stake amount
 * @param {number} dailyRate - Daily interest rate as percentage (e.g., 0.33 for 0.33%)
 * @param {number} days - Number of days to stake
 * @returns {object} - Returns object with totalReturn, totalValue, and stakeHistory
 */
export const calculateCompoundStake = (stakeAmount, dailyRate, days) => {
  if (!stakeAmount || !dailyRate || !days) {
    return {
      totalReturn: 0,
      totalValue: stakeAmount || 0,
      stakeHistory: [],
      totalStakedValue: stakeAmount || 0,
    };
  }

  const dailyRateDecimal = dailyRate / 100;
  let currentStakes = [{ amount: stakeAmount, daysLeft: days }];
  let totalStakedValue = stakeAmount;
  const stakeHistory = [];

  for (let day = 1; day <= days; day++) {
    // Calculate total daily rewards from all active stakes
    let totalDailyRewards = 0;

    // Update existing stakes and calculate their rewards
    currentStakes = currentStakes.map((stake) => {
      if (stake.daysLeft > 0) {
        const dailyReward = stake.amount * dailyRateDecimal;
        totalDailyRewards += dailyReward;
        return {
          ...stake,
          daysLeft: stake.daysLeft - 1,
        };
      }
      return stake;
    });

    // Remove completed stakes
    currentStakes = currentStakes.filter((stake) => stake.daysLeft > 0);

    // If we have rewards and there are days left, create a new stake
    if (totalDailyRewards > 0 && day < days) {
      const newStake = {
        amount: totalDailyRewards,
        daysLeft: days - day,
      };
      currentStakes.push(newStake);
      totalStakedValue += totalDailyRewards;
    }

    // Record daily summary
    stakeHistory.push({
      day,
      activeStakes: currentStakes.length,
      totalStakedValue,
      dailyRewards: totalDailyRewards,
      cumulativeRewards: totalStakedValue - stakeAmount,
    });
  }

  // Calculate final values
  const totalReturn = totalStakedValue - stakeAmount;
  const totalValue = totalStakedValue;

  return {
    totalReturn,
    totalValue,
    totalStakedValue,
    stakeHistory,
    finalActiveStakes: currentStakes.length,
  };
};

/**
 * Format percentage for display
 * @param {number} value - Percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} - Formatted percentage string
 */
export const formatPercentage = (value, decimals = 2) => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format currency for display
 * @param {number} value - Currency value
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};
