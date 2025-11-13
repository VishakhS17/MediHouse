import Head from 'next/head'
import { PageMeta } from '@/lib/siteMeta'
import { siteConfig } from '@/data/site'

interface SEOProps {
  meta: PageMeta
}

export default function SEO({ meta }: SEOProps) {
  const title = meta.title || siteConfig.name
  const description = meta.description || siteConfig.description
  const ogImage = meta.ogImage || '/logo.svg'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medihouse-alappuzha.com'

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {meta.keywords && <meta name="keywords" content={meta.keywords} />}
      {meta.noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:site_name" content={siteConfig.name} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />
    </Head>
  )
}

