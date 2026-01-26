# MCP Server Deployment Guide

## Publishing to npm

### 1. Prepare for Publishing

Make sure you have an npm account:
```bash
npm login
```

### 2. Update Package Name (if needed)

If `@rootvc` namespace isn't available, update `package.json`:
```json
{
  "name": "root-ventures-jobs-mcp-server"
}
```

### 3. Publish to npm

From the mcp-server directory:
```bash
npm publish --access public
```

If using a scoped package (@rootvc):
```bash
npm publish --access public
```

### 4. Test the Published Package

```bash
npx root-ventures-jobs-mcp-server
# or
npx @rootvc/jobs-mcp-server
```

## Promoting the MCP Application Method

### 1. Add to Job Posting

Include in your job descriptions:

```markdown
## How to Apply

**For the technically adventurous:**
Apply via our MCP server in Claude Desktop:

1. Install Claude Desktop
2. Add our MCP server to your config:
   ```json
   {
     "mcpServers": {
       "root-ventures-jobs": {
         "command": "npx",
         "args": ["-y", "@rootvc/jobs-mcp-server"]
       }
     }
   }
   ```
3. Chat with Claude: "Apply to Root Ventures"

**Other options:**
- Terminal: https://root.vc (type `apply 1`)
- Email: hello@root.vc
```

### 2. Blog Post Ideas

**Title:** "Hiring Engineers the Way Engineers Work: Job Applications via MCP"

**Key Points:**
- Why we built multiple technical application paths
- The psychology of "show, don't tell" in hiring
- How it filters for technical curiosity
- Early results and interesting applications received

### 3. Twitter/X Announcement

```
Hiring for our SF-based VC associate role 🚀

Apply via:
• MCP server (for Claude Desktop users)
• Terminal at root.vc
• Traditional email

We're looking for technical talent that appreciates creative engineering.

Details: [link]

#hiring #deeptech #MCP
```

### 4. HackerNews Post

**Title:** "Root Ventures is hiring – apply via MCP, CLI, or email"

**Text:**
```
Hey HN! Root Ventures (deep tech seed fund in SF) is hiring a technical associate.

We've built a few fun ways to apply:

1. MCP Server - Apply through Claude Desktop using our Model Context Protocol server (npx @rootvc/jobs-mcp-server)

2. Web Terminal - Visit root.vc and type "apply 1"

3. Traditional - Email hello@root.vc

Why multiple paths? Because the best technical hires appreciate creative engineering and aren't afraid to try new tools.

Looking for someone with:
- Strong technical background
- Genuine curiosity about emerging tech
- Communication skills
- Startup hustle

Code is open source: [github link]

Happy to answer questions!
```

### 5. Add to Root.vc Website

Update the terminal welcome message:

```javascript
term.stylePrint(
  `\r\nOpen jobs detected. Type ${colorText("jobs", "command")} for more info.`
);
term.stylePrint(
  `Or apply via MCP: npx @rootvc/jobs-mcp-server`,
  false
);
```

### 6. LinkedIn Post

```
We're hiring a technical associate at Root Ventures 🎯

But we're doing it differently.

Instead of a standard application form, we built:
• An MCP server for Claude Desktop
• An interactive terminal at root.vc
• (Or just email us)

Why? Because exceptional technical talent appreciates:
✓ Novel approaches
✓ Technical craftsmanship
✓ Tools that respect their workflow

If you're curious about deep tech investing and want to work with engineers building the future, check it out.

[Link to job details]

#hiring #deeptech #engineering
```

## Tracking & Analytics

### Add Source Tracking

The MCP server already tags applications with `source: "MCP Server"` in the Attio submission.

### Monitor Adoption

Track:
- npm package downloads: `npm info @rootvc/jobs-mcp-server`
- Applications by source in Attio
- GitHub stars/forks
- Social media engagement

### Success Metrics

- % of candidates using MCP vs. CLI vs. traditional
- Quality of candidates by application method
- Conversion rate from application to interview
- Social media reach and engagement

## Maintenance

### Updating Job Listings

Edit `index.js` and update the `JOBS` object:

```javascript
const JOBS = {
  "associate": { ... },
  "intern": {
    title: "Summer Intern",
    description: "..."
  }
};
```

Then publish a new version:
```bash
npm version patch  # or minor/major
npm publish
```

### Monitoring

Check npm logs for download stats:
```bash
npm view @rootvc/jobs-mcp-server
```

## Security Considerations

✅ **Current setup:**
- Attio webhook URL is public (by design)
- No sensitive credentials in code
- Input validation on required fields
- Error handling for API failures

⚠️ **Future considerations:**
- Rate limiting (if spam becomes an issue)
- Email validation (regex check)
- Honeypot fields for bot detection

## Getting Help

Questions about deployment or promotion?
- Email: hello@root.vc
- Twitter: @rootvc
- GitHub Issues: [repo link]

---

Ready to publish? Run:
```bash
cd mcp-server
npm publish --access public
```
