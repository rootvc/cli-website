#!/bin/bash

# Root Ventures MCP Server Installer
# Automatically configures Claude Desktop to use the Root Ventures jobs MCP server

set -e

echo "🚀 Root Ventures MCP Server Installer"
echo "======================================"
echo ""

# Detect OS and set config path
if [[ "$OSTYPE" == "darwin"* ]]; then
    CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CONFIG_PATH="$HOME/.config/Claude/claude_desktop_config.json"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    CONFIG_PATH="$APPDATA/Claude/claude_desktop_config.json"
else
    echo "❌ Unsupported operating system: $OSTYPE"
    exit 1
fi

echo "📁 Config file: $CONFIG_PATH"
echo ""

# Check if Claude Desktop is installed
CONFIG_DIR=$(dirname "$CONFIG_PATH")
if [ ! -d "$CONFIG_DIR" ]; then
    echo "❌ Claude Desktop doesn't appear to be installed."
    echo ""
    echo "Please install Claude Desktop first:"
    echo "https://claude.ai/download"
    echo ""
    exit 1
fi

# Create config file if it doesn't exist
if [ ! -f "$CONFIG_PATH" ]; then
    echo "📝 Creating new config file..."
    mkdir -p "$CONFIG_DIR"
    echo '{"mcpServers":{}}' > "$CONFIG_PATH"
fi

# Backup existing config
BACKUP_PATH="${CONFIG_PATH}.backup-$(date +%Y%m%d-%H%M%S)"
echo "💾 Backing up existing config to:"
echo "   $BACKUP_PATH"
cp "$CONFIG_PATH" "$BACKUP_PATH"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo ""
    echo "Please install Node.js 18 or later:"
    echo "https://nodejs.org"
    echo ""
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js $NODE_VERSION detected"
echo ""

# Read existing config
EXISTING_CONFIG=$(cat "$CONFIG_PATH")

# Check if root-ventures-jobs already exists
if echo "$EXISTING_CONFIG" | grep -q "root-ventures-jobs"; then
    echo "⚠️  Root Ventures MCP server is already configured!"
    echo ""
    read -p "Do you want to update it? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Installation cancelled."
        exit 0
    fi
fi

# Add or update the MCP server config using Node.js to properly handle JSON
node -e "
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('$CONFIG_PATH', 'utf8'));

if (!config.mcpServers) {
    config.mcpServers = {};
}

config.mcpServers['root-ventures-jobs'] = {
    command: 'npx',
    args: ['-y', '@rootvc/jobs-mcp-server']
};

fs.writeFileSync('$CONFIG_PATH', JSON.stringify(config, null, 2));
"

echo "✅ Configuration updated successfully!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Restart Claude Desktop (completely quit and reopen)"
echo "2. Open a conversation and say:"
echo "   'Show me open positions at Root Ventures'"
echo ""
echo "3. Claude will help you apply through natural conversation"
echo ""
echo "Good luck! 🎉"
echo ""
echo "Questions? Email hello@root.vc"
