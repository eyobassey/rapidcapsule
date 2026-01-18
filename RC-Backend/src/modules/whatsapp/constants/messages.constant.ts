/**
 * WhatsApp message templates and text constants
 */

export const MESSAGES = {
  // Welcome & Menu
  WELCOME_UNVERIFIED: `Welcome to Rapid Capsule Pharmacy!

To use our prescription service, I need to verify your identity.

Do you have an existing Rapid Capsule account?

1. Yes, Link Account
2. No, Create Account

Reply with 1 or 2 to continue.`,

  MENU: (name?: string) => `${name ? `Hello ${name}!` : 'Hello!'} How can I help you today?

1. Upload a prescription
2. View my prescriptions
3. Track an order
4. Speak to a pharmacist
5. Help

Reply with a number to get started.`,

  // Account Linking
  ACCOUNT_LINK_ENTER_EMAIL: 'Please enter your registered email or phone number:',

  ACCOUNT_LINK_OTP_SENT: (method: string) =>
    `I've sent a 6-digit verification code to your ${method}. Please enter it here.`,

  ACCOUNT_LINK_SUCCESS: (name: string) =>
    `Account linked successfully! Hello ${name}, your WhatsApp is now connected to your Rapid Capsule account.`,

  ACCOUNT_LINK_NOT_FOUND:
    "I couldn't find an account with that email/phone. Please check and try again, or create a new account.",

  ACCOUNT_LINK_ALREADY_LINKED:
    'This account is already linked to another WhatsApp number. Please unlink it first from your app settings.',

  ACCOUNT_NEW_USER: `To create a new account, please visit our website or download our app:

Web: https://rapidcapsule.com/signup
App Store: [Link]
Play Store: [Link]

Once you've created an account, come back and send "hi" to link your WhatsApp.`,

  // OTP Errors
  OTP_EXPIRED: 'Verification code has expired. Please request a new one.',
  OTP_INVALID: (remaining: number) =>
    `Incorrect code. ${remaining} attempts remaining. Please try again.`,
  OTP_BLOCKED:
    'Too many failed attempts. Your WhatsApp has been temporarily blocked. Please try again in 24 hours.',
  OTP_NO_PENDING: 'No pending verification found. Please start over.',

  // Prescription Upload
  PRESCRIPTION_UPLOAD_PROMPT: `Please send a clear photo of your prescription.

Tips for best results:
- Good lighting
- Straight angle
- Full prescription visible
- No shadows or glare

Send "cancel" to go back to the menu.`,

  PRESCRIPTION_RECEIVED: `Prescription received!

I'm analyzing your prescription now. This usually takes 1-2 minutes.

I'll notify you when it's ready.`,

  PRESCRIPTION_PROCESSING: `Your prescription is being processed.

Current status: Verifying prescription details...

I'll notify you when it's complete.`,

  PRESCRIPTION_VERIFIED: (
    medications: Array<{ name: string; dosage: string; quantity: string }>,
    total: string,
  ) => {
    const medicationList = medications
      .map((m, i) => `${i + 1}. ${m.name} (${m.dosage}) x${m.quantity}`)
      .join('\n');

    return `Your prescription has been verified!

*Medications found:*
${medicationList}

*Estimated Total:* ${total}

Would you like to order these medications?
1. Order Now
2. View Details
3. Not Now

Reply with a number to continue.`;
  },

  PRESCRIPTION_FAILED: (reason: string) =>
    `Sorry, we couldn't verify your prescription.

Reason: ${reason}

Please try:
1. Upload a clearer photo
2. Speak to a pharmacist

Reply with a number or send "menu" for other options.`,

  PRESCRIPTION_NEEDS_REVIEW: `Your prescription needs additional review by our pharmacist.

Estimated time: 30 minutes to 1 hour

You'll receive a notification when it's ready. Feel free to continue using other features.

Send "menu" for options.`,

  PRESCRIPTION_CLARIFICATION: (message: string, items: string[]) =>
    `Our pharmacist needs some clarification about your prescription.

*Request:*
${message}

${items.length > 0 ? `*Please provide:*\n${items.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}` : ''}

Reply with the requested information, or send a new photo if needed.`,

  // Order Flow
  ORDER_CONFIRM: (
    medications: Array<{ name: string; quantity: string; price: string }>,
    subtotal: string,
    delivery: string,
    total: string,
  ) => {
    const medicationList = medications
      .map((m, i) => `${i + 1}. ${m.name} x${m.quantity} - ${m.price}`)
      .join('\n');

    return `*Order Summary*

${medicationList}

Subtotal: ${subtotal}
Delivery: ${delivery}
*Total: ${total}*

1. Confirm & Pay
2. Change Delivery Method
3. Cancel Order

Reply with a number.`;
  },

  ORDER_CREATED: (orderNumber: string, estimatedDelivery: string) =>
    `Your order has been placed!

*Order Number:* ${orderNumber}
*Estimated Delivery:* ${estimatedDelivery}

You'll receive updates as your order progresses.

Send "menu" for options.`,

  ORDER_PAYMENT_LINK: (paymentUrl: string) =>
    `Please complete your payment using this link:

${paymentUrl}

This link expires in 30 minutes.

You'll receive a confirmation once payment is complete.`,

  ORDER_PAYMENT_SUCCESS: (orderNumber: string, amountPaid: number, estimatedDelivery: string) =>
    `Payment received! Thank you.

*Order Confirmed*
Order Number: ${orderNumber}
Amount Paid: ₦${amountPaid.toLocaleString()}
Estimated Ready: ${estimatedDelivery}

You'll receive updates as your order progresses.

Send "track" to check your order status.`,

  ORDER_PROCESSING: (orderNumber: string) =>
    `*Order Update*

Your order ${orderNumber} is now being processed by the pharmacy.

We'll notify you when it's ready!`,

  ORDER_READY_PICKUP: (orderNumber: string, pharmacyName: string, pharmacyAddress: string, pickupCode: string) =>
    `*Ready for Pickup!*

Your order ${orderNumber} is ready to be picked up.

*Pickup Location:*
${pharmacyName}
${pharmacyAddress}

*Pickup Code:* ${pickupCode}

Please bring a valid ID and this code when picking up your order.`,

  ORDER_OUT_FOR_DELIVERY: (orderNumber: string, estimatedArrival: string) =>
    `*Order On The Way!*

Your order ${orderNumber} is out for delivery.

Estimated arrival: ${estimatedArrival}

Our delivery partner will contact you shortly.`,

  ORDER_DELIVERED: (orderNumber: string) =>
    `*Order Delivered!*

Your order ${orderNumber} has been delivered.

Thank you for choosing Rapid Capsule!

We'd love to hear your feedback. Reply "rate" to share your experience.`,

  ORDER_CANCELLED: (orderNumber: string, reason: string) =>
    `*Order Cancelled*

Your order ${orderNumber} has been cancelled.

Reason: ${reason}

If you paid for this order, a refund will be processed within 3-5 business days.

Send "menu" to place a new order.`,

  ORDER_STATUS: (orderNumber: string, status: string, details: string) =>
    `*Order Status*

Order: ${orderNumber}
Status: ${status}

${details}

Send "menu" for options.`,

  // Queue Notifications
  QUEUE_OCR_REVIEW: (estimatedTime: string) =>
    `Your prescription needs a quick review by our pharmacist.

Estimated time: ${estimatedTime}

You'll be notified once it's complete.`,

  QUEUE_CONTROLLED_SUBSTANCE: (estimatedTime: string) =>
    `Your prescription contains medication that requires additional verification.

A pharmacist will review your prescription and may contact you or your prescriber for verification.

Estimated time: ${estimatedTime}

You'll receive a notification when complete.`,

  QUEUE_PHARMACIST_ESCALATION: `Your request has been forwarded to a pharmacist.

A pharmacist will respond to your message shortly. Our team typically responds within 30 minutes during business hours (8am - 8pm WAT).

Send "cancel" to return to the menu.`,

  // Session Management
  SESSION_TIMEOUT_WARNING:
    'Your session will expire in 5 minutes due to inactivity.\n\nSend any message to continue.',

  SESSION_EXPIRED:
    "Your session has expired for security.\n\nSend 'hi' to start a new session.",

  // Errors & Help
  ERROR_GENERIC:
    "Sorry, something went wrong. Please try again or send 'menu' to start over.\n\nIf the problem persists, reply 'human' to speak with a pharmacist.",

  ERROR_RATE_LIMIT: (retryAfter?: string) => {
    let text = "You've made too many requests. Please slow down.";
    if (retryAfter) {
      text += `\n\nYou can try again ${retryAfter}.`;
    }
    return text;
  },

  HELP: `*Rapid Capsule WhatsApp Help*

*Available Commands:*
- menu - Show main menu
- help - Show this help message
- cancel - Cancel current action
- human - Speak to a pharmacist
- stop - Unsubscribe from messages

*How to upload a prescription:*
1. Send "menu" and select option 1
2. Take a clear photo of your prescription
3. Send the photo
4. We'll verify and process it

*Need more help?*
Visit: https://rapidcapsule.com/help
Email: support@rapidcapsule.com
Call: +234 800 RAPID CAPSULE

Send "menu" to continue.`,

  OPT_OUT:
    'You have been unsubscribed from Rapid Capsule WhatsApp messages. Send "start" to resubscribe.',

  CANCELLED: 'Cancelled. Send "menu" to see available options.',

  INVALID_INPUT: (hint?: string) =>
    `I didn't understand that.${hint ? `\n\n${hint}` : ''}\n\nSend "menu" for options or "help" for assistance.`,

  FEATURE_COMING_SOON: (feature: string) =>
    `${feature} is coming soon! For now, please check this feature in the Rapid Capsule app.\n\nSend "menu" for other options.`,

  // Blocked User
  BLOCKED: (reason?: string, expiresAt?: Date) => {
    let text = 'Your account is temporarily blocked.';
    if (reason) text += ` Reason: ${reason}`;
    if (expiresAt) {
      text += `\n\nYou can try again after ${expiresAt.toLocaleString()}.`;
    }
    text += '\n\nPlease contact support if you believe this is an error.';
    return text;
  },
};

/**
 * Button option mappings for menu selections
 */
export const MENU_OPTIONS: Record<string, string> = {
  '1': 'UPLOAD_PRESCRIPTION',
  '2': 'VIEW_PRESCRIPTIONS',
  '3': 'TRACK_ORDER',
  '4': 'SPEAK_TO_PHARMACIST',
  '5': 'HELP',
};

/**
 * Global commands that can be used anytime
 */
export const GLOBAL_COMMANDS: Record<string, string> = {
  menu: 'SHOW_MENU',
  hi: 'SHOW_MENU',
  hello: 'SHOW_MENU',
  start: 'SHOW_MENU',
  help: 'SHOW_HELP',
  cancel: 'CANCEL_FLOW',
  stop: 'OPT_OUT',
  human: 'REQUEST_HUMAN',
  pharmacist: 'REQUEST_HUMAN',
};

/**
 * Yes/No response mappings
 */
export const YES_RESPONSES = ['yes', 'y', 'yeah', 'yep', 'sure', 'ok', 'okay', '1'];
export const NO_RESPONSES = ['no', 'n', 'nope', 'nah', 'cancel', '2'];
