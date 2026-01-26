# Security Information

## What's Public vs Private

### ✅ Safe to Publish (Included in Repository)

**MCP Server (`mcp-server/index.js`):**
- Contains the Attio webhook URL
- **This is intentional and safe** - here's why:
  - Runs on candidate's machines (via `npx`)
  - Needs the webhook URL to function
  - Webhook only accepts POST data (write-only)
  - Cannot read, modify, or delete existing Attio data
  - Attio provides rate limiting
  - We can monitor for spam submissions

### 🔒 Private (Not in Repository)

**Web Terminal Netlify Function:**
- Uses `process.env.ATTIO_WEBHOOK_URL`
- Set in Netlify dashboard (not committed to repo)
- Provides an extra layer of protection for browser-based submissions

## Setting Up Environment Variables

### For Local Development

Create a `.env` file (already gitignored):

```bash
cp .env.example .env
# Edit .env and add your actual webhook URL
```

### For Netlify Production

1. Go to your Netlify dashboard
2. Navigate to: Site settings → Environment variables
3. Add variable:
   - **Key:** `ATTIO_WEBHOOK_URL`
   - **Value:** `https://hooks.attio.com/w/1d456d59-a7ac-4211-ac1d-fac612f7f491/5fc14931-0124-4121-b281-1dbfb64dceb2`

## Why Webhook URLs Are Different from API Keys

**Webhook URLs are designed to be semi-public:**
- ✅ They're POST-only endpoints (write data)
- ✅ They can't read existing data
- ✅ They can't modify existing data
- ✅ They can't delete data
- ✅ They're rate-limited by the service
- ✅ They only accept specific data formats

**Unlike API keys which:**
- ❌ Can read data
- ❌ Can modify data
- ❌ Can delete data
- ❌ Provide full account access

## Spam Protection

If you receive spam applications:

1. **Monitor in Attio** - Check for obvious fake submissions
2. **Add validation** - Update the code to require specific fields
3. **Rotate webhook** - Create a new webhook in Attio if needed
4. **Add CAPTCHA** - For the web terminal (optional)

## What If the Webhook URL Leaks?

**Impact:** Low risk
- Someone could spam fake applications
- Cannot access your Attio data
- Cannot modify existing records

**Solution:**
1. Go to Attio → Settings → Webhooks
2. Create a new webhook
3. Update the code and republish
4. Old webhook stops accepting data

## Best Practices

1. ✅ **DO** publish the MCP server with webhook URL
2. ✅ **DO** use environment variables for Netlify
3. ✅ **DO** monitor applications for spam
4. ✅ **DO** keep `.env` files out of git
5. ❌ **DON'T** publish Attio API keys (never needed)
6. ❌ **DON'T** commit `.env` files

## Questions?

Email: hello@root.vc

## Summary

✅ **Safe to publish:** MCP server with webhook URL
✅ **Protected:** Netlify function using env vars
✅ **Never commit:** .env files, API keys
✅ **Risk level:** Low - webhooks are write-only by design
