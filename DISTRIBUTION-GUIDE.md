# Distribution Guide: Root Ventures Application System

This guide shows you how to package and distribute the application system to candidates.

## 🎯 Three Application Methods You've Built

1. **Web Terminal** - https://root.vc
2. **MCP Server** - For Claude Desktop users
3. **Traditional Email** - hello@root.vc

## 📦 Publishing the MCP Server to npm

### Step 1: Prepare for Publishing

```bash
cd /Users/avidan/Development/cli-website-fork/mcp-server

# Login to npm (if you haven't already)
npm login

# Test the package locally
npm pack
```

### Step 2: Publish to npm

```bash
# If @rootvc scope is available:
npm publish --access public

# If @rootvc is taken, use a different name:
# Update package.json name to: "root-ventures-jobs-mcp-server"
npm publish
```

### Step 3: Test the Published Package

```bash
npx @rootvc/jobs-mcp-server
# or
npx root-ventures-jobs-mcp-server
```

## 🌐 Hosting the Installer Script

### Option A: GitHub Gist

1. Go to https://gist.github.com
2. Create a new gist with `install.sh`
3. Get the raw URL
4. Share with candidates:

```bash
curl -fsSL https://gist.githubusercontent.com/[username]/[gist-id]/raw/install.sh | bash
```

### Option B: In Your Repo

```bash
cd /Users/avidan/Development/cli-website-fork

# Commit the installer
git add mcp-server/install.sh
git commit -m "Add MCP server installer script"
git push

# Share with candidates:
curl -fsSL https://raw.githubusercontent.com/rootvc/cli-website/main/mcp-server/install.sh | bash
```

### Option C: Host on root.vc

Add to your website:
- https://root.vc/install-mcp.sh

Then candidates can run:
```bash
curl -fsSL https://root.vc/install-mcp.sh | bash
```

## 📝 Job Posting Template

Here's how to present all three application methods in your job postings:

```markdown
# Venture Capital Associate

**Root Ventures** - San Francisco, CA

[Job description here...]

## How to Apply

We offer three ways to apply - pick your favorite:

### 1. 🖥️ Interactive Terminal (Recommended)

Visit **[root.vc](https://root.vc)** in your browser and type:
```
apply 1
```

### 2. 🤖 Claude Desktop (For AI Power Users)

If you use Claude Desktop, install our MCP server:

```bash
curl -fsSL https://root.vc/install-mcp.sh | bash
```

Then chat with Claude: "Apply to Root Ventures"

**Manual setup:**
Add to your Claude Desktop config:
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

### 3. ✉️ Traditional Email

Send your resume and a note about why you're interested to:
**hello@root.vc**

---

All methods go to the same place - use whichever fits your workflow!
```

## 🐦 Social Media Promotion

### Twitter/X Announcement

```
🚀 We're hiring! Looking for a technical associate to join Root Ventures in SF.

Apply via:
• Interactive terminal: root.vc
• Claude Desktop (MCP server)
• Email: hello@root.vc

We built 3 ways to apply because great technical talent deserves creative recruiting.

Details: [link]

#hiring #deeptech #VC
```

### LinkedIn Post

```
We're hiring a Venture Capital Associate at Root Ventures!

But we're doing it differently.

Instead of a standard application form, we built:
✅ An interactive web terminal
✅ An MCP server for Claude Desktop
✅ (Or just email us)

Why? Because exceptional technical talent appreciates:
• Novel approaches
• Developer-first tools
• Companies that walk the walk

If you're excited about deep tech, automation, and working with
technical founders, check it out: [link]

#hiring #venturecapital #deeptech
```

### HackerNews Post

**Title:** Root Ventures is hiring – apply via terminal, MCP, or email

**Text:**
```
Hey HN! Root Ventures (deep tech seed fund in SF) is hiring a technical associate.

We built a few ways to apply:

1. Web Terminal (https://root.vc) - Type "apply 1" in your browser

2. MCP Server - For Claude Desktop users:
   curl -fsSL https://root.vc/install-mcp.sh | bash

3. Traditional - Email hello@root.vc

Why? Because we want people who appreciate creative engineering
and aren't afraid to try new tools.

Looking for someone with:
- Strong technical background
- Curiosity about emerging tech
- Communication skills
- Startup hustle

All code is open source: https://github.com/rootvc/cli-website

Happy to answer questions!
```

## 📊 Tracking Applications

All three methods tag applications in Attio:

- `source: "CLI"` - Web terminal
- `source: "MCP Server"` - Claude Desktop
- `source: "Email"` or manual - Traditional

Create an Attio view to track which method attracts the best candidates!

## 🎥 Demo Video Ideas

Create a short video showing:

1. **Terminal Demo** (30 seconds)
   - Open root.vc
   - Type `apply 1`
   - Fill out application
   - Get confirmation

2. **MCP Demo** (45 seconds)
   - Show installation command
   - Restart Claude Desktop
   - Chat: "Apply to Root Ventures"
   - Natural conversation flow
   - Success confirmation

3. **Combined Video** (90 seconds)
   - "Three ways to apply to Root Ventures"
   - Quick demo of each method
   - "Pick your favorite workflow"

## 🔗 Landing Page

Consider creating a dedicated page at root.vc/apply with:

- Overview of the role
- All three application methods with clear instructions
- FAQs
- Links to:
  - root.vc (terminal)
  - GitHub repo
  - Installation guide
  - Email

## 📈 Growth Hacking Ideas

1. **Developer Community Posts**
   - Post in r/programming, r/sideproject
   - Show off the technical implementation
   - "We built a terminal-based job application"

2. **MCP Community**
   - Post in MCP Discord/forums
   - Share as an example MCP server
   - Contributes to the MCP ecosystem

3. **Blog Post**
   - "How We're Hiring Engineers the Way Engineers Work"
   - Technical breakdown of the implementation
   - Lessons learned about creative recruiting

4. **Open Source**
   - Make the repo public
   - Encourage forks/stars
   - Others might copy the approach

## 🛠️ Maintenance

### Updating Job Listings

**In the terminal (config/jobs.js):**
```javascript
const jobs = {
  1: ["Title", "Description line 1", "Description line 2", ...],
  2: ["Another Role", "Description", ...],
};
```

**In the MCP server (index.js):**
```javascript
const JOBS = {
  "associate": { title: "...", description: "..." },
  "intern": { title: "...", description: "..." },
};
```

### Publishing Updates

When you make changes:

```bash
# Update version
npm version patch  # or minor/major

# Publish to npm
npm publish

# Users get updates automatically with npx
```

## 🎯 Success Metrics to Track

- Total applications received
- Applications by source (CLI / MCP / Email)
- Quality of candidates by source
- Conversion rate: application → interview
- Social media engagement
- npm package downloads
- GitHub stars/forks

## 🤝 Community Engagement

Consider:
- Writing a technical blog post
- Speaking at developer meetups about the implementation
- Creating a case study
- Open sourcing as a template others can fork

## 📞 Support

If candidates have issues:
- Email: hello@root.vc
- GitHub Issues: For technical problems
- Twitter DM: @rootvc

---

Ready to ship? Here's your checklist:

- [ ] Publish MCP server to npm
- [ ] Host installer script (GitHub or root.vc)
- [ ] Deploy web terminal to production (Netlify)
- [ ] Update job postings with all three methods
- [ ] Post on social media
- [ ] Consider HackerNews post
- [ ] Set up tracking in Attio
- [ ] Create FAQ/support docs

Good luck! 🚀
