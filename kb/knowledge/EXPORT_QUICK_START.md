# Export Events - Quick Start Guide

## Access the Export Page

Navigate to: `http://localhost:5173/trading-clock/#/export`

Or in production: `https://lofitrades.github.io/trading-clock/#/export`

## How to Use

1. **Navigate to Export Page**
   - Add `#/export` to the URL
   - Or create a link: `<a href="#/export">Export Events</a>`

2. **Click Export Button**
   - Click the blue "Export All Events" button
   - Wait for the loading indicator

3. **Download Completes**
   - File automatically downloads to your default downloads folder
   - Named: `economic-events-export-YYYY-MM-DD.json`
   - Success message shows with event count

4. **Return to App**
   - Click "Back" button in top-left
   - Or navigate to `#/` in URL

## What Gets Exported

- **All events** from `economicEventsCalendar` collection
- **All fields** including:
  - Event details (name, currency, impact)
  - Dates (converted to ISO 8601 strings)
  - Values (actual, forecast, previous)
  - Metadata (timestamps, IDs)

## Example Output

```json
[
  {
    "id": "2025_11_30_usd_non_farm_payrolls",
    "date": "2025-11-30T13:30:00.000Z",
    "event": "Non-Farm Payrolls",
    "currency": "USD",
    "impact": "High",
    "actual": "215K",
    "forecast": "200K",
    "previous": "195K",
    "createdAt": "2025-11-29T10:00:00.000Z",
    "updatedAt": "2025-11-30T13:30:05.000Z"
  }
]
```

## Features

✅ One-click export  
✅ Automatic download  
✅ Formatted JSON (2-space indent)  
✅ All timestamps in ISO 8601 format  
✅ Loading indicators  
✅ Error handling  
✅ Success confirmation  

## Technical Details

- **Component:** `src/components/ExportEvents.jsx`
- **Route:** `#/export` (hash-based routing)
- **Collection:** `economicEventsCalendar`
- **Format:** JSON
- **Size:** ~12,966 events (depends on current data)

## Troubleshooting

### Export Button Disabled
- Check if export is already in progress
- Wait for current operation to complete

### No File Downloaded
- Check browser download settings
- Look for blocked pop-ups
- Check browser console for errors

### Empty File or Error
- Verify Firestore connection
- Check Firebase security rules
- Ensure collection has data
- Check browser console logs

### Permission Errors
- Ensure user is authenticated
- Verify Firestore rules allow read access
- Check Firebase project configuration

## Security Notes

- Uses existing Firebase authentication
- Follows Firestore security rules
- No special permissions required (read-only)
- Client-side processing only

## Browser Compatibility

✅ Chrome/Edge (latest)  
✅ Firefox (latest)  
✅ Safari (latest)  
✅ Mobile browsers (iOS/Android)  

---

**Need more details?** See `EXPORT_FEATURE_DOCS.md` for complete documentation.
