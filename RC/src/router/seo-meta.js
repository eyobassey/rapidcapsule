/**
 * Per-route SEO metadata definitions.
 * Used by the router afterEach guard to dynamically update <head> tags.
 */

export const routeSeoMeta = {
  // ── Public pages ──────────────────────────────────────────────
  Home: {
    title: 'Rapid Capsule — AI-Powered Telemedicine & Healthcare Platform',
    description:
      'Connect with medical specialists online. AI symptom checker, RxGPT prescription verification, video consultations, and pharmacy delivery — all in one platform.',
    keywords:
      'telemedicine, AI healthcare, online doctor, symptom checker, prescription verification, RxGPT, video consultation, pharmacy delivery, health checkup, digital prescriptions, medical specialists',
  },
  Login: {
    title: 'Log In — Rapid Capsule',
    description:
      'Log in to your Rapid Capsule account to access AI health checkups, specialist consultations, prescriptions, and more.',
  },
  'Signup-patient': {
    title: 'Sign Up as Patient — Rapid Capsule',
    description:
      'Create your free Rapid Capsule account. Get AI health assessments, book specialist video consultations, and manage prescriptions online.',
    keywords:
      'sign up, patient registration, telemedicine account, online healthcare, AI health checkup',
  },
  'Signup-specialist': {
    title: 'Join as a Specialist — Rapid Capsule',
    description:
      'Register as a healthcare specialist on Rapid Capsule. Reach patients remotely with video consultations, digital prescriptions, and AI-assisted tools.',
    keywords:
      'specialist registration, doctor sign up, telemedicine provider, online consultations',
  },
  'Privacy Policy': {
    title: 'Privacy Policy — Rapid Capsule',
    description:
      'Read how Rapid Capsule protects your health data with encryption, secure authentication, and HIPAA-aware data handling practices.',
  },
  'Terms of Service': {
    title: 'Terms of Service — Rapid Capsule',
    description:
      'Rapid Capsule terms of service. Understand the rules and guidelines for using our AI-powered telemedicine platform.',
  },

  // ── Trial pages ───────────────────────────────────────────────
  'Trial Verify': {
    title: 'Free Trial — Rapid Capsule',
    description:
      'Try Rapid Capsule free. Experience our AI symptom checker, RxGPT prescription verifier, and prescription upload — no sign-up required.',
    keywords:
      'free trial, AI symptom checker demo, prescription verification trial, telemedicine demo',
  },
  'Trial Symptom Checker': {
    title: 'Try AI Symptom Checker — Rapid Capsule Free Trial',
    description:
      'Experience our AI-powered symptom checker. Describe your symptoms and get intelligent triage assessment and specialist recommendations — free.',
  },
  'Trial RxGPT': {
    title: 'Try RxGPT Prescription Verifier — Rapid Capsule Free Trial',
    description:
      'Verify prescriptions against 6 clinical databases with RxGPT. Check drug interactions, dosage accuracy, and contraindications — free trial.',
  },
  'Trial Prescription': {
    title: 'Try Prescription Upload — Rapid Capsule Free Trial',
    description:
      'Upload a prescription and see our AI verification pipeline in action. Authenticity checks, OCR analysis, and fraud detection — free trial.',
  },

  // ── Lifeguard ─────────────────────────────────────────────────
  LifeguardAbout: {
    title: 'Lifeguard Emergency Services — Rapid Capsule',
    description:
      'Learn about Rapid Capsule\'s Lifeguard emergency response service. Real-time coordination for emergency medical personnel.',
  },

  // ── Authenticated pages (browser tab titles only) ─────────────
  'Patient Dashboard': { title: 'Dashboard — Rapid Capsule' },
  HealthCheckup: { title: 'AI Health Checkup — Rapid Capsule' },
  HealthCheckupEnhanced: { title: 'AI Health Checkup — Rapid Capsule' },
  Vitals: { title: 'Vitals — Rapid Capsule' },
  Appointments: { title: 'Appointments — Rapid Capsule' },
  Appointmentsv2: { title: 'Appointments — Rapid Capsule' },
  Prescriptions: { title: 'Prescriptions — Rapid Capsule' },
  Pharmacy: { title: 'Pharmacy — Rapid Capsule' },
  Account: { title: 'Account — Rapid Capsule' },
  'Patient Wallet': { title: 'Wallet — Rapid Capsule' },
  'Referals & Rewards': { title: 'Referrals & Rewards — Rapid Capsule' },
  SpecialistDashboard: { title: 'Specialist Dashboard — Rapid Capsule' },
  RxGPTDashboard: { title: 'RxGPT — Rapid Capsule' },
  RxGPTResults: { title: 'RxGPT Results — Rapid Capsule' },
  RxGPTHistory: { title: 'RxGPT History — Rapid Capsule' },
};

export const defaultMeta = {
  title: 'Rapid Capsule — AI-Powered Telemedicine Platform',
  description:
    'Rapid Capsule connects patients with medical specialists through AI-powered health checkups, video consultations, prescription verification, and pharmacy delivery.',
};
