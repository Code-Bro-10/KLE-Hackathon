import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  // 1. CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname

  // 2. Route: /auth (Start Google OAuth Consent flow)
  if (path.endsWith('/auth')) {
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID') || ''
    const redirectUri = `https://iderhuahuqbffhzjkpfa.supabase.co/functions/v1/create-meet-space/callback`
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=https://www.googleapis.com/auth/meetings.space.created&access_type=offline&prompt=consent`
    
    return Response.redirect(authUrl, 302)
  }

  // 3. Route: /callback (Exchanges code for GOOGLE_REFRESH_TOKEN)
  if (path.endsWith('/callback')) {
    const code = url.searchParams.get('code')
    if (!code) {
      return new Response("Authorization code missing from Google.", { status: 400, headers: corsHeaders })
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID') || ''
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') || ''
    const redirectUri = `https://iderhuahuqbffhzjkpfa.supabase.co/functions/v1/create-meet-space/callback`

    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }).toString(),
      })

      if (!tokenRes.ok) {
        const errBody = await tokenRes.text()
        return new Response(`Token exchange failed: ${errBody}`, { status: 400, headers: corsHeaders })
      }

      const tokenJson = await tokenRes.json()
      const refreshToken = tokenJson.refresh_token

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>ResQ – Google Refresh Token</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0b0f19; color: #f3f4f6; text-align: center; padding: 4rem 1rem; }
            .card { max-width: 550px; margin: 0 auto; background: #111827; padding: 2.5rem; border-radius: 1.5rem; border: 1px solid #1f2937; box-shadow: 0 20px 25px rgba(0,0,0,0.5); }
            h1 { color: #10b981; margin-bottom: 1rem; }
            p { color: #9ca3af; font-size: 0.95rem; line-height: 1.6; }
            pre { background: #000; color: #f43f5e; padding: 1.25rem; border-radius: 12px; text-align: left; overflow-x: auto; word-break: break-all; white-space: pre-wrap; font-family: monospace; font-size: 0.9rem; margin-top: 1.5rem; }
            .btn { display: inline-block; background: #0a84ff; color: white; padding: 0.85rem 2rem; border-radius: 12px; font-weight: bold; margin-top: 1.5rem; cursor: pointer; border: none; font-size: 0.95rem; }
            .btn:hover { background: #0070e0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Authorization Successful!</h1>
            <p>Copy the Refresh Token below and add it to your Supabase Edge Function Secrets:</p>
            <pre>${refreshToken || "WARNING: No refresh token returned. If this is not your first time authorizing, go to your Google Account Permissions, remove/revoke access for this App, and try again in an incognito window."}</pre>
            <button class="btn" onclick="navigator.clipboard.writeText('${refreshToken || ''}')">Copy to Clipboard</button>
          </div>
        </body>
        </html>
      `
      return new Response(html, { headers: { "Content-Type": "text/html", ...corsHeaders } })
    } catch (err: any) {
      return new Response(`Error exchanging code: ${err.message}`, { status: 500, headers: corsHeaders })
    }
  }

  // 4. Default POST: Create Google Meet space for a consultation
  if (req.method === 'POST') {
    try {
      const body = await req.json()
      const { consultation_id, doctor_id } = body

      if (!consultation_id || !doctor_id) {
        return new Response(JSON.stringify({ error: "Missing consultation_id or doctor_id" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        })
      }

      // Initialize Supabase Client with service key to bypass RLS safely
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Fetch the consultation
      const { data: consultation, error: fetchErr } = await supabase
        .from('consultations')
        .select('*')
        .eq('id', consultation_id)
        .single()

      if (fetchErr || !consultation) {
        return new Response(JSON.stringify({ error: "Consultation record not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        })
      }

      // Verify the consultation belongs to this doctor
      if (consultation.doctor_id !== doctor_id) {
        return new Response(JSON.stringify({ error: "Unauthorized: Consultation is assigned to a different doctor" }), {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        })
      }

      // Idempotency check: if meeting link already exists, return it
      if (consultation.meet_link && consultation.status === 'accepted') {
        return new Response(JSON.stringify({
          success: true,
          message: "Meeting already created previously",
          meet_link: consultation.meet_link,
          meet_space_name: consultation.meet_space_name,
          meet_status: consultation.meet_status
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        })
      }

      // Exchange Refresh Token for a short-lived access token
      const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID') || ''
      const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') || ''
      const googleRefreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN') || ''

      if (!googleClientId || !googleClientSecret || !googleRefreshToken) {
        return new Response(JSON.stringify({ error: "Google OAuth credentials not configured on backend secrets" }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        })
      }

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: googleClientId,
          client_secret: googleClientSecret,
          refresh_token: googleRefreshToken,
          grant_type: "refresh_token",
        }).toString(),
      })

      if (!tokenRes.ok) {
        const errText = await tokenRes.text()
        return new Response(JSON.stringify({ error: `Google OAuth refresh failed: ${errText}` }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        })
      }

      const tokenJson = await tokenRes.json()
      const accessToken = tokenJson.access_token

      // Call Google Meet REST API v2 to create space
      const meetRes = await fetch("https://meet.googleapis.com/v2/spaces", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      })

      if (!meetRes.ok) {
        const errText = await meetRes.text()
        return new Response(JSON.stringify({ error: `Google Meet space creation failed: ${errText}` }), {
          status: 520, // Web server returned an unknown error (Google Meet API failure)
          headers: { "Content-Type": "application/json", ...corsHeaders }
        })
      }

      const meetJson = await meetRes.json()
      const meetingUri = meetJson.meetingUri
      const spaceName = meetJson.name

      // Update consultation record in Supabase
      const { error: updateErr } = await supabase
        .from('consultations')
        .update({
          status: 'accepted',
          meet_link: meetingUri,
          meet_space_name: spaceName,
          meet_status: 'created',
          meeting_created_at: new Date().toISOString()
        })
        .eq('id', consultation_id)

      if (updateErr) {
        return new Response(JSON.stringify({ error: `Failed to update consultation record: ${updateErr.message}` }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        })
      }

      return new Response(JSON.stringify({
        success: true,
        meet_link: meetingUri,
        meet_space_name: spaceName,
        meet_status: 'created'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      })

    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      })
    }
  }

  return new Response("Not Found", { status: 404, headers: corsHeaders })
})
