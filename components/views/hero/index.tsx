import Hero from "@/components/views/hero/hero";
import BrandSlider, { BrandList } from "@/components/views/hero/brand-slider";

export default function AgencyHero() {
  const avatarList = [
    { image: "/anglo.png", alt: "Anglo-Saxon" },
    { image: "/viking.png", alt: "Viking" },
    { image: "/caucasian.png", alt: "Caucasian" },
    { image: "/arab.png", alt: "Medieval Arab" },
  ];




  return (
    <div className="relative h-full">
      <section className="h-full flex flex-col justify-center pb-20">
        <Hero avatarList={avatarList} />
      </section>
    </div>
  );
}
