export const PRESCRIPTION_TABS = {
  ALL: "all",
  INTERNAL: "internal",
  EXTERNAL: "external",
};

export const PRESCRIPTION_TAB_OPTIONS = [
  { text: "All", value: PRESCRIPTION_TABS.ALL },
  { text: "Internal", value: PRESCRIPTION_TABS.INTERNAL },
  { text: "External", value: PRESCRIPTION_TABS.EXTERNAL },
];

export const SOURCES = {
  INTERNAL: "INTERNAL",
  EXTERNAL: "EXTERNAL",
};

export const PRESCRIPTION_SOURCE = {
  RAPIDCAPSULE: "RapidCapsules",
  UPLOADEDFILE: "Uploaded file",
};

export const statusArray = [
  "Prescription received",
  "Validating prescription",
  "Processing order",
];

export const progressArray = [3, 5, 15];

export const timeLeftArray = [1, 4, 5];
