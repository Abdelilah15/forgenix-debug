import BackgroundGlow from "@/components/welcome/BackgroundGlow";
import Navbar from "@/components/welcome/Navbar";
import Hero from "@/components/welcome/Hero";
import FeatureCards from "../components/welcome/cards/FeatureCards";
import Footer from "@/components/welcome/Footer";

export default function HomePage() {
  return (
    <main className="relative overflow-x-hidden bg-[#111111] text-white ">
      <BackgroundGlow />

      <Navbar />

      <Hero />

      <FeatureCards />

      <Footer />
    </main>
  );
}