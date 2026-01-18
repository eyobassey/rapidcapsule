// ============ CREDIT TRANSFER EMAIL TEMPLATES ============

export interface CreditTransferSentEmailData {
  senderName: string;
  recipientName: string;
  creditsSent: number;
  remainingCredits: number;
  transferDate: string;
}

export interface CreditTransferReceivedEmailData {
  recipientName: string;
  senderName: string;
  creditsReceived: number;
  totalCredits: number;
  transferDate: string;
}

/**
 * Email sent to the sender after successfully transferring credits
 */
export const creditTransferSentEmail = (data: CreditTransferSentEmailData) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center; }
    .logo { margin-bottom: 15px; }
    .logo img { height: 50px; width: auto; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
    .header p { color: rgba(255, 255, 255, 0.9); margin: 8px 0 0; font-size: 14px; }
    .content { padding: 30px; }
    .transfer-card { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; padding: 25px; margin: 20px 0; text-align: center; border: 2px solid #f59e0b; }
    .transfer-icon { font-size: 48px; margin-bottom: 10px; }
    .transfer-card h2 { margin: 0 0 5px; color: #b45309; font-size: 20px; }
    .transfer-card p { margin: 0; color: #d97706; font-size: 14px; }
    .credits-sent { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; font-size: 28px; font-weight: 700; padding: 12px 24px; border-radius: 12px; margin-top: 12px; }
    .details-section { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .details-section h3 { margin: 0 0 15px; color: #1f2937; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; }
    .detail-value { color: #1f2937; font-weight: 600; }
    .detail-value.highlight { color: #059669; }
    .remaining-box { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #22c55e; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
    .remaining-box h4 { margin: 0 0 8px; color: #15803d; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
    .remaining-count { font-size: 36px; font-weight: 700; color: #059669; margin: 0; }
    .remaining-label { font-size: 14px; color: #16a34a; margin: 5px 0 0; }
    .cta-section { text-align: center; margin: 30px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); }
    .footer { background: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 5px 0; color: #6b7280; font-size: 13px; }
    .footer a { color: #059669; text-decoration: none; }
    .footer .copyright { margin-top: 15px; font-size: 12px; color: #9ca3af; }
    .info-note { background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 13px; color: #1e40af; line-height: 1.5; }
    .info-note strong { color: #1e3a8a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <img src="https://rapidcapsule.com/RapidCapsule_Logo.png" alt="Rapid Capsule" />
      </div>
      <h1>AI Credits Sent Successfully!</h1>
      <p>Credit Transfer Confirmation</p>
    </div>

    <div class="content">
      <p style="font-size: 15px; color: #374151; line-height: 1.6;">
        Dear <strong>${data.senderName}</strong>,
      </p>
      <p style="font-size: 15px; color: #6b7280; line-height: 1.6;">
        Your AI credit transfer has been completed successfully. Here are the details of your transaction:
      </p>

      <div class="transfer-card">
        <div class="transfer-icon">&#128176;</div>
        <h2>Credits Sent</h2>
        <p>to ${data.recipientName}</p>
        <div class="credits-sent">${data.creditsSent} Credits</div>
      </div>

      <div class="details-section">
        <h3>&#128203; Transfer Details</h3>
        <div class="detail-row">
          <span class="detail-label">Recipient</span>
          <span class="detail-value highlight">${data.recipientName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Credits Sent</span>
          <span class="detail-value">${data.creditsSent} AI Credits</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Transfer Date</span>
          <span class="detail-value">${data.transferDate}</span>
        </div>
      </div>

      <div class="remaining-box">
        <h4>Your Remaining Balance</h4>
        <p class="remaining-count">${data.remainingCredits}</p>
        <p class="remaining-label">Purchased AI Credits</p>
      </div>

      <div class="info-note">
        <strong>Note:</strong> Only purchased credits can be shared with other patients. Free monthly credits and gifted credits cannot be transferred.
      </div>

      <div class="cta-section">
        <a href="https://rapidcapsule.com/app/patient/wallet" class="cta-button">View Your Wallet</a>
      </div>
    </div>

    <div class="footer">
      <p><strong>Rapid Capsule</strong></p>
      <p>Your healthcare, simplified.</p>
      <p><a href="https://rapidcapsule.com">Visit Dashboard</a> | <a href="https://rapidcapsule.com/support">Support</a></p>
      <p class="copyright">
        This email was sent because you transferred AI credits on Rapid Capsule.<br>
        &copy; ${new Date().getFullYear()} Rapid Capsule. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Email sent to the recipient after receiving credits
 */
export const creditTransferReceivedEmail = (data: CreditTransferReceivedEmailData) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center; }
    .logo { margin-bottom: 15px; }
    .logo img { height: 50px; width: auto; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; }
    .header p { color: rgba(255, 255, 255, 0.9); margin: 8px 0 0; font-size: 14px; }
    .content { padding: 30px; }
    .gift-card { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 16px; padding: 25px; margin: 20px 0; text-align: center; border: 2px solid #10b981; }
    .gift-icon { font-size: 48px; margin-bottom: 10px; }
    .gift-card h2 { margin: 0 0 5px; color: #047857; font-size: 20px; }
    .gift-card p { margin: 0; color: #059669; font-size: 14px; }
    .credits-received { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; font-size: 28px; font-weight: 700; padding: 12px 24px; border-radius: 12px; margin-top: 12px; }
    .details-section { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .details-section h3 { margin: 0 0 15px; color: #1f2937; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; }
    .detail-value { color: #1f2937; font-weight: 600; }
    .detail-value.highlight { color: #059669; }
    .total-box { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #22c55e; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
    .total-box h4 { margin: 0 0 8px; color: #15803d; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
    .total-count { font-size: 36px; font-weight: 700; color: #059669; margin: 0; }
    .total-label { font-size: 14px; color: #16a34a; margin: 5px 0 0; }
    .cta-section { text-align: center; margin: 30px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); }
    .footer { background: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 5px 0; color: #6b7280; font-size: 13px; }
    .footer a { color: #059669; text-decoration: none; }
    .footer .copyright { margin-top: 15px; font-size: 12px; color: #9ca3af; }
    .info-note { background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 13px; color: #1e40af; line-height: 1.5; }
    .info-note strong { color: #1e3a8a; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <img src="https://rapidcapsule.com/RapidCapsule_Logo.png" alt="Rapid Capsule" />
      </div>
      <h1>You've Received AI Credits!</h1>
      <p>Credit Transfer Notification</p>
    </div>

    <div class="content">
      <p style="font-size: 15px; color: #374151; line-height: 1.6;">
        Dear <strong>${data.recipientName}</strong>,
      </p>
      <p style="font-size: 15px; color: #6b7280; line-height: 1.6;">
        Great news! You've received AI credits from another Rapid Capsule user. Here are the details:
      </p>

      <div class="gift-card">
        <div class="gift-icon">&#127873;</div>
        <h2>Credits Received</h2>
        <p>from ${data.senderName}</p>
        <div class="credits-received">+${data.creditsReceived} Credits</div>
      </div>

      <div class="details-section">
        <h3>&#128203; Transfer Details</h3>
        <div class="detail-row">
          <span class="detail-label">Sent By</span>
          <span class="detail-value highlight">${data.senderName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Credits Received</span>
          <span class="detail-value">${data.creditsReceived} AI Credits</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Transfer Date</span>
          <span class="detail-value">${data.transferDate}</span>
        </div>
      </div>

      <div class="total-box">
        <h4>Your New Balance</h4>
        <p class="total-count">${data.totalCredits}</p>
        <p class="total-label">Purchased AI Credits</p>
      </div>

      <div class="info-note">
        <strong>How to use your credits:</strong> Use AI credits to generate personalized AI-powered health summaries after completing health checkups. Each summary provides detailed insights and recommendations based on your health data.
      </div>

      <div class="cta-section">
        <a href="https://rapidcapsule.com/app/patient/wallet" class="cta-button">View Your Wallet</a>
      </div>
    </div>

    <div class="footer">
      <p><strong>Rapid Capsule</strong></p>
      <p>Your healthcare, simplified.</p>
      <p><a href="https://rapidcapsule.com">Visit Dashboard</a> | <a href="https://rapidcapsule.com/support">Support</a></p>
      <p class="copyright">
        This email was sent because you received AI credits on Rapid Capsule.<br>
        &copy; ${new Date().getFullYear()} Rapid Capsule. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};
