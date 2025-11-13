'use client'

import { useState } from 'react'
import { contact } from '@/data/site'

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')

    // Formspree endpoint - replace with your Formspree form ID
    const formId = process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID || 'YOUR_FORM_ID'
    const formspreeUrl = `https://formspree.io/f/${formId}`

    try {
      const response = await fetch(formspreeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setStatus('success')
        setFormData({ name: '', email: '', phone: '', message: '' })
      } else {
        setStatus('error')
      }
    } catch (error) {
      // Fallback to mailto if Formspree fails
      const mailtoLink = `mailto:${contact.email}?subject=Website Contact&body=${encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\n\nMessage:\n${formData.message}`
      )}`
      window.location.href = mailtoLink
      setStatus('success')
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      aria-label="Contact form"
      noValidate
    >
      <div>
        <label htmlFor="name" className="mb-2 block font-semibold text-white">
          Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 backdrop-blur-sm focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-required="true"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-2 block font-semibold text-white">
          Email <span className="text-red-400">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          value={formData.email}
          onChange={handleChange}
          className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 backdrop-blur-sm focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-required="true"
          placeholder="your.email@example.com"
        />
      </div>

      <div>
        <label htmlFor="phone" className="mb-2 block font-semibold text-white">
          Phone
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 backdrop-blur-sm focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
          placeholder="+91 1234567890"
        />
      </div>

      <div>
        <label htmlFor="message" className="mb-2 block font-semibold text-white">
          Message <span className="text-red-400">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          value={formData.message}
          onChange={handleChange}
          className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 backdrop-blur-sm focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-required="true"
          placeholder="Your message..."
        />
      </div>

      {status === 'success' && (
        <div className="rounded-lg bg-green-500/20 border border-green-400/50 p-4 text-green-100" role="alert">
          Thank you! Your message has been sent successfully.
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-lg bg-red-500/20 border border-red-400/50 p-4 text-red-100" role="alert">
          There was an error sending your message. Please try again or email us
          directly.
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="group relative overflow-hidden w-full rounded-xl bg-white px-8 py-4 text-lg font-bold text-primary-600 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
        aria-busy={status === 'submitting'}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {status === 'submitting' ? 'Sending...' : 'Send Message'}
          {status !== 'submitting' && (
            <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          )}
        </span>
        <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-primary-50 to-transparent transition-transform duration-700 group-hover:translate-x-[100%]"></div>
      </button>

      <noscript>
        <p className="text-sm text-white/80">
          JavaScript is disabled. Please{' '}
          <a
            href={`mailto:${contact.email}?subject=Website Contact`}
            className="text-white underline hover:text-white"
          >
            email us directly
          </a>
          .
        </p>
      </noscript>
    </form>
  )
}

