# Google Custom Search API Setup

## 🔑 Getting Your API Keys

### Step 1: Get Google API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Custom Search API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Custom Search API"
   - Click "Enable"
4. Create API Key:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy your API key

### Step 2: Create Custom Search Engine

1. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click "Add" to create new search engine
3. Configuration:
   - **Sites to search:** `*` (search entire web)
   - **Name:** "Company Info Search"
4. Click "Create"
5. Copy your **Search Engine ID** (cx parameter)

### Step 3: Add to .env File

Add these two lines to your `.env` file:

```env
GOOGLE_API_KEY=your_api_key_here
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here
```

## 📊 API Limits

- **Free Tier:** 100 searches/day
- **Per query cost:** Free for first 100, then $5 per 1000 queries

## 🎯 How It Works

When a user opens a company page:
1. Backend calls Google Custom Search API
2. Searches for "[Company Name] official website"
3. Returns first result's URL and description
4. Frontend displays real company website and description

## ✅ Testing

```bash
# Test the endpoint
curl http://localhost:8000/api/companies/BIMAX%20Engineering%20Specialists/info

# Expected response:
{
  "website": "https://www.bimaxengineering.com/",
  "description": "BIMAX Engineering Specialists provides BIM services..."
}
```

## 🚀 Deploy to Railway

Add environment variables in Railway dashboard:
1. Go to your project settings
2. Add:
   - `GOOGLE_API_KEY`
   - `GOOGLE_SEARCH_ENGINE_ID`
