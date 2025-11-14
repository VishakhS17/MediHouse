'use client'

import { useEffect, useState } from 'react'
import AnimatedCounter from '@/components/AnimatedCounter'

export default function Hero() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <section className="relative min-h-[90vh] overflow-hidden bg-gradient-to-b from-ocean-navy via-ocean-royal to-ocean-teal pt-24 sm:pt-28">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating orbs with new colors */}
        <div className="absolute top-0 left-1/4 h-96 w-96 animate-float rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(168, 216, 240, 0.15), transparent)' }}></div>
        <div className="absolute bottom-0 right-1/4 h-96 w-96 animate-float rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(59, 180, 232, 0.2), transparent)', animationDelay: '1s', animationDuration: '6s' }}></div>
        <div className="absolute top-1/2 left-0 h-64 w-64 animate-float rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(122, 211, 246, 0.15), transparent)', animationDelay: '2s', animationDuration: '8s' }}></div>
        <div className="absolute bottom-1/4 left-1/2 h-80 w-80 animate-float rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(31, 143, 201, 0.2), transparent)', animationDelay: '0.5s', animationDuration: '7s' }}></div>
        
        {/* Gradient stripes pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: 'linear-gradient(to top, #0D4A7A, transparent)' }}></div>
          <div className="absolute bottom-16 left-0 right-0 h-24" style={{ background: 'linear-gradient(to top, #156DA3, transparent)' }}></div>
          <div className="absolute top-0 left-0 right-0 h-40" style={{ background: 'linear-gradient(to bottom, #A8D8F0, transparent)' }}></div>
        </div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(168,216,240,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(168,216,240,0.05)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
        
        {/* Animated gradient mesh with new colors */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute h-full w-full animate-spin-slow" style={{
            background: 'conic-gradient(from 0deg, transparent, rgba(59, 180, 232, 0.3), transparent, rgba(122, 211, 246, 0.2), transparent)',
          }}></div>
        </div>
        
        {/* Light beams with cyan gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-0 h-full w-full animate-pulse-slow opacity-10" style={{
            background: 'linear-gradient(45deg, transparent, rgba(59, 180, 232, 0.2), transparent)',
            animationDuration: '4s'
          }}></div>
        </div>

        {/* Diagonal Stripe Pattern */}
        <div className="absolute inset-0 overflow-hidden opacity-15">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            background: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 40px,
              rgba(168, 216, 240, 0.1) 40px,
              rgba(168, 216, 240, 0.1) 80px
            )`
          }}></div>
          <div className="absolute top-0 left-0 w-full h-full" style={{
            background: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 60px,
              rgba(59, 180, 232, 0.08) 60px,
              rgba(59, 180, 232, 0.08) 120px
            )`
          }}></div>
        </div>

        {/* Angular Geometric Border at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden" style={{ zIndex: 1 }}>
          <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
            <path 
              d="M0,200 L0,120 L150,100 L300,80 L450,90 L600,70 L750,85 L900,65 L1050,75 L1200,60 L1200,200 Z" 
              fill="#ffffff" 
              opacity="1"
            />
            <path 
              d="M0,200 L0,140 L200,115 L400,95 L600,105 L800,85 L1000,95 L1200,75 L1200,200 Z" 
              fill="#f8fafc" 
              opacity="0.9"
            />
          </svg>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center animate-bounce">
        <div className="flex flex-col items-center gap-2 text-white/60">
          <span className="text-xs font-medium uppercase tracking-wider">Scroll Down</span>
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>

      <div className="container-custom relative z-10 flex min-h-[90vh] items-center justify-center py-16 px-4 sm:py-20">
        <div className={`mx-auto max-w-4xl text-center transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Badge */}
          <div className="mb-6 animate-slide-down opacity-0" style={{ animationFillMode: 'forwards' }}>
            <span className="inline-block rounded-full border border-white/30 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md transition-all duration-300 hover:bg-white/20">
              Trusted Pharmaceutical Distribution
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="mb-4 font-display font-black leading-[1.1] tracking-tight text-white">
            <span className="block animate-slide-up opacity-0 text-4xl sm:text-5xl md:text-6xl" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
              Crafting Your Perfect
            </span>
            <span className="block animate-slide-up bg-gradient-to-r from-white via-ocean-sky to-ocean-aqua bg-clip-text text-transparent opacity-0 text-4xl sm:text-5xl md:text-6xl" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              Healthcare Distribution Network
            </span>
            <span className="mt-4 block animate-slide-up text-2xl font-light text-white/80 sm:text-3xl md:text-4xl opacity-0" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
              Serving Alappuzha with Excellence for Over 12 Years
            </span>
          </h1>

          {/* Stats - Inline */}
          <div className="mx-auto mb-8 flex flex-wrap items-center justify-center gap-8 opacity-0 animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-display font-bold text-white">
                <AnimatedCounter end={12} suffix="+" />
              </div>
              <div className="text-sm sm:text-base text-white/80 mt-1">Years of Excellence</div>
            </div>
            <div className="h-10 w-px bg-white/20"></div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-display font-bold text-white">
                <AnimatedCounter end={480} suffix="+" />
              </div>
              <div className="text-sm sm:text-base text-white/80 mt-1">Satisfied Customers</div>
            </div>
            <div className="h-10 w-px bg-white/20"></div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-display font-bold text-white">
                <AnimatedCounter end={100} suffix="%" />
              </div>
              <div className="text-sm sm:text-base text-white/80 mt-1">Cold Chain Compliance</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row opacity-0 animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
            <a
              href="#services"
              className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-ocean-cyan via-ocean-teal to-ocean-royal px-8 py-3 text-base font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-ocean-cyan/50"
            >
              <span className="relative z-10 flex items-center gap-2">
                Our Services
                <svg
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
              <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-ocean-aqua/30 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]"></div>
            </a>
            <a
              href="#contact"
              className="group rounded-lg border-2 border-white/50 bg-white/10 px-8 py-3 text-base font-semibold text-white backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-white hover:bg-white/20"
            >
              <span className="flex items-center gap-2">
                Contact Us
                <svg
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
