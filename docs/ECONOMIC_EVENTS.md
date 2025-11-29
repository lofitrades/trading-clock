# Economic Events Feature

## Overview
The Economic Events feature displays today's economic calendar events in a sleek, collapsible panel fixed to the right side of the application. This feature integrates with the JBlanked News API to provide real-time economic event data for traders.

## Features

### Current Implementation
- ✅ Display today's economic events in a responsive table
- ✅ Real-time data from JBlanked News API
- ✅ Impact level indicators (High, Medium, Low)
- ✅ Currency filters
- ✅ Expandable rows with detailed information (Actual, Forecast, Previous)
- ✅ Auto-refresh capability
- ✅ Loading and error states
- ✅ Past event dimming (visual indicator)
- ✅ Fixed panel positioning (right edge)
- ✅ Responsive design (mobile-friendly)
- ✅ Toggle button (floating action button)

### Future Enhancements
- 🔜 Impact level filtering (High/Medium/Low)
- 🔜 Currency filtering (USD, EUR, GBP, etc.)
- 🔜 Date range selection
- 🔜 Event notifications/alerts
- 🔜 Historical event data
- 🔜 Event search functionality
- 🔜 Export to CSV/PDF
- 🔜 Favorite events
- 🔜 AI-powered event analysis integration

## Setup

### 1. Get API Key
1. Visit [JBlanked API Key Page](https://www.jblanked.com/api/key/)
2. Sign up or log in to get your free API key
3. Copy your API key

### 2. Add to Environment Variables
Add your API key to the `.env` file:
```env
VITE_NEWS_API_KEY=your_api_key_here
```

**Note:** The `.env` file is gitignored for security. Use `.env.example` as a template.

### 3. Restart Development Server
After adding the API key, restart the development server:
```bash
npm run dev
```

## Architecture

### Components
- **`EconomicEvents.jsx`** - Main component displaying the events panel
  - Handles state management (loading, error, expansion)
  - Fetches data from API
  - Renders table with collapsible rows
  - Auto-refresh functionality

### Utilities
- **`newsApi.js`** - API service layer
  - `getCalendarEvents()` - Fetch events with optional filters
  - `getTodayEvents()` - Convenience wrapper for today's events
  - `formatEventData()` - Parse and format API response
  - `sortEventsByTime()` - Sort events chronologically
  - `filterEventsByImpact()` - Filter by impact level
  - `getImpactColor()` - Get color based on impact
  - `getImpactBadge()` - Get badge text for impact

### App Integration
- **`App.jsx`** - Integrated with floating action button (FAB)
  - Toggle button positioned at bottom-right
  - Panel slides in from right when opened
  - Doesn't interfere with clock layout

## API Documentation

### Endpoint Used
```
GET https://www.jblanked.com/news/api/calendar/
```

### Response Structure
```json
[
  {
    "id": "string",
    "name": "string",
    "currency": "USD",
    "category": "string",
    "date": "ISO 8601 timestamp",
    "actual": "string",
    "forecast": "string",
    "previous": "string",
    "outcome": "string",
    "strength": "high|medium|low",
    "quality": "string",
    "projection": "string"
  }
]
```

### Query Parameters (Future Implementation)
- `date` - Filter by date (YYYY-MM-DD)
- `currency` - Filter by currency code (USD, EUR, etc.)
- `impact` - Filter by impact level (high, medium, low)

## Design System

### Colors
- **High Impact:** `#d32f2f` (Red)
- **Medium Impact:** `#f57c00` (Orange)
- **Low Impact:** `#018786` (Primary Teal)

### Typography
- **Header:** MUI Typography variant `h6`
- **Body Text:** MUI Typography variant `body2`
- **Captions:** MUI Typography variant `caption`

### Layout
- **Width:** 400px (tablet), 450px (desktop), 100% (mobile)
- **Height:** 100vh (full viewport height)
- **Position:** Fixed right edge
- **Z-index:** 1200 (above most elements, below modals)

## Usage

### Opening the Panel
Click the floating calendar icon button at the bottom-right of the screen.

### Refreshing Data
Click the refresh icon in the panel header to manually refresh event data.

### Viewing Event Details
Click on any event row to expand and view:
- Actual value
- Forecast value
- Previous value
- Event category

### Closing the Panel
Click the close icon in the panel header or click the calendar button again.

## Error Handling

### No API Key
- Warning logged to console
- API requests still attempted (may work without auth for limited access)
- Error message displayed if API returns 401/403

### Network Errors
- Error alert displayed in panel
- "Retry" via refresh button
- User-friendly error messages

### Empty Data
- "No Events Today" message displayed
- Encourages users to check back later

## Performance Considerations

### Optimization Strategies
1. **Memoization** - Event list memoized to prevent unnecessary re-renders
2. **Lazy Rendering** - Details only rendered when row expanded
3. **Debouncing** - API calls throttled (manual refresh only, no auto-refresh)
4. **Sticky Header** - Table header remains visible during scroll
5. **Virtual Scrolling** - (Future) For large event lists

### Bundle Impact
- **newsApi.js:** ~2KB
- **EconomicEvents.jsx:** ~4KB
- **Total Addition:** ~6KB (minimal impact)

## Testing Checklist

### Functional Testing
- [ ] API key authentication works
- [ ] Events load on panel open
- [ ] Refresh button updates data
- [ ] Close button dismisses panel
- [ ] Row expansion shows details
- [ ] Past events are dimmed
- [ ] Impact colors are correct
- [ ] Time is displayed correctly

### Responsive Testing
- [ ] Mobile (< 600px): Panel takes full width
- [ ] Tablet (600-960px): Panel is 400px wide
- [ ] Desktop (> 960px): Panel is 450px wide
- [ ] Scrolling works smoothly
- [ ] Toggle button doesn't interfere with timezone selector

### Error Testing
- [ ] Invalid API key shows error
- [ ] Network failure shows error
- [ ] Empty response shows "No Events" message
- [ ] Malformed data doesn't crash app

## Troubleshooting

### Events Not Loading
1. Check if API key is set in `.env`
2. Verify API key is valid at [JBlanked](https://www.jblanked.com/api/key/)
3. Check browser console for network errors
4. Verify internet connection

### Panel Not Appearing
1. Check if toggle button is visible
2. Verify `eventsOpen` state in React DevTools
3. Check for z-index conflicts
4. Clear browser cache and reload

### Styling Issues
1. Verify MUI theme is loaded
2. Check for CSS conflicts
3. Test in different browsers
4. Check viewport size

## Contributing

When adding features to the Economic Events panel:

1. **Follow MUI patterns** - Use Material-UI components
2. **Maintain enterprise standards** - Loading states, error handling
3. **Keep it minimal** - Match app's clean design
4. **Test responsively** - Ensure mobile compatibility
5. **Document changes** - Update this file

## API Rate Limits

### Free Tier
- Requests per day: Check with provider
- Requests per minute: Check with provider

### Paid Tiers
Refer to [JBlanked Pricing](https://www.jblanked.com/api/billing/)

## Support

### API Issues
- **Documentation:** https://www.jblanked.com/news/api/docs/
- **Community:** https://www.jblanked.com/community/
- **Twitter:** [@realJBlanked](https://twitter.com/realJBlanked)

### App Issues
- **Developer:** Lofi Trades
- **Email:** lofitradesx@gmail.com
- **Twitter:** [@lofi_trades](https://x.com/lofi_trades)

---

**Last Updated:** November 28, 2025
**Version:** 1.0.0 (Initial Release)
