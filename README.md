# Job Scraper - Full Stack Application

A production-ready job scraping application that aggregates job postings from LinkedIn and Indeed.

## 🏗️ Architecture

- **Backend**: FastAPI + Python + MongoDB
- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Database**: MongoDB
- **Scheduler**: APScheduler for automated scraping

## 📁 Project Structure

```
job-search/
├── app/                          # Backend (FastAPI)
│   ├── scrapers/
│   │   ├── linkedin_scraper.py
│   │   └── indeed_scraper.py
│   ├── services/
│   │   └── job_service.py
│   ├── config.py
│   ├── database.py
│   ├── models.py
│   ├── scheduler.py
│   └── main.py
├── job-scraper-frontend/         # Frontend (Next.js)
│   └── src/
│       ├── app/
│       │   └── page.tsx
│       └── components/
│           ├── JobCard.tsx
│           ├── SearchBar.tsx
│           └── StatsBar.tsx
├── requirements.txt
├── .env
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- MongoDB (local or cloud)

### 1. Start MongoDB

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or install MongoDB locally
```

### 2. Backend Setup

```bash
cd c:\job-search

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### 3. Frontend Setup

```bash
cd job-scraper-frontend

# Initialize Next.js (first time only)
npx create-next-app@latest . --typescript --tailwind --app --use-npm

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 🔧 Configuration

### Backend (.env)

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=job_scraper
CORS_ORIGINS=http://localhost:3000
SCRAPE_INTERVAL_HOURS=6
VERIFY_INTERVAL_HOURS=12
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/api/jobs` | Get all active jobs |
| POST | `/api/scrape` | Trigger job scraping |
| POST | `/api/search` | Search jobs by role |
| POST | `/api/verify` | Verify job status |

## ✨ Features

- **Multi-source scraping**: LinkedIn and Indeed
- **Automatic scheduling**: Configurable scraping intervals
- **Job verification**: Check if listings are still active
- **Real-time search**: Search across all scraped jobs
- **Beautiful UI**: Modern, responsive design with Tailwind CSS
- **New job badges**: Highlight jobs posted in last 24 hours

## 📝 License

MIT
