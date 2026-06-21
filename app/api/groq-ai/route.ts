import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { prompt } = await request.json();

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json(
      { error: "Missing prompt" },
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
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant. Follow the user's instructions exactly.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", JSON.stringify(result, null, 2));
      throw new Error(
        result.error?.message || `Groq request failed: ${response.status}`
      );
    }

    const text = result.choices?.[0]?.message?.content;
    if (!text) throw new Error("No response from Groq");

    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI request failed";
    console.error("Groq AI error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
