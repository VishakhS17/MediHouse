import Head from 'next/head'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Hero from '@/components/Hero'
import FeatureCard from '@/components/FeatureCard'
import PartnersGrid from '@/components/PartnersGrid'
import TestimonialCard from '@/components/TestimonialCard'
import ContactForm from '@/components/ContactForm'
import AnimatedCounter from '@/components/AnimatedCounter'
import ValuesSection from '@/components/ValuesSection'
import Gallery from '@/components/Gallery'
import FAQ from '@/components/FAQ'
import SEO from '@/components/SEO'
import StructuredData from '@/components/StructuredData'
import { generatePageMeta } from '@/lib/siteMeta'
import { services, partners, contact, companyInfo, testimonials } from '@/data/site'

export default function Home() {
  const meta = generatePageMeta({
    title: 'Pharmaceutical Distributor in Kerala | Real-Time Stock – medi-house',
    description:
      'Trusted pharmaceutical distributor in Kerala offering real-time stock, fast delivery and bulk medicine supply for medical stores & hospitals. Serving Alappuzha since 2011 with 720+ satisfied customers.',
    keywords: 'pharmaceutical distributor Kerala, medicine wholesale supplier Kerala, pharma distributor Alappuzha, bulk medicine supplier Kerala, medical store supplier Kerala, pharmaceutical distribution Kerala',
  })

  return (
    <>
      <SEO meta={meta} canonicalPath="/" />
      <StructuredData />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header />
      <main id="main-content" role="main">
        <Hero />

        {/* Introduction Section - SEO Content */}
        <section className="relative overflow-hidden bg-white py-12 sm:py-16 px-4">
          <div className="container-custom relative z-10 max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 text-center">
                Your Trusted Pharmaceutical Distributor in Kerala
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4 text-lg">
                As a leading pharmaceutical distributor in Kerala, medi-house has been serving the healthcare industry in Alappuzha since 2011. We specialize in providing reliable pharmaceutical distribution services, real-time stock availability, and comprehensive medicine supply solutions for medical stores, hospitals, and clinics across Kerala.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4 text-lg">
                Our commitment to excellence and quality has made us a preferred partner for over 720 satisfied customers. Whether you need bulk medicine supply for hospitals or regular inventory for medical stores, we offer competitive wholesale rates, reliable delivery, and state-of-the-art cold chain facilities to ensure all medications are stored and handled with the highest care.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4 text-lg">
                Located at {contact.address}, medi-house provides comprehensive pharmaceutical distribution services throughout Alappuzha and its suburbs. Our dedicated team of five salesmen and one van salesman ensures personalized service, while our strategic partnership with Tracon Courier extends our delivery reach across Kerala.
              </p>
              <div className="bg-gradient-to-br from-ocean-cyan/10 to-ocean-royal/10 p-6 rounded-lg border border-ocean-cyan/20 mt-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Why Choose Medi-House as Your Pharmaceutical Distributor?</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>12+ years of trusted service in pharmaceutical distribution across Kerala</li>
                  <li>Real-time stock visibility through our online platform</li>
                  <li>State-of-the-art cold chain facility ensuring 100% compliance</li>
                  <li>Partnerships with leading pharma companies: Aristo, Blue Cross, JB Chemicals, RPG Life, Indoco, and more</li>
                  <li>Daily delivery services covering whole of Alappuzha and suburbs</li>
                  <li>Competitive wholesale pricing for better margins</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="services" className="relative overflow-hidden py-12 sm:py-16 md:py-20 px-4" aria-label="Our Services">
          {/* Background Decoration with new colors */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-ocean-aqua/20 to-ocean-sky/10"></div>
          
          {/* Decorative gradient stripes */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 right-0 h-24" style={{ background: 'linear-gradient(to bottom, #7AD3F6, transparent)' }}></div>
            <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: 'linear-gradient(to top, #A8D8F0, transparent)' }}></div>
          </div>
          
          <div className="container-custom relative z-10">
            <div className="mb-8 sm:mb-12 md:mb-16 text-center animate-fade-in-up px-2">
              <span className="mb-3 sm:mb-4 inline-block rounded-full bg-gradient-to-r from-ocean-cyan/20 via-ocean-aqua/20 to-ocean-sky/20 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-ocean-royal border border-ocean-cyan/30">
                What We Offer
              </span>
              <h2 className="mb-4 sm:mb-6 font-display font-bold text-gray-900 text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                Our <span className="bg-gradient-to-r from-ocean-cyan via-ocean-teal to-ocean-royal bg-clip-text text-transparent">Services</span>
              </h2>
              <p className="mx-auto max-w-3xl text-base sm:text-lg md:text-xl leading-relaxed text-gray-600 mb-3 sm:mb-4 px-2">
                With a dedicated team of five salesmen and one van salesman, we cover the whole of Alappuzha and suburbs. Our comprehensive distribution network ensures timely delivery of medicines and healthcare products to over 720 satisfied customers.
              </p>
              <p className="mx-auto max-w-3xl text-sm sm:text-base md:text-lg leading-relaxed text-gray-600 px-2">
                We specialize in pharmaceutical distribution, hospital supplies, and maintain a state-of-the-art cold chain facility for temperature-sensitive medications. Our strategic tie-up with Tracon Courier ensures efficient and reliable delivery services throughout the region.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => (
                <div key={index} className="flex animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <FeatureCard service={service} />
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Testimonials Section */}
        <section id="testimonials" className="relative overflow-hidden bg-gradient-to-br from-ocean-navy via-ocean-royal to-ocean-teal py-12 sm:py-16 md:py-24 px-4" aria-label="Customer Testimonials">
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
            
            {/* Animated gradient mesh */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute h-full w-full animate-spin-slow" style={{
                background: 'conic-gradient(from 0deg, transparent, rgba(59, 180, 232, 0.3), transparent, rgba(122, 211, 246, 0.2), transparent)',
              }}></div>
            </div>
            
            {/* Light beams with cyan */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 left-0 h-full w-full animate-pulse-slow opacity-10" style={{
                background: 'linear-gradient(45deg, transparent, rgba(59, 180, 232, 0.2), transparent)',
                animationDuration: '4s'
              }}></div>
            </div>
          </div>

          <div className="container-custom relative z-10">
            <div className="mb-8 sm:mb-12 md:mb-16 text-center animate-fade-in-up px-2">
              <span className="mb-3 sm:mb-4 inline-block rounded-full bg-white/20 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white backdrop-blur-sm">
                Trusted By Healthcare Providers
              </span>
              <h2 className="mb-4 sm:mb-6 font-display font-bold text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
                What Our <span className="bg-gradient-to-r from-ocean-sky via-ocean-aqua to-white bg-clip-text text-transparent">Customers Say</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} testimonial={testimonial} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <ValuesSection />

        {/* Gallery Section */}
        <Gallery />

        {/* Partners Section */}
        <section id="partners" className="relative overflow-hidden bg-gradient-to-br from-ocean-navy via-ocean-royal to-ocean-teal py-12 sm:py-16 md:py-24 px-4" aria-label="Our Partners">
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
            
            {/* Animated gradient mesh */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute h-full w-full animate-spin-slow" style={{
                background: 'conic-gradient(from 0deg, transparent, rgba(59, 180, 232, 0.3), transparent, rgba(122, 211, 246, 0.2), transparent)',
              }}></div>
            </div>
            
            {/* Light beams with cyan */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 left-0 h-full w-full animate-pulse-slow opacity-10" style={{
                background: 'linear-gradient(45deg, transparent, rgba(59, 180, 232, 0.2), transparent)',
                animationDuration: '4s'
              }}></div>
            </div>
          </div>

          <div className="container-custom relative z-10">
            <div className="mb-8 sm:mb-12 md:mb-16 text-center animate-fade-in-up">
              <span className="mb-3 sm:mb-4 inline-block rounded-full bg-white/20 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white backdrop-blur-sm">
                Trusted Partnerships
              </span>
              <h2 className="mb-4 sm:mb-6 font-display font-bold text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
                Trusted <span className="bg-gradient-to-r from-ocean-sky via-ocean-aqua to-white bg-clip-text text-transparent">Partners</span>
              </h2>
              <p className="mx-auto max-w-3xl text-base sm:text-lg md:text-xl leading-relaxed text-white/90 px-2 sm:px-4">
                We are proud to partner with leading pharmaceutical companies including Aristo, Blue Cross, JB Chemicals, RPG Life, Indoco, Lividus, Win Medi Care, and Chethana. Together, we deliver quality healthcare products to every corner of Alappuzha.
              </p>
            </div>
            <PartnersGrid partners={partners} />
          </div>
        </section>

        {/* FAQ Section */}
        <FAQ />

        {/* Contact Section */}
        <section id="contact" className="relative overflow-hidden bg-gradient-to-br from-ocean-navy via-ocean-royal to-ocean-teal py-20 px-4" aria-label="Contact">
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
            
            {/* Animated gradient mesh */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute h-full w-full animate-spin-slow" style={{
                background: 'conic-gradient(from 0deg, transparent, rgba(59, 180, 232, 0.3), transparent, rgba(122, 211, 246, 0.2), transparent)',
              }}></div>
            </div>
            
            {/* Light beams with cyan */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 left-0 h-full w-full animate-pulse-slow opacity-10" style={{
                background: 'linear-gradient(45deg, transparent, rgba(59, 180, 232, 0.2), transparent)',
                animationDuration: '4s'
              }}></div>
            </div>
          </div>

          <div className="container-custom relative z-10">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
              {/* Contact Info */}
              <div className="animate-fade-in-up">
                <h2 className="mb-6 font-display font-bold text-white">
                  Get in Touch
                </h2>
                <p className="mb-8 text-xl leading-relaxed text-white/90">
                  Located at 24/220 A, Cullen Road, Pitchu Iyer Junction, Alappuzha - 688001. Contact us today for reliable pharmaceutical distribution services. Our team is ready to serve you with excellence, dedication, and a commitment to quality healthcare delivery.
                </p>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-3 text-lg font-semibold text-white">Address</h3>
                    <p className="text-white/80">{contact.address}</p>
                  </div>
                  
                  <div>
                    <h3 className="mb-3 text-lg font-semibold text-white">Phone</h3>
                    <div className="space-y-2">
                      {contact.mobile.map((number, index) => (
                        <a
                          key={index}
                          href={`tel:${number.replace(/\s/g, '')}`}
                          className="block text-white/80 transition-colors hover:text-white"
                        >
                          Mobile: {number}
                        </a>
                      ))}
                      {contact.office.map((number, index) => (
                        <a
                          key={index}
                          href={`tel:${number.replace(/\s/g, '')}`}
                          className="block text-white/80 transition-colors hover:text-white"
                        >
                          Office: {number}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="animate-fade-in-up-delay">
                <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-md shadow-2xl">
                  <h2 className="mb-6 font-display font-bold text-white">
                    Send us a Message
                  </h2>
                  <ContactForm />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

