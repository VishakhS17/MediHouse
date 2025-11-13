# Medi House - Static Next.js Website

A complete static Next.js website for **Medi House**, a leading pharmaceutical distribution business in Alappuzha, Kerala.

## 🚀 Tech Stack

- **Next.js 14** (with static export)
- **TypeScript**
- **Tailwind CSS**
- **ESLint + Prettier**

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Git (for version control)

## 🛠️ Setup & Installation

### 1. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Development Server

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the site.

### 3. Build for Production

Build the static site:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

This will:
- Build the Next.js application
- Export static HTML files to the `out/` directory
- Generate the sitemap.xml

### 4. Preview Static Export

To preview the static export locally:

```bash
npx serve out
# or use any static file server
```

## 📁 Project Structure

```
medi-house/
├── components/          # React components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── FeatureCard.tsx
│   ├── PartnersGrid.tsx
│   ├── ContactForm.tsx
│   └── SEO.tsx
├── data/               # Site content and data
│   └── site.ts
├── lib/                # Utility functions
│   └── siteMeta.ts
├── pages/              # Next.js pages
│   ├── _app.tsx
│   ├── _document.tsx
│   ├── index.tsx       # Home page
│   ├── about.tsx
│   ├── services.tsx
│   ├── clients.tsx
│   ├── contact.tsx
│   ├── privacy.tsx
│   └── terms.tsx
├── public/             # Static assets
│   ├── logo.svg
│   ├── robots.txt
│   └── partners/       # Partner logo placeholders
│       ├── aristo.svg
│       ├── blue-cross.svg
│       ├── jb-chemicals.svg
│       ├── rpg-life.svg
│       ├── indoco.svg
│       ├── lividus.svg
│       ├── win-medi-care.svg
│       └── chethana.svg
├── scripts/            # Build scripts
│   └── generate-sitemap.js
└── styles/             # Global styles
    └── globals.css
```

## 🎨 Customization

### Replace Partner Logos

1. Place your partner logo files in `public/partners/`
2. Ensure they match the filenames in `data/site.ts`:
   - `aristo.svg`
   - `blue-cross.svg`
   - `jb-chemicals.svg`
   - `rpg-life.svg`
   - `indoco.svg`
   - `lividus.svg`
   - `win-medi-care.svg`
   - `chethana.svg`
3. Logos should be SVG format (or update components to use `next/image` with PNG/JPG)

### Replace Company Logo

Replace `public/logo.svg` with your actual company logo.

### Update Site Content

Edit `data/site.ts` to update:
- Company information
- Contact details
- Services
- Partners list
- Vision, mission, and values

### Update Colors

Edit `tailwind.config.js` to customize the color scheme:

```js
colors: {
  primary: {
    // Your primary colors
  },
  medical: {
    // Medical-themed colors
  },
}
```

## 📧 Contact Form Setup

### Option 1: Formspree (Default)

1. Sign up at [Formspree.io](https://formspree.io)
2. Create a new form and get your form ID
3. Update `components/ContactForm.tsx`:
   ```tsx
   const formspreeUrl = 'https://formspree.io/f/YOUR_FORM_ID'
   ```
4. Replace `YOUR_FORM_ID` with your actual Formspree form ID

### Option 2: Netlify Forms

1. Update the form in `components/ContactForm.tsx`:
   ```tsx
   <form
     name="contact"
     method="POST"
     data-netlify="true"
     action="/thank-you"
   >
     <input type="hidden" name="form-name" value="contact" />
     {/* rest of form */}
   </form>
   ```

### Option 3: Vercel Serverless Function

1. Create `pages/api/contact.ts`:
   ```ts
   export default async function handler(req, res) {
     // Handle form submission
   }
   ```
2. Update form action to `/api/contact`

### Fallback: Mailto

The contact form automatically falls back to `mailto:` if JavaScript fails or Formspree is unavailable.

## 🌐 Deployment

### Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Import the repository in [Vercel](https://vercel.com)
3. Vercel will auto-detect Next.js and deploy
4. The static export will be handled automatically

**Note:** Ensure `next.config.js` has `output: 'export'` for static sites.

### Netlify

1. Push your code to GitHub/GitLab/Bitbucket
2. Import the repository in [Netlify](https://netlify.com)
3. Set build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `out`
4. Deploy

### Manual Deployment

1. Build the static site:
   ```bash
   npm run build
   ```
2. Upload the `out/` directory to your web hosting service
3. Ensure your server serves `index.html` for all routes (SPA routing)

### GitHub Pages

1. Install `gh-pages`:
   ```bash
   npm install --save-dev gh-pages
   ```
2. Add to `package.json`:
   ```json
   "scripts": {
     "deploy": "npm run build && gh-pages -d out"
   }
   ```
3. Run:
   ```bash
   npm run deploy
   ```

## 🔍 SEO & Analytics

### Update Sitemap URL

Update `public/robots.txt` and `scripts/generate-sitemap.js` with your actual domain:

```js
const siteUrl = 'https://yourdomain.com'
```

### Add Analytics

1. **Google Analytics:**
   - Add to `pages/_app.tsx`:
   ```tsx
   import Script from 'next/script'
   
   <Script
     src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
     strategy="afterInteractive"
   />
   ```

2. **Other Analytics:**
   - Add tracking scripts to `pages/_document.tsx`

## 🧪 Testing

### Run Linter

```bash
npm run lint
```

### Format Code

```bash
npm run format
```

### Test Static Export

1. Build the site: `npm run build`
2. Serve the `out/` directory
3. Test all routes and functionality
4. Verify sitemap.xml is accessible at `/sitemap.xml`

## 📝 Pages

- `/` - Home page with hero, features, partners, and CTA
- `/about/` - About us, vision, mission, values, and capabilities
- `/services/` - Services offered
- `/clients/` - Partners and clients
- `/contact/` - Contact form, details, and map
- `/privacy/` - Privacy policy
- `/terms/` - Terms of service

## 🎯 Features

- ✅ Fully static (no server required)
- ✅ Responsive design (mobile-first)
- ✅ Accessible (WCAG guidelines)
- ✅ SEO optimized (meta tags, Open Graph, sitemap)
- ✅ Performance optimized (Lighthouse friendly)
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling
- ✅ Contact form with Formspree integration
- ✅ Partner logo placeholders
- ✅ Google Maps embed

## 🐛 Troubleshooting

### Build Errors

- Ensure all dependencies are installed: `npm install`
- Clear `.next` and `out` directories and rebuild
- Check TypeScript errors: `npx tsc --noEmit`

### Image Issues

- Ensure all SVG files are in `public/` directory
- Check image paths in components
- Verify `next/image` configuration in `next.config.js`

### Routing Issues

- Ensure `trailingSlash: true` in `next.config.js` for static export
- Test routes after build in the `out/` directory

## 📄 License

This project is proprietary and confidential.

## 👥 Contact

**Medi House**
- Address: Cullen Road, Pitchu Iyer Junction, Alappuzha - 688 001
- Mobile: 75948 99099, 98470 28510
- Email: medihousealpy@gmail.com
- Office: 9947 123450 / 6235 123450

---

Built with ❤️ for Medi House

