# CareerHarvester

Full-stack career consultant application that helps users optimize their resumes and find matching jobs using AI.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/frontend-React_19-blue)
![Flask](https://img.shields.io/badge/backend-Flask_3.0-green)

## Project Architecture

- **Frontend**: React (Vite + TypeScript)
- **Backend**: Python Flask (OpenAI Integration)
- **CI/CD**: GitHub Actions

## Prerequisites

- **Node.js**: v18 or higher
- **Python**: v3.11 or higher
- **Docker** (Optional, for containerized run)

## Quick Start (Local Development)

### 1. Backend Setup

```bash
cd backend
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Mac/Linux:
# source .venv/bin/activate

pip install -r requirements.txt

# Create .env file
cp .env.example .env
# EDIT .env and add your OPENAI_API_KEY
```

Run the backend:
```bash
python app.py
# Server runs on http://localhost:5000
```

### 2. Frontend Setup

Open a new terminal:
```bash
# Install dependencies
npm install

# Create .env file not needed for basic dev if proxy is used, 
# but if you need custom config:
cp .env.example .env.local

# Run development server
npm run dev
# App runs on http://localhost:3000
```

The frontend relies on the backend running at port 5000. It proxies `/api` requests automatically.

---

## Deployment Options

### Option A: Unified Deployment (Docker)
Suitable for platforms like Render, Railway, or Fly.io that support Docker.

1. **Build & Run**:
   ```bash
   docker build -t careerharvester .
   docker run -p 5000:5000 -e OPENAI_API_KEY=your_key careerharvester
   ```
   This serves both frontend static files and backend API from the same container.

### Option B: Separated Deployment

- **Frontend**: Deploy to Vercel/Netlify.
  - Build Command: `npm run build`
  - Publish directory: `dist`
  - **Important**: You must configure the API URL in frontend environment variables if not using same-domain proxy in production.

- **Backend**: Deploy to Render/Railway (Python).
  - Use `backend/` as root directory (or configure build path).
  - Start Command: `gunicorn app:app`

## CI/CD Pipeline

Uses **GitHub Actions**:
- `worklows/ci.yml`: Runs on Push/PR.
  - Frontend: Lint (`npm run lint`), Test (`npm run test`), Build (`npm run build`).
  - Backend: Syntax check (`flake8`).
- `workflows/cd.yml`: Deployment template. Configure specific provider steps as needed.

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Required. Access key for OpenAI API. |
| `FLASK_ENV` | `development` or `production`. |

### Frontend (`.env.local`)
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Base URL for API calls. Defaults to `/api` (proxy). |

## FAQ & Troubleshooting

**Q: Frontend calls fail with 404.**
A: Ensure Backend is running. Check `vite.config.ts` proxy settings. If deployed separately, check CORS settings in `backend/app.py`.

**Q: How to run tests?**
A: Frontend: `npm run test`. Backend: Install `pytest` and run `pytest`.

**Q: How to update Python dependencies?**
A: Activate venv, install package, then `pip freeze > requirements.txt`. 
