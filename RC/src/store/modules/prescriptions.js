import axios from "axios";

export default {
  namespaced: true,

  state() {
    return {
      loading: false,
      prescriptions: [],
      orders: [],
      errorMessage: "",
    };
  },

  getters: {
    getPrescriptions: (state) => state.prescriptions,
    getOrders: (state) => state.orders,
    getLoadingState: (state) => state.loading,
    getErrorMessage: (state) => state.errorMessage,
  },

  mutations: {
    SET_PRESCRIPTIONS(state, prescriptions) {
      state.prescriptions = prescriptions;
    },
    SET_ORDERS(state, orders) {
      state.orders = orders;
    },
    SET_LOADING_STATE(state, loadingState) {
      state.loading = loadingState;
    },
    SET_ERROR_MESSAGE(state, errorMessage) {
      state.errorMessage = errorMessage;
    },
  },

  actions: {
    async fetchPrescriptions({ commit }) {
      try {
        commit("SET_LOADING_STATE", true);
        commit("SET_PRESCRIPTIONS", []);
        commit("SET_ORDERS", []);

        // Fetch all data sources in parallel
        const results = await Promise.allSettled([
          axios.get("prescriptions/specialist"),
          axios.get("prescriptions/internal"),
          axios.get("prescriptions/external"),
          axios.get("pharmacy-orders/my-orders?page=1&limit=100"),
          axios.get("patient/prescriptions"), // New patient self-service prescriptions
          axios.get("pharmacy/prescriptions/my-uploads"), // Patient uploaded prescriptions at checkout
        ]);

        // Process specialist prescriptions
        const specialistResult = results[0];
        const specialistData = specialistResult.status === 'fulfilled'
          ? (specialistResult.value.data.data || []).map(p => ({
              ...p,
              type: 'INTERNAL',
              prescription_source: 'specialist',
              prescribed_by: p.specialist_id || {
                profile: {
                  first_name: 'Doctor',
                  last_name: '',
                }
              },
            }))
          : [];

        // Process internal prescriptions (old format)
        const internalResult = results[1];
        const internalData = internalResult.status === 'fulfilled'
          ? (internalResult.value.data.data || []).map(p => ({
              ...p,
              type: 'INTERNAL',
              prescription_source: 'internal',
            }))
          : [];

        // Process external prescriptions (uploaded by patient)
        const externalResult = results[2];
        const externalData = externalResult.status === 'fulfilled'
          ? (externalResult.value.data.data || []).map(p => ({
              ...p,
              type: 'EXTERNAL',
              prescription_source: 'external',
            }))
          : [];

        // Process pharmacy orders (patient-created)
        const ordersResult = results[3];
        const ordersData = ordersResult.status === 'fulfilled'
          ? (ordersResult.value.data.data?.orders || ordersResult.value.data.data || []).map(o => ({
              ...o,
              _id: o._id,
              prescription_number: o.order_number,
              type: 'ORDER',
              prescription_source: 'pharmacy_order',
              status: o.status,
              payment_status: o.payment_status,
              total_amount: o.total_amount,
              items: (o.items || []).map(item => ({
                drug_name: item.drug?.name || item.drug_name || 'Unknown Drug',
                drug_id: item.drug?._id || item.drug,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
              })),
              created_at: o.createdAt || o.created_at,
              // For display - pharmacy orders don't have a prescribing doctor
              pharmacy: o.pharmacy,
            }))
          : [];

        // Process patient self-service prescriptions (from specialists)
        const patientPrescriptionsResult = results[4];
        // API returns paginated response with { docs: [...], total, pages }
        const patientPrescriptionsRawData = patientPrescriptionsResult.status === 'fulfilled'
          ? (patientPrescriptionsResult.value.data.data?.docs || patientPrescriptionsResult.value.data.data || [])
          : [];
        const patientPrescriptionsData = Array.isArray(patientPrescriptionsRawData)
          ? patientPrescriptionsRawData.map(p => ({
              ...p,
              type: 'INTERNAL',
              prescription_source: 'specialist_self_service',
              is_self_service: true,
              prescribed_by: p.prescribed_by || p.specialist || {
                profile: {
                  first_name: 'Doctor',
                  last_name: '',
                }
              },
            }))
          : [];

        // Process patient uploads from checkout (new verification system)
        const patientUploadsResult = results[5];
        let patientUploadsRawData = [];
        if (patientUploadsResult.status === 'fulfilled') {
          const responseData = patientUploadsResult.value.data;
          // API returns: { message, result: { uploads: [...], pagination: {...} } }
          // or via wrapper: { data: { uploads: [...] } }
          patientUploadsRawData = responseData?.result?.uploads
            || responseData?.data?.uploads
            || responseData?.uploads
            || responseData?.data
            || [];
        }
        const patientUploadsData = Array.isArray(patientUploadsRawData)
          ? patientUploadsRawData.map(p => {
              // Map verification_status to a display-friendly status
              const verificationStatusMap = {
                'PENDING': 'pending',
                'TIER1_PROCESSING': 'verifying',
                'TIER1_PASSED': 'verified',
                'TIER1_FAILED': 'verification_failed',
                'TIER2_PROCESSING': 'verifying',
                'TIER2_PASSED': 'verified',
                'TIER2_FAILED': 'verification_failed',
                'PHARMACIST_REVIEW': 'under_review',
                'APPROVED': 'approved',
                'REJECTED': 'rejected',
                'EXPIRED': 'expired',
              };
              const displayStatus = verificationStatusMap[p.verification_status] || p.verification_status?.toLowerCase() || 'pending';

              // Check if prescription was used in any orders
              const usedInOrders = p.used_in_orders || [];
              const isUsedInOrder = usedInOrders.length > 0;

              // Use prescription_number (primary), fallback to digital_signature.reference_number, then generate one
              const prescriptionNumber = p.prescription_number
                || p.digital_signature?.reference_number
                || (() => {
                    const createdDate = p.created_at ? new Date(p.created_at) : new Date();
                    const dateStr = createdDate.toISOString().slice(0, 10).replace(/-/g, '');
                    const idSuffix = p._id?.slice(-4).toUpperCase() || '0000';
                    return `RX-${dateStr}-${idSuffix}`;
                  })();

              return {
                ...p,
                type: 'EXTERNAL',
                prescription_source: 'patient_upload',
                prescription_number: prescriptionNumber,
                status: isUsedInOrder ? 'used_in_order' : displayStatus,
                verification_status: p.verification_status,
                used_in_orders: usedInOrders,
                usage_count: p.usage_count || 0,
                // Use OCR data for display
                specialist: p.ocr_data?.doctor_name || null,
                prescribed_by: p.ocr_data?.doctor_name ? {
                  profile: {
                    first_name: 'Dr.',
                    last_name: p.ocr_data.doctor_name,
                  }
                } : null,
                items: (p.ocr_data?.medications || p.verified_medications || []).map(med => ({
                  drug_name: med.name || med.matched_drug_name || med.prescription_medication_name,
                  dosage: med.dosage,
                  quantity: med.quantity,
                  instructions: med.instructions,
                })),
                documents: [{
                  url: p.s3_url,
                  file_type: p.mimetype,
                  original_name: p.original_filename,
                }],
              };
            })
          : [];

        // Combine all prescriptions
        const allPrescriptions = [
          ...specialistData,
          ...internalData,
          ...externalData,
          ...ordersData,
          ...patientPrescriptionsData,
          ...patientUploadsData,
        ];

        // Deduplicate by _id or prescription_number (same prescription from multiple endpoints)
        const seen = new Set();
        const uniquePrescriptions = allPrescriptions.filter(p => {
          const key = p._id || p.prescription_number;
          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        });

        // Sort by created_at descending (newest first)
        uniquePrescriptions.sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || 0);
          const dateB = new Date(b.created_at || b.createdAt || 0);
          return dateB - dateA;
        });

        commit("SET_PRESCRIPTIONS", uniquePrescriptions);
        commit("SET_ORDERS", ordersData);
        commit("SET_LOADING_STATE", false);
      } catch (error) {
        console.error("Error fetching prescriptions:", error);
        const errorMessage = error?.response?.data?.errorMessage || error?.message || "Failed to fetch prescriptions";
        commit("SET_ERROR_MESSAGE", errorMessage);
        commit("SET_LOADING_STATE", false);
        commit("SET_PRESCRIPTIONS", []);
      }
    },
  },
};
