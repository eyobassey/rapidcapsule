import { mailGenerator } from '../mailgen';

export const accountReactivatedEmail = (firstname: string) => {
  const email = {
    body: {
      name: firstname,
      intro: 'Good news! Your Rapid Capsule account has been reactivated.',
      table: {
        data: [
          {
            item: 'Account Status',
            description: 'Active'
          }
        ]
      },
      action: {
        instructions: 'You can now log in to your account and continue using our services.',
        button: {
          color: '#22BC66',
          text: 'Login to Your Account',
          link: 'https://rapidcapsule.com/login'
        }
      },
      outro: 'Thank you for your patience. We\'re glad to have you back!'
    },
  };
  return mailGenerator.generate(email);
};
