import { siteConfig } from '@/data/site'

export interface PageMeta {
  title: string
  description: string
  keywords?: string
  ogImage?: string
  noindex?: boolean
}

export const defaultMeta: PageMeta = {
  title: `${siteConfig.name} - ${siteConfig.tagline}`,
  description: siteConfig.description,
  keywords:
    'pharmaceutical distribution, Alappuzha, medicine distributor, hospital supplies, cold chain, pharma distributor Kerala',
  ogImage: '/logo.svg',
}

export const generatePageMeta = (meta: Partial<PageMeta>): PageMeta => {
  return {
    ...defaultMeta,
    ...meta,
    title: meta.title
      ? `${meta.title} | ${siteConfig.name}`
      : defaultMeta.title,
  }
}

