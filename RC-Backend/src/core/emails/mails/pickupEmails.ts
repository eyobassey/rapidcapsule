// ============ PICKUP CENTER EMAIL TEMPLATES ============

export interface PickupReadyEmailData {
  patientName: string;
  prescriptionNumber: string;
  pickupCode: string;
  pickupPharmacyName: string;
  pickupPharmacyAddress: string;
  pickupPharmacyPhone?: string;
  pickupInstructions?: string;
  items: { drug_name: string; quantity: number }[];
  totalAmount: number;
  currency: string;
}

/**
 * Email sent to patient when their order is ready for pickup at the pharmacy
 */
export const orderReadyForPickupEmail = (data: PickupReadyEmailData) => {
  const itemsList = data.items.map(item =>
    `<li style="margin: 8px 0; color: #546e7a;">${item.drug_name} (Qty: ${item.quantity})</li>`
  ).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .pickup-code-card { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center; border: 2px solid #10b981; }
    .pickup-code-card h2 { margin: 0 0 10px; color: #047857; font-size: 18px; }
    .pickup-code { font-size: 42px; font-weight: 700; color: #059669; letter-spacing: 4px; margin: 15px 0; font-family: monospace; }
    .pickup-code-card p { margin: 0; color: #047857; font-size: 14px; }
    .location-card { background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .location-card h3 { margin: 0 0 15px; color: #0369a1; font-size: 18px; }
    .location-card p { margin: 8px 0; color: #0c4a6e; font-size: 15px; line-height: 1.6; }
    .info-card { background: #f8f9fa; border-left: 4px solid #4F46E5; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .info-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .button { display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 20px 0; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #10b981; text-decoration: none; }
    .instructions { background: #fef9c3; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #eab308; }
    .instructions p { margin: 0; color: #854d0e; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Order is Ready!</h1>
      <p>Pick up your prescription today</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        Great news! Your prescription <strong>#${data.prescriptionNumber}</strong> is now ready for pickup. Please show the pickup code below when collecting your order.
      </p>

      <div class="pickup-code-card">
        <h2>YOUR PICKUP CODE</h2>
        <div class="pickup-code">${data.pickupCode}</div>
        <p>Show this code to the pharmacy staff</p>
      </div>

      <div class="location-card">
        <h3>📍 Pickup Location</h3>
        <p><strong>${data.pickupPharmacyName}</strong></p>
        <p>${data.pickupPharmacyAddress}</p>
        ${data.pickupPharmacyPhone ? `<p>📞 ${data.pickupPharmacyPhone}</p>` : ''}
      </div>

      ${data.pickupInstructions ? `
      <div class="instructions">
        <p><strong>📝 Instructions:</strong> ${data.pickupInstructions}</p>
      </div>
      ` : ''}

      <div class="info-card">
        <h3>💊 Order Summary</h3>
        <p><strong>Prescription #:</strong> ${data.prescriptionNumber}</p>
        <p><strong>Items:</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          ${itemsList}
        </ul>
        <p style="font-size: 18px; margin-top: 15px;"><strong>Total: ${data.currency} ${data.totalAmount.toLocaleString()}</strong></p>
      </div>

      <p style="font-size: 14px; color: #78909c; line-height: 1.6; margin-top: 25px;">
        <strong>What to bring:</strong><br>
        • A valid ID<br>
        • Your pickup code (shown above)<br>
        • Payment method if payment is pending
      </p>

      <center>
        <a href="https://rapidcapsule.com/prescriptions" class="button">View Order Details</a>
      </center>
    </div>

    <div class="footer">
      <p><strong>Rapid Capsule</strong></p>
      <p>Your healthcare, simplified.</p>
      <p><a href="https://rapidcapsule.com">Visit Dashboard</a> | <a href="https://rapidcapsule.com/support">Support</a></p>
    </div>
  </div>
</body>
</html>
  `;
};

export interface PickupConfirmedEmailData {
  patientName: string;
  prescriptionNumber: string;
  pickupPharmacyName: string;
  pickupDate: string;
  items: { drug_name: string; quantity: number }[];
  totalAmount: number;
  currency: string;
}

/**
 * Email sent to patient confirming their order has been picked up
 */
export const pickupConfirmedEmail = (data: PickupConfirmedEmailData) => {
  const itemsList = data.items.map(item =>
    `<li style="margin: 8px 0; color: #546e7a;">${item.drug_name} (Qty: ${item.quantity})</li>`
  ).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .success-card { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center; border: 2px solid #10b981; }
    .success-card .check { font-size: 60px; margin-bottom: 15px; }
    .success-card h2 { margin: 0 0 10px; color: #047857; font-size: 22px; }
    .success-card p { margin: 0; color: #059669; font-size: 16px; }
    .info-card { background: #f8f9fa; border-left: 4px solid #4F46E5; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .info-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #4F46E5; text-decoration: none; }
    .button { display: inline-block; background-color: #4F46E5; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 20px 0; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Pickup Confirmed!</h1>
      <p>Thank you for using Rapid Capsule</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        Your prescription has been successfully collected from <strong>${data.pickupPharmacyName}</strong>.
      </p>

      <div class="success-card">
        <div class="check">✅</div>
        <h2>Pickup Complete</h2>
        <p>Collected on ${data.pickupDate}</p>
      </div>

      <div class="info-card">
        <h3>💊 Order Details</h3>
        <p><strong>Prescription #:</strong> ${data.prescriptionNumber}</p>
        <p><strong>Picked up from:</strong> ${data.pickupPharmacyName}</p>
        <p><strong>Items:</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          ${itemsList}
        </ul>
        <p style="font-size: 18px; margin-top: 15px;"><strong>Total Paid: ${data.currency} ${data.totalAmount.toLocaleString()}</strong></p>
      </div>

      <p style="font-size: 16px; color: #546e7a; line-height: 1.6; text-align: center;">
        Thank you for choosing Rapid Capsule! We hope you have a speedy recovery.
      </p>

      <center>
        <a href="https://rapidcapsule.com/prescriptions" class="button">View Prescription History</a>
      </center>

      <p style="color: #78909c; font-size: 14px; line-height: 1.6; margin-top: 30px;">
        <strong>Questions about your medication?</strong><br>
        Contact your healthcare provider or reach out to our support team.
      </p>
    </div>

    <div class="footer">
      <p><strong>Rapid Capsule</strong></p>
      <p>Your healthcare, simplified.</p>
      <p><a href="https://rapidcapsule.com">Visit Dashboard</a> | <a href="https://rapidcapsule.com/support">Support</a></p>
    </div>
  </div>
</body>
</html>
  `;
};

export interface PickupOrderNotificationData {
  pharmacyName: string;
  prescriptionNumber: string;
  patientName: string;
  items: { drug_name: string; quantity: number }[];
  totalAmount: number;
  currency: string;
}

/**
 * Email sent to pharmacy when a new pickup order is assigned to them
 */
export const newPickupOrderForPharmacyEmail = (data: PickupOrderNotificationData) => {
  const itemsList = data.items.map(item =>
    `<li style="margin: 8px 0; color: #546e7a;">${item.drug_name} (Qty: ${item.quantity})</li>`
  ).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .alert-card { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center; border: 2px solid #0ea5e9; }
    .alert-card .icon { font-size: 50px; margin-bottom: 15px; }
    .alert-card h2 { margin: 0 0 10px; color: #0369a1; font-size: 22px; }
    .alert-card p { margin: 0; color: #0c4a6e; font-size: 16px; }
    .info-card { background: #f8f9fa; border-left: 4px solid #0ea5e9; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .info-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #0ea5e9; text-decoration: none; }
    .button { display: inline-block; background-color: #0ea5e9; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 16px; margin: 20px 0; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Pickup Order</h1>
      <p>A patient has selected your pharmacy for pickup</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.pharmacyName}</strong> Team,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        A new prescription order has been assigned to your pharmacy for patient pickup.
      </p>

      <div class="alert-card">
        <div class="icon">📦</div>
        <h2>Prepare Order for Pickup</h2>
        <p>Prescription #${data.prescriptionNumber}</p>
      </div>

      <div class="info-card">
        <h3>📋 Order Details</h3>
        <p><strong>Prescription #:</strong> ${data.prescriptionNumber}</p>
        <p><strong>Patient:</strong> ${data.patientName}</p>
        <p><strong>Items to Prepare:</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          ${itemsList}
        </ul>
        <p style="font-size: 18px; margin-top: 15px;"><strong>Order Total: ${data.currency} ${data.totalAmount.toLocaleString()}</strong></p>
      </div>

      <p style="font-size: 14px; color: #78909c; line-height: 1.6; margin-top: 25px;">
        <strong>Next Steps:</strong><br>
        1. Prepare the items listed above<br>
        2. Mark the order as "Ready for Pickup" in your dashboard<br>
        3. The patient will receive their pickup code<br>
        4. Verify the code when the patient arrives to collect
      </p>

      <center>
        <a href="https://rapidcapsule.com/pharmacy/orders" class="button">View Order in Dashboard</a>
      </center>
    </div>

    <div class="footer">
      <p><strong>Rapid Capsule</strong></p>
      <p>Partner Pharmacy Portal</p>
      <p><a href="https://rapidcapsule.com/pharmacy">Pharmacy Dashboard</a> | <a href="https://rapidcapsule.com/support">Support</a></p>
    </div>
  </div>
</body>
</html>
  `;
};
