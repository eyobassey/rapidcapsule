<template>
  <div class="verify-container">
    <div class="verify-card">
      <!-- Header -->
      <div class="verify-header">
        <div class="logo-section">
          <img src="/RapidCapsule_Logo.png" alt="Rapid Capsules" class="logo-img" />
          <div class="brand">
            <h1>RAPID CAPSULES</h1>
            <p>Prescription Verification</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Verifying prescription...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">!</div>
        <h2>Verification Failed</h2>
        <p>{{ error }}</p>
        <button @click="retry" class="retry-btn">Try Again</button>
      </div>

      <!-- Success State -->
      <div v-else-if="prescription" class="success-state">
        <!-- Verification Badge -->
        <div class="verification-badge" :class="{ 'hash-valid': hashValid, 'hash-invalid': hashValid === false }">
          <div class="badge-icon">
            <svg v-if="hashValid !== false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="badge-text">
            <h3 v-if="hashValid !== false">Verified Prescription</h3>
            <h3 v-else>Hash Mismatch</h3>
            <p v-if="hashValid !== false">This prescription is authentic</p>
            <p v-else>The verification hash does not match</p>
          </div>
        </div>

        <!-- Prescription Details -->
        <div class="prescription-details">
          <!-- Reference Info -->
          <div class="info-row">
            <div class="info-item">
              <label>Prescription Number</label>
              <span class="highlight">{{ prescription.prescription_number }}</span>
            </div>
            <div class="info-item">
              <label>Status</label>
              <span class="status-badge" :class="statusClass">{{ formatStatus(prescription.status) }}</span>
            </div>
          </div>

          <div class="info-row">
            <div class="info-item">
              <label>Date Issued</label>
              <span>{{ formatDate(prescription.created_at) }}</span>
            </div>
            <div class="info-item">
              <label>Valid Until</label>
              <span>{{ formatDate(prescription.valid_until) }}</span>
            </div>
          </div>

          <!-- Patient & Prescriber -->
          <div class="info-section">
            <div class="info-card">
              <h4>Patient</h4>
              <p class="name">{{ prescription.patient.full_name }}</p>
              <p class="id">ID: {{ prescription.patient.patient_id }}</p>
            </div>
            <div class="info-card">
              <h4>Prescriber</h4>
              <p class="name">{{ prescription.prescriber.full_name }}</p>
              <p class="id" v-if="prescription.prescriber.license_number">
                License: {{ prescription.prescriber.license_number }}
              </p>
              <p class="id" v-if="prescription.prescriber.specialization">
                {{ prescription.prescriber.specialization }}
              </p>
            </div>
          </div>

          <!-- Medications -->
          <div class="medications-section">
            <h4>Prescribed Medications</h4>
            <div class="medication-list">
              <div v-for="(item, index) in prescription.items" :key="index" class="medication-item">
                <div class="med-header">
                  <span class="med-number">{{ index + 1 }}</span>
                  <div class="med-name">
                    <strong>{{ item.drug_name }}</strong>
                    <span v-if="item.generic_name" class="generic">({{ item.generic_name }})</span>
                    <span v-if="item.strength" class="strength">{{ item.strength }}</span>
                  </div>
                  <span class="med-qty">Qty: {{ item.quantity }}</span>
                </div>
                <div class="med-instructions">
                  <span class="dosage">{{ item.dosage }}</span>
                  <span class="frequency">{{ item.frequency }}</span>
                  <span class="duration">for {{ item.duration }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Total -->
          <div class="total-section">
            <span>Total Amount</span>
            <span class="total-amount">{{ prescription.currency }} {{ formatAmount(prescription.total_amount) }}</span>
          </div>

          <!-- Download PDF -->
          <div v-if="prescription.pdf_url" class="pdf-section">
            <a :href="prescription.pdf_url" target="_blank" class="download-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div class="verify-footer">
          <p>This prescription was verified on {{ formatDateTime(new Date()) }}</p>
          <p>Rapid Capsules - Your healthcare, delivered.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

export default {
  name: 'PrescriptionVerify',
  setup() {
    const route = useRoute()
    const loading = ref(true)
    const error = ref(null)
    const prescription = ref(null)
    const hashValid = ref(null)

    const statusClass = computed(() => {
      const status = prescription.value?.status?.toLowerCase()
      const classes = {
        'paid': 'status-success',
        'delivered': 'status-success',
        'dispensed': 'status-success',
        'accepted': 'status-success',
        'pending_acceptance': 'status-warning',
        'pending_payment': 'status-warning',
        'processing': 'status-info',
        'shipped': 'status-info',
        'cancelled': 'status-error',
        'expired': 'status-error',
        'draft': 'status-default',
      }
      return classes[status] || 'status-default'
    })

    const formatStatus = (status) => {
      if (!status) return 'Unknown'
      return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    const formatDate = (date) => {
      if (!date) return 'N/A'
      return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    }

    const formatDateTime = (date) => {
      if (!date) return 'N/A'
      return new Date(date).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const formatAmount = (amount) => {
      if (!amount) return '0.00'
      return Number(amount).toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    const fetchPrescription = async () => {
      loading.value = true
      error.value = null

      try {
        const prescriptionNumber = route.params.prescriptionNumber
        const hash = route.query.h

        let url = `/api/prescriptions/verify/${prescriptionNumber}`
        if (hash) {
          url += `?h=${hash}`
        }

        const response = await fetch(url)
        const data = await response.json()

        if (data.statusCode === 200 && data.data) {
          prescription.value = data.data.prescription
          hashValid.value = data.data.hash_valid
        } else {
          error.value = data.message || 'Failed to verify prescription'
        }
      } catch (err) {
        console.error('Verification error:', err)
        error.value = 'Unable to verify prescription. Please try again.'
      } finally {
        loading.value = false
      }
    }

    const retry = () => {
      fetchPrescription()
    }

    onMounted(() => {
      fetchPrescription()
    })

    return {
      loading,
      error,
      prescription,
      hashValid,
      statusClass,
      formatStatus,
      formatDate,
      formatDateTime,
      formatAmount,
      retry
    }
  }
}
</script>

<style lang="scss" scoped>
.verify-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.verify-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
  margin-top: 20px;
  overflow: hidden;
}

.verify-header {
  background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
  padding: 24px;
  color: white;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-img {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  object-fit: contain;
  background: white;
  padding: 4px;
}

.brand h1 {
  font-size: 20px;
  margin: 0;
  font-weight: 700;
}

.brand p {
  margin: 4px 0 0;
  opacity: 0.9;
  font-size: 14px;
}

.loading-state {
  padding: 60px 24px;
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e0e0e0;
  border-top-color: #1a73e8;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  color: #666;
  font-size: 16px;
}

.error-state {
  padding: 60px 24px;
  text-align: center;
}

.error-icon {
  width: 60px;
  height: 60px;
  background: #ffebee;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
  color: #c62828;
  margin: 0 auto 16px;
}

.error-state h2 {
  color: #c62828;
  margin: 0 0 8px;
}

.error-state p {
  color: #666;
  margin: 0 0 24px;
}

.retry-btn {
  background: #1a73e8;
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #1557b0;
}

.success-state {
  padding: 24px;
}

.verification-badge {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #e8f5e9;
  border-radius: 12px;
  margin-bottom: 24px;
}

.verification-badge.hash-invalid {
  background: #fff3e0;
}

.badge-icon {
  width: 48px;
  height: 48px;
  background: #2e7d32;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.verification-badge.hash-invalid .badge-icon {
  background: #e65100;
}

.badge-icon svg {
  width: 28px;
  height: 28px;
  color: white;
}

.badge-text h3 {
  margin: 0;
  color: #2e7d32;
  font-size: 18px;
}

.verification-badge.hash-invalid .badge-text h3 {
  color: #e65100;
}

.badge-text p {
  margin: 4px 0 0;
  color: #666;
  font-size: 14px;
}

.prescription-details {
  background: #fafafa;
  border-radius: 12px;
  padding: 20px;
}

.info-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.info-item {
  flex: 1;
}

.info-item label {
  display: block;
  font-size: 12px;
  color: #78909c;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.info-item span {
  font-size: 15px;
  color: #333;
}

.info-item .highlight {
  font-weight: 600;
  color: #1a73e8;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-success { background: #e8f5e9; color: #2e7d32; }
.status-warning { background: #fff3e0; color: #e65100; }
.status-info { background: #e3f2fd; color: #1565c0; }
.status-error { background: #ffebee; color: #c62828; }
.status-default { background: #eceff1; color: #546e7a; }

.info-section {
  display: flex;
  gap: 16px;
  margin: 20px 0;
}

.info-card {
  flex: 1;
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.info-card h4 {
  margin: 0 0 8px;
  font-size: 12px;
  color: #78909c;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-card .name {
  font-weight: 600;
  color: #333;
  margin: 0 0 4px;
}

.info-card .id {
  font-size: 13px;
  color: #666;
  margin: 0;
}

.medications-section {
  margin-top: 20px;
}

.medications-section h4 {
  margin: 0 0 12px;
  font-size: 14px;
  color: #333;
}

.medication-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.medication-item {
  background: white;
  padding: 14px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.med-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 8px;
}

.med-number {
  width: 24px;
  height: 24px;
  background: #1a73e8;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.med-name {
  flex: 1;
}

.med-name strong {
  color: #1a237e;
  display: block;
}

.med-name .generic {
  color: #78909c;
  font-size: 13px;
}

.med-name .strength {
  display: block;
  color: #666;
  font-size: 13px;
}

.med-qty {
  background: #e3f2fd;
  color: #1565c0;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
}

.med-instructions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-left: 36px;
}

.med-instructions span {
  background: #f5f5f5;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 13px;
  color: #546e7a;
}

.total-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 2px solid #e0e0e0;
}

.total-section span:first-child {
  font-size: 14px;
  color: #666;
}

.total-amount {
  font-size: 20px;
  font-weight: 700;
  color: #1a73e8;
}

.pdf-section {
  margin-top: 20px;
  text-align: center;
}

.download-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #1a73e8;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: background 0.2s;
}

.download-btn:hover {
  background: #1557b0;
}

.download-btn svg {
  width: 20px;
  height: 20px;
}

.verify-footer {
  text-align: center;
  padding: 20px 24px;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
}

.verify-footer p {
  margin: 4px 0;
  font-size: 12px;
  color: #78909c;
}

@media (max-width: 480px) {
  .verify-container {
    padding: 12px;
  }

  .verify-card {
    margin-top: 0;
    border-radius: 12px;
  }

  .verify-header {
    padding: 16px;
  }

  .brand h1 {
    font-size: 16px;
  }

  .info-row {
    flex-direction: column;
    gap: 12px;
  }

  .info-section {
    flex-direction: column;
  }

  .med-header {
    flex-wrap: wrap;
  }

  .med-qty {
    margin-left: 36px;
  }

  .med-instructions {
    padding-left: 0;
  }
}
</style>
