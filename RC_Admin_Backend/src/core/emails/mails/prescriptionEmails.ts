/**
 * Prescription Email Templates
 * Used to notify patients about prescription/order status changes
 */

export interface PrescriptionItem {
  drug_name: string;
  generic_name?: string;
  drug_strength?: string;
  quantity: number;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  unit_price: number;
  total_price: number;
}

export interface OrderEmailData {
  patientName: string;
  prescriptionNumber: string;
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
  isPickup: boolean;
  trackingNumber?: string;
  courierName?: string;
  estimatedDelivery?: string;
  shippingMethod?: string;
}

/**
 * Generate medications table HTML
 */
const generateMedicationsTable = (items: PrescriptionItem[], currency: string) => {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
        <strong style="color: #2c3e50;">${item.drug_name}</strong>
        ${item.generic_name ? `<br><span style="color: #78909c; font-size: 13px;">${item.generic_name}</span>` : ''}
        ${item.drug_strength ? `<br><span style="color: #78909c; font-size: 13px;">${item.drug_strength}</span>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
        <span style="color: #2c3e50;">${item.dosage}</span><br>
        <span style="color: #78909c; font-size: 13px;">${item.frequency} for ${item.duration}</span>
        ${item.instructions ? `<br><span style="color: #546e7a; font-size: 12px; font-style: italic;">${item.instructions}</span>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">${currency} ${item.total_price.toLocaleString()}</td>
    </tr>
  `).join('');

  return `
    <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
      <thead>
        <tr>
          <th style="background: #f8f9fa; padding: 12px; text-align: left; color: #2c3e50; font-weight: 600; border-bottom: 2px solid #e0e0e0;">Medication</th>
          <th style="background: #f8f9fa; padding: 12px; text-align: center; color: #2c3e50; font-weight: 600; border-bottom: 2px solid #e0e0e0;">Qty</th>
          <th style="background: #f8f9fa; padding: 12px; text-align: left; color: #2c3e50; font-weight: 600; border-bottom: 2px solid #e0e0e0;">Dosage</th>
          <th style="background: #f8f9fa; padding: 12px; text-align: right; color: #2c3e50; font-weight: 600; border-bottom: 2px solid #e0e0e0;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
  `;
};

/**
 * Generate order totals HTML
 */
const generateTotals = (subtotal: number, deliveryFee: number, totalAmount: number, currency: string) => {
  return `
    <div style="margin: 25px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
      <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #546e7a;">
        <span>Subtotal</span>
        <span>${currency} ${subtotal.toLocaleString()}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #546e7a;">
        <span>Delivery Fee</span>
        <span>${currency} ${deliveryFee.toLocaleString()}</span>
      </div>
      <div style="display: flex; justify-content: space-between; border-top: 2px solid #e0e0e0; margin-top: 10px; padding-top: 15px; font-weight: 600; color: #2c3e50; font-size: 18px;">
        <span>Total</span>
        <span>${currency} ${totalAmount.toLocaleString()}</span>
      </div>
    </div>
  `;
};

/**
 * Generate delivery address card HTML
 */
const generateDeliveryCard = (address: OrderEmailData['deliveryAddress'], patientName: string) => {
  if (!address) return '';
  return `
    <div style="background: #e3f2fd; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h3 style="margin: 0 0 15px; color: #1565c0; font-size: 16px;">📍 Delivery Address</h3>
      <p style="margin: 0; color: #1565c0;">
        ${address.recipient_name || patientName}<br>
        ${address.street}<br>
        ${address.city}, ${address.state}<br>
        Phone: ${address.phone}
      </p>
    </div>
  `;
};

/**
 * Email sent when order status changes to processing
 */
export const orderProcessingEmail = (data: OrderEmailData) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">⚙️ Order Being Processed</h1>
      <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95;">Your prescription is being prepared</p>
    </div>

    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>

      <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center;">
        <h2 style="margin: 0 0 10px; color: #1565c0; font-size: 24px;">Your Order is Being Processed</h2>
        <p style="margin: 10px 0 0; color: #1976d2; font-size: 16px;">Prescription #${data.prescriptionNumber}</p>
      </div>

      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        Great news! We have received your order and our pharmacy team is now preparing your medications.
      </p>

      <h3 style="color: #2c3e50; margin: 30px 0 15px;">📋 Your Medications</h3>
      ${generateMedicationsTable(data.items, data.currency)}
      ${generateTotals(data.subtotal, data.deliveryFee, data.totalAmount, data.currency)}

      ${data.isPickup ? '' : generateDeliveryCard(data.deliveryAddress, data.patientName)}

      <div style="background: #f8f9fa; border-left: 4px solid #1a73e8; padding: 20px; margin: 25px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 10px; color: #2c3e50; font-size: 18px;">What's Next?</h3>
        <p style="margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6;">
          ${data.isPickup
            ? 'You\'ll receive another email once your medications have been dispensed and are ready for pickup.'
            : 'You\'ll receive another email once your medications have been dispensed and shipped to you.'
          }
        </p>
      </div>

      <center>
        <a href="https://rapidcapsule.com/app/patient/prescriptions" style="display: inline-block; background-color: #1a73e8; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0;">Track Your Order</a>
      </center>
    </div>

    <div style="background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="margin: 5px 0; color: #78909c; font-size: 14px;"><strong>Rapid Capsule</strong></p>
      <p style="margin: 5px 0; color: #78909c; font-size: 14px;">Your healthcare, delivered.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Email sent when order is dispensed
 */
export const orderDispensedEmail = (data: OrderEmailData) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #7c4dff 0%, #536dfe 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">💊 Medications Dispensed</h1>
      <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95;">Your prescription has been prepared</p>
    </div>

    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>

      <div style="background: linear-gradient(135deg, #ede7f6 0%, #d1c4e9 100%); border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center;">
        <h2 style="margin: 0 0 10px; color: #512da8; font-size: 24px;">Your Medications Are Ready!</h2>
        <p style="margin: 10px 0 0; color: #673ab7; font-size: 16px;">Prescription #${data.prescriptionNumber}</p>
      </div>

      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        ${data.isPickup
          ? 'Your medications have been dispensed and are ready for pickup at the pharmacy.'
          : 'Your medications have been dispensed and will be shipped to you shortly.'
        }
      </p>

      <h3 style="color: #2c3e50; margin: 30px 0 15px;">📋 Dispensed Medications</h3>
      ${generateMedicationsTable(data.items, data.currency)}
      ${generateTotals(data.subtotal, data.deliveryFee, data.totalAmount, data.currency)}

      ${data.isPickup ? `
        <div style="background: #fff3e0; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <h3 style="margin: 0 0 15px; color: #e65100; font-size: 16px;">🏪 Pickup Location</h3>
          <p style="margin: 0; color: #e65100;">
            <strong>Rapid Capsule Pharmacy</strong><br>
            Hours: Mon-Fri 8am-6pm, Sat 9am-2pm
          </p>
        </div>
        <div style="margin: 25px 0; padding: 20px; background: #fafafa; border-radius: 8px;">
          <h3 style="margin: 0 0 15px; color: #2c3e50;">What to Bring</h3>
          <p style="margin: 8px 0; color: #546e7a;">✓ Valid ID (Driver's License, National ID, or Passport)</p>
          <p style="margin: 8px 0; color: #546e7a;">✓ Prescription number: <strong>${data.prescriptionNumber}</strong></p>
        </div>
      ` : generateDeliveryCard(data.deliveryAddress, data.patientName)}

      <div style="background: #f8f9fa; border-left: 4px solid #7c4dff; padding: 20px; margin: 25px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 10px; color: #2c3e50; font-size: 18px;">What's Next?</h3>
        <p style="margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6;">
          ${data.isPickup
            ? 'Please visit the pharmacy to collect your medications. Remember to bring a valid ID.'
            : 'Your order will be handed over to our delivery partner. You\'ll receive shipping details in your next update.'
          }
        </p>
      </div>

      <center>
        <a href="https://rapidcapsule.com/app/patient/prescriptions" style="display: inline-block; background-color: #7c4dff; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0;">View Order Details</a>
      </center>
    </div>

    <div style="background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="margin: 5px 0; color: #78909c; font-size: 14px;"><strong>Rapid Capsule</strong></p>
      <p style="margin: 5px 0; color: #78909c; font-size: 14px;">Your healthcare, delivered.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Email sent when prescription is shipped
 */
export const prescriptionShippedEmail = (data: OrderEmailData) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">📦 Your Order is On Its Way!</h1>
      <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95;">Your prescription has been shipped</p>
    </div>

    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>
      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        Great news! Your prescription <strong>#${data.prescriptionNumber}</strong> has been shipped and is on its way to you.
      </p>

      ${data.trackingNumber ? `
        <div style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
          <h3 style="margin: 0 0 15px; color: #e65100; font-size: 18px;">📍 Tracking Number</h3>
          <div style="font-size: 28px; font-weight: 700; color: #e65100; letter-spacing: 2px; margin: 10px 0;">${data.trackingNumber}</div>
          ${data.courierName ? `<p style="margin: 10px 0 0; color: #e65100;">via ${data.courierName}</p>` : ''}
        </div>
      ` : ''}

      <div style="background: #f8f9fa; border-left: 4px solid #ff9800; padding: 20px; margin: 25px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 10px; color: #2c3e50; font-size: 18px;">🚚 Shipping Details</h3>
        <p style="margin: 8px 0; color: #546e7a; font-size: 15px;"><strong>Prescription #:</strong> ${data.prescriptionNumber}</p>
        <p style="margin: 8px 0; color: #546e7a; font-size: 15px;"><strong>Shipping Method:</strong> ${data.shippingMethod || 'Standard Delivery'}</p>
        ${data.courierName ? `<p style="margin: 8px 0; color: #546e7a; font-size: 15px;"><strong>Courier:</strong> ${data.courierName}</p>` : ''}
        ${data.estimatedDelivery ? `<p style="margin: 8px 0; color: #546e7a; font-size: 15px;"><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>` : ''}
      </div>

      <h3 style="color: #2c3e50; margin: 30px 0 15px;">📋 Items Being Shipped</h3>
      ${generateMedicationsTable(data.items, data.currency)}
      ${generateTotals(data.subtotal, data.deliveryFee, data.totalAmount, data.currency)}
      ${generateDeliveryCard(data.deliveryAddress, data.patientName)}

      <center>
        <a href="https://rapidcapsule.com/app/patient/prescriptions" style="display: inline-block; background-color: #ff9800; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0;">Track Your Order</a>
      </center>
    </div>

    <div style="background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="margin: 5px 0; color: #78909c; font-size: 14px;"><strong>Rapid Capsule</strong></p>
      <p style="margin: 5px 0; color: #78909c; font-size: 14px;">Your healthcare, delivered.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Email sent when prescription is delivered
 */
export const prescriptionDeliveredEmail = (data: OrderEmailData) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🎉 Delivered!</h1>
      <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95;">Your prescription has arrived</p>
    </div>

    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>

      <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center;">
        <h2 style="margin: 0 0 10px; color: #2e7d32; font-size: 24px;">✅ Delivery Complete</h2>
        <p style="margin: 10px 0 0; color: #388e3c; font-size: 16px;">Prescription #${data.prescriptionNumber}</p>
      </div>

      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        Your prescription has been successfully delivered. We hope you're feeling better soon!
      </p>

      <h3 style="color: #2c3e50; margin: 30px 0 15px;">📋 Delivered Medications</h3>
      ${generateMedicationsTable(data.items, data.currency)}
      ${generateTotals(data.subtotal, data.deliveryFee, data.totalAmount, data.currency)}

      <div style="background: #f8f9fa; border-left: 4px solid #4caf50; padding: 20px; margin: 25px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 10px; color: #2c3e50; font-size: 18px;">📋 Medication Reminders</h3>
        <p style="margin: 8px 0; color: #546e7a; font-size: 15px;">• Take your medications exactly as prescribed</p>
        <p style="margin: 8px 0; color: #546e7a; font-size: 15px;">• Store medications properly according to the instructions</p>
        <p style="margin: 8px 0; color: #546e7a; font-size: 15px;">• Complete your full course of treatment</p>
        <p style="margin: 8px 0; color: #546e7a; font-size: 15px;">• Contact your doctor if you experience any side effects</p>
      </div>

      <center>
        <a href="https://rapidcapsule.com/app/patient/prescriptions" style="display: inline-block; background-color: #4caf50; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0;">View Prescription</a>
      </center>

      <p style="color: #78909c; font-size: 14px; line-height: 1.6; margin-top: 30px; text-align: center;">
        Need to reorder? You can request a refill through your dashboard.
      </p>
    </div>

    <div style="background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="margin: 5px 0; color: #78909c; font-size: 14px;"><strong>Rapid Capsule</strong></p>
      <p style="margin: 5px 0; color: #78909c; font-size: 14px;">Your healthcare, delivered.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Interface for prescription review email data
 */
export interface PrescriptionReviewEmailData {
  patientName: string;
  prescriptionNumber: string;
  reviewNotes?: string;
  rejectionReason?: string;
  validUntil?: string;
  clarificationMessage?: string;
  requiredInformation?: string[];
  responseDeadline?: string;
}

/**
 * Email sent when pharmacist approves a prescription
 */
export const prescriptionApprovedEmail = (data: PrescriptionReviewEmailData) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">✅ Prescription Approved</h1>
      <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95;">Your prescription has been verified</p>
    </div>

    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>

      <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center;">
        <h2 style="margin: 0 0 10px; color: #2e7d32; font-size: 24px;">Prescription Approved!</h2>
        <p style="margin: 10px 0 0; color: #388e3c; font-size: 16px;">Reference: ${data.prescriptionNumber}</p>
      </div>

      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        Great news! Your prescription has been reviewed and approved by our pharmacy team. You can now use this prescription to order medications through the Rapid Capsule platform.
      </p>

      ${data.validUntil ? `
        <div style="background: #f8f9fa; border-left: 4px solid #4caf50; padding: 20px; margin: 25px 0; border-radius: 8px;">
          <h3 style="margin: 0 0 10px; color: #2c3e50; font-size: 18px;">📅 Prescription Validity</h3>
          <p style="margin: 8px 0; color: #546e7a; font-size: 15px;">Your prescription is valid until: <strong>${data.validUntil}</strong></p>
        </div>
      ` : ''}

      ${data.reviewNotes ? `
        <div style="background: #e3f2fd; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <h3 style="margin: 0 0 15px; color: #1565c0; font-size: 16px;">💬 Pharmacist Notes</h3>
          <p style="margin: 0; color: #1976d2; font-size: 15px;">${data.reviewNotes}</p>
        </div>
      ` : ''}

      <div style="background: #f8f9fa; border-left: 4px solid #1a73e8; padding: 20px; margin: 25px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 10px; color: #2c3e50; font-size: 18px;">What's Next?</h3>
        <p style="margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6;">
          You can now browse our pharmacy and order medications using this prescription. Simply go to your prescriptions page and start adding items to your cart.
        </p>
      </div>

      <center>
        <a href="https://rapidcapsule.com/app/patient/prescriptions" style="display: inline-block; background-color: #4caf50; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0;">Order Medications</a>
      </center>
    </div>

    <div style="background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="margin: 5px 0; color: #78909c; font-size: 14px;"><strong>Rapid Capsule</strong></p>
      <p style="margin: 5px 0; color: #78909c; font-size: 14px;">Your healthcare, delivered.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Email sent when pharmacist rejects a prescription
 */
export const prescriptionRejectedByPharmacistEmail = (data: PrescriptionReviewEmailData) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #f44336 0%, #c62828 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">❌ Prescription Not Approved</h1>
      <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95;">We were unable to verify your prescription</p>
    </div>

    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>

      <div style="background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center;">
        <h2 style="margin: 0 0 10px; color: #c62828; font-size: 24px;">Prescription Rejected</h2>
        <p style="margin: 10px 0 0; color: #d32f2f; font-size: 16px;">Reference: ${data.prescriptionNumber}</p>
      </div>

      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        We regret to inform you that after careful review, we were unable to approve your prescription. Our pharmacy team has provided the reason below.
      </p>

      <div style="background: #fff3e0; border-left: 4px solid #f44336; padding: 20px; margin: 25px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 10px; color: #c62828; font-size: 18px;">❗ Reason for Rejection</h3>
        <p style="margin: 8px 0; color: #d84315; font-size: 15px; line-height: 1.6;">${data.rejectionReason || 'The prescription could not be verified. Please contact support for more information.'}</p>
      </div>

      ${data.reviewNotes ? `
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <h3 style="margin: 0 0 15px; color: #2c3e50; font-size: 16px;">📝 Additional Notes</h3>
          <p style="margin: 0; color: #546e7a; font-size: 15px;">${data.reviewNotes}</p>
        </div>
      ` : ''}

      <div style="background: #e3f2fd; border-left: 4px solid #1a73e8; padding: 20px; margin: 25px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 10px; color: #2c3e50; font-size: 18px;">What Can You Do?</h3>
        <p style="margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6;">
          • Upload a clearer image of your prescription<br>
          • Ensure all required information is visible<br>
          • Contact your healthcare provider for a new prescription if needed<br>
          • Reach out to our support team if you have questions
        </p>
      </div>

      <center>
        <a href="https://rapidcapsule.com/app/patient/prescriptions/upload" style="display: inline-block; background-color: #1a73e8; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0;">Upload New Prescription</a>
      </center>
    </div>

    <div style="background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="margin: 5px 0; color: #78909c; font-size: 14px;"><strong>Rapid Capsule</strong></p>
      <p style="margin: 5px 0; color: #78909c; font-size: 14px;">Your healthcare, delivered.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Email sent when pharmacist requests clarification
 */
export const prescriptionClarificationNeededEmail = (data: PrescriptionReviewEmailData) => {
  const requiredInfoHtml = data.requiredInformation && data.requiredInformation.length > 0
    ? `
      <div style="background: #fff8e1; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <h3 style="margin: 0 0 15px; color: #f57c00; font-size: 16px;">📋 Required Information</h3>
        <ul style="margin: 0; padding-left: 20px; color: #e65100;">
          ${data.requiredInformation.map(info => `<li style="margin: 8px 0; font-size: 15px;">${info}</li>`).join('')}
        </ul>
      </div>
    `
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f7fa;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); padding: 40px 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">🔔 Clarification Needed</h1>
      <p style="color: #ffffff; margin: 10px 0 0; font-size: 16px; opacity: 0.95;">We need additional information about your prescription</p>
    </div>

    <div style="padding: 40px 30px;">
      <p style="font-size: 16px; color: #2c3e50; line-height: 1.6;">
        Dear <strong>${data.patientName}</strong>,
      </p>

      <div style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); border-radius: 12px; padding: 30px; margin: 25px 0; text-align: center;">
        <h2 style="margin: 0 0 10px; color: #e65100; font-size: 24px;">Action Required</h2>
        <p style="margin: 10px 0 0; color: #f57c00; font-size: 16px;">Reference: ${data.prescriptionNumber}</p>
      </div>

      <p style="font-size: 16px; color: #546e7a; line-height: 1.6;">
        Our pharmacy team has reviewed your prescription and requires some additional information before we can proceed.
      </p>

      <div style="background: #f8f9fa; border-left: 4px solid #ff9800; padding: 20px; margin: 25px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 10px; color: #2c3e50; font-size: 18px;">💬 Message from Pharmacist</h3>
        <p style="margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6;">${data.clarificationMessage || 'Please provide additional information about your prescription.'}</p>
      </div>

      ${requiredInfoHtml}

      ${data.responseDeadline ? `
        <div style="background: #ffebee; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
          <h3 style="margin: 0 0 10px; color: #c62828; font-size: 16px;">⏰ Response Deadline</h3>
          <p style="margin: 0; color: #d32f2f; font-size: 18px; font-weight: 600;">${data.responseDeadline}</p>
          <p style="margin: 10px 0 0; color: #e57373; font-size: 14px;">Please respond before this date to avoid delays</p>
        </div>
      ` : ''}

      <div style="background: #e3f2fd; border-left: 4px solid #1a73e8; padding: 20px; margin: 25px 0; border-radius: 8px;">
        <h3 style="margin: 0 0 10px; color: #2c3e50; font-size: 18px;">How to Respond</h3>
        <p style="margin: 8px 0; color: #546e7a; font-size: 15px; line-height: 1.6;">
          Click the button below to view your prescription and submit the requested information. You may need to upload additional documents or provide clarification.
        </p>
      </div>

      <center>
        <a href="https://rapidcapsule.com/app/patient/prescriptions" style="display: inline-block; background-color: #ff9800; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0;">Respond Now</a>
      </center>
    </div>

    <div style="background: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="margin: 5px 0; color: #78909c; font-size: 14px;"><strong>Rapid Capsule</strong></p>
      <p style="margin: 5px 0; color: #78909c; font-size: 14px;">Your healthcare, delivered.</p>
    </div>
  </div>
</body>
</html>
  `;
};
