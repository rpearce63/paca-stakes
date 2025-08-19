import { ethers } from "ethers";

export const sortData = (data, { key, direction }, networkDecimals) => {
  if (!key) return data;

  return [...data].sort((a, b) => {
    let aValue = a[key];
    let bValue = b[key];

    // Handle numeric values
    if (key === "amount" || key === "dailyEarnings" || key === "price" || key === "bonusAmount" || key === "pendingRewards") {
      aValue = Number(ethers.formatUnits(a[key] || 0, networkDecimals));
      bValue = Number(ethers.formatUnits(b[key] || 0, networkDecimals));
    }
    // Handle stake ID (numeric)
    else if (key === "stakeId") {
      aValue = Number(a[key] || 0);
      bValue = Number(b[key] || 0);
    }
    // Handle percentage values
    else if (key === "dailyRewardRate") {
      aValue = Number(a[key]) / 100;
      bValue = Number(b[key]) / 100;
    }
    // Handle date values
    else if (key === "lastClaimed" || key === "unlockTime") {
      aValue = Number(a[key]);
      bValue = Number(b[key]);
    }
    // Handle days left - sort by actual unlockTime timestamp
    else if (key === "daysLeft") {
      aValue = Number(a.unlockTime);
      bValue = Number(b.unlockTime);
    }
    // Handle daily rewards calculation
    else if (key === "dailyRewards") {
      const aNetStake = BigInt(a.amount || 0) + BigInt(a.bonusAmount || 0);
      const bNetStake = BigInt(b.amount || 0) + BigInt(b.bonusAmount || 0);
      const aNetStakeNum = Number(ethers.formatUnits(aNetStake.toString(), networkDecimals));
      const bNetStakeNum = Number(ethers.formatUnits(bNetStake.toString(), networkDecimals));
      const aDailyRate = Number(a.dailyRewardRate) / 100;
      const bDailyRate = Number(b.dailyRewardRate) / 100;
      aValue = aNetStakeNum * (aDailyRate / 100);
      bValue = bNetStakeNum * (bDailyRate / 100);
    }
    // Handle buyer receives (net stake amount)
    else if (key === "buyerReceives") {
      const aNetStake = BigInt(a.amount || 0) + BigInt(a.bonusAmount || 0);
      const bNetStake = BigInt(b.amount || 0) + BigInt(b.bonusAmount || 0);
      aValue = Number(ethers.formatUnits(aNetStake.toString(), networkDecimals));
      bValue = Number(ethers.formatUnits(bNetStake.toString(), networkDecimals));
    }
    // Handle discount percentage calculation
    else if (key === "discountPercentage") {
      if (!a.price || !a.amount || !b.price || !b.amount) {
        aValue = 0;
        bValue = 0;
      } else {
        const aStakeValue = Number(ethers.formatUnits(a.amount, networkDecimals));
        const bStakeValue = Number(ethers.formatUnits(b.amount, networkDecimals));
        const aPrice = Number(ethers.formatUnits(a.price, networkDecimals));
        const bPrice = Number(ethers.formatUnits(b.price, networkDecimals));
        
        if (aStakeValue === 0) aValue = 0;
        else aValue = ((aStakeValue - aPrice) / aStakeValue) * 100;
        
        if (bStakeValue === 0) bValue = 0;
        else bValue = ((bStakeValue - bPrice) / bStakeValue) * 100;
      }
    }
    // Handle effective daily rate calculation
    else if (key === "effectiveDailyRate") {
      if (!a.price || !a.amount || !a.dailyRewardRate || !b.price || !b.amount || !b.dailyRewardRate) {
        // Handle cases where calculation is not possible
        aValue = 0;
        bValue = 0;
      } else {
        const aNetStake = BigInt(a.amount || 0) + BigInt(a.bonusAmount || 0);
        const bNetStake = BigInt(b.amount || 0) + BigInt(b.bonusAmount || 0);
        const aNetStakeNum = Number(ethers.formatUnits(aNetStake.toString(), networkDecimals));
        const bNetStakeNum = Number(ethers.formatUnits(bNetStake.toString(), networkDecimals));
        const aPrice = Number(ethers.formatUnits(a.price, networkDecimals));
        const bPrice = Number(ethers.formatUnits(b.price, networkDecimals));
        const aDailyRate = Number(a.dailyRewardRate) / 10000; // Convert from basis points
        const bDailyRate = Number(b.dailyRewardRate) / 10000;
        
        if (aPrice === 0) aValue = 0;
        else aValue = ((aNetStakeNum * aDailyRate) / aPrice) * 100;
        
        if (bPrice === 0) bValue = 0;
        else bValue = ((bNetStakeNum * bDailyRate) / bPrice) * 100;
      }
    }

    if (aValue < bValue) return direction === "asc" ? -1 : 1;
    if (aValue > bValue) return direction === "asc" ? 1 : -1;
    return 0;
  });
};

export const getSortIcon = (sortConfig, key) => {
  if (sortConfig.key !== key) return "↕️";
  return sortConfig.direction === "asc" ? "↑" : "↓";
};

export const getSortIconUnicode = (sortConfig, key) => {
  if (sortConfig.key !== key) return "⇅";
  return sortConfig.direction === "asc" ? "↑" : "↓";
};
