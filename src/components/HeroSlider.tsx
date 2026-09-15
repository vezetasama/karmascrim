'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Trophy, Flame, ArrowRight, Shield, Sparkles } from 'lucide-react';

export interface BannerItem {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  buttonText?: string | null;
  buttonLink?: string | null;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
}

interface HeroSliderProps {
  banners?: BannerItem[];
}

// Fallback banner if DB has no active banners
const DEFAULT_FALLBACK_BANNER: BannerItem = {
  id: 'default-fallback',
  title: "NEPAL'S ULTIMATE FREE FIRE SCRIMS",
  subtitle: 'Compete in Daily Full Map & Clash Squad Scrims. Battle for Glory & Cash Prizes!',
  buttonText: 'JOIN SCRIMS NOW',
  buttonLink: '/tournaments',
  imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&q=80',
  isActive: true,
  sortOrder: 1,
};

export default function HeroSlider({ banners = [] }: HeroSliderProps) {
  const activeBanners = banners.filter((b) => b.isActive);
  const displayBanners = activeBanners.length > 0 ? activeBanners : [DEFAULT_FALLBACK_BANNER];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const hasMultiple = displayBanners.length > 1;
  const currentBanner = displayBanners[currentIndex] || displayBanners[0];

  // Auto slider effect if multiple banners exist
  useEffect(() => {
    if (!hasMultiple || isHovered) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayBanners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [hasMultiple, isHovered, displayBanners.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + displayBanners.length) % displayBanners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % displayBanners.length);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !hasMultiple) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diffX) > 40) {
      if (diffX > 0) handleNext();
      else handlePrev();
    }
    touchStartX.current = null;
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6 mb-4 sm:mb-6">
      <div
        className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#121722] border border-[#262F45]/80 shadow-2xl group transition-all duration-300"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Banner Image Container with Aspect Ratio */}
        <div className="relative w-full h-[220px] xs:h-[260px] sm:h-[340px] md:h-[400px] lg:h-[440px] overflow-hidden">
          
          {/* Subtle Skeleton Loader */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-[#161d2d] animate-pulse flex items-center justify-center">
              <Trophy className="w-10 h-10 text-gray-700 animate-bounce" />
            </div>
          )}

          {/* Render Active Single Image */}
          <div
            key={currentBanner.id}
            className="absolute inset-0 transition-opacity duration-500 ease-in-out"
          >
            <img
              src={currentBanner.imageUrl}
              alt={currentBanner.title || 'Karma Scrims Banner'}
              onLoad={() => setImageLoaded(true)}
              className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />

            {/* Dark Esports Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-[#0B0E14]/60 to-transparent sm:bg-gradient-to-r sm:from-[#0B0E14] sm:via-[#0B0E14]/75 sm:to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#FF2E4C]/10 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* CONTROLS (Only visible if MULTIPLE active banners exist) */}
          {hasMultiple && (
            <>
              {/* Prev Button */}
              <button
                onClick={handlePrev}
                aria-label="Previous Banner"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#0B0E14]/70 border border-[#262F45] text-white hover:bg-[#FF2E4C] hover:border-[#FF2E4C] flex items-center justify-center transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 z-20 shadow-lg backdrop-blur-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Next Button */}
              <button
                onClick={handleNext}
                aria-label="Next Banner"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#0B0E14]/70 border border-[#262F45] text-white hover:bg-[#FF2E4C] hover:border-[#FF2E4C] flex items-center justify-center transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 z-20 shadow-lg backdrop-blur-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Indicator Dots */}
              <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 px-3 py-1.5 rounded-full bg-[#0B0E14]/60 backdrop-blur-md border border-[#262F45]/60">
                {displayBanners.map((banner, index) => (
                  <button
                    key={banner.id}
                    onClick={() => setCurrentIndex(index)}
                    aria-label={`Go to slide ${index + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentIndex
                        ? 'w-6 bg-[#FF2E4C]'
                        : 'w-2 bg-gray-500/60 hover:bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
