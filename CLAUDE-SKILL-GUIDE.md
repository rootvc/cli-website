# Root Ventures Application - Claude Skill

I've converted the MCP server into a Claude skill! This is simpler and better integrated with Claude CLI.

## ✅ What's Installed

The skill is now installed at: `~/.claude/skills/root-ventures-apply/`

## How to Use It

### Option 1: Natural Conversation (Recommended)

Just chat with Claude in your terminal:

```bash
claude
```

Then say:
```
I want to apply to Root Ventures
```

Claude will:
1. Tell you about the position
2. Collect your information naturally through conversation
3. Submit your application to Attio
4. Confirm submission

### Option 2: Direct Command

Or invoke it directly from bash:

```bash
~/.claude/skills/root-ventures-apply/apply.sh \
  --name "Your Name" \
  --email "your@email.com" \
  --linkedin "https://linkedin.com/in/yourprofile" \
  --github "yourgithub" \
  --notes "Why you're interested"
```

## What Gets Submitted to Attio

The skill sends:
- `name` (required)
- `email` (required)
- `linkedin` (optional)
- `github` (optional)
- `notes` (optional)
- `position`: "Venture Capital Associate"
- `source`: "Claude Skill"

## Testing

I've already tested it successfully! Check Attio for the entry:
- Name: "Test Skill User"
- Email: skill-test@example.com
- Source: "Claude Skill"

## Example Conversation

```
You: I'd like to apply to Root Ventures. I'm Jane Doe (jane@example.com),
     GitHub is janedoe. I'm excited about deep tech because I've been
     building hardware projects for years.

Claude: [Collects info and uses the skill]

✅ Application submitted successfully!

Thank you for applying, Jane Doe!

What happens next:
• The team will review your application
• If there's a good fit, someone will reach out
• Check out our portfolio at https://root.vc

🚀 Applied via Claude Skill - extra points for technical creativity!
```

## Advantages Over MCP

✅ **Simpler** - No Node.js version conflicts
✅ **More reliable** - Direct bash script, fewer dependencies
✅ **Better integrated** - Works seamlessly with Claude CLI
✅ **Easier to debug** - Simple curl commands, clear error messages
✅ **Portable** - Can be shared as a simple bash script

## Sharing with Candidates

You can share the skill in multiple ways:

### Method 1: Install Script
Create an install script candidates can run:

```bash
curl -fsSL https://raw.githubusercontent.com/rootvc/cli-website/main/install-skill.sh | bash
```

### Method 2: Manual Installation
Candidates can copy the skill directory to `~/.claude/skills/root-ventures-apply/`

### Method 3: Include in Job Posting
```markdown
## How to Apply

**For Claude CLI users:**
Install our Claude skill and apply through conversation:
[Installation instructions]

**Other options:**
- Web Terminal: https://root.vc (type `apply 1`)
- Email: hello@root.vc
```

## Files Created

```
~/.claude/skills/root-ventures-apply/
├── skill.json          # Skill metadata
├── apply.sh            # Main application script
├── prompt.txt          # Instructions for Claude
└── README.md           # Documentation
```

## Next Steps

1. ✅ Skill is installed and tested
2. **Test it yourself**: Open Claude CLI and say "apply to root ventures"
3. **Create install script** for candidates (if you want to share it)
4. **Update job postings** to mention the Claude skill option

## Troubleshooting

If the skill doesn't work:

1. **Check it's executable:**
   ```bash
   ls -la ~/.claude/skills/root-ventures-apply/apply.sh
   ```

2. **Test directly:**
   ```bash
   ~/.claude/skills/root-ventures-apply/apply.sh --name "Test" --email "test@example.com"
   ```

3. **Check Claude can find it:**
   ```bash
   ls ~/.claude/skills/
   ```

The skill is now ready to use! Much simpler than the MCP server and actually submits to Attio successfully.
