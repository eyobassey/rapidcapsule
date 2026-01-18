// ============ CLAUDE SUMMARY PURCHASE CONFIRMATION EMAIL ============

export interface ClaudeSummaryPurchaseEmailData {
  patientName: string;
  planName: string;
  planType: 'bundle' | 'unlimited_monthly' | 'unlimited_yearly';
  credits?: number; // For bundle purchases
  durationDays?: number; // For unlimited plans
  expiresAt?: string; // For unlimited plans
  amount: number;
  currency: string;
  transactionReference: string;
  purchaseDate: string;
  walletBalanceBefore: number;
  walletBalanceAfter: number;
  totalCreditsNow?: number; // Current total credits after purchase
}

/**
 * Purchase confirmation email sent to patient after successful Claude Summary credit/plan purchase
 */
export const claudeSummaryPurchaseEmail = (data: ClaudeSummaryPurchaseEmailData) => {
  const isUnlimited = data.planType !== 'bundle';

  const planDetails = isUnlimited
    ? `Unlimited AI Health Summaries for ${data.durationDays} days (until ${data.expiresAt})`
    : `${data.credits} AI Health Summary Credits`;

  const planTypeLabel = {
    bundle: 'Credit Bundle',
    unlimited_monthly: 'Monthly Unlimited',
    unlimited_yearly: 'Yearly Unlimited',
  }[data.planType];

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
    .success-card { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 16px; padding: 25px; margin: 20px 0; text-align: center; border: 2px solid #10b981; }
    .success-icon { font-size: 48px; margin-bottom: 10px; }
    .success-card h2 { margin: 0 0 5px; color: #047857; font-size: 20px; }
    .success-card p { margin: 0; color: #059669; font-size: 14px; }
    .plan-badge { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; font-size: 12px; font-weight: 700; padding: 6px 16px; border-radius: 20px; margin-top: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .details-section { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .details-section h3 { margin: 0 0 15px; color: #1f2937; font-size: 16px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; border-bottom: 1px solid #f3f4f6; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #6b7280; }
    .detail-value { color: #1f2937; font-weight: 600; }
    .detail-value.highlight { color: #059669; }
    .detail-value.amount { color: #047857; font-size: 18px; }
    .wallet-summary { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #7dd3fc; }
    .wallet-summary h3 { margin: 0 0 15px; color: #0369a1; font-size: 16px; }
    .wallet-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .wallet-label { color: #0c4a6e; }
    .wallet-value { color: #0369a1; font-weight: 600; }
    .wallet-value.deducted { color: #dc2626; }
    .wallet-value.remaining { color: #059669; font-weight: 700; font-size: 16px; }
    .credits-box { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #22c55e; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
    .credits-box h4 { margin: 0 0 8px; color: #15803d; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
    .credits-count { font-size: 36px; font-weight: 700; color: #059669; margin: 0; }
    .credits-label { font-size: 14px; color: #16a34a; margin: 5px 0 0; }
    .cta-section { text-align: center; margin: 30px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); }
    .footer { background: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { margin: 5px 0; color: #6b7280; font-size: 13px; }
    .footer a { color: #059669; text-decoration: none; }
    .footer .copyright { margin-top: 15px; font-size: 12px; color: #9ca3af; }
    .info-note { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin: 20px 0; font-size: 13px; color: #92400e; line-height: 1.5; }
    .info-note strong { color: #78350f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <img src="https://rapidcapsule.com/RapidCapsule_Logo.png" alt="Rapid Capsule" />
      </div>
      <h1>Purchase Confirmed!</h1>
      <p>AI Health Summary Credits</p>
    </div>

    <div class="content">
      <p style="font-size: 15px; color: #374151; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>
      <p style="font-size: 15px; color: #6b7280; line-height: 1.6;">
        Thank you for your purchase! Your AI Health Summary ${isUnlimited ? 'subscription' : 'credits'} ${isUnlimited ? 'is' : 'are'} now active and ready to use.
      </p>

      <div class="success-card">
        <div class="success-icon">&#10003;</div>
        <h2>Payment Successful</h2>
        <p>${data.purchaseDate}</p>
        <div class="plan-badge">${planTypeLabel}</div>
      </div>

      <div class="details-section">
        <h3>&#128230; Purchase Details</h3>
        <div class="detail-row">
          <span class="detail-label">Plan Name</span>
          <span class="detail-value highlight">${data.planName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Plan Type</span>
          <span class="detail-value">${planTypeLabel}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">What You Get</span>
          <span class="detail-value">${planDetails}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount Paid</span>
          <span class="detail-value amount">${data.currency} ${data.amount.toLocaleString()}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Transaction Reference</span>
          <span class="detail-value" style="font-family: monospace; font-size: 12px;">${data.transactionReference}</span>
        </div>
      </div>

      <div class="wallet-summary">
        <h3>&#128176; Wallet Transaction</h3>
        <div class="wallet-row">
          <span class="wallet-label">Previous Balance</span>
          <span class="wallet-value">${data.currency} ${data.walletBalanceBefore.toLocaleString()}</span>
        </div>
        <div class="wallet-row">
          <span class="wallet-label">Amount Deducted</span>
          <span class="wallet-value deducted">- ${data.currency} ${data.amount.toLocaleString()}</span>
        </div>
        <div class="wallet-row" style="border-top: 1px solid #7dd3fc; margin-top: 10px; padding-top: 10px;">
          <span class="wallet-label">New Balance</span>
          <span class="wallet-value remaining">${data.currency} ${data.walletBalanceAfter.toLocaleString()}</span>
        </div>
      </div>

      ${!isUnlimited && data.totalCreditsNow ? `
      <div class="credits-box">
        <h4>Your Available Credits</h4>
        <p class="credits-count">${data.totalCreditsNow}</p>
        <p class="credits-label">AI Health Summary Credits</p>
      </div>
      ` : ''}

      ${isUnlimited ? `
      <div class="credits-box">
        <h4>Unlimited Access Active</h4>
        <p class="credits-count" style="font-size: 24px;">&#8734;</p>
        <p class="credits-label">Valid until ${data.expiresAt}</p>
      </div>
      ` : ''}

      <div class="info-note">
        <strong>How to use your credits:</strong><br>
        After completing a health checkup, go to your diagnosis report and click "Get AI Health Summary" to generate a personalized AI-powered analysis of your health condition.
      </div>

      <div class="cta-section">
        <a href="https://rapidcapsule.com/checkup-history" class="cta-button">View Your Health Checkups</a>
      </div>
    </div>

    <div class="footer">
      <p><strong>Rapid Capsule</strong></p>
      <p>Your healthcare, simplified.</p>
      <p><a href="https://rapidcapsule.com">Visit Dashboard</a> | <a href="https://rapidcapsule.com/support">Support</a></p>
      <p class="copyright">
        This email was sent because you made a purchase on Rapid Capsule.<br>
        &copy; ${new Date().getFullYear()} Rapid Capsule. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};
