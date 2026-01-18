import { mailGenerator } from '../mailgen';

export const profileUpdatedEmail = (firstname: string, userType: 'Patient' | 'Specialist') => {
  const loginUrl = userType === 'Specialist'
    ? 'https://rapidcapsule.com/specialist/login'
    : 'https://rapidcapsule.com/login';

  const email = {
    body: {
      name: firstname,
      intro: 'Your Rapid Capsule profile has been updated by our administrative team.',
      table: {
        data: [
          {
            item: 'Update Date',
            description: new Date().toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          },
          {
            item: 'Updated By',
            description: 'Rapid Capsule Administrative Team'
          },
          {
            item: 'Account Type',
            description: userType
          }
        ]
      },
      action: {
        instructions: 'You can review your updated profile information by logging into your account.',
        button: {
          color: '#22BC66',
          text: 'View Your Profile',
          link: loginUrl
        }
      },
      outro: [
        'If you did not request this change or have any questions about this update, please contact our support team immediately at support@rapidcapsule.com.',
        'For security reasons, we recommend reviewing your account information regularly.'
      ]
    },
  };
  return mailGenerator.generate(email);
};
