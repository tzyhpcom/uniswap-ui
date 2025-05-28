"use client"

import InputForm from "@/components/ui/InputField"
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
    const [tokenAddress, setTokenAddress] = useState("")
    const [accountAddress, setAccountAddress] = useState("")

     // 当 tokenAddress 发生变化时，hook 会自动重新获取数据 所有请求会并行执行 返回的 tokenData 是一个数组，包含所有请求的结果
     const { data: tokenData } = useReadContracts({
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

    return (
        <>
            <Toaster />

            <div
                className="max-w-2xl min-w-full xl:min-w-lg w-full lg:mx-auto p-6 flex flex-col gap-6 bg-white rounded-xl ring-[4px] border-2  border-blue-500 ring-blue-500/25"
            >
                <div className="space-y-6">

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-700">Select Token</label>
                        <select 
                            className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            onChange={handleTokenSelect}
                            value={tokenAddress}
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

                    
                </div>
            </div>
        </>
    )
}