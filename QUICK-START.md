# Quick Start: Deploying the Application System

Everything you need to launch the Root Ventures multi-channel application system.

## 🎯 What You Have

Three ways for candidates to apply:
1. **Web Terminal** - Browser-based CLI at root.vc
2. **MCP Server** - Claude Desktop integration
3. **Email** - Traditional fallback

All submit to Attio with source tracking.

## 🚀 Deploy in 15 Minutes

### 1. Publish MCP Server (5 min)

```bash
cd /Users/avidan/Development/cli-website-fork/mcp-server

# Login to npm
npm login

# Publish
npm publish --access public
```

**Package will be available as:** `@rootvc/jobs-mcp-server`

### 2. Deploy Web Terminal (5 min)

```bash
cd /Users/avidan/Development/cli-website-fork

# Push to GitHub
git add .
git commit -m "Add interactive job application system"
git push origin main
```

If your repo is connected to Netlify, it will auto-deploy.

**Or manually deploy:**
```bash
npm run build
netlify deploy --prod
```

### 3. Share with Candidates (5 min)

**Option A: Update job posting**

Use the template in `DISTRIBUTION-GUIDE.md`

**Option B: Tweet it**

```
🚀 We're hiring! Apply to Root Ventures via:
• Terminal: root.vc
• Claude Desktop: npx @rootvc/jobs-mcp-server
• Email: hello@root.vc

Details: [link]
```

**Option C: HackerNews**

See template in `DISTRIBUTION-GUIDE.md`

## 📋 For Candidates

### Web Terminal

1. Go to root.vc
2. Type: `apply 1`
3. Follow prompts

### Claude Desktop MCP

**One-line install:**
```bash
curl -fsSL https://raw.githubusercontent.com/rootvc/cli-website/main/mcp-server/install.sh | bash
```

**Or manual setup:**
Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:
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

Then restart Claude Desktop and say: "Apply to Root Ventures"

## 📊 Tracking

Check Attio for applications tagged with:
- `source: "CLI"` - Web terminal
- `source: "MCP Server"` - Claude Desktop
- Manual tag - Email applications

## 🎬 Next Steps

1. ✅ Publish MCP server to npm
2. ✅ Deploy web terminal to production
3. ✅ Update job postings
4. ⬜ Post on social media
5. ⬜ Monitor applications in Attio
6. ⬜ Iterate based on feedback

## 📚 Documentation

- **For candidates:** `mcp-server/README-FOR-CANDIDATES.md`
- **For distribution:** `DISTRIBUTION-GUIDE.md`
- **Web terminal guide:** `DEPLOYMENT.md`
- **MCP server guide:** `mcp-server/README.md`

## 🐛 Troubleshooting

**MCP server not connecting?**
- Check Node version: `node --version` (need 18+)
- Restart Claude Desktop
- Check logs: `~/Library/Logs/Claude/mcp-server-root-ventures-jobs.log`

**Web terminal not deploying?**
- Check Netlify build logs
- Verify `netlify.toml` is in root directory
- Run `npm run build` locally to test

**Applications not reaching Attio?**
- Test webhook directly: See `mcp-server/DEPLOYMENT.md`
- Check Attio webhook configuration
- Verify HTTP 202 responses in logs

## 💡 Pro Tips

1. **Track which method works best** - Create an Attio view filtered by source
2. **A/B test messaging** - Try different social media posts
3. **Engage the community** - Share on HackerNews, Reddit, Twitter
4. **Blog about it** - Technical posts about the implementation
5. **Make it open source** - Let others fork your approach

## 🎯 Success Checklist

Before you announce:

- [ ] MCP server published to npm and tested
- [ ] Web terminal deployed to production and tested
- [ ] Installer script accessible via URL
- [ ] Job posting updated with all three methods
- [ ] Tested full application flow end-to-end
- [ ] Attio webhook confirmed working
- [ ] Support email (hello@root.vc) is monitored
- [ ] Social media posts drafted
- [ ] README and docs are clear

## 📞 Questions?

Everything is documented in:
- `/Users/avidan/Development/cli-website-fork/DISTRIBUTION-GUIDE.md`

You're ready to ship! 🎉
