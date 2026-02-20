import Hero from "@/components/views/hero/hero";

export default function HeroWrapper({ v2 }: { v2?: boolean }) {
  return (
    <div className="relative h-full">
      <section className="h-full flex flex-col justify-center pb-20">
        <Hero v2={v2} />
      </section>
    </div>
  );
}
