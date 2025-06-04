import PoolList from "@/components/PoolList"

export default function PoolsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24"> {/* 移除 justify-between */}
      <div className="z-10 w-full items-center font-mono text-sm"> {/* 移除 justify-between */}
        <h1 className="text-4xl font-bold text-center mb-8">Pools List</h1>
        <PoolList />
      </div>
    </main>
  )
}