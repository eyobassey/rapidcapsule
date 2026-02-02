import { ICalAttendeeData } from 'ical-generator';

export interface AppointmentEmailData {
  link: string;
  attendees: ICalAttendeeData[];
  meetingChannel?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentType?: string;
  patientNotes?: string;
  urgency?: string;
  // Enhanced fields
  appointmentId?: string;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  specialistName?: string;
  specialistTitle?: string;
  specialistSpecialty?: string;
  duration?: number;
  consultationFee?: number;
  platformFee?: number;
  totalAmount?: number;
  paymentSource?: string;
  paymentStatus?: string;
  timezone?: string;
  clinicalFlags?: string[];
  preVisitInstructions?: string;
  isRecipientPatient?: boolean;
  createdBySpecialist?: boolean;
}

export const appointmentScheduleEmail = (
  link: string,
  attendees: ICalAttendeeData[],
  meetingChannel: string = 'zoom',
  appointmentDate?: string,
  appointmentType?: string,
  patientNotes?: string,
  urgency?: string,
  // Extended parameters for comprehensive email
  extendedData?: Partial<AppointmentEmailData>,
) => {
  // Channel-specific configuration
  const channelConfig = {
    zoom: {
      name: 'Video Consultation',
      icon: '📹',
      color: '#0EA5E9',
      headerGradient: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
      buttonText: 'Join Video Call',
      instruction: 'Click the button below to join your video consultation at the scheduled time.',
    },
    whatsapp: {
      name: 'WhatsApp Call',
      icon: '💬',
      color: '#25D366',
      headerGradient: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
      buttonText: 'Open WhatsApp',
      instruction: 'The specialist will contact you via WhatsApp at the scheduled time.',
    },
    google_meet: {
      name: 'Google Meet',
      icon: '🎥',
      color: '#34A853',
      headerGradient: 'linear-gradient(135deg, #34A853 0%, #0F9D58 100%)',
      buttonText: 'Join Google Meet',
      instruction: 'Click the button below to join your Google Meet consultation.',
    },
    phone: {
      name: 'Phone Consultation',
      icon: '📞',
      color: '#6366F1',
      headerGradient: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
      buttonText: null,
      instruction: 'The specialist will call you at your registered phone number at the scheduled time.',
    },
    in_person: {
      name: 'In-Person Visit',
      icon: '🏥',
      color: '#10B981',
      headerGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      buttonText: 'Get Directions',
      instruction: 'Please arrive at the clinic 10-15 minutes before your scheduled appointment.',
    },
  };

  const channel = channelConfig[meetingChannel] || channelConfig.zoom;
  const hasLink = link && link.trim() !== '';

  // Extract extended data with defaults
  const {
    appointmentId = '',
    patientName = '',
    specialistName = '',
    specialistSpecialty = '',
    duration = 30,
    consultationFee = 0,
    platformFee = 0,
    totalAmount = 0,
    paymentSource = '',
    timezone = 'WAT (GMT+1)',
    clinicalFlags = [],
    preVisitInstructions = '',
    isRecipientPatient = true,
    createdBySpecialist = false,
  } = extendedData || {};

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Get payment source label
  const getPaymentLabel = (source: string) => {
    const labels = {
      'specialist_wallet': 'Complimentary (Specialist Covered)',
      'patient_wallet': 'Rapid Wallet',
      'card': 'Card Payment',
    };
    return labels[source] || 'Paid';
  };

  // Build clinical flags HTML
  const clinicalFlagsHtml = clinicalFlags && clinicalFlags.length > 0 ? `
    <tr>
      <td style="padding: 20px 30px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #FEF3C7; border-radius: 8px; border: 1px solid #FCD34D;">
          <tr>
            <td style="padding: 15px 20px;">
              <p style="margin: 0 0 10px; font-weight: 600; color: #92400E; font-size: 14px;">⚠️ Special Requirements</p>
              <p style="margin: 0; color: #78350F; font-size: 13px;">
                ${clinicalFlags.map(flag => `<span style="display: inline-block; background: #FDE68A; padding: 3px 10px; border-radius: 12px; margin: 2px 4px 2px 0; font-size: 12px;">${flag}</span>`).join('')}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : '';

  // Build pre-visit instructions HTML
  const instructionsHtml = preVisitInstructions ? `
    <tr>
      <td style="padding: 0 30px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #EFF6FF; border-radius: 8px; border: 1px solid #BFDBFE;">
          <tr>
            <td style="padding: 15px 20px;">
              <p style="margin: 0 0 8px; font-weight: 600; color: #1E40AF; font-size: 14px;">📋 Pre-Visit Instructions</p>
              <p style="margin: 0; color: #1E3A8A; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">${preVisitInstructions}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : '';

  // Build patient notes HTML
  const notesHtml = patientNotes ? `
    <tr>
      <td style="padding: 0 30px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #FFFBEB; border-radius: 8px; border: 1px solid #FDE68A;">
          <tr>
            <td style="padding: 15px 20px;">
              <p style="margin: 0 0 8px; font-weight: 600; color: #92400E; font-size: 14px;">📝 Notes for This Appointment</p>
              <p style="margin: 0; color: #78350F; font-size: 13px; line-height: 1.6; white-space: pre-wrap;">${patientNotes}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : '';

  // Build payment summary HTML (only for patient emails)
  const paymentHtml = isRecipientPatient && totalAmount > 0 ? `
    <tr>
      <td style="padding: 0 30px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #F0FDF4; border-radius: 8px; border: 1px solid #BBF7D0;">
          <tr>
            <td style="padding: 15px 20px;">
              <p style="margin: 0 0 12px; font-weight: 600; color: #166534; font-size: 14px;">💳 Payment Summary</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${consultationFee > 0 ? `
                  <tr>
                    <td style="padding: 4px 0; color: #166534; font-size: 13px;">Consultation Fee</td>
                    <td style="padding: 4px 0; color: #166534; font-size: 13px; text-align: right;">${formatCurrency(consultationFee)}</td>
                  </tr>
                ` : ''}
                ${platformFee > 0 ? `
                  <tr>
                    <td style="padding: 4px 0; color: #166534; font-size: 13px;">Platform Fee</td>
                    <td style="padding: 4px 0; color: #166534; font-size: 13px; text-align: right;">${formatCurrency(platformFee)}</td>
                  </tr>
                ` : ''}
                <tr>
                  <td colspan="2" style="padding-top: 8px; border-top: 1px solid #86EFAC;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0 0; color: #15803D; font-size: 15px; font-weight: 700;">Total Paid</td>
                        <td style="padding: 8px 0 0; color: #15803D; font-size: 15px; font-weight: 700; text-align: right;">${formatCurrency(totalAmount)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ${paymentSource ? `<p style="margin: 10px 0 0; color: #166534; font-size: 12px;">Payment Method: ${getPaymentLabel(paymentSource)}</p>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : '';

  // Build meeting button HTML
  const meetingButtonHtml = hasLink && channel.buttonText ? `
    <tr>
      <td style="padding: 20px 30px;" align="center">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="background: ${channel.color}; border-radius: 8px;">
              <a href="${link}" style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px;">${channel.buttonText}</a>
            </td>
          </tr>
        </table>
        <p style="margin: 15px 0 0; color: #64748B; font-size: 12px;">
          Or copy this link: <a href="${link}" style="color: ${channel.color}; word-break: break-all;">${link}</a>
        </p>
      </td>
    </tr>
  ` : '';

  // Build checklist based on channel
  const getChecklistItems = () => {
    const videoChecklist = `
      <tr><td style="padding: 6px 0; color: #475569; font-size: 13px;">✓ Test your camera and microphone before the appointment</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-size: 13px;">✓ Find a quiet, well-lit space for your consultation</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-size: 13px;">✓ Ensure you have a stable internet connection</td></tr>
    `;
    const phoneChecklist = `
      <tr><td style="padding: 6px 0; color: #475569; font-size: 13px;">✓ Keep your phone charged and nearby at the scheduled time</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-size: 13px;">✓ Find a quiet place where you can speak privately</td></tr>
    `;
    const inPersonChecklist = `
      <tr><td style="padding: 6px 0; color: #475569; font-size: 13px;">✓ Bring a valid ID and your insurance card (if applicable)</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-size: 13px;">✓ Arrive 10-15 minutes early for registration</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-size: 13px;">✓ Bring a list of current medications</td></tr>
    `;

    let checklist = '';
    if (['zoom', 'google_meet', 'microsoft_teams'].includes(meetingChannel)) {
      checklist = videoChecklist;
    } else if (meetingChannel === 'phone') {
      checklist = phoneChecklist;
    } else if (meetingChannel === 'in_person') {
      checklist = inPersonChecklist;
    }

    return checklist + `
      <tr><td style="padding: 6px 0; color: #475569; font-size: 13px;">✓ Prepare any questions or symptoms you want to discuss</td></tr>
      <tr><td style="padding: 6px 0; color: #475569; font-size: 13px;">✓ Have your medical history and current medications ready</td></tr>
    `;
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Appointment Confirmation</title>
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
<body style="margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F3F4F6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: ${channel.headerGradient}; padding: 40px 30px; text-align: center;">
              <img src="https://rapidcapsule.com/RapidCapsule_Logo.png" alt="Rapid Capsule" width="160" style="display: block; margin: 0 auto 20px; max-width: 160px; height: auto;" />
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700;">Appointment Confirmed!</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 15px;">
                ${createdBySpecialist ? 'Your specialist has scheduled an appointment for you' : 'Your healthcare consultation is scheduled'}
              </p>
              ${appointmentId ? `
                <table cellpadding="0" cellspacing="0" style="margin: 20px auto 0;">
                  <tr>
                    <td style="background: rgba(255,255,255,0.2); padding: 8px 20px; border-radius: 20px;">
                      <span style="color: #ffffff; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">Ref: #${appointmentId.slice(-8).toUpperCase()}</span>
                    </td>
                  </tr>
                </table>
              ` : ''}
            </td>
          </tr>

          <!-- Quick Summary -->
          <tr>
            <td style="padding: 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0;">
                <tr>
                  <td width="33%" style="padding: 20px; text-align: center; border-right: 1px solid #E2E8F0;">
                    <p style="margin: 0 0 5px; font-size: 24px;">📅</p>
                    <p style="margin: 0 0 4px; font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Date</p>
                    <p style="margin: 0; font-size: 14px; color: #1E293B; font-weight: 700;">${appointmentDate || 'To be confirmed'}</p>
                  </td>
                  <td width="33%" style="padding: 20px; text-align: center; border-right: 1px solid #E2E8F0;">
                    <p style="margin: 0 0 5px; font-size: 24px;">⏱️</p>
                    <p style="margin: 0 0 4px; font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Duration</p>
                    <p style="margin: 0; font-size: 14px; color: #1E293B; font-weight: 700;">${duration} minutes</p>
                  </td>
                  <td width="33%" style="padding: 20px; text-align: center;">
                    <p style="margin: 0 0 5px; font-size: 24px;">${channel.icon}</p>
                    <p style="margin: 0 0 4px; font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Channel</p>
                    <p style="margin: 0; font-size: 14px; color: #1E293B; font-weight: 700;">${channel.name}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting & Info -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <p style="margin: 0 0 15px; font-size: 15px; color: #334155; line-height: 1.6;">
                ${isRecipientPatient
                  ? `Dear <strong>${patientName || 'Patient'}</strong>,`
                  : `Dear <strong>Dr. ${specialistName || 'Specialist'}</strong>,`
                }
              </p>
              <p style="margin: 0; font-size: 14px; color: #64748B; line-height: 1.7;">
                ${isRecipientPatient
                  ? `Your appointment has been confirmed${specialistName ? ` with <strong>${specialistName}</strong>` : ''}${specialistSpecialty ? ` (${specialistSpecialty})` : ''}. Please find the details below.`
                  : `You have a new appointment scheduled${patientName ? ` with <strong>${patientName}</strong>` : ''}. Please find the details below.`
                }
              </p>
            </td>
          </tr>

          <!-- Appointment Details -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #E2E8F0; border-radius: 8px;">
                <tr>
                  <td style="padding: 15px 20px; background: #F8FAFC; border-bottom: 1px solid #E2E8F0;">
                    <p style="margin: 0; font-size: 15px; font-weight: 700; color: #1E293B;">📋 Appointment Details</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${appointmentType ? `
                        <tr>
                          <td style="padding: 8px 0; color: #64748B; font-size: 13px; width: 40%;">Type</td>
                          <td style="padding: 8px 0; color: #1E293B; font-size: 13px; font-weight: 600;">${appointmentType}</td>
                        </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 0; color: #64748B; font-size: 13px; width: 40%;">Channel</td>
                        <td style="padding: 8px 0; color: #1E293B; font-size: 13px; font-weight: 600;">${channel.name}</td>
                      </tr>
                      ${urgency ? `
                        <tr>
                          <td style="padding: 8px 0; color: #64748B; font-size: 13px;">Priority</td>
                          <td style="padding: 8px 0;">
                            <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; ${urgency === 'urgent' ? 'background: #FEE2E2; color: #DC2626;' : 'background: #DBEAFE; color: #1E40AF;'}">
                              ${urgency === 'urgent' ? '⚡ Urgent' : '📋 Routine'}
                            </span>
                          </td>
                        </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 0; color: #64748B; font-size: 13px;">Timezone</td>
                        <td style="padding: 8px 0; color: #1E293B; font-size: 13px; font-weight: 600;">${timezone}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Participants -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #E2E8F0; border-radius: 8px;">
                <tr>
                  <td style="padding: 15px 20px; background: #F8FAFC; border-bottom: 1px solid #E2E8F0;">
                    <p style="margin: 0; font-size: 15px; font-weight: 700; color: #1E293B;">👥 Participants</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 20px;">
                    ${attendees.map((attendee, index) => {
                      const name = attendee.name || 'Unknown';
                      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                      const isSpec = index === 1 || name.toLowerCase().includes('dr.');
                      return `
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: ${index < attendees.length - 1 ? '12px' : '0'};">
                          <tr>
                            <td width="44" valign="middle">
                              <table cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="width: 40px; height: 40px; background: ${channel.color}; border-radius: 50%; text-align: center; vertical-align: middle;">
                                    <span style="color: #ffffff; font-weight: 700; font-size: 14px; line-height: 40px;">${initials}</span>
                                  </td>
                                </tr>
                              </table>
                            </td>
                            <td style="padding-left: 12px;" valign="middle">
                              <p style="margin: 0 0 2px; font-size: 14px; font-weight: 600; color: #1E293B;">${isSpec ? 'Dr. ' : ''}${name}</p>
                              <p style="margin: 0; font-size: 12px; color: #64748B;">${attendee.email}</p>
                            </td>
                            <td width="100" align="right" valign="middle">
                              <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; ${isSpec ? 'background: #DBEAFE; color: #1E40AF;' : 'background: #DCFCE7; color: #166534;'}">
                                ${isSpec ? 'Specialist' : 'Patient'}
                              </span>
                            </td>
                          </tr>
                        </table>
                      `;
                    }).join('')}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- How to Join -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, ${channel.color}08 0%, ${channel.color}15 100%); border: 1px dashed ${channel.color}60; border-radius: 12px;">
                <tr>
                  <td style="padding: 25px;">
                    <p style="margin: 0 0 10px; font-size: 16px; font-weight: 700; color: #1E293B;">
                      ${channel.icon} How to Join
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.6;">
                      ${channel.instruction}
                    </p>
                  </td>
                </tr>
                ${meetingButtonHtml}
              </table>
            </td>
          </tr>

          ${clinicalFlagsHtml}
          ${notesHtml}
          ${instructionsHtml}
          ${paymentHtml}

          <!-- Pre-Appointment Checklist -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 15px; font-size: 14px; font-weight: 700; color: #1E293B;">✅ Before Your Appointment</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${getChecklistItems()}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cancellation Notice -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #FEF2F2; border-radius: 8px; border: 1px solid #FECACA;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="margin: 0; font-size: 13px; color: #991B1B; line-height: 1.6;">
                      <strong>⚠️ Cancellation Policy:</strong> If you need to reschedule or cancel, please do so at least 24 hours in advance through your dashboard. Late cancellations may be subject to a fee.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #F8FAFC; padding: 30px; text-align: center; border-top: 1px solid #E2E8F0;">
              <img src="https://rapidcapsule.com/RapidCapsule_Logo.png" alt="Rapid Capsule" width="120" style="display: block; margin: 0 auto 15px; max-width: 120px; height: auto;" />
              <p style="margin: 0 0 5px; color: #64748B; font-size: 14px;">Your healthcare, delivered.</p>
              <p style="margin: 15px 0;">
                <a href="https://rapidcapsule.com/app/patient/dashboard" style="color: ${channel.color}; text-decoration: none; font-size: 13px; margin: 0 10px;">Dashboard</a>
                <span style="color: #CBD5E1;">|</span>
                <a href="https://rapidcapsule.com/app/patient/appointmentsv2" style="color: ${channel.color}; text-decoration: none; font-size: 13px; margin: 0 10px;">My Appointments</a>
                <span style="color: #CBD5E1;">|</span>
                <a href="https://rapidcapsule.com/support" style="color: ${channel.color}; text-decoration: none; font-size: 13px; margin: 0 10px;">Support</a>
              </p>
              <p style="margin: 20px 0 0; color: #94A3B8; font-size: 11px; line-height: 1.6;">
                © ${new Date().getFullYear()} Rapid Capsule Health Technologies. All rights reserved.<br>
                This email was sent regarding your appointment on Rapid Capsule.
              </p>
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
