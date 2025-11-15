'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { siteConfig } from '@/data/site'
import { useCart } from '@/lib/cart'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [shouldUseBlueText, setShouldUseBlueText] = useState(false)
  const [isProductsPage, setIsProductsPage] = useState(false)
  const { getTotalItems } = useCart()
  const router = useRouter()

  const navLinks = [
    { href: '/products', label: 'Products' },
    { href: '#services', label: 'Services' },
    { href: '#testimonials', label: 'Testimonials' },
    { href: '#partners', label: 'Partners' },
    { href: '#contact', label: 'Contact' },
  ]

  useEffect(() => {
    // Check if we're on products or cart page
    const path = router.pathname
    setIsProductsPage(path === '/products' || path === '/cart')
    
    // On products/cart pages, always use white text (blue glass navbar)
    if (path === '/products' || path === '/cart') {
      setShouldUseBlueText(false)
      return
    }

    const handleScroll = () => {
      // Sections with white backgrounds (should have blue text): services, partners, about, faq
      // Sections with dark backgrounds (should have white text): testimonials, contact
      const servicesSection = document.querySelector('#services')
      const testimonialsSection = document.querySelector('#testimonials')
      const partnersSection = document.querySelector('#partners')
      const aboutSection = document.querySelector('#about')
      const faqSection = document.querySelector('#faq')
      const contactSection = document.querySelector('#contact')

      const navbarHeight = 100

      let currentSection: string | null = null

      if (servicesSection) {
        const rect = servicesSection.getBoundingClientRect()
        if (rect.top <= navbarHeight + 50 && rect.bottom > navbarHeight) {
          currentSection = 'services'
        }
      }

      if (aboutSection && !currentSection) {
        const rect = aboutSection.getBoundingClientRect()
        if (rect.top <= navbarHeight + 50 && rect.bottom > navbarHeight) {
          currentSection = 'about'
        }
      }

      if (testimonialsSection && !currentSection) {
        const rect = testimonialsSection.getBoundingClientRect()
        if (rect.top <= navbarHeight + 50 && rect.bottom > navbarHeight) {
          currentSection = 'testimonials'
        }
      }

      if (partnersSection && !currentSection) {
        const rect = partnersSection.getBoundingClientRect()
        if (rect.top <= navbarHeight + 50 && rect.bottom > navbarHeight) {
          currentSection = 'partners'
        }
      }

      if (faqSection && !currentSection) {
        const rect = faqSection.getBoundingClientRect()
        if (rect.top <= navbarHeight + 50 && rect.bottom > navbarHeight) {
          currentSection = 'faq'
        }
      }

      if (contactSection && !currentSection) {
        const rect = contactSection.getBoundingClientRect()
        if (rect.top <= navbarHeight + 50 && rect.bottom > navbarHeight) {
          currentSection = 'contact'
        }
      }

      // Blue text for: services, about, faq (white backgrounds)
      // White text for: testimonials, partners, contact (dark backgrounds), hero (default)
      setShouldUseBlueText(
        currentSection === 'services' ||
        currentSection === 'about' ||
        currentSection === 'faq'
      )
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [router.pathname])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault()
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setIsMenuOpen(false)
      }
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 sm:px-6 sm:pt-6">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <nav 
        className={`mx-auto max-w-7xl rounded-2xl shadow-2xl transition-all duration-300 ${
          isProductsPage
            ? 'border border-ocean-cyan/30 bg-gradient-to-r from-ocean-royal/80 via-ocean-teal/80 to-ocean-royal/80 hover:from-ocean-royal/90 hover:via-ocean-teal/90 hover:to-ocean-royal/90 backdrop-blur-3xl'
            : shouldUseBlueText
            ? 'border border-gray-200/40 bg-white/50 hover:bg-white/60 backdrop-blur-3xl'
            : 'border border-white/40 bg-white/20 hover:bg-white/25 backdrop-blur-3xl'
        }`}
        style={isProductsPage ? {
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: '0 8px 32px 0 rgba(21, 109, 163, 0.4)',
          background: 'linear-gradient(135deg, rgba(21, 109, 163, 0.85) 0%, rgba(31, 143, 201, 0.85) 50%, rgba(21, 109, 163, 0.85) 100%)',
        } : shouldUseBlueText ? {
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)'
        } : {
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)'
        }}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link
            href="/"
            className="group flex items-center space-x-3 transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ocean-cyan focus:ring-offset-2 rounded-lg"
            aria-label={`${siteConfig.name} Home`}
          >
            <div className="relative h-10 w-10 sm:h-12 sm:w-12 transition-transform duration-300 group-hover:rotate-12">
              <div className="absolute inset-0 rounded-full opacity-0 blur transition-opacity duration-300 group-hover:opacity-50" style={{ background: 'radial-gradient(circle, rgba(59, 180, 232, 0.6), rgba(122, 211, 246, 0.4))' }}></div>
              <div className="relative h-full w-full">
                <Image
                  src="/logo.svg"
                  alt={`${siteConfig.name} Logo`}
                  fill
                  className="object-contain drop-shadow-md"
                  priority
                />
              </div>
            </div>
            <span className={`text-lg sm:text-xl font-display font-bold transition-all duration-300 ${
              isProductsPage
                ? 'text-white'
                : shouldUseBlueText
                ? 'bg-gradient-to-r from-ocean-royal via-ocean-teal to-ocean-cyan bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-white via-ocean-sky to-white/90 bg-clip-text text-transparent'
            }`}>
              {siteConfig.name}
            </span>
          </Link>

          <div className="hidden md:flex md:items-center md:space-x-1">
            {navLinks.map((link) => (
              link.href.startsWith('#') ? (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent group cursor-pointer ${
                    isProductsPage
                      ? 'text-white hover:text-white hover:bg-white/20 focus:ring-white/50'
                      : shouldUseBlueText
                      ? 'text-ocean-royal hover:text-ocean-cyan hover:bg-ocean-aqua/20 focus:ring-ocean-cyan'
                      : 'text-white/90 hover:bg-white/10 hover:text-white focus:ring-white/50'
                  }`}
                >
                  <span className="relative z-10">{link.label}</span>
                      <span className={`absolute inset-x-0 bottom-0 h-0.5 scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${
                        isProductsPage
                          ? 'bg-gradient-to-r from-white/0 via-white to-white/0'
                          : shouldUseBlueText
                          ? 'bg-gradient-to-r from-ocean-cyan/0 via-ocean-cyan to-ocean-cyan/0'
                          : 'bg-gradient-to-r from-white/0 via-ocean-aqua to-white/0'
                      }`}></span>
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent group cursor-pointer ${
                    isProductsPage
                      ? 'text-white hover:text-white hover:bg-white/20 focus:ring-white/50'
                      : shouldUseBlueText
                      ? 'text-ocean-royal hover:text-ocean-cyan hover:bg-ocean-aqua/20 focus:ring-ocean-cyan'
                      : 'text-white/90 hover:bg-white/10 hover:text-white focus:ring-white/50'
                  }`}
                >
                  <span className="relative z-10">{link.label}</span>
                      <span className={`absolute inset-x-0 bottom-0 h-0.5 scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${
                        isProductsPage
                          ? 'bg-gradient-to-r from-white/0 via-white to-white/0'
                          : shouldUseBlueText
                          ? 'bg-gradient-to-r from-ocean-cyan/0 via-ocean-cyan to-ocean-cyan/0'
                          : 'bg-gradient-to-r from-white/0 via-ocean-aqua to-white/0'
                      }`}></span>
                </Link>
              )
            ))}
            <Link
              href="/cart"
              className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent group cursor-pointer ${
                isProductsPage
                  ? 'text-white hover:text-white hover:bg-white/20 focus:ring-white/50'
                  : shouldUseBlueText
                  ? 'text-ocean-royal hover:text-ocean-cyan hover:bg-ocean-aqua/20 focus:ring-ocean-cyan'
                  : 'text-white/90 hover:bg-white/10 hover:text-white focus:ring-white/50'
              }`}
            >
              <span className="relative z-10 flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {getTotalItems() > 0 && (
                  <span className={`absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    isProductsPage ? 'bg-white text-ocean-royal' : shouldUseBlueText ? 'bg-ocean-cyan text-white' : 'bg-ocean-aqua text-ocean-navy'
                  }`}>
                    {getTotalItems()}
                  </span>
                )}
              </span>
            </Link>
          </div>

          <button
            className={`md:hidden rounded-lg p-2 transition-colors focus:outline-none focus:ring-2 ${
              isProductsPage
                ? 'text-white hover:text-white hover:bg-white/20 focus:ring-white/50'
                : shouldUseBlueText
                ? 'text-ocean-royal hover:text-ocean-cyan hover:bg-ocean-aqua/20 focus:ring-ocean-cyan'
                : 'text-white/90 hover:bg-white/10 focus:ring-white/50'
            }`}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {isMenuOpen && (
          <div className={`border-t px-4 py-4 md:hidden transition-colors duration-300 ${
            isProductsPage ? 'border-white/20' : shouldUseBlueText ? 'border-gray-200/30' : 'border-white/10'
          }`}>
            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                link.href.startsWith('#') ? (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`rounded-lg px-3 py-2 transition-colors focus:outline-none focus:ring-2 cursor-pointer ${
                      isProductsPage
                        ? 'text-white hover:text-white hover:bg-white/20 focus:ring-white/50'
                        : shouldUseBlueText
                        ? 'text-ocean-royal hover:text-ocean-cyan hover:bg-ocean-aqua/20 focus:ring-ocean-cyan'
                        : 'text-white/90 hover:bg-white/10 hover:text-white focus:ring-white/50'
                    }`}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`rounded-lg px-3 py-2 transition-colors focus:outline-none focus:ring-2 cursor-pointer ${
                      isProductsPage
                        ? 'text-white hover:text-white hover:bg-white/20 focus:ring-white/50'
                        : shouldUseBlueText
                        ? 'text-ocean-royal hover:text-ocean-cyan hover:bg-ocean-aqua/20 focus:ring-ocean-cyan'
                        : 'text-white/90 hover:bg-white/10 hover:text-white focus:ring-white/50'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              ))}
              <Link
                href="/cart"
                onClick={() => setIsMenuOpen(false)}
                className={`rounded-lg px-3 py-2 transition-colors focus:outline-none focus:ring-2 cursor-pointer flex items-center space-x-2 ${
                  isProductsPage
                    ? 'text-white hover:text-white hover:bg-white/20 focus:ring-white/50'
                    : shouldUseBlueText
                    ? 'text-ocean-royal hover:text-ocean-cyan hover:bg-ocean-aqua/20 focus:ring-ocean-cyan'
                    : 'text-white/90 hover:bg-white/10 hover:text-white focus:ring-white/50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Cart</span>
                {getTotalItems() > 0 && (
                  <span className={`ml-auto h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    isProductsPage ? 'bg-white text-ocean-royal' : shouldUseBlueText ? 'bg-ocean-cyan text-white' : 'bg-ocean-aqua text-ocean-navy'
                  }`}>
                    {getTotalItems()}
                  </span>
                )}
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

