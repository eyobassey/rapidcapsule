import { mailGenerator } from '../mailgen';

export const trialOtpEmail = (
  firstName: string,
  otpCode: string,
  magicLink: string,
) => {
  const email = {
    body: {
      name: firstName,
      intro: [
        "Welcome to Rapid Capsule! You're about to meet Eka, your AI health companion.",
        `Your verification code is: <strong style="font-size: 28px; letter-spacing: 6px; color: #FF5C00;">${otpCode}</strong>`,
        'Enter this code in the Eka chat to verify your email and start your free trial.',
      ],
      action: {
        instructions:
          'Or click the button below to verify directly:',
        button: {
          color: '#FF5C00',
          text: 'Verify & Start Trial',
          link: magicLink,
        },
      },
      outro: [
        'The code expires in 15 minutes. The link expires in 48 hours.',
        'You get free access to Eka AI, Symptom Checker, RxGPT, and Prescription Verifier.',
        'If you did not request this trial, please ignore this email.',
      ],
    },
  };
  return mailGenerator.generate(email);
};
