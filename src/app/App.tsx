import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { PhishingQuiz } from "./components/PhishingQuiz";
import { ForensicsLab } from "./components/ForensicsLab";
import { FieldManual } from "./components/FieldManual";
import { ScanBay } from "./components/ScanBay";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <div
      style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        backgroundColor: "#10192B",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      <Navbar />
      <HeroSection />
      <PhishingQuiz />
      <ForensicsLab />
      <FieldManual />
      <ScanBay />
      <Footer />
    </div>
  );
}
