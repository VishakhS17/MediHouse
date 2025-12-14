import Head from 'next/head'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import SEO from '@/components/SEO'
import StructuredData from '@/components/StructuredData'
import { generatePageMeta } from '@/lib/siteMeta'
import { contact, companyInfo } from '@/data/site'

export default function MedicineWholesaleKerala() {
  const meta = generatePageMeta({
    title: 'Medicine Wholesale Supplier Kerala | Bulk Medicine Supply – Medi-House',
    description:
      'Leading medicine wholesale supplier in Kerala. Bulk medicine procurement for hospitals and medical stores. Competitive pricing, real-time stock, and reliable delivery across Alappuzha and Kerala.',
    keywords: 'medicine wholesale supplier Kerala, bulk medicine supplier Kerala, wholesale medicine distributor Kerala, hospital medicine supplier Kerala, medical store wholesale Kerala',
  })

  return (
    <>
      <SEO meta={meta} canonicalPath="/medicine-wholesale-kerala" />
      <StructuredData />
      <Header />
      <main>
        <article className="relative overflow-hidden bg-gradient-to-b from-white via-ocean-aqua/10 to-ocean-sky/10 py-20 px-4">
          <div className="container-custom relative z-10 max-w-4xl mx-auto">
            {/* Header */}
            <header className="mb-12 text-center">
              <h1 className="mb-6 font-display font-black text-4xl sm:text-5xl md:text-6xl text-gray-900">
                Medicine Wholesale Supplier in Kerala
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Reliable bulk medicine supply and wholesale distribution services for hospitals, clinics, and medical stores across Kerala.
              </p>
            </header>

            {/* Main Content */}
            <div className="prose prose-lg max-w-none mb-12">
              <section className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Professional Medicine Wholesale Services in Kerala</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  As a trusted medicine wholesale supplier in Kerala, medi-house specializes in bulk medicine procurement and distribution for hospitals, clinics, and medical stores. Based in Alappuzha, we serve customers across Kerala with competitive pricing and reliable service.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Our extensive network and partnerships with leading pharmaceutical manufacturers enable us to offer comprehensive wholesale medicine solutions. Whether you're a large hospital requiring bulk supplies or a medical store needing regular inventory, we have the capacity and expertise to meet your needs.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Benefits of Choosing Our Medicine Wholesale Service</h2>
                <ul className="list-disc list-inside space-y-3 text-gray-700 mb-6">
                  <li><strong>Competitive Pricing:</strong> Better margins for medical stores and hospitals through our wholesale rates</li>
                  <li><strong>Wide Product Range:</strong> Access to medicines from leading pharmaceutical companies including Aristo, Blue Cross, JB Chemicals, RPG Life, Indoco, and more</li>
                  <li><strong>Real-Time Stock Visibility:</strong> Check product availability instantly through our online platform</li>
                  <li><strong>Bulk Order Support:</strong> Specialized handling for large orders from hospitals and healthcare facilities</li>
                  <li><strong>Cold Chain Compliance:</strong> Proper storage and handling of temperature-sensitive medications</li>
                  <li><strong>Reliable Delivery:</strong> Daily delivery services and courier partnerships for timely supply</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Serving Hospitals and Medical Stores Across Kerala</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Our medicine wholesale services cater to diverse healthcare providers. For hospitals, we offer bulk procurement solutions with flexible payment terms and dedicated account management. For medical stores, we provide regular inventory supplies with competitive pricing that helps improve profit margins.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                  With over 720 satisfied customers and 12+ years of experience, we understand the unique needs of different healthcare providers. Our team of five salesmen and one van salesman ensures personalized service and support for every customer.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">How Medical Stores Can Get Better Margins in Kerala</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  As a medicine wholesale supplier in Kerala, we help medical stores improve their profitability through:
                </p>
                <ul className="list-disc list-inside space-y-3 text-gray-700 mb-6">
                  <li>Competitive wholesale pricing that leaves room for retail margins</li>
                  <li>Regular stock availability reduces lost sales due to out-of-stock situations</li>
                  <li>Efficient ordering process saves time and operational costs</li>
                  <li>Real-time stock visibility helps optimize inventory levels</li>
                  <li>Reliable delivery ensures continuous operations without stockouts</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Bulk Medicine Procurement for Hospitals in Kerala</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Hospitals require large volumes of medicines and healthcare supplies. As a leading medicine wholesale supplier in Kerala, we offer:
                </p>
                <ul className="list-disc list-inside space-y-3 text-gray-700 mb-6">
                  <li>Volume-based pricing for bulk orders</li>
                  <li>Dedicated account management for large hospital clients</li>
                  <li>Flexible payment terms suitable for institutional buyers</li>
                  <li>Comprehensive range of hospital supplies and medical equipment</li>
                  <li>Cold chain facility for temperature-sensitive medications</li>
                  <li>Scheduled delivery services tailored to hospital requirements</li>
                </ul>
              </section>

              <section className="mb-10 bg-gradient-to-br from-ocean-cyan/10 to-ocean-royal/10 p-8 rounded-lg border border-ocean-cyan/20">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Started with Our Medicine Wholesale Service</h2>
                <p className="text-gray-700 leading-relaxed mb-6">
                  Located at {contact.address}, medi-house is your trusted medicine wholesale supplier in Kerala. Contact us today to discuss your wholesale medicine needs, request pricing information, or place a bulk order.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-ocean-cyan to-ocean-royal text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                  >
                    Browse Product Catalog
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

