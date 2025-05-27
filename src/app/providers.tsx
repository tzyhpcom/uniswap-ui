"use client"

import { type ReactNode } from "react"
import { WagmiProvider } from "wagmi"
import { RainbowKitProvider, ConnectButton } from "@rainbow-me/rainbowkit"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import "@rainbow-me/rainbowkit/styles.css"
import config from "@/rainbowKitConfig"  // 引用根目录内文件



export function Providers(props: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient())

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>
                    {/* <ConnectButton /> */}
                    {/* 所有网站代码在这里 */}
                    {props.children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}