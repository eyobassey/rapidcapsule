import { createRouter, createWebHistory } from "vue-router";
import store from "@/store/data-store";
import SignupPatient from "../views/Signup/Signup-patient.vue";
import SignupSpecialist from "../views/Signup/Signup-specialist.vue";
import Login from "../views/Login/Login.vue";
import Logout from "../views/Login/Logout.vue";
import RequestLink from "../views/Reset-password/Request-link.vue";
import PasswordLinkSent from "../views/Reset-password/Password-link-sent.vue";
import NewPassword from "../views/Reset-password/New-password.vue";
import ResetSuccess from "../views/Reset-password/Reset-success.vue";
import VerifyEmail from "../views/User-verification/Verify-email.vue";
import EmailVerified from "../views/User-verification/Email-verified.vue";
import Patient from "../views/Profile-setup/patient.vue";
import PatientApp from "../views/Mainapp/patient-app.vue";
import PatientDashboard from "../views/Mainapp/patient-dashboard.vue";
import HealthCheckup from "../views/Mainapp/HealthCheckup/HealthCheckup";
import Vitals from "../views/Mainapp/Health-monitor/Vitals.vue";
import CycleTracker from "../views/Mainapp/CycleTracker.vue";
import Appointments from "../views/Mainapp/Appointments";
import Referals from "../views/Mainapp/Referals.vue";
import Account from "../views/Mainapp/Account";
import AppSettings from "../views/Mainapp/App-settings";
import Specialist from "../views/Profile-setup/specialist.vue";
import SpecialistApp from "../views/Mainapp/SpecialistApp/specialist-app.vue";
import SpecialistDashboard from "../views/Mainapp/SpecialistApp/specialist-dashboard.vue";
import ClinicalNotesDashboard from "../views/Mainapp/SpecialistApp/ClinicalNotes/clinical-notes-dashboard.vue";
import TemplatesManagement from "../views/Mainapp/SpecialistApp/ClinicalNotes/templates-management.vue";
import Home from "../views/Website/home.vue";
import LifeguardAbout from "../views/Lifeguard/LifeguardAbout.vue";
import SignupNew from "../views/Lifeguard/SignupNew.vue";
import Loginlg from "../views/Lifeguard/Loginlg.vue";

import { PRESCRIPTION_FEATURE_FLAG } from "@/utilities/constants";

