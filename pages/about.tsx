import Head from 'next/head'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import SEO from '@/components/SEO'
import StructuredData from '@/components/StructuredData'
import { generatePageMeta } from '@/lib/siteMeta'
import { contact, companyInfo, services, partners } from '@/data/site'

export default function About() {
  const meta = generatePageMeta({
    title: 'About Us | Pharmaceutical Distributor in Alappuzha, Kerala – Medi-House',
    description:
      'Learn about medi-house, a trusted pharmaceutical distributor in Alappuzha, Kerala since 2011. Serving 720+ customers with excellence, cold chain facilities, and comprehensive distribution services.',
    keywords: 'about medi-house, pharmaceutical distributor Alappuzha, pharma company Kerala, medicine distributor Alappuzha history',
  })

  return (
    <>
      <SEO meta={meta} canonicalPath="/about" />
      <StructuredData />
      <Header />
      <main>
        <article className="relative overflow-hidden bg-gradient-to-b from-white via-ocean-aqua/10 to-ocean-sky/10 py-20 px-4">
          <div className="container-custom relative z-10 max-w-4xl mx-auto">
            {/* Header */}
            <header className="mb-12 text-center">
              <h1 className="mb-6 font-display font-black text-4xl sm:text-5xl md:text-6xl text-gray-900">
                About Medi-House
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Your Trusted Pharmaceutical Distribution Partner in Alappuzha, Kerala
              </p>
            </header>

            {/* Main Content */}
            <div className="prose prose-lg max-w-none mb-12">
              <section className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Leading Pharmaceutical Distributor in Alappuzha, Kerala</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Located at {contact.address}, medi-house has been a leading pharmaceutical distributor in Alappuzha, Kerala since 2011. Over the past 12+ years, we have established ourselves as a trusted partner in healthcare delivery, serving the community with dedication and excellence.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  {companyInfo.intro}
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  {companyInfo.detailedIntro}
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Vision and Mission</h2>
                <div className="bg-gradient-to-br from-ocean-cyan/10 to-ocean-royal/10 p-6 rounded-lg border border-ocean-cyan/20 mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Our Vision</h3>
                  <p className="text-gray-700 leading-relaxed">{companyInfo.vision}</p>
                </div>
                <div className="bg-gradient-to-br from-ocean-aqua/10 to-ocean-sky/10 p-6 rounded-lg border border-ocean-aqua/20">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Our Mission</h3>
                  <p className="text-gray-700 leading-relaxed">{companyInfo.mission}</p>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Values</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {companyInfo.values.map((value, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-ocean-sky/20">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                      <p className="text-gray-600">{value.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Capabilities and Services</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  As a pharmaceutical distributor in Alappuzha, Kerala, we offer comprehensive services to meet all your healthcare distribution needs:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
                  {companyInfo.capabilities.map((capability, index) => (
                    <li key={index}>{capability}</li>
                  ))}
                </ul>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Our services include pharmaceutical distribution, hospital supplies, cold chain facility, daily delivery services, and comprehensive coverage of Alappuzha and suburbs.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Trusted Partners</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We are proud to partner with leading pharmaceutical companies including {partners.map(p => p.name).join(', ')}. These partnerships enable us to offer a comprehensive range of medicines and healthcare products, ensuring that our customers have access to quality products from trusted manufacturers.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Medi-House in Alappuzha, Kerala?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-md border border-ocean-sky/20">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">12+ Years of Experience</h3>
                    <p className="text-gray-600">Proven track record in pharmaceutical distribution across Alappuzha, Kerala</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md border border-ocean-sky/20">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">720+ Satisfied Customers</h3>
                    <p className="text-gray-600">Large customer base across medical stores, hospitals, and clinics in Kerala</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md border border-ocean-sky/20">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">State-of-the-Art Facilities</h3>
                    <p className="text-gray-600">Cold chain facility and modern infrastructure for quality assurance</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-md border border-ocean-sky/20">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Comprehensive Coverage</h3>
                    <p className="text-gray-600">Whole of Alappuzha and suburbs with dedicated sales team and delivery network</p>
                  </div>
                </div>
              </section>

              <section className="mb-10 bg-gradient-to-br from-ocean-cyan/10 to-ocean-royal/10 p-8 rounded-lg border border-ocean-cyan/20">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Visit us at {contact.address} or contact us via phone or WhatsApp. Our team is ready to serve you with excellence and dedication.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-ocean-cyan to-ocean-royal text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    View Products
                  </Link>
                  <a
                    href={`tel:${contact.mobile[0].replace(/\s/g, '')}`}
                    className="inline-flex items-center justify-center px-6 py-3 bg-white border-2 border-ocean-cyan text-ocean-royal font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    Call: {contact.mobile[0]}
                  </a>
                </div>
              </section>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}

