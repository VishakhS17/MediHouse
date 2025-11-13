const fs = require('fs')
const path = require('path')

const siteUrl = process.env.SITE_URL || 'https://medihouse-alappuzha.com'

const pages = [
  '',
  'about/',
  'services/',
  'clients/',
  'contact/',
  'privacy/',
  'terms/',
]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${siteUrl}/${page}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`

const outDir = path.join(process.cwd(), 'out')
const sitemapPath = path.join(outDir, 'sitemap.xml')

// Ensure out directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true })
}

fs.writeFileSync(sitemapPath, sitemap)
console.log(`✅ Sitemap generated at ${sitemapPath}`)

