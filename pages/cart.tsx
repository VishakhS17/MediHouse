import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SEO from '@/components/SEO'
import { generatePageMeta } from '@/lib/siteMeta'
import { useCart } from '@/lib/cart'

export default function Cart() {
  const { items, updateQuantity, removeFromCart, clearCart, getTotalItems } = useCart()
  const meta = generatePageMeta({
    title: 'Cart',
    description: 'Review your selected products and quantities.',
  })

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
            <div className="mb-8 text-center animate-fade-in-up">
              <span className="mb-4 inline-block rounded-full bg-gradient-to-r from-ocean-cyan/20 via-ocean-aqua/20 to-ocean-sky/20 px-4 py-2 text-sm font-semibold text-ocean-royal border border-ocean-cyan/30">
                Your Selection
              </span>
              <h1 className="mb-6 font-display font-bold text-gray-900 text-4xl md:text-5xl">
                Shopping <span className="bg-gradient-to-r from-ocean-cyan via-ocean-teal to-ocean-royal bg-clip-text text-transparent">Cart</span>
              </h1>
            </div>

            {getTotalItems() === 0 ? (
              <div className="max-w-2xl mx-auto text-center py-12">
                <div className="mb-6">
                  <svg className="w-24 h-24 mx-auto text-gray-300" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
                <p className="text-gray-600 mb-8">Start adding products to your cart from our inventory.</p>
                <Link
                  href="/products"
                  className="inline-block bg-ocean-cyan text-white px-6 py-3 rounded-lg hover:bg-ocean-teal transition-colors font-medium"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                      {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'} in cart
                    </h2>
                    <button
                      onClick={clearCart}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear Cart
                    </button>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {items.map((item) => (
                      <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.name}</h3>
                            <p className="text-sm text-gray-500 mb-4">{item.manufacturer}</p>
                            
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const newQuantity = parseInt(e.target.value) || 0
                                    updateQuantity(item.id, newQuantity)
                                  }}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                />
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-semibold text-gray-900">Total Items:</span>
                      <span className="text-lg font-bold text-ocean-royal">{getTotalItems()}</span>
                    </div>
                    <div className="flex space-x-4">
                      <Link
                        href="/products"
                        className="flex-1 text-center border border-ocean-cyan text-ocean-cyan px-6 py-3 rounded-lg hover:bg-ocean-cyan hover:text-white transition-colors font-medium"
                      >
                        Continue Shopping
                      </Link>
                      <button
                        onClick={() => {
                          // In a real app, this would submit the order
                          alert('Order functionality would be implemented here. Your cart has been saved locally.')
                        }}
                        className="flex-1 bg-ocean-cyan text-white px-6 py-3 rounded-lg hover:bg-ocean-teal transition-colors font-medium"
                      >
                        Place Order
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
    </>
  )
}

