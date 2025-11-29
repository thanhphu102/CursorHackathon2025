# Quick Start Guide

## Getting Started in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
# Copy the example env file
cp .env.example .env.local

# For demo mode (no API keys needed), the defaults are fine
# Or edit .env.local and set:
NEXT_PUBLIC_DEMO_MODE=true
```

### 3. Seed Demo Data (Optional)
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```

### 5. Open the App
Navigate to [http://localhost:3000](http://localhost:3000)

### 6. Login
- Email: `demo@example.com`
- Password: (any password works in demo mode)

## First Steps

1. **View Dashboard**: See your financial overview, AI insights, and goals
2. **Add Transaction**: Click "Add Transaction" to manually enter expenses
3. **Import CSV**: Go to Transactions → Import CSV to bulk import
4. **Scan Receipt**: Upload a receipt image to automatically create a transaction
5. **Detect Subscriptions**: Go to Subscriptions and click "Detect Subscriptions"
6. **Create Goal**: Set a financial goal with AI-powered savings suggestions

## Demo Features

In demo mode:
- ✅ All features work without external APIs
- ✅ Mock AI responses for categorization and insights
- ✅ In-memory database (data resets on server restart)
- ✅ Tesseract.js OCR fallback (no Google Vision needed)
- ✅ Pre-populated demo data after running seed script

## Switching to Live Mode

To use real APIs:

1. Get API keys:
   - OpenAI: https://platform.openai.com/api-keys
   - Google Vision: https://cloud.google.com/vision/docs/setup
   - Supabase: https://supabase.com/dashboard

2. Update `.env.local`:
```env
NEXT_PUBLIC_DEMO_MODE=false
OPENAI_API_KEY=your_key
GOOGLE_VISION_API_KEY=your_key
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

3. Set up Supabase:
   - Create a new project
   - Run the SQL from `scripts/schema.sql` in the SQL editor

4. Restart the dev server

## Troubleshooting

### Port 3000 already in use
```bash
# Use a different port
PORT=3001 npm run dev
```

### Module not found errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### Database connection issues
- In demo mode, database is in-memory (no connection needed)
- For Supabase, check your URL and keys in `.env.local`

### OCR not working
- In demo mode, use any image file (returns mock data)
- In live mode, ensure Google Vision API key is set
- Tesseract.js will fallback automatically if Google Vision fails

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check [API.md](./docs/API.md) for API endpoints
- See [API_EXAMPLES.md](./docs/API_EXAMPLES.md) for cURL examples
- Review the test files in `tests/` directory

