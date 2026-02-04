<template>
  <div class="appointment-detail-page">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="back-btn" @click="goBack">
        <v-icon name="hi-arrow-left" scale="1.1" />
      </button>
      <span class="header-title">Appointment Details</span>
      <button class="menu-btn" @click="showMoreOptions = !showMoreOptions">
        <v-icon name="hi-dots-vertical" scale="1.1" />
      </button>
    </header>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <v-icon name="hi-calendar" scale="1.2" class="spinner-icon" />
      </div>
      <p>Loading appointment...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">
        <v-icon name="hi-exclamation-circle" scale="2.5" />
      </div>
      <h3>Unable to load appointment</h3>
      <p>{{ error }}</p>
      <button class="btn-retry" @click="loadAppointment">
        <v-icon name="hi-refresh" scale="0.9" />
        Try Again
      </button>
    </div>

    <!-- Main Content -->
    <div v-else-if="appointment" class="page-content">
      <!-- Hero Section - Split Layout like Health Checkup -->
      <section class="hero">
        <div class="hero__content">
          <button class="back-link desktop-only" @click="goBack">
            <v-icon name="hi-arrow-left" scale="0.85" />
            <span>Back to Appointments</span>
          </button>
          <div class="hero__badge" :class="statusClass">
            <div class="badge-pulse"></div>
            <v-icon :name="statusIcon" />
            <span>{{ statusLabel }}</span>
          </div>
          <h1 class="hero__title">
            {{ appointmentTypeLabel.split(' ')[0] }}<br/>
            <span class="hero__title-accent">{{ appointmentTypeLabel.split(' ').slice(1).join(' ') || 'Appointment' }}</span>
          </h1>
          <p class="hero__subtitle">
            with {{ specialistName }}
          </p>
          <div class="hero__stats">
            <div class="hero-stat">
              <span class="hero-stat__value">{{ formatDay(appointment.start_time) }}</span>
              <span class="hero-stat__label">{{ formatMonth(appointment.start_time) }}</span>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <span class="hero-stat__value">{{ formatTime(appointment.start_time) }}</span>
              <span class="hero-stat__label">Time</span>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <span class="hero-stat__value">{{ appointment.duration_minutes || 30 }}</span>
              <span class="hero-stat__label">Minutes</span>
            </div>
          </div>
        </div>
        <div class="hero__visual">
          <div class="appointment-orb">
            <div class="orb-ring orb-ring--1"></div>
            <div class="orb-ring orb-ring--2"></div>
            <div class="orb-ring orb-ring--3"></div>
            <div class="orb-core">
              <v-icon name="hi-video-camera" />
            </div>
          </div>
          <div class="floating-icons">
            <div class="float-icon float-icon--1"><v-icon name="hi-clock" /></div>
            <div class="float-icon float-icon--2"><v-icon name="hi-user" /></div>
            <div class="float-icon float-icon--3"><v-icon name="hi-check-circle" /></div>
          </div>
        </div>
      </section>

      <!-- Bento Grid -->
      <section class="bento-grid">
        <!-- Quick Actions Card -->
        <div class="bento-card actions-card" :class="{ 'span-full': !canJoinMeeting }">
          <div class="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div class="actions-row">
            <button v-if="canJoinMeeting" class="action-btn primary" @click="joinMeeting">
              <div class="action-icon emerald">
                <v-icon name="hi-video-camera" scale="1.1" />
              </div>
              <span>Join Meeting</span>
            </button>
            <button v-if="canReschedule" class="action-btn" @click="showRescheduleModal = true">
              <div class="action-icon sky">
                <v-icon name="hi-clock" scale="1.1" />
              </div>
              <span>Reschedule</span>
            </button>
            <button v-if="canCancel" class="action-btn" @click="showCancelModal = true">
              <div class="action-icon rose">
                <v-icon name="hi-x-circle" scale="1.1" />
              </div>
              <span>Cancel</span>
            </button>
            <button v-if="isCompleted" class="action-btn" @click="bookFollowUp">
              <div class="action-icon violet">
                <v-icon name="hi-plus-circle" scale="1.1" />
              </div>
              <span>Book Follow-up</span>
            </button>
            <button v-if="isMissed || isCancelled" class="action-btn primary" @click="bookAgain">
              <div class="action-icon sky">
                <v-icon name="hi-refresh" scale="1.1" />
              </div>
              <span>Book Again</span>
            </button>
            <button v-if="isMissed || isCancelled" class="action-btn" @click="contactSupport">
              <div class="action-icon slate">
                <v-icon name="hi-mail" scale="1.1" />
              </div>
              <span>Contact Support</span>
            </button>
          </div>
        </div>

        <!-- Specialist Card -->
        <div class="bento-card specialist-card">
          <div class="card-header">
            <h3>Your Specialist</h3>
            <button class="view-profile-btn" @click="viewSpecialistProfile">
              <span>View Profile</span>
              <v-icon name="hi-arrow-right" scale="0.7" />
            </button>
          </div>
          <div class="specialist-info">
            <div class="specialist-avatar">
              <img
                v-if="specialistPhoto && !specialistImageError"
                :src="specialistPhoto"
                :alt="specialistName"
                @error="specialistImageError = true"
              />
              <div v-else class="avatar-placeholder">
                <span>{{ specialistInitials }}</span>
              </div>
            </div>
            <div class="specialist-details">
              <h4>{{ specialistName }}</h4>
              <p class="specialist-title">{{ specialistSpecialization }}</p>
              <div class="specialist-meta">
                <span v-if="specialistExperience" class="meta-item">
                  <v-icon name="hi-badge-check" scale="0.7" />
                  {{ specialistExperience }}+ years exp.
                </span>
                <span v-if="appointment.consultation_service?.name" class="meta-item">
                  <v-icon name="hi-clipboard-check" scale="0.7" />
                  {{ appointment.consultation_service.name }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Appointment Details Card -->
        <div class="bento-card details-card">
          <div class="card-header">
            <h3>Appointment Details</h3>
          </div>
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-icon sky">
                <v-icon name="hi-calendar" scale="0.9" />
              </div>
              <div class="detail-content">
                <span class="detail-label">Date</span>
                <span class="detail-value">{{ formatDateFull(appointment.start_time) }}</span>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-icon emerald">
                <v-icon name="hi-clock" scale="0.9" />
              </div>
              <div class="detail-content">
                <span class="detail-label">Time</span>
                <span class="detail-value">{{ formatTime(appointment.start_time) }}</span>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-icon violet">
                <v-icon :name="channelIcon" scale="0.9" />
              </div>
              <div class="detail-content">
                <span class="detail-label">Channel</span>
                <span class="detail-value">{{ channelLabel }}</span>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-icon amber">
                <v-icon name="hi-tag" scale="0.9" />
              </div>
              <div class="detail-content">
                <span class="detail-label">Type</span>
                <span class="detail-value">{{ appointment.urgency === 'urgent' ? 'Urgent' : 'Routine' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Zoom Meeting Details Card -->
        <div class="bento-card meeting-card" v-if="hasMeetingDetails && !isCompleted">
          <div class="card-header">
            <h3>Meeting Details</h3>
            <span class="meeting-platform">
              <v-icon name="si-zoom" scale="0.8" />
              Zoom
            </span>
          </div>
          <div class="meeting-details-grid">
            <div class="meeting-detail-item" v-if="zoomMeetingId">
              <div class="detail-label">Meeting ID</div>
              <div class="detail-value-row">
                <span class="detail-value mono">{{ formatMeetingId(zoomMeetingId) }}</span>
                <button class="copy-btn" @click="copyToClipboard(zoomMeetingId, 'Meeting ID')">
                  <v-icon name="hi-clipboard-copy" scale="0.8" />
                </button>
              </div>
            </div>
            <div class="meeting-detail-item" v-if="zoomPasscode">
              <div class="detail-label">Passcode</div>
              <div class="detail-value-row">
                <span class="detail-value mono">{{ zoomPasscode }}</span>
                <button class="copy-btn" @click="copyToClipboard(zoomPasscode, 'Passcode')">
                  <v-icon name="hi-clipboard-copy" scale="0.8" />
                </button>
              </div>
            </div>
            <div class="meeting-detail-item full-width" v-if="zoomJoinUrl">
              <div class="detail-label">Join Link</div>
              <div class="detail-value-row">
                <a :href="zoomJoinUrl" target="_blank" class="join-link">{{ truncateUrl(zoomJoinUrl) }}</a>
                <button class="copy-btn" @click="copyToClipboard(zoomJoinUrl, 'Join Link')">
                  <v-icon name="hi-clipboard-copy" scale="0.8" />
                </button>
              </div>
            </div>
          </div>
          <button class="join-meeting-btn" @click="joinMeeting" :disabled="!canJoinMeeting">
            <v-icon name="hi-video-camera" scale="0.9" />
            <span>{{ canJoinMeeting ? 'Join Meeting Now' : 'Meeting Not Started' }}</span>
          </button>
          <p class="meeting-note" v-if="!canJoinMeeting">
            <v-icon name="hi-information-circle" scale="0.8" />
            You can join the meeting 15 minutes before the scheduled time.
          </p>
        </div>

        <!-- Meeting Summary Card (Completed/Missed Appointments) -->
        <div class="bento-card meeting-summary-card" v-if="isCompleted || isMissed">
          <div class="card-header">
            <h3>Meeting Summary</h3>
            <span class="meeting-status-badge" :class="meetingStatusClass">
              {{ meetingStatusLabel }}
            </span>
          </div>

          <div class="summary-grid">
            <div class="summary-item">
              <v-icon name="hi-clock" class="summary-icon" />
              <div class="summary-content">
                <span class="summary-label">Duration</span>
                <span class="summary-value">{{ actualDuration }}</span>
              </div>
            </div>
            <div class="summary-item">
              <v-icon name="hi-users" class="summary-icon" />
              <div class="summary-content">
                <span class="summary-label">Participants</span>
                <span class="summary-value">{{ participantCount }}</span>
              </div>
            </div>
            <div class="summary-item" v-if="actualStartTime">
              <v-icon name="hi-play" class="summary-icon" />
              <div class="summary-content">
                <span class="summary-label">Started At</span>
                <span class="summary-value">{{ formatDateTime(actualStartTime) }}</span>
              </div>
            </div>
            <div class="summary-item" v-if="actualEndTime">
              <v-icon name="hi-stop" class="summary-icon" />
              <div class="summary-content">
                <span class="summary-label">Ended At</span>
                <span class="summary-value">{{ formatDateTime(actualEndTime) }}</span>
              </div>
            </div>
          </div>

          <!-- Attendance Section -->
          <div class="attendance-section" v-if="hasAttendanceData">
            <h4 class="section-subtitle">Attendance</h4>
            <div class="attendance-list">
              <div class="attendance-item" :class="{ joined: patientJoined }">
                <div class="attendance-avatar patient">
                  <v-icon name="hi-user" scale="0.8" />
                </div>
                <div class="attendance-info">
                  <span class="attendance-name">You (Patient)</span>
                  <span class="attendance-status" v-if="patientJoined">
                    Joined: {{ formatDateTime(patientJoinedAt) }}
                  </span>
                  <span class="attendance-status not-joined" v-else>Did not join</span>
                </div>
                <v-icon v-if="patientJoined" name="hi-check-circle" class="attendance-check" />
                <v-icon v-else name="hi-x-circle" class="attendance-x" />
              </div>
              <div class="attendance-item" :class="{ joined: specialistJoined }">
                <div class="attendance-avatar specialist">
                  <v-icon name="hi-academic-cap" scale="0.8" />
                </div>
                <div class="attendance-info">
                  <span class="attendance-name">{{ specialistName }}</span>
                  <span class="attendance-status" v-if="specialistJoined">
                    Joined: {{ formatDateTime(specialistJoinedAt) }}
                  </span>
                  <span class="attendance-status not-joined" v-else>Did not join</span>
                </div>
                <v-icon v-if="specialistJoined" name="hi-check-circle" class="attendance-check" />
                <v-icon v-else name="hi-x-circle" class="attendance-x" />
              </div>
            </div>
          </div>
        </div>

        <!-- Recording & Transcript Card (Completed) -->
        <div class="bento-card recording-card" v-if="isCompleted && hasRecording">
          <div class="card-header">
            <h3>Session Recording</h3>
            <span class="recording-badge available">
              <v-icon name="hi-check-circle" scale="0.7" />
              Available
            </span>
          </div>
          <div class="recording-content">
            <div class="recording-preview" @click="playRecording">
              <div class="play-overlay">
                <div class="play-btn">
                  <v-icon name="hi-play" scale="1.5" />
                </div>
              </div>
              <div class="recording-meta">
                <span class="recording-duration">
                  <v-icon name="hi-clock" scale="0.7" />
                  {{ recordingDuration }}
                </span>
                <span class="recording-label">Full session recording</span>
              </div>
            </div>
            <div class="recording-actions">
              <button class="recording-action-btn" @click="playRecording">
                <v-icon name="hi-play" scale="0.9" />
                <span>Play</span>
              </button>
              <button class="recording-action-btn" v-if="recordingPassword" @click="copyRecordingPassword">
                <v-icon name="hi-lock-closed" scale="0.9" />
                <span>Password: {{ recordingPassword }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Transcript Card (Completed) -->
        <div class="bento-card transcript-card" v-if="isCompleted && hasTranscript">
          <div class="card-header">
            <h3>Meeting Transcript</h3>
          </div>
          <div class="transcript-content">
            <div class="transcript-info">
              <v-icon name="hi-document-text" scale="1.2" class="transcript-icon" />
              <div class="transcript-details">
                <span class="transcript-title">Transcript available for download</span>
                <span class="transcript-subtitle">Full conversation record</span>
              </div>
            </div>
            <button class="download-transcript-btn" @click="downloadTranscript">
              <v-icon name="hi-download" scale="0.9" />
              <span>Download</span>
            </button>
          </div>
        </div>

        <!-- Payment Info Card -->
        <div class="bento-card payment-card">
          <div class="card-header">
            <h3>Payment</h3>
            <span class="payment-status" :class="paymentStatusClass">
              {{ paymentStatusLabel }}
            </span>
          </div>
          <div class="payment-amount">
            <span class="currency">{{ appointment.currency || 'NGN' }}</span>
            <span class="amount">{{ formatAmount(appointment.appointment_fee) }}</span>
          </div>
          <div class="payment-details">
            <div class="payment-detail-row" v-if="paymentMethod">
              <span class="payment-label">Method</span>
              <span class="payment-value">
                <v-icon :name="paymentMethod === 'card' ? 'hi-credit-card' : 'bi-wallet2'" scale="0.7" />
                {{ paymentMethodLabel }}
              </span>
            </div>
            <div class="payment-detail-row" v-if="appointment.payment_reference">
              <span class="payment-label">Reference</span>
              <span class="payment-value mono">{{ appointment.payment_reference }}</span>
            </div>
            <div class="payment-detail-row" v-if="appointment.consultation_service">
              <span class="payment-label">Service</span>
              <span class="payment-value">{{ appointment.consultation_service.name }}</span>
            </div>
            <div class="payment-detail-row" v-if="appointment.platform_fee">
              <span class="payment-label">Platform Fee</span>
              <span class="payment-value">{{ appointment.currency || 'NGN' }} {{ formatAmount(appointment.platform_fee) }}</span>
            </div>
          </div>
        </div>

        <!-- Notes & Prescriptions Row -->
        <div class="bento-row notes-rx-row">
          <!-- Your Notes & Files Card -->
          <div class="bento-card notes-card">
            <div class="card-header">
              <h3>Your Notes & Files</h3>
              <span class="notes-count" v-if="notesAndFilesCount > 0">
                {{ notesAndFilesCount }} item{{ notesAndFilesCount > 1 ? 's' : '' }}
              </span>
            </div>

            <!-- Patient Notes -->
            <div v-if="appointment.patient_notes" class="patient-note">
              <div class="note-header">
                <v-icon name="hi-annotation" scale="0.9" class="note-icon" />
                <span>Your Note</span>
              </div>
              <p class="note-text">{{ appointment.patient_notes }}</p>
            </div>

            <!-- Shared Documents -->
            <div v-if="appointment.shared_documents?.length" class="shared-files">
              <div class="files-header">
                <v-icon name="hi-folder" scale="0.9" />
                <span>Shared Files ({{ appointment.shared_documents.length }})</span>
              </div>
              <div class="files-list">
                <div v-for="doc in appointment.shared_documents" :key="doc.url || doc.name" class="file-item" @click="openDocument(doc)">
                  <div class="file-icon">
                    <v-icon :name="getFileIcon(doc.name || doc.type)" scale="0.9" />
                  </div>
                  <div class="file-info">
                    <span class="file-name">{{ doc.name || 'Document' }}</span>
                    <span class="file-meta" v-if="doc.size || doc.type">
                      {{ doc.type || getFileType(doc.name) }}{{ doc.size ? ' • ' + doc.size : '' }}
                    </span>
                  </div>
                  <v-icon name="hi-external-link" scale="0.8" class="file-action" />
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="!appointment.patient_notes && !appointment.shared_documents?.length" class="empty-notes">
              <v-icon name="hi-document-text" scale="1.5" />
              <p>No notes or files were shared for this appointment</p>
            </div>
          </div>

          <!-- Prescriptions Card (Completed) -->
          <div class="bento-card prescriptions-card" v-if="isCompleted && prescriptions.length > 0">
            <div class="card-header">
              <div class="header-left">
                <div class="rx-badge">
                  <v-icon name="ri-capsule-line" scale="0.8" />
                </div>
                <h3>Prescriptions</h3>
              </div>
              <span class="rx-count-badge">{{ prescriptions.length }}</span>
            </div>

            <div class="prescriptions-list">
              <div v-for="(rx, index) in prescriptions" :key="rx._id" class="prescription-item">
                <div class="rx-header">
                  <span class="rx-number">{{ rx.prescription_number || `RX-${index + 1}` }}</span>
                  <span class="rx-date">{{ formatDate(rx.created_at) }}</span>
                </div>

                <!-- Medications List -->
                <div class="medications-list">
                  <div v-for="(med, mIndex) in (rx.medications || []).slice(0, 3)" :key="mIndex" class="medication-item">
                    <div class="med-icon">
                      <v-icon name="ri-medicine-bottle-line" scale="0.7" />
                    </div>
                    <div class="med-info">
                      <span class="med-name">{{ med.drug_name || 'Medication' }}{{ med.strength ? ` (${med.strength})` : '' }}</span>
                      <span class="med-details" v-if="med.dosage || med.frequency || med.duration">
                        {{ [med.dosage, med.frequency, med.duration].filter(Boolean).join(' • ') }}
                      </span>
                    </div>
                  </div>
                  <div v-if="(rx.medications || []).length > 3" class="more-meds">
                    +{{ rx.medications.length - 3 }} more medication{{ rx.medications.length - 3 > 1 ? 's' : '' }}
                  </div>
                  <div v-if="!(rx.medications || []).length" class="no-meds">
                    <span>{{ rx.item_count || 0 }} medication(s) prescribed</span>
                  </div>
                </div>

                <button class="view-rx-btn" @click="viewPrescription(rx)">
                  <span>View Prescription</span>
                  <v-icon name="hi-arrow-right" scale="0.7" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Health Checkup Link Card -->
        <div class="bento-card checkup-card" v-if="appointment.health_checkup_id">
          <div class="checkup-banner" @click="viewHealthCheckup">
            <div class="checkup-icon">
              <v-icon name="hi-sparkles" scale="1.2" />
            </div>
            <div class="checkup-content">
              <h4>Linked Health Assessment</h4>
              <p>This appointment is based on your AI health checkup results</p>
            </div>
            <v-icon name="hi-chevron-right" scale="1" class="checkup-arrow" />
          </div>
        </div>

        <!-- Clinical Notes Card (Completed) -->
        <div class="bento-card clinical-notes-card" v-if="isCompleted && clinicalNote">
          <div class="card-header">
            <h3>Clinical Notes</h3>
          </div>
          <div class="note-preview">
            <div class="note-section" v-if="clinicalNote.chief_complaint">
              <span class="note-label">Chief Complaint</span>
              <p>{{ clinicalNote.chief_complaint }}</p>
            </div>
            <div class="note-section" v-if="clinicalNote.diagnosis">
              <span class="note-label">Diagnosis</span>
              <p>{{ clinicalNote.diagnosis }}</p>
            </div>
          </div>
          <button class="view-notes-btn" @click="viewClinicalNotes">
            View Full Notes
            <v-icon name="hi-arrow-right" scale="0.8" />
          </button>
        </div>
      </section>

      <!-- Appointment Timeline Card -->
      <section class="bento-card timeline-card">
        <div class="card-header">
          <h3>Appointment Timeline</h3>
        </div>
        <div class="timeline">
          <div class="timeline-item" :class="{ completed: true }">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <span class="timeline-title">Appointment Booked</span>
              <span class="timeline-date">{{ formatDateTime(appointment.created_at) }}</span>
            </div>
          </div>
          <div v-if="appointment.payment_status?.toUpperCase() === 'SUCCESSFUL'" class="timeline-item" :class="{ completed: true }">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <span class="timeline-title">Payment Confirmed</span>
              <span class="timeline-date">{{ formatDateTime(appointment.payment_date || appointment.created_at) }}</span>
            </div>
          </div>
          <div v-if="appointment.status === 'completed'" class="timeline-item" :class="{ completed: true }">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <span class="timeline-title">Consultation Completed</span>
              <span class="timeline-date">{{ formatDateTime(appointment.end_time || appointment.start_time) }}</span>
            </div>
          </div>
          <div v-else-if="appointment.status === 'cancelled'" class="timeline-item cancelled">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <span class="timeline-title">Appointment Cancelled</span>
              <span class="timeline-date">{{ appointment.cancellation_reason || 'No reason provided' }}</span>
            </div>
          </div>
          <div v-else class="timeline-item pending">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <span class="timeline-title">Awaiting Consultation</span>
              <span class="timeline-date">{{ formatDateTime(appointment.start_time) }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Reschedule Modal -->
    <div v-if="showRescheduleModal" class="modal-overlay" @click.self="showRescheduleModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Reschedule Appointment</h3>
          <button class="close-btn" @click="showRescheduleModal = false">
            <v-icon name="hi-x" scale="1.1" />
          </button>
        </div>
        <div class="modal-body">
          <p>You'll be redirected to select a new date and time for your appointment.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showRescheduleModal = false">Cancel</button>
          <button class="btn-primary" @click="rescheduleAppointment">Continue</button>
        </div>
      </div>
    </div>

    <!-- Cancel Modal -->
    <div v-if="showCancelModal" class="modal-overlay" @click.self="showCancelModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Cancel Appointment</h3>
          <button class="close-btn" @click="showCancelModal = false">
            <v-icon name="hi-x" scale="1.1" />
          </button>
        </div>
        <div class="modal-body">
          <p class="warning-text">Are you sure you want to cancel this appointment?</p>
          <div class="input-group">
            <label>Reason for cancellation (optional)</label>
            <textarea v-model="cancellationReason" placeholder="Enter your reason..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showCancelModal = false">Keep Appointment</button>
          <button class="btn-danger" @click="cancelAppointment" :disabled="isCancelling">
            {{ isCancelling ? 'Cancelling...' : 'Cancel Appointment' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { format, parseISO, isAfter, addMinutes, differenceInMinutes } from 'date-fns';
import { useToast } from 'vue-toast-notification';
import apiFactory from '@/services/apiFactory';

const route = useRoute();
const router = useRouter();
const toast = useToast();

// State
const isLoading = ref(true);
const error = ref(null);
const appointment = ref(null);
const specialist = ref(null);
const prescriptions = ref([]);
const clinicalNote = ref(null);
const showRescheduleModal = ref(false);
const showCancelModal = ref(false);
const showMoreOptions = ref(false);
const cancellationReason = ref('');
const isCancelling = ref(false);
const specialistImageError = ref(false);

// Computed
const appointmentId = computed(() => route.params.id);

const specialistName = computed(() => {
  const profile = specialist.value?.profile;
  if (!profile) return 'Specialist';
  const firstName = profile.first_name || profile.firstName || '';
  const lastName = profile.last_name || profile.lastName || '';
  return `Dr. ${firstName} ${lastName}`.trim() || 'Specialist';
});

const specialistInitials = computed(() => {
  const profile = specialist.value?.profile;
  if (!profile) return 'DR';
  const firstName = profile.first_name || profile.firstName || '';
  const lastName = profile.last_name || profile.lastName || '';
  return `${(firstName?.[0] || '')}${(lastName?.[0] || '')}`.toUpperCase() || 'DR';
});

const specialistPhoto = computed(() => {
  const profile = specialist.value?.profile;
  return profile?.profile_photo || profile?.profile_image || profile?.avatar || null;
});

const specialistSpecialization = computed(() => {
  const profile = specialist.value?.profile;
  return profile?.specialization ||
         profile?.specialty ||
         specialist.value?.professional_practice?.area_of_specialty ||
         'Medical Specialist';
});

const specialistExperience = computed(() => {
  const profile = specialist.value?.profile;
  return profile?.experience_years || profile?.years_of_experience || null;
});

const appointmentTypeLabel = computed(() => {
  const type = appointment.value?.appointment_type;
  const types = {
    general: 'General Consultation',
    follow_up: 'Follow-up Consultation',
    specialist: 'Specialist Consultation',
    mental_health: 'Mental Health Session',
  };
  return types[type] || 'Medical Consultation';
});

// Normalize status to lowercase for comparisons
const normalizedStatus = computed(() => {
  const status = appointment.value?.status;
  if (!status) return '';
  const upper = status.toUpperCase();
  const map = {
    'OPEN': 'confirmed',
    'CONFIRMED': 'confirmed',
    'PENDING': 'pending',
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled',
    'FAILED': 'cancelled',
    'ONGOING': 'ongoing',
    'RESCHEDULED': 'confirmed',
    'MISSED': 'missed',
  };
  return map[upper] || status.toLowerCase();
});

const statusClass = computed(() => {
  const status = normalizedStatus.value;
  return {
    'status-upcoming': status === 'upcoming' || status === 'scheduled' || status === 'confirmed' || status === 'pending',
    'status-completed': status === 'completed',
    'status-cancelled': status === 'cancelled',
    'status-missed': status === 'missed',
    'status-in-progress': status === 'in_progress' || status === 'ongoing',
  };
});

const statusLabel = computed(() => {
  const status = normalizedStatus.value;
  const labels = {
    upcoming: 'Upcoming',
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    pending: 'Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
    missed: 'Missed',
    in_progress: 'In Progress',
    ongoing: 'Ongoing',
  };
  return labels[status] || 'Scheduled';
});

const statusIcon = computed(() => {
  const status = normalizedStatus.value;
  const icons = {
    upcoming: 'hi-clock',
    scheduled: 'hi-clock',
    confirmed: 'hi-check-circle',
    pending: 'hi-clock',
    completed: 'hi-check-circle',
    cancelled: 'hi-x-circle',
    missed: 'hi-exclamation-circle',
    in_progress: 'hi-video-camera',
    ongoing: 'hi-video-camera',
  };
  return icons[status] || 'hi-clock';
});

const isCompleted = computed(() => normalizedStatus.value === 'completed');
const isMissed = computed(() => normalizedStatus.value === 'missed');
const isCancelled = computed(() => normalizedStatus.value === 'cancelled');

// Meeting Summary computed properties
const meetingStatusClass = computed(() => {
  if (isCompleted.value) return 'status-completed';
  if (isMissed.value) return 'status-missed';
  return 'status-unknown';
});

const meetingStatusLabel = computed(() => {
  const attendance = appointment.value?.attendance;
  if (attendance?.both_joined) return 'Meeting Held';
  if (attendance?.patient_joined || attendance?.specialist_joined) return 'Partially Attended';
  if (isCompleted.value) return 'Completed';
  if (isMissed.value) return 'Missed';
  return 'Unknown';
});

const actualDuration = computed(() => {
  const duration = appointment.value?.call_duration?.time_taken ||
                   appointment.value?.meeting_platform_data?.actual_duration_minutes ||
                   appointment.value?.recording?.recording_duration_minutes;
  if (!duration) return 'N/A';
  return `${duration} min`;
});

const participantCount = computed(() => {
  const attendance = appointment.value?.attendance;
  let count = 0;
  if (attendance?.patient_joined) count++;
  if (attendance?.specialist_joined) count++;
  return count || (appointment.value?.participants?.length || 0);
});

const actualStartTime = computed(() => {
  return appointment.value?.meeting_platform_data?.actual_start_time ||
         appointment.value?.attendance?.patient_joined_at ||
         appointment.value?.attendance?.specialist_joined_at;
});

const actualEndTime = computed(() => {
  return appointment.value?.meeting_platform_data?.actual_end_time ||
         appointment.value?.attendance?.patient_left_at ||
         appointment.value?.attendance?.specialist_left_at;
});

// Attendance computed properties
const hasAttendanceData = computed(() => {
  const attendance = appointment.value?.attendance;
  return attendance && (attendance.patient_joined !== undefined || attendance.specialist_joined !== undefined);
});

const patientJoined = computed(() => appointment.value?.attendance?.patient_joined || false);
const patientJoinedAt = computed(() => appointment.value?.attendance?.patient_joined_at);
const specialistJoined = computed(() => appointment.value?.attendance?.specialist_joined || false);
const specialistJoinedAt = computed(() => appointment.value?.attendance?.specialist_joined_at);

// Recording computed properties
const hasRecording = computed(() => {
  const recording = appointment.value?.recording;
  return recording?.recording_status === 'available' || recording?.recording_url;
});

const recordingDuration = computed(() => {
  const duration = appointment.value?.recording?.recording_duration_minutes;
  if (!duration) return '';
  return `${duration} minutes`;
});

const recordingPassword = computed(() => appointment.value?.recording?.recording_password);

const recordingUrl = computed(() => {
  return appointment.value?.recording?.recording_url || appointment.value?.recording_url;
});

// Transcript computed properties
const hasTranscript = computed(() => {
  const transcript = appointment.value?.transcript;
  return transcript?.transcript_status === 'available' && transcript?.transcript_url;
});

const transcriptUrl = computed(() => appointment.value?.transcript?.transcript_url);

const canJoinMeeting = computed(() => {
  if (!appointment.value) return false;
  const status = normalizedStatus.value;
  if (status === 'completed' || status === 'cancelled') return false;

  const startTime = parseISO(appointment.value.start_time);
  const now = new Date();
  const minutesBefore = differenceInMinutes(startTime, now);

  // Allow joining 10 minutes before and during the appointment
  return minutesBefore <= 10 && minutesBefore >= -60;
});

const canReschedule = computed(() => {
  if (!appointment.value) return false;
  const status = normalizedStatus.value;
  if (status === 'completed' || status === 'cancelled') return false;

  const startTime = parseISO(appointment.value.start_time);
  // Can reschedule if more than 2 hours before
  return isAfter(startTime, addMinutes(new Date(), 120));
});

const canCancel = computed(() => {
  if (!appointment.value) return false;
  const status = normalizedStatus.value;
  if (status === 'completed' || status === 'cancelled') return false;

  const startTime = parseISO(appointment.value.start_time);
  // Can cancel if more than 1 hour before
  return isAfter(startTime, addMinutes(new Date(), 60));
});

const channelIcon = computed(() => {
  const channel = appointment.value?.meeting_channel;
  const icons = {
    video: 'hi-video-camera',
    audio: 'hi-phone',
    chat: 'hi-chat',
    in_person: 'hi-office-building',
  };
  return icons[channel] || 'hi-video-camera';
});

const channelLabel = computed(() => {
  const channel = appointment.value?.meeting_channel;
  const labels = {
    video: 'Video Call',
    audio: 'Voice Call',
    chat: 'Chat',
    in_person: 'In Person',
  };
  return labels[channel] || 'Video Call';
});

// Zoom Meeting Details
const zoomMeetingId = computed(() => {
  return appointment.value?.zoom_meeting?.id ||
         appointment.value?.meeting_id ||
         appointment.value?.zoom_meeting_id;
});

const zoomPasscode = computed(() => {
  return appointment.value?.meeting_password ||
         appointment.value?.zoom_meeting?.password ||
         appointment.value?.zoom_passcode;
});

const zoomJoinUrl = computed(() => {
  return appointment.value?.join_url ||
         appointment.value?.zoom_meeting?.join_url ||
         appointment.value?.meeting_link;
});

const hasMeetingDetails = computed(() => {
  return zoomMeetingId.value || zoomPasscode.value || zoomJoinUrl.value;
});

const notesAndFilesCount = computed(() => {
  let count = 0;
  if (appointment.value?.patient_notes) count++;
  if (appointment.value?.shared_documents?.length) {
    count += appointment.value.shared_documents.length;
  }
  return count;
});

const paymentStatusClass = computed(() => {
  const status = appointment.value?.payment_status?.toUpperCase();
  return {
    'payment-paid': status === 'SUCCESSFUL' || status === 'PAID',
    'payment-pending': status === 'PENDING',
    'payment-refunded': status === 'REFUNDED',
    'payment-failed': status === 'FAILED',
  };
});

const paymentStatusLabel = computed(() => {
  const status = appointment.value?.payment_status?.toUpperCase();
  const labels = {
    SUCCESSFUL: 'Paid',
    PAID: 'Paid',
    PENDING: 'Pending',
    REFUNDED: 'Refunded',
    FAILED: 'Failed',
  };
  return labels[status] || 'Pending';
});

const paymentMethod = computed(() => {
  const method = appointment.value?.payment_source || appointment.value?.payment_method;
  if (!method) return null;
  const normalized = method.toLowerCase();
  if (normalized.includes('card')) return 'card';
  if (normalized.includes('wallet')) return 'wallet';
  return method;
});

const paymentMethodLabel = computed(() => {
  const method = paymentMethod.value;
  if (!method) return null;
  if (method === 'card') return 'Card Payment';
  if (method === 'wallet' || method === 'patient_wallet') return 'Wallet';
  if (method === 'specialist_wallet') return 'Specialist Wallet';
  return method;
});

// Methods
async function loadAppointment() {
  isLoading.value = true;
  error.value = null;
  specialistImageError.value = false;

  try {
    const response = await apiFactory.$_getAppointmentById(appointmentId.value);
    appointment.value = response.data?.data || response.data;

    // Use embedded specialist data from the appointment response
    if (appointment.value?.specialist) {
      if (typeof appointment.value.specialist === 'object') {
        specialist.value = appointment.value.specialist;
      }
    }

    // Load prescription and clinical notes for completed appointments
    const status = (appointment.value?.status || '').toUpperCase();
    if (status === 'COMPLETED') {
      loadCompletedData();
    }
  } catch (err) {
    console.error('Error loading appointment:', err);
    error.value = err.response?.data?.message || 'Failed to load appointment details';
  } finally {
    isLoading.value = false;
  }
}

async function loadCompletedData() {
  // Load prescriptions (use patient endpoint, not specialist)
  try {
    const rxRes = await apiFactory.$_getPatientPrescriptionsForAppointment(appointmentId.value);
    const rxData = rxRes.data?.data || rxRes.data;
    // API returns array of prescriptions
    prescriptions.value = Array.isArray(rxData) ? rxData : (rxData ? [rxData] : []);
  } catch (e) {
    // No prescriptions for this appointment
    prescriptions.value = [];
  }

  // Load clinical notes
  try {
    const noteRes = await apiFactory.$_getClinicalNotes(appointmentId.value);
    const noteData = noteRes.data?.data || noteRes.data;
    // API returns array, get first note
    clinicalNote.value = Array.isArray(noteData) ? noteData[0] : noteData;
  } catch (e) {
    // No clinical notes for this appointment
  }
}

function goBack() {
  router.push({ name: 'Appointmentsv2' });
}

function joinMeeting() {
  if (appointment.value?.meeting_link) {
    window.open(appointment.value.meeting_link, '_blank');
  } else if (appointment.value?.zoom_meeting?.join_url) {
    window.open(appointment.value.zoom_meeting.join_url, '_blank');
  } else {
    toast.error('Meeting link not available yet');
  }
}

function rescheduleAppointment() {
  showRescheduleModal.value = false;
  router.push({
    name: 'RescheduleAppointment',
    params: { id: appointmentId.value },
  });
}

async function cancelAppointment() {
  isCancelling.value = true;
  try {
    await apiFactory.$_cancelAppointment(appointmentId.value, {
      reason: cancellationReason.value,
    });
    toast.success('Appointment cancelled successfully');
    showCancelModal.value = false;
    await loadAppointment();
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to cancel appointment');
  } finally {
    isCancelling.value = false;
  }
}

function bookFollowUp() {
  router.push({
    name: 'Appointmentsv2Book',
    query: {
      specialist: specialist.value?._id,
      type: 'follow_up',
    },
  });
}

function bookAgain() {
  router.push({
    name: 'Appointmentsv2Book',
    query: {
      specialist: specialist.value?._id,
    },
  });
}

function contactSupport() {
  // Open support chat or email
  window.open('mailto:support@rapidcapsule.com?subject=Appointment Inquiry - ' + appointmentId.value, '_blank');
}

function viewSpecialistProfile() {
  if (specialist.value?._id) {
    router.push({
      name: 'SpecialistProfilePublic',
      params: { id: specialist.value._id },
    });
  }
}

function viewHealthCheckup() {
  if (appointment.value?.health_checkup_id) {
    router.push({
      name: 'HealthCheckup',
      query: {
        step: 10,
        checkup_id: appointment.value.health_checkup_id,
        appointment_id: appointment.value._id
      },
    });
  }
}

function playRecording() {
  const url = appointment.value?.recording?.recording_url || appointment.value?.recording_url;
  if (url) {
    window.open(url, '_blank');
  }
}

function copyRecordingPassword() {
  const password = appointment.value?.recording?.recording_password;
  if (password) {
    navigator.clipboard.writeText(password).then(() => {
      // Show toast or feedback
      alert('Recording password copied to clipboard');
    });
  }
}

function downloadTranscript() {
  const url = appointment.value?.transcript?.transcript_url;
  if (url) {
    window.open(url, '_blank');
  }
}

function viewPrescription(rx) {
  if (rx?._id) {
    router.push({
      name: 'Patient Prescription Details',
      params: { id: rx._id },
    });
  }
}

function downloadPrescription(rx) {
  // Trigger prescription PDF download
  if (rx?.pdf_url) {
    window.open(rx.pdf_url, '_blank');
  }
}

function viewClinicalNotes() {
  // View clinical notes
  if (clinicalNote.value?._id) {
    router.push({
      name: 'ClinicalNoteDetail',
      params: { id: clinicalNote.value._id },
    });
  }
}

function openDocument(doc) {
  if (doc.url) {
    window.open(doc.url, '_blank');
  }
}

// Formatters
function formatDay(date) {
  if (!date) return '';
  return format(parseISO(date), 'd');
}

function formatMonth(date) {
  if (!date) return '';
  return format(parseISO(date), 'MMM yyyy');
}

function formatTime(date) {
  if (!date) return '';
  return format(parseISO(date), 'h:mm a');
}

function formatDate(date) {
  if (!date) return '';
  return format(parseISO(date), 'MMM d, yyyy');
}

function formatDateFull(date) {
  if (!date) return '';
  return format(parseISO(date), 'EEEE, MMMM d, yyyy');
}

function formatDateTime(date) {
  if (!date) return '';
  return format(parseISO(date), 'MMM d, yyyy • h:mm a');
}

function formatAmount(amount) {
  if (!amount) return '0';
  return new Intl.NumberFormat('en-NG').format(amount);
}

function formatMeetingId(id) {
  if (!id) return '';
  const str = String(id);
  // Format as XXX XXXX XXXX for better readability
  if (str.length >= 10) {
    return str.replace(/(\d{3})(\d{4})(\d+)/, '$1 $2 $3');
  }
  return str;
}

function truncateUrl(url) {
  if (!url) return '';
  if (url.length > 50) {
    return url.substring(0, 47) + '...';
  }
  return url;
}

function copyToClipboard(text, label) {
  if (!text) return;
  navigator.clipboard.writeText(String(text)).then(() => {
    toast.success(`${label} copied to clipboard`);
  }).catch(() => {
    toast.error('Failed to copy');
  });
}

function getFileIcon(filename) {
  if (!filename) return 'hi-document';
  const ext = filename.split('.').pop()?.toLowerCase();
  const icons = {
    pdf: 'hi-document-text',
    doc: 'hi-document-text',
    docx: 'hi-document-text',
    jpg: 'hi-photograph',
    jpeg: 'hi-photograph',
    png: 'hi-photograph',
    gif: 'hi-photograph',
    xls: 'hi-table',
    xlsx: 'hi-table',
    csv: 'hi-table',
  };
  return icons[ext] || 'hi-document';
}

function getFileType(filename) {
  if (!filename) return 'Document';
  const ext = filename.split('.').pop()?.toLowerCase();
  const types = {
    pdf: 'PDF',
    doc: 'Word',
    docx: 'Word',
    jpg: 'Image',
    jpeg: 'Image',
    png: 'Image',
    gif: 'Image',
    xls: 'Excel',
    xlsx: 'Excel',
    csv: 'CSV',
  };
  return types[ext] || ext?.toUpperCase() || 'Document';
}

function formatDuration(minutes) {
  if (!minutes) return '';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins} min`;
}

// Lifecycle
onMounted(() => {
  loadAppointment();
});
</script>

<style scoped lang="scss">
// Design Tokens
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$violet: #8B5CF6;
$violet-light: #EDE9FE;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.appointment-detail-page {
  width: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px 32px 48px;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 16px 16px 48px;
  }

  @media (max-width: 640px) {
    gap: 20px;
    padding: 12px 16px 32px;
  }
}

// Mobile Header
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 16px;
  background: white;
  border-bottom: 1px solid #E2E8F0;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 768px) {
    display: flex;
  }

  .back-btn, .menu-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: none;
    background: $bg;
    color: $slate;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .header-title {
    font-size: 16px;
    font-weight: 600;
    color: $navy;
  }
}

// Loading State
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 16px;

  .loading-spinner {
    position: relative;
    width: 64px;
    height: 64px;

    .spinner-ring {
      position: absolute;
      inset: 0;
      border: 3px solid $sky-light;
      border-top-color: $sky;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: $sky;
    }
  }

  p {
    color: $gray;
    font-size: 14px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Error State
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 32px;
  text-align: center;

  .error-icon {
    width: 80px;
    height: 80px;
    background: $rose-light;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $rose;
    margin-bottom: 16px;
  }

  h3 {
    font-size: 18px;
    color: $navy;
    margin: 0 0 8px;
  }

  p {
    color: $gray;
    font-size: 14px;
    margin: 0 0 24px;
  }

  .btn-retry {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: $sky;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;

    &:hover {
      background: $sky-dark;
    }
  }
}

// Page Content
.page-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

// ============================================
// HERO SECTION - Health Checkup Style
// ============================================
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  padding: 40px 40px 48px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 28px;
  position: relative;
  overflow: visible;
  min-height: 420px;
  box-shadow:
    0 20px 60px rgba(2, 136, 209, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 32px 24px;
    gap: 24px;
    text-align: center;
    min-height: auto;
  }

  .hero__content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    z-index: 2;
  }

  .hero__badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border-radius: 24px;
    width: fit-content;
    margin-bottom: 20px;
    position: relative;

    @media (max-width: 768px) {
      margin: 0 auto 16px;
    }

    .badge-pulse {
      position: absolute;
      left: 12px;
      width: 8px;
      height: 8px;
      background: $emerald;
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;

      &::after {
        content: '';
        position: absolute;
        inset: -4px;
        background: rgba($emerald, 0.4);
        border-radius: 50%;
        animation: pulse-ring 2s ease-out infinite;
      }
    }

    svg {
      width: 16px;
      height: 16px;
      color: white;
      margin-left: 12px;
    }

    span {
      font-size: 13px;
      font-weight: 600;
      color: white;
      letter-spacing: 0.3px;
    }

    // Status-specific badge colors
    &.status-missed {
      background: rgba(239, 68, 68, 0.25);

      .badge-pulse {
        background: #EF4444;

        &::after {
          background: rgba(239, 68, 68, 0.4);
        }
      }
    }

    &.status-cancelled {
      background: rgba(107, 114, 128, 0.25);

      .badge-pulse {
        background: #6B7280;
        animation: none;

        &::after {
          display: none;
        }
      }
    }

    &.status-completed {
      background: rgba(16, 185, 129, 0.25);

      .badge-pulse {
        background: $emerald;
        animation: none;

        &::after {
          display: none;
        }
      }
    }
  }

  .hero__title {
    font-size: 48px;
    font-weight: 800;
    color: white;
    line-height: 1.1;
    margin: 0 0 16px;
    letter-spacing: -1px;

    @media (max-width: 768px) {
      font-size: 36px;
    }

    .hero__title-accent {
      background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  .hero__subtitle {
    font-size: 18px;
    color: white;
    line-height: 1.6;
    margin: 0 0 24px;
    max-width: 400px;
    opacity: 0.95;

    @media (max-width: 768px) {
      font-size: 16px;
      max-width: 100%;
    }
  }

  .hero__stats {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    width: fit-content;

    @media (max-width: 768px) {
      width: 100%;
      justify-content: center;
      padding: 14px 16px;
      gap: 16px;
    }
  }

  .hero__visual {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    @media (max-width: 768px) {
      display: none;
    }
  }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 20px;
  width: fit-content;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  @media (max-width: 768px) {
    display: none;
  }
}

.hero-stat {
  text-align: center;

  &__value {
    display: block;
    font-size: 24px;
    font-weight: 700;
    color: white;
    line-height: 1;

    @media (max-width: 640px) {
      font-size: 20px;
    }
  }

  &__label {
    display: block;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__divider {
    width: 1px;
    height: 32px;
    background: rgba(255, 255, 255, 0.2);
  }
}

// Orb Animation
.appointment-orb {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);

  &--1 {
    width: 100%;
    height: 100%;
    animation: spin-slow 20s linear infinite;
  }

  &--2 {
    width: 80%;
    height: 80%;
    animation: spin-slow 15s linear infinite reverse;
  }

  &--3 {
    width: 60%;
    height: 60%;
    animation: spin-slow 10s linear infinite;
  }
}

.orb-core {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 40px rgba(255, 255, 255, 0.3),
    0 0 80px rgba(79, 195, 247, 0.3);
  animation: pulse-glow 3s ease-in-out infinite;

  svg {
    width: 48px;
    height: 48px;
    color: white;
  }
}

// Floating Icons
.floating-icons {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.float-icon {
  position: absolute;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;

  svg {
    width: 20px;
    height: 20px;
    color: white;
  }

  &--1 {
    top: 10%;
    right: 10%;
    animation-delay: 0s;
  }

  &--2 {
    bottom: 20%;
    right: 5%;
    animation-delay: 1s;
  }

  &--3 {
    bottom: 10%;
    left: 10%;
    animation-delay: 2s;
  }
}

// Animations
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3); }
  50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(79, 195, 247, 0.4); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}


.desktop-only {
  @media (max-width: 768px) {
    display: none !important;
  }
}

// Bento Grid
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(6, 1fr);
  }

  @media (max-width: 768px) {
    gap: 16px;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.bento-card {
  @include glass-card;
  border-radius: 20px;
  padding: 20px;
  grid-column: span 6;

  @media (max-width: 640px) {
    grid-column: span 1;
    padding: 16px;
    border-radius: 16px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    h3 {
      font-size: 15px;
      font-weight: 600;
      color: $navy;
      margin: 0;
    }
  }
}

// Actions Card
.actions-card {
  grid-column: span 12;

  &.span-full {
    grid-column: span 12;
  }

  @media (max-width: 640px) {
    grid-column: span 1;
  }

  .actions-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;

    @media (max-width: 640px) {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .action-btn {
    flex: 1;
    min-width: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 16px 12px;
    background: $bg;
    border: 1px solid #E2E8F0;
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: white;
      border-color: $sky;
      box-shadow: 0 4px 12px rgba($sky, 0.15);
    }

    &.primary {
      background: linear-gradient(135deg, $emerald, darken($emerald, 8%));
      border-color: transparent;

      .action-icon {
        background: rgba(255, 255, 255, 0.2);
        color: white;
      }

      span {
        color: white;
      }

      &:hover {
        box-shadow: 0 6px 20px rgba($emerald, 0.3);
      }
    }

    span {
      font-size: 13px;
      font-weight: 500;
      color: $slate;
    }
  }

  .action-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;

    &.sky { background: $sky-light; color: $sky-dark; }
    &.emerald { background: $emerald-light; color: $emerald; }
    &.rose { background: $rose-light; color: $rose; }
    &.violet { background: $violet-light; color: $violet; }
    &.amber { background: $amber-light; color: $amber; }
    &.slate { background: #F1F5F9; color: #475569; }
  }
}

// Specialist Card
.specialist-card {
  .view-profile-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: $sky-dark;
    background: none;
    border: none;
    cursor: pointer;
    font-weight: 500;

    &:hover {
      color: $sky-darker;
    }
  }

  .specialist-info {
    display: flex;
    gap: 16px;
  }

  .specialist-avatar {
    width: 72px;
    height: 72px;
    border-radius: 18px;
    overflow: hidden;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, $sky, $sky-dark);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 600;
    }
  }

  .specialist-details {
    flex: 1;
    min-width: 0;

    h4 {
      font-size: 17px;
      font-weight: 600;
      color: $navy;
      margin: 0 0 4px;
    }

    .specialist-title {
      font-size: 14px;
      color: $gray;
      margin: 0 0 10px;
    }

    .specialist-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: $gray;

        svg {
          color: $sky;
        }
      }
    }
  }
}

// Details Card
.details-card {
  .details-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;

    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }
  }

  .detail-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    background: $bg;
    border-radius: 14px;
  }

  .detail-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.sky { background: $sky-light; color: $sky-dark; }
    &.emerald { background: $emerald-light; color: $emerald; }
    &.violet { background: $violet-light; color: $violet; }
    &.amber { background: $amber-light; color: $amber; }
  }

  .detail-content {
    .detail-label {
      font-size: 12px;
      color: $gray;
      display: block;
      margin-bottom: 2px;
    }

    .detail-value {
      font-size: 14px;
      font-weight: 600;
      color: $navy;
    }
  }
}

// Meeting Card
.meeting-card {
  grid-column: span 6;

  @media (max-width: 1024px) {
    grid-column: span 6;
  }

  @media (max-width: 640px) {
    grid-column: span 1;
  }

  .meeting-platform {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #2D8CFF;
    background: #E7F3FF;
    padding: 4px 10px;
    border-radius: 20px;

    svg {
      color: #2D8CFF;
    }
  }

  .meeting-details-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 20px;

    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }
  }

  .meeting-detail-item {
    &.full-width {
      grid-column: span 2;

      @media (max-width: 480px) {
        grid-column: span 1;
      }
    }

    .detail-label {
      font-size: 12px;
      color: $gray;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-value-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .detail-value {
      font-size: 15px;
      font-weight: 600;
      color: $navy;

      &.mono {
        font-family: 'SF Mono', Monaco, Consolas, monospace;
        letter-spacing: 0.5px;
      }
    }

    .join-link {
      font-size: 13px;
      color: $sky-dark;
      text-decoration: none;
      word-break: break-all;

      &:hover {
        text-decoration: underline;
      }
    }

    .copy-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: $bg;
      border: none;
      border-radius: 8px;
      color: $gray;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 0.2s;

      &:hover {
        background: $sky-light;
        color: $sky-dark;
      }
    }
  }

  .join-meeting-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, $emerald 0%, darken($emerald, 10%) 100%);
    color: white;
    border: none;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba($emerald, 0.3);
    }

    &:disabled {
      background: $light-gray;
      cursor: not-allowed;
    }
  }

  .meeting-note {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
    font-size: 12px;
    color: $gray;

    svg {
      color: $amber;
      flex-shrink: 0;
    }
  }
}

// Payment Card
.payment-card {
  .payment-status {
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;

    &.payment-paid {
      background: $emerald-light;
      color: $emerald;
    }

    &.payment-pending {
      background: $amber-light;
      color: $amber;
    }

    &.payment-refunded {
      background: $rose-light;
      color: $rose;
    }

    &.payment-failed {
      background: $rose-light;
      color: $rose;
    }
  }

  .payment-amount {
    margin-bottom: 12px;

    .currency {
      font-size: 14px;
      color: $gray;
      margin-right: 4px;
    }

    .amount {
      font-size: 28px;
      font-weight: 700;
      color: $navy;
    }
  }

  .payment-method {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: $gray;

    svg {
      color: $sky;
    }
  }

  .payment-details {
    border-top: 1px solid #E2E8F0;
    padding-top: 12px;
    margin-top: 12px;
  }

  .payment-detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;

    &:not(:last-child) {
      border-bottom: 1px dashed #E2E8F0;
    }

    .payment-label {
      font-size: 13px;
      color: $gray;
    }

    .payment-value {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 500;
      color: $slate;

      &.mono {
        font-family: 'SF Mono', Monaco, Consolas, monospace;
        font-size: 12px;
      }

      svg {
        color: $sky;
      }
    }
  }
}

// Notes Card
.notes-card {
  grid-column: span 12;

  @media (max-width: 640px) {
    grid-column: span 1;
  }

  .notes-count {
    font-size: 12px;
    font-weight: 500;
    color: $gray;
    background: $bg;
    padding: 4px 10px;
    border-radius: 20px;
  }

  .patient-note {
    padding: 16px;
    background: $sky-light;
    border-radius: 14px;
    margin-bottom: 16px;

    .note-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;

      .note-icon {
        color: $sky-dark;
      }

      span {
        font-size: 13px;
        font-weight: 600;
        color: $sky-dark;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    .note-text {
      font-size: 14px;
      color: $slate;
      margin: 0;
      line-height: 1.6;
    }
  }

  .shared-files {
    .files-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;

      svg {
        color: $violet;
      }

      span {
        font-size: 13px;
        font-weight: 600;
        color: $slate;
      }
    }

    .files-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: $bg;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .file-icon {
      width: 40px;
      height: 40px;
      background: $violet-light;
      color: $violet;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .file-info {
      flex: 1;
      min-width: 0;

      .file-name {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: $navy;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .file-meta {
        display: block;
        font-size: 12px;
        color: $gray;
        margin-top: 2px;
      }
    }

    .file-action {
      color: $gray;
      flex-shrink: 0;
    }
  }

  .empty-notes {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    text-align: center;

    svg {
      color: $light-gray;
      margin-bottom: 12px;
    }

    p {
      font-size: 14px;
      color: $gray;
      margin: 0;
    }
  }
}

// Checkup Card
.checkup-card {
  grid-column: span 12;

  @media (max-width: 640px) {
    grid-column: span 1;
  }

  padding: 0;

  .checkup-banner {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      box-shadow: 0 4px 16px rgba($emerald, 0.2);
    }

    .checkup-icon {
      width: 52px;
      height: 52px;
      background: white;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $emerald;
      flex-shrink: 0;
    }

    .checkup-content {
      flex: 1;

      h4 {
        font-size: 15px;
        font-weight: 600;
        color: #1B5E20;
        margin: 0 0 4px;
      }

      p {
        font-size: 13px;
        color: #388E3C;
        margin: 0;
      }
    }

    .checkup-arrow {
      color: #388E3C;
    }
  }
}

// Meeting Summary Card
.meeting-summary-card {
  .meeting-status-badge {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;

    &.status-completed {
      background: #DCFCE7;
      color: #166534;
    }

    &.status-missed {
      background: #FEE2E2;
      color: #991B1B;
    }

    &.status-unknown {
      background: #F3F4F6;
      color: #4B5563;
    }
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 20px;

    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }
  }

  .summary-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #F8FAFC;
    border-radius: 12px;

    .summary-icon {
      color: $sky-dark;
      width: 20px;
      height: 20px;
    }

    .summary-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .summary-label {
      font-size: 12px;
      color: #64748B;
    }

    .summary-value {
      font-size: 14px;
      font-weight: 600;
      color: $navy;
    }
  }

  .section-subtitle {
    font-size: 14px;
    font-weight: 600;
    color: $navy;
    margin-bottom: 12px;
    padding-top: 16px;
    border-top: 1px solid #E2E8F0;
  }

  .attendance-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .attendance-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #FEF2F2;
    border-radius: 12px;
    border: 1px solid #FECACA;

    &.joined {
      background: #F0FDF4;
      border-color: #BBF7D0;
    }

    .attendance-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      &.patient {
        background: $sky-light;
        color: $sky-dark;
      }

      &.specialist {
        background: #EDE9FE;
        color: #7C3AED;
      }
    }

    .attendance-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .attendance-name {
      font-size: 14px;
      font-weight: 600;
      color: $navy;
    }

    .attendance-status {
      font-size: 12px;
      color: #16A34A;

      &.not-joined {
        color: #DC2626;
      }
    }

    .attendance-check {
      color: #16A34A;
      width: 20px;
      height: 20px;
    }

    .attendance-x {
      color: #DC2626;
      width: 20px;
      height: 20px;
    }
  }
}

// Recording Card
.recording-card {
  .recording-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;

    &.available {
      background: #DCFCE7;
      color: #166534;
    }
  }

  .recording-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .recording-preview {
    position: relative;
    background: linear-gradient(135deg, $navy, #1E293B);
    border-radius: 14px;
    padding: 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    overflow: hidden;
    min-height: 80px;
    color: #FFFFFF;

    .play-overlay {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .play-btn {
      width: 56px;
      height: 56px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      transition: all 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
      }
    }

    .recording-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
      text-align: right;

      .recording-duration {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 6px;
        font-size: 14px;
        font-weight: 600;
        color: #FFFFFF;
      }

      .recording-label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.85);
      }
    }
  }

  .recording-actions {
    display: flex;
    gap: 12px;

    @media (max-width: 480px) {
      flex-direction: column;
    }
  }

  .recording-action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    background: #F1F5F9;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    color: $navy;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #E2E8F0;
    }

    &:first-child {
      background: $sky;
      border-color: $sky;
      color: white;

      &:hover {
        background: $sky-dark;
      }
    }
  }
}

// Transcript Card
.transcript-card {
  .transcript-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;

    @media (max-width: 480px) {
      flex-direction: column;
      align-items: stretch;
    }
  }

  .transcript-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .transcript-icon {
    color: $sky-dark;
    width: 32px;
    height: 32px;
  }

  .transcript-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .transcript-title {
    font-size: 14px;
    font-weight: 600;
    color: $navy;
  }

  .transcript-subtitle {
    font-size: 12px;
    color: #64748B;
  }

  .download-transcript-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: $sky;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: $sky-dark;
    }

    @media (max-width: 480px) {
      justify-content: center;
    }
  }
}

// Prescription Card
.prescription-card {
  .download-btn {
    width: 36px;
    height: 36px;
    background: $sky-light;
    color: $sky-dark;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: $sky;
      color: white;
    }
  }

  .prescription-summary {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;

    .rx-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, $violet-light, #DDD6FE);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $violet;
    }

    .rx-details {
      .rx-count {
        font-size: 16px;
        font-weight: 600;
        color: $navy;
        margin: 0 0 4px;
      }

      .rx-date {
        font-size: 13px;
        color: $gray;
        margin: 0;
      }
    }
  }

  .view-rx-btn {
    width: 100%;
    padding: 12px;
    background: $bg;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    color: $slate;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;

    &:hover {
      background: white;
      border-color: $sky;
      color: $sky-dark;
    }
  }
}

// Notes & Prescriptions Row
.notes-rx-row {
  grid-column: span 12;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 640px) {
    grid-column: span 1;
  }

  // Override child cards to not span full width
  .bento-card {
    grid-column: auto !important;
    margin: 0;
  }
}

// Prescriptions Card (Multiple)
.prescriptions-card {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .rx-badge {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, $violet-light, #DDD6FE);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $violet;
    }

    h3 {
      margin: 0;
    }

    .rx-count-badge {
      background: $violet-light;
      color: $violet;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
    }
  }

  .prescriptions-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .prescription-item {
    background: $bg;
    border-radius: 14px;
    padding: 16px;
    border: 1px solid #E2E8F0;
    transition: all 0.2s;

    &:hover {
      border-color: $violet-light;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.08);
    }

    .rx-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid #E2E8F0;

      .rx-number {
        font-size: 13px;
        font-weight: 600;
        color: $violet;
        background: $violet-light;
        padding: 4px 10px;
        border-radius: 6px;
      }

      .rx-date {
        font-size: 12px;
        color: $gray;
      }
    }

    .medications-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 14px;
    }

    .medication-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;

      .med-icon {
        width: 28px;
        height: 28px;
        min-width: 28px;
        background: white;
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: $emerald;
      }

      .med-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;

        .med-name {
          font-size: 13px;
          font-weight: 500;
          color: $navy;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .med-details {
          font-size: 11px;
          color: $gray;
        }
      }
    }

    .more-meds {
      font-size: 12px;
      color: $violet;
      font-weight: 500;
      padding-left: 38px;
    }

    .no-meds {
      font-size: 13px;
      color: $gray;
      padding: 8px 12px;
      background: white;
      border-radius: 8px;
      text-align: center;
    }

    .view-rx-btn {
      width: 100%;
      padding: 10px 14px;
      background: white;
      border: 1px solid $violet-light;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 500;
      color: $violet;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s;

      &:hover {
        background: $violet;
        border-color: $violet;
        color: white;
      }
    }
  }
}

// Clinical Notes Card
.clinical-notes-card {
  .note-preview {
    margin-bottom: 16px;
  }

  .note-section {
    padding: 12px;
    background: $bg;
    border-radius: 12px;
    margin-bottom: 10px;

    &:last-child {
      margin-bottom: 0;
    }

    .note-label {
      font-size: 11px;
      font-weight: 600;
      color: $gray;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: block;
      margin-bottom: 6px;
    }

    p {
      font-size: 14px;
      color: $slate;
      margin: 0;
      line-height: 1.5;
    }
  }

  .view-notes-btn {
    width: 100%;
    padding: 12px;
    background: $bg;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    color: $slate;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;

    &:hover {
      background: white;
      border-color: $sky;
      color: $sky-dark;
    }
  }
}

// Timeline Card
.timeline-card {
  grid-column: span 12;

  @media (max-width: 640px) {
    grid-column: span 1;
  }

  .timeline {
    position: relative;
    padding-left: 28px;

    &::before {
      content: '';
      position: absolute;
      left: 8px;
      top: 8px;
      bottom: 8px;
      width: 2px;
      background: #E2E8F0;
    }
  }

  .timeline-item {
    position: relative;
    padding: 12px 0;

    .timeline-marker {
      position: absolute;
      left: -24px;
      top: 16px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #E2E8F0;
      border: 3px solid white;
      box-shadow: 0 0 0 2px #E2E8F0;
    }

    &.completed .timeline-marker {
      background: $emerald;
      box-shadow: 0 0 0 2px $emerald-light;
    }

    &.pending .timeline-marker {
      background: $sky;
      box-shadow: 0 0 0 2px $sky-light;
    }

    &.cancelled .timeline-marker {
      background: $rose;
      box-shadow: 0 0 0 2px $rose-light;
    }

    .timeline-content {
      .timeline-title {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: $navy;
        margin-bottom: 4px;
      }

      .timeline-date {
        font-size: 13px;
        color: $gray;
      }
    }
  }
}

// Modal Styles
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  @include glass-card;
  background: white;
  width: 100%;
  max-width: 440px;
  border-radius: 20px;
  overflow: hidden;

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid #E2E8F0;

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: $navy;
      margin: 0;
    }

    .close-btn {
      width: 36px;
      height: 36px;
      background: $bg;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $gray;

      &:hover {
        background: #E2E8F0;
      }
    }
  }

  .modal-body {
    padding: 20px;

    p {
      font-size: 14px;
      color: $slate;
      margin: 0 0 16px;
      line-height: 1.5;
    }

    .warning-text {
      color: $rose;
    }

    .input-group {
      label {
        display: block;
        font-size: 13px;
        font-weight: 500;
        color: $slate;
        margin-bottom: 8px;
      }

      textarea {
        width: 100%;
        min-height: 100px;
        padding: 12px;
        border: 1px solid #E2E8F0;
        border-radius: 12px;
        font-size: 14px;
        resize: vertical;

        &:focus {
          outline: none;
          border-color: $sky;
        }
      }
    }
  }

  .modal-footer {
    display: flex;
    gap: 12px;
    padding: 20px;
    border-top: 1px solid #E2E8F0;

    button {
      flex: 1;
      padding: 12px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary {
      background: $bg;
      color: $slate;
      border: 1px solid #E2E8F0;

      &:hover {
        background: #E2E8F0;
      }
    }

    .btn-primary {
      background: linear-gradient(135deg, $sky, $sky-dark);
      color: white;
      border: none;

      &:hover {
        box-shadow: 0 4px 12px rgba($sky, 0.3);
      }
    }

    .btn-danger {
      background: linear-gradient(135deg, $rose, darken($rose, 10%));
      color: white;
      border: none;

      &:hover {
        box-shadow: 0 4px 12px rgba($rose, 0.3);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }
}
</style>
