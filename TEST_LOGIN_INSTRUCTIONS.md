# 🧪 Quick Login Test Instructions

## Step 1: Try Test Credentials (Recommended)
1. Click "Use Test Account" button
2. Fields auto-fill with: admin@fibertrace.app / admin123456
3. Click "Login"
4. Expected: ✅ Instantly logs in (offline mode)

## Step 2: Verify Error Handling
Try one of these to verify error messages work:

**Test Wrong Password:**
- Email: admin@fibertrace.app
- Password: wrongpassword
- Expected: "Wrong Password" alert

**Test Unknown Account:**
- Email: unknown@test.com
- Password: password123
- Expected: "Account Not Found" alert

## Step 3: Test All User Roles
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fibertrace.app | admin123456 |
| Tech | john@fibertrace.app | tech123456 |
| Field | jane@fibertrace.app | field123456 |

## What's New:
✅ Works 100% offline
✅ Test credentials built-in
✅ Automatic retries on network issues
✅ "Use Test Account" button for quick demo
✅ Better error messages
✅ No external API required for development

## Production Notes:
- Test credentials are for development/testing
- When ready, switch to real backend API
- Offline mode allows cached user login
- No internet required to get started
