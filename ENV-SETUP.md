# Environment Variable Setup

Before deploying to production, set up the Attio webhook URL as an environment variable.

## Quick Setup

### 1. Local Development (Optional)

For testing the web terminal locally:

```bash
cd /Users/avidan/Development/cli-website-fork
cp .env.example .env
```

Edit `.env` and add your webhook URL:
```
ATTIO_WEBHOOK_URL=https://hooks.attio.com/w/1d456d59-a7ac-4211-ac1d-fac612f7f491/5fc14931-0124-4121-b281-1dbfb64dceb2
```

### 2. Netlify Production (Required)

**Option A: Via Netlify Dashboard**

1. Go to https://app.netlify.com
2. Select your site
3. Go to: **Site settings** → **Environment variables**
4. Click **Add a variable**
5. Set:
   - **Key:** `ATTIO_WEBHOOK_URL`
   - **Value:** `https://hooks.attio.com/w/1d456d59-a7ac-4211-ac1d-fac612f7f491/5fc14931-0124-4121-b281-1dbfb64dceb2`
6. Save and redeploy

**Option B: Via Netlify CLI**

```bash
netlify env:set ATTIO_WEBHOOK_URL "https://hooks.attio.com/w/1d456d59-a7ac-4211-ac1d-fac612f7f491/5fc14931-0124-4121-b281-1dbfb64dceb2"
```

## Verify It's Working

After setting the environment variable:

```bash
# Test locally
npm start
# Visit http://localhost:8888
# Try apply 1

# Test in production (after deploy)
# Visit your production URL
# Try apply 1
```

Check Attio to confirm the application was received.

## Troubleshooting

**Error: "ATTIO_WEBHOOK_URL environment variable not set"**

This means the Netlify function can't find the environment variable.

Solution:
1. Double-check you added it in Netlify dashboard
2. Make sure you deployed AFTER adding the variable
3. Try redeploying: `netlify deploy --prod`

**Applications not reaching Attio**

1. Check Netlify function logs for errors
2. Verify the webhook URL is correct
3. Test the webhook directly:
   ```bash
   curl -X POST YOUR_WEBHOOK_URL \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","email":"test@example.com"}'
   ```

## Security Note

The `.env` file is in `.gitignore` and will NOT be committed to your repository. This is good - it means the webhook URL won't be in your public GitHub repo.

However, the **MCP server** (`mcp-server/index.js`) intentionally includes the webhook URL because:
- It runs on candidate's machines
- It needs the URL to function
- Webhooks are designed to be semi-public (write-only)
- See `SECURITY.md` for full explanation

## Done!

✅ Environment variable set for Netlify
✅ Local .env created (optional)
✅ .env is gitignored
✅ Ready to deploy

Next: See `QUICK-START.md` to deploy everything.
