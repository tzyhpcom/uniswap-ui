"use client"

import { useState } from 'react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

interface TokenAmountInputProps {
    amount: string
    onAmountChange: (value: string) => void
    selectedToken: string
    onTokenSelect: (value: string) => void
    tokenOptions: Array<{ address: string; symbol: string }>
}

export default function TokenAmountInput({ 
    amount, 
    onAmountChange, 
    selectedToken, 
    onTokenSelect, 
    tokenOptions 
}: TokenAmountInputProps) {
    return (
        <div className="relative w-full">
            <div className="flex items-center p-4 bg-white border border-zinc-300 rounded-lg">
                {/* Amount Input */}
                <input
                    type="number"
                    className="w-full text-2xl font-medium bg-transparent outline-none"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => onAmountChange(e.target.value)}
                />
                
                {/* Token Select */}
                <div className="relative">
                    <select
                        value={selectedToken}
                        onChange={(e) => onTokenSelect(e.target.value)}
                        className="appearance-none flex items-center gap-2 px-3 py-2 ml-2 bg-zinc-100 rounded-2xl hover:bg-zinc-200 pr-8 cursor-pointer"
                    >
                        <option value="">Select Token</option>
                        {tokenOptions.map((token) => (
                            <option key={token.address} value={token.address}>
                                {token.symbol}
                            </option>
                        ))}
                    </select>
                    <ChevronDownIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-600 pointer-events-none" />
                </div>
            </div>
        </div>
    )
}