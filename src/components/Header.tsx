"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import { FaGithub } from "react-icons/fa"
import Image from "next/image"
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'
import { Fragment } from 'react'

const navigation = [
    { name: 'Swap Single', href: '/swap-single' },
    { name: 'Pools', href: '/pools' },
    // 后续可以添加更多路由
    { name: 'Swap Multi', href: '/swap-multi' },
    // { name: 'Liquidity', href: '/liquidity' },
  ]

export default function Header() {
    return (
    <nav className="px-8 py-4.5 border-b-[1px] border-zinc-100 flex flex-row justify-between items-center bg-white xl:min-h-[77px]">
        <div className="flex items-center gap-2.5 md:gap-6">
            <a href="/" className="flex items-center gap-1 text-zinc-800">
                <Image src="/globe.svg" alt="TSender" width={36} height={36} />
                <h1 className="font-bold text-2xl hidden md:block">UniswapV3</h1>
            </a>
        </div>

        <Menu as="div" className="relative inline-block text-left">
            <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                UniswapV3 Features
                <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
            </Menu.Button>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                        {navigation.map((item) => (
                            <Menu.Item key={item.name}>
                                {({ active }) => (
                                    <Link
                                        href={item.href}
                                        className={`
                                            ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}
                                            block px-4 py-2 text-sm
                                        `}
                                    >
                                        {item.name}
                                    </Link>
                                )}
                            </Menu.Item>
                        ))}
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>

        <div>
            <ConnectButton />
        </div>
    </nav>
    )
}