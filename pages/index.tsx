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
import FAQ from '@/components/FAQ'
import SEO from '@/components/SEO'
import { generatePageMeta } from '@/lib/siteMeta'
import { services, partners, contact, companyInfo, testimonials } from '@/data/site'

export default function Home() {
  const meta = generatePageMeta({
    title: 'Home',
    description:
      'Leading pharmaceutical distribution in Alappuzha. Serving over 480 customers with reliable cold chain facilities and daily delivery services.',
  })

  return (
    <>
      <SEO meta={meta} />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header />
      <main id="main-content" role="main">
        <Hero />

        {/* Features Section */}
        <section id="services" className="relative overflow-hidden py-20 px-4" aria-label="Our Services">
          {/* Background Decoration */}
          <div className="absolute inset-0 bg-gradient-to-b from-white via-primary-50/30 to-white"></div>
          
          <div className="container-custom relative z-10">
            <div className="mb-16 text-center animate-fade-in-up">
              <span className="mb-4 inline-block rounded-full bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-700">
                What We Offer
              </span>
              <h2 className="mb-6 font-display font-bold text-gray-900">
                Our <span className="gradient-text">Services</span>
              </h2>
              <p className="mx-auto max-w-3xl text-xl leading-relaxed text-gray-600 mb-4">
                With a dedicated team of five salesmen and one van salesman, we cover the whole of Alappuzha and suburbs. Our comprehensive distribution network ensures timely delivery of medicines and healthcare products to over 480 satisfied customers.
              </p>
              <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-600">
                We specialize in pharmaceutical distribution, hospital supplies, and maintain a state-of-the-art cold chain facility for temperature-sensitive medications. Our strategic tie-up with Tracon Courier ensures efficient and reliable delivery services throughout the region.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => (
                <div key={index} className="flex animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <FeatureCard service={service} />
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Testimonials Section */}
        <section id="testimonials" className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 py-24 px-4" aria-label="Customer Testimonials">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Floating orbs */}
            <div className="absolute top-0 left-1/4 h-96 w-96 animate-float rounded-full bg-white/5 blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 h-96 w-96 animate-float rounded-full bg-blue-300/10 blur-3xl" style={{ animationDelay: '1s', animationDuration: '6s' }}></div>
            <div className="absolute top-1/2 left-0 h-64 w-64 animate-float rounded-full bg-white/5 blur-3xl" style={{ animationDelay: '2s', animationDuration: '8s' }}></div>
            <div className="absolute bottom-1/4 left-1/2 h-80 w-80 animate-float rounded-full bg-blue-200/10 blur-3xl" style={{ animationDelay: '0.5s', animationDuration: '7s' }}></div>
            
            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
            
            {/* Animated gradient mesh */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute h-full w-full animate-spin-slow" style={{
                background: 'conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
              }}></div>
            </div>
            
            {/* Light beams */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 left-0 h-full w-full animate-pulse-slow opacity-10" style={{
                background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                animationDuration: '4s'
              }}></div>
            </div>
          </div>

          <div className="container-custom relative z-10">
            <div className="mb-16 text-center animate-fade-in-up">
              <span className="mb-4 inline-block rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                Trusted By Healthcare Providers
              </span>
              <h2 className="mb-6 font-display font-bold text-white">
                What Our <span className="bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">Customers Say</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard key={index} testimonial={testimonial} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <ValuesSection />

        {/* Partners Section */}
        <section id="partners" className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 py-12 sm:py-16 md:py-24 px-4" aria-label="Our Partners">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Floating orbs */}
            <div className="absolute top-0 left-1/4 h-96 w-96 animate-float rounded-full bg-white/5 blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 h-96 w-96 animate-float rounded-full bg-blue-300/10 blur-3xl" style={{ animationDelay: '1s', animationDuration: '6s' }}></div>
            <div className="absolute top-1/2 left-0 h-64 w-64 animate-float rounded-full bg-white/5 blur-3xl" style={{ animationDelay: '2s', animationDuration: '8s' }}></div>
            <div className="absolute bottom-1/4 left-1/2 h-80 w-80 animate-float rounded-full bg-blue-200/10 blur-3xl" style={{ animationDelay: '0.5s', animationDuration: '7s' }}></div>
            
            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
            
            {/* Animated gradient mesh */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute h-full w-full animate-spin-slow" style={{
                background: 'conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
              }}></div>
            </div>
            
            {/* Light beams */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 left-0 h-full w-full animate-pulse-slow opacity-10" style={{
                background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
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
                Trusted <span className="bg-gradient-to-r from-blue-200 to-white bg-clip-text text-transparent">Partners</span>
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
        <section id="contact" className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 py-20 px-4" aria-label="Contact">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Floating orbs */}
            <div className="absolute top-0 left-1/4 h-96 w-96 animate-float rounded-full bg-white/5 blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 h-96 w-96 animate-float rounded-full bg-blue-300/10 blur-3xl" style={{ animationDelay: '1s', animationDuration: '6s' }}></div>
            <div className="absolute top-1/2 left-0 h-64 w-64 animate-float rounded-full bg-white/5 blur-3xl" style={{ animationDelay: '2s', animationDuration: '8s' }}></div>
            <div className="absolute bottom-1/4 left-1/2 h-80 w-80 animate-float rounded-full bg-blue-200/10 blur-3xl" style={{ animationDelay: '0.5s', animationDuration: '7s' }}></div>
            
            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]"></div>
            
            {/* Animated gradient mesh */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute h-full w-full animate-spin-slow" style={{
                background: 'conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
              }}></div>
            </div>
            
            {/* Light beams */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 left-0 h-full w-full animate-pulse-slow opacity-10" style={{
                background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
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
                  Located at Cullen Road, Pitchu Iyer Junction, Alappuzha - 688 001. Contact us today for reliable pharmaceutical distribution services. Our team is ready to serve you with excellence, dedication, and a commitment to quality healthcare delivery.
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
                  
                  <div>
                    <h3 className="mb-3 text-lg font-semibold text-white">Email</h3>
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-white/80 transition-colors hover:text-white"
                    >
                      {contact.email}
                    </a>
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