let saved_token = localStorage.getItem("token")
  ? localStorage.getItem("token")
  : sessionStorage.getItem("token");

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
    beforeEnter: async (to, from) => {
      if (saved_token) {
        await store.dispatch("authenticate", saved_token);

        let isAuthenticated = store.getters["authenticated"];

        if (isAuthenticated) {
          const userProfile = store.getters["userprofile"];
          if (userProfile.user_type === "Patient") {
            const emergencyContacts = userProfile.emergency_contacts;
            if (!emergencyContacts || emergencyContacts.length === 0) {
              return { name: "Patient Profile Setup" };
            } else {
              return { name: "Patient Dashboard" };
            }
          } else {
            return { name: "SpecialistDashboard" };
          }
        }
      }
      return { name: "Login" };
    },
  },

  {
    path: "/app/patient",
    name: "Patient App",
    component: PatientApp,
    beforeEnter: async (to, from) => {
      if (from.name === "Login") {
        return true;
      } else if (from.name === "Patient Profile Setup") {
        await store.dispatch("authenticate", saved_token);

        return true;
      } else if (from.name === "Signup-patient") {
        return true;
      } else {
        if (saved_token) {
          await store.dispatch("authenticate", saved_token);

          let isAuthenticated = store.getters["authenticated"];

          if (isAuthenticated) {
            return true;
          }
        }
      }

      return { name: "Login" };
    },
    children: [
      {
        path: "dashboard",
        name: "Patient Dashboard",
        component: PatientDashboard,
      },
      {
        path: "health-monitor/vitals",
        name: "Vitals",
        component: Vitals,
      },
      {
        path: "health-monitor/cycle-tracker",
        name: "Cycle Tracker",
        component: CycleTracker,
      },
      {
        path: "health-checkup",
        name: "HealthCheckup",
        component: () => import("@/views/Mainapp/HealthCheckup/HealthCheckup"),
      },
      {
        path: "health-checkup-enhanced",
        name: "HealthCheckupEnhanced",
        component: () => import("@/views/Mainapp/HealthCheckup/HealthCheckupEnhanced"),
      },
      {
        path: "health-checkup/results/",
        name: "HealthCheckupResult",
        component: () =>
          import("@/views/Mainapp/HealthCheckup/DiagnosisReport"),
      },
      {
        path: "appointments",
        name: "Appointments",
        component: Appointments,
      },
      {
        name: "Orders",
        path: "orders",
        component: () => import("@/views/Mainapp/Orders"),
      },

      {
        name: "Order Details",
        path: "orders/details/:id",
        component: () => import("@/views/Mainapp/Orders/OrderDetails"),
      },
      {
        path: "prescriptions",
        name: "Prescriptions",
        component: () => import("@/views/Mainapp/Prescriptions/Patient"),
        beforeEnter: async (to, from) => {
          if (!PRESCRIPTION_FEATURE_FLAG) {
            return { name: "Patient Dashboard" };
          } else {
            return true;
          }
        },
      },

      {
        path: "prescriptions/details/:id",
        name: "Patient Prescription Details",
        component: () => import("@/views/Mainapp/Prescriptions/PatientDetails.vue"),
      },
      {
        path: "prescriptions/whatsapp",
        name: "WhatsApp Prescriptions",
        component: () => import("@/views/Mainapp/Prescriptions/WhatsAppPrescriptions.vue"),
      },
      {
        path: "prescriptions/whatsapp/:id",
        name: "WhatsApp Prescription Details",
        component: () => import("@/views/Mainapp/Prescriptions/PatientDetails.vue"),
      },
      {
        name: "Meetings",
        path: "meetings/:specialistId/:meetingId",
        component: () => import("@/views/Mainapp/Appointments/Meetings"),
      },

      {
        path: "account",
        name: "Account",
        component: Account,
      },
      {
        path: "app-settings",
        name: "App Settings",
        component: AppSettings,
      },
      {
        path: "referals-and-rewards",
        name: "Referals & Rewards",
        component: Referals,
      },
      // Pharmacy Routes
      {
        path: "pharmacy",
        name: "Pharmacy",
        component: () => import("@/views/Mainapp/Pharmacy/index.vue"),
      },
      {
        path: "pharmacy/otc",
        name: "OTC Drugs",
        component: () => import("@/views/Mainapp/Pharmacy/OTCDrugs.vue"),
      },
      {
        path: "pharmacy/drug/:id",
        name: "Drug Details",
        component: () => import("@/views/Mainapp/Pharmacy/DrugDetails.vue"),
      },
      {
        path: "pharmacy/search",
        name: "Drug Search",
        component: () => import("@/views/Mainapp/Pharmacy/DrugSearch.vue"),
      },
      {
        path: "pharmacy/category/:slug",
        name: "Drug Category",
        component: () => import("@/views/Mainapp/Pharmacy/DrugCategory.vue"),
      },
      {
        path: "pharmacy/categories",
        name: "All Categories",
        component: () => import("@/views/Mainapp/Pharmacy/Categories.vue"),
      },
      {
        path: "pharmacy/cart",
        name: "Pharmacy Cart",
        component: () => import("@/views/Mainapp/Pharmacy/Cart.vue"),
      },
      {
        path: "pharmacy/checkout",
        name: "Pharmacy Checkout",
        component: () => import("@/views/Mainapp/Pharmacy/Checkout.vue"),
      },
      {
        path: "pharmacy/select-pharmacy",
        name: "Select Pharmacy",
        component: () => import("@/views/Mainapp/Pharmacy/SelectPharmacy.vue"),
      },
      {
        path: "pharmacy/orders",
        name: "Pharmacy Orders",
        component: () => import("@/views/Mainapp/Pharmacy/MyOrders.vue"),
      },
      {
        path: "pharmacy/orders/:id",
        name: "Pharmacy Order Details",
        component: () => import("@/views/Mainapp/Pharmacy/OrderDetails.vue"),
      },
      {
        path: "pharmacy/track/:orderNumber",
        name: "Track Order",
        component: () => import("@/views/Mainapp/Pharmacy/TrackOrder.vue"),
      },
      {
        path: "pharmacy/prescription-order",
        name: "Prescription Order",
        component: () => import("@/views/Mainapp/Pharmacy/PrescriptionOrder.vue"),
      },
      // Prescription Upload Routes
      {
        path: "pharmacy/upload-prescription",
        name: "Upload Prescription",
        component: () => import("@/views/Mainapp/Pharmacy/UploadPrescription.vue"),
      },
      {
        path: "pharmacy/my-prescriptions",
        name: "My Prescriptions",
        component: () => import("@/views/Mainapp/Pharmacy/MyPrescriptions.vue"),
      },
      {
        path: "pharmacy/prescriptions/:id",
        name: "Pharmacy Prescription Details",
        component: () => import("@/views/Mainapp/Pharmacy/PrescriptionDetails.vue"),
      },
      // Wallet Route (redirects to Account page Wallet tab)
      {
        path: "wallet",
        name: "Patient Wallet",
        redirect: { name: "Account", query: { tab: "wallet" } },
      },
      // Advanced Health Score Routes
      {
        path: "advanced-health-score",
        name: "Advanced Health Score",
        component: () => import("@/views/Mainapp/AdvancedHealthScore/index.vue"),
      },
      {
        path: "advanced-health-score/assessment",
        name: "Advanced Health Score Assessment",
        component: () => import("@/views/Mainapp/AdvancedHealthScore/Assessment.vue"),
      },
      {
        path: "advanced-health-score/report/:id",
        name: "Advanced Health Score Report",
        component: () => import("@/views/Mainapp/AdvancedHealthScore/Report.vue"),
      },
      {
        path: "advanced-health-score/history",
        name: "Advanced Health Score History",
        component: () => import("@/views/Mainapp/AdvancedHealthScore/History.vue"),
      },
    ],
  },
  {
    path: "/LifeguardAbout",
    name: "LifeguardAbout",
    component: LifeguardAbout,
  },
  {
    path: "/Lifeguard/Loginlg",
    name: "Loginlg",
    component: Loginlg,
  },
  {
    path: "/Lifeguard/SignupNew",
    name: "SignupNew",
    component: SignupNew,
  },
  {
    path: "/app/specialist",
    name: "Specialist App",
    component: SpecialistApp,
    beforeEnter: async (to, from) => {
      if (from.name === "Login") {
        return true;
      } else if (from.name === "Specialist Profile Setup") {
        await store.dispatch("authenticate", saved_token);

        return true;
      } else if (from.name === "Signup-specialist") {
        return true;
      } else {
        if (saved_token) {
          await store.dispatch("authenticate", saved_token);

          let isAuthenticated = store.getters["authenticated"];

          if (isAuthenticated) {
            return true;
          }
        }
      }

      return { name: "Login" };
    },
    children: [
      {
        path: "specialist-dashboard",
        name: "SpecialistDashboard",
        component: SpecialistDashboard,
      },
      {
        path: "specialist-appointments",
        name: "SpecialistAppointments",
        component: () => import("@/views/Mainapp/SpecialistApp/Appointments"),
      },
      {
        path: "specialist-appointments/details/:id",
        name: "SpecialistAppointmentDetails",
        component: () =>
          import(
            "@/views/Mainapp/SpecialistApp/Appointments/AppointmentDetails"
          ),
      },
      {
        path: "clinical-notes",
        name: "ClinicalNotesDashboard",
        component: ClinicalNotesDashboard,
      },
      {
        path: "clinical-notes/templates",
        name: "TemplatesManagement",
        component: TemplatesManagement,
      },
      {
        path: "specialist-account",
        name: "SpecialistAccount",
        component: () => import("@/views/Mainapp/SpecialistApp/Account"),
      },
      {
        path: "specialist-meetings/:patientId/:meetingId",
        name: "SpecialistMeetings",
        component: () =>
          import("@/views/Mainapp/SpecialistApp/Appointments/Meetings"),
      },
      // Pharmacy Portal Routes
      {
        path: "pharmacy-portal",
        name: "PharmacyPortalDashboard",
        component: () => import("@/views/Mainapp/SpecialistApp/PharmacyPortal/index.vue"),
      },
      {
        path: "pharmacy-portal/orders",
        name: "PharmacyOrders",
        component: () => import("@/views/Mainapp/SpecialistApp/PharmacyPortal/Orders.vue"),
      },
      {
        path: "pharmacy-portal/orders/:id",
        name: "PharmacyOrderDetails",
        component: () => import("@/views/Mainapp/SpecialistApp/PharmacyPortal/OrderDetails.vue"),
      },
      {
        path: "pharmacy-portal/inventory",
        name: "PharmacyInventory",
        component: () => import("@/views/Mainapp/SpecialistApp/PharmacyPortal/Inventory.vue"),
      },
      {
        path: "pharmacy-portal/prescriptions",
        name: "PharmacyPrescriptions",
        component: () => import("@/views/Mainapp/SpecialistApp/PharmacyPortal/Prescriptions.vue"),
      },
      {
        path: "pharmacy-portal/prescriptions/:id",
        name: "PharmacyPrescriptionDetails",
        component: () => import("@/views/Mainapp/SpecialistApp/PharmacyPortal/PrescriptionDetails.vue"),
      },
      // Specialist Pharmacy Routes (for specialists prescribing medications)
      {
        path: "pharmacy",
        name: "SpecialistPharmacyDashboard",
        component: () => import("@/views/Mainapp/SpecialistApp/Pharmacy/index.vue"),
      },
      {
        path: "pharmacy/patients",
        name: "SpecialistPharmacyPatients",
        component: () => import("@/views/Mainapp/SpecialistApp/Pharmacy/Patients.vue"),
      },
      {
        path: "pharmacy/patients/:id",
        name: "SpecialistPharmacyPatientDetails",
        component: () => import("@/views/Mainapp/SpecialistApp/Pharmacy/PatientDetails.vue"),
      },
      {
        path: "pharmacy/drugs",
        name: "SpecialistPharmacyDrugs",
        component: () => import("@/views/Mainapp/SpecialistApp/Pharmacy/Drugs.vue"),
      },
      {
        path: "pharmacy/drugs/:id",
        name: "SpecialistPharmacyDrugDetails",
        component: () => import("@/views/Mainapp/SpecialistApp/Pharmacy/DrugDetails.vue"),
      },
      {
        path: "pharmacy/prescriptions",
        name: "SpecialistPharmacyPrescriptions",
        component: () => import("@/views/Mainapp/SpecialistApp/Pharmacy/Prescriptions.vue"),
      },
      {
        path: "pharmacy/prescriptions/create",
        name: "SpecialistPharmacyCreatePrescription",
        component: () => import("@/views/Mainapp/SpecialistApp/Pharmacy/CreatePrescription.vue"),
      },
      {
        path: "pharmacy/prescriptions/:id",
        name: "SpecialistPharmacyPrescriptionDetails",
        component: () => import("@/views/Mainapp/SpecialistApp/Pharmacy/PrescriptionDetails.vue"),
      },
    ],
  },
  {
    path: "/signup/patient",
    name: "Signup-patient",
    component: SignupPatient,
  },
  {
    path: "/signup/specialist",
    name: "Signup-specialist",
    component: SignupSpecialist,
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
    beforeEnter: async (to, from) => {
      if (to.name !== "Login") {
        await store.dispatch("authenticate", saved_token);

        let isAuthenticated = store.getters["authenticated"];

        if (isAuthenticated) {
          const userProfile = store.state.userProfile;
          const emergencyContacts = userProfile.emergency_contacts;
          if (!emergencyContacts || emergencyContacts.length === 0) {
            return { name: "Patient Profile Setup" };
          } else {
            return { name: "Patient Dashboard" };
          }
        }
      }
    },
  },
  {
    path: "/logged-out",
    name: "Logged out",
    component: Logout,
  },
  {
    path: "/reset-password/request-link",
    name: "Request Link",
    component: RequestLink,
  },
  {
    path: "/password-reset/link-sent",
    name: "Password link sent",
    component: PasswordLinkSent,
  },
  {
    path: "/forgot-password",
    name: "New-password",
    component: NewPassword,
    alias: "/Password-reset/new-password",
  },
  {
    path: "/password-reset/Success",
    name: "Reset success",
    component: ResetSuccess,
  },
  {
    path: "/verify-email",
    name: "Verify-email",
    component: VerifyEmail,
  },
  {
    path: "/email-verification",
    name: "Verified",
    component: EmailVerified,
  },
  {
    path: "/profile-setup/patient",
    name: "Patient Profile Setup",
    component: Patient,
    beforeEnter: async (to, from) => {
      if (from.name === "Login") {
        return true;
      } else if (from.name === "Signup-patient") {
        return true;
      } else {
        if (saved_token) {
          await store.dispatch("authenticate", saved_token);

          let isAuthenticated = store.getters["authenticated"];

          if (isAuthenticated) {
            return true;
          }
        }
        return { name: "Login" };
      }
    },
  },
  {
    path: "/profile-setup/specialist",
    name: "Specialist Profile Setup",
    component: Specialist,
    beforeEnter: async (to, from) => {
      if (from.name === "Login") {
        return true;
      } else if (from.name === "Signup-specialist") {
        return true;
      } else {
        if (saved_token) {
          await store.dispatch("authenticate", saved_token);

          let isAuthenticated = store.getters["authenticated"];

          if (isAuthenticated) {
            return true;
          }
        }
        return { name: "Login" };
      }
    },
  },
  {
    path: "/privacy-policy",
    name: "Privacy Policy",
    component: () => import("../views/Legal/PrivacyPolicy.vue"),
  },
  {
    path: "/terms-of-service",
    name: "Terms of Service",
    component: () => import("../views/Legal/TermsOfService.vue"),
  },
  {
    path: "/verify/:prescriptionNumber",
    name: "Verify Prescription",
    component: () => import("../views/Verify/PrescriptionVerify.vue"),
  },
  {
    path: "/rc-architecture",
    name: "RC Architecture",
    component: () => import("../views/Public/RCArchitecture.vue"),
    meta: { public: true, title: "Rapid Capsule - System Architecture" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
