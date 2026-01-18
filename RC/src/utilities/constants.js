export const SECURITY_QUESTIONS = [
  "What is your nickname?",
  "What is you mother’s maiden name?",
  "What is the name of your first pet?",
  "What is the name of your primary/grade school",
];

export const TWO_FAS = [
  {
    name: "email",
    label: "verify via email",
    title: "Email",
    action: "Change email",
    isActive: null,
    isLoading: false,
  },
  {
    name: "sms",
    label: "verify via phone number",
    title: "SMS",
    action: "Change number",
    isActive: null,
    isLoading: false,
  },
  {
    name: "auth_apps",
    label: "verify via auth app",
    title: "Auth Apps",
    action: "",
    isActive: null,
    isLoading: false,
  },
];

export const SECURITY_UPDATE_OPTIONS = {
  EMAIL: "Email",
  SMS: "SMS",
};

export const STATUS_CODES = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNPROCESSIBLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  CREATED: 201,
};

export const OTP_VERIFICATION_CONTENT = {
  SMS: {
    title: "Verify Phone Number",
    description: "Pleas enter the OTP that was sent to your phone number.",
  },
  Email: {
    title: "Verify Email",
    description: "Pleas enter the OTP that was sent to your email.",
  },
};

export const LOCATION_QUERY_KEY = "tab";

export const PRESCRIPTION_FEATURE_FLAG = true;
