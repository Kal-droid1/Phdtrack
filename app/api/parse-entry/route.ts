import { NextResponse } from "next/server";
import { COUNTRIES } from "@/lib/countries";

export async function POST(request: Request) {
  const { text, type } = await request.json();

  if (!text || !type) {
    return NextResponse.json(
      { error: "Missing text or type" },
      { status: 400 }
    );
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("GROQ_API_KEY is not configured");
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a data extraction assistant. Extract structured data from text and return ONLY a valid JSON object with no markdown, no explanation, no code fences.'
          },
          {
            role: 'user',
            content: `Extract the following fields from this text.

For type "application" extract: name, university, country, program, funding_body, open_date (YYYY-MM-DD or null), deadline (YYYY-MM-DD or null), status (one of: Watching/Applied/Under Review/Accepted/Rejected/Waitlisted), notes
For type "supervisor" extract: name, title, university, department, email, date_contacted (YYYY-MM-DD or null), status (one of: Sent/Replied/Interested/Declined/No Response), notes

Type: ${type}
Text: ${text}

Return only the JSON object, nothing else.`
          }
        ],
        temperature: 0.1
      })
    })

    const result = await response.json()
    console.log('Groq full response:', JSON.stringify(result, null, 2))
    if (!response.ok) {
      console.error('Groq HTTP error:', response.status, response.statusText)
      throw new Error(`Groq request failed: ${response.status} ${response.statusText}`)
    }
    const generatedText = result.choices?.[0]?.message?.content
    if (!generatedText) throw new Error('No response from Groq')
    const clean = generatedText.replace(/\`\`\`json|\`\`\`/g, '').trim()
    const parsed = JSON.parse(clean)
    Object.keys(parsed).forEach(key => {
      if (parsed[key] === 'null' || parsed[key] === 'undefined') {
        parsed[key] = null
      }
    })
    if (parsed.country) {
      const normalized = COUNTRIES.find(
        (c) => c.toLowerCase() === parsed.country.trim().toLowerCase()
      );
      parsed.country = normalized ?? parsed.country.trim();
    }
    return NextResponse.json(parsed)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Parsing failed";
    console.error("Parse entry error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
