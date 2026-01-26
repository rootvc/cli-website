# Apply to Root Ventures via Claude Desktop

Apply to Root Ventures positions directly through Claude Desktop using this MCP server.

## What is this?

An MCP (Model Context Protocol) server that lets you apply to Root Ventures by simply chatting with Claude Desktop. No forms, no copy-pasting - just a natural conversation.

## Quick Start

### 1. Prerequisites

- [Claude Desktop](https://claude.ai/download) installed
- Node.js 18+ installed ([download here](https://nodejs.org))

### 2. Installation

**Option A: One-line install (easiest)**

Open your terminal and run:

```bash
npx @rootvc/jobs-mcp-server-install
```

**Option B: Manual configuration**

1. Find your Claude Desktop config file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. Add this to the config:

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

3. Restart Claude Desktop (completely quit and reopen)

### 3. Apply!

Open Claude Desktop and say:

```
Show me open positions at Root Ventures
```

or

```
I want to apply to Root Ventures
```

Claude will help you through the application process.

## What Information Will Be Collected?

- **Name** (required)
- **Email** (required)
- **LinkedIn profile** (optional)
- **GitHub username** (optional)
- **Why Root? What makes you a great fit?** (optional)

## Example Conversation

```
You: Tell me about the Root Ventures associate position

Claude: [Uses MCP tools to show job description]

You: I'd like to apply. My name is Jane Doe, email is jane@example.com,
     GitHub is janedoe. I'm excited about deep tech investing because I've
     been building robotics projects for years and want to support founders
     in this space.

Claude: [Uses MCP tools to submit your application]

     ✓ Application submitted successfully!

     Thank you for applying, Jane! Your application has been received...
```

## Other Ways to Apply

Not into MCP? We've got you covered:

- **Web Terminal**: Visit [root.vc](https://root.vc) and type `apply 1`
- **Email**: Send your info to hello@root.vc

## About Root Ventures

Root Ventures is a San Francisco-based deep tech seed fund. As engineers ourselves, we specialize in leading initial funding for founders tackling new technical opportunities.

- 💰 Typical investment: $3-5M
- 🎯 Focus: Deep tech, automation, robotics, hardware
- 📍 Location: San Francisco, CA
- 🌐 Website: [root.vc](https://root.vc)
- 🐦 Twitter: [@rootvc](https://twitter.com/rootvc)

## Troubleshooting

**MCP server not connecting?**

1. Make sure you're using Node.js 18 or later: `node --version`
2. Try restarting Claude Desktop (Cmd+Q or Ctrl+Q, then reopen)
3. Check the config file is valid JSON (no trailing commas)
4. Look for errors in: `~/Library/Logs/Claude/mcp-server-root-ventures-jobs.log`

**Application not submitting?**

Make sure you've provided at least:
- Your full name
- Your email address

Optional fields (LinkedIn, GitHub, notes) can be left blank.

**Still having issues?**

Email us directly at hello@root.vc - we'd still love to hear from you!

## Why This Application Method?

We believe the best technical talent appreciates creative engineering. By offering multiple application methods (MCP, terminal, email), we're looking for people who:

- 🛠️ Enjoy trying new developer tools
- 🎨 Appreciate technical creativity
- 🚀 Are comfortable with emerging technologies
- 💡 Think outside the box

If that's you, we'd love to chat!

## Privacy & Data

- Your application data goes directly to Root Ventures' hiring system
- We don't store or share your information with third parties
- Standard job application privacy practices apply

## Questions?

- Email: hello@root.vc
- GitHub Issues: [github.com/rootvc/cli-website](https://github.com/rootvc/cli-website)

---

Good luck! 🚀
