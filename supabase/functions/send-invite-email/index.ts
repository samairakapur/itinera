import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailRequest {
  inviteeEmail: string;
  inviterName: string;
  tripName: string;
  cityName: string;
  itineraryId: string;
  appUrl: string; // e.g. "https://itinera.app" or "http://localhost:8080"
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: InviteEmailRequest = await req.json();
    const { inviteeEmail, inviterName, tripName, cityName, itineraryId, appUrl } = body;

    if (!inviteeEmail || !itineraryId) {
      return new Response(
        JSON.stringify({ sent: false, error: "inviteeEmail and itineraryId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!resendKey) {
      // Email not configured — return gracefully so the invite still saves to DB
      console.warn("RESEND_API_KEY is not set — skipping invitation email");
      return new Response(
        JSON.stringify({
          sent: false,
          reason: "Email not configured. Add RESEND_API_KEY to Supabase Edge Function secrets to enable invitation emails.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tripUrl = `${appUrl}/trips/${itineraryId}`;
    const inviterDisplay = inviterName || "Someone";

    // Build the email HTML
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've been invited to a trip on Itinera</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:8px;">
                <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:10px;display:inline-block;line-height:36px;text-align:center;font-size:20px;">✈️</div>
                <span style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">Itinera</span>
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0f172a;">You're invited to a trip! 🎉</h1>
              <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
                <strong style="color:#0f172a;">${inviterDisplay}</strong> has invited you to collaborate on their trip itinerary.
              </p>

              <!-- Trip card -->
              <div style="background:#f1f5f9;border-radius:10px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Trip</p>
                <p style="margin:0 0 2px;font-size:18px;font-weight:700;color:#0f172a;">${tripName}</p>
                ${cityName ? `<p style="margin:0;font-size:14px;color:#64748b;">📍 ${cityName}</p>` : ""}
              </div>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:28px;">
                <a href="${tripUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 32px;border-radius:8px;">
                  View Trip Itinerary →
                </a>
              </div>

              <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;line-height:1.5;">
                If you don't have an Itinera account yet, you'll be prompted to sign up — it only takes a moment.
                Once signed in, you can view and collaborate on the itinerary together.
              </p>

              <p style="margin:0;color:#cbd5e1;font-size:12px;">
                Or copy this link into your browser:<br/>
                <span style="color:#6366f1;">${tripUrl}</span>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                Sent by <a href="${appUrl}" style="color:#6366f1;text-decoration:none;">Itinera</a> — AI-powered trip planner
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const textBody = `
You've been invited to a trip on Itinera!

${inviterDisplay} has invited you to collaborate on: ${tripName}${cityName ? ` (${cityName})` : ""}.

View the itinerary here: ${tripUrl}

If you don't have an Itinera account, you'll be prompted to sign up when you open the link.
`.trim();

    // Determine the "from" address.
    // - With a verified custom domain set in RESEND_FROM_EMAIL, use that.
    // - Otherwise fall back to Resend's shared test address.
    const fromEmail =
      Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";
    const fromName = "Itinera";

    const emailPayload = {
      from: `${fromName} <${fromEmail}>`,
      to: [inviteeEmail],
      subject: `${inviterDisplay} invited you to a trip on Itinera`,
      html,
      text: textBody,
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", result);
      return new Response(
        JSON.stringify({ sent: false, error: result?.message || "Failed to send email" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ sent: true, id: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-invite-email error:", err);
    return new Response(
      JSON.stringify({ sent: false, error: err instanceof Error ? err.message : "Internal error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
