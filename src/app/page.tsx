import Image from "next/image";
import { contractConfig } from "@/constants"

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        I am main.
        {JSON.stringify(contractConfig['ABIS']['ERC20'], null, 2)}
        </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        I am footer.
      </footer>
    </div>
  );
}
