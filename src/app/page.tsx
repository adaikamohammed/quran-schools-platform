import Navbar from "@/components/public/Navbar";
import HeroSection from "@/components/public/HeroSection";
import FeaturesSection from "@/components/public/FeaturesSection";
import SchoolsSection from "@/components/public/SchoolsSection";
import HowItWorksSection from "@/components/public/HowItWorksSection";
import Footer from "@/components/public/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <SchoolsSection />
        <HowItWorksSection />
      </main>
      <Footer />
    </div>
  );
}
