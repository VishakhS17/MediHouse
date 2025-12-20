import { GetServerSideProps } from 'next'

function generateSiteMap() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://medi-house.in'
  
  const staticPages = [
    '',
    '/products',
    '/about',
    '/pharmaceutical-distributor-kerala',
    '/medicine-wholesale-kerala',
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     ${staticPages
       .map((path) => {
         let priority = '0.8'
         let changefreq = 'weekly'
         
         if (path === '') {
           priority = '1.0'
           changefreq = 'daily'
         } else if (path === '/products') {
           priority = '0.9'
           changefreq = 'daily'
         }
         
         return `
       <url>
           <loc>${siteUrl}${path}</loc>
           <lastmod>${new Date().toISOString()}</lastmod>
           <changefreq>${changefreq}</changefreq>
           <priority>${priority}</priority>
       </url>
     `
       })
       .join('')}
   </urlset>
 `
}

function SiteMap() {
  // getServerSideProps will do the heavy lifting
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  // We generate the XML sitemap with the posts data
  const sitemap = generateSiteMap()

  res.setHeader('Content-Type', 'text/xml')
  // we send the XML to the browser
  res.write(sitemap)
  res.end()

  return {
    props: {},
  }
}

export default SiteMap










