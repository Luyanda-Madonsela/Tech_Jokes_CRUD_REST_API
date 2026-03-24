# Tech Jokes CRUD App

A full-stack Next.js app for sharing and voting on tech jokes and clips.

## Stack

- Next.js 14 (App Router)
- SQLite via better-sqlite3
- JWT authentication
- Tailwind CSS

## Local Run

1. Install dependencies:
	npm install
2. Start the app:
	npm run dev
3. Open:
	http://localhost:3000

## Deploy for Recruiter Access (Free)

This repository includes:

- Dockerfile for production container runtime
- render.yaml for one-click Render setup on the free tier
- Configurable DB path through DB_PATH

### One-time setup (about 3 minutes)

1. Push this repository to GitHub.
2. Create a Render account.
3. In Render, choose New + and select Blueprint.
4. Connect your GitHub repo and deploy using render.yaml.
5. Wait for build + deploy to complete.

### Environment variables

- JWT_SECRET: long random value (auto-generated from render.yaml)
- DB_PATH: /app/data/crackagag.db (already defined in render.yaml)

### What recruiters can use

- Public app URL from Render (for example, https://your-app.onrender.com)
- Register a new account directly in the UI, or log in with seeded account:
  - Email: techguy@example.com
  - Password: password123

## Notes for Production

- Free tier uses ephemeral container storage, so user-created data can reset after restarts/redeploys.
- This is usually fine for recruiter demos because seeded demo data is recreated automatically.
- Free plans can cold start; first load may take a little longer.
- For persistent data + custom domain reliability, upgrade to a paid plan later.
