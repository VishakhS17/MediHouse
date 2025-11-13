export interface Contact {
  address: string
  mobile: string[]
  email: string
  office: string[]
}

export interface Partner {
  name: string
  logo: string
  alt: string
}

export interface Service {
  title: string
  description: string
  icon: string
}

export const siteConfig = {
  name: 'Medi House',
  tagline: 'Leading Pharmaceutical Distribution in Alappuzha',
  location: 'Alappuzha',
  description:
    'Medi House is a leading firm in Alappuzha that has been creating waves for over 12 years in pharmaceutical distribution, serving the community with dedication and excellence.',
}

export const companyInfo = {
  intro:
    'Medi House is a leading firm in Alappuzha that has been creating waves for over 12 years in pharmaceutical distribution. We have established ourselves as a trusted partner in healthcare delivery, serving the community with dedication and excellence.',
  detailedIntro:
    'Since our establishment, Medi House has been at the forefront of pharmaceutical distribution in Alappuzha. With a dedicated team of five salesmen and one van salesman, we cover the whole of Alappuzha and suburbs, ensuring timely and reliable delivery of medicines and healthcare products. Our customer base exceeds 480 satisfied clients, a testament to our commitment to quality service and customer satisfaction.',
  vision: 'To serve the needy, thereby serve them with satisfaction and relief too.',
  mission:
    'To be the most reliable pharmaceutical distribution partner in Alappuzha, ensuring timely and quality healthcare products reach every corner of the region. We strive to maintain the highest standards in pharmaceutical distribution while building lasting relationships with our customers, partners, and the community.',
  values: [
    {
      title: 'Reliability',
      description:
        'Consistent and dependable service delivery to all our partners and customers.',
    },
    {
      title: 'Innovation',
      description:
        'Embracing modern practices and technologies to enhance our distribution network.',
    },
    {
      title: 'Consistency',
      description:
        'Maintaining uniform quality and service standards across all operations.',
    },
    {
      title: 'Perseverance',
      description:
        'Resilient commitment to overcoming challenges and achieving excellence.',
    },
    {
      title: 'Loyalty',
      description:
        'Building lasting relationships with customers, partners, and the community.',
    },
  ],
  capabilities: [
    'Team of five salesmen and one van salesman covering whole of Alappuzha and suburbs',
    'Customer base exceeding 480 satisfied clients',
    'Cold chain facility ensuring proper storage of temperature-sensitive medications',
    'Tie-up with Tracon Courier for efficient and reliable delivery services',
    'Daily delivery services to major areas in Alappuzha',
    'Comprehensive hospital supplies distribution',
  ],
}

export const contact: Contact = {
  address: 'Cullen Road, Pitchu Iyer Junction, Alappuzha - 688 001',
  mobile: ['75948 99099', '98470 28510'],
  email: 'medihousealpy@gmail.com',
  office: ['9947 123450', '6235 123450'],
}

export const partners: Partner[] = [
  { name: 'Aristo', logo: '/partners/aristo.svg', alt: 'Aristo Pharmaceuticals' },
  {
    name: 'Blue Cross',
    logo: '/partners/blue-cross.svg',
    alt: 'Blue Cross Laboratories',
  },
  {
    name: 'JB Chemicals',
    logo: '/partners/jb-chemicals.svg',
    alt: 'JB Chemicals & Pharmaceuticals',
  },
  {
    name: 'RPG Life',
    logo: '/partners/rpg-life.svg',
    alt: 'RPG Life Sciences',
  },
  {
    name: 'Indoco',
    logo: '/partners/indoco.svg',
    alt: 'Indoco Remedies',
  },
  { name: 'Lividus', logo: '/partners/lividus.svg', alt: 'Lividus Pharmaceuticals' },
  {
    name: 'Win Medi Care',
    logo: '/partners/win-medi-care.svg',
    alt: 'Win Medi Care',
  },
  { name: 'Chethana', logo: '/partners/chethana.svg', alt: 'Chethana Pharmaceuticals' },
]

export const services: Service[] = [
  {
    title: 'Pharmaceutical Distribution',
    description:
      'Comprehensive distribution network covering Alappuzha and suburbs with a dedicated team ensuring timely delivery of medicines and healthcare products.',
    icon: '💊',
  },
  {
    title: 'Hospital Supplies',
    description:
      'Complete range of hospital supplies and medical equipment to support healthcare facilities across the region.',
    icon: '🏥',
  },
  {
    title: 'Cold Chain Facility',
    description:
      'State-of-the-art cold chain storage ensuring proper handling and distribution of temperature-sensitive medications.',
    icon: '❄️',
  },
  {
    title: 'Daily Delivery Services',
    description:
      'Reliable daily delivery services to pharmacies, hospitals, and clinics throughout Alappuzha and surrounding areas.',
    icon: '🚚',
  },
  {
    title: 'Courier Tie-ups',
    description:
      'Strategic partnership with Tracon Courier for efficient and secure delivery of pharmaceutical products.',
    icon: '📦',
  },
  {
    title: 'Wide Coverage',
    description:
      'Extensive coverage area including whole of Alappuzha and suburbs, serving over 480 satisfied customers.',
    icon: '🗺️',
  },
]

export const socialLinks = {
  email: 'medihousealpy@gmail.com',
}

export interface Testimonial {
  name: string
  role?: string
  company?: string
  content: string
  rating?: number
}

export const testimonials: Testimonial[] = [
  {
    name: 'Dr. Ramesh Kumar',
    role: 'Pharmacy Owner',
    company: 'Health Care Pharmacy',
    content:
      'Medi House has been our trusted partner for over 5 years. Their timely delivery and quality service have helped us serve our customers better. Highly reliable!',
    rating: 5,
  },
  {
    name: 'Lakshmi Menon',
    role: 'Hospital Administrator',
    company: 'City Medical Centre',
    content:
      'The cold chain facility and professional service from Medi House ensures we always receive medications in perfect condition. Excellent partnership!',
    rating: 5,
  },
  {
    name: 'Suresh Pillai',
    role: 'Clinic Owner',
    content:
      'Daily delivery service covering all of Alappuzha makes Medi House our preferred distributor. Their team is professional and responsive to our needs.',
    rating: 5,
  },
  {
    name: 'Anitha Nair',
    role: 'Pharmacy Manager',
    content:
      'What sets Medi House apart is their commitment to quality and customer satisfaction. They understand our requirements and deliver consistently.',
    rating: 5,
  },
]

