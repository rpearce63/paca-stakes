import { ABI as BSC_ABI } from "../contracts/PacaABI_BSC";
import { ABI as BASE_ABI } from "../contracts/PacaABI_BASE";
import { ABI as SONIC_ABI } from "../contracts/PacaABI_SONIC";

export const NETWORKS = {
  bsc: {
    name: "BSC",
    rpc: "https://bsc-rpc.publicnode.com",
    contract: "0x3fF44D639a4982A4436f6d737430141aBE68b4E1",
    token: "USDT",
    decimals: 18,
    abi: BSC_ABI,
    explorer: "https://bscscan.com",
  },
  base: {
    name: "BASE",
    rpc: "https://base.llamarpc.com",
    contract: "0xDf2027318D27c4eD1C047B4d6247A7a705bb407b",
    token: "USDC",
    decimals: 6,
    abi: BASE_ABI,
    explorer: "https://basescan.org",
  },
  sonic: {
    name: "SONIC",
    rpc: "https://rpc.soniclabs.com",
    contract: "0xa26F8128Ecb2FF2FC5618498758cC82Cf1FDad5F",
    token: "USDC",
    decimals: 6,
    abi: SONIC_ABI,
    explorer: "https://sonicscan.org",
  },
};
