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
    'pharmaceutical distributor Kerala, medicine wholesale supplier Kerala, pharma distributor Alappuzha, bulk medicine supplier Kerala, medical store supplier Kerala, pharmaceutical distribution Kerala',
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

