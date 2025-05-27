"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import { FaGithub } from "react-icons/fa"
import Image from "next/image"

export default function Header() {
    return (
        <nav className="px-8 py-4.5 border-b-[1px] border-zinc-100 flex flex-row justify-between items-center bg-white xl:min-h-[77px]">

            <div className="flex items-center gap-2.5 md:gap-6">

                <a href="/" className="flex items-center gap-1 text-zinc-800">
                    <Image src="/globe.svg" alt="TSender" width={36} height={36} />
                    <h1 className="font-bold text-2xl hidden md:block">UniswapV3</h1>
                </a>
                
            </div>

            <h3>
            UniswapV3 swap 🐎
            </h3>

            <div>
                <ConnectButton />
            </div>

        </nav>
    )
}