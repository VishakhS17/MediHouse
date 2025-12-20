import { contact, siteConfig } from '@/data/site'

export default function StructuredData() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medi-house.in'
  
  // LocalBusiness Schema
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'Pharmacy',
    name: siteConfig.name,
    image: `${siteUrl}/logo.svg`,
    '@id': siteUrl,
    url: siteUrl,
    telephone: contact.mobile[0].replace(/\s/g, ''),
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: contact.address.split(',')[0],
      addressLocality: 'Alappuzha',
      addressRegion: 'Kerala',
      postalCode: '688001',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 9.49857868142185,
      longitude: 76.3355502109359,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '18:00',
    },
    areaServed: {
      '@type': 'City',
      name: 'Alappuzha',
    },
    serviceArea: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: 9.49857868142185,
        longitude: 76.3355502109359,
      },
      geoRadius: {
        '@type': 'Distance',
        name: 'Alappuzha and suburbs',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '720',
    },
    sameAs: [
      `https://maps.app.goo.gl/H3ST3t3qWFtc8SVP8`,
    ],
  }

  // Organization Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteUrl,
    logo: `${siteUrl}/logo.svg`,
    description: siteConfig.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: contact.address.split(',')[0],
      addressLocality: 'Alappuzha',
      addressRegion: 'Kerala',
      postalCode: '688001',
      addressCountry: 'IN',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: contact.mobile[0].replace(/\s/g, ''),
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['English', 'Malayalam'],
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
    </>
  )
}










