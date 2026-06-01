// Vercel API Route — accepts POSTed job applications from the CLI's `apply` command
// and forwards them to Attio. Ported from netlify/functions/submit-application.js
// (the Netlify function pattern was `exports.handler(event, context)`; Vercel uses
// `default export(req, res)`).
//
// Env: ATTIO_WEBHOOK_URL must be configured in the Vercel project's env vars.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = req.body;

    if (!data || !data.name || !data.email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const attioWebhookUrl = process.env.ATTIO_WEBHOOK_URL;
    if (!attioWebhookUrl) {
      throw new Error("ATTIO_WEBHOOK_URL environment variable not set");
    }

    const attioResponse = await fetch(attioWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!attioResponse.ok) {
      throw new Error(`Attio API error: ${attioResponse.status}`);
    }

    return res.status(200).json({
      success: true,
      message: "Application submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting application:", error);
    return res.status(500).json({
      error: "Failed to submit application",
      details: error.message,
    });
  }
}
