# Root Ventures Jobs MCP Server

Apply to Root Ventures positions directly through Claude Desktop using the Model Context Protocol (MCP).

## What is this?

An MCP server that lets you discover and apply to Root Ventures positions without leaving your Claude Desktop conversation. Because the best candidates are the ones who appreciate technical creativity.

## Quick Start

### 1. Install Claude Desktop

Download from: https://claude.ai/download

### 2. Add the MCP Server

Edit your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**Linux:** `~/.config/Claude/claude_desktop_config.json`

Add this configuration:

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

Or if you prefer to install it first:

```bash
npm install -g @rootvc/jobs-mcp-server
```

Then configure:

```json
{
  "mcpServers": {
    "root-ventures-jobs": {
      "command": "root-ventures-jobs"
    }
  }
}
```

### 3. Restart Claude Desktop

Quit and reopen Claude Desktop for the changes to take effect.

### 4. Start Applying!

In Claude Desktop, try:

```
Show me open positions at Root Ventures
```

or

```
I want to apply to Root Ventures
```

Claude will use the MCP server to help you discover positions and submit your application.

## Available Tools

The MCP server provides three tools that Claude can use:

### `list_jobs`
Lists all open positions at Root Ventures.

### `get_job_details`
Gets detailed information about a specific position.

**Parameters:**
- `job_id` (required): The job identifier (e.g., "associate")

### `apply_to_root_ventures`
Submits a job application to Root Ventures.

**Parameters:**
- `name` (required): Your full name
- `email` (required): Your email address
- `linkedin` (optional): LinkedIn profile URL
- `github` (optional): GitHub username
- `notes` (optional): Why Root? What makes you a great fit?
- `position` (optional): Position applying for (defaults to "Venture Capital Associate")

## Example Conversation

```
You: I want to apply to Root Ventures

Claude: I can help you apply! Let me check what positions are open.
        [Uses list_jobs tool]

        Root Ventures has an open position for Venture Capital Associate.
        Would you like to learn more about it?

You: Yes, tell me about it

Claude: [Uses get_job_details tool]

        Here are the details... [shows full job description]

        Would you like to apply?

You: Yes, I'd like to apply. My name is Jane Doe, email is jane@example.com,
     GitHub is janedoe, and I'm excited about deep tech investing because...

Claude: [Uses apply_to_root_ventures tool]

        ✓ Application submitted successfully!

        Thank you for applying, Jane! Your application has been received...
```

## Why Apply via MCP?

- **Technical credibility**: Shows you're comfortable with cutting-edge developer tools
- **Efficiency**: Apply without context switching or filling out web forms
- **Memorable**: Stand out by using a novel application method
- **Community**: You're using a protocol that's shaping the future of AI tooling

## Local Development

Clone the repo and run locally:

```bash
git clone https://github.com/rootvc/cli-website
cd cli-website/mcp-server
npm install
node index.js
```

## About Root Ventures

Root Ventures is a San Francisco-based deep tech seed fund. As engineers ourselves, we specialize in leading initial funding for founders tackling new technical opportunities.

- Website: https://root.vc
- Twitter: [@rootvc](https://twitter.com/rootvc)
- GitHub: [github.com/rootvc](https://github.com/rootvc)

## Other Ways to Apply

Not into MCP? We've got you covered:

- **Web Terminal**: https://root.vc (type `apply 1`)
- **Email**: hello@root.vc
- **Traditional**: Visit our website

## License

MIT

## Questions?

Email hello@root.vc or open an issue on GitHub.

---

*Built with the Model Context Protocol. Learn more at https://modelcontextprotocol.io*
