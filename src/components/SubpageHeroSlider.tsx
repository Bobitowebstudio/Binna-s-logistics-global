import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SubpageHeroSliderProps {
  title: string;
  subtitle: string;
}

export default function SubpageHeroSlider({ title, subtitle }: SubpageHeroSliderProps) {
  const images = [
    {
      url: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1600&q=80",
      caption: "Bilateral Shipping Excellence"
    },
    {
      url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=80",
      caption: "Secure Warehouse Sorting"
    },
    {
      url: "https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?auto=format&fit=crop&w=1600&q=80",
      caption: "Air Cargo & Door Delivery"
    },
    {
      url: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1600&q=80",
      caption: "Guangzhou Direct Loading"
    }
  ];

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="relative w-full h-[320px] bg-slate-900 overflow-hidden" id="subpage-hero-slider">
      {/* Background Images Slider */}
      {images.map((image, index) => {
        const isActive = index === activeIndex;
        return (
          <div
            key={index}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              isActive ? "opacity-100 scale-100 z-10" : "opacity-0 scale-105 pointer-events-none z-0"
            }`}
          >
            {/* Overlay gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-transparent z-1" />
            <img
              src={image.url}
              alt={image.caption}
              className="w-full h-full object-cover"
            />
          </div>
        );
      })}

      {/* Slide Content Overlay */}
      <div className="absolute inset-0 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-3xl text-left space-y-4">
          <span className="inline-flex items-center gap-1.5 bg-red-600/90 text-white font-extrabold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full shadow-md animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            Binna's Logistics Global
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight text-white drop-shadow-sm">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 max-w-xl font-medium leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Manual Controls */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-all cursor-pointer focus:outline-none"
        aria-label="Previous Slide"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-all cursor-pointer focus:outline-none"
        aria-label="Next Slide"
      >
        <ChevronRight size={20} />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-1.5">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === activeIndex ? "bg-red-600 w-4" : "bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
