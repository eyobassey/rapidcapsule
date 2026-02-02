export default [
  {
    title: 'Dashboard',
    to: { name: 'index' },
    icon: { icon: 'bx-home-alt' },
  },
  {
    title: 'Patients',
    to: { name: 'patients' },
    icon: { icon: 'bx-user' },
  },
  {
    title: 'Specialists',
    to: { name: 'specialists' },
    icon: { icon: 'bx-git-repo-forked' },
  },
  {
    title: 'Appointments',
    to: { name: 'appointments' },
    icon: { icon: 'bx-plus-medical' },
  },
  {
    title: 'Referrals',
    icon: { icon: 'bx-share-alt' },
    children: [
      {
        title: 'Dashboard',
        to: { name: 'referrals' },
      },
      {
        title: 'Settings',
        to: { name: 'referrals-settings' },
      },
    ],
  },
  {
    title: 'Promotions',
    to: { name: 'second-page' },
    icon: { icon: 'bx-gift' },
  },
  {
    title: 'Analytics',
    to: { name: 'second-page' },
    icon: { icon: 'bx-bar-chart-square' },
  },
  {
    title: 'Finance',
    icon: { icon: 'mdi-wallet' },
    children: [
      {
        title: 'Dashboard',
        to: { name: 'finance' },
      },
      {
        title: 'Wallets',
        to: { name: 'finance-wallets' },
      },
      {
        title: 'Transactions',
        to: { name: 'finance-transactions' },
      },
      {
        title: 'Ledger',
        to: { name: 'finance-ledger' },
      },
      {
        title: 'Chart of Accounts',
        to: { name: 'finance-accounts' },
      },
      {
        title: 'Journal Entries',
        to: { name: 'finance-journal-entries' },
      },
      {
        title: 'Reports',
        to: { name: 'finance-reports' },
      },
    ],
  },
  {
    title: 'LifeGuards',
    to: { name: 'lifeguards' },
    icon: { icon: 'tabler:heartbeat' },
  },
  {
    title: 'AI Health Summary',
    icon: { icon: 'mdi-brain' },
    children: [
      {
        title: 'Analytics',
        to: { name: 'claude-summary' },
      },
      {
        title: 'Plans',
        to: { name: 'claude-summary-plans' },
      },
    ],
  },
  {
    title: 'Advanced Health Score',
    icon: { icon: 'mdi-clipboard-pulse' },
    children: [
      {
        title: 'Dashboard',
        to: { name: 'advanced-health-score' },
      },
      {
        title: 'Settings',
        to: { name: 'advanced-health-score-settings' },
      },
      {
        title: 'Questions',
        to: { name: 'advanced-health-score-questions' },
      },
    ],
  },
  {
    title: 'Settings',
    icon: { icon: 'bx-cog' },
    children: [
      {
        title: 'Languages',
        to: { name: 'languages' },
      },
      {
        title: 'Specialist Categories',
        to: { name: 'specialist-categories' },
      },
      {
        title: 'Consultation Services',
        to: { name: 'consultation-services' },
      },
    ],
  },
  {
    title: 'Pharmacy',
    icon: { icon: 'bx-capsule' },
    children: [
      {
        title: 'Dashboard',
        to: { name: 'pharmacy' },
      },
      {
        title: 'WhatsApp Queue',
        to: { name: 'pharmacy-whatsapp-queue' },
      },
      {
        title: 'Orders',
        to: { name: 'pharmacy-orders' },
      },
      {
        title: 'Prescriptions',
        to: { name: 'pharmacy-prescriptions' },
      },
      {
        title: 'Inventory',
        to: { name: 'pharmacy-inventory' },
      },
      {
        title: 'Ratings & Reviews',
        to: { name: 'pharmacy-ratings' },
      },
    ],
  },
]
