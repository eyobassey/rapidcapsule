import { mailGenerator } from '../mailgen';

export const accountDeactivatedEmail = (firstname: string, reason: string) => {
  const email = {
    body: {
      name: firstname,
      intro: 'Your Rapid Capsule account has been deactivated.',
      table: {
        data: [
          {
            item: 'Account Status',
            description: 'Deactivated'
          },
          {
            item: 'Reason',
            description: reason
          }
        ]
      },
      action: {
        instructions: 'If you believe this action was taken in error or you would like to appeal this decision, please contact our support team.',
        button: {
          color: '#DC3545',
          text: 'Contact Support',
          link: 'https://rapidcapsule.com/support'
        }
      },
      outro: 'We appreciate your understanding. If you have any questions, please reach out to our support team.'
    },
  };
  return mailGenerator.generate(email);
};
