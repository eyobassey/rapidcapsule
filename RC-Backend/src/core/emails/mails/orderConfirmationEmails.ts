// ============ ORDER CONFIRMATION EMAIL TEMPLATES ============

export interface OrderConfirmationEmailData {
  patientName: string;
  orderNumber: string;
  orderType: string;
  orderDate: string;
  // Items
  items: {
    drug_name: string;
    generic_name?: string;
    strength?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    requires_prescription: boolean;
    dosage_instructions?: string;
  }[];
  // Pricing
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  currency: string;
  // Payment
  paymentMethod: string;
  walletAmountPaid?: number;
  cardAmountPaid?: number;
  // Delivery
  deliveryMethod: string;
  deliveryAddress?: {
    recipientName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    phone: string;
  };
  estimatedDeliveryDate?: string;
  pickupCode?: string;
  pharmacyName?: string;
  pharmacyAddress?: string;
  pharmacyPhone?: string;
  // Verification
  verificationScore?: number;
  requiresPharmacistReview?: boolean;
  // Drug interactions
  drugInteractions?: {
    drug1Name: string;
    drug2Name: string;
    severity: string;
    description: string;
    recommendation?: string;
  }[];
  hasInteractionWarnings?: boolean;
  // Drug safety
  drugSafetyInfo?: {
    drugName: string;
    keyPoints?: string[];
    commonSideEffects?: string[];
    seriousWarnings?: string[];
  }[];
  // PDF
  orderDetailsUrl: string;
  pdfDownloadUrl?: string;
}

/**
 * Comprehensive order confirmation email sent to patient after successful payment
 */
