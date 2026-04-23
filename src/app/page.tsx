import Navbar from "@/components/public/Navbar";
import HeroSection from "@/components/public/HeroSection";
import WaqfSection from "@/components/public/WaqfSection";
import FeaturesSection from "@/components/public/FeaturesSection";
import HowItWorksSection from "@/components/public/HowItWorksSection";
import Footer from "@/components/public/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <WaqfSection />
        <FeaturesSection />
        <HowItWorksSection />
      </main>
      <Footer />
    </div>
  );
}
