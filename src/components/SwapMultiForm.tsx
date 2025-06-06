"use client"

import { useState, useMemo, useEffect } from "react"
import { contractConfig } from "@/constants"
import { readContract, waitForTransactionReceipt } from '@wagmi/core'
import { useConfig, useAccount, useChainId, useWriteContract, useReadContracts, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { ethers } from 'ethers'
import TokenAmountInput from "@/components/ui/TokenAmountInput"
import { formatTokenBalance } from "@/utils/utils"
import { Toaster, toast } from 'react-hot-toast'
import createGraph from 'ngraph.graph'
import path from 'ngraph.path'
import { sqrtPriceX96ToPrice, formatSqrtPriceX96ToPrice } from "@/utils/utils"


interface Pool {
    address: string
    token0: string
    token1: string
    tickSpacing: number
}

class PathFinder {
    private graph
    private finder

    constructor(pools: Pool[]) {
        this.graph = createGraph()

        pools.forEach((pool) => {
            this.graph.addNode(pool.token0)  // 添加node
            this.graph.addNode(pool.token1)  // 添加node
            this.graph.addLink(pool.token0, pool.token1, { pool: pool })  // 添加link
            this.graph.addLink(pool.token1, pool.token0, { pool: pool })  // 添加link
        })

        this.finder = path.aStar(this.graph)
    }

    findPath(tokenIn: string, tokenOut: string) {
        const found = this.finder.find(tokenIn, tokenOut)
        if (!found) return null
        
        // Return both nodes and edges
        const edges = []
        for (let i = 0; i < found.length - 1; i++) {
            const link = this.graph.getLink(found[i].id, found[i + 1].id)
            edges.push(link)
        }
        return { nodes: found, edges }
    }
}

export default function SwapMultiForm() {
    const config = useConfig()
    const account = useAccount()
    const [tokenInAddress, setTokenInAddress] = useState("")
    const [tokenOutAddress, setTokenOutAddress] = useState("")
    const [amountIn, setAmountIn] = useState("")
    const [amountOut, setAmountOut] = useState("")
    interface SwapPathItem {
        address: string;
        tickSpacing: number;
    }
    const [swapPath, setSwapPath] = useState<SwapPathItem[]>([])
    const { writeContractAsync } = useWriteContract()

    // Define available pools
    const pools: Pool[] = useMemo(() => [
        {
            address: contractConfig.USDT_USDC_address,
            token0: contractConfig.usdtAddress,
            token1: contractConfig.usdcAddress,
            tickSpacing: 10
        },
        {
            address: contractConfig.WBTC_USDT_address,
            token0: contractConfig.wbtcAddress,
            token1: contractConfig.usdtAddress,
            tickSpacing: 60
        },
        {
            address: contractConfig.WETH_UNI_address,
            token0: contractConfig.wethAddress,
            token1: contractConfig.uniAddress,
            tickSpacing: 60
        },
        {
            address: contractConfig.WETH_USDC_address,
            token0: contractConfig.wethAddress,
            token1: contractConfig.usdcAddress,
            tickSpacing: 60
        },
        
    ], [])

    // Find optimal path when tokens change
    // Update the useEffect where path is found
    useEffect(() => {
        if (tokenInAddress && tokenOutAddress) {
            const pathFinder = new PathFinder(pools)
            const result = pathFinder.findPath(tokenOutAddress, tokenInAddress)
            if (result) {
                setSwapPath(result.nodes.map((node, index) => ({
                    address: String(node.id),
                    tickSpacing: index < result.edges.length ? result.edges[index]?.data?.pool?.tickSpacing ?? 0 : 0
                })))
            }
        }
    }, [tokenInAddress, tokenOutAddress, pools])

    // Token data fetching similar to SwapSingleForm
    const { data: tokenData, refetch: refetchTokenData } = useReadContracts({
        contracts: [
            {
                abi: contractConfig["ABIS"]["ERC20"]["abi"],
                address: tokenInAddress as `0x${string}`,
                functionName: "decimals",
            },
            {
                abi: contractConfig["ABIS"]["ERC20"]["abi"],
                address: tokenInAddress as `0x${string}`,
                functionName: "name",
            },
            {
                abi: contractConfig["ABIS"]["ERC20"]["abi"],
                address: tokenInAddress as `0x${string}`,
                functionName: "balanceOf",
                args: [account.address as `0x${string}`],
            },
        ],
    })

    const { data: tokenDataOut, refetch: refetchTokenOutData } = useReadContracts({
        contracts: [
            {
                abi: contractConfig["ABIS"]["ERC20"]["abi"],
                address: tokenOutAddress as `0x${string}`, // 这里会检查地址格式,0x开头且有42个字符
                functionName: "decimals", 
            },
            {
                abi: contractConfig["ABIS"]["ERC20"]["abi"],
                address: tokenOutAddress as `0x${string}`,
                functionName: "name",
            },
            {
                abi: contractConfig["ABIS"]["ERC20"]["abi"],
                address: tokenOutAddress as `0x${string}`,
                functionName: "balanceOf",
                args: [account.address as `0x${string}`],  // 用户填的账户
            },
        ],
    })

    // 读取报价数据
    type QuoteResult = [bigint, bigint[], number[]];
    const { data: quoteData, isError: quoteError, isLoading: quoteLoading, refetch: refetchQuoteData } = useReadContract({
        abi: contractConfig["ABIS"]["Quoter"]["abi"],
        address: contractConfig["quoterAddress"] as `0x${string}`,
        functionName: "quote",
        args: tokenInAddress && tokenOutAddress && amountIn && swapPath ? [
            ethers.concat(
                swapPath.reduce((acc: Uint8Array[], pathItem, i) => {
                    if (i < swapPath.length - 1) {
                        const addressBytes = ethers.getBytes(ethers.zeroPadValue(pathItem.address, 20));
                        const tickSpacingBytes = ethers.getBytes(ethers.zeroPadValue(ethers.toBeHex(pathItem.tickSpacing), 3));
                        return [...acc, addressBytes, tickSpacingBytes];
                    }
                    const lastAddressBytes = ethers.getBytes(ethers.zeroPadValue(pathItem.address, 20));
                    return [...acc, lastAddressBytes];
                }, [] as Uint8Array[])
            ),
            ethers.parseUnits(amountIn, tokenData?.[0]?.result as number || 18)
        ] : undefined,
        // 只有当所有必要的值都存在且amountIn是有效数字时才启用
        query: {
            enabled: Boolean(
                tokenInAddress && 
                tokenOutAddress && 
                amountIn && 
                !isNaN(Number(amountIn)) && 
                Number(amountIn) > 0
            )
        }
    })

    useEffect(() => {
        if (quoteData) {
            console.log("quoteData Changed:");
            console.log("- quoteData:", quoteData);
            const amountOutBigInt = (quoteData as QuoteResult)[0] as bigint;
            const decimals = tokenDataOut?.[0].result as number;
            // 使用 formatTokenBalance 工具函数来处理显示
            const formattedAmount = formatTokenBalance(amountOutBigInt, decimals);
            setAmountOut(formattedAmount);
        }
    }, [quoteData]);

    async function handleMultiSwap() {
        if (!swapPath.length) return
        console.log("swapPath: ", swapPath)

        try {
            // Construct the path bytes
            const pathBytes = ethers.concat(
                swapPath.reduce((acc: Uint8Array[], pathItem, i) => {
                    if (i < swapPath.length - 1) {
                        const addressBytes = ethers.getBytes(ethers.zeroPadValue(pathItem.address, 20));
                        const tickSpacingBytes = ethers.getBytes(ethers.zeroPadValue(ethers.toBeHex(pathItem.tickSpacing), 3));
                        return [...acc, addressBytes, tickSpacingBytes];
                    }
                    const lastAddressBytes = ethers.getBytes(ethers.zeroPadValue(pathItem.address, 20));
                    return [...acc, lastAddressBytes];
                }, [] as Uint8Array[])
            )

            const swapHash = await writeContractAsync({
                abi: contractConfig["ABIS"]["Manager"]["abi"],
                address: contractConfig["managerAddress"] as `0x${string}`,
                functionName: "swap",
                args: [{
                    path: pathBytes,
                    recipient: account.address as `0x${string}`,
                    amountIn: ethers.parseUnits(amountIn, tokenData?.[0]?.result as number || 18),
                    minAmountOut: BigInt(0)
                }],
            })

            console.log("Swap transaction hash:", swapHash)

            console.log("Waiting for swap confirmation...");
            const swapReceipt = await waitForTransactionReceipt(config, { hash: swapHash })
            console.log("Swap receipt:", swapReceipt);

            // 解析Swap事件，通过swap事件来得到结果
            const iface = new ethers.Interface(contractConfig["ABIS"]["Pool"]["abi"])
            const swapLogs = swapReceipt.logs
                .map(log => {
                    try {
                        return iface.parseLog({
                            topics: log.topics as string[],
                            data: log.data
                        })
                    } catch (e) {
                        return null
                    }
                })
                .filter(event => event?.name === 'Swap')
            console.log("swapLogs:", swapLogs)

            if (swapLogs.length > 0) {
                // Collect all swap events information
                const swapEvents = swapLogs.map((swapEvent, index) => {
                    if (!swapEvent) return null;
                    
                    const { amount0, amount1 } = swapEvent.args;
                    // 根据输出的正负值,负值是用户获取的token
                    const amountOut = amount0 < 0 ? amount0 : amount1;
                    
                    return {
                        hop: index + 1,
                        amount0: amount0.toString(),
                        amount1: amount1.toString(),
                        amountOut: formatTokenBalance(
                            BigInt(Math.abs(Number(amountOut))),
                            tokenDataOut?.[0]?.result as number
                        )
                    };
                }).filter(Boolean);
            
                // Create detailed message for toast
                const detailedMessage = swapEvents
                    .map(event => 
                        `Hop ${event?.hop}: ${event?.amountOut} tokens received\n` +
                        `(amount0: ${event?.amount0}, amount1: ${event?.amount1})`
                    )
                    .join('\n\n');
            
                // Show interactive toast
                toast.success(
                    detailedMessage,
                );
            }

            // 更新屏幕数据
            await refetchTokenOutData();
            await refetchTokenData();
            await refetchQuoteData();

        } catch (error) {
            console.error("Error in handleMultiSwap:", error)
            toast.error("Swap failed!")
        }
    }

    return (
        <div className="max-w-2xl min-w-full xl:min-w-lg w-full lg:mx-auto p-6 flex flex-col gap-6 bg-white rounded-xl border-2 border-blue-500">
            <Toaster />
            
            <div className="space-y-6">
                <TokenAmountInput
                    amount={amountIn}
                    onAmountChange={setAmountIn}
                    selectedToken={tokenInAddress}
                    onTokenSelect={setTokenInAddress}
                    tokenOptions={Object.entries(contractConfig.tokens).map(([address, details]) => ({
                        address,
                        symbol: details.symbol
                    }))}
                />

                <TokenAmountInput
                    amount={amountOut}
                    onAmountChange={setAmountOut}
                    selectedToken={tokenOutAddress}
                    onTokenSelect={setTokenOutAddress}
                    tokenOptions={Object.entries(contractConfig.tokens).map(([address, details]) => ({
                        address,
                        symbol: details.symbol
                    }))}
                />

                {/* Display swap path */}
                {swapPath.length > 0 && (
                    <div className="bg-white border border-zinc-300 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-zinc-900 mb-3">Swap Path</h3>
                        <div className="flex items-center gap-2">
                            {swapPath.map((address, index) => (
                                <div key={index} className="flex items-center">
                                    <span className="text-sm">
                                        {contractConfig.tokens[address.address as unknown as keyof typeof contractConfig.tokens]?.symbol || address.address.slice(0, 6)}
                                    </span>
                                    {index < swapPath.length - 1 && (
                                        <span className="mx-2">→</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white border border-zinc-300 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-zinc-900 mb-3">TokenIn Details</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-600">Token Name:</span>
                            <span className="font-mono text-zinc-900">
                                {tokenData?.[1]?.result as string}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-600">Decimals:</span>
                            <span className="font-mono text-zinc-900">
                                {tokenData?.[0]?.result as number}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-600">Balance:</span>
                            <span className="font-mono text-zinc-900">
                            {
                                formatTokenBalance(tokenData?.[2]?.result as bigint, tokenData?.[0]?.result as number)
                            }
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-zinc-300 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-zinc-900 mb-3">TokenOut Details</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-600">Token Name:</span>
                            <span className="font-mono text-zinc-900">
                                {tokenDataOut?.[1]?.result as string}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-600">Decimals:</span>
                            <span className="font-mono text-zinc-900">
                                {tokenDataOut?.[0]?.result as number}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-600">Balance:</span>
                            <span className="font-mono text-zinc-900">
                            {
                                formatTokenBalance(tokenDataOut?.[2]?.result as bigint, tokenDataOut?.[0]?.result as number)
                            }
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-zinc-300 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-zinc-900 mb-3">Swap Details</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-600">amountOut:</span>
                            <span className="font-mono text-zinc-900">
                            {quoteData ? formatTokenBalance((quoteData as QuoteResult)[0] as bigint, tokenDataOut?.[0]?.result as number) : '0'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-600">sqrtPriceX96AfterList:</span>
                            <span className="font-mono text-zinc-900">
                                {
                                    (quoteData as QuoteResult)?.[1]?.join(", ") || ""
                                }
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-600">Price:</span>
                            <span className="font-mono text-zinc-900">
                                {
                                    (quoteData as QuoteResult)?.[1]?.map(price => formatSqrtPriceX96ToPrice(price)).join(",") || ""
                                }
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-600">tickAfterList:</span>
                            <span className="font-mono text-zinc-900">
                            {
                                (quoteData as QuoteResult)?.[2]?.join(",") || ""
                            }
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none"
                    onClick={handleMultiSwap}
                    disabled={!swapPath.length}
                >
                    Multi-Hop Swap
                </button>
            </div>
        </div>
    )
}