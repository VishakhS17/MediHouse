'use client'

import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    question: 'What areas do you serve?',
    answer: 'We cover the whole of Alappuzha and its suburbs, ensuring timely delivery of medicines and healthcare products to all our customers.',
  },
  {
    question: 'Do you have a cold chain facility?',
    answer: 'Yes, we maintain a state-of-the-art cold chain facility to ensure proper storage and handling of temperature-sensitive medications.',
  },
  {
    question: 'What are your delivery options?',
    answer: 'We offer daily delivery services throughout Alappuzha. We also have a strategic tie-up with Tracon Courier for efficient and reliable delivery services.',
  },
  {
    question: 'How can I place an order?',
    answer: 'You can contact us via phone, email, or through our contact form. Our team of five salesmen and one van salesman are ready to assist you.',
  },
  {
    question: 'What pharmaceutical companies do you partner with?',
    answer: 'We partner with leading pharmaceutical companies including Aristo, Blue Cross, JB Chemicals, RPG Life, Indoco, Lividus, Win Medi Care, and Chethana.',
  },
  {
    question: 'How long have you been in business?',
    answer: 'Medi House has been serving the Alappuzha community for over 12 years, establishing ourselves as a trusted partner in healthcare delivery.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="relative overflow-hidden bg-gradient-to-b from-white via-ocean-aqua/10 to-ocean-sky/10 py-24 px-4" aria-label="Frequently Asked Questions">
      {/* Angular Geometric Border at Top */}
      <div className="absolute top-0 left-0 right-0 h-32 overflow-hidden">
        <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
          <path 
            d="M0,0 L0,80 L150,100 L300,120 L450,110 L600,130 L750,115 L900,135 L1050,125 L1200,140 L1200,0 Z" 
            fill="#ffffff" 
            opacity="1"
          />
        </svg>
      </div>

      {/* Diagonal Stripe Pattern */}
      <div className="absolute inset-0 overflow-hidden opacity-6">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          background: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 60px,
            rgba(59, 180, 232, 0.05) 60px,
            rgba(59, 180, 232, 0.05) 120px
          )`
        }}></div>
      </div>

      {/* Angular Geometric Border at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
        <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
          <path 
            d="M0,200 L0,120 L150,100 L300,80 L450,90 L600,70 L750,85 L900,65 L1050,75 L1200,60 L1200,200 Z" 
            fill="#ffffff" 
            opacity="1"
          />
        </svg>
      </div>

      <div className="container-custom relative z-10">
        <div className="mb-16 text-center animate-fade-in-up">
          <span className="mb-4 inline-block rounded-full bg-gradient-to-r from-ocean-cyan/20 via-ocean-aqua/20 to-ocean-sky/20 px-4 py-2 text-sm font-semibold text-ocean-royal border border-ocean-cyan/30">
            Common Questions
          </span>
          <h2 className="mb-6 font-display font-bold text-gray-900">
            Frequently Asked <span className="bg-gradient-to-r from-ocean-cyan via-ocean-teal to-ocean-royal bg-clip-text text-transparent">Questions</span>
          </h2>
        </div>

        <div className="mx-auto max-w-3xl space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="group overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-xl border border-ocean-sky/20 hover:border-ocean-cyan/40"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-ocean-aqua/10"
                aria-expanded={openIndex === index}
              >
                <span className="text-lg font-semibold bg-gradient-to-r from-ocean-royal via-ocean-teal to-ocean-cyan bg-clip-text text-transparent">{faq.question}</span>
                <svg
                  className={`h-5 w-5 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: '#3BB4E8' }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-6 text-gray-600">{faq.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

