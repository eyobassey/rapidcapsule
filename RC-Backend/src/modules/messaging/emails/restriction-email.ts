interface RestrictionAppliedParams {
  recipientName: string;
  restrictionType: 'read_only' | 'blocked';
  reason?: string;
  expiresAt?: Date | string | null;
  userType?: 'Patient' | 'Specialist';
  supportUrl?: string;
}

interface RestrictionLiftedParams {
  recipientName: string;
  previousRestriction: 'read_only' | 'blocked';
  userType?: 'Patient' | 'Specialist';
  supportUrl?: string;
}

export const restrictionAppliedEmail = (params: RestrictionAppliedParams): string => {
  const {
    recipientName,
    restrictionType,
    reason,
    expiresAt,
    userType = 'Patient',
    supportUrl = 'mailto:support@rapidcapsule.com',
  } = params;

  const messagesUrl = userType === 'Specialist'
    ? 'https://rapidcapsule.com/app/specialist/messages'
    : 'https://rapidcapsule.com/app/patient/messages';
  const typeLabel = restrictionType === 'blocked' ? 'blocked' : 'restricted to read-only';
  const headerColor = restrictionType === 'blocked' ? '#EF4444' : '#F59E0B';

  let expiryText = 'This restriction is indefinite and will remain until manually lifted by an administrator.';
  if (expiresAt) {
    const date = new Date(expiresAt);
    expiryText = `This restriction will automatically expire on <strong>${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</strong>.`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa;">
    <tr>
      <td align="center" style="padding: 24px 0;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

          <!-- Logo Bar -->
          <tr>
            <td style="background-color: #ffffff; padding: 24px 30px 16px; text-align: center;">
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 10px;">
                    <img
                      src="https://rapidcapsule.com/RapidCapsule_Logo.png"
                      alt="Rapid Capsule"
                      width="36"
                      height="36"
                      style="display: block; width: 36px; height: 36px; object-fit: contain; border: 0;"
                    />
                  </td>
                  <td style="vertical-align: middle;">
                    <span style="font-size: 18px; font-weight: 700; color: #1e293b; letter-spacing: -0.3px;">Rapid Capsule</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="background: ${headerColor}; padding: 30px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">Messaging Restriction Notice</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 15px;">Your messaging access has been ${typeLabel}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 30px;">
              <p style="font-size: 17px; color: #2c3e50; margin: 0 0 18px;">Hi ${recipientName},</p>

              <p style="color: #546e7a; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                We're writing to inform you that your messaging access on Rapid Capsule has been <strong>${typeLabel}</strong>.
              </p>

              ${reason ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                <tr>
                  <td style="background: #f8fafc; border-left: 4px solid ${headerColor}; padding: 16px 20px; border-radius: 0 8px 8px 0;">
                    <div style="font-weight: 600; color: #334155; font-size: 14px; margin-bottom: 6px;">Reason</div>
                    <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0;">${reason}</p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <p style="color: #546e7a; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                ${expiryText}
              </p>

              ${restrictionType === 'read_only' ? `
              <p style="color: #546e7a; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                While restricted, you can still <strong>receive and read messages</strong>, but you will not be able to send new messages or attachments.
              </p>
              ` : `
              <p style="color: #546e7a; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                While blocked, you will not be able to <strong>send or receive</strong> any messages on the platform.
              </p>
              `}

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 28px 0;">
                    <a href="${supportUrl}" style="display: inline-block; background: #64748b; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 15px;">Contact Support</a>
                  </td>
                </tr>
              </table>

              <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0;">
                If you believe this restriction was applied in error, please contact our support team for assistance.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 4px 0; color: #78909c; font-size: 13px;"><strong>Rapid Capsule</strong></p>
              <p style="margin: 4px 0; color: #78909c; font-size: 13px;">Your healthcare, delivered.</p>
              <p style="margin: 4px 0; font-size: 13px;"><a href="https://rapidcapsule.com" style="color: #4FC3F7; text-decoration: none;">Visit Dashboard</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

export const restrictionLiftedEmail = (params: RestrictionLiftedParams): string => {
  const {
    recipientName,
    previousRestriction,
    userType = 'Patient',
    supportUrl = 'mailto:support@rapidcapsule.com',
  } = params;

  const messagesUrl = userType === 'Specialist'
    ? 'https://rapidcapsule.com/app/specialist/messages'
    : 'https://rapidcapsule.com/app/patient/messages';
  const prevLabel = previousRestriction === 'blocked' ? 'block' : 'read-only restriction';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f7fa;">
    <tr>
      <td align="center" style="padding: 24px 0;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

          <!-- Logo Bar -->
          <tr>
            <td style="background-color: #ffffff; padding: 24px 30px 16px; text-align: center;">
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 10px;">
                    <img
                      src="https://rapidcapsule.com/RapidCapsule_Logo.png"
                      alt="Rapid Capsule"
                      width="36"
                      height="36"
                      style="display: block; width: 36px; height: 36px; object-fit: contain; border: 0;"
                    />
                  </td>
                  <td style="vertical-align: middle;">
                    <span style="font-size: 18px; font-weight: 700; color: #1e293b; letter-spacing: -0.3px;">Rapid Capsule</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">Messaging Restrictions Lifted</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 15px;">Your messaging access has been fully restored</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 30px;">
              <p style="font-size: 17px; color: #2c3e50; margin: 0 0 18px;">Hi ${recipientName},</p>

              <p style="color: #546e7a; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                Good news! Your previous messaging ${prevLabel} has been lifted. You now have full messaging access on Rapid Capsule.
              </p>

              <p style="color: #546e7a; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                You can now send and receive messages, share attachments, and communicate with your healthcare providers as normal.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 28px 0;">
                    <a href="${messagesUrl}" style="display: inline-block; background: linear-gradient(135deg, #4FC3F7, #29B6F6); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);">Open Messages</a>
                  </td>
                </tr>
              </table>

              <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0;">
                If you have any questions, please don't hesitate to <a href="${supportUrl}" style="color: #4FC3F7; text-decoration: none;">contact support</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 4px 0; color: #78909c; font-size: 13px;"><strong>Rapid Capsule</strong></p>
              <p style="margin: 4px 0; color: #78909c; font-size: 13px;">Your healthcare, delivered.</p>
              <p style="margin: 4px 0; font-size: 13px;"><a href="https://rapidcapsule.com" style="color: #4FC3F7; text-decoration: none;">Visit Dashboard</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};
