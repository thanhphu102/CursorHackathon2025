# Personal Finance AI Assistant - MVP

A mobile-first web application that helps users manage their personal finances with AI-powered insights, subscription tracking, receipt scanning, and goal-driven budgeting.

## 🎯 Core Features

### 1. AI Spending Mind
- Manual transaction entry, CSV import, and demo bank feed mock
- Spending pattern analysis with weekly/monthly comparisons
- Overspending detection by category
- Natural language insights (e.g., "You spent 25% more on Food this month vs last month")
- Predictive insights (end-of-month balance forecasting)

### 2. Goal Driven Budget
- Create financial goals with target amounts and deadlines
- Progress tracking with savings suggestions
- AI-powered savings amount adjustments based on spending habits

### 3. Subscription Radar
- Automatic detection of recurring charges from transactions
- Subscription list with next billing dates
- Monthly subscription spend summary
- One-click snooze/dismiss for subscriptions

### 4. Receipt Scanner + AI Categorizer
- Receipt upload via camera/file
- OCR extraction (Google Vision API with Tesseract.js fallback)
- Automatic transaction creation with merchant, total, and line items
- AI-powered categorization (Food, Transport, Shopping, Bills, Entertainment, Others)

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router) + React + TypeScript + TailwindCSS
- **State Management**: React Query + Zustand
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: Supabase (PostgreSQL) with local dev fallback
- **Authentication**: Supabase Auth (email) with demo mode
- **AI**: OpenAI API (configurable, with mock layer)
- **OCR**: Google Vision API with Tesseract.js fallback
- **Storage**: Supabase Storage for receipts
- **Testing**: Vitest + React Testing Library
- **Tooling**: ESLint, Prettier

### Project Structure
```
/
├── app/                      # Next.js App Router pages
│   ├── (auth)/              # Auth pages
│   ├── (dashboard)/         # Protected dashboard pages
│   ├── api/                 # API routes
│   └── layout.tsx
├── components/              # React components
│   ├── ui/                  # Reusable UI components
│   └── features/            # Feature-specific components
├── lib/                     # Core libraries and utilities
│   ├── ai/                  # AI adapter and prompts
│   ├── db/                  # Database client and queries
│   ├── ocr/                 # OCR integration
│   └── utils/               # Utility functions
├── types/                   # TypeScript type definitions
├── hooks/                   # Custom React hooks
├── stores/                  # Zustand stores
├── scripts/                 # Seed data and utility scripts
├── tests/                   # Test files
└── public/                  # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- Supabase account (optional, demo mode works without it)
- OpenAI API key (optional, demo mode works without it)
- Google Cloud Vision API key (optional, Tesseract.js fallback available)

### Installation

1. **Clone and install dependencies:**
```bash
npm install
# or
yarn install
# or
pnpm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys (all optional for demo mode):
```env
# Supabase (optional - demo mode works without)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (optional - demo mode works without)
OPENAI_API_KEY=your_openai_api_key

# Google Vision API (optional - Tesseract.js fallback available)
GOOGLE_VISION_API_KEY=your_google_vision_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Feature Flags
NEXT_PUBLIC_DEMO_MODE=true  # Set to false to enable live APIs
```

3. **Set up database (Supabase):**

   - Create a new Supabase project
   - Run the SQL schema from `scripts/schema.sql` in your Supabase SQL editor
   - Or use the seed script which will create tables automatically

4. **Seed demo data (optional):**
```bash
npm run seed
```

5. **Run development server:**
```bash
npm run dev
```

6. **Open the app:**
Navigate to [http://localhost:3000](http://localhost:3000)

### Demo Mode vs Live Mode

The app supports two modes:

#### Demo Mode (Default)
- No API keys required
- Uses mock AI responses
- Uses in-memory database or local Supabase
- Pre-populated demo data
- Perfect for testing and development

To enable Demo Mode:
```env
NEXT_PUBLIC_DEMO_MODE=true
```

#### Live Mode
- Requires API keys (OpenAI, Google Vision, Supabase)
- Real AI-powered insights and categorization
- Live database connections
- Production-ready features

To enable Live Mode:
```env
NEXT_PUBLIC_DEMO_MODE=false
OPENAI_API_KEY=your_key
GOOGLE_VISION_API_KEY=your_key
# ... other keys
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - Demo login (email/password or demo user)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Get current session

### Transactions
- `GET /api/transactions?userId={id}` - Get user transactions
- `POST /api/transactions` - Create manual transaction
- `POST /api/transactions/import` - Import CSV transactions
- `DELETE /api/transactions/:id` - Delete transaction

### Receipts
- `POST /api/receipts/scan` - Upload and scan receipt (OCR + create transaction)
- `GET /api/receipts/:id` - Get receipt details

### Subscriptions
- `GET /api/subscriptions?userId={id}` - Get detected subscriptions
- `POST /api/subscriptions/detect` - Run detection algorithm
- `POST /api/subscriptions/:id/snooze` - Snooze subscription
- `DELETE /api/subscriptions/:id` - Dismiss subscription

### Goals
- `GET /api/goals?userId={id}` - Get user goals
- `POST /api/goals` - Create goal
- `PATCH /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal

### Insights
- `GET /api/insights?userId={id}` - Get AI-generated insights

See `docs/API.md` or Postman collection for detailed examples.

## 🧪 Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

## 📱 Key Screens

1. **Onboarding / Demo Login** - Quick access with demo credentials
2. **Dashboard** - Balance, spend chart, insights, subscriptions, goals progress
3. **Transactions** - List, filter, and manage transactions
4. **Add Transaction** - Manual entry or CSV import
5. **Receipt Scanner** - Upload receipt, preview OCR, create transaction
6. **Subscriptions** - View, snooze, or dismiss subscriptions
7. **Goals** - Create, edit, and track financial goals
8. **Settings** - Toggle demo mode, manage API keys

## 🔧 Development Workflow

### Adding a New Feature
1. Create feature branch
2. Implement in `app/(dashboard)/feature-name`
3. Add API route in `app/api/feature-name`
4. Add types in `types/`
5. Write tests in `tests/`
6. Update documentation

### AI Integration
- AI prompts are in `lib/ai/prompts.ts`
- AI adapter is in `lib/ai/adapter.ts`
- Mock responses are in `lib/ai/mocks.ts`

### Database Schema
- Schema defined in `scripts/schema.sql`
- Types generated in `types/database.ts`
- Queries in `lib/db/queries/`

## 📦 Build & Deploy

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

Deploy to Vercel (recommended):
```bash
vercel
```

## 🔐 Security Notes

- Never commit `.env.local` or API keys
- Use Supabase Row Level Security (RLS) policies in production
- Validate and sanitize all user inputs
- Use HTTPS in production
- Implement rate limiting for API routes

## 📝 License

MIT License

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Note**: This is an MVP. For production use, consider:
- Enhanced error handling and logging
- More robust authentication
- Rate limiting and API security
- Comprehensive test coverage
- Performance optimization
- Accessibility improvements
- Internationalization

