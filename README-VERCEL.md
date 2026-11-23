# OLUCHI KONCEPT — Vercel deployment package

This package restores the saved OLUCHI KONCEPT public website design.

## Brand
- OLUCHI KONCEPT — Multimedia & Creative Studios
- Creativity Beyond Imagination
- Founder & Creative Director

## Deploy with Vercel
1. Extract this ZIP.
2. Sign in to Vercel and select the `oluchi-konzept` team.
3. Import a Git repository containing these files, or use the Vercel CLI from this folder.
4. Choose Framework Preset: Other. Leave Build Command empty and Output Directory as the project root.
5. Deploy a Preview first and test it. Deploy to Production only after verification.

CLI: `npm install -g vercel`, then `vercel login`, `vercel`, test the preview, and finally `vercel --prod`.

## Supabase
`config.js` points to the existing Supabase project and contains its browser publishable key. Do not replace the project, expose a service-role key, or weaken Row Level Security.

## Included
Home, About, Services, UI/UX & Web, Portfolio, Quote, Booking, Contact and Owner Portal sections; the dark luxury black/gold/electric-blue design; existing intro video, logo reveal, founder imagery and portfolio sample assets.

## Scope notes
The public Netlify URL currently returns a Netlify 404. This package is the saved public-site restoration baseline. Its Owner Portal is within the same site; a separate private admin dashboard and complete advertisement workflow remain follow-up implementation tasks. No Supabase schema or policy changes are made. PWA/APK installation is not included; an actual signed APK must exist and be hosted before a download button can work.
