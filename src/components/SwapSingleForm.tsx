"use client"

import { useState, useMemo, useEffect } from "react"
import { contractConfig } from "@/constants"
import { readContract, waitForTransactionReceipt } from '@wagmi/core'
import { useConfig, useAccount, useChainId, useWriteContract, useReadContracts, useWaitForTransactionReceipt, useReadContract } from "wagmi"
import { ethers } from 'ethers';
import InputForm from "@/components/ui/InputField"
import TokenAmountInput from "@/components/ui/TokenAmountInput"
import { formatTokenBalance } from "@/utils/utils" 
import { Toaster, toast } from 'react-hot-toast';


export default function SwapSingleForm() {
    const config = useConfig()  // rainbowkit中配置信息,page的RootLayout中已经包裹在外面了
    const account = useAccount()  // 当前连接的钱包的信息,page的RootLayout中已经包裹在外面了
    const chainId = useChainId()  // 当前连接的钱包的信息,page的RootLayout中已经包裹在外面了
    const [tokenInAddress, setTokenInAddress] = useState("")
    const [tokenOutAddress, setTokenOutAddress] = useState("")
    const [amountIn, setAmountIn] = useState("")
    const [amountOut, setAmountOut] = useState("")
    const { data: hash, isPending, error, writeContractAsync } = useWriteContract()  // 执行writeContractAsync时会触发isPending从false变为true，
    const { isLoading: isConfirming, isSuccess: isConfirmed, isError } = useWaitForTransactionReceipt({ 
        confirmations: 1,
        hash,
     })  // hash的状态会影响变量变化


    // 当 tokenAddress 发生变化时，hook 会自动重新获取数据 所有请求会并行执行 返回的 tokenData 是一个数组，包含所有请求的结果
    const { data: tokenData, refetch: refetchTokenData } = useReadContracts({
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
            const amountOutBigInt = (quoteData as QuoteResult)[0] as bigint;
            const decimals = tokenDataOut?.[0].result as number;
            // 使用 formatTokenBalance 工具函数来处理显示
            const formattedAmount = formatTokenBalance(amountOutBigInt, decimals);
            setAmountOut(formattedAmount);
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
                const swapEvent = swapLogs[0]
                if (!swapEvent) return

                const { amount0, amount1 } = swapEvent.args
                console.log("amount0:", amount0, "amount1:", amount1)

                // 根据输入token的地址判断使用amount0还是amount1
                const isToken0 = tokenInAddress.toLowerCase() < tokenOutAddress.toLowerCase()
                const amountOut = isToken0 ? amount1 : amount0
                // amountout应该一直是负的，因为amount0就是表示token0的变化，amount1表示token1的变化，正值表示向池子中加token，负值表示从池子中拿数据

                toast.success(
                    `Swap successful! ${formatTokenBalance(
                        BigInt(Math.abs(Number(amountOut))), 
                        tokenDataOut?.[0]?.result as number
                    )} tokens received, amount0 ${amount0} amount1 ${amount1}`
                )
            }

            // 更新屏幕数据
            await refetchTokenOutData();
            await refetchTokenData();
            await refetchQuoteData();

        } catch (error) {
            console.error("Error in handleSwap:", error)
        }
    }

    

    return (
        <div className="max-w-2xl min-w-full xl:min-w-lg w-full lg:mx-auto p-6 flex flex-col gap-6 bg-white rounded-xl ring-[4px] border-2 border-blue-500 ring-blue-500/25">
            <Toaster />
            <div className="space-y-6">
                <TokenAmountInput
                    amount={amountIn}
                    onAmountChange={setAmountIn}
                    selectedToken={tokenInAddress}
                    onTokenSelect={setTokenInAddress}
                    tokenOptions={tokenOptions}
                />

                <TokenAmountInput
                    amount={amountOut}
                    onAmountChange={setAmountOut}
                    selectedToken={tokenOutAddress}
                    onTokenSelect={setTokenOutAddress}
                    tokenOptions={tokenOptions}
                />
                

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