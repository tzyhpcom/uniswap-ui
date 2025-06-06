"use client"

import { useState, useEffect } from "react"
import { contractConfig } from "@/constants"
import { useReadContracts, useAccount } from 'wagmi'
import { formatUnits } from "ethers"
import { sqrtPriceX96ToPrice, formatSqrtPriceX96ToPrice } from "@/utils/utils"

export interface PoolInfo {
    address: string;
    name: string;
    sqrtPriceX96: string;
    price: string;
    tick: number;
    tickSpacing: number;
    liquidity: string;
}

export default function PoolList() {
    const [pools, setPools] = useState<PoolInfo[]>([]);
    const account = useAccount();

    const poolAddresses = [
        { address: contractConfig.USDT_USDC_address, name: 'USDT-USDC' },
        { address: contractConfig.WBTC_USDT_address, name: 'WBTC-USDT' },
        { address: contractConfig.WETH_UNI_address, name: 'WETH-UNI' },
        { address: contractConfig.WETH_USDC_address, name: 'WETH-USDC' },
    ];

    // 使用 useReadContracts 批量读取所有池子的数据
    const { data: poolsData } = useReadContracts({
        // 如果使用 map，结果会是一个嵌套数组，而 flatMap 会将结果"压平"成一个一维数组。
        contracts: poolAddresses.flatMap(({ address }) => [
            {
                address: address as `0x${string}`,
                abi: contractConfig.ABIS.Pool.abi,
                functionName: 'slot0',
            },
            {
                address: address as `0x${string}`,
                abi: contractConfig.ABIS.Pool.abi,
                functionName: 'liquidity',
            },
            {
                address: address as `0x${string}`,
                abi: contractConfig.ABIS.Pool.abi,
                functionName: 'tickSpacing',
            },
        ])
    })

    useEffect(() => {
        if (poolsData) {
            const formattedPools = poolAddresses.map((pool, index) => {
                const baseIndex = index * 3;
                const slot0Data = poolsData[baseIndex]?.result as any;
                const liquidityData = poolsData[baseIndex + 1]?.result as bigint;
                const tickSpacingData = poolsData[baseIndex + 2]?.result as number;

                console.log("poolsData slot0:", poolsData[baseIndex]);

                return {
                    address: pool.address,
                    name: pool.name,
                    sqrtPriceX96: slot0Data?.[0]?.toString() || '0',
                    price: formatSqrtPriceX96ToPrice(slot0Data?.[0]),
                    tick: Number(slot0Data?.[1] || 0),
                    tickSpacing: Number(tickSpacingData || 0),
                    liquidity: liquidityData?.toString() || '0',
                };
            });

            setPools(formattedPools);
        }
    }, [poolsData]);

    return (
         <div className="w-full"> {/* 移除 max-w-6xl 和 mx-auto p-6，让表格占据全宽 */}
            <div className="overflow-x-auto"> {/* 保留overflow-x-auto以支持小屏幕滚动 */}
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-4 py-2 text-left">Pool</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">SqrtPrice</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Price</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Tick</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Tick Spacing</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">Liquidity</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pools.map((pool) => (
                            <tr key={pool.address} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-2">{pool.name}</td>
                                <td className="border border-gray-300 px-4 py-2">{pool.sqrtPriceX96}</td>
                                <td className="border border-gray-300 px-4 py-2">{pool.price}</td>
                                <td className="border border-gray-300 px-4 py-2">{pool.tick}</td>
                                <td className="border border-gray-300 px-4 py-2">{pool.tickSpacing}</td>
                                <td className="border border-gray-300 px-4 py-2">{pool.liquidity}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}