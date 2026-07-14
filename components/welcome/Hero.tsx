"use client";

import Link from "next/link";
import FloatingBadge from "./FloatingBadge";
import BackgroundGlow from "./BackgroundGlow";

export default function Hero() {
  return (
    <section className="relative flex isolate overflow-hidden pt-36 pb-28 lg:min-h-screen">
      {/* Background */}
      <BackgroundGlow />

      <div style={{ justifyContent: "center" }} className="relative mx-auto flex max-w-7xl flex-col items-center px-6">

        {/* Badge */}

        <FloatingBadge />

        {/* Heading */}

        <div className="mt-10 max-w-5xl text-center">

          <h1 className="text-5xl font-black leading-[0.95] tracking-tight text-slate-900 sm:text-6xl md:text-7xl xl:text-[5.4rem]">

            Deploy Smart Contracts

            <br />

            Without Complexity on{" "}

            <span className="bg-gradient-to-r from-[#0052FF] via-[#3B82F6] to-[#60A5FA] bg-clip-text text-transparent">
              Base.
            </span>

          </h1>

          <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-slate-600 md:text-xl">
            Deploy B20, ERC20, ERC721A, and ERC1155 contracts on Base from one simple platform.
          </p>

        </div>

        {/* Buttons */}

        <div className="mt-12 flex flex-col gap-4 sm:flex-row">

          <Link
            href="/dashboard"
            className="rounded-full bg-[#0052FF] px-8 py-4 text-base font-semibold text-white shadow-[0_18px_45px_rgba(0,82,255,.30)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#1B67FF]"
          >
            Launch App
          </Link>

          <a
            href="https://docs.base.org/get-started/base"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-blue-100 bg-white/80 px-8 py-4 text-base font-semibold text-slate-800 backdrop-blur-xl transition-all duration-300 hover:border-blue-200 hover:bg-white"
          >
            Explore Base docs
          </a>

        </div>

      </div>
    </section>
  );
}