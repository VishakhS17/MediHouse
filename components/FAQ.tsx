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
    <section id="faq" className="relative overflow-hidden bg-gradient-to-b from-white via-gray-50 to-white py-24 px-4" aria-label="Frequently Asked Questions">
      <div className="container-custom relative z-10">
        <div className="mb-16 text-center animate-fade-in-up">
          <span className="mb-4 inline-block rounded-full bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-700">
            Common Questions
          </span>
          <h2 className="mb-6 font-display font-bold text-gray-900">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
        </div>

        <div className="mx-auto max-w-3xl space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="group overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-xl"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-primary-50"
                aria-expanded={openIndex === index}
              >
                <span className="text-lg font-semibold text-gray-900">{faq.question}</span>
                <svg
                  className={`h-5 w-5 text-primary-600 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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

