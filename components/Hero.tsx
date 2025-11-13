'use client'

import { useEffect, useState } from 'react'
import AnimatedCounter from '@/components/AnimatedCounter'

export default function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isLoaded, setIsLoaded] = useState(false)
  const [time, setTime] = useState(0)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(Date.now())
    }, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative min-h-[90vh] overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 pt-24 sm:pt-28">
      {/* Animated Background Video Overlay Effect */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated Gradient Background */}
        <div
          className="absolute inset-0 opacity-30 transition-opacity duration-1000"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255, 255, 255, 0.15) 0%, transparent 50%)`,
          }}
        />
        
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full bg-white/30 animate-float"
              style={{
                left: `${10 + (i * 8) % 90}%`,
                top: `${15 + (i * 12) % 80}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${4 + (i % 4)}s`,
              }}
            />
          ))}
        </div>

        {/* Animated Orbs/Globes */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 h-64 w-64 animate-pulse-slow rounded-full bg-blue-400/10 blur-3xl" style={{ animationDuration: '6s' }}></div>
          <div className="absolute bottom-1/4 right-1/4 h-80 w-80 animate-pulse-slow rounded-full bg-white/5 blur-3xl" style={{ animationDelay: '2s', animationDuration: '8s' }}></div>
          <div className="absolute top-1/2 right-1/3 h-48 w-48 animate-pulse-slow rounded-full bg-blue-300/10 blur-3xl" style={{ animationDelay: '1s', animationDuration: '7s' }}></div>
        </div>

        {/* Animated Mesh Gradient */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute h-full w-full animate-spin-slow"
            style={{
              background: `conic-gradient(from ${mousePosition.x * 3.6}deg, transparent, rgba(59, 130, 246, 0.3), transparent)`,
            }}
          />
        </div>

        {/* Animated Wave Pattern */}
        <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden opacity-10">
          <div 
            className="absolute inset-0 animate-wave"
            style={{
              background: `linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1) 50%, transparent)`,
              backgroundSize: '200% 100%',
              animation: 'wave 8s ease-in-out infinite',
            }}
          ></div>
        </div>

        {/* Animated Connecting Lines/Dots */}
        <div className="absolute inset-0">
          <svg className="absolute inset-0 h-full w-full opacity-5" style={{ mixBlendMode: 'screen' }}>
            {[...Array(8)].map((_, i) => {
              const x1 = 10 + (i * 12)
              const y1 = 20 + (i % 4) * 25
              const x2 = 15 + ((i + 1) * 12) % 90
              const y2 = 25 + ((i + 1) % 4) * 25
              return (
                <line
                  key={i}
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeWidth="1"
                  className="animate-pulse-slow"
                  style={{ animationDelay: `${i * 0.2}s`, animationDuration: '4s' }}
                />
              )
            })}
          </svg>
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

        {/* Animated Light Beams */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute h-full w-full opacity-10"
            style={{
              background: `linear-gradient(${mousePosition.x * 0.1}deg, transparent, rgba(255, 255, 255, 0.1), transparent)`,
            }}
          />
          {/* Rotating Light Beam */}
          <div 
            className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 animate-spin-slow opacity-5"
            style={{
              background: `radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)`,
              animationDuration: '20s',
            }}
          ></div>
        </div>

        {/* Animated Rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[1, 2, 3].map((ring) => (
            <div
              key={ring}
              className="absolute h-96 w-96 animate-ping rounded-full border border-white/10"
              style={{
                animationDelay: `${ring * 0.5}s`,
                animationDuration: `${4 + ring * 2}s`,
                scale: ring * 1.5,
              }}
            ></div>
          ))}
        </div>

        {/* Shimmer Effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent"
            style={{
              transform: 'rotate(45deg)',
              transformOrigin: 'center',
              width: '200%',
              height: '200%',
            }}
          ></div>
        </div>

        {/* Morphing Blob Shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute top-1/3 left-1/5 h-96 w-96 animate-pulse-slow rounded-full bg-gradient-to-br from-blue-400/20 to-purple-500/20 blur-3xl"
            style={{
              borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
              animation: 'morph 20s ease-in-out infinite, pulse 8s ease-in-out infinite',
              animationDelay: '0s, 0s',
            }}
          ></div>
          <div 
            className="absolute bottom-1/3 right-1/5 h-80 w-80 animate-pulse-slow rounded-full bg-gradient-to-br from-cyan-400/15 to-blue-500/15 blur-3xl"
            style={{
              borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
              animation: 'morph 15s ease-in-out infinite, pulse 6s ease-in-out infinite',
              animationDelay: '2s, 1s',
            }}
          ></div>
        </div>

        {/* Floating Geometric Shapes */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div
              key={`shape-${i}`}
              className="absolute animate-float opacity-10"
              style={{
                left: `${15 + (i * 18) % 85}%`,
                top: `${10 + (i * 15) % 75}%`,
                width: `${20 + (i % 3) * 15}px`,
                height: `${20 + (i % 3) * 15}px`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${5 + (i % 3)}s`,
                background: i % 2 === 0 
                  ? 'linear-gradient(45deg, rgba(255,255,255,0.1), transparent)'
                  : 'radial-gradient(circle, rgba(255,255,255,0.1), transparent)',
                clipPath: i % 3 === 0 
                  ? 'polygon(50% 0%, 0% 100%, 100% 100%)'
                  : i % 3 === 1
                  ? 'polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)'
                  : 'circle(50%)',
              }}
            ></div>
          ))}
        </div>

        {/* Animated Gradient Mesh - Moving */}
        <div className="absolute inset-0 opacity-15">
          <div 
            className="absolute h-full w-full"
            style={{
              background: `
                radial-gradient(circle at ${20 + Math.sin(time / 5000) * 20}% ${30 + Math.cos(time / 5000) * 20}%, rgba(59, 130, 246, 0.4) 0%, transparent 50%),
                radial-gradient(circle at ${80 + Math.cos(time / 6000) * 15}% ${70 + Math.sin(time / 6000) * 15}%, rgba(147, 197, 253, 0.3) 0%, transparent 50%)
              `,
              transition: 'background 0.1s ease-out',
            }}
          ></div>
        </div>

        {/* Animated Noise Texture */}
        <div 
          className="absolute inset-0 opacity-[0.02] mix-blend-screen"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
            animation: 'noise 0.2s steps(8) infinite',
          }}
        ></div>

        {/* Animated Dotted Grid */}
        <div className="absolute inset-0 opacity-5">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
              animation: 'gridPulse 4s ease-in-out infinite',
            }}
          ></div>
        </div>

        {/* Floating Gradient Orbs */}
        <div className="absolute inset-0">
          {[...Array(4)].map((_, i) => (
            <div
              key={`orb-${i}`}
              className="absolute h-32 w-32 rounded-full bg-gradient-to-br from-white/10 to-blue-400/10 blur-2xl animate-float"
              style={{
                left: `${25 + i * 20}%`,
                top: `${20 + (i % 2) * 60}%`,
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${6 + i * 2}s`,
                transform: `scale(${0.8 + (i % 2) * 0.4})`,
              }}
            ></div>
          ))}
        </div>

        {/* Animated Radial Lines */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <svg className="absolute h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ mixBlendMode: 'screen' }}>
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30) * (Math.PI / 180)
              const length = 50
              const x2 = 50 + Math.cos(angle) * length
              const y2 = 50 + Math.sin(angle) * length
              return (
                <line
                  key={`line-${i}`}
                  x1="50"
                  y1="50"
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeWidth="0.2"
                  className="animate-pulse-slow"
                  style={{ 
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '3s',
                  }}
                />
              )
            })}
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
            <span className="block animate-slide-up bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent opacity-0 text-4xl sm:text-5xl md:text-6xl" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
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
              className="group relative overflow-hidden rounded-lg bg-white px-8 py-3 text-base font-semibold text-primary-700 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-white/50"
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
              <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-primary-50 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]"></div>
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
