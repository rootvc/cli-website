// Forwards a job application to the Attio webhook.
//
// Only the fields the two forms send are forwarded, each capped at a length
// that is generous for a real applicant, so an arbitrary payload cannot be
// relayed into the CRM. A filled-in `website` field is a honeypot: neither form
// renders it, so a value means a bot, which gets a success response and is
// dropped on the floor.
const FIELDS = {
  name: 200,
  email: 254,
  linkedin: 500,
  github: 100,
  notes: 10000,
  position: 200,
};
const MAX_BODY_BYTES = 20000;
const HONEYPOT = "website";

function sanitize(data) {
  const clean = {};
  for (const [field, max] of Object.entries(FIELDS)) {
    const value = data[field];
    if (value === undefined || value === null || value === "") continue;
    if (typeof value !== "string") return null;
    clean[field] = value.trim().slice(0, max);
  }
  return clean;
}

const json = (statusCode, body) => ({ statusCode, body: JSON.stringify(body) });

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  if ((event.body || "").length > MAX_BODY_BYTES) {
    return json(413, { error: "Application is too large" });
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return json(400, { error: "Invalid JSON" });
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return json(400, { error: "Invalid JSON" });
  }

  if (data[HONEYPOT]) {
    return json(200, { success: true, message: "Application submitted successfully" });
  }

  const clean = sanitize(data);
  if (!clean) {
    return json(400, { error: "Fields must be strings" });
  }
  if (!clean.name || !clean.email) {
    return json(400, { error: "Name and email are required" });
  }

  try {
    const attioWebhookUrl = process.env.ATTIO_WEBHOOK_URL;
    if (!attioWebhookUrl) {
      throw new Error("ATTIO_WEBHOOK_URL environment variable not set");
    }

    const attioResponse = await fetch(attioWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clean),
    });

    if (!attioResponse.ok) {
      throw new Error(`Attio API error: ${attioResponse.status}`);
    }

    return json(200, { success: true, message: "Application submitted successfully" });
  } catch (error) {
    console.error("Error submitting application:", error);
    return json(500, { error: "Failed to submit application", details: error.message });
  }
};

exports.FIELDS = FIELDS;
exports.MAX_BODY_BYTES = MAX_BODY_BYTES;
