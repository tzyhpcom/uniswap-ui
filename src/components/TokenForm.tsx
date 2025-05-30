"use client"

import InputForm from "@/components/ui/InputField"
import TokenAmountInput from "./ui/TokenAmountInput"
import { useState, useMemo, useEffect } from "react"
import { readContract, waitForTransactionReceipt } from '@wagmi/core'
import { useConfig, useAccount, useChainId, useWriteContract, useReadContracts, useWaitForTransactionReceipt } from "wagmi"
import { BiLeftIndent } from "react-icons/bi"
import { CgSpinner } from "react-icons/cg"
import { RiAlertFill, RiInformationLine } from "react-icons/ri"
import { write } from "fs"
import { formatEther } from "viem"
import { Toaster, toast } from 'react-hot-toast';
import { contractConfig } from "@/constants"
import { ethers } from "ethers"
import { formatTokenBalance } from "@/utils/utils" 

const formatBalance = (balance: bigint | undefined, decimals: number | undefined): string => {
    if (!balance || !decimals) return '0';
    try {
        const balanceStr = balance.toString();
        const balanceLength = balanceStr.length;
        
        if (balanceLength <= decimals) {
            const zeros = '0'.repeat(decimals - balanceLength);
            return `0.${zeros}${balanceStr}`.slice(0, 8);
        } else {
            const integerPart = balanceStr.slice(0, balanceLength - decimals);
            const decimalPart = balanceStr.slice(balanceLength - decimals);
            return `${integerPart}.${decimalPart}`.slice(0, 8);
        }
    } catch (error) {
        return '0';
    }
};


export default function TokenForm() {
    const config = useConfig()  // rainbowkit中配置信息,page的RootLayout中已经包裹在外面了
    const account = useAccount()  // 当前连接的钱包的信息,page的RootLayout中已经包裹在外面了
    const chainId = useChainId()  // 当前连接的钱包的信息,page的RootLayout中已经包裹在外面了
    const [tokenAddress, setTokenAddress] = useState("")
    const [accountAddress, setAccountAddress] = useState("")
    const [amount, setAmount] = useState("")
    const { data: hash, isPending, error, writeContractAsync } = useWriteContract()  // 执行writeContractAsync时会触发isPending从false变为true，
    const { isLoading: isConfirming, isSuccess: isConfirmed, isError } = useWaitForTransactionReceipt({ 
        confirmations: 1,
        hash,
        })  // hash的状态会影响变量变化

     // 当 tokenAddress 发生变化时，hook 会自动重新获取数据 所有请求会并行执行 返回的 tokenData 是一个数组，包含所有请求的结果
     const { data: tokenData, refetch: refetchTokenData  } = useReadContracts({
        contracts: [
            {
                abi: contractConfig["ABIS"]["ERC20"]["abi"],
                address: tokenAddress as `0x${string}`, // 这里会检查地址格式,0x开头且有42个字符
                functionName: "decimals", 
            },
            {
                abi: contractConfig["ABIS"]["ERC20"]["abi"],
                address: tokenAddress as `0x${string}`,
                functionName: "name",
            },
            {
                abi: contractConfig["ABIS"]["ERC20"]["abi"],
                address: tokenAddress as `0x${string}`,
                functionName: "balanceOf",
                args: [accountAddress],  // 用户填的账户
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

    // Add token options from constants
    const tokenOptions = useMemo(() => {
        return Object.entries(contractConfig.tokens).map(([address, details]) => ({
            address,
            symbol: details.symbol
        }))
    }, [])

    // Handle token selection
    const handleTokenSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTokenAddress(e.target.value)
    }

    async function handleMintToken(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
        try {
            const swapHash = await writeContractAsync({
                abi: contractConfig["ABIS"]["ERC20"]["abi"],
                address: tokenAddress as `0x${string}`,
                functionName: "mint",
                args: [accountAddress, ethers.parseUnits(amount, tokenData?.[0]?.result as number || 18)],
            })

            console.log("Mint Token transaction hash:", swapHash)

            console.log("Waiting for mint confirmation...");
            const receipt = await waitForTransactionReceipt(config, { hash: swapHash })
            console.log("Swap receipt:", receipt);
            // 在交易确认后重新获取 token 数据 即重新执行usereadcontracts
            await refetchTokenData()
            toast.success('Token minted and data refreshed successfully!')


        } catch (error) {
            console.error("Error in handleMintToken:", error)
            toast.error('Failed to mint token')

        }
    }

    return (
        <>
            <Toaster />

            <div
                className="max-w-2xl min-w-full xl:min-w-lg w-full lg:mx-auto p-6 flex flex-col gap-6 bg-white rounded-xl ring-[4px] border-2  border-blue-500 ring-blue-500/25"
            >
                <div className="space-y-6">
                    <TokenAmountInput
                        amount={amount}
                        onAmountChange={setAmount}
                        selectedToken={tokenAddress}
                        onTokenSelect={setTokenAddress}
                        tokenOptions={tokenOptions}
                    />

                    <InputForm 
                        label="Token Address"
                        placeholder="0x"
                        value={tokenAddress}
                        onChange={e => setTokenAddress(e.target.value)}
                        large={false}
                    />
                    <InputForm 
                        label="Account Address"
                        placeholder="0x123"
                        value={accountAddress}
                        onChange={e => setAccountAddress(e.target.value)}
                        large={false}
                    />

                    <div className="bg-white border border-zinc-300 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-zinc-900 mb-3">Token Details</h3>
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
                                { formatTokenBalance(
                                    tokenData?.[2]?.result as bigint, 
                                    Number(tokenData?.[0]?.result)
                                )}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        onClick={handleMintToken}
                    >
                        Mint
                    </button>

                    
                </div>
            </div>
        </>
    )
}