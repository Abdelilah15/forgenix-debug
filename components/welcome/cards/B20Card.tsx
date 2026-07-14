import B20Illustration from "./illustrations/B20Illustration";
import { ArrowUpRight } from "lucide-react";

export default function B20Card() {
  return (
    <article
      className="
        group
        relative
        flex
        h-[700px]
        flex-col
        overflow-hidden
        rounded-[32px]
        border
        border-white/10
        bg-[#18181B]
        transition-all
        duration-500
        hover:-translate-y-2
        hover:border-[#4F7CFF]/40
        hover:shadow-[0_0_80px_rgba(79,124,255,.15)]
      "
    >
      {/* Background Glow */}
      <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-[#4F7CFF]/10 blur-3xl" />
      </div>

      {/* Illustration */}
      <div className="relative flex h-[430px] items-center justify-center border-b border-white/5 bg-gradient-to-b from-[#202437] to-[#18181B]">
        <B20Illustration />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-10">
        <div>
          <span className="inline-flex rounded-full border border-[#4F7CFF]/20 bg-[#4F7CFF]/10 px-4 py-1 text-xs font-medium text-[#7FA5FF]">
            Base Native
          </span>

          <h3 className="mt-6 text-3xl font-bold tracking-tight text-white">
            B20 Asset & Stablecoin
          </h3>

          <p className="mt-5 text-[16px] leading-8 text-gray-400">
            Deploy native Base assets and stablecoins simply and securely.
          </p>
        </div>

        <button
          className="
            mt-10
            inline-flex
            w-fit
            items-center
            gap-2
            rounded-full
            bg-[#4F7CFF]
            px-6
            py-3
            text-sm
            font-semibold
            text-white
            transition-all
            duration-300
            hover:bg-[#5B88FF]
          "
        >
          Deploy B20
          <ArrowUpRight size={18} />
        </button>
      </div>
    </article>
  );
}