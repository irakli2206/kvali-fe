import Hero from "@/components/views/hero/hero";
import BrandSlider, { BrandList } from "@/components/views/hero/brand-slider";

export default function AgencyHero() {
  const avatarList = [
    { image: "/anglo.png", alt: "Anglo-Saxon" },
    { image: "/viking.png", alt: "Viking" },
    { image: "/caucasian.png", alt: "Caucasian" },
    { image: "/arab.png", alt: "Medieval Arab" },
  ];



  const brandList: BrandList[] = [
    {
      image: "https://images.shadcnspace.com/assets/brand-logo/logoipsum-1.svg",
      lightimg: "https://images.shadcnspace.com/assets/brand-logo/logoipsum-light-1.svg",
      name: "Brand 1",
    },
    {
      image: "https://images.shadcnspace.com/assets/brand-logo/logoipsum-2.svg",
      lightimg: "https://images.shadcnspace.com/assets/brand-logo/logoipsum-light-2.svg",
      name: "Brand 2",
    },
    {
      image: "https://images.shadcnspace.com/assets/brand-logo/logoipsum-3.svg",
      lightimg: "https://images.shadcnspace.com/assets/brand-logo/logoipsum-light-3.svg",
      name: "Brand 3",
    },
    {
      image: "https://images.shadcnspace.com/assets/brand-logo/logoipsum-4.svg",
      lightimg: "https://images.shadcnspace.com/assets/brand-logo/logoipsum-light-4.svg",
      name: "Brand 4",
    },
    {
      image: "https://images.shadcnspace.com/assets/brand-logo/logoipsum-5.svg",
      lightimg: "https://images.shadcnspace.com/assets/brand-logo/logoipsum-light-5.svg",
      name: "Brand 5",
    },
  ];

  return (
    <div className="relative h-full">
      <section className="h-full flex flex-col justify-center pb-20">
        <Hero avatarList={avatarList} />
        {/* <BrandSlider brandList={brandList} /> */}
      </section>
    </div>
  );
}
