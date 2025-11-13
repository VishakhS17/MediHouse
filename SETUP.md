# Quick Setup Guide

## 🚀 Getting Started in 5 Minutes

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 3. Build Static Site

```bash
npm run build
```

The static site will be in the `out/` directory.

### 4. Configure Contact Form

1. Sign up at [Formspree.io](https://formspree.io)
2. Create a form and get your form ID
3. Create a `.env.local` file:
   ```
   NEXT_PUBLIC_FORMSPREE_FORM_ID=your_form_id_here
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   ```

### 5. Replace Placeholder Assets

1. **Company Logo:** Replace `public/logo.svg`
2. **Partner Logos:** Replace files in `public/partners/` directory
3. **Update Map:** Update Google Maps embed URL in `pages/contact.tsx` with your actual location

### 6. Deploy

**Vercel (Recommended):**
- Push to GitHub
- Import in Vercel
- Auto-deploy!

**Netlify:**
- Push to GitHub
- Import in Netlify
- Set build command: `npm run build`
- Set publish directory: `out`

**Manual:**
- Upload the `out/` directory to your web hosting

---

For detailed instructions, see [README.md](README.md)

