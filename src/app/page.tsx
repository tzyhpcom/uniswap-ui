"use client"

import dynamic from "next/dynamic";

// 组件会在服务器端尝试渲染,防止 HomeContent 中包含 window、ethereum 等浏览器相关对象导致产生报错
const HomeContent = dynamic(() => import("@/components/HomeContent"), {
  ssr: false,
  loading: () => <div>Loading Web3 Components...</div>
})

export default function Home() {
  return <HomeContent />;
}
