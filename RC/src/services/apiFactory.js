import http from "./http";

const apiFactory = {
  $_createReminder(payload) {
    return http.post("/reminders", payload);
  },
  $_updateReminder({ payload, reminderId }) {
    return http.patch(`/reminders/${reminderId}`, payload);
  },
  $_deleteReminder(reminderId) {
    return http.delete(`/reminders/${reminderId}`);
  },
  $_getUserReminders() {
    return http.get("/reminders");
  },
  $_getUsers(queryParams) {
    return http.get("/users", { params: queryParams });
  },
  $_getOneUser(userId) {
    return http.get(`/users/${userId}`);
  },
  $_updateUser(payload) {
    return http.patch(`/users/`, payload);
  },
  $_updateCurrentUser({ userId, payload }) {
    return http.patch(`/users/${userId}`, payload);
  },
  $_getCurrentUser() {
    return http.get("/users/me");
  },
  $_createAppointments(payload) {
    return http.post("/appointments", payload);
  },
  $_createAppointment(payload) {
    return http.post("/appointments/specialist/create", payload);
  },
  $_cancelAppointments(payload) {
    return http.patch("/appointments/cancel", payload);
  },
  $_rescheduleAppointments(payload) {
    return http.patch("/appointments/reschedule", payload);
  },
  $_getAppointments(queryParams) {
    return http.get("/appointments", { params: queryParams });
  },
  $_getSpecialistAppointments(queryParams) {
    return http.get("/appointments/specialist", { params: queryParams });
  },
  $_getPatientAppointments(queryParams) {
    return http.get("/appointments/patient", { params: queryParams });
  },
  $_getOnetAppointments(appointmentId) {
    return http.get(`/appointments/${appointmentId}`);
  },
  $_getPaymentCards() {
    return http.get("/cards");
  },
  $_addPaymentCard(payload) {
    return http.post("/cards", payload);
  },
  $_verifyPaymentCard(payload) {
    return http.post("/cards/verify", payload);
  },
  $_specialistProfileSetup(payload) {
    return http.patch("/users/specialist-profile-setup", payload);
  },
  $_specialistAvailability(payload) {
    return http.post("/users/availability", payload);
  },
  $_getSpecialistAvailability(payload) {
    return http.get("/users/availability", payload);
  },
  $_getSpecialistEarnings(payload) {
    return http.get("/users/earnings", payload);
  },
  $_specialistPreference(payload) {
    return http.post("/users/preferences", payload);
  },
  $_specialistRecommendation(payload) {
    return http.post("appointments/refer-specialist", payload);
  },
  $_updateCertifications(payload) {
    return http.patch("/users/certifications", payload);
  },
  $_updateAwards(payload) {
    return http.patch("/users/awards", payload);
  },
  $_getBankLists() {
    return http.get("/banks/list");
  },
  $_resolveBankAccount(payload) {
    return http.post("/banks/resolve-account", payload);
  },
  $_addBankAccount(payload) {
    return http.post("/banks", payload);
  },
  $_deleteBankAccount(payload) {
    return http.delete("/banks", payload);
  },
  $_makeBankAccountDefault(payload) {
    return http.patch("/banks/default", payload);
  },
  $_userBankAccounts() {
    return http.get("/banks");
  },
  $_walletsWithdrawal(payload) {
    return http.post("/wallets/withdraw", payload);
  },
  $_beginHealthCheckup(payload) {
    return http.post("/health-checkup", payload);
  },
  $_riskFactors(payload) {
    return http.post("/health-checkup/risk-factors", payload);
  },
  $_searchObservations(params) {
    return http.get("/health-checkup/search", { params });
  },
  $_searchObservationsEnhanced(params) {
    return http.get("/health-checkup/search-enhanced", { params });
  },
  $_parseFreeTextEnhanced(payload) {
    return http.post("/health-checkup/parse-enhanced", payload);
  },
  $_getSuggestedSymptoms(payload) {
    return http.post("/health-checkup/symptoms", payload);
  },
  $_patientDiagnosis(payload) {
    return http.post("/health-checkup/diagnosis", payload);
  },
  $_patientDiagnosisEnhanced(payload) {
    return http.post("/health-checkup/diagnosis-enhanced", payload);
  },
  $_getAvailableTimes(payload) {
    return http.post("/appointments/available-times", payload);
  },
  $_getAvailableSpecialists(payload) {
    return http.post("/appointments/available-specialists", payload);
  },
  $_getSpecialistDashboard() {
    return http.get("/dashboard/specialist");
  },

  $_changePhoneNumber(payload) {
    return http.patch("/auth/change-phone-number", payload);
  },

  $_verifyPhoneNumberOtp(payload) {
    return http.patch("/auth/verify-phone-number-change", payload);
  },

  $_changeEmail(payload) {
    return http.patch("/auth/change-email-address", payload);
  },

  $_verifyEmailOtp(payload) {
    return http.patch("/auth/verify-email-address-change", payload);
  },

  $_uploadPrescriptionDocument(payload) {
    return http.post("/prescriptions/file", payload);
  },

  $_getPrescription(prescriptionId) {
    return http.get(`/prescriptions/${prescriptionId}`);
  },
  $_getUserPrescriptions() {
    return http.get('/prescriptions');
  },
  $_submitPrescription(payload) {
    return http.post('/prescriptions', payload);
  },
  $_getOneUserVitals(patientId) {
    return http.get(`vitals/${patientId}`);
  },
  $_getHealthCheckupResult(patientId) {
    return http.get(`/health-checkup/results/${patientId}`)
  },
  $_getHealthCheckupHistory(params) {
    return http.get("/health-checkup/history", { params });
  },
  $_deleteHealthCheckup(checkupId) {
    return http.delete(`/health-checkup/${checkupId}`);
  },
  $_getExtendedDiagnosis(payload) {
    return http.post("/health-checkup/extended-diagnosis", payload);
  },

  // Claude AI Health Summary APIs
  $_getClaudeSummaryStatus() {
    return http.get("/health-checkup/claude-summary/status");
  },
  $_getClaudeSummary(checkupId) {
    return http.get(`/health-checkup/${checkupId}/claude-summary`);
  },
  $_generateClaudeSummary(checkupId, answeredQuestions = null) {
    return http.post(`/health-checkup/${checkupId}/generate-claude-summary`, {
      answered_questions: answeredQuestions
    });
  },

  // Claude Summary Credits APIs
  $_getClaudeSummaryCredits() {
    return http.get("/claude-summary/credits");
  },
  $_getClaudeSummaryPlans() {
    return http.get("/claude-summary/plans");
  },
  $_purchaseClaudeSummaryPlan(planId) {
    return http.post("/claude-summary/purchase", { plan_id: planId });
  },
  $_getWalletBalance() {
    return http.get("/wallets/balance");
  },
  $_getClaudeSummaryTransactions(params = {}) {
    return http.get("/claude-summary/transactions", { params });
  },
  $_canGenerateClaudeSummary() {
    return http.get("/claude-summary/can-generate");
  },

  // Advanced Health Score APIs
  $_canStartAdvancedHealthScore() {
    return http.get("/advanced-health-score/can-start");
  },
  $_getAdvancedHealthScoreQuestions() {
    return http.get("/advanced-health-score/questions");
  },
  $_getRelevantHealthCheckups() {
    return http.get("/advanced-health-score/relevant-checkups");
  },
  $_uploadAdvancedHealthScoreDocument(formData) {
    return http.post("/advanced-health-score/upload-document", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  $_submitAdvancedHealthScore(payload) {
    return http.post("/advanced-health-score/submit", payload);
  },
  $_getAdvancedHealthScoreHistory(params = {}) {
    return http.get("/advanced-health-score/history", { params });
  },
  $_getAdvancedHealthScoreById(assessmentId) {
    return http.get(`/advanced-health-score/${assessmentId}`);
  },

  $_getOrder(orderId) {
    return http.get(`prescriptions/orders/${orderId}`);
  },

  // Clinical Notes APIs
  $_getSpecialistClinicalNotes() {
    return http.get('/clinical-notes/specialist');
  },
  $_getClinicalNotes(appointmentId) {
    return http.get(`/clinical-notes/appointment/${appointmentId}`);
  },
  $_createClinicalNote(payload) {
    return http.post('/clinical-notes', payload);
  },
  $_updateClinicalNote(appointmentId, noteId, payload) {
    return http.patch(`/clinical-notes/${appointmentId}/${noteId}`, payload);
  },
  $_deleteClinicalNote(appointmentId, noteId) {
    return http.delete(`/clinical-notes/${appointmentId}/${noteId}`);
  },
  $_fetchZoomClinicalNotes(appointmentId) {
    return http.post(`/clinical-notes/fetch-zoom/${appointmentId}`);
  },

  // Clinical Note Templates APIs
  $_getTemplates(category) {
    const params = category ? { category } : {};
    return http.get('/clinical-notes/templates', { params });
  },
  $_getTemplate(templateId) {
    return http.get(`/clinical-notes/templates/${templateId}`);
  },
  $_createTemplate(payload) {
    return http.post('/clinical-notes/templates', payload);
  },
  $_updateTemplate(templateId, payload) {
    return http.patch(`/clinical-notes/templates/${templateId}`, payload);
  },
  $_deleteTemplate(templateId) {
    return http.delete(`/clinical-notes/templates/${templateId}`);
  },
  $_archiveTemplate(templateId) {
    return http.post(`/clinical-notes/templates/${templateId}/archive`);
  },
  $_incrementTemplateUsage(templateId) {
    return http.post(`/clinical-notes/templates/${templateId}/use`);
  },
  $_getTemplateCategories() {
    return http.get('/clinical-notes/templates/categories');
  },
  $_getDefaultTemplate() {
    return http.get('/clinical-notes/templates/default/get');
  },
  $_setTemplateAsDefault(templateId) {
    return http.post(`/clinical-notes/templates/${templateId}/set-default`);
  },
  $_unsetTemplateDefault(templateId) {
    return http.post(`/clinical-notes/templates/${templateId}/unset-default`);
  },

  // Specialist Wallet APIs
  $_getSpecialistWallet() {
    return http.get("/specialist/wallet");
  },
  $_getSpecialistWalletStats() {
    return http.get("/specialist/wallet/stats");
  },
  $_getSpecialistWalletTransactions(params) {
    return http.get("/specialist/wallet/transactions", { params });
  },
  $_initializeWalletTopUp(payload) {
    return http.post("/specialist/wallet/topup", payload);
  },
  $_verifyWalletTopUp(payload) {
    return http.post("/specialist/wallet/topup/verify", payload);
  },
  $_checkWalletBalance(amount) {
    return http.get(`/specialist/wallet/check-balance?amount=${amount}`);
  },

  // ============ Specialist Pharmacy APIs ============

  // Dashboard
  $_getSpecialistPharmacyDashboard() {
    return http.get("/specialist/pharmacy/dashboard");
  },

  // Patient Management
  $_searchPharmacyPatients(params) {
    return http.get("/specialist/pharmacy/patients", { params });
  },
  $_getPharmacyPatientDetails(patientId) {
    return http.get(`/specialist/pharmacy/patients/${patientId}`);
  },
  $_getPharmacyPatientMedicalHistory(patientId) {
    return http.get(`/specialist/pharmacy/patients/${patientId}/medical-history`);
  },
  $_getPharmacyPatientPrescriptions(patientId, params) {
    return http.get(`/specialist/pharmacy/patients/${patientId}/prescriptions`, { params });
  },
  $_getPharmacyPatientVitals(patientId) {
    return http.get(`/specialist/pharmacy/patients/${patientId}/vitals`);
  },
  $_getPharmacyPatientHealthCheckups(patientId, limit) {
    return http.get(`/specialist/pharmacy/patients/${patientId}/health-checkups`, { params: { limit } });
  },

  // Patient Delivery Addresses
  $_getPatientDeliveryAddresses(patientId) {
    return http.get(`/specialist/pharmacy/patients/${patientId}/addresses`);
  },
  $_addPatientDeliveryAddress(patientId, payload) {
    return http.post(`/specialist/pharmacy/patients/${patientId}/addresses`, payload);
  },
  $_updatePatientDeliveryAddress(patientId, addressId, payload) {
    return http.patch(`/specialist/pharmacy/patients/${patientId}/addresses/${addressId}`, payload);
  },
  $_deletePatientDeliveryAddress(patientId, addressId) {
    return http.delete(`/specialist/pharmacy/patients/${patientId}/addresses/${addressId}`);
  },
  $_setDefaultDeliveryAddress(patientId, addressId) {
    return http.patch(`/specialist/pharmacy/patients/${patientId}/addresses/${addressId}/default`);
  },

  // Drug Catalog
  $_searchPharmacyDrugs(params) {
    return http.get("/specialist/pharmacy/drugs", { params });
  },
  $_getPharmacyDrugDetails(drugId, params = {}) {
    return http.get(`/specialist/pharmacy/drugs/${drugId}`, { params });
  },
  $_getPharmacyDrugBatches(drugId, params) {
    return http.get(`/specialist/pharmacy/drugs/${drugId}/batches`, { params });
  },
  $_getPharmacyDrugCategories() {
    return http.get("/specialist/pharmacy/drugs/categories");
  },
  $_getPharmacyManufacturers() {
    return http.get("/specialist/pharmacy/drugs/manufacturers");
  },

  // ============ Specialist Prescription APIs ============

  // Prescription CRUD
  $_createSpecialistPrescription(payload) {
    return http.post("/specialist/prescriptions", payload);
  },
  $_getSpecialistPrescriptions(params) {
    return http.get("/specialist/prescriptions", { params });
  },
  $_getSpecialistPrescriptionStats() {
    return http.get("/specialist/prescriptions/stats");
  },
  $_getSpecialistPrescriptionDetails(prescriptionId) {
    return http.get(`/specialist/prescriptions/${prescriptionId}`);
  },
  $_updateSpecialistPrescription(prescriptionId, payload) {
    return http.patch(`/specialist/prescriptions/${prescriptionId}`, payload);
  },
  $_cancelSpecialistPrescription(prescriptionId, payload) {
    return http.post(`/specialist/prescriptions/${prescriptionId}/cancel`, payload);
  },

  // Payment Methods
  $_payPrescriptionFromWallet(prescriptionId) {
    return http.post(`/specialist/prescriptions/${prescriptionId}/pay/wallet`);
  },
  $_getPatientWalletBalance(patientId) {
    return http.get(`/specialist/prescriptions/patient/${patientId}/wallet-balance`);
  },
  $_payPrescriptionFromPatientWallet(prescriptionId, payload) {
    return http.post(`/specialist/prescriptions/${prescriptionId}/pay/patient-wallet`, payload);
  },
  $_sendPrescriptionPaymentLink(prescriptionId, payload) {
    return http.post(`/specialist/prescriptions/${prescriptionId}/pay/send-link`, payload);
  },
  $_markPrescriptionCashPayment(prescriptionId) {
    return http.post(`/specialist/prescriptions/${prescriptionId}/pay/cash`);
  },

  // Send to Patient (Self-Service)
  $_sendPrescriptionToPatient(prescriptionId) {
    return http.post(`/specialist/prescriptions/${prescriptionId}/send-to-patient`);
  },

  // Fulfillment
  $_dispensePrescription(prescriptionId, payload) {
    return http.post(`/specialist/prescriptions/${prescriptionId}/dispense`, payload);
  },
  $_shipPrescription(prescriptionId, payload) {
    return http.post(`/specialist/prescriptions/${prescriptionId}/ship`, payload);
  },
  $_deliverPrescription(prescriptionId, payload) {
    return http.post(`/specialist/prescriptions/${prescriptionId}/deliver`, payload);
  },

  // ============ Patient Self-Service Prescription APIs ============

  // Get patient prescriptions (from specialist)
  $_getPatientPrescriptions(params) {
    return http.get("/patient/prescriptions", { params });
  },
  $_getPatientPrescriptionDetails(prescriptionId) {
    return http.get(`/patient/prescriptions/${prescriptionId}`);
  },
  $_getPrescriptionPdf(prescriptionId) {
    return http.get(`/patient/prescriptions/${prescriptionId}/pdf`);
  },
  $_acceptPrescription(prescriptionId, payload) {
    return http.post(`/patient/prescriptions/${prescriptionId}/accept`, payload);
  },
  $_declinePrescription(prescriptionId, payload) {
    return http.post(`/patient/prescriptions/${prescriptionId}/decline`, payload);
  },
  $_payPrescriptionWithPatientWallet(prescriptionId) {
    return http.post(`/patient/prescriptions/${prescriptionId}/pay/wallet`);
  },
  $_initiatePrescriptionCardPayment(prescriptionId) {
    return http.post(`/patient/prescriptions/${prescriptionId}/pay/card/initialize`);
  },
  $_verifyPrescriptionCardPayment(prescriptionId, reference) {
    return http.post(`/patient/prescriptions/${prescriptionId}/pay/card/verify`, { reference });
  },
  $_getPatientSelfWalletBalance() {
    return http.get("/patient/prescriptions/wallet-balance");
  },
  $_ratePrescription(prescriptionId, payload) {
    return http.post(`/patient/prescriptions/${prescriptionId}/rate`, payload);
  },

  // ============ Patient Prescription Upload APIs ============

  // Get a single patient uploaded prescription details
  $_getPatientUploadDetails(uploadId) {
    return http.get(`/pharmacy/prescriptions/${uploadId}`);
  },
  // Get all patient uploads
  $_getPatientUploads(params) {
    return http.get("/pharmacy/prescriptions/my-uploads", { params });
  },
  // Verify/lookup prescription by RX number (public endpoint)
  $_verifyPrescriptionByNumber(prescriptionNumber) {
    return http.get(`/prescriptions/verify/${prescriptionNumber}`);
  },

  // Prescription Clarification APIs
  $_getClarificationDetails(uploadId) {
    return http.get(`/pharmacy/prescriptions/${uploadId}/clarification`);
  },
  $_submitClarificationResponse(uploadId, formData) {
    return http.post(`/pharmacy/prescriptions/${uploadId}/clarification/respond`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  $_getPendingClarifications() {
    return http.get("/pharmacy/prescriptions/clarifications/pending");
  },

  /**
   * Get specialist prescriptions that can be used for pharmacy orders
   * These are prescriptions created by specialists with drug_id references
   * @param {Object} params - Query params (drug_ids: comma-separated list of drug IDs to filter)
   */
  $_getSpecialistPrescriptionsForPharmacy(params) {
    return http.get("/patient/prescriptions/for-pharmacy", { params });
  },

  /**
   * Implicitly accept a prescription when patient selects it for pharmacy order
   * @param {string} prescriptionId - The prescription ID
   */
  $_acceptPrescriptionForPharmacy(prescriptionId) {
    return http.post(`/patient/prescriptions/${prescriptionId}/accept-for-pharmacy`);
  },

  // ============ PICKUP CENTER APIs ============

  /**
   * Get available pickup centers
   * @param {Object} params - Query params (latitude, longitude, radius, state, city, page, limit)
   */
  $_getPickupCenters(params) {
    return http.get("/pharmacy/pharmacies/pickup-centers", { params });
  },

  /**
   * Get recommended pickup centers based on location
   * @param {Object} params - Query params (latitude, longitude, needs_refrigeration, limit)
   */
  $_recommendPickupCenters(params) {
    return http.get("/pharmacy/pharmacies/pickup-centers/recommend", { params });
  },

  /**
   * Get a specific pickup center by ID
   * @param {string} pickupCenterId - The pickup center ID
   */
  $_getPickupCenterById(pickupCenterId) {
    return http.get(`/pharmacy/pharmacies/pickup-centers/${pickupCenterId}`);
  },

  /**
   * Set pickup center for a prescription
   * @param {string} prescriptionId - The prescription ID
   * @param {Object} payload - { pickup_pharmacy_id }
   */
  $_setPickupCenter(prescriptionId, payload) {
    return http.patch(`/specialist/prescriptions/${prescriptionId}/pickup-center`, payload);
  },

  // Pharmacy Portal APIs
  getPharmacyDashboardStats() {
    return http.get("/pharmacy/portal/dashboard");
  },
  getPharmacyOrders(params) {
    return http.get("/pharmacy/portal/orders", { params });
  },
  getPharmacyOrderDetails(orderId) {
    return http.get(`/pharmacy/portal/orders/${orderId}`);
  },
  updatePharmacyOrderStatus(orderId, payload) {
    return http.patch(`/pharmacy/portal/orders/${orderId}/status`, payload);
  },
  cancelPharmacyOrder(orderId, payload) {
    return http.patch(`/pharmacy/portal/orders/${orderId}/cancel`, payload);
  },
  getPharmacyPrescriptions(params) {
    return http.get("/pharmacy/portal/prescriptions", { params });
  },
  getPharmacyPrescriptionDetails(prescriptionId) {
    return http.get(`/pharmacy/portal/prescriptions/${prescriptionId}`);
  },
  fillPrescriptionMedication(prescriptionId, medicationIndex) {
    return http.patch(`/pharmacy/portal/prescriptions/${prescriptionId}/fill-medication`, { medicationIndex });
  },
  fillAllPrescriptionMedications(prescriptionId) {
    return http.patch(`/pharmacy/portal/prescriptions/${prescriptionId}/fill-all`);
  },
  processPrescriptionRefill(prescriptionId) {
    return http.post(`/pharmacy/portal/prescriptions/${prescriptionId}/refill`);
  },
  getPharmacyInventory(params) {
    return http.get("/pharmacy/portal/inventory", { params });
  },
  getLowStockDrugs() {
    return http.get("/pharmacy/portal/inventory/low-stock");
  },
  getDrugCategories() {
    return http.get("/pharmacy/categories");
  },
  addPharmacyDrug(payload) {
    return http.post("/pharmacy/portal/inventory", payload);
  },
  updatePharmacyDrug(drugId, payload) {
    return http.patch(`/pharmacy/portal/inventory/${drugId}`, payload);
  },
  updateDrugStock(drugId, payload) {
    return http.patch(`/pharmacy/portal/inventory/${drugId}/stock`, payload);
  },

  // ============ Drug Interaction APIs ============
  /**
   * Check for drug interactions between multiple drugs
   * @param {string[]} drugIds - Array of drug IDs to check
   * @returns {Promise} - Interaction check results
   */
  checkDrugInteractions(drugIds, dataSources) {
    return http.post("/pharmacy/drugs/check-interactions", { drugIds, data_sources: dataSources });
  },

  /**
   * Get drug interaction settings (for display purposes)
   * @returns {Promise} - Drug interaction settings
   */
  getDrugInteractionSettings() {
    return http.get("/pharmacy/drugs/interaction-settings");
  },

  // ============ WhatsApp Integration APIs ============

  /**
   * Get WhatsApp identity status for current user
   */
  $_getWhatsAppStatus() {
    return http.get("/whatsapp/identity/status");
  },

  /**
   * Initiate WhatsApp number linking
   * @param {Object} payload - { whatsapp_number }
   */
  $_linkWhatsAppNumber(payload) {
    return http.post("/whatsapp/identity/link", payload);
  },

  /**
   * Verify WhatsApp OTP to complete linking
   * @param {Object} payload - { whatsapp_number, otp }
   */
  $_verifyWhatsAppOtp(payload) {
    return http.post("/whatsapp/identity/verify", payload);
  },

  /**
   * Unlink WhatsApp number from account
   */
  $_unlinkWhatsApp() {
    return http.delete("/whatsapp/identity/unlink");
  },

  /**
   * Get WhatsApp prescriptions for current user
   * @param {Object} params - Query params (status, page, limit)
   */
  $_getWhatsAppPrescriptions(params) {
    return http.get("/whatsapp/prescriptions", { params });
  },

  /**
   * Get details of a specific WhatsApp prescription
   * @param {string} prescriptionId - The prescription ID
   */
  $_getWhatsAppPrescriptionDetails(prescriptionId) {
    return http.get(`/whatsapp/prescriptions/${prescriptionId}`);
  },

  test(params) {
    console.log("PARAMS", params);
  },
};
export default apiFactory;
