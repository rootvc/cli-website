# CLI Website with Interactive Applications

This fork of the Root VC CLI website adds an interactive job application flow that submits directly to Attio.

## What's New

### Features Added:
1. **Interactive Application Flow**: Candidates can now apply directly in the terminal using the `apply` command
2. **Job Listings**: Added a Venture Capital Associate position (in `config/jobs.js`)
3. **Netlify Functions**: Backend function to proxy Attio API calls
4. **Terminal Input Collection**: New `collectInput()` helper for interactive data entry

## Testing Locally

The dev server should already be running on http://localhost:8888

Try these commands in the terminal:
- `jobs` - See open positions
- `fg 1` - View the Associate role details
- `apply 1` - Start the interactive application process

## How It Works

1. User types `apply 1` in the terminal
2. Terminal prompts for:
   - Name (required)
   - Email (required)
   - LinkedIn URL (optional)
   - GitHub username (optional)
   - Why Root / notes (optional)
3. Data is submitted to `/.netlify/functions/submit-application`
4. Netlify function forwards to Attio webhook
5. Success/error message shown to user

## File Changes

### New Files:
- `netlify/functions/submit-application.js` - Proxies to Attio API
- `netlify.toml` - Netlify configuration
- `DEPLOYMENT.md` - This file

### Modified Files:
- `config/jobs.js` - Added Associate position
- `config/commands.js` - Updated `jobs` and `apply` commands
- `js/terminal-ext.js` - Added `collectInput()` helper

## Deployment to Production

### Option 1: Deploy to Netlify (Recommended)

1. Push this repo to GitHub:
   ```bash
   cd /Users/avidan/Development/cli-website-fork
   git remote set-url origin <your-new-repo-url>
   git add .
   git commit -m "Add interactive job application flow"
   git push origin main
   ```

2. Connect to Netlify:
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repo
   - Build settings should auto-detect from netlify.toml
   - Deploy!

3. The site will be live at `https://your-site-name.netlify.app`

### Option 2: Deploy to Root.vc Domain

If you want this on the main root.vc site:

1. Update the existing root.vc repo with these changes
2. Netlify will auto-deploy on push (already configured)

## Security Considerations

### Current Setup:
- Attio webhook URL is hardcoded in the Netlify function
- This is okay since the webhook is designed to be public

### For Production (Optional):
You could move the Attio webhook to an environment variable:

1. In `netlify/functions/submit-application.js`, replace the URL with:
   ```javascript
   const attioWebhook = process.env.ATTIO_WEBHOOK_URL;
   ```

2. Add to Netlify environment variables:
   - Go to Site settings → Environment variables
   - Add `ATTIO_WEBHOOK_URL` = `https://hooks.attio.com/w/...`

## Customization

### Adding More Job Positions:

Edit `config/jobs.js`:
```javascript
const jobs = {
  1: ["Role Title", "Description line 1", "Description line 2", ...],
  2: ["Another Role", "Description", ...],
};
```

### Changing Application Fields:

Edit the `apply` command in `config/commands.js` to add/remove fields using `term.collectInput()`.

### Modifying the Terminal Style:

- Colors: Edit `colorText()` function in `js/terminal.js`
- Prompts: Edit welcome messages in `js/terminal-ext.js`
- ASCII art: Add images to `images/` and reference in `config/team.js` or `config/portfolio.js`

## Testing the Flow

Open http://localhost:8888 in your browser and try:

```bash
> help
> jobs
> fg 1
> apply 1
```

Follow the prompts and submit. Check your Attio to confirm the entry was created.

## Troubleshooting

**Functions not working locally?**
- Make sure you ran `npm start` (not just `npm run build`)
- Netlify CLI should show functions being served

**Application submissions failing?**
- Check browser console for errors
- Verify Attio webhook URL is correct
- Test the webhook directly with curl:
  ```bash
  curl -X POST https://hooks.attio.com/w/... \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"test@example.com"}'
  ```

**Terminal not responding?**
- Try `clear` command to reset
- Refresh the page
- Check browser console for JavaScript errors
