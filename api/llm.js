// This file should be placed in /api/llm.js for Vercel

// Vercel handler
export default async function handler(req, res) {
  // Add CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests for actual API calls
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Call OpenAI API
    const response = await callOpenAIAPI(question);
    return res.status(200).json({ response });
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}

async function callOpenAIAPI(question) {
  // Use GPT-3.5 Turbo by default
  const modelId = 'gpt-3.5-turbo';
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Give concise and informative answers.' },
          { role: 'user', content: question }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('OpenAI API error:', data.error);
      return getFallbackResponse(question);
    }
    
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return getFallbackResponse(question);
  }
}

function getFallbackResponse(question) {
  question = question.toLowerCase();
  
  // Base fallback responses if API calls fail
  if (question.includes('weather')) {
    return "You can check the current weather by looking out a window or using a weather app like AccuWeather or your phone's built-in weather app. For forecasts, these same resources provide predictions based on meteorological data.";
  } else if (question.includes('time')) {
    return "You can check the current time by looking at your device's clock, which is typically displayed in the corner of your screen or on your phone's lock screen. Most devices automatically sync with global time servers for accuracy.";
  } else {
    return "That's an interesting question. To find a comprehensive answer, I'd recommend researching this topic through reliable sources. You might start with a Google search, check relevant books or academic papers, or consult with experts in the field related to your question.";
  }
}
