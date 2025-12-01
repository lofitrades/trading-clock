# Cloud Functions Quick Reference

**Version:** 2.1.0  
**Last Updated:** December 1, 2025

---

## 🚀 Quick Deploy

```bash
cd "d:\Lofi Trades\trading-clock\functions"
npm run build
firebase deploy --only functions
```

---

## 📋 Function Summary

| Function | Type | Schedule | Date Range | Memory | Timeout | Use Case |
|----------|------|----------|------------|--------|---------|----------|
| **syncHistoricalEvents** | HTTPS (Admin) | Manual | 2y back, 1y forward | 1 GiB | 9 min | Initial setup, recovery |
| **syncRecentEventsScheduled** | Scheduled | Daily 5 AM ET | 7d back, 14d forward | 512 MiB | 5 min | Daily maintenance |
| **syncRecentEventsNow** | HTTPS (Admin) | Manual | 7d back, 14d forward | 512 MiB | 5 min | Immediate updates |
| ~~syncEconomicEventsCalendarScheduled~~ | Scheduled | Daily 5 AM ET | 1y back, 1y forward | 512 MiB | 9 min | Legacy (can deprecate) |
| ~~syncEconomicEventsCalendarNow~~ | HTTPS | Manual | Custom/3y | 512 MiB | 9 min | Legacy (can deprecate) |

---

## 🔧 Manual Trigger Commands

### Test Recent Sync (Low Cost - Safe to Test)

```bash
curl -X POST https://us-central1-trading-clock-dev.cloudfunctions.net/syncRecentEventsNow \
  -H "Content-Type: application/json" \
  -d '{
    "sources": ["mql5"],
    "adminToken": "YOUR_FIREBASE_ID_TOKEN"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "type": "recent_manual_sync",
  "dateRange": { "from": "2025-11-24", "to": "2025-12-15" },
  "totalSources": 1,
  "totalRecordsUpserted": 150,
  "results": [...]
}
```

### Historical Sync (High Cost - Use Sparingly)

```bash
curl -X POST https://us-central1-trading-clock-dev.cloudfunctions.net/syncHistoricalEvents \
  -H "Content-Type: application/json" \
  -d '{
    "sources": ["mql5"],
    "adminToken": "YOUR_FIREBASE_ID_TOKEN"
  }'
```

---

## 📊 API Cost Estimates

| Sync Type | Date Range | Credits per Call | Annual Cost (if daily) |
|-----------|------------|------------------|------------------------|
| **Recent Sync** | 21 days | ~0.06 | ~22 credits |
| **Historical Sync** | ~1,095 days | ~3 | ~3-15 credits (rare) |
| **Legacy Daily Sync** | 730 days | ~2 | ~730 credits |

**Cost Savings:** 95% reduction (730 → 25-37 credits annually)

---

## 🔍 Monitoring

### Firebase Console
- **Functions → Logs:** Real-time execution logs
- **Functions → Usage:** Execution count, errors, memory
- **Firestore → Data:** Verify events written to `/economicEvents/{source}/events`

### Check Scheduled Sync Execution
```bash
# View recent logs
firebase functions:log --only syncRecentEventsScheduled --limit 10
```

### Check Recent Sync Status
```bash
# Check if function deployed
firebase functions:list | grep syncRecentEventsScheduled
```

---

## ⚠️ TODO: Admin Authentication

**Current Status:** 🔒 Functions accept any token (not secure)

**Required Implementation:**
1. Create `functions/src/utils/auth.ts` with `verifyAdmin()` function
2. Add admin verification to both admin-only functions
3. Set custom claims for admin users
4. Test authentication flow

**Priority:** HIGH (before production use)

---

## 🧪 Testing Checklist

- [ ] Build TypeScript without errors ✅ DONE
- [ ] Deploy to Firebase
- [ ] Test `syncRecentEventsNow` with valid token
- [ ] Verify events written to Firestore
- [ ] Wait for 5 AM ET, check `syncRecentEventsScheduled` logs
- [ ] Test `syncHistoricalEvents` (last - high cost)
- [ ] Implement admin authentication
- [ ] Test with invalid/expired tokens

---

## 📚 Full Documentation

See `CLOUD_FUNCTIONS_ENHANCEMENT.md` for comprehensive details:
- Architecture overview
- Implementation details
- Security guidelines
- Cost analysis
- Troubleshooting guide

---

## 🎯 Recommended Deployment Order

1. **Deploy all functions** ✅ Safe (replaces existing)
   ```bash
   firebase deploy --only functions
   ```

2. **Test Recent Manual Sync** (Low cost, ~$0.06)
   ```bash
   curl -X POST .../syncRecentEventsNow -d '{"sources":["mql5"]}'
   ```

3. **Monitor Scheduled Sync** (Wait for next day 5 AM ET)
   - Check Firebase Console logs
   - Verify events updated

4. **Test Historical Sync** (High cost, ~$3 - Do last)
   ```bash
   curl -X POST .../syncHistoricalEvents -d '{"sources":["mql5"]}'
   ```

5. **Implement Admin Auth** (Before production use)
   - Create auth.ts utility
   - Add verification to admin functions
   - Test with real Firebase tokens

6. **Deprecate Legacy Functions** (Optional - after confidence)
   - Keep `syncEconomicEventsCalendarNow` for compatibility
   - Remove `syncEconomicEventsCalendarScheduled` schedule

---

**Questions?** See `CLOUD_FUNCTIONS_ENHANCEMENT.md` for detailed troubleshooting.
