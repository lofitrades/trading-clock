# Time 2 Trade - Cloud Functions

Firebase Cloud Functions for syncing economic events data from the JBlanked News Calendar API.

## 📋 Overview

This functions directory contains:
- **Scheduled Function**: Runs daily at 5:00 AM US/Eastern to sync 3-year window of events
- **HTTPS Function**: Manual trigger for testing and on-demand sync
- **Core Sync Logic**: Fetches from JBlanked API and writes to Firestore

## 🔧 Setup

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and add your JBlanked API key:

```bash
cp .env.example .env
```

Edit `.env`:
```env
NEWS_API_KEY=your_actual_jblanked_api_key_here
DEBUG_MODE=false
```

**⚠️ IMPORTANT**: Never commit `.env` file to version control!

### 3. Get Your API Key

Get your JBlanked API key from:
https://www.jblanked.com/news/api/docs/

## 🏗️ Architecture

### File Structure

```
functions/
├── src/
│   ├── index.ts                    # Main entry point (Cloud Functions)
│   ├── services/
│   │   └── syncEconomicEvents.ts   # Core sync logic
│   ├── types/
│   │   └── economicEvents.ts       # TypeScript interfaces
│   ├── utils/
│   │   └── dateUtils.ts            # Date parsing & utilities
│   └── fixtures/
│       └── mockCalendarData.json   # Mock data for testing
├── .env.example                     # Environment variables template
├── .env                             # Your actual environment variables (DO NOT COMMIT)
└── package.json
```

### Firestore Collections

**1. `economicEventsCalendar` (events)**
- Document ID: Hash of event name + date
- Fields: name, currency, category, date, actual, forecast, previous, outcome, projection, strength, quality, source, lastSyncedAt

**2. `systemJobs` (sync status)**
- Document ID: `economicEventsCalendarSync`
- Fields: lastRunAt, lastRunStatus, lastRunError, lastFetchedFrom, lastFetchedTo, recordsUpserted, apiCallsUsed

## 🧪 Testing (Local Emulator - 0 API calls)

### 1. Start Firebase Emulator

```bash
npm run serve
```

This runs the functions locally with mock data (no API calls consumed).

### 2. Test Manual Trigger (Dry Run)

Open browser or use curl:

```bash
# Dry run (no Firestore writes, uses mock data)
curl "http://127.0.0.1:5001/time-2-trade-app/us-central1/syncEconomicEventsCalendarNow?dryRun=true"
```

Expected response:
```json
{
  "ok": true,
  "success": true,
  "recordsUpserted": 10,
  "apiCallsUsed": 1,
  "from": "2024-01-01",
  "to": "2026-12-31",
  "dryRun": true
}
```

## 🚀 Deployment

### Deploy Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:syncEconomicEventsCalendarScheduled
firebase deploy --only functions:syncEconomicEventsCalendarNow
```

### Set Environment Variables in Production

Firebase Functions v2 automatically loads `.env` during deployment, but for production you should set secrets:

```bash
firebase functions:secrets:set NEWS_API_KEY
# Enter your API key when prompted
```

Then update `src/index.ts` to use secrets instead of `process.env`.

## 📊 API Credit Usage

- **Daily Scheduled Sync**: 1 credit per day = ~365 credits/year
- **Manual Triggers**: 1 credit per call
- **Total Budget**: ~400 credits (leaves ~35 for testing)

### Testing Strategy to Minimize Credits

1. ✅ **Local Emulator with Mock Data** (0 credits)
   - Use `npm run serve` + `dryRun=true`
   - Validates logic without hitting API

2. ✅ **First Real Call - Dry Run** (1 credit)
   - Call production function with `dryRun=true`
   - Validates API response structure without Firestore writes

3. ✅ **Second Real Call - Production** (1 credit)
   - Call with `dryRun=false` to populate Firestore
   - Verify UI displays data correctly

4. ✅ **Enable Scheduled Function** (1 credit/day)
   - Deploy and let it run automatically

**Total Testing Cost**: 2 credits

## 🔗 API Endpoints (After Deployment)

### Scheduled Function
- **Name**: `syncEconomicEventsCalendarScheduled`
- **Schedule**: Daily at 5:00 AM US/Eastern
- **Logs**: `firebase functions:log --only syncEconomicEventsCalendarScheduled`

### HTTPS Function
- **Name**: `syncEconomicEventsCalendarNow`
- **URL**: `https://us-central1-time-2-trade-app.cloudfunctions.net/syncEconomicEventsCalendarNow`

**Query Parameters**:
- `dryRun=true` - Test without writing to Firestore
- `from=YYYY-MM-DD` - Custom start date (requires `to`)
- `to=YYYY-MM-DD` - Custom end date (requires `from`)

**Examples**:
```bash
# Dry run
curl "https://us-central1-time-2-trade-app.cloudfunctions.net/syncEconomicEventsCalendarNow?dryRun=true"

# Production sync
curl "https://us-central1-time-2-trade-app.cloudfunctions.net/syncEconomicEventsCalendarNow"

# Custom date range
curl "https://us-central1-time-2-trade-app.cloudfunctions.net/syncEconomicEventsCalendarNow?from=2025-01-01&to=2025-12-31"
```

## 🐛 Troubleshooting

### "NEWS_API_KEY environment variable not set"
- Make sure `.env` file exists in `functions/` directory
- Verify `NEWS_API_KEY=your_key` is set
- For production, set via `firebase functions:secrets:set NEWS_API_KEY`

### "API request failed: 401"
- Invalid API key
- Check your key at https://www.jblanked.com/news/api/docs/

### "API request failed: 403"
- API key doesn't have permission for Calendar endpoint
- Contact JBlanked support

### Function timeout
- Default timeout: 540 seconds (9 minutes)
- If syncing large date ranges, increase `timeoutSeconds` in `src/index.ts`

## 📝 Development Commands

```bash
# Build TypeScript
npm run build

# Watch mode (auto-rebuild on changes)
npm run build:watch

# Run linter
npm run lint

# Start local emulator
npm run serve

# Deploy to production
npm run deploy

# View function logs
npm run logs
```

## 🔒 Security Notes

1. **Never commit `.env` file** - it contains your API key
2. **Use Firebase Secrets** for production environment variables
3. **Enable CORS** is set to `true` for browser access - restrict if needed
4. **Max Instances** set to 10 to prevent unexpected scaling costs

## 📚 Resources

- [JBlanked API Docs](https://www.jblanked.com/news/api/docs/calendar/)
- [Firebase Functions v2 Docs](https://firebase.google.com/docs/functions)
- [Firebase Scheduler Docs](https://firebase.google.com/docs/functions/schedule-functions)
