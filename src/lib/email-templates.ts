/**
 * Email templates for vibeNotes authentication and notifications
 */

interface MagicLinkEmailParams {
  url: string;
  host: string;
  email: string;
}

/**
 * Generate HTML email template for magic link sign-in
 */
export function generateMagicLinkEmail({ url, host, email }: MagicLinkEmailParams): string {
  const brandColor = "#6366f1"; // Tailwind indigo-500
  const buttonColor = "#6366f1";
  const textColor = "#1f2937";
  const lightGray = "#f3f4f6";
  const escapedHost = host.replace(/\./g, '&#8203;.'); // Prevent auto-linking
  
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Sign in to vibeNotes</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <!-- Preheader text (hidden but visible in email preview) -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    One-time sign-in link for your vibeNotes account. Expires in 24 hours.
  </div>
  <!-- Invisible preheader spacer -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
          
          <!-- Header with Logo/Brand -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, ${brandColor} 0%, #818cf8 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                vibeNotes
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 400;">
                Signal in the noise
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: ${textColor}; font-size: 24px; font-weight: 600;">
                Sign in to your account
              </h2>
              
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hello! 👋
              </p>
              
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                You are receiving this email because a sign-in to <strong>vibeNotes</strong> was requested for <strong>${email}</strong>.
              </p>

              <p style="margin: 0 0 32px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Click the button below to continue:
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 8px;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <a href="${url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 16px 48px; background-color: ${buttonColor}; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(99, 102, 241, 0.3); mso-hide: all;">
                      ✨ Sign in to vibeNotes
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 24px; color: #9ca3af; font-size: 12px; text-align: center;">
                Link berlaku selama 24 jam
              </p>

              <!-- Alternative Link -->
              <p style="margin: 8px 0 0; padding: 20px; background-color: ${lightGray}; border-radius: 8px; color: #6b7280; font-size: 13px; line-height: 1.6;">
                <strong style="color: #4b5563;">Or paste this link into your browser:</strong><br/>
                <span style="display: inline-block; margin-top: 8px; padding: 8px 12px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px; font-size: 12px; word-break: break-all; color: #6b7280; font-family: 'Courier New', monospace;">
                  ${url}
                </span>
              </p>

              <!-- Security Notice -->
              <div style="margin: 32px 0 0; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong>⚠️ Important:</strong> This is a one-time sign-in link and will expire in <strong>24 hours</strong>. Do not share this link with anyone.
                </p>
              </div>

              <!-- Not You? -->
              <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you did not request this sign-in, you can safely ignore this email. No changes will be made to your account.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: ${lightGray}; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; font-weight: 600;">
                vibeNotes
              </p>
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; line-height: 1.5;">
                Sanctuary for self-reflection 🌟
              </p>
              <p style="margin: 0 0 16px; color: #9ca3af; font-size: 12px;">
                <a href="${host}" target="_blank" style="color: ${brandColor}; text-decoration: none;">
                  ${escapedHost}
                </a>
              </p>
              <p style="margin: 0 0 4px; color: #9ca3af; font-size: 11px; line-height: 1.5;">
                This email was sent automatically because a sign-in was requested for your account.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                © ${new Date().getFullYear()} vibeNotes. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version of magic link email
 */
export function generateMagicLinkTextEmail({ url, host, email }: MagicLinkEmailParams): string {
  return `
Sign in to vibeNotes
====================

Hello,

You are receiving this email because a sign-in request was made for the following vibeNotes account:
${email}

SIGN-IN LINK:
${url}

IMPORTANT:
- This link can be used only once.
- It expires in 24 hours.
- Do not share this link with anyone.

If you did not request this sign-in, simply ignore this email — no changes will be made to your account.

---
vibeNotes — Sanctuary for self-reflection
${host}

This is an automated message. Please do not reply.
© ${new Date().getFullYear()} vibeNotes. All rights reserved.
`.trim();
}

/**
 * Generate welcome email for new users
 */
export function generateWelcomeEmail(displayName: string): string {
  const brandColor = "#6366f1";
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to vibeNotes</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, ${brandColor} 0%, #a78bfa 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700;">
                🎉 Welcome!
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 16px; color: #1f2937; font-size: 24px; font-weight: 600;">
                Hi ${displayName}! 👋
              </h2>
              
              <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Welcome to <strong>vibeNotes</strong> — a place for reflection and sharing with a caring community.
              </p>

              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Here are a few things you can do:
              </p>

              <ul style="margin: 0 0 24px; padding-left: 20px; color: #4b5563; font-size: 16px; line-height: 1.8;">
                <li>✍️ Write daily notes and express how you feel</li>
                <li>🤖 Get emotion analysis powered by AI</li>
                <li>📊 View weekly insights about your emotional patterns</li>
                <li>🔒 Control note privacy (public/private/followers)</li>
                <li>💬 Interact with the community via comments and likes</li>
              </ul>

              <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                We're glad you're here. Let's start your journey of self-reflection! 🌟
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 40px; background-color: #f3f4f6; border-radius: 0 0 12px 12px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                The <strong>vibeNotes</strong> team
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
