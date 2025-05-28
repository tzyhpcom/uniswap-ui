"use client"

import { useState, useMemo, useEffect } from "react"
import { contractConfig } from "@/constants"
import { readContract, waitForTransactionReceipt } from '@wagmi/core'
import { useConfig, useAccount, useChainId, useWriteContract, useReadContracts, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { ethers } from 'ethers';
import InputForm from "@/components/ui/InputField"
import { formatTokenBalance } from "@/utils/utils" 


export default function SwapSingleForm() {
    const config = useConfig()  // rainbowkit中配置信息,page的RootLayout中已经包裹在外面了
    const account = useAccount()  // 当前连接的钱包的信息,page的RootLayout中已经包裹在外面了
    const chainId = useChainId()  // 当前连接的钱包的信息,page的RootLayout中已经包裹在外面了
    const [tokenInAddress, setTokenInAddress] = useState("")
    const [tokenOutAddress, setTokenOutAddress] = useState("")
    const [amountIn, setAmountIn] = useState("")
    const { data: hash, isPending, error, writeContractAsync } = useWriteContract()  // 执行writeContractAsync时会触发isPending从false变为true，
    const { isLoading: isConfirming, isSuccess: isConfirmed, isError } = useWaitForTransactionReceipt({ 
        confirmations: 1,
        hash,
     })  // hash的状态会影响变量变化


    // 当 tokenAddress 发生变化时，hook 会自动重新获取数据 所有请求会并行执行 返回的 tokenData 是一个数组，包含所有请求的结果
    const { data: tokenData } = useReadContracts({
        contracts: [
            {
                abi: contractConfig["ABIS"]["ERC20"]["abi"],
                address: tokenInAddress as `0x${string}`, // 这里会检查地址格式,0x开头且有42个字符
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
                args: [account.address as `0x${string}`],  // 用户填的账户
            },
        ],
    })

    // 添加这段代码来监听 tokenData
    useEffect(() => {
        if (tokenData) {
            const [decimals, name, balance] = tokenData;
            console.log("Token Data Changed:");
            console.log("- Decimals:", decimals);
            console.log("- Name:", name);
            console.log("- Balance:", balance);
        }
    }, [tokenData]);

    const { data: tokenDataOut } = useReadContracts({
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
    const { data: quoteData, isError: quoteError, isLoading: quoteLoading } = useReadContract({
        abi: contractConfig["ABIS"]["Quoter"]["abi"],
        address: contractConfig["quoterAddress"] as `0x${string}`,
        functionName: "quote",
        args: tokenInAddress && tokenOutAddress && amountIn ? [
            ethers.concat([
                ethers.zeroPadValue(tokenInAddress, 20),
                ethers.zeroPadValue(ethers.toBeHex(60), 3),
                ethers.zeroPadValue(tokenOutAddress, 20)
            ]),
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
            
        }
    }, [quoteData]);

    const tokenOptions = useMemo(() => {
        return Object.entries(contractConfig.tokens).map(([address, details]) => ({
            address,
            symbol: details.symbol
        }))
    }, [])

    const handleTokenInSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTokenInAddress(e.target.value)
    }

    const handleTokenOutSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTokenOutAddress(e.target.value)
    }

    async function handleSwap(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
        console.log("swap begin")

        try {
            // Properly encode the path using ethers utils
            const path = ethers.concat([
                // Token In address - encode as bytes20
                ethers.zeroPadValue(tokenInAddress, 20),
                // Fee amount - encode as bytes3
                ethers.zeroPadValue(ethers.toBeHex(60), 3),
                // Token Out address - encode as bytes20
                ethers.zeroPadValue(tokenOutAddress, 20)
            ])

            const swapHash = await writeContractAsync({
                abi: contractConfig["ABIS"]["Manager"]["abi"],
                address: contractConfig["managerAddress"] as `0x${string}`,
                functionName: "swap",
                args: [{
                    path: path, // Already constructed above using ethers.concat
                    recipient: account.address as `0x${string}`, // Need to get this from useAccount hook
                    amountIn: ethers.parseUnits(amountIn, tokenData?.[0]?.result as number || 18), // Convert amount to proper decimals
                    minAmountOut: BigInt(0) // Set minimum amount out (for simplicity set to 0, but in production should calculate slippage)
                }],
            })

            console.log("Swap transaction hash:", swapHash)

            console.log("Waiting for swap confirmation...");
            const swapReceipt = await waitForTransactionReceipt(config, { hash: swapHash })
            console.log("Swap receipt:", swapReceipt);

        } catch (error) {
            console.error("Error in handleSwap:", error)
        }
    }

    

    return (
        <div className="max-w-2xl min-w-full xl:min-w-lg w-full lg:mx-auto p-6 flex flex-col gap-6 bg-white rounded-xl ring-[4px] border-2 border-blue-500 ring-blue-500/25">
            <div className="space-y-6">
                {/* Token Input Section */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-zinc-700">Select Token In</label>
                        <select 
                            className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onChange={handleTokenInSelect}
                            value={tokenInAddress}
                        >
                            <option value="">Select a token</option>
                            {tokenOptions.map((token) => (
                                <option key={token.address} value={token.address}>
                                    {token.symbol}
                                </option>
                            ))}
                        </select>
                    </div>
                    <InputForm 
                        label="Amount"
                        placeholder="0.0"
                        value={amountIn}
                        onChange={e => setAmountIn(e.target.value)}
                        large={false}
                    />
                </div>

                {/* Token Output Section */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-700">Select Token Out</label>
                    <select 
                        className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onChange={handleTokenOutSelect}
                        value={tokenOutAddress}
                    >
                        <option value="">Select a token</option>
                        {tokenOptions.map((token) => (
                            <option key={token.address} value={token.address}>
                                {token.symbol}
                            </option>
                        ))}
                    </select>
                </div>

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
                                {(quoteData as QuoteResult)?.[1]}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-600">tickAfterList:</span>
                            <span className="font-mono text-zinc-900">
                            {
                                (quoteData as QuoteResult)?.[2]
                            }
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={handleSwap}
                >
                    Swap
                </button>
            </div>
        </div>
    )
}