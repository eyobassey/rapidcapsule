import { mailGenerator } from '../mailgen';

export const trialEmail = (firstName: string, magicLink: string) => {
  const email = {
    body: {
      name: firstName,
      intro: [
        "Welcome to Rapid Capsule! You're about to experience our AI-powered healthcare tools.",
        'Click the button below to start your free trial of our Symptom Checker and RxGPT prescription verifier.',
      ],
      action: {
        instructions: 'Click the button below to access your trial:',
        button: {
          color: '#FF5C00',
          text: 'Start My Free Trial',
          link: magicLink,
        },
      },
      outro: [
        'This link expires in 48 hours.',
        'You get one free Symptom Check and one RxGPT prescription analysis.',
        'If you did not request this trial, please ignore this email.',
      ],
    },
  };
  return mailGenerator.generate(email);
};
