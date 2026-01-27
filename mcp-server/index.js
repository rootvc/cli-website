#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Attio webhook URL from environment variable
const ATTIO_WEBHOOK_URL = process.env.ATTIO_WEBHOOK_URL;

if (!ATTIO_WEBHOOK_URL) {
  console.error("[MCP Error] ATTIO_WEBHOOK_URL environment variable is not set");
}

// Job descriptions
const JOBS = {
  "associate": {
    title: "Venture Capital Associate",
    description: `Root Ventures is looking for a technical associate to join our team in San Francisco.

We're a deep tech seed fund that invests in bold engineers building the future. As an associate, you'll work directly with partners to source deals, conduct technical diligence, and support portfolio companies.

What we're looking for:
• Strong technical background (CS degree, engineering experience, or equivalent)
• Genuine curiosity about emerging technologies and startups
• Excellent communication skills - you can explain complex tech simply
• Hustle and resourcefulness - you figure things out
• Passion for working with technical founders

Bonus points:
• You've built side projects or contributed to open source
• You're active in technical communities
• You have startup experience

This is a rare opportunity to learn venture capital from experienced operators and work with some of the most innovative technical founders in the world.`
  }
};

// Create server instance
const server = new Server(
  {
    name: "root-ventures-jobs",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_jobs",
        description: "List all open positions at Root Ventures",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_job_details",
        description: "Get detailed information about a specific job position",
        inputSchema: {
          type: "object",
          properties: {
            job_id: {
              type: "string",
              description: "The job identifier (e.g., 'associate')",
            },
          },
          required: ["job_id"],
        },
      },
      {
        name: "apply_to_root_ventures",
        description: "Submit a job application to Root Ventures. Collects applicant information and submits it to the team.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Applicant's full name",
            },
            email: {
              type: "string",
              description: "Applicant's email address",
            },
            linkedin: {
              type: "string",
              description: "LinkedIn profile URL (optional)",
            },
            github: {
              type: "string",
              description: "GitHub username (optional)",
            },
            notes: {
              type: "string",
              description: "Why Root? What makes you a great fit? (optional)",
            },
            position: {
              type: "string",
              description: "Position applying for (default: 'Venture Capital Associate')",
            },
          },
          required: ["name", "email"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_jobs": {
        const jobList = Object.entries(JOBS)
          .map(([id, job]) => `**${job.title}** (ID: ${id})`)
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: `Open Positions at Root Ventures:\n\n${jobList}\n\nUse get_job_details with the job ID to learn more, or apply_to_root_ventures to submit an application.`,
            },
          ],
        };
      }

      case "get_job_details": {
        const { job_id } = args;
        const job = JOBS[job_id];

        if (!job) {
          return {
            content: [
              {
                type: "text",
                text: `Job "${job_id}" not found. Available jobs: ${Object.keys(JOBS).join(", ")}`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `# ${job.title}\n\n${job.description}\n\n---\n\nReady to apply? Use the apply_to_root_ventures tool to submit your application!`,
            },
          ],
        };
      }

      case "apply_to_root_ventures": {
        const { name, email, linkedin, github, notes, position } = args;

        // Check webhook URL is configured
        if (!ATTIO_WEBHOOK_URL) {
          return {
            content: [
              {
                type: "text",
                text: "Error: ATTIO_WEBHOOK_URL environment variable is not configured.",
              },
            ],
            isError: true,
          };
        }

        // Validate required fields
        if (!name || !email) {
          return {
            content: [
              {
                type: "text",
                text: "Error: Name and email are required fields.",
              },
            ],
            isError: true,
          };
        }

        // Prepare payload - only include fields that have values
        const payload = {
          name,
          email,
          position: position || "Venture Capital Associate",
          source: "MCP Server"
        };

        // Add optional fields only if they have values
        if (linkedin && linkedin.trim()) payload.linkedin = linkedin.trim();
        if (github && github.trim()) payload.github = github.trim();
        if (notes && notes.trim()) payload.notes = notes.trim();

        // Log to stderr for debugging
        console.error('[MCP] Submitting application:', JSON.stringify(payload, null, 2));

        // Submit to Attio
        const response = await fetch(ATTIO_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        console.error('[MCP] Attio response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[MCP] Attio error response:', errorText);
          throw new Error(`Attio API returned ${response.status}: ${errorText}`);
        }

        const responseData = await response.text();
        console.error('[MCP] Attio success response:', responseData);

        return {
          content: [
            {
              type: "text",
              text: `✓ Application submitted successfully!

Thank you for applying, ${name}! Your application has been received by the Root Ventures team.

What happens next:
• The team will review your application
• If there's a good fit, someone will reach out to schedule a conversation
• In the meantime, check out Root's portfolio at https://root.vc

Applied via MCP Server - extra points for technical creativity! 🚀`,
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Handle errors
server.onerror = (error) => {
  console.error("[MCP Error]", error);
};

process.on('SIGINT', async () => {
  await server.close();
  process.exit(0);
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
