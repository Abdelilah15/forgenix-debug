import B20Card from "./B20Card";
import ERC20Card from "./ERC20Card";
import NFTCard from "./NFTCard";

export default function FeatureCards() {
  return (
    <section
      id="builders"
      className="relative flex h-[100vh] items-center bg-[#F9F9F9] py-28"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col px-6 lg:px-10">
        {/* Section Heading */}
        <div className="mx-auto mb-24 max-w-4xl text-center">
          <span  className="inline-flex items-center rounded-full border border-[#4F7CFF]/20 bg-[#4F7CFF]/10 px-5 py-2 text-sm font-semibold tracking-wide text-[#4F7CFF]">
            BE ACTIVE ON BASE³
          </span>

          <h2 className="mt-8 text-4xl font-bold leading-tight tracking-tight text-[#111111] md:text-6xl">
            Deploy Token & NFT
            <br />
            Contracts on{" "}
            <span className="text-[#4F7CFF]">Base</span>
          </h2>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-zinc-600">
            Launch native B20 assets, ERC20 tokens and NFT collections
            through one deployment platform.
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-8 lg:grid-cols-3">
          <B20Card />
          <ERC20Card />
          <NFTCard />
        </div>
      </div>
    </section>
  );
}