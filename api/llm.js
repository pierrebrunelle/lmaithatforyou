// This file should be placed in /api/llm.js for Vercel
// For Netlify, place it in /netlify/functions/llm.js

// Vercel handler
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, model } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Determine which API to call based on the model
    let response;
    
    if (model === 'claude') {
      response = await callClaudeAPI(question);
    } else {
      // Either gpt-3.5 or gpt-4
      response = await callOpenAIAPI(question, model);
    }

    return res.status(200).json({ response });
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}

// For Netlify Functions, use this export instead:
/*
exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { question, model } = body;

    if (!question) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Question is required' })
      };
    }

    // Determine which API to call based on the model
    let response;
    
    if (model === 'claude') {
      response = await callClaudeAPI(question);
    } else {
      // Either gpt-3.5 or gpt-4
      response = await callOpenAIAPI(question, model);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ response })
    };
  } catch (error) {
    console.error('Error processing request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process request' })
    };
  }
};
*/

async function callOpenAIAPI(question, model) {
  // Choose the correct model identifier
  const modelId = model === 'gpt-4' ? 'gpt-4-turbo' : 'gpt-3.5-turbo';
  
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
      return getFallbackResponse(question, model);
    }
    
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return getFallbackResponse(question, model);
  }
}

async function callClaudeAPI(question) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 300,
        messages: [
          { role: 'user', content: question }
        ]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('Claude API error:', data.error);
      return getFallbackResponse(question, 'claude');
    }
    
    return data.content[0].text;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return getFallbackResponse(question, 'claude');
  }
}

function getFallbackResponse(question, model) {
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
