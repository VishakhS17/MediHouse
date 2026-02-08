import Link from 'next/link'
import { contact, siteConfig } from '@/data/site'

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-ocean-navy via-ocean-royal to-ocean-navy text-gray-300" role="contentinfo">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full blur-3xl animate-pulse-slow" style={{ background: 'radial-gradient(circle, rgba(59, 180, 232, 0.15), transparent)' }}></div>
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full blur-3xl animate-pulse-slow" style={{ background: 'radial-gradient(circle, rgba(122, 211, 246, 0.15), transparent)', animationDelay: '1s' }}></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:20px_20px]"></div>

      <div className="container-custom relative z-10 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="animate-fade-in-up">
            <h3 className="mb-6 text-2xl font-bold bg-gradient-to-r from-ocean-sky via-ocean-aqua to-white bg-clip-text text-transparent">
              {siteConfig.name}
            </h3>
            <p className="mb-6 leading-relaxed text-gray-400 text-sm">{siteConfig.description}</p>
            <address className="not-italic text-sm leading-relaxed text-gray-400">
              <p className="transition-colors hover:text-white">{contact.address}</p>
            </address>
          </div>

          <div className="animate-fade-in-up-delay">
            <h3 className="mb-6 text-xl font-bold text-white">Quick Links</h3>
            <nav className="flex flex-col space-y-2 sm:space-y-3" aria-label="Footer navigation">
              <a
                href="#services"
                onClick={(e) => {
                  e.preventDefault()
                  document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="group relative inline-flex items-center text-sm text-gray-400 transition-all duration-300 hover:text-ocean-aqua focus:outline-none focus:ring-2 focus:ring-ocean-cyan rounded cursor-pointer min-h-[44px] touch-manipulation"
              >
                <span className="mr-2 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 translate-x-[-10px]">→</span>
                Services
              </a>
              <a
                href="#testimonials"
                onClick={(e) => {
                  e.preventDefault()
                  document.querySelector('#testimonials')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="group relative inline-flex items-center text-sm text-gray-400 transition-all duration-300 hover:text-ocean-aqua focus:outline-none focus:ring-2 focus:ring-ocean-cyan rounded cursor-pointer min-h-[44px] touch-manipulation"
              >
                <span className="mr-2 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 translate-x-[-10px]">→</span>
                Testimonials
              </a>
              <a
                href="#partners"
                onClick={(e) => {
                  e.preventDefault()
                  document.querySelector('#partners')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="group relative inline-flex items-center text-sm text-gray-400 transition-all duration-300 hover:text-ocean-aqua focus:outline-none focus:ring-2 focus:ring-ocean-cyan rounded cursor-pointer min-h-[44px] touch-manipulation"
              >
                <span className="mr-2 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 translate-x-[-10px]">→</span>
                Partners
              </a>
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault()
                  document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="group relative inline-flex items-center text-sm text-gray-400 transition-all duration-300 hover:text-ocean-aqua focus:outline-none focus:ring-2 focus:ring-ocean-cyan rounded cursor-pointer min-h-[44px] touch-manipulation"
              >
                <span className="mr-2 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 translate-x-[-10px]">→</span>
                Contact
              </a>
            </nav>
          </div>

          <div className="animate-fade-in-up-delay-2">
            <h3 className="mb-6 text-xl font-bold text-white">Contact Info</h3>
            <div className="space-y-4 text-sm">
              <div className="group">
                <span className="mb-1 block font-semibold text-gray-400">Mobile:</span>
                <div className="space-y-1">
                  {contact.mobile.map((number, index) => (
                    <a
                      key={index}
                      href={`tel:${number.replace(/\s/g, '')}`}
                        className="block text-gray-400 transition-all duration-300 hover:text-ocean-aqua hover:translate-x-2 focus:outline-none focus:ring-2 focus:ring-ocean-cyan rounded"
                    >
                      {number}
                    </a>
                  ))}
                </div>
              </div>
              <div className="group">
                <span className="mb-1 block font-semibold text-gray-400">Office:</span>
                <div className="space-y-1">
                  {contact.office.map((number, index) => (
                    <a
                      key={index}
                      href={`tel:${number.replace(/\s/g, '')}`}
                        className="block text-gray-400 transition-all duration-300 hover:text-ocean-aqua hover:translate-x-2 focus:outline-none focus:ring-2 focus:ring-ocean-cyan rounded"
                    >
                      {number}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <span className="mb-1 block font-semibold text-gray-400">Email:</span>
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex items-center text-gray-400 transition-all duration-300 hover:text-primary-400 hover:translate-x-2 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                >
                  {contact.email}
                  <svg className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="animate-fade-in-up-delay-2">
            <h3 className="mb-6 text-xl font-bold text-white">Location</h3>
            <div className="h-48 w-full overflow-hidden rounded-lg border border-gray-700/50 shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4309.157736492258!2d76.3355502109359!3d9.49857868142185!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b0885d164564717%3A0x160c8bb7822b0544!2smedi-house!5e1!3m2!1sen!2sus!4v1765650415697!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full"
                title="medi-house Location"
              ></iframe>
            </div>
            <a
              href="https://maps.app.goo.gl/H3ST3t3qWFtc8SVP8"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-xs text-gray-400 transition-colors hover:text-primary-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in Google Maps
            </a>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 border-t border-gray-700/50 pt-6 sm:pt-8">
          <div className="flex flex-col items-center justify-between space-y-3 sm:space-y-4 md:flex-row md:space-y-0 text-center md:text-left">
            <p className="text-sm text-gray-400">
              &copy; 2026 <span className="text-white font-semibold">{siteConfig.name}</span>. All rights reserved. Designed by{' '}
              <a
                href="https://www.linkedin.com/in/vishakhs17/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ocean-aqua hover:text-ocean-cyan transition-colors duration-300 font-semibold"
              >
                Vishakh S
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

