/**
 * Calculate simple interest stake returns
 * @param {number} stakeAmount - Initial stake amount
 * @param {number} dailyRate - Daily interest rate as percentage (e.g., 0.33 for 0.33%)
 * @param {number} days - Number of days to stake
 * @returns {object} - Returns object with totalReturn and totalValue
 */
export const calculateSimpleStake = (stakeAmount, dailyRate, days) => {
  if (!stakeAmount || !dailyRate || !days) {
    return { totalReturn: 0, totalValue: stakeAmount || 0, dailyReturn: 0 };
  }

  const dailyRateDecimal = dailyRate / 100;
  const totalReturn = stakeAmount * dailyRateDecimal * days;
  const totalValue = stakeAmount + totalReturn;
  const dailyReturn = stakeAmount * dailyRateDecimal;

  return {
    totalReturn,
    totalValue,
    dailyReturn,
  };
};

/**
 * Calculate compound interest stake returns with daily compounding
 * @param {number} stakeAmount - Initial stake amount
 * @param {number} dailyRate - Daily interest rate as percentage (e.g., 0.33 for 0.33%)
 * @param {number} days - Number of days to stake
 * @param {boolean} enableRestaking - Whether to restake expired stakes with bonus rate
 * @returns {object} - Returns object with totalReturn, totalValue, and stakeHistory
 */
export const calculateCompoundStake = (
  stakeAmount,
  dailyRate,
  days,
  enableRestaking = false
) => {
  if (!stakeAmount || !dailyRate || !days) {
    return {
      totalReturn: 0,
      totalValue: stakeAmount || 0,
      stakeHistory: [],
      totalStakedValue: stakeAmount || 0,
      dailyReturn: 0,
    };
  }

  const dailyRateDecimal = dailyRate / 100;
  const compoundDailyRate = 0.33 / 100; // Fixed 0.33% for new stakes
  const compoundDays = 250; // Fixed 250 days for new stakes
  const restakeDailyRate = 0.37 / 100; // 0.37% for restaked stakes
  const restakeDays = 250; // 250 days for restaked stakes

  let currentStakes = [
    {
      amount: stakeAmount,
      daysLeft: days,
      rate: dailyRateDecimal,
      type: "initial",
    },
  ];
  let totalStakedValue = stakeAmount;
  let expiredCompoundStakes = []; // Track expired compound stakes for potential restaking
  const stakeHistory = [];

  for (let day = 1; day <= days; day++) {
    // Calculate total daily rewards from all active stakes
    let totalDailyRewards = 0;
    let newExpiredCompoundStakes = [];

    // Update existing stakes and calculate their rewards
    currentStakes = currentStakes.map((stake) => {
      if (stake.daysLeft > 0) {
        const dailyReward = stake.amount * stake.rate;
        totalDailyRewards += dailyReward;
        return {
          ...stake,
          daysLeft: stake.daysLeft - 1,
        };
      } else {
        // Stake has expired
        if (stake.type === "compound" || stake.type === "restake") {
          // Only compound and restake stakes are eligible for restaking
          newExpiredCompoundStakes.push(stake);
        }
        // Initial stakes are not restaked - they just expire
        return null;
      }
    });

    // Remove expired stakes and add compound stakes to expired list
    currentStakes = currentStakes.filter((stake) => stake !== null);
    expiredCompoundStakes = [
      ...expiredCompoundStakes,
      ...newExpiredCompoundStakes,
    ];

    // Handle restaking if enabled (only for compound stakes)
    if (enableRestaking && expiredCompoundStakes.length > 0) {
      const totalExpiredAmount = expiredCompoundStakes.reduce(
        (sum, stake) => sum + stake.amount,
        0
      );
      if (totalExpiredAmount > 0) {
        const restake = {
          amount: totalExpiredAmount,
          daysLeft: restakeDays,
          rate: restakeDailyRate,
          type: "restake",
        };
        currentStakes.push(restake);
        totalStakedValue += totalExpiredAmount;
        expiredCompoundStakes = []; // Clear expired compound stakes after restaking
      }
    }

    // If we have rewards and there are days left, create a new stake with fixed parameters
    if (totalDailyRewards > 0 && day <= days) {
      const newStake = {
        amount: totalDailyRewards,
        daysLeft: compoundDays,
        rate: compoundDailyRate,
        type: "compound",
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
      expiredCompoundStakes: expiredCompoundStakes.length,
    });
  }

  // After the main loop, handle any remaining expired compound stakes for restaking
  if (enableRestaking && expiredCompoundStakes.length > 0) {
    const totalExpiredAmount = expiredCompoundStakes.reduce(
      (sum, stake) => sum + stake.amount,
      0
    );
    if (totalExpiredAmount > 0) {
      const restake = {
        amount: totalExpiredAmount,
        daysLeft: restakeDays,
        rate: restakeDailyRate,
        type: "restake",
      };
      currentStakes.push(restake);
      totalStakedValue += totalExpiredAmount;
      expiredCompoundStakes = []; // Clear expired compound stakes after restaking
    }
  }

  // Calculate final values and current daily return from all active stakes
  const totalReturn = totalStakedValue - stakeAmount;
  const totalValue = totalStakedValue;

  // Calculate current daily return from all active stakes
  const currentDailyReturn = currentStakes.reduce((total, stake) => {
    return total + stake.amount * stake.rate;
  }, 0);

  // Calculate weighted average daily rate of all active stakes
  const totalActiveAmount = currentStakes.reduce(
    (sum, stake) => sum + stake.amount,
    0
  );
  const averageDailyRate =
    totalActiveAmount > 0 ? (currentDailyReturn / totalActiveAmount) * 100 : 0;

  // Calculate average daily return over the entire period
  const averageDailyReturn = days > 0 ? totalReturn / days : 0;

  return {
    totalReturn,
    totalValue,
    totalStakedValue,
    stakeHistory,
    finalActiveStakes: currentStakes.length,
    dailyReturn: currentDailyReturn,
    averageDailyReturn,
    finalExpiredCompoundStakes: expiredCompoundStakes.length,
    averageDailyRate,
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
