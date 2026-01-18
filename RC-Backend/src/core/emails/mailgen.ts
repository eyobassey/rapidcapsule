import * as Mailgen from 'mailgen';

export const mailGenerator = new Mailgen({
  theme: 'default',
  product: {
    // Appears in header & footer of e-mails
    name: 'Rapid Capsule',
    link: 'https://rapidcapsule.com/',
    copyright: `Copyright © ${new Date().getFullYear()} Rapid Capsule. All rights reserved.`,
    // Company logo - served from main website
    logo: 'https://rapidcapsule.com/RapidCapsule_Logo.png',
  },
});
