import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useEffect } from 'react'
import '@/styles/globals.css'
import { defaultMeta } from '@/lib/siteMeta'
import Preloader from '@/components/Preloader'
import { CartProvider } from '@/lib/cart'
import { AdminAuthProvider } from '@/lib/adminAuth'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Add preload class to body
    document.body.classList.add('preload')
    
    // Clean up on unmount
    return () => {
      document.body.classList.remove('preload')
    }
  }, [])

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logo.svg" />
        <meta name="theme-color" content="#2563eb" />
      </Head>
      <AdminAuthProvider>
        <CartProvider>
          <Preloader />
          <Component {...pageProps} />
        </CartProvider>
      </AdminAuthProvider>
    </>
  )
}

