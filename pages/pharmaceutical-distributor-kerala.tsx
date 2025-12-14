import Head from 'next/head'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import SEO from '@/components/SEO'
import StructuredData from '@/components/StructuredData'
import { generatePageMeta } from '@/lib/siteMeta'
import { contact, companyInfo, services } from '@/data/site'

export default function PharmaceuticalDistributorKerala() {
  const meta = generatePageMeta({
    title: 'Pharmaceutical Distributor in Kerala | Medi-House Alappuzha',
    description:
      'Leading pharmaceutical distributor in Kerala serving medical stores and hospitals across Alappuzha. Real-time stock availability, bulk medicine supply, and reliable cold chain facilities. Contact us today.',
    keywords: 'pharmaceutical distributor Kerala, pharma distributor Alappuzha, medicine distributor Kerala, pharmaceutical distribution Kerala, bulk medicine supplier Kerala',
  })

  return (
    <>
      <SEO meta={meta} canonicalPath="/pharmaceutical-distributor-kerala" />
      <StructuredData />
      <Header />
      <main>
        <article className="relative overflow-hidden bg-gradient-to-b from-white via-ocean-aqua/10 to-ocean-sky/10 py-20 px-4">
          <div className="container-custom relative z-10 max-w-4xl mx-auto">
            {/* Header */}
            <header className="mb-12 text-center">
              <h1 className="mb-6 font-display font-black text-4xl sm:text-5xl md:text-6xl text-gray-900">
                Pharmaceutical Distributor in Kerala
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Trusted pharmaceutical distribution services across Kerala, specializing in Alappuzha and surrounding regions.
              </p>
            </header>

            {/* Main Content */}
            <div className="prose prose-lg max-w-none mb-12">
              <section className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Medi-House as Your Pharmaceutical Distributor in Kerala?</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  As a leading pharmaceutical distributor in Kerala, medi-house has been serving the healthcare industry since 2011. Based in Alappuzha, we have established ourselves as a trusted partner for medical stores, hospitals, and clinics throughout Kerala.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Our comprehensive distribution network covers the whole of Alappuzha and suburbs, ensuring timely delivery of medicines and healthcare products to over 720 satisfied customers. We understand the critical nature of pharmaceutical distribution and maintain the highest standards in every aspect of our operations.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Pharmaceutical Distribution Services</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {services.slice(0, 4).map((service, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-ocean-sky/20">
                      <div className="text-3xl mb-3">{service.icon}</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
                      <p className="text-gray-600">{service.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">State-of-the-Art Cold Chain Facility</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  One of our key differentiators as a pharmaceutical distributor in Kerala is our state-of-the-art cold chain facility. We ensure proper storage and handling of temperature-sensitive medications, maintaining 100% compliance with cold chain requirements. This commitment to quality ensures that all medications reach our customers in perfect condition.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Reliable Delivery Network Across Kerala</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Our dedicated team includes five salesmen and one van salesman, covering the whole of Alappuzha and suburbs. We offer daily delivery services to major areas, ensuring that medical stores and hospitals receive their orders promptly. Our strategic tie-up with Tracon Courier extends our reach and ensures efficient delivery services throughout the region.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Real-Time Stock Availability</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  As a modern pharmaceutical distributor in Kerala, we provide real-time stock visibility through our online platform. Medical stores and hospitals can check product availability instantly, place orders efficiently, and track their deliveries in real-time. This transparency helps our customers manage their inventory better and serve their patients effectively.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted Partnerships with Leading Pharma Companies</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We partner with leading pharmaceutical companies including Aristo, Blue Cross, JB Chemicals, RPG Life, Indoco, Lividus, Win Medi Care, and Chethana. These partnerships enable us to offer a comprehensive range of medicines and healthcare products, ensuring that our customers have access to everything they need from a single, reliable source.
                </p>
              </section>

              <section className="mb-10 bg-gradient-to-br from-ocean-cyan/10 to-ocean-royal/10 p-8 rounded-lg border border-ocean-cyan/20">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact Your Pharmaceutical Distributor in Kerala</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  Located at {contact.address}, medi-house is your trusted pharmaceutical distributor in Kerala. Contact us today via phone or WhatsApp to discuss your distribution needs, check stock availability, or place an order.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-ocean-cyan to-ocean-royal text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    View Product Catalog
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

