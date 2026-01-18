import { ICalAttendeeData } from 'ical-generator';

export const appointmentScheduleEmail = (
  link: string,
  attendees: ICalAttendeeData[],
  meetingChannel: string = 'zoom',
  appointmentDate?: string,
  appointmentType?: string,
  patientNotes?: string,
) => {
  // Channel-specific messages
  const channelInfo = {
    zoom: {
      name: 'Zoom',
      instruction: 'Join the video consultation via the Zoom link below:',
      buttonText: 'Join Zoom Meeting',
      color: '#2D8CFF'
    },
    whatsapp: {
      name: 'WhatsApp',
      instruction: 'Start the consultation by clicking the WhatsApp link below:',
      buttonText: 'Open WhatsApp Chat',
      color: '#25D366'
    },
    google_meet: {
      name: 'Google Meet',
      instruction: 'Join the video consultation via Google Meet:',
      buttonText: 'Join Google Meet',
      color: '#34A853'
    },
    microsoft_teams: {
      name: 'Microsoft Teams',
      instruction: 'Join the video consultation via Microsoft Teams:',
      buttonText: 'Join Teams Meeting',
      color: '#6264A7'
    },
    phone: {
      name: 'Phone Call',
      instruction: 'The specialist will call you at your registered phone number at the scheduled time.',
      buttonText: null,
      color: '#FF6B6B'
    },
    in_person: {
      name: 'In-Person Visit',
      instruction: 'Please visit the specialist at their clinic at the scheduled time.',
      buttonText: null,
      color: '#4ECDC4'
    }
  };

  const channel = channelInfo[meetingChannel] || channelInfo.zoom;
  const hasLink = link && link.trim() !== '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, ${channel.color} 0%, ${channel.color}dd 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .meeting-card { background: #f8f9fa; border-left: 4px solid ${channel.color}; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .meeting-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .meeting-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .button { display: inline-block; background-color: ${channel.color}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .button:hover { opacity: 0.9; }
    .attendees { margin: 30px 0; }
    .attendees h3 { color: #2c3e50; font-size: 18px; margin-bottom: 15px; }
    .attendee { display: flex; align-items: center; padding: 12px; background: #f8f9fa; margin: 8px 0; border-radius: 6px; }
    .attendee-avatar { width: 40px; height: 40px; border-radius: 50%; background: ${channel.color}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; margin-right: 12px; }
    .attendee-info { flex: 1; }
    .attendee-name { font-weight: 600; color: #2c3e50; }
    .attendee-email { color: #78909c; font-size: 14px; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: ${channel.color}; text-decoration: none; }
    .divider { height: 1px; background: #e0e0e0; margin: 30px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 Appointment Scheduled</h1>
      <p>Your healthcare consultation is confirmed</p>
    </div>

    <div class="content">
      <div class="meeting-card">
        <h3>📅 ${channel.name} Consultation</h3>
        ${appointmentType ? `<p><strong>Appointment Type:</strong> ${appointmentType}</p>` : ''}
        ${appointmentDate ? `<p><strong>Date & Time:</strong> ${appointmentDate}</p>` : ''}
        <p>${channel.instruction}</p>
      </div>

      ${patientNotes ? `
        <div class="meeting-card" style="background: #fff9e6; border-left-color: #ffc107;">
          <h3>📝 Notes for This Appointment</h3>
          <p style="white-space: pre-wrap;">${patientNotes}</p>
        </div>
      ` : ''}

      ${hasLink && channel.buttonText ? `
        <center>
          <a href="${link}" class="button">${channel.buttonText}</a>
        </center>
        <p style="text-align: center; color: #78909c; font-size: 13px; margin-top: 10px;">
          Or copy this link: <a href="${link}" style="color: ${channel.color}; word-break: break-all;">${link}</a>
        </p>
      ` : ''}

      <div class="divider"></div>

      <div class="attendees">
        <h3>👥 Attendees</h3>
        ${attendees.map((attendee) => {
          const name = attendee.name || 'Unknown';
          const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
          return `
            <div class="attendee">
              <div class="attendee-avatar">${initials}</div>
              <div class="attendee-info">
                <div class="attendee-name">${name}</div>
                <div class="attendee-email">${attendee.email}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="divider"></div>

      <p style="color: #78909c; font-size: 14px; line-height: 1.6;">
        <strong>Important:</strong> Please join the consultation on time. If you need to reschedule, please do so at least 24 hours in advance through your dashboard.
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
