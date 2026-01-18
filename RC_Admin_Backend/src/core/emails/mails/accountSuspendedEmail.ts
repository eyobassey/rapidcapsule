import { mailGenerator } from '../mailgen';

export const accountSuspendedEmail = (firstname: string, reason: string) => {
  const email = {
    body: {
      name: firstname,
      intro: 'Your Rapid Capsule account has been temporarily suspended.',
      table: {
        data: [
          {
            item: 'Account Status',
            description: 'Suspended'
          },
          {
            item: 'Reason',
            description: reason
          }
        ]
      },
      action: {
        instructions: 'If you believe this action was taken in error, please contact our support team.',
        button: {
          color: '#f39c12',
          text: 'Contact Support',
          link: 'https://rapidcapsule.com/support'
        }
      },
      outro: 'If you have any questions, please don\'t hesitate to reach out to our support team.'
    },
  };
  return mailGenerator.generate(email);
};