export const orderConfirmationEmail = (data: OrderConfirmationEmailData) => {
  // Generate items list HTML
  const itemsHtml = data.items.map(item => `
    <tr style="border-bottom: 1px solid #e0e0e0;">
      <td style="padding: 12px 8px;">
        <strong style="color: #1a237e;">${item.drug_name}</strong>
        ${item.generic_name ? `<br><span style="color: #78909c; font-size: 12px;">${item.generic_name}</span>` : ''}
        ${item.strength ? `<br><span style="color: #78909c; font-size: 12px;">${item.strength}</span>` : ''}
        ${item.requires_prescription ? '<br><span style="background: #e3f2fd; color: #1565c0; font-size: 10px; padding: 2px 6px; border-radius: 10px;">Rx</span>' : ''}
      </td>
      <td style="padding: 12px 8px; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px 8px; text-align: right;">${data.currency} ${item.unit_price.toLocaleString()}</td>
      <td style="padding: 12px 8px; text-align: right; font-weight: 600;">${data.currency} ${item.total_price.toLocaleString()}</td>
    </tr>
  `).join('');

  // Generate drug interactions warning HTML
  let interactionsHtml = '';
  if (data.hasInteractionWarnings && data.drugInteractions && data.drugInteractions.length > 0) {
    const getSeverityStyle = (severity: string) => {
      const styles: Record<string, { bg: string; border: string; text: string }> = {
        critical: { bg: '#ffebee', border: '#ef5350', text: '#c62828' },
        severe: { bg: '#ffebee', border: '#ef5350', text: '#c62828' },
        moderate: { bg: '#fff3e0', border: '#ff9800', text: '#e65100' },
        mild: { bg: '#e3f2fd', border: '#42a5f5', text: '#1565c0' },
      };
      return styles[severity.toLowerCase()] || styles.mild;
    };

    const interactionItems = data.drugInteractions.map(interaction => {
      const style = getSeverityStyle(interaction.severity);
      return `
        <div style="background: ${style.bg}; border-left: 4px solid ${style.border}; padding: 15px; margin: 10px 0; border-radius: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="color: ${style.text};">${interaction.drug1Name} + ${interaction.drug2Name}</strong>
            <span style="background: ${style.border}; color: white; padding: 3px 10px; border-radius: 12px; font-size: 11px; text-transform: uppercase;">${interaction.severity}</span>
          </div>
          <p style="margin: 0; color: #333; font-size: 14px;">${interaction.description}</p>
          ${interaction.recommendation ? `<p style="margin: 8px 0 0; color: #546e7a; font-size: 13px;"><strong>Recommendation:</strong> ${interaction.recommendation}</p>` : ''}
        </div>
      `;
    }).join('');

    interactionsHtml = `
      <div style="background: #fff8e1; border: 2px solid #ffc107; border-radius: 12px; padding: 20px; margin: 25px 0;">
        <h3 style="color: #e65100; margin: 0 0 15px; font-size: 18px;">&#9888; Drug Interaction Warnings</h3>
        <p style="color: #795548; font-size: 14px; margin-bottom: 15px;">
          The following potential drug interactions were detected in your order. Please review carefully and consult with your pharmacist or healthcare provider if you have any concerns.
        </p>
        ${interactionItems}
      </div>
    `;
  }

  // Generate drug safety info HTML
  let safetyHtml = '';
  if (data.drugSafetyInfo && data.drugSafetyInfo.length > 0) {
    const safetyItems = data.drugSafetyInfo.map(drug => {
      let content = '';

      if (drug.keyPoints && drug.keyPoints.length > 0) {
        content += `
          <p style="margin: 5px 0; font-size: 13px;"><strong style="color: #1565c0;">Key Points:</strong></p>
          <ul style="margin: 5px 0 10px 20px; padding: 0; color: #333; font-size: 13px;">
            ${drug.keyPoints.slice(0, 3).map(p => `<li style="margin: 3px 0;">${p}</li>`).join('')}
          </ul>
        `;
      }

      if (drug.commonSideEffects && drug.commonSideEffects.length > 0) {
        content += `
          <p style="margin: 5px 0; font-size: 13px;"><strong style="color: #e65100;">Common Side Effects:</strong>
            <span style="color: #546e7a;">${drug.commonSideEffects.slice(0, 5).join(', ')}</span>
          </p>
        `;
      }

      if (drug.seriousWarnings && drug.seriousWarnings.length > 0) {
        content += `
          <div style="background: #fff3e0; padding: 10px; border-radius: 6px; margin-top: 10px;">
            <p style="margin: 0; font-size: 13px;"><strong style="color: #e65100;">&#9888; Important Warnings:</strong></p>
            <ul style="margin: 5px 0 0 20px; padding: 0; color: #795548; font-size: 12px;">
              ${drug.seriousWarnings.slice(0, 2).map(w => `<li style="margin: 3px 0;">${w}</li>`).join('')}
            </ul>
          </div>
        `;
      }

      return content ? `
        <div style="background: #f5f7fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin: 10px 0;">
          <h4 style="color: #1a237e; margin: 0 0 10px; font-size: 15px;">${drug.drugName}</h4>
          ${content}
        </div>
      ` : '';
    }).filter(Boolean).join('');

    if (safetyItems) {
      safetyHtml = `
        <div style="margin: 25px 0;">
          <h3 style="color: #1a73e8; margin: 0 0 15px; font-size: 18px; border-bottom: 2px solid #e0e0e0; padding-bottom: 10px;">
            &#128138; Medication Safety Information
          </h3>
          ${safetyItems}
        </div>
      `;
    }
  }

  // Verification notice HTML
  let verificationHtml = '';
  if (data.requiresPharmacistReview || (data.verificationScore && data.verificationScore < 90)) {
    verificationHtml = `
      <div style="background: #e3f2fd; border: 1px solid #90caf9; border-radius: 12px; padding: 20px; margin: 25px 0;">
        <h3 style="color: #1565c0; margin: 0 0 10px; font-size: 16px;">&#9432; Verification Notice</h3>
        <p style="color: #1976d2; font-size: 14px; margin: 0 0 10px;">
          Your prescription is subject to secondary verification by our licensed Pharmacist before processing.
          ${data.verificationScore ? `<br><strong>Verification Score:</strong> ${data.verificationScore}%` : ''}
        </p>
        <p style="color: #1976d2; font-size: 13px; margin: 0;">
          You or your prescriber may be contacted if any clarification is needed. This is a standard safety measure to ensure your medications are appropriate and safe for you.
        </p>
      </div>
    `;
  }

  // Delivery/Pickup section
  let fulfillmentHtml = '';
  if (data.deliveryMethod === 'DELIVERY' && data.deliveryAddress) {
    fulfillmentHtml = `
      <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #0369a1; margin: 0 0 15px; font-size: 16px;">&#128666; Delivery Information</h3>
        <p style="margin: 5px 0; color: #0c4a6e; font-size: 14px;">
          <strong>${data.deliveryAddress.recipientName}</strong><br>
          ${data.deliveryAddress.addressLine1}<br>
          ${data.deliveryAddress.addressLine2 ? `${data.deliveryAddress.addressLine2}<br>` : ''}
          ${data.deliveryAddress.city}, ${data.deliveryAddress.state}<br>
          Phone: ${data.deliveryAddress.phone}
        </p>
        ${data.estimatedDeliveryDate ? `
          <p style="margin: 15px 0 0; color: #0369a1; font-size: 14px;">
            <strong>Estimated Delivery:</strong> ${data.estimatedDeliveryDate}
          </p>
        ` : ''}
      </div>
    `;
  } else if (data.deliveryMethod === 'PICKUP') {
    fulfillmentHtml = `
      <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #047857; margin: 0 0 15px; font-size: 16px;">&#127978; Pickup Information</h3>
        <p style="margin: 5px 0; color: #065f46; font-size: 14px;">
          <strong>${data.pharmacyName}</strong><br>
          ${data.pharmacyAddress || ''}<br>
          ${data.pharmacyPhone ? `Phone: ${data.pharmacyPhone}` : ''}
        </p>
        ${data.pickupCode ? `
          <div style="background: #d1fae5; padding: 15px; border-radius: 8px; margin-top: 15px; text-align: center;">
            <p style="margin: 0 0 5px; color: #047857; font-size: 12px; text-transform: uppercase;">Your Pickup Code</p>
            <p style="margin: 0; color: #059669; font-size: 32px; font-weight: 700; letter-spacing: 4px; font-family: monospace;">${data.pickupCode}</p>
            <p style="margin: 10px 0 0; color: #065f46; font-size: 12px;">Show this code when collecting your order</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  // Payment summary
  const paymentDetails: string[] = [];
  if (data.walletAmountPaid && data.walletAmountPaid > 0) {
    paymentDetails.push(`Wallet: ${data.currency} ${data.walletAmountPaid.toLocaleString()}`);
  }
  if (data.cardAmountPaid && data.cardAmountPaid > 0) {
    paymentDetails.push(`Card: ${data.currency} ${data.cardAmountPaid.toLocaleString()}`);
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 650px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 35px 30px; }
    .success-card { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center; border: 2px solid #4caf50; }
    .success-card .check { font-size: 50px; margin-bottom: 10px; }
    .success-card h2 { margin: 0 0 5px; color: #2e7d32; font-size: 22px; }
    .success-card p { margin: 0; color: #388e3c; font-size: 14px; }
    .order-number { font-size: 20px; font-weight: 700; color: #1b5e20; margin-top: 10px; font-family: monospace; letter-spacing: 1px; }
    .info-section { background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .info-section h3 { margin: 0 0 15px; color: #2c3e50; font-size: 16px; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .info-row .label { color: #78909c; }
    .info-row .value { color: #2c3e50; font-weight: 500; }
    .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px; }
    .items-table th { background: #4caf50; color: white; padding: 12px 8px; text-align: left; font-size: 12px; text-transform: uppercase; }
    .items-table th:first-child { border-radius: 8px 0 0 0; }
    .items-table th:last-child { border-radius: 0 8px 0 0; }
    .totals-box { background: #f5f7fa; padding: 15px; border-radius: 8px; margin-top: 15px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #546e7a; }
    .totals-row.total { border-top: 2px solid #4caf50; margin-top: 10px; padding-top: 12px; font-size: 18px; font-weight: 700; color: #2e7d32; }
    .payment-confirmed { background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 15px; text-align: center; }
    .payment-confirmed h4 { margin: 0 0 8px; color: #2e7d32; font-size: 16px; }
    .payment-confirmed p { margin: 0; color: #388e3c; font-size: 14px; }
    .button { display: inline-block; background-color: #4caf50; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 20px 0; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4); }
    .button-secondary { background-color: #1a73e8; box-shadow: 0 4px 12px rgba(26, 115, 232, 0.4); }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #4caf50; text-decoration: none; }
    .disclaimer { background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 12px; color: #2e7d32; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmed!</h1>
      <p>Thank you for your order</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        Your order has been successfully placed and payment has been confirmed. We're processing your order and will update you on its progress.
      </p>

      <div class="success-card">
        <div class="check">&#10003;</div>
        <h2>Order Placed Successfully</h2>
        <p>Order Date: ${data.orderDate}</p>
        <div class="order-number">${data.orderNumber}</div>
      </div>

      ${verificationHtml}

      ${interactionsHtml}

      ${fulfillmentHtml}

      <div class="info-section">
        <h3>&#128230; Order Summary</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th style="text-align: center; width: 60px;">Qty</th>
              <th style="text-align: right; width: 90px;">Unit Price</th>
              <th style="text-align: right; width: 100px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals-box">
          <div class="totals-row">
            <span class="label">Subtotal</span>
            <span class="value">${data.currency} ${data.subtotal.toLocaleString()}</span>
          </div>
          ${data.discountAmount > 0 ? `
            <div class="totals-row">
              <span class="label">Discount</span>
              <span class="value" style="color: #4caf50;">-${data.currency} ${data.discountAmount.toLocaleString()}</span>
            </div>
          ` : ''}
          ${data.deliveryFee > 0 ? `
            <div class="totals-row">
              <span class="label">Delivery Fee</span>
              <span class="value">${data.currency} ${data.deliveryFee.toLocaleString()}</span>
            </div>
          ` : ''}
          <div class="totals-row total">
            <span>Total Paid</span>
            <span>${data.currency} ${data.totalAmount.toLocaleString()}</span>
          </div>
        </div>

        <div class="payment-confirmed">
          <h4>&#10003; Payment Confirmed</h4>
          <p>
            <strong>Method:</strong> ${data.paymentMethod.replace('_', ' + ').toUpperCase()}
            ${paymentDetails.length > 0 ? `<br>${paymentDetails.join(' | ')}` : ''}
          </p>
        </div>
      </div>

      ${safetyHtml}

      <center>
        <a href="${data.orderDetailsUrl}" class="button">Track Your Order</a>
        ${data.pdfDownloadUrl ? `<br><a href="${data.pdfDownloadUrl}" class="button button-secondary" style="margin-top: 10px;">Download Order PDF</a>` : ''}
      </center>

      <div class="disclaimer">
        <strong>Important:</strong> Take medications as prescribed. Read all instructions carefully.
        Store medications properly and keep out of reach of children.
        If you experience any adverse effects, discontinue use and consult your healthcare provider immediately.
        ${data.requiresPharmacistReview ? '<br><br><strong>Note:</strong> Your prescription may undergo additional verification before dispensing. You will be notified if any clarification is needed.' : ''}
      </div>
    </div>

    <div class="footer">
      <p><strong>Rapid Capsules</strong></p>
      <p>Your healthcare, delivered.</p>
      <p><a href="https://rapidcapsule.com">Visit Dashboard</a> | <a href="https://rapidcapsule.com/support">Support</a></p>
      <p style="margin-top: 15px; font-size: 12px; color: #9e9e9e;">
        This email was sent to you because you placed an order on Rapid Capsules.<br>
        If you did not place this order, please contact support immediately.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};
