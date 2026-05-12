import { NextRequest, NextResponse } from 'next/server';

const STAGE_MESSAGES: Record<string, { subject: string; body: string }> = {
  'Lead': {
    subject: 'Thanks for your interest in Festoweb!',
    body: "We've received your inquiry and will be in touch shortly.",
  },
  'Discovery Call': {
    subject: 'Your Discovery Call with Festoweb',
    body: "We're excited to learn more about your project. We'll be scheduling a call with you soon.",
  },
  'Deal in Meeting': {
    subject: 'Project Discussion — Festoweb',
    body: "We're currently reviewing your project details and preparing the best proposal for you.",
  },
  'Paid Deposit 50%': {
    subject: "Deposit Received — Let's get started! 🎉",
    body: 'Thank you for your deposit! Your project is now confirmed and we are preparing to kick off.',
  },
  'In Progress': {
    subject: 'Your Project is Now In Progress 🚀',
    body: "Great news! Our team has started working on your project. We'll keep you updated on our progress.",
  },
  'Review': {
    subject: 'Your Project is Ready for Review 👀',
    body: 'Your project is complete and ready for your review. Please take a look and share your feedback.',
  },
  'Completed Paid 50%': {
    subject: 'Project Completed — Thank you! ✅',
    body: 'Congratulations! Your project is fully completed. Thank you for choosing Festoweb. We hope to work with you again!',
  },
};

export async function POST(req: NextRequest) {
  try {
    const { clientName, clientEmail, stage, service } = await req.json();

    if (!clientEmail || !stage) {
      return NextResponse.json({ error: 'Missing clientEmail or stage' }, { status: 400 });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const template = STAGE_MESSAGES[stage];
    if (!template) {
      return NextResponse.json({ error: 'Unknown stage' }, { status: 400 });
    }

    const serviceLabel: Record<string, string> = {
      website_design: 'Web Design',
      website_redesign: 'Website Redesign',
      landing_page: 'Landing Page',
      maintenance: 'Maintenance',
      ecommerce: 'E-commerce',
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 40px 20px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
          <div style="background: #121212; padding: 24px 32px;">
            <table cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="padding-right: 10px; vertical-align: middle;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 384" width="28" height="28">
                  <path fill="#3dcf8e" fill-rule="nonzero" d="M239.523 35.879c1.809-7.238-1.625-14.765-8.277-18.144-6.657-3.379-14.758-1.711-19.539 4.023L51.707 213.758c-3.973 4.77-4.829 11.407-2.196 17.031C52.144 236.406 57.793 240 64 240h107.508l-27.031 108.121c-1.809 7.238 1.624 14.765 8.28 18.144 6.653 3.379 14.758 1.711 19.535-4.023l160-192c3.973-4.77 4.832-11.406 2.196-17.027C331.855 147.59 326.207 144 320 144H212.492Z"/>
                </svg>
              </td>
              <td style="vertical-align: middle;"><span style="color: #ffffff; font-size: 18px; font-weight: 700;">Festoweb</span></td>
            </tr></table>
          </div>
          <div style="padding: 32px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 6px;">Hi ${clientName || 'there'},</p>
            <h1 style="color: #111827; font-size: 20px; font-weight: 700; margin: 0 0 14px; line-height: 1.3;">${template.subject}</h1>
            <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 22px;">${template.body}</p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 18px; margin-bottom: 22px;">
              <p style="color: #6b7280; font-size: 11px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.6px;">Current Stage</p>
              <p style="color: #15803d; font-size: 15px; font-weight: 600; margin: 0;">⚡ ${stage}</p>
              ${service ? `<p style="color: #6b7280; font-size: 13px; margin: 5px 0 0;">Service: ${serviceLabel[service] || service}</p>` : ''}
            </div>
            <p style="color: #9ca3af; font-size: 13px; margin: 0;">Questions? Reach us at <a href="mailto:hello@festoweb.com" style="color: #3dcf8e; text-decoration: none;">hello@festoweb.com</a></p>
          </div>
          <div style="background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 18px 32px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2026 Festoweb · <a href="https://festoweb.com" style="color: #9ca3af;">festoweb.com</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Use Resend's shared domain — works immediately without domain verification.
    // To send from hello@festoweb.com, verify festoweb.com in Resend dashboard first.
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Festoweb CRM <onboarding@resend.dev>';

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [clientEmail],
        subject: template.subject,
        html,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error('Resend error:', result);
      return NextResponse.json({ error: result }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (e: any) {
    console.error('notify-stage error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
