'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function Preloader() {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 100)

    // Minimum loading time for smooth animation
    const timer = setTimeout(() => {
      setLoading(false)
      document.body.classList.remove('preload')
    }, 1500)

    return () => {
      clearInterval(interval)
      clearTimeout(timer)
    }
  }, [])

  if (!loading) return null

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 h-full w-full animate-spin-slow rounded-full bg-primary-500/10 blur-3xl"></div>
        <div className="absolute -bottom-1/2 -right-1/2 h-full w-full animate-spin-slow rounded-full bg-white/10 blur-3xl" style={{ animationDirection: 'reverse', animationDuration: '8s' }}></div>
      </div>

      {/* Logo Animation */}
      <div className="relative z-10 mb-8 animate-fade-in">
        <div className="relative h-24 w-24 animate-pulse">
          <div className="absolute inset-0 rounded-full bg-white/20 blur-xl"></div>
          <div className="relative h-full w-full">
            <Image
              src="/logo.svg"
              alt="Medi House"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      </div>

      {/* Company Name */}
      <h1 className="relative z-10 mb-12 animate-fade-in-delay text-3xl font-bold text-white drop-shadow-lg sm:text-4xl">
        Medi House
      </h1>

      {/* Loading Progress Bar */}
      <div className="relative z-10 w-64 max-w-xs sm:w-80">
        <div className="mb-2 flex justify-between text-sm text-white/80">
          <span>Loading...</span>
          <span>{Math.min(Math.round(progress), 100)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/20 backdrop-blur-sm">
          <div
            className="h-full rounded-full bg-gradient-to-r from-white via-blue-100 to-white transition-all duration-300 ease-out shadow-lg"
            style={{ width: `${Math.min(progress, 100)}%` }}
          >
            <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
          </div>
        </div>
      </div>

      {/* Animated Dots */}
      <div className="relative z-10 mt-8 flex space-x-2">
        <div className="h-2 w-2 animate-bounce rounded-full bg-white [animation-delay:-0.3s]"></div>
        <div className="h-2 w-2 animate-bounce rounded-full bg-white [animation-delay:-0.15s]"></div>
        <div className="h-2 w-2 animate-bounce rounded-full bg-white"></div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-fade-in-delay {
          animation: fade-in 0.8s ease-out 0.2s both;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}

