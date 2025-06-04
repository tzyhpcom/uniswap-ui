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


const Q96 = BigInt(2) ** BigInt(96);

/**
 * Converts price to sqrtPriceX96 format
 * @param price price with decimals normalized
 * @returns sqrtPriceX96
 */
export function priceToSqrtPriceX96(price: number): bigint {
    const sqrtPrice = Math.sqrt(price);
    return ethers.getBigInt(
        BigInt(Math.floor(sqrtPrice * 2 ** 96))
    );
}

/**
 * Converts sqrtPriceX96 to price
 * @param sqrtPriceX96 The sqrt price in X96 format
 * @returns The actual price
 */
export function sqrtPriceX96ToPrice(sqrtPriceX96: bigint): number {
    const price = Number((sqrtPriceX96 * sqrtPriceX96) / Q96);
    return price / 2 ** 96;
}

// Helper function to format sqrtPriceX96 to human readable price
export function formatSqrtPriceX96ToPrice(sqrtPriceX96: string | bigint): string {
    if (!sqrtPriceX96) return '0';
    const price = sqrtPriceX96ToPrice(BigInt(sqrtPriceX96));
    return price.toFixed(6); // 保留6位小数
}