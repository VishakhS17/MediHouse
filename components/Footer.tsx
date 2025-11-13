import Link from 'next/link'
import { contact, siteConfig } from '@/data/site'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300" role="contentinfo">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-primary-500/5 blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-primary-600/5 blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:20px_20px]"></div>

      <div className="container-custom relative z-10 py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="animate-fade-in-up">
            <h3 className="mb-6 text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {siteConfig.name}
            </h3>
            <p className="mb-6 leading-relaxed text-gray-400 text-sm">{siteConfig.description}</p>
            <address className="not-italic text-sm leading-relaxed text-gray-400">
              <p className="transition-colors hover:text-white">{contact.address}</p>
            </address>
          </div>

          <div className="animate-fade-in-up-delay">
            <h3 className="mb-6 text-xl font-bold text-white">Quick Links</h3>
            <nav className="flex flex-col space-y-3" aria-label="Footer navigation">
              <a
                href="#services"
                onClick={(e) => {
                  e.preventDefault()
                  document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="group relative inline-flex items-center text-sm text-gray-400 transition-all duration-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 rounded cursor-pointer"
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
                className="group relative inline-flex items-center text-sm text-gray-400 transition-all duration-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 rounded cursor-pointer"
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
                className="group relative inline-flex items-center text-sm text-gray-400 transition-all duration-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 rounded cursor-pointer"
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
                className="group relative inline-flex items-center text-sm text-gray-400 transition-all duration-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 rounded cursor-pointer"
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
                      className="block text-gray-400 transition-all duration-300 hover:text-primary-400 hover:translate-x-2 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
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
                      className="block text-gray-400 transition-all duration-300 hover:text-primary-400 hover:translate-x-2 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
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
                src={`https://www.google.com/maps?q=${encodeURIComponent(contact.address)}&output=embed&hl=en&z=15`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full w-full"
                title="Medi House Location"
              ></iframe>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`}
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

        <div className="mt-12 border-t border-gray-700/50 pt-8">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <p className="text-sm text-gray-400">
              &copy; {currentYear} <span className="text-white font-semibold">{siteConfig.name}</span>. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

