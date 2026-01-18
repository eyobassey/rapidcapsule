/**
 * Prescription Email Templates
 * Used to notify patients about their prescriptions
 */

export interface PrescriptionItem {
  drug_name: string;
  generic_name?: string;
  strength?: string;
  quantity: number;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  unit_price: number;
  total_price: number;
}

export interface PrescriptionEmailData {
  patientName: string;
  prescriptionNumber: string;
  specialistName: string;
  specialistTitle?: string;
  items: PrescriptionItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  currency: string;
  deliveryAddress?: {
    recipient_name?: string;
    street: string;
    city: string;
    state: string;
    phone: string;
  };
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
}

export interface ShipmentEmailData {
  patientName: string;
  prescriptionNumber: string;
  trackingNumber?: string;
  courierName?: string;
  estimatedDelivery?: string;
  shippingMethod: string;
  deliveryAddress: {
    recipient_name?: string;
    street: string;
    city: string;
    state: string;
    phone: string;
  };
}

export interface ReadyForPickupEmailData {
  patientName: string;
  prescriptionNumber: string;
  pharmacyName: string;
  pharmacyAddress?: string;
  pharmacyPhone?: string;
  pickupHours?: string;
}

/**
 * Email sent when a new prescription is created
 */
export const prescriptionCreatedEmail = (data: PrescriptionEmailData) => {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
        <strong style="color: #2c3e50;">${item.drug_name}</strong>
        ${item.generic_name ? `<br><span style="color: #78909c; font-size: 13px;">${item.generic_name}</span>` : ''}
        ${item.strength ? `<br><span style="color: #78909c; font-size: 13px;">${item.strength}</span>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
        <span style="color: #2c3e50;">${item.dosage}</span><br>
        <span style="color: #78909c; font-size: 13px;">${item.frequency} for ${item.duration}</span>
        ${item.instructions ? `<br><span style="color: #546e7a; font-size: 12px; font-style: italic;">${item.instructions}</span>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">${data.currency} ${item.total_price.toLocaleString()}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .info-card { background: #f8f9fa; border-left: 4px solid #1a73e8; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .info-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .medications-table { width: 100%; border-collapse: collapse; margin: 25px 0; }
    .medications-table th { background: #f8f9fa; padding: 12px; text-align: left; color: #2c3e50; font-weight: 600; border-bottom: 2px solid #e0e0e0; }
    .totals { margin: 25px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; color: #546e7a; }
    .totals-row.total { border-top: 2px solid #e0e0e0; margin-top: 10px; padding-top: 15px; font-weight: 600; color: #2c3e50; font-size: 18px; }
    .delivery-card { background: #e3f2fd; border-radius: 8px; padding: 20px; margin: 25px 0; }
    .delivery-card h3 { margin: 0 0 15px; color: #1565c0; font-size: 16px; }
    .button { display: inline-block; background-color: #1a73e8; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #1a73e8; text-decoration: none; }
    .divider { height: 1px; background: #e0e0e0; margin: 30px 0; }
    .badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💊 New Prescription</h1>
      <p>Your prescription has been created</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        A new prescription has been created for you by <strong>${data.specialistName}</strong>${data.specialistTitle ? ` (${data.specialistTitle})` : ''}.
      </p>

      <div class="info-card">
        <h3>📋 Prescription Details</h3>
        <p><strong>Prescription #:</strong> ${data.prescriptionNumber}</p>
        <p><strong>Date:</strong> ${data.createdAt}</p>
        <p><strong>Prescribed by:</strong> ${data.specialistName}</p>
        ${data.paymentMethod ? `<p><strong>Payment:</strong> <span class="badge">${data.paymentMethod === 'SPECIALIST_WALLET' ? 'Paid by Specialist' : data.paymentMethod}</span></p>` : ''}
      </div>

      <h3 style="color: #2c3e50; margin: 30px 0 15px;">Prescribed Medications</h3>
      <table class="medications-table">
        <thead>
          <tr>
            <th>Medication</th>
            <th style="text-align: center;">Qty</th>
            <th>Dosage</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>${data.currency} ${data.subtotal.toLocaleString()}</span>
        </div>
        <div class="totals-row">
          <span>Delivery Fee</span>
          <span>${data.currency} ${data.deliveryFee.toLocaleString()}</span>
        </div>
        <div class="totals-row total">
          <span>Total</span>
          <span>${data.currency} ${data.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      ${data.deliveryAddress ? `
        <div class="delivery-card">
          <h3>🚚 Delivery Address</h3>
          <p style="margin: 0; color: #1565c0;">
            ${data.deliveryAddress.recipient_name || data.patientName}<br>
            ${data.deliveryAddress.street}<br>
            ${data.deliveryAddress.city}, ${data.deliveryAddress.state}<br>
            Phone: ${data.deliveryAddress.phone}
          </p>
        </div>
      ` : ''}

      ${data.notes ? `
        <div class="info-card" style="background: #fff9e6; border-left-color: #ffc107;">
          <h3>📝 Notes from Your Doctor</h3>
          <p style="white-space: pre-wrap;">${data.notes}</p>
        </div>
      ` : ''}

      <div class="divider"></div>

      <center>
        <a href="https://rapidcapsule.com/app/patient/prescriptions" class="button">View Prescription</a>
      </center>

      <p style="color: #78909c; font-size: 14px; line-height: 1.6; margin-top: 30px;">
        <strong>Important:</strong> Please follow the dosage instructions carefully. If you experience any side effects or have questions about your medication, contact your healthcare provider immediately.
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

/**
 * Email sent when prescription is shipped
 */
export const prescriptionShippedEmail = (data: ShipmentEmailData) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .tracking-card { background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
    .tracking-card h3 { margin: 0 0 15px; color: #e65100; font-size: 18px; }
    .tracking-number { font-size: 28px; font-weight: 700; color: #e65100; letter-spacing: 2px; margin: 10px 0; }
    .info-card { background: #f8f9fa; border-left: 4px solid #ff9800; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .info-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .delivery-card { background: #e3f2fd; border-radius: 8px; padding: 20px; margin: 25px 0; }
    .delivery-card h3 { margin: 0 0 15px; color: #1565c0; font-size: 16px; }
    .button { display: inline-block; background-color: #ff9800; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #ff9800; text-decoration: none; }
    .timeline { margin: 30px 0; }
    .timeline-item { display: flex; align-items: flex-start; margin: 15px 0; }
    .timeline-dot { width: 12px; height: 12px; border-radius: 50%; background: #ff9800; margin-right: 15px; margin-top: 4px; }
    .timeline-dot.completed { background: #4caf50; }
    .timeline-dot.pending { background: #e0e0e0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Your Order is On Its Way!</h1>
      <p>Your prescription has been shipped</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        Great news! Your prescription <strong>#${data.prescriptionNumber}</strong> has been shipped and is on its way to you.
      </p>

      ${data.trackingNumber ? `
        <div class="tracking-card">
          <h3>📍 Tracking Number</h3>
          <div class="tracking-number">${data.trackingNumber}</div>
          ${data.courierName ? `<p style="margin: 10px 0 0; color: #e65100;">via ${data.courierName}</p>` : ''}
        </div>
      ` : ''}

      <div class="info-card">
        <h3>🚚 Shipping Details</h3>
        <p><strong>Prescription #:</strong> ${data.prescriptionNumber}</p>
        <p><strong>Shipping Method:</strong> ${data.shippingMethod}</p>
        ${data.courierName ? `<p><strong>Courier:</strong> ${data.courierName}</p>` : ''}
        ${data.estimatedDelivery ? `<p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>` : ''}
      </div>

      <div class="delivery-card">
        <h3>📍 Delivery Address</h3>
        <p style="margin: 0; color: #1565c0;">
          ${data.deliveryAddress.recipient_name || data.patientName}<br>
          ${data.deliveryAddress.street}<br>
          ${data.deliveryAddress.city}, ${data.deliveryAddress.state}<br>
          Phone: ${data.deliveryAddress.phone}
        </p>
      </div>

      <div class="timeline">
        <div class="timeline-item">
          <div class="timeline-dot completed"></div>
          <div>
            <strong style="color: #2c3e50;">Order Placed</strong>
            <p style="margin: 5px 0 0; color: #78909c; font-size: 14px;">Your prescription was created</p>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot completed"></div>
          <div>
            <strong style="color: #2c3e50;">Dispensed</strong>
            <p style="margin: 5px 0 0; color: #78909c; font-size: 14px;">Your medications were prepared</p>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot completed"></div>
          <div>
            <strong style="color: #ff9800;">Shipped</strong>
            <p style="margin: 5px 0 0; color: #78909c; font-size: 14px;">Your order is on its way</p>
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-dot pending"></div>
          <div>
            <strong style="color: #78909c;">Delivered</strong>
            <p style="margin: 5px 0 0; color: #78909c; font-size: 14px;">Waiting for delivery</p>
          </div>
        </div>
      </div>

      <center>
        <a href="https://rapidcapsule.com/app/patient/prescriptions" class="button">Track Your Order</a>
      </center>
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

/**
 * Email sent when prescription is ready for pickup
 */
export const prescriptionReadyForPickupEmail = (data: ReadyForPickupEmailData) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .ready-card { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center; }
    .ready-card h2 { margin: 0 0 10px; color: #2e7d32; font-size: 24px; }
    .ready-card p { margin: 0; color: #388e3c; font-size: 16px; }
    .info-card { background: #f8f9fa; border-left: 4px solid #4caf50; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .info-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .pharmacy-card { background: #fff3e0; border-radius: 8px; padding: 20px; margin: 25px 0; }
    .pharmacy-card h3 { margin: 0 0 15px; color: #e65100; font-size: 16px; }
    .button { display: inline-block; background-color: #4caf50; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #4caf50; text-decoration: none; }
    .checklist { margin: 25px 0; padding: 20px; background: #fafafa; border-radius: 8px; }
    .checklist-item { display: flex; align-items: center; margin: 10px 0; color: #546e7a; }
    .checklist-item::before { content: "✓"; color: #4caf50; font-weight: bold; margin-right: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Ready for Pickup!</h1>
      <p>Your prescription is waiting for you</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>

      <div class="ready-card">
        <h2>🎉 Your Prescription is Ready!</h2>
        <p>Prescription #${data.prescriptionNumber}</p>
      </div>

      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        Your medications have been prepared and are ready for pickup at the pharmacy.
      </p>

      <div class="pharmacy-card">
        <h3>🏪 Pickup Location</h3>
        <p style="margin: 0; color: #e65100;">
          <strong>${data.pharmacyName}</strong><br>
          ${data.pharmacyAddress ? `${data.pharmacyAddress}<br>` : ''}
          ${data.pharmacyPhone ? `Phone: ${data.pharmacyPhone}<br>` : ''}
          ${data.pickupHours ? `Hours: ${data.pickupHours}` : ''}
        </p>
      </div>

      <div class="checklist">
        <h3 style="margin: 0 0 15px; color: #2c3e50;">What to Bring</h3>
        <div class="checklist-item">Valid ID (Driver's License, National ID, or Passport)</div>
        <div class="checklist-item">Prescription number: <strong>${data.prescriptionNumber}</strong></div>
      </div>

      <div class="info-card">
        <h3>📋 Important Information</h3>
        <p>Please pick up your prescription within <strong>7 days</strong>. After this period, uncollected prescriptions may be returned to stock.</p>
      </div>

      <center>
        <a href="https://rapidcapsule.com/app/patient/prescriptions" class="button">View Prescription Details</a>
      </center>
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

/**
 * Email sent when prescription is cancelled
 */
export interface CancelledEmailData {
  patientName: string;
  prescriptionNumber: string;
  specialistName?: string;
  items: PrescriptionItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  currency: string;
  cancellationReason?: string;
  refundAmount?: number;
  refundMethod?: string;
  cancelledAt?: string;
}

/**
 * Email sent when prescription is cancelled
 */
export const prescriptionCancelledEmail = (data: CancelledEmailData) => {
  const showRefund = data.refundAmount && data.refundAmount > 0;

  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
        <strong style="color: #2c3e50;">${item.drug_name}</strong>
        ${item.generic_name ? `<br><span style="color: #78909c; font-size: 13px;">${item.generic_name}</span>` : ''}
        ${item.strength ? `<br><span style="color: #78909c; font-size: 13px;">${item.strength}</span>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
        <span style="color: #2c3e50;">${item.dosage}</span><br>
        <span style="color: #78909c; font-size: 13px;">${item.frequency} for ${item.duration}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">${data.currency} ${item.total_price.toLocaleString()}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #78909c 0%, #546e7a 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .cancelled-card { background: #fff3e0; border: 2px solid #ff9800; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
    .cancelled-card h2 { margin: 0 0 10px; color: #e65100; font-size: 20px; }
    .cancelled-card p { margin: 0; color: #f57c00; font-size: 16px; }
    .info-card { background: #f8f9fa; border-left: 4px solid #78909c; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .info-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .refund-card { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .refund-card h3 { margin: 0 0 10px; color: #2e7d32; font-size: 18px; }
    .refund-card p { margin: 8px 0; color: #388e3c; font-size: 15px; line-height: 1.6; }
    .refund-amount { font-size: 24px; font-weight: 700; color: #2e7d32; margin: 10px 0; }
    .button { display: inline-block; background-color: #1a73e8; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #1a73e8; text-decoration: none; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f5f5f5; padding: 12px; text-align: left; font-weight: 600; color: #2c3e50; border-bottom: 2px solid #e0e0e0; }
    .total-row td { border-top: 2px solid #e0e0e0; font-weight: 600; padding: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Prescription Cancelled</h1>
      <p>Your prescription has been cancelled</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>

      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        We're writing to confirm that your prescription has been cancelled${data.cancelledAt ? ` on ${data.cancelledAt}` : ''}.
      </p>

      <div class="cancelled-card">
        <h2>Prescription #${data.prescriptionNumber}</h2>
        <p>CANCELLED</p>
      </div>

      ${data.specialistName ? `
        <p style="font-size: 14px; color: #78909c;">
          <strong>Prescribed by:</strong> ${data.specialistName}
        </p>
      ` : ''}

      ${data.cancellationReason ? `
        <div class="info-card">
          <h3>Cancellation Reason</h3>
          <p>${data.cancellationReason}</p>
        </div>
      ` : ''}

      <h3 style="color: #2c3e50; margin: 30px 0 15px;">Cancelled Items</h3>
      <table>
        <thead>
          <tr>
            <th>Medication</th>
            <th style="text-align: center;">Qty</th>
            <th>Dosage</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="3" style="text-align: right;">Subtotal:</td>
            <td style="text-align: right;">${data.currency} ${data.subtotal.toLocaleString()}</td>
          </tr>
          ${data.deliveryFee > 0 ? `
            <tr>
              <td colspan="3" style="text-align: right; padding: 8px 12px; color: #78909c;">Delivery Fee:</td>
              <td style="text-align: right; padding: 8px 12px; color: #78909c;">${data.currency} ${data.deliveryFee.toLocaleString()}</td>
            </tr>
          ` : ''}
          <tr class="total-row">
            <td colspan="3" style="text-align: right; font-size: 18px; color: #2c3e50;">Total:</td>
            <td style="text-align: right; font-size: 18px; color: #2c3e50;">${data.currency} ${data.totalAmount.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>

      ${showRefund ? `
        <div class="refund-card">
          <h3>Refund Information</h3>
          <p>A refund has been processed for this prescription:</p>
          <div class="refund-amount">${data.currency} ${(data.refundAmount || 0).toLocaleString()}</div>
          <p><strong>Refund Method:</strong> ${data.refundMethod || 'Original payment method'}</p>
          <p style="font-size: 13px; color: #546e7a;">Refunds typically appear in your account within 3-5 business days.</p>
        </div>
      ` : ''}

      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        If you have any questions about this cancellation or need to place a new order, please don't hesitate to contact us or speak with your healthcare provider.
      </p>

      <center>
        <a href="https://rapidcapsule.com/app/patient/prescriptions" class="button">View Prescriptions</a>
      </center>
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

export const prescriptionDeliveredEmail = (patientName: string, prescriptionNumber: string) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .success-card { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center; }
    .success-card h2 { margin: 0 0 10px; color: #2e7d32; font-size: 24px; }
    .info-card { background: #f8f9fa; border-left: 4px solid #4caf50; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .info-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .button { display: inline-block; background-color: #4caf50; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #4caf50; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Delivered!</h1>
      <p>Your prescription has arrived</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${patientName}</strong>,
      </p>

      <div class="success-card">
        <h2>✅ Delivery Complete</h2>
        <p style="margin: 10px 0 0; color: #388e3c;">Prescription #${prescriptionNumber}</p>
      </div>

      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        Your prescription has been successfully delivered. We hope you're feeling better soon!
      </p>

      <div class="info-card">
        <h3>📋 Medication Reminders</h3>
        <p>• Take your medications exactly as prescribed</p>
        <p>• Store medications properly according to the instructions</p>
        <p>• Complete your full course of treatment</p>
        <p>• Contact your doctor if you experience any side effects</p>
      </div>

      <center>
        <a href="https://rapidcapsule.com/app/patient/prescriptions" class="button">View Prescription</a>
      </center>

      <p style="color: #78909c; font-size: 14px; line-height: 1.6; margin-top: 30px; text-align: center;">
        Need to reorder? You can request a refill through your dashboard.
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

/**
 * Email data for wallet charged notification
 */
export interface WalletChargedEmailData {
  patientName: string;
  prescriptionNumber: string;
  specialistName: string;
  specialistTitle?: string;
  items: PrescriptionItem[];
  walletAmountCharged: number;
  remainingAmount: number;
  remainingPaymentMethod?: 'online' | 'cash';
  totalAmount: number;
  currency: string;
  deliveryAddress?: {
    recipient_name?: string;
    street: string;
    city: string;
    state: string;
    phone: string;
  };
  notes?: string;
  chargedAt: string;
  paymentUrl?: string; // For partial payments requiring online payment
}

/**
 * Email sent when patient's wallet is charged for a prescription
 */
// ============ PATIENT SELF-SERVICE EMAIL TEMPLATES ============

/**
 * Email data for prescription sent to patient
 */
export interface PrescriptionSentToPatientData {
  patientName: string;
  prescriptionNumber: string;
  specialistName: string;
  items: PrescriptionItem[];
  totalAmount: number;
  currency: string;
  expiresAt: string;
  pdfUrl?: string;
  dashboardUrl: string;
}

/**
 * Email sent to patient when specialist sends prescription for self-payment
 */
export const prescriptionSentToPatientEmail = (data: PrescriptionSentToPatientData) => {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
        <strong style="color: #2c3e50;">${item.drug_name}</strong>
        ${item.generic_name ? `<br><span style="color: #78909c; font-size: 13px;">${item.generic_name}</span>` : ''}
        ${item.strength ? `<br><span style="color: #78909c; font-size: 13px;">${item.strength}</span>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
        <span style="color: #2c3e50;">${item.dosage}</span><br>
        <span style="color: #78909c; font-size: 13px;">${item.frequency} for ${item.duration}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">${data.currency} ${item.total_price.toLocaleString()}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .urgent-card { background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; border: 2px solid #ff9800; }
    .urgent-card h3 { margin: 0 0 10px; color: #e65100; font-size: 18px; }
    .urgent-card p { margin: 0; color: #f57c00; font-size: 14px; }
    .info-card { background: #f8f9fa; border-left: 4px solid #1a73e8; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .info-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .medications-table { width: 100%; border-collapse: collapse; margin: 25px 0; }
    .medications-table th { background: #f8f9fa; padding: 12px; text-align: left; color: #2c3e50; font-weight: 600; border-bottom: 2px solid #e0e0e0; }
    .total-card { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center; }
    .total-amount { font-size: 32px; font-weight: 700; color: #1565c0; }
    .button-group { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background-color: #ff9800; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 10px; }
    .button-secondary { display: inline-block; background-color: #1a73e8; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 10px; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #1a73e8; text-decoration: none; }
    .divider { height: 1px; background: #e0e0e0; margin: 30px 0; }
    .steps { margin: 25px 0; }
    .step { display: flex; align-items: flex-start; margin: 15px 0; }
    .step-number { background: #1a73e8; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 15px; flex-shrink: 0; }
    .step-content h4 { margin: 0 0 5px; color: #2c3e50; font-size: 15px; }
    .step-content p { margin: 0; color: #78909c; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Prescription</h1>
      <p>Action required - Review and complete payment</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        <strong>${data.specialistName}</strong> has sent you a new prescription. Please review the details below and complete your payment to process your order.
      </p>

      <div class="urgent-card">
        <h3>Action Required</h3>
        <p>This prescription expires on <strong>${data.expiresAt}</strong></p>
        <p style="margin-top: 10px;">Please accept and pay before the expiry date to avoid cancellation.</p>
      </div>

      <div class="info-card">
        <h3>Prescription Details</h3>
        <p><strong>Prescription #:</strong> ${data.prescriptionNumber}</p>
        <p><strong>Prescribed by:</strong> ${data.specialistName}</p>
      </div>

      <h3 style="color: #2c3e50; margin: 30px 0 15px;">Prescribed Medications</h3>
      <table class="medications-table">
        <thead>
          <tr>
            <th>Medication</th>
            <th style="text-align: center;">Qty</th>
            <th>Dosage</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="total-card">
        <p style="margin: 0 0 5px; color: #546e7a;">Total Amount</p>
        <div class="total-amount">${data.currency} ${data.totalAmount.toLocaleString()}</div>
      </div>

      <div class="steps">
        <h3 style="color: #2c3e50; margin-bottom: 15px;">What to do next:</h3>
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>Review Prescription</h4>
            <p>Check the medications and dosages are correct</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>Accept or Decline</h4>
            <p>Accept all items, accept some items, or decline if needed</p>
          </div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>Complete Payment</h4>
            <p>Pay using your wallet or card to process your order</p>
          </div>
        </div>
      </div>

      <div class="button-group">
        <a href="${data.dashboardUrl}" class="button">Review & Accept</a>
        ${data.pdfUrl ? `<a href="${data.pdfUrl}" class="button-secondary">Download PDF</a>` : ''}
      </div>

      <div class="divider"></div>

      <p style="color: #78909c; font-size: 14px; line-height: 1.6;">
        <strong>Important:</strong> If you have questions about this prescription or need to make changes, please contact your healthcare provider before accepting.
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

/**
 * Email data for patient accepted prescription
 */
export interface PrescriptionAcceptedByPatientData {
  specialistName: string;
  patientName: string;
  prescriptionNumber: string;
  isPartial: boolean;
  acceptedCount: number;
  totalCount: number;
  totalAmount: number;
  currency: string;
}

/**
 * Email sent to specialist when patient accepts prescription
 */
export const prescriptionAcceptedByPatientEmail = (data: PrescriptionAcceptedByPatientData) => {
  const headerColor = data.isPartial ? '#ff9800' : '#4caf50';
  const headerGradient = data.isPartial
    ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
    : 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: ${headerGradient}; padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .status-card { background: ${data.isPartial ? '#fff3e0' : '#e8f5e9'}; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
    .status-card h2 { margin: 0 0 10px; color: ${data.isPartial ? '#e65100' : '#2e7d32'}; font-size: 24px; }
    .status-card p { margin: 0; color: ${data.isPartial ? '#f57c00' : '#388e3c'}; font-size: 16px; }
    .info-card { background: #f8f9fa; border-left: 4px solid #1a73e8; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .info-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .button { display: inline-block; background-color: #1a73e8; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #1a73e8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${data.isPartial ? 'Partial Acceptance' : 'Prescription Accepted'}</h1>
      <p>Your patient has responded to the prescription</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.specialistName}</strong>,
      </p>

      <div class="status-card">
        <h2>${data.isPartial ? 'Partially Accepted' : 'Accepted'}</h2>
        <p>Prescription #${data.prescriptionNumber}</p>
        ${data.isPartial ? `<p style="margin-top: 10px;">${data.acceptedCount} of ${data.totalCount} items accepted</p>` : ''}
      </div>

      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        <strong>${data.patientName}</strong> has ${data.isPartial ? 'partially ' : ''}accepted the prescription. ${data.isPartial ? 'Some items were declined by the patient.' : 'All items were accepted.'}
      </p>

      <div class="info-card">
        <h3>Prescription Details</h3>
        <p><strong>Prescription #:</strong> ${data.prescriptionNumber}</p>
        <p><strong>Patient:</strong> ${data.patientName}</p>
        <p><strong>Items Accepted:</strong> ${data.acceptedCount} / ${data.totalCount}</p>
        <p><strong>Total Amount:</strong> ${data.currency} ${data.totalAmount.toLocaleString()}</p>
        <p><strong>Status:</strong> Awaiting Patient Payment</p>
      </div>

      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        The patient will now proceed to make payment. You will be notified once payment is complete.
      </p>

      <center>
        <a href="https://rapidcapsule.com/app/specialist/pharmacy/prescriptions" class="button">View Prescription</a>
      </center>
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

/**
 * Email data for patient declined prescription
 */
export interface PrescriptionDeclinedByPatientData {
  specialistName: string;
  patientName: string;
  prescriptionNumber: string;
  declineReason: string;
  items: Array<{ drug_name: string; quantity: number }>;
}

/**
 * Email sent to specialist when patient declines prescription
 */
export const prescriptionDeclinedByPatientEmail = (data: PrescriptionDeclinedByPatientData) => {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${item.drug_name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${item.quantity}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #78909c 0%, #546e7a 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .declined-card { background: #ffebee; border: 2px solid #ef5350; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
    .declined-card h2 { margin: 0 0 10px; color: #c62828; font-size: 24px; }
    .declined-card p { margin: 0; color: #e53935; font-size: 16px; }
    .reason-card { background: #fff3e0; border-left: 4px solid #ff9800; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .reason-card h3 { margin: 0 0 10px; color: #e65100; font-size: 16px; }
    .reason-card p { margin: 0; color: #f57c00; font-size: 15px; line-height: 1.6; }
    .info-card { background: #f8f9fa; border-left: 4px solid #78909c; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .info-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background: #f5f5f5; padding: 10px; text-align: left; font-weight: 600; color: #2c3e50; }
    .button { display: inline-block; background-color: #1a73e8; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #1a73e8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Prescription Declined</h1>
      <p>Your patient has declined the prescription</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.specialistName}</strong>,
      </p>

      <div class="declined-card">
        <h2>Declined</h2>
        <p>Prescription #${data.prescriptionNumber}</p>
      </div>

      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        <strong>${data.patientName}</strong> has declined the prescription you sent. The stock reservations have been released automatically.
      </p>

      <div class="reason-card">
        <h3>Reason for Decline</h3>
        <p>${data.declineReason}</p>
      </div>

      <div class="info-card">
        <h3>Declined Items</h3>
        <table>
          <thead>
            <tr>
              <th>Medication</th>
              <th style="text-align: center;">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        You may want to follow up with the patient to understand their concerns or create a new prescription if needed.
      </p>

      <center>
        <a href="https://rapidcapsule.com/app/specialist/pharmacy/prescriptions" class="button">View Prescriptions</a>
      </center>
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

/**
 * Email data for patient paid prescription
 */
export interface PrescriptionPaidByPatientData {
  specialistName: string;
  patientName: string;
  prescriptionNumber: string;
  amountPaid: number;
  paymentMethod: 'wallet' | 'card';
  currency: string;
  paidAt: string;
}

/**
 * Email sent to specialist when patient pays for prescription
 */
export const prescriptionPaidByPatientEmail = (data: PrescriptionPaidByPatientData) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .success-card { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center; }
    .success-card h2 { margin: 0 0 10px; color: #2e7d32; font-size: 24px; }
    .success-card .amount { font-size: 36px; font-weight: 700; color: #2e7d32; margin: 15px 0; }
    .success-card p { margin: 0; color: #388e3c; font-size: 14px; }
    .info-card { background: #f8f9fa; border-left: 4px solid #4caf50; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .info-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; }
    .button { display: inline-block; background-color: #4caf50; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #4caf50; text-decoration: none; }
    .next-steps { margin: 25px 0; padding: 20px; background: #e3f2fd; border-radius: 8px; }
    .next-steps h3 { margin: 0 0 15px; color: #1565c0; font-size: 16px; }
    .next-steps ul { margin: 0; padding-left: 20px; color: #1976d2; }
    .next-steps li { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Received</h1>
      <p>Your prescription has been paid by the patient</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.specialistName}</strong>,
      </p>

      <div class="success-card">
        <h2>Payment Complete</h2>
        <div class="amount">${data.currency} ${data.amountPaid.toLocaleString()}</div>
        <p>Prescription #${data.prescriptionNumber}</p>
      </div>

      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        Great news! <strong>${data.patientName}</strong> has successfully paid for their prescription.
      </p>

      <div class="info-card">
        <h3>Payment Details</h3>
        <p><strong>Prescription #:</strong> ${data.prescriptionNumber}</p>
        <p><strong>Patient:</strong> ${data.patientName}</p>
        <p><strong>Amount Paid:</strong> ${data.currency} ${data.amountPaid.toLocaleString()}</p>
        <p><strong>Payment Method:</strong> ${data.paymentMethod === 'wallet' ? 'Patient Wallet' : 'Credit/Debit Card'}</p>
        <p><strong>Paid At:</strong> ${data.paidAt}</p>
        <p><strong>Status:</strong> <span class="badge">Paid</span></p>
      </div>

      <div class="next-steps">
        <h3>Next Steps</h3>
        <ul>
          <li>The prescription is now ready for processing</li>
          <li>Please prepare the medications for dispensing</li>
          <li>Update the status once shipped or ready for pickup</li>
        </ul>
      </div>

      <center>
        <a href="https://rapidcapsule.com/app/specialist/pharmacy/prescriptions" class="button">View Prescription</a>
      </center>
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

export const walletChargedForPrescriptionEmail = (data: WalletChargedEmailData) => {
  const isPartialPayment = data.remainingAmount > 0;
  const headerColor = isPartialPayment ? '#ff9800' : '#4caf50';
  const headerGradient = isPartialPayment
    ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
    : 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)';

  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
        <strong style="color: #2c3e50;">${item.drug_name}</strong>
        ${item.generic_name ? `<br><span style="color: #78909c; font-size: 13px;">${item.generic_name}</span>` : ''}
        ${item.strength ? `<br><span style="color: #78909c; font-size: 13px;">${item.strength}</span>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
        <span style="color: #2c3e50;">${item.dosage}</span><br>
        <span style="color: #78909c; font-size: 13px;">${item.frequency} for ${item.duration}</span>
        ${item.instructions ? `<br><span style="color: #546e7a; font-size: 12px; font-style: italic;">${item.instructions}</span>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">${data.currency} ${item.total_price.toLocaleString()}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: ${headerGradient}; padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .charge-card { background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
    .charge-card h3 { margin: 0 0 15px; color: #1565c0; font-size: 18px; }
    .charge-amount { font-size: 32px; font-weight: 700; color: #1565c0; margin: 10px 0; }
    .info-card { background: #f8f9fa; border-left: 4px solid #1a73e8; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .info-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .warning-card { background: #fff3e0; border-left: 4px solid #ff9800; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .warning-card h3 { margin: 0 0 10px; color: #e65100; font-size: 18px; }
    .warning-card p { margin: 8px 0; color: #f57c00; font-size: 15px; line-height: 1.6; }
    .remaining-amount { font-size: 24px; font-weight: 700; color: #e65100; margin: 10px 0; }
    .medications-table { width: 100%; border-collapse: collapse; margin: 25px 0; }
    .medications-table th { background: #f8f9fa; padding: 12px; text-align: left; color: #2c3e50; font-weight: 600; border-bottom: 2px solid #e0e0e0; }
    .totals { margin: 25px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; color: #546e7a; }
    .totals-row.total { border-top: 2px solid #e0e0e0; margin-top: 10px; padding-top: 15px; font-weight: 600; color: #2c3e50; font-size: 18px; }
    .totals-row.paid { color: #2e7d32; }
    .totals-row.remaining { color: #e65100; font-weight: 600; }
    .delivery-card { background: #e3f2fd; border-radius: 8px; padding: 20px; margin: 25px 0; }
    .delivery-card h3 { margin: 0 0 15px; color: #1565c0; font-size: 16px; }
    .button { display: inline-block; background-color: ${headerColor}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .button-secondary { display: inline-block; background-color: #1a73e8; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 10px 0; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #1a73e8; text-decoration: none; }
    .divider { height: 1px; background: #e0e0e0; margin: 30px 0; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; }
    .badge-success { background: #e8f5e9; color: #2e7d32; }
    .badge-warning { background: #fff3e0; color: #e65100; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${isPartialPayment ? '💳 Partial Payment Charged' : '💳 Wallet Charged'}</h1>
      <p>${isPartialPayment ? 'Your wallet was charged for part of your prescription' : 'Your wallet was charged for your prescription'}</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        A prescription has been created for you by <strong>${data.specialistName}</strong>${data.specialistTitle ? ` (${data.specialistTitle})` : ''}, and your wallet has been charged.
      </p>

      <div class="charge-card">
        <h3>Amount Charged from Wallet</h3>
        <div class="charge-amount">${data.currency} ${data.walletAmountCharged.toLocaleString()}</div>
        <p style="margin: 0; color: #1565c0;">Charged on ${data.chargedAt}</p>
      </div>

      ${isPartialPayment ? `
        <div class="warning-card">
          <h3>⚠️ Remaining Balance Due</h3>
          <p>Your wallet balance was not enough to cover the full prescription cost.</p>
          <div class="remaining-amount">${data.currency} ${data.remainingAmount.toLocaleString()}</div>
          <p><strong>Payment method:</strong> ${data.remainingPaymentMethod === 'cash' ? 'Cash on Delivery' : 'Online Payment'}</p>
          ${data.remainingPaymentMethod === 'online' && data.paymentUrl ? `
            <center style="margin-top: 15px;">
              <a href="${data.paymentUrl}" class="button-secondary">Pay Remaining Amount</a>
            </center>
          ` : ''}
        </div>
      ` : `
        <div class="info-card" style="background: #e8f5e9; border-left-color: #4caf50;">
          <h3 style="color: #2e7d32;">✅ Fully Paid</h3>
          <p style="color: #388e3c;">Your prescription has been fully paid from your wallet. No further payment is required.</p>
        </div>
      `}

      <div class="info-card">
        <h3>📋 Prescription Details</h3>
        <p><strong>Prescription #:</strong> ${data.prescriptionNumber}</p>
        <p><strong>Prescribed by:</strong> ${data.specialistName}</p>
        <p><strong>Status:</strong> <span class="badge ${isPartialPayment ? 'badge-warning' : 'badge-success'}">${isPartialPayment ? 'Pending Payment' : 'Paid'}</span></p>
      </div>

      <h3 style="color: #2c3e50; margin: 30px 0 15px;">Prescribed Medications</h3>
      <table class="medications-table">
        <thead>
          <tr>
            <th>Medication</th>
            <th style="text-align: center;">Qty</th>
            <th>Dosage</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row total">
          <span>Total Amount</span>
          <span>${data.currency} ${data.totalAmount.toLocaleString()}</span>
        </div>
        <div class="totals-row paid">
          <span>Paid from Wallet</span>
          <span>- ${data.currency} ${data.walletAmountCharged.toLocaleString()}</span>
        </div>
        ${isPartialPayment ? `
          <div class="totals-row remaining">
            <span>Remaining Balance</span>
            <span>${data.currency} ${data.remainingAmount.toLocaleString()}</span>
          </div>
        ` : ''}
      </div>

      ${data.deliveryAddress ? `
        <div class="delivery-card">
          <h3>🚚 Delivery Address</h3>
          <p style="margin: 0; color: #1565c0;">
            ${data.deliveryAddress.recipient_name || data.patientName}<br>
            ${data.deliveryAddress.street}<br>
            ${data.deliveryAddress.city}, ${data.deliveryAddress.state}<br>
            Phone: ${data.deliveryAddress.phone}
          </p>
        </div>
      ` : ''}

      ${data.notes ? `
        <div class="info-card" style="background: #fff9e6; border-left-color: #ffc107;">
          <h3>📝 Notes from Your Doctor</h3>
          <p style="white-space: pre-wrap;">${data.notes}</p>
        </div>
      ` : ''}

      <div class="divider"></div>

      <center>
        <a href="https://rapidcapsule.com/app/patient/prescriptions" class="button">View Prescription</a>
      </center>

      <p style="color: #78909c; font-size: 14px; line-height: 1.6; margin-top: 30px;">
        <strong>Important:</strong> Please follow the dosage instructions carefully. If you experience any side effects or have questions about your medication, contact your healthcare provider immediately.
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

// ============ REFILL NOTIFICATION EMAIL TEMPLATES ============

/**
 * Email data for refill reminder notification
 */
export interface RefillReminderEmailData {
  patientName: string;
  drugName: string;
  genericName?: string;
  strength?: string;
  currentQuantity: number;
  daysRemaining: number;
  lastFillDate: string;
  prescriptionNumber?: string;
  refillUrl: string;
}

/**
 * Email sent to patient when they're approaching refill date (3 days before)
 */
export const refillReminderEmail = (data: RefillReminderEmailData) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .reminder-card { background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; border: 2px solid #ff9800; }
    .reminder-card h2 { margin: 0 0 10px; color: #e65100; font-size: 20px; }
    .reminder-card .days { font-size: 48px; font-weight: 700; color: #e65100; margin: 15px 0; }
    .reminder-card p { margin: 0; color: #f57c00; font-size: 14px; }
    .drug-card { background: #f8f9fa; border-left: 4px solid #1a73e8; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .drug-card h3 { margin: 0 0 15px; color: #2c3e50; font-size: 18px; }
    .drug-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .drug-name { font-size: 20px; font-weight: 600; color: #2c3e50; }
    .drug-details { color: #78909c; font-size: 14px; }
    .info-card { background: #e3f2fd; border-radius: 8px; padding: 20px; margin: 25px 0; }
    .info-card h3 { margin: 0 0 10px; color: #1565c0; font-size: 16px; }
    .info-card p { margin: 5px 0; color: #1976d2; font-size: 14px; }
    .button { display: inline-block; background-color: #ff9800; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #1a73e8; text-decoration: none; }
    .tips { margin: 25px 0; padding: 20px; background: #fafafa; border-radius: 8px; }
    .tips h3 { margin: 0 0 15px; color: #2c3e50; font-size: 16px; }
    .tips ul { margin: 0; padding-left: 20px; color: #546e7a; }
    .tips li { margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Refill Reminder</h1>
      <p>Time to reorder your medication</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        This is a friendly reminder that you're running low on your medication and will need to refill soon.
      </p>

      <div class="reminder-card">
        <h2>Supply Running Low</h2>
        <div class="days">${data.daysRemaining}</div>
        <p>days of medication remaining</p>
      </div>

      <div class="drug-card">
        <h3>💊 Medication Details</h3>
        <p class="drug-name">${data.drugName}</p>
        ${data.genericName ? `<p class="drug-details">${data.genericName}</p>` : ''}
        ${data.strength ? `<p class="drug-details">${data.strength}</p>` : ''}
        <p><strong>Current Supply:</strong> ${data.currentQuantity} remaining</p>
        <p><strong>Last Fill Date:</strong> ${data.lastFillDate}</p>
        ${data.prescriptionNumber ? `<p><strong>Prescription #:</strong> ${data.prescriptionNumber}</p>` : ''}
      </div>

      <div class="info-card">
        <h3>Why Refill Early?</h3>
        <p>• Ensure continuous treatment without gaps</p>
        <p>• Allow time for processing and delivery</p>
        <p>• Avoid running out of essential medication</p>
      </div>

      <center>
        <a href="${data.refillUrl}" class="button">Request Refill Now</a>
      </center>

      <div class="tips">
        <h3>💡 Tips for Managing Your Medication</h3>
        <ul>
          <li>Set up automatic refill reminders in your dashboard</li>
          <li>Keep a week's supply as buffer when possible</li>
          <li>Store medications properly according to instructions</li>
          <li>Never stop taking prescribed medication without consulting your doctor</li>
        </ul>
      </div>
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

/**
 * Email data for refill available notification
 */
export interface RefillAvailableEmailData {
  patientName: string;
  drugName: string;
  genericName?: string;
  strength?: string;
  originalPrescriptionNumber: string;
  remainingRefills: number;
  expiryDate?: string;
  refillUrl: string;
}

/**
 * Email sent to patient when their refill is now available
 */
export const refillAvailableEmail = (data: RefillAvailableEmailData) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .available-card { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center; }
    .available-card h2 { margin: 0 0 10px; color: #2e7d32; font-size: 24px; }
    .available-card p { margin: 10px 0 0; color: #388e3c; font-size: 16px; }
    .drug-card { background: #f8f9fa; border-left: 4px solid #4caf50; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .drug-card h3 { margin: 0 0 15px; color: #2c3e50; font-size: 18px; }
    .drug-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .drug-name { font-size: 20px; font-weight: 600; color: #2c3e50; }
    .drug-details { color: #78909c; font-size: 14px; }
    .refill-info { background: #e3f2fd; border-radius: 8px; padding: 20px; margin: 25px 0; }
    .refill-info h3 { margin: 0 0 10px; color: #1565c0; font-size: 16px; }
    .refill-info p { margin: 5px 0; color: #1976d2; font-size: 14px; }
    .refill-count { font-size: 32px; font-weight: 700; color: #1565c0; }
    .button { display: inline-block; background-color: #4caf50; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #4caf50; text-decoration: none; }
    .warning { background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px 20px; margin: 25px 0; border-radius: 8px; }
    .warning p { margin: 0; color: #e65100; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Refill Available</h1>
      <p>Your medication is ready for refill</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        Great news! Your medication is now eligible for refill. You can place your order today.
      </p>

      <div class="available-card">
        <h2>🎉 Ready for Refill!</h2>
        <p>You can now reorder your medication</p>
      </div>

      <div class="drug-card">
        <h3>💊 Medication to Refill</h3>
        <p class="drug-name">${data.drugName}</p>
        ${data.genericName ? `<p class="drug-details">${data.genericName}</p>` : ''}
        ${data.strength ? `<p class="drug-details">${data.strength}</p>` : ''}
        <p><strong>Original Prescription:</strong> #${data.originalPrescriptionNumber}</p>
      </div>

      <div class="refill-info">
        <h3>Refill Information</h3>
        <p>Remaining refills: <span class="refill-count">${data.remainingRefills}</span></p>
        ${data.expiryDate ? `<p>Prescription expires: ${data.expiryDate}</p>` : ''}
      </div>

      ${data.remainingRefills <= 1 ? `
        <div class="warning">
          <p><strong>⚠️ Note:</strong> This is your last refill on this prescription. Please consult your doctor for a renewal before this supply runs out.</p>
        </div>
      ` : ''}

      <center>
        <a href="${data.refillUrl}" class="button">Order Refill Now</a>
      </center>

      <p style="color: #78909c; font-size: 14px; line-height: 1.6; margin-top: 30px; text-align: center;">
        Click the button above or log in to your dashboard to complete your refill order.
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

/**
 * Email data for prescription expiring notification
 */
export interface PrescriptionExpiringEmailData {
  patientName: string;
  prescriptionNumber: string;
  drugName: string;
  genericName?: string;
  expiryDate: string;
  daysUntilExpiry: number;
  remainingRefills: number;
  specialistName: string;
  renewalUrl: string;
}

/**
 * Email sent to patient when their prescription is expiring soon
 */
export const prescriptionExpiringEmail = (data: PrescriptionExpiringEmailData) => {
  const urgencyColor = data.daysUntilExpiry <= 7 ? '#f44336' : '#ff9800';
  const urgencyGradient = data.daysUntilExpiry <= 7
    ? 'linear-gradient(135deg, #f44336 0%, #c62828 100%)'
    : 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: ${urgencyGradient}; padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .expiry-card { background: ${data.daysUntilExpiry <= 7 ? '#ffebee' : '#fff3e0'}; border: 2px solid ${urgencyColor}; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
    .expiry-card h2 { margin: 0 0 10px; color: ${data.daysUntilExpiry <= 7 ? '#c62828' : '#e65100'}; font-size: 20px; }
    .expiry-card .days { font-size: 48px; font-weight: 700; color: ${urgencyColor}; margin: 15px 0; }
    .expiry-card p { margin: 0; color: ${data.daysUntilExpiry <= 7 ? '#e53935' : '#f57c00'}; font-size: 14px; }
    .drug-card { background: #f8f9fa; border-left: 4px solid ${urgencyColor}; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .drug-card h3 { margin: 0 0 15px; color: #2c3e50; font-size: 18px; }
    .drug-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .info-card { background: #e3f2fd; border-radius: 8px; padding: 20px; margin: 25px 0; }
    .info-card h3 { margin: 0 0 10px; color: #1565c0; font-size: 16px; }
    .info-card p { margin: 5px 0; color: #1976d2; font-size: 14px; }
    .button { display: inline-block; background-color: ${urgencyColor}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #1a73e8; text-decoration: none; }
    .steps { margin: 25px 0; padding: 20px; background: #fafafa; border-radius: 8px; }
    .steps h3 { margin: 0 0 15px; color: #2c3e50; font-size: 16px; }
    .step { display: flex; align-items: flex-start; margin: 15px 0; }
    .step-number { background: #1a73e8; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; margin-right: 15px; flex-shrink: 0; }
    .step-content { color: #546e7a; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Prescription Expiring Soon</h1>
      <p>Action required to continue your treatment</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        Your prescription is expiring soon. To continue receiving your medication, please contact your doctor for a prescription renewal.
      </p>

      <div class="expiry-card">
        <h2>Prescription Expires In</h2>
        <div class="days">${data.daysUntilExpiry}</div>
        <p>days (${data.expiryDate})</p>
      </div>

      <div class="drug-card">
        <h3>📋 Prescription Details</h3>
        <p><strong>Prescription #:</strong> ${data.prescriptionNumber}</p>
        <p><strong>Medication:</strong> ${data.drugName}</p>
        ${data.genericName ? `<p><strong>Generic Name:</strong> ${data.genericName}</p>` : ''}
        <p><strong>Remaining Refills:</strong> ${data.remainingRefills}</p>
        <p><strong>Prescribed by:</strong> ${data.specialistName}</p>
        <p><strong>Expiry Date:</strong> ${data.expiryDate}</p>
      </div>

      <div class="steps">
        <h3>What to do next:</h3>
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">Contact your doctor (${data.specialistName}) to request a prescription renewal</div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">Schedule a follow-up appointment if required by your doctor</div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">Order your refill once the new prescription is issued</div>
        </div>
      </div>

      <div class="info-card">
        <h3>💡 Why does my prescription expire?</h3>
        <p>Prescription expiry dates ensure that your doctor can monitor your treatment and adjust medications as needed. This is an important safety measure to ensure you're receiving the best care.</p>
      </div>

      <center>
        <a href="${data.renewalUrl}" class="button">Request Renewal</a>
      </center>
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

/**
 * Email data for early refill denied notification
 */
export interface EarlyRefillDeniedEmailData {
  patientName: string;
  drugName: string;
  genericName?: string;
  lastFillDate: string;
  nextEligibleDate: string;
  daysUntilEligible: number;
  reason: string;
}

/**
 * Email sent to patient when they try to refill too early
 */
export const earlyRefillDeniedEmail = (data: EarlyRefillDeniedEmailData) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #78909c 0%, #546e7a 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .denied-card { background: #fff3e0; border: 2px solid #ff9800; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
    .denied-card h2 { margin: 0 0 10px; color: #e65100; font-size: 20px; }
    .denied-card p { margin: 10px 0 0; color: #f57c00; font-size: 14px; }
    .date-card { background: #e3f2fd; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
    .date-card h3 { margin: 0 0 10px; color: #1565c0; font-size: 16px; }
    .date-card .date { font-size: 24px; font-weight: 700; color: #1565c0; margin: 10px 0; }
    .date-card .days { font-size: 14px; color: #1976d2; }
    .drug-card { background: #f8f9fa; border-left: 4px solid #78909c; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .drug-card h3 { margin: 0 0 15px; color: #2c3e50; font-size: 18px; }
    .drug-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .reason-card { background: #fff9c4; border-left: 4px solid #fbc02d; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .reason-card h3 { margin: 0 0 10px; color: #f57f17; font-size: 16px; }
    .reason-card p { margin: 0; color: #827717; font-size: 14px; line-height: 1.6; }
    .info-card { background: #e8f5e9; border-radius: 8px; padding: 20px; margin: 25px 0; }
    .info-card h3 { margin: 0 0 10px; color: #2e7d32; font-size: 16px; }
    .info-card p { margin: 5px 0; color: #388e3c; font-size: 14px; }
    .button { display: inline-block; background-color: #1a73e8; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #1a73e8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Refill Request Update</h1>
      <p>Your refill request could not be processed at this time</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        We were unable to process your refill request at this time. Your medication is not yet eligible for refill.
      </p>

      <div class="denied-card">
        <h2>⏳ Too Early for Refill</h2>
        <p>Your next refill date hasn't arrived yet</p>
      </div>

      <div class="drug-card">
        <h3>💊 Medication Details</h3>
        <p><strong>Medication:</strong> ${data.drugName}</p>
        ${data.genericName ? `<p><strong>Generic Name:</strong> ${data.genericName}</p>` : ''}
        <p><strong>Last Fill Date:</strong> ${data.lastFillDate}</p>
      </div>

      <div class="date-card">
        <h3>📅 Next Eligible Refill Date</h3>
        <div class="date">${data.nextEligibleDate}</div>
        <div class="days">(${data.daysUntilEligible} days from now)</div>
      </div>

      <div class="reason-card">
        <h3>Why was my refill denied?</h3>
        <p>${data.reason}</p>
      </div>

      <div class="info-card">
        <h3>✅ What you can do</h3>
        <p>• Wait until the eligible date and try again</p>
        <p>• We'll send you a reminder when your refill is ready</p>
        <p>• If you have an urgent need, contact your healthcare provider</p>
      </div>

      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        If you believe this is an error or have special circumstances, please contact our support team or your healthcare provider.
      </p>

      <center>
        <a href="https://rapidcapsule.com/support" class="button">Contact Support</a>
      </center>
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

/**
 * Email data for prescription expired notification
 */
export interface PrescriptionExpiredEmailData {
  patientName: string;
  prescriptionNumber: string;
  drugName: string;
  genericName?: string;
  totalAmount: number;
  currency: string;
  expiryReason: string;
  contactUrl: string;
}

/**
 * Email sent to patient when their prescription has expired due to non-payment
 */
export const prescriptionExpiredEmail = (data: PrescriptionExpiredEmailData) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #78909c 0%, #546e7a 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .expired-card { background: #ffebee; border: 2px solid #ef5350; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
    .expired-card h2 { margin: 0 0 10px; color: #c62828; font-size: 24px; }
    .expired-card p { margin: 0; color: #e53935; font-size: 16px; }
    .drug-card { background: #f8f9fa; border-left: 4px solid #78909c; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .drug-card h3 { margin: 0 0 15px; color: #2c3e50; font-size: 18px; }
    .drug-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .reason-card { background: #fff3e0; border-left: 4px solid #ff9800; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .reason-card h3 { margin: 0 0 10px; color: #e65100; font-size: 16px; }
    .reason-card p { margin: 0; color: #f57c00; font-size: 14px; line-height: 1.6; }
    .info-card { background: #e3f2fd; border-radius: 8px; padding: 20px; margin: 25px 0; }
    .info-card h3 { margin: 0 0 10px; color: #1565c0; font-size: 16px; }
    .info-card p { margin: 5px 0; color: #1976d2; font-size: 14px; }
    .button { display: inline-block; background-color: #1a73e8; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #1a73e8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Prescription Expired</h1>
      <p>Your prescription order could not be completed</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        We regret to inform you that your prescription has expired and the order has been cancelled.
      </p>

      <div class="expired-card">
        <h2>❌ Prescription Expired</h2>
        <p>Order #${data.prescriptionNumber}</p>
      </div>

      <div class="drug-card">
        <h3>📋 Prescription Details</h3>
        <p><strong>Prescription #:</strong> ${data.prescriptionNumber}</p>
        <p><strong>Medication:</strong> ${data.drugName}</p>
        ${data.genericName ? `<p><strong>Generic Name:</strong> ${data.genericName}</p>` : ''}
        <p><strong>Total Amount:</strong> ${data.currency} ${data.totalAmount.toLocaleString()}</p>
        <p><strong>Status:</strong> Expired</p>
      </div>

      <div class="reason-card">
        <h3>Why did my prescription expire?</h3>
        <p>${data.expiryReason}</p>
      </div>

      <div class="info-card">
        <h3>What happens next?</h3>
        <p>• Any reserved medications have been released back to inventory</p>
        <p>• No payment has been charged to your account</p>
        <p>• You will need to request a new prescription from your doctor</p>
      </div>

      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        If you still need this medication, please contact your healthcare provider to request a new prescription.
      </p>

      <center>
        <a href="${data.contactUrl}" class="button">Contact Support</a>
      </center>

      <p style="color: #78909c; font-size: 14px; line-height: 1.6; margin-top: 30px; text-align: center;">
        If you have questions about this expiration or need assistance, our support team is here to help.
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

// ============ PHARMACY RATING EMAIL TEMPLATES ============

/**
 * Email data for pharmacy rating request
 */
export interface PharmacyRatingEmailData {
  patientName: string;
  orderNumber: string;
  pharmacyName: string;
  items: { drug_name: string; quantity: number }[];
  deliveryDate: string;
  ratingUrl: string;
}

/**
 * Email sent to patient after order delivery to request a rating
 */
export const pharmacyRatingRequestEmail = (data: PharmacyRatingEmailData) => {
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
    .header { background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .rating-card { background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%); border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center; border: 2px solid #ffc107; }
    .rating-card h2 { margin: 0 0 10px; color: #f57c00; font-size: 22px; }
    .rating-card p { margin: 0; color: #ff8f00; font-size: 16px; }
    .stars { font-size: 40px; margin: 15px 0; letter-spacing: 8px; }
    .info-card { background: #f8f9fa; border-left: 4px solid #1a73e8; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .info-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .button { display: inline-block; background-color: #ffc107; color: #000000; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 18px; margin: 20px 0; box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4); }
    .button:hover { background-color: #ffb300; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #1a73e8; text-decoration: none; }
    .pharmacy-badge { display: inline-block; background: #e3f2fd; color: #1565c0; padding: 8px 20px; border-radius: 20px; font-size: 16px; font-weight: 500; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>How was your experience?</h1>
      <p>We'd love to hear your feedback</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        Your order <strong>#${data.orderNumber}</strong> was delivered on <strong>${data.deliveryDate}</strong>. We hope everything arrived in perfect condition!
      </p>

      <div class="rating-card">
        <div class="stars">⭐⭐⭐⭐⭐</div>
        <h2>Rate Your Experience</h2>
        <p>Your feedback helps improve our service</p>
        <div class="pharmacy-badge">${data.pharmacyName}</div>
      </div>

      <div class="info-card">
        <h3>📦 Order Summary</h3>
        <p><strong>Order #:</strong> ${data.orderNumber}</p>
        <p><strong>Pharmacy:</strong> ${data.pharmacyName}</p>
        <p><strong>Items:</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          ${itemsList}
        </ul>
      </div>

      <p style="font-size: 16px; color: #546e7a; line-height: 1.6; text-align: center;">
        Taking just 30 seconds to rate your experience helps other patients find the best pharmacies and helps us improve our service.
      </p>

      <center>
        <a href="${data.ratingUrl}" class="button">⭐ Rate Now</a>
      </center>

      <p style="color: #78909c; font-size: 14px; line-height: 1.6; margin-top: 30px; text-align: center;">
        Your rating is anonymous and helps us maintain high-quality service standards.
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

/**
 * Follow-up rating reminder email sent 24 hours after delivery if no rating received
 */
export const pharmacyRatingReminderEmail = (data: PharmacyRatingEmailData) => {
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
    .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .reminder-card { background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center; border: 2px solid #ff9800; }
    .reminder-card h2 { margin: 0 0 10px; color: #e65100; font-size: 22px; }
    .reminder-card p { margin: 0; color: #f57c00; font-size: 16px; }
    .stars { font-size: 40px; margin: 15px 0; letter-spacing: 8px; }
    .info-card { background: #f8f9fa; border-left: 4px solid #ff9800; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .info-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .button { display: inline-block; background-color: #ff9800; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 18px; margin: 20px 0; box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4); }
    .button:hover { background-color: #f57c00; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #ff9800; text-decoration: none; }
    .pharmacy-badge { display: inline-block; background: #fff3e0; color: #e65100; padding: 8px 20px; border-radius: 20px; font-size: 16px; font-weight: 500; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>We'd Love Your Feedback!</h1>
      <p>Just a friendly reminder</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        We noticed you haven't had a chance to rate your recent order <strong>#${data.orderNumber}</strong> delivered on <strong>${data.deliveryDate}</strong>. Your feedback is incredibly valuable to us!
      </p>

      <div class="reminder-card">
        <div class="stars">⭐⭐⭐⭐⭐</div>
        <h2>Share Your Experience</h2>
        <p>Help other patients make informed decisions</p>
        <div class="pharmacy-badge">${data.pharmacyName}</div>
      </div>

      <div class="info-card">
        <h3>📦 Order Reminder</h3>
        <p><strong>Order #:</strong> ${data.orderNumber}</p>
        <p><strong>Pharmacy:</strong> ${data.pharmacyName}</p>
        <p><strong>Items:</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          ${itemsList}
        </ul>
      </div>

      <p style="font-size: 16px; color: #546e7a; line-height: 1.6; text-align: center;">
        It takes less than <strong>30 seconds</strong> to leave a rating and helps us provide better healthcare services for everyone.
      </p>

      <center>
        <a href="${data.ratingUrl}" class="button">⭐ Leave a Review</a>
      </center>

      <p style="color: #78909c; font-size: 14px; line-height: 1.6; margin-top: 30px; text-align: center;">
        Already left a review? Thank you! You can ignore this email.
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

// ============ PRESCRIPTION RATING EMAIL TEMPLATES ============

export interface PrescriptionRatingEmailData {
  patientName: string;
  prescriptionNumber: string;
  specialistName: string;
  items: { drug_name: string; quantity: number }[];
  deliveryDate: string;
  ratingUrl: string;
}

/**
 * Email sent to patient after prescription delivery to request a rating
 */
export const prescriptionRatingRequestEmail = (data: PrescriptionRatingEmailData) => {
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
    .header { background: linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .rating-card { background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center; border: 2px solid #8b5cf6; }
    .rating-card h2 { margin: 0 0 10px; color: #6d28d9; font-size: 22px; }
    .rating-card p { margin: 0; color: #7c3aed; font-size: 16px; }
    .stars { font-size: 40px; margin: 15px 0; letter-spacing: 8px; }
    .info-card { background: #f8f9fa; border-left: 4px solid #4F46E5; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .info-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .button { display: inline-block; background-color: #8b5cf6; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 18px; margin: 20px 0; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4); }
    .button:hover { background-color: #7c3aed; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #4F46E5; text-decoration: none; }
    .specialist-badge { display: inline-block; background: #ede9fe; color: #6d28d9; padding: 8px 20px; border-radius: 20px; font-size: 16px; font-weight: 500; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>How was your experience?</h1>
      <p>Your prescription has been delivered!</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        Your prescription <strong>#${data.prescriptionNumber}</strong> was delivered on <strong>${data.deliveryDate}</strong>. We hope you received everything in excellent condition!
      </p>

      <div class="rating-card">
        <div class="stars">⭐⭐⭐⭐⭐</div>
        <h2>Rate Your Experience</h2>
        <p>Your feedback helps us improve our service</p>
        <div class="specialist-badge">Prescribed by ${data.specialistName}</div>
      </div>

      <div class="info-card">
        <h3>💊 Prescription Summary</h3>
        <p><strong>Prescription #:</strong> ${data.prescriptionNumber}</p>
        <p><strong>Prescribed by:</strong> ${data.specialistName}</p>
        <p><strong>Items:</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          ${itemsList}
        </ul>
      </div>

      <p style="font-size: 16px; color: #546e7a; line-height: 1.6; text-align: center;">
        Taking just 30 seconds to share your experience helps us maintain the highest quality healthcare standards.
      </p>

      <center>
        <a href="${data.ratingUrl}" class="button">⭐ Rate Now</a>
      </center>

      <p style="color: #78909c; font-size: 14px; line-height: 1.6; margin-top: 30px; text-align: center;">
        Your rating is anonymous and helps improve healthcare services for everyone.
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

/**
 * Follow-up prescription rating reminder email sent 24 hours after delivery
 */
export const prescriptionRatingReminderEmail = (data: PrescriptionRatingEmailData) => {
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
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .reminder-card { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center; border: 2px solid #f59e0b; }
    .reminder-card h2 { margin: 0 0 10px; color: #b45309; font-size: 22px; }
    .reminder-card p { margin: 0; color: #d97706; font-size: 16px; }
    .stars { font-size: 40px; margin: 15px 0; letter-spacing: 8px; }
    .info-card { background: #f8f9fa; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .info-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .button { display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 18px; margin: 20px 0; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4); }
    .button:hover { background-color: #d97706; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #f59e0b; text-decoration: none; }
    .specialist-badge { display: inline-block; background: #fef3c7; color: #b45309; padding: 8px 20px; border-radius: 20px; font-size: 16px; font-weight: 500; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>We'd Love Your Feedback!</h1>
      <p>Just a friendly reminder</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        We noticed you haven't had a chance to rate your recent prescription <strong>#${data.prescriptionNumber}</strong> delivered on <strong>${data.deliveryDate}</strong>. Your feedback is incredibly valuable to us!
      </p>

      <div class="reminder-card">
        <div class="stars">⭐⭐⭐⭐⭐</div>
        <h2>Share Your Experience</h2>
        <p>Help us improve our healthcare services</p>
        <div class="specialist-badge">Prescribed by ${data.specialistName}</div>
      </div>

      <div class="info-card">
        <h3>💊 Prescription Reminder</h3>
        <p><strong>Prescription #:</strong> ${data.prescriptionNumber}</p>
        <p><strong>Prescribed by:</strong> ${data.specialistName}</p>
        <p><strong>Items:</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          ${itemsList}
        </ul>
      </div>

      <p style="font-size: 16px; color: #546e7a; line-height: 1.6; text-align: center;">
        It takes less than <strong>30 seconds</strong> to leave a rating and helps us provide better healthcare services for everyone.
      </p>

      <center>
        <a href="${data.ratingUrl}" class="button">⭐ Leave a Review</a>
      </center>

      <p style="color: #78909c; font-size: 14px; line-height: 1.6; margin-top: 30px; text-align: center;">
        Already left a review? Thank you! You can ignore this email.
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

// ============================================
// PRESCRIPTION REVIEW EMAIL TEMPLATES
// ============================================

/**
 * Data interface for prescription under review emails
 */
export interface PrescriptionUnderReviewEmailData {
  patientName: string;
  prescriptionNumber: string;
  uploadDate: string;
  estimatedReviewTime?: string;
  prescriptionUrl?: string;
}

/**
 * Email sent when a prescription upload requires pharmacist review
 */
export const prescriptionUnderReviewEmail = (data: PrescriptionUnderReviewEmailData) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .review-card { background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
    .review-card h2 { margin: 0 0 10px; color: #e65100; font-size: 20px; }
    .review-card p { margin: 0; color: #f57c00; font-size: 15px; }
    .info-card { background: #f8f9fa; border-left: 4px solid #ff9800; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .info-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .info-card ul { margin: 10px 0; padding-left: 20px; color: #546e7a; }
    .info-card li { margin: 8px 0; line-height: 1.5; }
    .timeline { margin: 25px 0; padding: 20px; background: #fafafa; border-radius: 8px; }
    .timeline-item { display: flex; align-items: flex-start; margin: 15px 0; }
    .timeline-dot { width: 12px; height: 12px; border-radius: 50%; margin-right: 15px; margin-top: 4px; }
    .timeline-dot.completed { background: #4caf50; }
    .timeline-dot.current { background: #ff9800; animation: pulse 1.5s infinite; }
    .timeline-dot.pending { background: #e0e0e0; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .button { display: inline-block; background-color: #ff9800; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #ff9800; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Prescription Under Review</h1>
      <p>Your prescription requires additional verification</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>\${data.patientName}</strong>,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        Your prescription <strong>\${data.prescriptionNumber}</strong> uploaded on <strong>\${data.uploadDate}</strong> requires additional verification by our pharmacist team.
      </p>
      <div class="review-card">
        <h2>Review in Progress</h2>
        <p>Our pharmacist team is reviewing your prescription</p>
        \${data.estimatedReviewTime ? '<p style="margin-top: 10px; font-weight: 600;">Expected completion: ' + data.estimatedReviewTime + '</p>' : ''}
      </div>
      <div class="info-card">
        <h3>What This Means</h3>
        <ul>
          <li>Our AI system flagged some items that need human verification</li>
          <li>This is a <strong>standard safety procedure</strong> to ensure prescription accuracy</li>
          <li>A licensed pharmacist will review your prescription</li>
          <li>You'll be notified as soon as the review is complete</li>
        </ul>
      </div>
      <div class="info-card" style="background: #e3f2fd; border-left-color: #1a73e8;">
        <h3>No Action Required</h3>
        <p>You don't need to do anything right now. We'll email you once the review is complete with next steps.</p>
      </div>
      <center>
        <a href="\${data.prescriptionUrl || 'https://rapidcapsule.com/app/patient/prescriptions'}" class="button">View Prescription Status</a>
      </center>
      <p style="color: #78909c; font-size: 14px; line-height: 1.6; margin-top: 30px;">
        <strong>Questions?</strong> If you have any questions about this review, please contact our support team.
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

/**
 * Data interface for prescription approved emails
 */
export interface PrescriptionApprovedEmailData {
  patientName: string;
  prescriptionNumber: string;
  medications: Array<{ name: string; dosage?: string; quantity?: string }>;
  validUntil?: string;
  reviewNotes?: string;
  prescriptionUrl?: string;
}

/**
 * Email sent when a prescription upload is approved
 */
export const prescriptionUploadApprovedEmail = (data: PrescriptionApprovedEmailData) => {
  const medicationsHtml = data.medications.map(med => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
        <strong style="color: #2c3e50;">\${med.name}</strong>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">\${med.dosage || '-'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">\${med.quantity || '-'}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .success-card { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center; }
    .success-card h2 { margin: 0 0 10px; color: #2e7d32; font-size: 24px; }
    .success-card p { margin: 0; color: #388e3c; font-size: 16px; }
    .info-card { background: #f8f9fa; border-left: 4px solid #4caf50; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .info-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .medications-table { width: 100%; border-collapse: collapse; margin: 25px 0; }
    .medications-table th { background: #f8f9fa; padding: 12px; text-align: left; color: #2c3e50; font-weight: 600; border-bottom: 2px solid #e0e0e0; }
    .next-steps { margin: 25px 0; padding: 20px; background: #e3f2fd; border-radius: 8px; }
    .next-steps h3 { margin: 0 0 15px; color: #1565c0; font-size: 18px; }
    .next-steps ol { margin: 0; padding-left: 20px; color: #1565c0; }
    .next-steps li { margin: 10px 0; line-height: 1.5; }
    .button { display: inline-block; background-color: #4caf50; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .button-secondary { display: inline-block; background-color: #ffffff; color: #4caf50; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 10px; border: 2px solid #4caf50; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #4caf50; text-decoration: none; }
    .validity-badge { display: inline-block; background: #fff9c4; color: #f57f17; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Prescription Approved!</h1>
      <p>Your prescription has been verified and approved</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>\${data.patientName}</strong>,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        Great news! Your prescription <strong>\${data.prescriptionNumber}</strong> has been reviewed and <strong style="color: #2e7d32;">approved</strong> by our pharmacist team.
      </p>
      <div class="success-card">
        <h2>Prescription Verified!</h2>
        <p>All medications have been confirmed</p>
        \${data.validUntil ? '<span class="validity-badge">Valid until: ' + data.validUntil + '</span>' : ''}
      </div>
      <div class="info-card">
        <h3>Prescription Details</h3>
        <p><strong>Prescription #:</strong> \${data.prescriptionNumber}</p>
        <p><strong>Status:</strong> <span style="color: #2e7d32; font-weight: 600;">Approved</span></p>
      </div>
      <h3 style="color: #2c3e50; margin: 30px 0 15px;">Approved Medications</h3>
      <table class="medications-table">
        <thead>
          <tr>
            <th>Medication</th>
            <th style="text-align: center;">Dosage</th>
            <th style="text-align: center;">Quantity</th>
          </tr>
        </thead>
        <tbody>
          \${medicationsHtml}
        </tbody>
      </table>
      \${data.reviewNotes ? '<div class="info-card" style="background: #fff9e6; border-left-color: #ffc107;"><h3>Pharmacist Notes</h3><p>' + data.reviewNotes + '</p></div>' : ''}
      <div class="next-steps">
        <h3>What's Next?</h3>
        <ol>
          <li>Browse our pharmacy to find your medications</li>
          <li>Add the approved medications to your cart</li>
          <li>Complete your order with delivery or pickup</li>
        </ol>
      </div>
      <center>
        <a href="\${data.prescriptionUrl || 'https://rapidcapsule.com/app/patient/prescriptions'}" class="button">Order Medications</a>
        <a href="https://rapidcapsule.com/app/patient/pharmacy" class="button-secondary">Browse Pharmacy</a>
      </center>
      <p style="color: #78909c; font-size: 14px; line-height: 1.6; margin-top: 30px;">
        <strong>Important:</strong> Please follow the dosage instructions on your prescription. If you have any questions about your medications, consult with your healthcare provider.
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

/**
 * Data interface for prescription rejected emails
 */
export interface PrescriptionRejectedEmailData {
  patientName: string;
  prescriptionNumber: string;
  rejectionReason: string;
  rejectionDetails?: string;
  suggestions?: string[];
  prescriptionUrl?: string;
}

/**
 * Email sent when a prescription upload is rejected
 */
export const prescriptionUploadRejectedEmail = (data: PrescriptionRejectedEmailData) => {
  const suggestionsHtml = data.suggestions?.length ? '<div class="info-card" style="background: #e3f2fd; border-left-color: #1a73e8;"><h3>Suggestions</h3><ul style="margin: 10px 0; padding-left: 20px; color: #1565c0;">' + data.suggestions.map(s => '<li style="margin: 8px 0;">' + s + '</li>').join('') + '</ul></div>' : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #f44336 0%, #c62828 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .rejection-card { background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); border-radius: 12px; padding: 25px; margin: 25px 0; }
    .rejection-card h2 { margin: 0 0 15px; color: #c62828; font-size: 20px; }
    .rejection-card p { margin: 0; color: #b71c1c; font-size: 15px; line-height: 1.6; }
    .info-card { background: #f8f9fa; border-left: 4px solid #f44336; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .info-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .info-card ul { margin: 10px 0; padding-left: 20px; color: #546e7a; }
    .info-card li { margin: 8px 0; line-height: 1.5; }
    .button { display: inline-block; background-color: #1a73e8; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .button-secondary { display: inline-block; background-color: #ffffff; color: #1a73e8; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 10px; border: 2px solid #1a73e8; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #1a73e8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Prescription Not Approved</h1>
      <p>Your prescription could not be verified</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        We regret to inform you that your prescription <strong>${data.prescriptionNumber}</strong> could not be approved after review by our pharmacist team.
      </p>
      <div class="rejection-card">
        <h2>Reason for Rejection</h2>
        <p><strong>${data.rejectionReason}</strong></p>
        ${data.rejectionDetails ? '<p style="margin-top: 10px;">' + data.rejectionDetails + '</p>' : ''}
      </div>
      <div class="info-card">
        <h3>Prescription Details</h3>
        <p><strong>Prescription #:</strong> ${data.prescriptionNumber}</p>
        <p><strong>Status:</strong> <span style="color: #c62828; font-weight: 600;">Rejected</span></p>
      </div>
      ${suggestionsHtml}
      <div class="info-card" style="background: #fff9e6; border-left-color: #ffc107;">
        <h3>What Can You Do?</h3>
        <ul>
          <li>Upload a clearer or complete copy of your prescription</li>
          <li>Ensure all medication details are legible</li>
          <li>Make sure the prescription includes doctor's signature and date</li>
          <li>Contact your healthcare provider if you need a new prescription</li>
        </ul>
      </div>
      <center>
        <a href="https://rapidcapsule.com/app/patient/prescriptions" class="button">Upload New Prescription</a>
        <a href="https://rapidcapsule.com/support" class="button-secondary">Contact Support</a>
      </center>
      <p style="color: #78909c; font-size: 14px; line-height: 1.6; margin-top: 30px;">
        <strong>Need Help?</strong> If you believe this rejection was made in error or have questions, please contact our support team.
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

/**
 * Data interface for clarification needed emails
 */
export interface PrescriptionClarificationNeededEmailData {
  patientName: string;
  prescriptionNumber: string;
  clarificationRequest: string;
  requiredInformation?: string[];
  responseDeadline?: string;
  prescriptionUrl?: string;
}

/**
 * Email sent when clarification is needed for a prescription
 */
export const prescriptionClarificationNeededEmail = (data: PrescriptionClarificationNeededEmailData) => {
  const requiredInfoHtml = data.requiredInformation?.length ? '<div class="info-card" style="background: #fff3e0; border-left-color: #ff9800;"><h3>Information Needed</h3><ul style="margin: 10px 0; padding-left: 20px; color: #e65100;">' + data.requiredInformation.map(info => '<li style="margin: 8px 0;">' + info + '</li>').join('') + '</ul></div>' : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .action-card { background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border: 2px solid #ff9800; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
    .action-card h2 { margin: 0 0 10px; color: #e65100; font-size: 22px; }
    .action-card p { margin: 0; color: #f57c00; font-size: 15px; }
    .info-card { background: #f8f9fa; border-left: 4px solid #ff9800; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .info-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .clarification-box { background: #fafafa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .clarification-box p { margin: 0; color: #2c3e50; font-size: 15px; line-height: 1.6; font-style: italic; }
    .deadline-badge { display: inline-block; background: #ffcdd2; color: #c62828; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-top: 15px; }
    .button { display: inline-block; background-color: #ff9800; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #ff9800; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Action Required</h1>
      <p>We need more information about your prescription</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>\${data.patientName}</strong>,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        Our pharmacist team has reviewed your prescription <strong>\${data.prescriptionNumber}</strong> and needs some additional information before we can proceed.
      </p>
      <div class="action-card">
        <h2>Your Response Needed</h2>
        <p>Please provide the requested information</p>
        \${data.responseDeadline ? '<span class="deadline-badge">Please respond by: ' + data.responseDeadline + '</span>' : ''}
      </div>
      <div class="info-card">
        <h3>Pharmacist's Request</h3>
        <div class="clarification-box">
          <p>"\${data.clarificationRequest}"</p>
        </div>
      </div>
      \${requiredInfoHtml}
      <div class="info-card" style="background: #e3f2fd; border-left-color: #1a73e8;">
        <h3>How to Respond</h3>
        <p>Click the button below to view your prescription and submit your response. You can also upload additional documents if needed.</p>
      </div>
      <center>
        <a href="\${data.prescriptionUrl || 'https://rapidcapsule.com/app/patient/prescriptions'}" class="button">Respond Now</a>
      </center>
      <p style="color: #78909c; font-size: 14px; line-height: 1.6; margin-top: 30px;">
        <strong>Important:</strong> Your prescription will remain on hold until we receive your response. If you have any questions, please contact our support team.
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

/**
 * Data interface for clarification received confirmation emails
 */
export interface PrescriptionClarificationReceivedEmailData {
  patientName: string;
  prescriptionNumber: string;
  responseSubmittedAt: string;
  estimatedReviewTime?: string;
  prescriptionUrl?: string;
}

/**
 * Email sent when patient submits clarification response
 */
export const prescriptionClarificationReceivedEmail = (data: PrescriptionClarificationReceivedEmailData) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .received-card { background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
    .received-card h2 { margin: 0 0 10px; color: #1565c0; font-size: 20px; }
    .received-card p { margin: 0; color: #1976d2; font-size: 15px; }
    .info-card { background: #f8f9fa; border-left: 4px solid #1a73e8; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .info-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .button { display: inline-block; background-color: #1a73e8; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #1a73e8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Response Received</h1>
      <p>Thank you for providing the requested information</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>\${data.patientName}</strong>,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        We've received your response for prescription <strong>\${data.prescriptionNumber}</strong>. Our pharmacist team will now continue reviewing your prescription.
      </p>
      <div class="received-card">
        <h2>Response Submitted Successfully</h2>
        <p>Submitted on \${data.responseSubmittedAt}</p>
      </div>
      <div class="info-card">
        <h3>What Happens Next</h3>
        <p>Our pharmacist team will review your response and the additional information you provided.</p>
        \${data.estimatedReviewTime ? '<p><strong>Estimated review time:</strong> ' + data.estimatedReviewTime + '</p>' : ''}
        <p>You'll receive another email once the review is complete.</p>
      </div>
      <div class="info-card" style="background: #e8f5e9; border-left-color: #4caf50;">
        <h3>No Further Action Required</h3>
        <p>You don't need to do anything else right now. We'll notify you as soon as there's an update on your prescription.</p>
      </div>
      <center>
        <a href="\${data.prescriptionUrl || 'https://rapidcapsule.com/app/patient/prescriptions'}" class="button">View Prescription Status</a>
      </center>
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

/**
 * Data interface for new prescription to review alert (for pharmacists)
 */
export interface NewPrescriptionToReviewEmailData {
  pharmacistName: string;
  prescriptionNumber: string;
  patientName: string;
  uploadDate: string;
  fraudScore: number;
  riskLevel: string;
  flagCount: number;
  reviewUrl: string;
}

/**
 * Email sent to pharmacists when a new prescription needs review
 */
export const newPrescriptionToReviewEmail = (data: NewPrescriptionToReviewEmailData) => {
  const riskColor = data.riskLevel === 'CRITICAL' || data.riskLevel === 'HIGH' ? '#f44336' :
                    data.riskLevel === 'MEDIUM' ? '#ff9800' : '#4caf50';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #673ab7 0%, #512da8 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .header p { color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .alert-card { background: linear-gradient(135deg, #ede7f6 0%, #d1c4e9 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center; }
    .alert-card h2 { margin: 0 0 10px; color: #512da8; font-size: 20px; }
    .risk-badge { display: inline-block; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 700; color: #ffffff; margin: 10px 0; }
    .info-card { background: #f8f9fa; border-left: 4px solid #673ab7; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-card h3 { margin: 0 0 10px; color: #2c3e50; font-size: 18px; }
    .info-card p { margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6; }
    .metrics { display: flex; justify-content: space-around; margin: 20px 0; }
    .metric { text-align: center; }
    .metric-value { font-size: 28px; font-weight: 700; color: #2c3e50; }
    .metric-label { font-size: 12px; color: #78909c; text-transform: uppercase; }
    .button { display: inline-block; background-color: #673ab7; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0; }
    .footer p { margin: 5px 0; color: #78909c; font-size: 14px; }
    .footer a { color: #673ab7; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Prescription Review</h1>
      <p>A prescription requires your attention</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Hello <strong>\${data.pharmacistName}</strong>,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        A new prescription upload has been flagged for pharmacist review.
      </p>
      <div class="alert-card">
        <h2>\${data.prescriptionNumber}</h2>
        <span class="risk-badge" style="background: \${riskColor};">\${data.riskLevel} RISK</span>
      </div>
      <div class="info-card">
        <h3>Prescription Details</h3>
        <p><strong>Patient:</strong> \${data.patientName}</p>
        <p><strong>Uploaded:</strong> \${data.uploadDate}</p>
        <p><strong>Prescription #:</strong> \${data.prescriptionNumber}</p>
      </div>
      <div class="metrics">
        <div class="metric">
          <div class="metric-value" style="color: \${riskColor};">\${data.fraudScore}</div>
          <div class="metric-label">Fraud Score</div>
        </div>
        <div class="metric">
          <div class="metric-value">\${data.flagCount}</div>
          <div class="metric-label">Flags Detected</div>
        </div>
      </div>
      <center>
        <a href="\${data.reviewUrl}" class="button">Review Prescription</a>
      </center>
      <p style="color: #78909c; font-size: 14px; line-height: 1.6; margin-top: 30px; text-align: center;">
        This is an automated alert from the Rapid Capsule prescription verification system.
      </p>
    </div>
    <div class="footer">
      <p><strong>Rapid Capsule - Admin Portal</strong></p>
      <p>Prescription Verification System</p>
    </div>
  </div>
</body>
</html>
  `;
};
