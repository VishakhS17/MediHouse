import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import { generatePageMeta } from '@/lib/siteMeta'
import { useCart } from '@/lib/cart'
import { contact } from '@/data/site'

interface CustomerDetails {
  name: string
  phone: string
  address: string
  email?: string
}

export default function Cart() {
  const { items, updateQuantity, removeFromCart, clearCart, getTotalItems } = useCart()
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [inputValues, setInputValues] = useState<Record<string, string>>({})
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    phone: '',
    address: '',
    email: '',
  })
  const [formErrors, setFormErrors] = useState<Partial<CustomerDetails>>({})

  const meta = generatePageMeta({
    title: 'Cart',
    description: 'Review your selected products and quantities.',
  })

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

  // Generate WhatsApp message with cart items and customer details
  const generateWhatsAppMessage = (customer: CustomerDetails): string => {
    const totalItems = getTotalItems()
    
    let message = `Hello! I would like to place an order.\n\n`
    
    // Customer Details Section
    message += `*Customer Details:*\n`
    message += `━━━━━━━━━━━━━━━━━━━━\n`
    message += `Name: ${customer.name}\n`
    message += `Phone: ${customer.phone}\n`
    message += `Address: ${customer.address}\n`
    if (customer.email) {
      message += `Email: ${customer.email}\n`
    }
    message += `\n`
    
    // Order Details Section
    message += `*Order Details:*\n`
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`
    
    items.forEach((item, index) => {
      message += `${index + 1}. *${item.name}*\n`
      message += `   Brand: ${item.manufacturer}\n`
      message += `   Quantity: ${item.quantity}\n\n`
    })
    
    message += `━━━━━━━━━━━━━━━━━━━━\n`
    message += `*Total Items: ${totalItems}*\n\n`
    message += `Please confirm availability and delivery details.\n\n`
    message += `Thank you!`
    
    return message
  }

  // Validate customer details form
  const validateForm = (): boolean => {
    const errors: Partial<CustomerDetails> = {}
    
    if (!customerDetails.name.trim()) {
      errors.name = 'Name is required'
    }
    
    if (!customerDetails.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!/^[0-9]{10}$/.test(customerDetails.phone.replace(/\D/g, ''))) {
      errors.phone = 'Please enter a valid 10-digit phone number'
    }
    
    if (!customerDetails.address.trim()) {
      errors.address = 'Address is required'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Get WhatsApp URL
  const getWhatsAppUrl = (customer: CustomerDetails): string => {
    // Use specific WhatsApp number
    const phoneNumber = formatPhoneNumber('9961042506')
    const message = generateWhatsAppMessage(customer)
    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`
  }

  const handlePlaceOrderClick = () => {
    if (items.length === 0) {
      alert('Your cart is empty. Please add products before placing an order.')
      return
    }
    
    // Show customer details form
    setShowCustomerForm(true)
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    // Update stock in database before opening WhatsApp
    try {
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: customerDetails.name,
          customerPhone: customerDetails.phone,
          customerAddress: customerDetails.address,
          customerEmail: customerDetails.email,
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            manufacturer: item.manufacturer,
            quantity: item.quantity,
          })),
        }),
      })

      const orderData = await orderResponse.json()

      if (!orderResponse.ok) {
        alert(`Error processing order: ${orderData.message || 'Unknown error'}`)
        return
      }

      // Check for stock errors
      if (orderData.errors && orderData.errors.length > 0) {
        const errorMessage = orderData.errors.join('\n')
        alert(`Some items could not be processed:\n\n${errorMessage}\n\nPlease check stock availability.`)
        // Still proceed to WhatsApp but warn user
      }

      // Open WhatsApp with customer details and order
      window.open(getWhatsAppUrl(customerDetails), '_blank')
      
      // Close form and clear cart after order
      setShowCustomerForm(false)
      clearCart()
    } catch (error: any) {
      console.error('Error processing order:', error)
      alert('Error processing order. Please try again or contact support.')
    }
  }

  const handleInputChange = (field: keyof CustomerDetails, value: string) => {
    setCustomerDetails(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <>
      <SEO meta={meta} />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header />
      <main id="main-content" role="main" className="pt-24">
        <section className="relative overflow-hidden py-12 px-4 bg-gradient-to-b from-white via-ocean-aqua/20 to-ocean-sky/10 min-h-screen">
          <div className="container-custom relative z-10">
            <div className="mb-6 sm:mb-8 text-center animate-fade-in-up px-2">
              <span className="mb-4 inline-block rounded-full bg-gradient-to-r from-ocean-cyan/20 via-ocean-aqua/20 to-ocean-sky/20 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-ocean-royal border border-ocean-cyan/30">
                Your Selection
              </span>
              <h1 className="mb-4 sm:mb-6 font-display font-bold text-gray-900 text-2xl sm:text-4xl md:text-5xl">
                Shopping <span className="bg-gradient-to-r from-ocean-cyan via-ocean-teal to-ocean-royal bg-clip-text text-transparent">Cart</span>
              </h1>
            </div>

            {getTotalItems() === 0 ? (
              <div className="max-w-2xl mx-auto text-center py-8 sm:py-12 px-4">
                <div className="mb-4 sm:mb-6">
                  <svg className="w-16 h-16 sm:w-24 sm:h-24 mx-auto text-gray-300" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Your cart is empty</h2>
                <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">Start adding products to your cart from our inventory.</p>
                <Link
                  href="/products"
                  className="inline-block bg-ocean-cyan text-white px-6 py-3 rounded-lg hover:bg-ocean-teal transition-colors font-medium text-sm sm:text-base touch-manipulation min-h-[44px] flex items-center justify-center"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto px-2 sm:px-0">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'} in cart
                    </h2>
                    <button
                      onClick={clearCart}
                      className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium touch-manipulation px-2 py-1 min-h-[44px] flex items-center"
                    >
                      Clear Cart
                    </button>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {items.map((item) => {
                      const inputValue = inputValues[item.id] !== undefined ? inputValues[item.id] : item.quantity.toString()
                      
                      return (
                      <div key={item.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                          <div className="flex-1 w-full min-w-0">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 break-words">{item.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-500 mb-4">{item.manufacturer}</p>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                              <div className="flex items-center justify-center sm:justify-start space-x-2">
                                <button
                                  onClick={() => {
                                    const newQuantity = item.quantity - 1
                                    updateQuantity(item.id, newQuantity)
                                    setInputValues(prev => ({ ...prev, [item.id]: newQuantity.toString() }))
                                  }}
                                  className="px-4 py-2 min-w-[44px] border border-gray-300 rounded hover:bg-gray-50 touch-manipulation text-lg font-semibold"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={inputValue}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    // Store the raw input value to allow free typing
                                    setInputValues(prev => ({ ...prev, [item.id]: value }))
                                    
                                    // Only update cart if value is a valid number
                                    if (value !== '' && value !== '-') {
                                      const newQuantity = parseInt(value, 10)
                                      if (!isNaN(newQuantity) && newQuantity >= 0) {
                                        updateQuantity(item.id, newQuantity)
                                      }
                                    }
                                  }}
                                  onBlur={(e) => {
                                    // When input loses focus, ensure we have a valid quantity
                                    const value = e.target.value
                                    const numValue = parseInt(value, 10)
                                    
                                    if (value === '' || isNaN(numValue) || numValue < 0) {
                                      updateQuantity(item.id, 0)
                                      setInputValues(prev => ({ ...prev, [item.id]: '0' }))
                                    } else {
                                      updateQuantity(item.id, numValue)
                                      setInputValues(prev => ({ ...prev, [item.id]: numValue.toString() }))
                                    }
                                  }}
                                  onFocus={(e) => {
                                    // When input is focused, sync with current quantity
                                    setInputValues(prev => ({ ...prev, [item.id]: item.quantity.toString() }))
                                  }}
                                  className="w-20 px-2 py-2 border border-gray-300 rounded text-center text-base"
                                />
                                <button
                                  onClick={() => {
                                    const newQuantity = item.quantity + 1
                                    updateQuantity(item.id, newQuantity)
                                    setInputValues(prev => ({ ...prev, [item.id]: newQuantity.toString() }))
                                  }}
                                  className="px-4 py-2 min-w-[44px] border border-gray-300 rounded hover:bg-gray-50 touch-manipulation text-lg font-semibold"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                onClick={() => {
                                  removeFromCart(item.id)
                                  setInputValues(prev => {
                                    const newValues = { ...prev }
                                    delete newValues[item.id]
                                    return newValues
                                  })
                                }}
                                className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium touch-manipulation px-3 py-2 min-h-[44px] self-center sm:self-auto"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      )
                    })}
                  </div>

                  <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-base sm:text-lg font-semibold text-gray-900">Total Items:</span>
                      <span className="text-base sm:text-lg font-bold text-ocean-royal">{getTotalItems()}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:space-x-0">
                      <Link
                        href="/products"
                        className="flex-1 text-center border border-ocean-cyan text-ocean-cyan px-4 sm:px-6 py-3 rounded-lg hover:bg-ocean-cyan hover:text-white transition-colors font-medium text-sm sm:text-base touch-manipulation min-h-[44px] flex items-center justify-center"
                      >
                        Continue Shopping
                      </Link>
                      <button
                        onClick={handlePlaceOrderClick}
                        className="flex-1 bg-ocean-cyan text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-ocean-teal transition-colors font-medium flex items-center justify-center space-x-2 text-sm sm:text-base touch-manipulation min-h-[44px]"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        <span>Place Order via WhatsApp</span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-4 text-center">
                      Your cart is saved locally in your browser. No account required.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />

      {/* Customer Details Modal */}
      {showCustomerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Customer Details</h2>
                <button
                  onClick={() => setShowCustomerForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors touch-manipulation p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-2">Please provide your details to complete the order</p>
            </div>

            <form onSubmit={handleSubmitOrder} className="p-4 sm:p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={customerDetails.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-ocean-cyan focus:border-transparent ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={customerDetails.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-ocean-cyan focus:border-transparent ${
                    formErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your 10-digit phone number"
                />
                {formErrors.phone && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="address"
                  value={customerDetails.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-3 text-base border rounded-lg focus:ring-2 focus:ring-ocean-cyan focus:border-transparent ${
                    formErrors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your complete delivery address"
                />
                {formErrors.address && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  id="email"
                  value={customerDetails.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-cyan focus:border-transparent"
                  placeholder="Enter your email address"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCustomerForm(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base touch-manipulation min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-ocean-cyan text-white rounded-lg hover:bg-ocean-teal transition-colors font-medium flex items-center justify-center space-x-2 text-sm sm:text-base touch-manipulation min-h-[44px]"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  <span>Continue to WhatsApp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

