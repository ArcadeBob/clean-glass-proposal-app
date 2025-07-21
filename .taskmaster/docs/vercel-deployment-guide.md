# Vercel Deployment Guide

## 🚀 Deploy Clean Glass Proposal App to Vercel

### Prerequisites
- ✅ GitHub repository: `https://github.com/ArcadeBob/clean-glass-proposal-app.git`
- ✅ Local environment working with Next.js 15
- ✅ Environment validation implemented

### Step 1: Set Up Production Database

**Option A: Neon (Recommended)**
1. Go to [neon.tech](https://neon.tech) and sign up
2. Create a new project named "clean-glass-proposals"
3. Copy the connection string from the dashboard
4. Note: You'll get both DATABASE_URL and DIRECT_URL

**Option B: Supabase**
1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project named "clean-glass-proposals"
3. Go to Settings → Database and copy the connection string

### Step 2: Deploy to Vercel

1. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub (recommended)

2. **Import Project**
   - Click "New Project"
   - Select your repository: `ArcadeBob/clean-glass-proposal-app`
   - Click "Import"

3. **Configure Project**
   - Project Name: `clean-glass-proposal-app` (or your preference)
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)

### Step 3: Environment Variables

**IMPORTANT:** Before clicking "Deploy", add these environment variables:

#### Required Production Variables:
```
DATABASE_URL=postgresql://[your-production-db-url]
DIRECT_URL=postgresql://[your-production-db-direct-url]
NEXTAUTH_SECRET=[generate-new-32-char-secret]
NEXTAUTH_URL=https://your-app-name.vercel.app
NODE_ENV=production
```

#### Generate New Production Secret:
```bash
# Run this in terminal to generate a NEW secret for production:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Optional Variables (for future features):
```
VERCEL_ANALYTICS_ID=[from-vercel-analytics]
EMAIL_FROM=noreply@yourdomain.com
```

### Step 4: Initial Deployment

1. Click "Deploy" in Vercel
2. Wait for build to complete (should take 2-3 minutes)
3. If build fails, check the build logs

### Step 5: Database Migration

After successful deployment:

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Link your project**:
   ```bash
   vercel link
   ```

4. **Run production migration**:
   ```bash
   vercel env pull .env.production
   npx prisma migrate deploy
   ```

### Step 6: Configure Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click "Domains" tab
3. Add your custom domain
4. Update `NEXTAUTH_URL` to your custom domain

### Step 7: Set Up Preview Deployments

✅ **Automatic Setup:**
- Preview deployments are automatically enabled
- Every pull request gets its own preview URL
- Environment variables are inherited from production

### Step 8: Enable Analytics (Optional)

1. In Vercel dashboard, go to "Analytics" tab
2. Enable Vercel Analytics
3. Add `VERCEL_ANALYTICS_ID` to environment variables

## ✅ Verification Checklist

After deployment, verify:
- [ ] Application loads at your Vercel URL
- [ ] Database connection works
- [ ] Authentication functions (sign up/sign in)
- [ ] No console errors in browser
- [ ] Environment variables are properly set
- [ ] SSL certificate is active (https://)

## 🚨 Troubleshooting

**Build Errors:**
- Check Vercel build logs
- Ensure all dependencies are in package.json
- Verify TypeScript compilation locally

**Database Connection Issues:**
- Verify DATABASE_URL format
- Check if database allows external connections
- Ensure DIRECT_URL is set for migrations

**Authentication Issues:**
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Ensure database schema is migrated

## 📱 Next Steps After Deployment

1. Test all functionality in production
2. Set up monitoring and error tracking
3. Configure email service for notifications
4. Set up file storage for PDFs
5. Add custom domain and SSL 