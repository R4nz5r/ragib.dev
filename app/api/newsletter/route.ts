import { NextResponse } from "next/server";
import { z } from "zod";

const newsletterSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  honeypot: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = newsletterSchema.safeParse(body);

    if (!result.success) {
      const errorMessage =
        result.error.issues[0]?.message ?? "Please enter a valid email address.";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Honeypot check: if filled, quietly return success without calling provider
    if (result.data.honeypot && result.data.honeypot.trim().length > 0) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const audienceId = process.env.RESEND_AUDIENCE_ID;

    if (!apiKey || !audienceId) {
      return NextResponse.json(
        {
          error:
            "Newsletter service is temporarily unavailable. Please try again later.",
        },
        { status: 503 }
      );
    }

    // Call Resend Audiences API
    const res = await fetch(
      `https://api.resend.com/audiences/${audienceId}/contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: result.data.email,
          unsubscribed: false,
        }),
      }
    );

    if (res.ok) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Parse error response without logging email address
    const errorData = (await res.json().catch(() => ({}))) as {
      message?: string;
      name?: string;
    };
    const errorMessage =
      typeof errorData?.message === "string"
        ? errorData.message.toLowerCase()
        : "";

    // If contact already exists in audience, treat as success so address existence is not leaked
    if (
      res.status === 409 ||
      res.status === 422 ||
      errorMessage.includes("already exists") ||
      errorMessage.includes("duplicate")
    ) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // For any other provider error, return a generic error message
    return NextResponse.json(
      { error: "Unable to subscribe at this time. Please try again later." },
      { status: 500 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 }
    );
  }
}
