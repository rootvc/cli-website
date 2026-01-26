exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const data = JSON.parse(event.body);

    // Validate required fields
    if (!data.name || !data.email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Name and email are required' }),
      };
    }

    // Forward to Attio webhook
    const attioWebhookUrl = process.env.ATTIO_WEBHOOK_URL;

    if (!attioWebhookUrl) {
      throw new Error('ATTIO_WEBHOOK_URL environment variable not set');
    }

    const attioResponse = await fetch(
      attioWebhookUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!attioResponse.ok) {
      throw new Error(`Attio API error: ${attioResponse.status}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Application submitted successfully'
      }),
    };
  } catch (error) {
    console.error('Error submitting application:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to submit application',
        details: error.message
      }),
    };
  }
};
