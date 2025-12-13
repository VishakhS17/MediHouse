'use client'

import { useState } from 'react'

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  // Format phone number for WhatsApp (remove spaces, add country code if needed)
  const formatPhoneNumber = (phone: string): string => {
    // Remove all spaces and non-digit characters
    const cleaned = phone.replace(/\D/g, '')
    // If it doesn't start with country code, assume India (+91)
    if (cleaned.length === 10) {
      return '91' + cleaned
    }
    // If it already has country code, return as is
    return cleaned
  }

  // Generate WhatsApp message for contact form
  const generateWhatsAppMessage = (): string => {
    let message = `Hello! I would like to get in touch.\n\n`
    message += `*Contact Form Submission:*\n`
    message += `━━━━━━━━━━━━━━━━━━━━\n`
    message += `Name: ${formData.name}\n`
    message += `Phone: ${formData.phone}\n`
    message += `\n`
    message += `*Message:*\n`
    message += `━━━━━━━━━━━━━━━━━━━━\n`
    message += `${formData.message}\n\n`
    message += `Thank you!`
    
    return message
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')

    try {
      // Use the same WhatsApp number as ordering
      const phoneNumber = formatPhoneNumber('9497449918')
      const message = generateWhatsAppMessage()
      const encodedMessage = encodeURIComponent(message)
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
      
      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank')
      
      setStatus('success')
      setFormData({ name: '', phone: '', message: '' })
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setStatus('idle')
      }, 3000)
    } catch (error) {
      setStatus('error')
      // Reset error status after 3 seconds
      setTimeout(() => {
        setStatus('idle')
      }, 3000)
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
          className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-base text-white placeholder-white/50 backdrop-blur-sm focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 touch-manipulation"
          aria-required="true"
          placeholder="Your name"
        />
      </div>

      <div>
        <label htmlFor="phone" className="mb-2 block font-semibold text-white">
          Phone <span className="text-red-400">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          required
          value={formData.phone}
          onChange={handleChange}
          className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-base text-white placeholder-white/50 backdrop-blur-sm focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 touch-manipulation"
          aria-required="true"
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
          rows={5}
          value={formData.message}
          onChange={handleChange}
          className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-base text-white placeholder-white/50 backdrop-blur-sm focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 touch-manipulation"
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
          There was an error. Please try again.
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="group relative overflow-hidden w-full rounded-xl bg-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-bold text-primary-600 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] touch-manipulation"
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
          JavaScript is disabled. Please contact us via phone.
        </p>
      </noscript>
    </form>
  )
}

