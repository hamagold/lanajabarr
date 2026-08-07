import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { CalendarDays, KanbanSquare, LayoutDashboard } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const SLIDES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: LayoutDashboard,
    title: "Your dashboard",
    description: "See every job, revenue, and what needs attention at a glance.",
  },
  {
    icon: KanbanSquare,
    title: "Booking stages",
    description: "Move shoots from booking to shooting, editing, delivery, and paid.",
  },
  {
    icon: CalendarDays,
    title: "Calendar view",
    description: "Tap any date to see what’s booked and open the details instantly.",
  },
];

export function OnboardingTour({ theme = "light" }: { theme?: "light" | "dark" }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi]
  );

  const isDark = theme === "dark";

  return (
    <div className="w-full">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {SLIDES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex-[0_0_80%] min-w-0 pl-3 pr-3">
              <div
                className={`flex flex-col items-center rounded-2xl border px-5 py-7 text-center backdrop-blur-md ${
                  isDark
                    ? "border-white/20 bg-white/15 text-white shadow-lg"
                    : "surface bg-card"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    isDark ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  }`}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h3
                  className={`mt-4 font-sans text-lg font-medium ${
                    isDark ? "text-white" : "text-foreground"
                  }`}
                >
                  {title}
                </h3>
                <p
                  className={`mt-2 text-[13px] leading-relaxed ${
                    isDark ? "text-white/80" : "text-muted-foreground"
                  }`}
                >
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-2">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === selectedIndex
                ? isDark
                  ? "w-5 bg-white"
                  : "w-5 bg-primary"
                : isDark
                  ? "w-1.5 bg-white/40"
                  : "w-1.5 bg-muted-foreground/30"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
