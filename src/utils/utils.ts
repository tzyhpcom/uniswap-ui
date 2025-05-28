import { ethers } from "ethers"

export function formatTokenBalance(
    balance: bigint | undefined, 
    decimals: number | undefined
): string {
    if (!balance || decimals === undefined) return '0';
    try {
        return ethers.formatUnits(balance, decimals);
    } catch (error) {
        return '0';
    }
};