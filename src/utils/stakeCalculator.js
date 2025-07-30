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
  let expiredCompoundStakes = []; // Track expired compound stakes for potential restaking
  const stakeHistory = [];
  let totalRewardsEarned = 0; // Track total rewards earned across all stakes

  for (let day = 1; day <= days; day++) {
    // Calculate total daily rewards from all active stakes
    let totalDailyRewards = 0;
    let newExpiredCompoundStakes = [];

    // Update existing stakes and calculate their rewards
    currentStakes = currentStakes.map((stake) => {
      if (stake.daysLeft > 0) {
        const dailyReward = stake.amount * stake.rate;
        totalDailyRewards += dailyReward;
        totalRewardsEarned += dailyReward; // Track total rewards earned
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
    }

    // Record daily summary
    stakeHistory.push({
      day,
      activeStakes: currentStakes.length,
      totalStakedValue: currentStakes.reduce((total, stake) => total + stake.amount, 0),
      dailyRewards: totalDailyRewards,
      cumulativeRewards: totalRewardsEarned,
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

  // Calculate final values
  const totalReturn = totalRewardsEarned; // Total return is all rewards earned
  
  // Calculate total staked value as the sum of all currently active stakes
  const totalStakedValue = currentStakes.reduce((total, stake) => {
    return total + stake.amount;
  }, 0);
  
  const totalValue = totalStakedValue; // Final value is total amount still staked

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
  const averageDailyReturn = days > 0 ? totalRewardsEarned / days : 0;

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
 * Calculate strategy-based compound interest stake returns
 * @param {number} stakeAmount - Initial stake amount
 * @param {number} dailyRate - Daily interest rate as percentage (e.g., 0.33 for 0.33%)
 * @param {number} days - Number of days to stake
 * @param {string} strategy - Compounding strategy ('4-3' or 'alternate')
 * @param {boolean} enableRestaking - Whether to restake expired stakes with bonus rate
 * @returns {object} - Returns object with totalReturn, totalValue, and stakeHistory
 */
export const calculateStrategyStake = (
  stakeAmount,
  dailyRate,
  days,
  strategy,
  enableRestaking = false
) => {
  if (!stakeAmount || !dailyRate || !days) {
    return {
      totalReturn: 0,
      totalValue: stakeAmount || 0,
      stakeHistory: [],
      totalStakedValue: stakeAmount || 0,
      dailyReturn: 0,
      totalClaimed: 0,
    };
  }

  const dailyRateDecimal = dailyRate / 100;
  const compoundDailyRate = 0.33 / 100; // Fixed 0.33% for new stakes
  const compoundDays = 250; // Fixed 250 days for new stakes
  const restakeDailyRate = 0.37 / 100; // 0.37% for restaked stakes
  const restakeDays = 250; // 250 days for restaked stakes

  // Minimum thresholds
  const MIN_COMPOUND_AMOUNT = 20; // $20 minimum to compound
  const MIN_CLAIM_AMOUNT = 25; // $25 minimum to claim

  let currentStakes = [
    {
      amount: stakeAmount,
      daysLeft: days,
      rate: dailyRateDecimal,
      type: "initial",
    },
  ];
  let expiredCompoundStakes = []; // Track expired compound stakes for potential restaking
  const stakeHistory = [];
  let accumulatedRewards = 0; // Track accumulated rewards for strategy-based compounding
  let totalClaimed = 0; // Track total claimed rewards
  let totalRewardsEarned = 0; // Track total rewards earned across all stakes

  // Strategy cycle tracking
  let compoundCount = 0; // Track how many compounds done in current cycle
  let claimCount = 0; // Track how many claims done in current cycle
  let totalCompounds = 0; // Track total compounds across entire period
  let totalClaims = 0; // Track total claims across entire period
  let totalCompoundedAmount = 0; // Track total amount compounded across entire period
  let maxCompounds = 0; // Maximum compounds per cycle
  let maxClaims = 0; // Maximum claims per cycle
  let cycleLength = 0; // Total cycle length

  // Set up strategy parameters
  if (strategy === "4-3") {
    maxCompounds = 4;
    maxClaims = 3;
    cycleLength = 7;
  } else if (strategy === "5-2") {
    maxCompounds = 5;
    maxClaims = 2;
    cycleLength = 7;
  } else if (strategy === "alternate") {
    maxCompounds = 1;
    maxClaims = 1;
    cycleLength = 2;
  }

  for (let day = 1; day <= days; day++) {
    // Calculate total daily rewards from all active stakes
    let totalDailyRewards = 0;
    let newExpiredCompoundStakes = [];

    // Update existing stakes and calculate their rewards
    currentStakes = currentStakes.map((stake) => {
      if (stake.daysLeft > 0) {
        const dailyReward = stake.amount * stake.rate;
        totalDailyRewards += dailyReward;
        totalRewardsEarned += dailyReward; // Track total rewards earned
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

    // Handle strategy-based compounding
    if (totalDailyRewards > 0) {
      accumulatedRewards += totalDailyRewards;
      
      // Determine if we should compound or claim based on current cycle position
      let shouldCompound = false;
      let shouldClaim = false;
      
      if (compoundCount < maxCompounds) {
        // Still in compound phase of cycle
        shouldCompound = true;
      } else if (claimCount < maxClaims) {
        // Still in claim phase of cycle
        shouldClaim = true;
      } else {
        // Cycle complete, reset for next cycle
        compoundCount = 0;
        claimCount = 0;
        shouldCompound = true; // Start new cycle with compound
      }

      // Check if we have enough accumulated rewards to take action
      if (shouldCompound && accumulatedRewards >= MIN_COMPOUND_AMOUNT) {
        // Create a new compound stake
        const newStake = {
          amount: accumulatedRewards,
          daysLeft: compoundDays,
          rate: compoundDailyRate,
          type: "compound",
        };
        currentStakes.push(newStake);
        accumulatedRewards = 0; // Reset accumulated rewards
        compoundCount++; // Increment compound count
        totalCompounds++; // Increment total compounds
        totalCompoundedAmount += newStake.amount; // Add to total compounded amount
      } else if (shouldClaim && accumulatedRewards >= MIN_CLAIM_AMOUNT) {
        // Claim accumulated rewards
        totalClaimed += accumulatedRewards;
        accumulatedRewards = 0; // Reset accumulated rewards
        claimCount++; // Increment claim count
        totalClaims++; // Increment total claims
      }
      // If accumulated rewards are below minimums, they remain accumulated for next cycle
      // This applies regardless of whether it's a compound or claim day according to the strategy
    }

    // Record daily summary
    stakeHistory.push({
      day,
      activeStakes: currentStakes.length,
      totalStakedValue: currentStakes.reduce((total, stake) => total + stake.amount, 0),
      dailyRewards: totalDailyRewards,
      cumulativeRewards: totalRewardsEarned,
      expiredCompoundStakes: expiredCompoundStakes.length,
      accumulatedRewards,
      totalClaimed,
      strategy,
      compoundCount,
      claimCount,
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
      expiredCompoundStakes = []; // Clear expired compound stakes after restaking
    }
  }

        // Add any remaining accumulated rewards as a new stake
      if (accumulatedRewards > 0) {
        const finalStake = {
          amount: accumulatedRewards,
          daysLeft: compoundDays,
          rate: compoundDailyRate,
          type: "compound",
        };
        currentStakes.push(finalStake);
        totalCompoundedAmount += accumulatedRewards;
      }

  // Calculate final values
  const totalReturn = totalRewardsEarned; // Total return is all rewards earned
  
  // Calculate total staked value as the sum of all currently active stakes
  const totalStakedValue = currentStakes.reduce((total, stake) => {
    return total + stake.amount;
  }, 0);
  
  const totalValue = totalStakedValue; // Final value is total amount still staked

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
  const averageDailyReturn = days > 0 ? totalRewardsEarned / days : 0;

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
    strategy,
    finalAccumulatedRewards: accumulatedRewards,
    totalClaimed,
    totalCompounds,
    totalClaims,
    totalCompoundedAmount,
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
