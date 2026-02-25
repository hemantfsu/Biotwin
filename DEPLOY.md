# 🚀 BioTwin AI — Free Deployment Guide

Deploy the full BioTwin AI stack for **$0/month** using free tiers:

| Service | Platform | Free Tier |
|---------|----------|-----------|
| Frontend (React) | **Vercel** | Unlimited deploys, global CDN |
| Backend (Node.js) | **Render** | 750 hrs/month web service |
| ML Server (FastAPI) | **Render** | 750 hrs/month Docker service |
| Database (MongoDB) | **Atlas** | 512 MB M0 cluster |

> ⚠️ **Free tier limitation**: Render free services **sleep after 15 min of inactivity** — first request after sleep takes ~30-50s. This is fine for demos/hackathons.

---

## Step 1 — MongoDB Atlas (Database)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Sign up free
2. **Create Cluster** → Choose **M0 Free Tier** → Region: `us-east-1`
3. **Database Access** → Add user with password
4. **Network Access** → Click **"Allow Access From Anywhere"** (`0.0.0.0/0`)
5. **Connect** → Copy connection string:
   ```
   mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/biotwin?retryWrites=true&w=majority
   ```

---

## Step 2 — ML Server on Render (Python/FastAPI)

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. **New** → **Web Service** → Connect your `biotwin-ai` repo
3. Configure:
   - **Name**: `biotwin-ml`
   - **Root Directory**: `ml-server`
   - **Runtime**: **Docker**
   - **Instance Type**: **Free**
4. Click **Create Web Service**
5. Wait for build (~5-10 min for TensorFlow)
6. Note the URL: `https://biotwin-ml.onrender.com`

---

## Step 3 — Backend on Render (Node.js)

1. On Render → **New** → **Web Service** → Same repo
2. Configure:
   - **Name**: `biotwin-backend`
   - **Root Directory**: `backend`
   - **Runtime**: **Node**
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: **Free**
3. **Environment Variables** (add these):
   ```
   NODE_ENV = production
   PORT = 5001
   MONGO_URI = mongodb+srv://youruser:yourpass@cluster0.xxxxx.mongodb.net/biotwin?retryWrites=true&w=majority
   JWT_SECRET = your_strong_random_secret_here
   ML_SERVER_URL = https://biotwin-ml.onrender.com
   ```
4. Click **Create Web Service**
5. Note the URL: `https://biotwin-backend.onrender.com`

---

## Step 4 — Frontend on Vercel (React)

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. **Import Project** → Select `biotwin-ai` repo
3. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
4. **Environment Variables** (add this):
   ```
   REACT_APP_API_URL = https://biotwin-backend.onrender.com/api
   ```
5. Click **Deploy**
6. Your site will be live at: `https://biotwin-ai.vercel.app`

---

## Step 5 — Verify Everything

1. Check ML Server:
   ```bash
   curl https://biotwin-ml.onrender.com/health
   ```

2. Check Backend:
   ```bash
   curl https://biotwin-backend.onrender.com/api/health
   ```

3. Open your Vercel URL in browser and test:
   - Sign up / Login
   - Try the chatbot: "I have chest pain, BP 150/90, age 55"
   - Upload an X-ray
   - Run lab prediction

---

## Alternative: Deploy Everything on Render

If you prefer one platform for all services:

1. Deploy ML Server (Docker) → as above
2. Deploy Backend (Node) → as above
3. Deploy Frontend as **Static Site** on Render:
   - **New** → **Static Site**
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
   - Add env var: `REACT_APP_API_URL = https://biotwin-backend.onrender.com/api`
   - Add redirect/rewrite rule: `/* → /index.html` (for React Router)

---

## Notes

- **Socket.IO (Live Vitals)**: WebSockets work on Render free tier, but connections drop when the server sleeps
- **Redis**: Not needed — the backend already handles missing Redis gracefully
- **Model Files**: The ML models (~29 MB) are included in the repo and deployed with the Docker image
- **Cold Starts**: First request after inactivity takes ~30-50s on free tier. After that, responses are fast
- **Custom Domain**: Both Vercel and Render support free custom domains if you have one
