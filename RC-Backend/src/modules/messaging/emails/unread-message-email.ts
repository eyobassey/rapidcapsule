interface UnreadMessageEmailParams {
  recipientName: string;
  senderName: string;
  senderRole: string; // 'Patient', 'Specialist', 'Admin'
  unreadCount: number;
  latestMessage: string;
  latestMessageType: string; // 'text', 'image', 'voice_note', etc.
  conversationUrl: string;
}

export const unreadMessageEmail = (params: UnreadMessageEmailParams): string => {
  const {
    recipientName,
    senderName,
    senderRole,
    unreadCount,
    latestMessage,
    latestMessageType,
    conversationUrl,
  } = params;

  const roleBadgeColors: Record<string, string> = {
    Patient: '#10B981',
    Specialist: '#6366F1',
    Admin: '#F59E0B',
  };

  const badgeColor = roleBadgeColors[senderRole] || '#4FC3F7';

  // Format the message preview based on type
  let messagePreview = latestMessage;
  if (latestMessageType === 'voice_note') {
    messagePreview = '&#127908; Voice note';
  } else if (latestMessageType === 'image') {
    messagePreview = latestMessage ? `&#128247; Photo — ${latestMessage}` : '&#128247; Photo';
  } else if (latestMessageType === 'video') {
    messagePreview = latestMessage ? `&#127909; Video — ${latestMessage}` : '&#127909; Video';
  } else if (latestMessageType === 'file') {
    messagePreview = latestMessage ? `&#128206; File — ${latestMessage}` : '&#128206; File attachment';
  }

  if (messagePreview && messagePreview.length > 200) {
    messagePreview = messagePreview.substring(0, 200) + '...';
  }

  const messageWord = unreadCount === 1 ? 'message' : 'messages';

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
            <td style="background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%); padding: 30px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">New ${messageWord} waiting for you</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 15px;">${unreadCount} unread ${messageWord} from ${senderName}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px 30px;">
              <p style="font-size: 17px; color: #2c3e50; margin: 0 0 18px;">Hi ${recipientName},</p>

              <p style="color: #546e7a; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                You have <strong>${unreadCount} unread ${messageWord}</strong> from
                <strong>${senderName}</strong>
                <span style="display: inline-block; background: ${badgeColor}; color: #fff; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; letter-spacing: 0.3px; text-transform: uppercase; vertical-align: middle; margin-left: 4px;">${senderRole}</span>
              </p>

              <!-- Message preview card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                <tr>
                  <td style="background: #f8fafc; border-left: 4px solid #4FC3F7; padding: 16px 20px; border-radius: 0 8px 8px 0;">
                    <div style="font-weight: 600; color: #334155; font-size: 14px; margin-bottom: 6px;">${senderName}</div>
                    <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0;">${messagePreview || 'New message'}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 28px 0;">
                    <a href="${conversationUrl}" style="display: inline-block; background: linear-gradient(135deg, #4FC3F7, #29B6F6); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);">View Conversation</a>
                  </td>
                </tr>
              </table>

              <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0;">
                You're receiving this because you have unread messages. If you'd prefer not to receive these notifications, you can manage your preferences in your account settings.
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
