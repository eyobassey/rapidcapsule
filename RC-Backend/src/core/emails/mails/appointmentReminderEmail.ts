interface AppointmentReminderParams {
  recipientName: string;
  appointmentDate: string;
  appointmentTime: string;
  otherPartyName: string;
  appointmentType: string;
  joinUrl?: string;
  meetingChannel: string;
  isSpecialist: boolean;
}

export const appointmentReminderEmail = (params: AppointmentReminderParams): string => {
  const {
    recipientName,
    appointmentDate,
    appointmentTime,
    otherPartyName,
    appointmentType,
    joinUrl,
    meetingChannel,
    isSpecialist,
  } = params;

  // Channel-specific colors
  const channelColors: Record<string, string> = {
    zoom: '#2D8CFF',
    whatsapp: '#25D366',
    google_meet: '#34A853',
    microsoft_teams: '#6264A7',
    phone: '#FF6B6B',
    in_person: '#4ECDC4',
  };

  const channelNames: Record<string, string> = {
    zoom: 'Zoom',
    whatsapp: 'WhatsApp',
    google_meet: 'Google Meet',
    microsoft_teams: 'Microsoft Teams',
    phone: 'Phone Call',
    in_person: 'In-Person Visit',
  };

  const color = channelColors[meetingChannel] || '#4FC3F7';
  const channelName = channelNames[meetingChannel] || 'Video Call';
  const hasLink = joinUrl && joinUrl.trim() !== '' && !['phone', 'in_person'].includes(meetingChannel);

  const roleLabel = isSpecialist ? 'Patient' : 'Specialist';
  const greeting = isSpecialist ? `Dr. ${recipientName}` : recipientName;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; color: #2c3e50; margin-bottom: 20px; }
    .reminder-card { background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-left: 4px solid #F59E0B; padding: 25px; margin: 25px 0; border-radius: 8px; }
    .reminder-card h3 { margin: 0 0 15px; color: #92400E; font-size: 20px; }
    .reminder-card .detail { display: flex; margin: 12px 0; }
    .reminder-card .detail-label { font-weight: 600; color: #78350F; min-width: 100px; }
    .reminder-card .detail-value { color: #92400E; }
    .button { display: inline-block; background-color: ${color}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .channel-badge { display: inline-block; background: ${color}; color: #fff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-top: 10px; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: ${color}; text-decoration: none; }
    .tip-box { background: #E0F2FE; border-radius: 8px; padding: 15px 20px; margin: 20px 0; }
    .tip-box p { margin: 0; color: #0369A1; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Appointment Reminder</h1>
      <p>Your appointment is coming up soon!</p>
    </div>

    <div class="content">
      <p class="greeting">Hello ${greeting},</p>

      <p style="color: #546e7a; line-height: 1.6;">
        This is a friendly reminder about your upcoming appointment. Please make sure you're prepared and available at the scheduled time.
      </p>

      <div class="reminder-card">
        <h3>📅 Appointment Details</h3>
        <div class="detail">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${appointmentDate}</span>
        </div>
        <div class="detail">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${appointmentTime}</span>
        </div>
        <div class="detail">
          <span class="detail-label">${roleLabel}:</span>
          <span class="detail-value">${otherPartyName}</span>
        </div>
        <div class="detail">
          <span class="detail-label">Type:</span>
          <span class="detail-value">${appointmentType}</span>
        </div>
        <span class="channel-badge">${channelName}</span>
      </div>

      ${hasLink ? `
        <center>
          <a href="${joinUrl}" class="button">Join ${channelName}</a>
        </center>
        <p style="text-align: center; color: #78909c; font-size: 13px;">
          Or copy this link: <a href="${joinUrl}" style="color: ${color}; word-break: break-all;">${joinUrl}</a>
        </p>
      ` : ''}

      <div class="tip-box">
        <p>💡 <strong>Tip:</strong> ${isSpecialist
          ? 'Review the patient\'s records before the appointment for a more effective consultation.'
          : 'Have any questions or symptoms ready to discuss with your healthcare provider.'}</p>
      </div>

      <p style="color: #78909c; font-size: 14px; line-height: 1.6;">
        Need to reschedule? Please do so at least 24 hours in advance through your <a href="https://rapidcapsule.com" style="color: ${color};">dashboard</a>.
      </p>
    </div>

    <div class="footer">
      <p><strong>Rapid Capsule</strong></p>
      <p>Your healthcare, delivered.</p>
      <p><a href="https://rapidcapsule.com">Visit Dashboard</a> | <a href="https://rapidcapsule.com/support">Support</a></p>
    </div>
  </div>
</body>
</html>
  `;
};
