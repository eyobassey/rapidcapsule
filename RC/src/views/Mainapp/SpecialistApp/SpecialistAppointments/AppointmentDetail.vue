<template>
  <div class="appointment-detail-page" :class="{ 'mobile-view': isMobileView }">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-card">
        <div class="spinner"></div>
        <p>Loading appointment details...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-card">
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
    </div>

    <!-- Main Content -->
    <template v-else-if="appointmentData">
      <!-- Desktop Page Header -->
      <header class="page-header desktop-only">
        <div class="header-left">
          <router-link :to="{ name: 'SpecialistAppointmentsList' }" class="back-link">
            <v-icon name="hi-chevron-left" scale="0.9" />
            <span>Back to Appointments</span>
          </router-link>
        </div>
        <div class="header-right">
          <button class="header-btn" @click="printReport">
            <v-icon name="bi-printer" scale="0.9" />
          </button>
        </div>
      </header>

      <!-- Mobile Patient Card -->
      <section class="mobile-patient-card mobile-only" @click="goToPatientProfile">
        <div class="patient-row">
          <div class="patient-avatar-mobile">
            <img v-if="patientInfo.profileImage" :src="patientInfo.profileImage" :alt="patientInfo.fullName" />
            <div v-else class="avatar-initials-mobile">{{ patientInitials }}</div>
          </div>
          <div class="patient-info-mobile">
            <h3>{{ patientInfo.fullName }}</h3>
            <p>{{ patientInfo.gender }} • {{ patientInfo.age }} years</p>
          </div>
          <v-icon name="hi-chevron-right" scale="0.9" class="chevron-icon" />
        </div>
        <div class="patient-stats-mobile">
          <div class="stat-mobile">
            <p class="stat-label">Height</p>
            <p class="stat-value">{{ patientInfo.height?.value || '-' }} {{ patientInfo.height?.unit || '' }}</p>
          </div>
          <div class="stat-mobile">
            <p class="stat-label">Weight</p>
            <p class="stat-value">{{ patientInfo.weight?.value || '-' }} {{ patientInfo.weight?.unit || '' }}</p>
          </div>
          <div class="stat-mobile bmi">
            <p class="stat-label">BMI</p>
            <span class="bmi-badge-mobile" :class="getBmiClass(patientInfo.weightStatus)">{{ patientInfo.weightStatus || '-' }}</span>
          </div>
        </div>
      </section>

      <!-- Appointment Header Section (Desktop) -->
      <section class="appointment-header desktop-only">
        <div class="header-content">
          <div class="header-info">
            <div class="title-row">
              <h1>Appointment Details</h1>
              <span class="status-badge" :class="statusClass">
                <v-icon :name="statusIcon" scale="0.8" />
                {{ statusLabel }}
              </span>
            </div>
            <div class="meta-row">
              <span class="appt-id">#{{ appointmentData._id?.slice(-8).toUpperCase() }}</span>
              <span class="divider">•</span>
              <span class="appt-date">{{ formatDateFull(appointmentData.start_time) }}</span>
            </div>
          </div>
          <div class="header-actions">
            <button v-if="canReschedule" class="action-btn outline" @click="showRescheduleModal = true">
              <v-icon name="hi-clock" scale="0.85" />
              Reschedule
            </button>
            <button v-if="canCancel" class="action-btn danger" @click="showCancelModal = true">
              <v-icon name="hi-x-circle" scale="0.85" />
              Cancel
            </button>
          </div>
        </div>
      </section>

      <!-- Main Grid Layout -->
      <div class="content-grid">
        <!-- Left Column (Main Content) -->
        <div class="main-column">

          <!-- Appointment Information Card -->
          <div class="card appointment-info-card">
            <h3 class="card-title">Appointment Information</h3>

            <div class="info-grid">
              <!-- Date Card -->
              <div class="info-highlight date-card">
                <div class="highlight-header">
                  <v-icon name="hi-calendar" scale="1" />
                  <span class="highlight-label">Date</span>
                </div>
                <p class="highlight-day">{{ formatDay(appointmentData.start_time) }}</p>
                <p class="highlight-date">{{ formatDateMedium(appointmentData.start_time) }}</p>
              </div>

              <!-- Time Card -->
              <div class="info-highlight time-card">
                <div class="highlight-header">
                  <v-icon name="hi-clock" scale="1" />
                  <span class="highlight-label">Time</span>
                </div>
                <p class="highlight-time">{{ formatTime(appointmentData.start_time) }}</p>
                <p class="highlight-tz" v-if="appointmentData.timezone || preferences.timezone">
                  ({{ appointmentData.timezone || preferences.timezone }})
                </p>
              </div>

              <!-- Channel -->
              <div class="info-item">
                <p class="info-label">Channel</p>
                <div class="info-value with-icon">
                  <v-icon :name="channelIcon" scale="1" />
                  <span>{{ channelLabel }}</span>
                </div>
              </div>

              <!-- Language -->
              <div class="info-item">
                <p class="info-label">Language</p>
                <p class="info-value">{{ preferences.language || 'English' }}</p>
              </div>

              <!-- Appointment Type -->
              <div class="info-item">
                <p class="info-label">Appointment Type</p>
                <p class="info-value">{{ appointmentData.appointment_type || 'General Consultation' }}</p>
              </div>

              <!-- Urgency -->
              <div class="info-item">
                <p class="info-label">Urgency</p>
                <span class="urgency-badge" :class="appointmentData.urgency || 'routine'">
                  <v-icon v-if="isUrgent" name="hi-lightning-bolt" scale="0.7" />
                  <v-icon v-else name="hi-information-circle" scale="0.7" />
                  {{ formatUrgency(appointmentData.urgency) }}
                </span>
              </div>

              <!-- Duration -->
              <div class="info-item">
                <p class="info-label">Duration</p>
                <p class="info-value">{{ appointmentData.duration_minutes || 30 }} minutes</p>
              </div>

              <!-- Category -->
              <div class="info-item">
                <p class="info-label">Category</p>
                <p class="info-value">{{ appointmentData.category || 'General' }}</p>
              </div>
            </div>

            <!-- Fee Section -->
            <div class="fee-section">
              <div class="fee-info">
                <p class="fee-label">Consultation Fee</p>
                <p class="fee-amount">{{ formatCurrency(appointmentData.appointment_fee) }}</p>
              </div>
              <div class="fee-status">
                <p class="fee-label">Payment Status</p>
                <span class="payment-badge" :class="getPaymentStatusClass(appointmentData.payment_status)">
                  <v-icon :name="getPaymentStatusIcon(appointmentData.payment_status)" scale="0.7" />
                  {{ formatPaymentStatus(appointmentData.payment_status) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Video Meeting Card -->
          <div v-if="hasMeetingLink || showMeetingSummary" class="card video-meeting-card">
            <div class="card-header-row">
              <div class="card-title-group">
                <div class="title-icon video">
                  <v-icon name="hi-video-camera" scale="1.2" />
                </div>
                <div>
                  <h3>Video Meeting</h3>
                  <span class="subtitle">Zoom Meeting</span>
                </div>
              </div>
              <span v-if="isCompleted" class="meeting-status completed">
                <v-icon name="hi-check" scale="0.7" />
                Completed
              </span>
              <button v-else-if="canJoin" class="join-btn" @click="joinMeeting">
                <v-icon name="hi-external-link" scale="0.85" />
                Join Now
              </button>
              <div v-else-if="isUpcoming && timeUntil" class="countdown-badge">
                <v-icon name="hi-clock" scale="0.7" />
                {{ timeUntil }}
              </div>
            </div>

            <!-- Meeting Link Box -->
            <div v-if="hasMeetingLink" class="meeting-link-box">
              <div class="link-header">
                <p class="link-label">Meeting Link</p>
                <button class="copy-btn" @click="copyToClipboard(meetingLink, 'Meeting link')">
                  <v-icon name="hi-clipboard-copy" scale="0.8" />
                  Copy
                </button>
              </div>
              <div class="link-content">
                <span>{{ truncateLink(meetingLink) }}</span>
              </div>
            </div>

            <!-- Meeting Summary (for completed meetings) -->
            <div v-if="showMeetingSummary" class="meeting-summary-box">
              <h4>Meeting Summary</h4>

              <div class="summary-stats">
                <div class="stat-item green">
                  <p class="stat-label">Call Status</p>
                  <p class="stat-value" :class="getAttendanceClass(appointmentData.attendance?.attendance_status)">
                    {{ formatAttendanceStatus(appointmentData.attendance?.attendance_status) }}
                  </p>
                </div>
                <div class="stat-item blue">
                  <p class="stat-label">Duration</p>
                  <p class="stat-value">{{ actualDuration }} min</p>
                </div>
                <div class="stat-item purple">
                  <p class="stat-label">Participants</p>
                  <p class="stat-value">{{ participantCount }}</p>
                </div>
                <div v-if="appointmentData.meeting_platform_data?.actual_start_time" class="stat-item gray">
                  <p class="stat-label">Started At</p>
                  <p class="stat-value">{{ formatDateTime(appointmentData.meeting_platform_data.actual_start_time) }}</p>
                </div>
                <div v-if="appointmentData.meeting_platform_data?.actual_end_time" class="stat-item gray">
                  <p class="stat-label">Ended At</p>
                  <p class="stat-value">{{ formatDateTime(appointmentData.meeting_platform_data.actual_end_time) }}</p>
                </div>
              </div>

              <!-- Attendance -->
              <div v-if="appointmentData.attendance" class="attendance-section">
                <h5>Attendance</h5>
                <div class="attendance-list">
                  <div class="attendance-item" :class="{ joined: appointmentData.attendance.patient_joined }">
                    <div class="attendance-icon">
                      <v-icon :name="appointmentData.attendance.patient_joined ? 'hi-check-circle' : 'hi-x-circle'" scale="0.9" />
                    </div>
                    <span class="attendance-role">Patient</span>
                    <span v-if="appointmentData.attendance.patient_joined_at" class="attendance-time">
                      Joined: {{ formatDateTime(appointmentData.attendance.patient_joined_at) }}
                    </span>
                    <span v-else-if="!appointmentData.attendance.patient_joined" class="attendance-time not-joined">
                      Did not join
                    </span>
                  </div>
                  <div class="attendance-item" :class="{ joined: appointmentData.attendance.specialist_joined }">
                    <div class="attendance-icon">
                      <v-icon :name="appointmentData.attendance.specialist_joined ? 'hi-check-circle' : 'hi-x-circle'" scale="0.9" />
                    </div>
                    <span class="attendance-role">Specialist (You)</span>
                    <span v-if="appointmentData.attendance.specialist_joined" class="attendance-time">Joined</span>
                    <span v-else class="attendance-time not-joined">Did not join</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Participants Card -->
          <div v-if="appointmentData.participants && appointmentData.participants.length > 0" class="card participants-card">
            <h3 class="card-title">Participants ({{ appointmentData.participants.length }})</h3>

            <div class="participants-list">
              <div v-for="(participant, index) in appointmentData.participants" :key="index" class="participant-item">
                <div class="participant-avatar">
                  <img v-if="participant.avatar" :src="participant.avatar" :alt="participant.name" />
                  <v-icon v-else name="hi-user" scale="1.2" />
                </div>
                <div class="participant-info">
                  <p class="participant-name">{{ participant.name || 'Unknown' }}</p>
                  <p v-if="participant.email" class="participant-email">{{ participant.email }}</p>
                  <p v-if="participant.join_time" class="participant-joined">Joined: {{ formatTime(participant.join_time) }}</p>
                </div>
                <div class="participant-duration">
                  <span class="duration-value">{{ participant.duration_minutes || 0 }} min</span>
                  <span class="duration-label">Duration</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Recording Card -->
          <div v-if="appointmentData.recording?.recording_url" class="card recording-card">
            <div class="card-header-row">
              <div>
                <h3 class="card-title">Recording</h3>
                <p class="card-subtitle">Consultation Recording</p>
              </div>
              <span class="recording-status available">
                <v-icon name="hi-check" scale="0.7" />
                Available
              </span>
            </div>

            <div class="recording-content">
              <div class="recording-info-row">
                <div class="recording-icon">
                  <v-icon name="hi-video-camera" scale="1.2" />
                </div>
                <div class="recording-details">
                  <p class="recording-duration">{{ appointmentData.recording.recording_duration_minutes || appointmentData.call_duration?.time_taken || 0 }} minutes</p>
                  <p class="recording-desc">Full session recording</p>
                </div>
                <a :href="appointmentData.recording.recording_url" target="_blank" class="play-btn">
                  <v-icon name="hi-play" scale="0.9" />
                  Play
                </a>
              </div>

              <div v-if="appointmentData.recording.recording_password" class="password-notice">
                <v-icon name="hi-lock-closed" scale="0.9" />
                <div>
                  <p class="password-title">Password Protected</p>
                  <p class="password-value">Password: <code>{{ appointmentData.recording.recording_password }}</code>
                    <button class="copy-btn-small" @click="copyToClipboard(appointmentData.recording.recording_password, 'Password')">
                      <v-icon name="hi-clipboard-copy" scale="0.7" />
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Transcript Card -->
          <div v-if="appointmentData.transcript?.transcript_text || appointmentData.transcript?.transcript_url || appointmentData.transcript?.transcript_status === 'available'" class="card transcript-card">
            <div class="card-header-row">
              <h3 class="card-title">Meeting Transcript</h3>
              <a v-if="appointmentData.transcript?.transcript_url" :href="appointmentData.transcript.transcript_url" target="_blank" class="download-btn small">
                <v-icon name="hi-download" scale="0.8" />
                Download
              </a>
            </div>

            <div v-if="appointmentData.transcript?.transcript_text" class="transcript-content">
              <p>{{ truncateTranscript(appointmentData.transcript.transcript_text) }}</p>
              <button v-if="appointmentData.transcript.transcript_text.length > 500" class="expand-btn" @click="showFullTranscript = !showFullTranscript">
                {{ showFullTranscript ? 'Show Less' : 'Show Full Transcript' }}
              </button>
            </div>
            <div v-else-if="appointmentData.transcript?.transcript_url" class="transcript-available">
              <v-icon name="hi-document-text" scale="1.2" />
              <p class="available-text">Transcript available for download</p>
            </div>
            <div v-else class="transcript-processing">
              <v-icon name="hi-clock" scale="1.2" />
              <p class="processing-title">Transcript is processing...</p>
            </div>
          </div>

          <!-- AI Meeting Summary -->
          <div v-if="appointmentData.meeting_summary?.summary" class="card ai-summary-card">
            <div class="card-header-row">
              <div class="card-title-group">
                <v-icon name="hi-sparkles" scale="1" class="ai-icon" />
                <h3 class="card-title">AI Meeting Summary</h3>
              </div>
              <span class="ai-badge">
                <v-icon name="hi-sparkles" scale="0.6" />
                AI Generated
              </span>
            </div>
            <div class="summary-content">
              <p>{{ appointmentData.meeting_summary.summary }}</p>
              <div v-if="appointmentData.meeting_summary.next_steps?.length" class="next-steps">
                <h5>Next Steps:</h5>
                <ul>
                  <li v-for="(step, idx) in appointmentData.meeting_summary.next_steps" :key="idx">{{ step }}</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Patient Notes & Files Card (Accordion) -->
          <div class="card accordion-card" :class="{ expanded: isPatientNotesExpanded }">
            <div class="accordion-header" @click="isPatientNotesExpanded = !isPatientNotesExpanded">
              <h3 class="card-title">Patient's Notes & Files</h3>
              <div class="accordion-meta">
                <span v-if="appointmentData.patient_notes || sharedDocuments.length" class="has-content-badge">
                  {{ sharedDocuments.length }} file{{ sharedDocuments.length !== 1 ? 's' : '' }}
                </span>
                <v-icon :name="isPatientNotesExpanded ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.9" />
              </div>
            </div>
            <transition name="accordion">
              <div v-show="isPatientNotesExpanded" class="accordion-content">
                <div v-if="appointmentData.patient_notes" class="patient-note-box">
                  <div class="note-header">
                    <v-icon name="hi-annotation" scale="0.9" />
                    <span>Notes from Patient</span>
                  </div>
                  <p class="note-content">{{ appointmentData.patient_notes }}</p>
                </div>

                <div class="files-section">
                  <h4>Attached Files</h4>
                  <div v-if="sharedDocuments.length > 0" class="files-list">
                    <div v-for="doc in sharedDocuments" :key="doc.url" class="file-item" @click="openDocument(doc)">
                      <div class="file-icon" :class="getDocTypeClass(doc.type)">
                        <v-icon :name="getDocIcon(doc.type)" scale="0.9" />
                      </div>
                      <div class="file-info">
                        <p class="file-name">{{ doc.name }}</p>
                        <p class="file-size">{{ doc.size || 'Unknown size' }}</p>
                      </div>
                      <button class="file-download" @click.stop="downloadDocument(doc)">
                        <v-icon name="hi-download" scale="0.8" />
                      </button>
                    </div>
                  </div>
                  <p v-else class="no-files">No files attached</p>
                </div>
              </div>
            </transition>
          </div>

          <!-- Notes & Instructions Card (Accordion) -->
          <div class="card accordion-card" :class="{ expanded: isSpecialistNotesExpanded }">
            <div class="accordion-header" @click="isSpecialistNotesExpanded = !isSpecialistNotesExpanded">
              <h3 class="card-title">Clinical Notes</h3>
              <div class="accordion-meta">
                <span v-if="appointmentData.clinical_notes?.length" class="has-content-badge">
                  {{ appointmentData.clinical_notes.length }} note{{ appointmentData.clinical_notes.length !== 1 ? 's' : '' }}
                </span>
                <v-icon :name="isSpecialistNotesExpanded ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.9" />
              </div>
            </div>
            <transition name="accordion">
              <div v-show="isSpecialistNotesExpanded" class="accordion-content">
                <div v-if="appointmentData.clinical_notes?.length" class="clinical-notes-list">
                  <div
                    v-for="(note, idx) in appointmentData.clinical_notes.slice(0, 3)"
                    :key="note.note_id || idx"
                    class="clinical-note-item clickable"
                    @click="editNote(note)"
                  >
                    <div class="note-header">
                      <v-icon name="hi-document-text" scale="0.8" />
                      <span>{{ note.chief_complaint || note.title || 'Clinical Note' }}</span>
                      <span v-if="note.is_draft" class="draft-badge">Draft</span>
                      <span class="note-date">{{ formatDateShort(note.created_at) }}</span>
                    </div>
                    <p class="note-preview">{{ (note.content || note.chief_complaint || '').substring(0, 150) }}{{ (note.content || note.chief_complaint || '').length > 150 ? '...' : '' }}</p>
                  </div>
                </div>

                <div v-else class="empty-notes compact">
                  <p>No clinical notes for this appointment</p>
                </div>

                <button class="add-note-btn" @click="addNote">
                  <v-icon name="hi-plus" scale="0.8" />
                  Add Clinical Note
                </button>
              </div>
            </transition>
          </div>
        </div>

        <!-- Right Column (Sidebar) -->
        <aside class="sidebar-column">

          <!-- Patient Profile Card -->
          <div class="card patient-profile-card">
            <div class="profile-header">
              <h3>Patient</h3>
              <router-link :to="{ name: 'SpecialistPatientDashboard', params: { patientId: patientInfo._id } }" class="view-profile-link">
                <v-icon name="hi-external-link" scale="0.75" />
                View Full Profile
              </router-link>
            </div>

            <div class="profile-content">
              <div class="profile-avatar">
                <img v-if="patientInfo.profileImage" :src="patientInfo.profileImage" :alt="patientInfo.fullName" />
                <div v-else class="avatar-initials">{{ patientInitials }}</div>
              </div>
              <h4 class="patient-name">{{ patientInfo.fullName }}</h4>
              <p class="patient-meta">{{ patientInfo.gender }} • {{ patientInfo.age }} years</p>

              <div class="patient-stats">
                <div class="stat-box">
                  <p class="stat-label">Height</p>
                  <p class="stat-value">{{ patientInfo.height?.value || '-' }} {{ patientInfo.height?.unit || '' }}</p>
                </div>
                <div class="stat-box">
                  <p class="stat-label">Weight</p>
                  <p class="stat-value">{{ patientInfo.weight?.value || '-' }} {{ patientInfo.weight?.unit || '' }}</p>
                </div>
                <div class="stat-box bmi">
                  <p class="stat-label">BMI</p>
                  <span class="bmi-badge" :class="getBmiClass(patientInfo.weightStatus)">
                    {{ patientInfo.weightStatus || '-' }}
                  </span>
                </div>
              </div>
            </div>

            <router-link :to="{ name: 'SpecialistPatientDashboard', params: { patientId: patientInfo._id } }" class="profile-btn">
              <v-icon name="hi-user" scale="0.9" />
              View Full Profile
            </router-link>
          </div>

          <!-- Health Score Card -->
          <div class="card health-score-card">
            <h3>Patient Health Profile</h3>

            <div class="score-list">
              <div class="score-item" :class="getScoreClass(healthScores.basic)" @click="healthScores.basic !== null && viewScoreDetails('basic')">
                <div class="score-header">
                  <span class="score-name">Basic Health Score</span>
                  <span v-if="healthScores.basic !== null" class="score-badge" :class="getScoreClass(healthScores.basic)">{{ getScoreLabel(healthScores.basic) }}</span>
                </div>
                <div class="score-bar-row">
                  <div class="score-bar">
                    <div class="score-fill" :style="{ width: (healthScores.basic || 0) + '%' }"></div>
                  </div>
                  <span class="score-value">{{ healthScores.basic ?? '-' }}</span>
                </div>
              </div>

              <div class="score-item advanced" :class="getScoreClass(healthScores.advanced)" @click="healthScores.advanced !== null && viewScoreDetails('advanced')">
                <div class="score-header">
                  <span class="score-name">Advanced Health Score</span>
                  <span v-if="healthScores.advanced !== null" class="score-badge" :class="getScoreClass(healthScores.advanced)">{{ getScoreLabel(healthScores.advanced) }}</span>
                </div>
                <div class="score-bar-row">
                  <div class="score-bar">
                    <div class="score-fill" :style="{ width: (healthScores.advanced || 0) + '%' }"></div>
                  </div>
                  <span class="score-value">{{ healthScores.advanced ?? '-' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Vitals Card -->
          <div class="card vitals-card">
            <h3>Recent Vitals</h3>

            <div class="vitals-list">
              <div class="vital-item red">
                <div class="vital-icon">
                  <v-icon name="hi-heart" scale="0.9" />
                </div>
                <div class="vital-info">
                  <p class="vital-name">Blood Pressure</p>
                  <p class="vital-date" v-if="getVitalDate(patientVitals.blood_pressure)">{{ formatRelativeTime(getVitalDate(patientVitals.blood_pressure)) }}</p>
                </div>
                <p class="vital-value">{{ getVitalValue(patientVitals.blood_pressure) }} {{ getVitalUnit(patientVitals.blood_pressure) }}</p>
              </div>

              <div class="vital-item pink">
                <div class="vital-icon">
                  <v-icon name="fa-heartbeat" scale="0.9" />
                </div>
                <div class="vital-info">
                  <p class="vital-name">Pulse Rate</p>
                  <p class="vital-date" v-if="getVitalDate(patientVitals.pulse_rate)">{{ formatRelativeTime(getVitalDate(patientVitals.pulse_rate)) }}</p>
                </div>
                <p class="vital-value">{{ getVitalValue(patientVitals.pulse_rate) }} {{ getVitalUnit(patientVitals.pulse_rate) }}</p>
              </div>

              <div class="vital-item blue">
                <div class="vital-icon">
                  <v-icon name="bi-droplet-fill" scale="0.9" />
                </div>
                <div class="vital-info">
                  <p class="vital-name">Blood Sugar</p>
                  <p class="vital-date" v-if="getVitalDate(patientVitals.blood_sugar_level)">{{ formatRelativeTime(getVitalDate(patientVitals.blood_sugar_level)) }}</p>
                </div>
                <p class="vital-value">{{ getVitalValue(patientVitals.blood_sugar_level) }} {{ getVitalUnit(patientVitals.blood_sugar_level) }}</p>
              </div>

              <div class="vital-item orange">
                <div class="vital-icon">
                  <v-icon name="fa-thermometer-half" scale="0.9" />
                </div>
                <div class="vital-info">
                  <p class="vital-name">Temperature</p>
                  <p class="vital-date" v-if="getVitalDate(patientVitals.body_temp)">{{ formatRelativeTime(getVitalDate(patientVitals.body_temp)) }}</p>
                </div>
                <p class="vital-value">{{ getVitalValue(patientVitals.body_temp) }} {{ getVitalUnit(patientVitals.body_temp) }}</p>
              </div>
            </div>
          </div>

          <!-- Recent Health Checkups Card -->
          <div class="card checkups-card">
            <div class="card-header-row">
              <h3>Recent Health Checkups</h3>
              <span v-if="checkupCount" class="count-badge">{{ checkupCount }}</span>
            </div>

            <div v-if="healthCheckups.length > 0" class="checkups-list">
              <div v-for="checkup in healthCheckups.slice(0, 3)" :key="checkup._id" class="checkup-item" :class="getTriageClass(checkup.response?.data?.triage_level)" @click="viewCheckupDetails(checkup)">
                <div class="checkup-header">
                  <p class="checkup-condition">{{ checkup.response?.data?.conditions?.[0]?.common_name || 'Health Assessment' }}</p>
                  <span class="triage-badge" :class="getTriageClass(checkup.response?.data?.triage_level)">{{ formatTriage(checkup.response?.data?.triage_level) }}</span>
                </div>
                <p class="checkup-date">{{ formatDateShort(checkup.created_at) }}</p>
                <p class="checkup-symptoms">{{ getCheckupSymptoms(checkup) }}</p>
              </div>
            </div>
            <div v-else class="empty-checkups">
              <p>No health checkups recorded</p>
            </div>

            <button v-if="healthCheckups.length > 0" class="view-all-btn" @click="viewFullRecords">
              <v-icon name="hi-clock" scale="0.8" />
              View All History
            </button>
          </div>

          <!-- Previous Appointments Card -->
          <div v-if="previousAppointments.length > 0" class="card prev-appointments-card">
            <h3>Previous Appointments</h3>

            <div class="prev-list">
              <div
                v-for="apt in previousAppointments.slice(0, 3)"
                :key="apt._id"
                class="prev-item clickable"
                @click="goToAppointment(apt._id)"
              >
                <div class="prev-header">
                  <p class="prev-date">{{ formatDateShort(apt.start_time) }}</p>
                  <span class="note-count-badge" v-if="apt.clinical_notes?.length">{{ apt.clinical_notes.length }} note(s)</span>
                  <v-icon name="hi-chevron-right" scale="0.8" />
                </div>
                <p class="prev-notes" v-if="apt.clinical_notes?.length">
                  {{ apt.clinical_notes[0]?.chief_complaint || apt.clinical_notes[0]?.content || 'Clinical note recorded' }}
                </p>
                <p v-else class="prev-notes empty">No notes recorded</p>
              </div>
            </div>

            <button class="view-all-btn" @click="goToAppointmentsList">
              <v-icon name="hi-calendar" scale="0.8" />
              View All Appointments
            </button>
          </div>

          <!-- Quick Actions Card -->
          <div class="card quick-actions-card">
            <h3>Quick Actions</h3>

            <div class="actions-list">
              <button class="quick-action primary" @click="addNote">
                <v-icon name="hi-document-add" scale="0.9" />
                Add Clinical Notes
              </button>
              <button class="quick-action" @click="addPrescription">
                <v-icon name="ri-capsule-line" scale="0.9" />
                Create Prescription
              </button>
              <button class="quick-action" @click="scheduleFollowUp">
                <v-icon name="hi-calendar" scale="0.9" />
                Schedule Follow-up
              </button>
              <button class="quick-action" @click="startChat">
                <v-icon name="hi-mail" scale="0.9" />
                Send Message
              </button>
            </div>
          </div>
        </aside>
      </div>

      <!-- Mobile Accordion Sections -->
      <div class="mobile-accordions mobile-only">
        <!-- Appointment Info Accordion -->
        <div class="mobile-accordion" :class="{ expanded: mobileAccordions.appointmentInfo }">
          <button class="accordion-trigger" @click="toggleMobileAccordion('appointmentInfo')">
            <h3>Appointment Information</h3>
            <v-icon :name="mobileAccordions.appointmentInfo ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.9" />
          </button>
          <div v-show="mobileAccordions.appointmentInfo" class="accordion-body">
            <div class="mobile-info-cards">
              <div class="mobile-info-card date">
                <div class="info-card-header">
                  <v-icon name="hi-calendar" scale="0.9" />
                  <span>Date</span>
                </div>
                <p class="info-card-value">{{ formatDay(appointmentData.start_time) }}</p>
                <p class="info-card-sub">{{ formatDateMedium(appointmentData.start_time) }}</p>
              </div>
              <div class="mobile-info-card time">
                <div class="info-card-header">
                  <v-icon name="hi-clock" scale="0.9" />
                  <span>Time</span>
                </div>
                <p class="info-card-value">{{ formatTime(appointmentData.start_time) }}</p>
                <p class="info-card-sub">({{ appointmentData.timezone || preferences.timezone || 'Local' }})</p>
              </div>
            </div>
            <div class="mobile-info-grid">
              <div class="mobile-info-item">
                <p class="label">Channel</p>
                <div class="value with-icon">
                  <v-icon :name="channelIcon" scale="0.9" />
                  <span>{{ channelLabel }}</span>
                </div>
              </div>
              <div class="mobile-info-item">
                <p class="label">Language</p>
                <p class="value">{{ preferences.language || 'English' }}</p>
              </div>
              <div class="mobile-info-item">
                <p class="label">Type</p>
                <p class="value">{{ appointmentData.appointment_type || 'General' }}</p>
              </div>
              <div class="mobile-info-item">
                <p class="label">Duration</p>
                <p class="value">{{ appointmentData.duration_minutes || 30 }} min</p>
              </div>
            </div>
            <div class="mobile-fee-box">
              <div class="fee-left">
                <p class="fee-label">Consultation Fee</p>
                <p class="fee-amount">{{ formatCurrency(appointmentData.appointment_fee) }}</p>
              </div>
              <span class="payment-badge" :class="getPaymentStatusClass(appointmentData.payment_status)">
                <v-icon :name="getPaymentStatusIcon(appointmentData.payment_status)" scale="0.7" />
                {{ formatPaymentStatus(appointmentData.payment_status) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Video Meeting Accordion -->
        <div v-if="hasMeetingLink || showMeetingSummary" class="mobile-accordion" :class="{ expanded: mobileAccordions.videoMeeting }">
          <button class="accordion-trigger with-icon" @click="toggleMobileAccordion('videoMeeting')">
            <div class="trigger-left">
              <div class="trigger-icon video">
                <v-icon name="hi-video-camera" scale="0.9" />
              </div>
              <div>
                <h3>Video Meeting</h3>
                <p class="trigger-sub">Zoom Meeting</p>
              </div>
            </div>
            <v-icon :name="mobileAccordions.videoMeeting ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.9" />
          </button>
          <div v-show="mobileAccordions.videoMeeting" class="accordion-body">
            <div v-if="hasMeetingLink" class="mobile-link-box">
              <div class="link-header">
                <p>Meeting Link</p>
                <button @click="copyToClipboard(meetingLink, 'Meeting link')">
                  <v-icon name="hi-clipboard-copy" scale="0.8" />
                  Copy
                </button>
              </div>
              <div class="link-content">{{ truncateLink(meetingLink) }}</div>
            </div>
            <div v-if="showMeetingSummary" class="mobile-meeting-stats">
              <div class="stat-row green">
                <span class="stat-name">Status</span>
                <span class="stat-val" :class="getAttendanceClass(appointmentData.attendance?.attendance_status)">{{ formatAttendanceStatus(appointmentData.attendance?.attendance_status) }}</span>
              </div>
              <div class="stat-row blue">
                <span class="stat-name">Duration</span>
                <span class="stat-val">{{ actualDuration }} min</span>
              </div>
              <div class="stat-row purple">
                <span class="stat-name">Participants</span>
                <span class="stat-val">{{ participantCount }}</span>
              </div>
            </div>
            <div v-if="appointmentData.attendance" class="mobile-attendance">
              <p class="attendance-title">Attendance</p>
              <div class="attendance-row" :class="{ joined: appointmentData.attendance.patient_joined }">
                <v-icon :name="appointmentData.attendance.patient_joined ? 'hi-check-circle' : 'hi-x-circle'" scale="0.9" />
                <span class="role">Patient</span>
                <span class="time" v-if="appointmentData.attendance.patient_joined_at">{{ formatDateTime(appointmentData.attendance.patient_joined_at) }}</span>
              </div>
              <div class="attendance-row" :class="{ joined: appointmentData.attendance.specialist_joined }">
                <v-icon :name="appointmentData.attendance.specialist_joined ? 'hi-check-circle' : 'hi-x-circle'" scale="0.9" />
                <span class="role">You</span>
                <span class="time" v-if="appointmentData.attendance.specialist_joined">Joined</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recording Accordion -->
        <div v-if="appointmentData.recording?.recording_url" class="mobile-accordion" :class="{ expanded: mobileAccordions.recording }">
          <button class="accordion-trigger with-icon" @click="toggleMobileAccordion('recording')">
            <div class="trigger-left">
              <div class="trigger-icon purple">
                <v-icon name="hi-video-camera" scale="0.9" />
              </div>
              <div>
                <h3>Recording</h3>
                <p class="trigger-sub">{{ appointmentData.recording.recording_duration_minutes || actualDuration }} minutes</p>
              </div>
            </div>
            <v-icon :name="mobileAccordions.recording ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.9" />
          </button>
          <div v-show="mobileAccordions.recording" class="accordion-body">
            <div class="mobile-recording-box">
              <div class="recording-header">
                <span class="recording-badge available">
                  <v-icon name="hi-check" scale="0.7" />
                  Available
                </span>
                <a :href="appointmentData.recording.recording_url" target="_blank" class="play-btn-mobile">
                  <v-icon name="hi-play" scale="0.9" />
                  Play
                </a>
              </div>
              <div v-if="appointmentData.recording.recording_password" class="password-box">
                <v-icon name="hi-lock-closed" scale="0.9" />
                <div>
                  <p class="pw-title">Password Protected</p>
                  <p class="pw-value">Password: <code>{{ appointmentData.recording.recording_password }}</code></p>
                </div>
              </div>
            </div>
            <button class="download-btn-mobile">
              <v-icon name="hi-download" scale="0.9" />
              Download Recording
            </button>
          </div>
        </div>

        <!-- Transcript Accordion -->
        <div v-if="appointmentData.transcript?.transcript_text || appointmentData.transcript?.transcript_url" class="mobile-accordion" :class="{ expanded: mobileAccordions.transcript }">
          <button class="accordion-trigger" @click="toggleMobileAccordion('transcript')">
            <h3>Meeting Transcript</h3>
            <v-icon :name="mobileAccordions.transcript ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.9" />
          </button>
          <div v-show="mobileAccordions.transcript" class="accordion-body">
            <div v-if="!appointmentData.transcript?.transcript_text" class="transcript-processing-mobile">
              <v-icon name="hi-clock" scale="1.2" />
              <p class="title">Transcript is processing...</p>
              <p class="desc">You'll be notified when it's ready.</p>
            </div>
            <div v-else class="transcript-content-mobile">
              <p>{{ truncateTranscript(appointmentData.transcript.transcript_text) }}</p>
            </div>
          </div>
        </div>

        <!-- Patient Notes Accordion -->
        <div class="mobile-accordion" :class="{ expanded: mobileAccordions.patientNotes }">
          <button class="accordion-trigger" @click="toggleMobileAccordion('patientNotes')">
            <h3>Patient's Notes & Files</h3>
            <v-icon :name="mobileAccordions.patientNotes ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.9" />
          </button>
          <div v-show="mobileAccordions.patientNotes" class="accordion-body">
            <div v-if="appointmentData.patient_notes" class="mobile-patient-note">
              <v-icon name="hi-annotation" scale="0.9" />
              <div>
                <p class="note-title">Notes from Patient</p>
                <p class="note-text">{{ appointmentData.patient_notes }}</p>
              </div>
            </div>
            <div class="mobile-files-section">
              <p v-if="!sharedDocuments.length" class="no-files">No files attached</p>
              <div v-else class="files-list-mobile">
                <div v-for="doc in sharedDocuments" :key="doc.url" class="file-item-mobile" @click="openDocument(doc)">
                  <v-icon :name="getDocIcon(doc.type)" scale="0.9" />
                  <span>{{ doc.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Clinical Notes Accordion -->
        <div class="mobile-accordion" :class="{ expanded: mobileAccordions.clinicalNotes }">
          <button class="accordion-trigger" @click="toggleMobileAccordion('clinicalNotes')">
            <h3>Notes & Instructions</h3>
            <v-icon :name="mobileAccordions.clinicalNotes ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.9" />
          </button>
          <div v-show="mobileAccordions.clinicalNotes" class="accordion-body">
            <div v-if="appointmentData.clinical_notes?.length" class="mobile-notes-list">
              <div v-for="(note, idx) in appointmentData.clinical_notes.slice(0, 3)" :key="note.note_id || idx" class="mobile-note-item" @click="editNote(note)">
                <div class="note-icon">
                  <v-icon name="hi-lock-closed" scale="0.8" />
                </div>
                <div class="note-content">
                  <div class="note-header">
                    <span class="note-title">Private Notes</span>
                    <span class="private-badge">Private</span>
                  </div>
                  <p class="note-text">{{ (note.content || note.chief_complaint || '').substring(0, 100) }}{{ (note.content || note.chief_complaint || '').length > 100 ? '...' : '' }}</p>
                </div>
              </div>
            </div>
            <p v-else class="empty-notes-text">No clinical notes for this appointment</p>
          </div>
        </div>

        <!-- Health Profile Accordion -->
        <div class="mobile-accordion" :class="{ expanded: mobileAccordions.healthProfile }">
          <button class="accordion-trigger" @click="toggleMobileAccordion('healthProfile')">
            <h3>Patient Health Profile</h3>
            <v-icon :name="mobileAccordions.healthProfile ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.9" />
          </button>
          <div v-show="mobileAccordions.healthProfile" class="accordion-body">
            <div class="mobile-score-item" :class="getScoreClass(healthScores.basic)">
              <div class="score-header">
                <span class="score-name">Basic Health Score</span>
                <span v-if="healthScores.basic !== null" class="score-badge" :class="getScoreClass(healthScores.basic)">{{ getScoreLabel(healthScores.basic) }}</span>
              </div>
              <div class="score-bar-row">
                <div class="score-bar">
                  <div class="score-fill" :style="{ width: (healthScores.basic || 0) + '%' }"></div>
                </div>
                <span class="score-value">{{ healthScores.basic ?? '-' }}</span>
              </div>
            </div>
            <div class="mobile-score-item" :class="getScoreClass(healthScores.advanced)">
              <div class="score-header">
                <span class="score-name">Advanced Health Score</span>
                <span v-if="healthScores.advanced !== null" class="score-badge" :class="getScoreClass(healthScores.advanced)">{{ getScoreLabel(healthScores.advanced) }}</span>
              </div>
              <div class="score-bar-row">
                <div class="score-bar">
                  <div class="score-fill" :style="{ width: (healthScores.advanced || 0) + '%' }"></div>
                </div>
                <span class="score-value">{{ healthScores.advanced ?? '-' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Vitals Accordion -->
        <div class="mobile-accordion" :class="{ expanded: mobileAccordions.vitals }">
          <button class="accordion-trigger" @click="toggleMobileAccordion('vitals')">
            <h3>Recent Vitals</h3>
            <v-icon :name="mobileAccordions.vitals ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.9" />
          </button>
          <div v-show="mobileAccordions.vitals" class="accordion-body">
            <div class="mobile-vitals-list">
              <div class="mobile-vital-item red">
                <v-icon name="hi-heart" scale="0.9" />
                <div class="vital-info">
                  <p class="vital-name">Blood Pressure</p>
                  <p class="vital-date" v-if="getVitalDate(patientVitals.blood_pressure)">{{ formatRelativeTime(getVitalDate(patientVitals.blood_pressure)) }}</p>
                </div>
                <p class="vital-value">{{ getVitalValue(patientVitals.blood_pressure) }} {{ getVitalUnit(patientVitals.blood_pressure) }}</p>
              </div>
              <div class="mobile-vital-item pink">
                <v-icon name="fa-heartbeat" scale="0.9" />
                <div class="vital-info">
                  <p class="vital-name">Pulse Rate</p>
                  <p class="vital-date" v-if="getVitalDate(patientVitals.pulse_rate)">{{ formatRelativeTime(getVitalDate(patientVitals.pulse_rate)) }}</p>
                </div>
                <p class="vital-value">{{ getVitalValue(patientVitals.pulse_rate) }} {{ getVitalUnit(patientVitals.pulse_rate) }}</p>
              </div>
              <div class="mobile-vital-item blue">
                <v-icon name="bi-droplet-fill" scale="0.9" />
                <div class="vital-info">
                  <p class="vital-name">Blood Sugar</p>
                  <p class="vital-date" v-if="getVitalDate(patientVitals.blood_sugar_level)">{{ formatRelativeTime(getVitalDate(patientVitals.blood_sugar_level)) }}</p>
                </div>
                <p class="vital-value">{{ getVitalValue(patientVitals.blood_sugar_level) }} {{ getVitalUnit(patientVitals.blood_sugar_level) }}</p>
              </div>
              <div class="mobile-vital-item orange">
                <v-icon name="fa-thermometer-half" scale="0.9" />
                <div class="vital-info">
                  <p class="vital-name">Temperature</p>
                  <p class="vital-date" v-if="getVitalDate(patientVitals.body_temp)">{{ formatRelativeTime(getVitalDate(patientVitals.body_temp)) }}</p>
                </div>
                <p class="vital-value">{{ getVitalValue(patientVitals.body_temp) }} {{ getVitalUnit(patientVitals.body_temp) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Health Checkups Accordion -->
        <div class="mobile-accordion" :class="{ expanded: mobileAccordions.checkups }">
          <button class="accordion-trigger" @click="toggleMobileAccordion('checkups')">
            <h3>Recent Health Checkups</h3>
            <span v-if="checkupCount" class="count-badge">{{ checkupCount }}</span>
          </button>
          <div v-show="mobileAccordions.checkups" class="accordion-body">
            <div v-if="healthCheckups.length > 0" class="mobile-checkups-list">
              <div v-for="checkup in healthCheckups.slice(0, 3)" :key="checkup._id" class="mobile-checkup-item" :class="getTriageClass(checkup.response?.data?.triage_level)" @click="viewCheckupDetails(checkup)">
                <div class="checkup-header">
                  <p class="checkup-condition">{{ checkup.response?.data?.conditions?.[0]?.common_name || 'Health Assessment' }}</p>
                  <span class="triage-badge" :class="getTriageClass(checkup.response?.data?.triage_level)">{{ formatTriage(checkup.response?.data?.triage_level) }}</span>
                </div>
                <p class="checkup-date">{{ formatDateShort(checkup.created_at) }}</p>
              </div>
            </div>
            <p v-else class="empty-checkups-text">No health checkups recorded</p>
            <button v-if="healthCheckups.length > 0" class="view-all-btn-mobile" @click="viewFullRecords">
              <v-icon name="hi-clock" scale="0.8" />
              View All History
            </button>
          </div>
        </div>

        <!-- Previous Appointments Accordion -->
        <div v-if="previousAppointments.length > 0" class="mobile-accordion" :class="{ expanded: mobileAccordions.previousAppts }">
          <button class="accordion-trigger" @click="toggleMobileAccordion('previousAppts')">
            <h3>Previous Appointments</h3>
            <v-icon :name="mobileAccordions.previousAppts ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.9" />
          </button>
          <div v-show="mobileAccordions.previousAppts" class="accordion-body">
            <div class="mobile-prev-list">
              <div v-for="apt in previousAppointments.slice(0, 3)" :key="apt._id" class="mobile-prev-item" @click="goToAppointment(apt._id)">
                <div class="prev-content">
                  <p class="prev-date">{{ formatDateShort(apt.start_time) }}</p>
                  <p class="prev-notes">{{ apt.clinical_notes?.length ? (apt.clinical_notes[0]?.chief_complaint || 'Clinical note recorded') : 'No notes recorded' }}</p>
                </div>
                <v-icon name="hi-chevron-right" scale="0.8" />
              </div>
            </div>
            <button class="view-all-btn-mobile" @click="goToAppointmentsList">
              <v-icon name="hi-calendar" scale="0.8" />
              View All Appointments
            </button>
          </div>
        </div>

        <!-- Quick Actions Section (Mobile) -->
        <section class="mobile-quick-actions">
          <h3>Quick Actions</h3>
          <div class="mobile-actions-list">
            <button class="mobile-action primary" @click="addNote">
              <v-icon name="hi-document-add" scale="0.9" />
              Add Clinical Notes
            </button>
            <button class="mobile-action" @click="addPrescription">
              <v-icon name="ri-capsule-line" scale="0.9" />
              Create Prescription
            </button>
            <button class="mobile-action" @click="startChat">
              <v-icon name="hi-mail" scale="0.9" />
              Send Message
            </button>
            <button class="mobile-action" @click="printReport">
              <v-icon name="bi-printer" scale="0.9" />
              Print Report
            </button>
            <button class="mobile-action" @click="shareAppointment">
              <v-icon name="hi-share" scale="0.9" />
              Share
            </button>
          </div>
        </section>
      </div>

      <!-- Desktop Bottom Action Bar -->
      <div class="bottom-action-bar desktop-only">
        <router-link :to="{ name: 'SpecialistAppointmentsList' }" class="back-btn-bottom">
          <v-icon name="hi-arrow-left" scale="0.9" />
          Back to Appointments
        </router-link>
        <div class="action-btns">
          <button class="action-btn outline" @click="printReport">
            <v-icon name="bi-printer" scale="0.9" />
            Print Report
          </button>
          <button class="action-btn primary" @click="scheduleFollowUp">
            <v-icon name="hi-calendar" scale="0.9" />
            Schedule Follow-up
          </button>
        </div>
      </div>

      <!-- Mobile Fixed Bottom Action -->
      <div class="mobile-bottom-action mobile-only">
        <button class="mobile-followup-btn" @click="scheduleFollowUp">
          <v-icon name="hi-calendar-plus" scale="0.9" />
          Schedule Follow-up
        </button>
      </div>
    </template>

    <!-- Modals -->
    <RescheduleModal
      :is-open="showRescheduleModal"
      :appointment="appointmentData"
      @close="showRescheduleModal = false"
      @reschedule="handleReschedule"
    />
    <CancelModal
      :is-open="showCancelModal"
      :appointment="appointmentData"
      @close="showCancelModal = false"
      @cancel="handleCancel"
    />
    <ClinicalNoteModal
      :is-open="showClinicalNoteModal"
      :appointment="appointmentData"
      :existing-note="editingNote"
      @close="closeClinicalNoteModal"
      @saved="handleNoteSaved"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, inject, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import { format, formatDistanceToNow } from 'date-fns';
import RescheduleModal from './modals/RescheduleModal.vue';
import CancelModal from './modals/CancelModal.vue';
import ClinicalNoteModal from './modals/ClinicalNoteModal.vue';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const $http = inject('$_HTTP');

// State
const isLoading = ref(true);
const error = ref(null);
const appointmentData = ref(null);
const patientInfo = ref({});
const patientVitals = ref({});
const healthScores = ref({ basic: null, advanced: null, advancedDetails: null });
const healthCheckups = ref([]);
const checkupCount = ref(0);
const previousAppointments = ref([]);
const preferences = ref({});
const showRescheduleModal = ref(false);
const showCancelModal = ref(false);
const showClinicalNoteModal = ref(false);
const editingNote = ref(null);
const showFullTranscript = ref(false);
const isPatientNotesExpanded = ref(false);
const isSpecialistNotesExpanded = ref(false);
const currentTime = ref(new Date());
let timeInterval = null;

// Mobile state
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024);
const mobileAccordions = reactive({
  appointmentInfo: true,
  videoMeeting: false,
  recording: false,
  transcript: false,
  patientNotes: false,
  clinicalNotes: false,
  healthProfile: false,
  vitals: false,
  checkups: false,
  previousAppts: false,
});

// Mobile computed
const isMobileView = computed(() => windowWidth.value < 768);

onMounted(() => {
  loadAppointment();
  timeInterval = setInterval(() => { currentTime.value = new Date(); }, 60000);

  // Handle window resize for mobile detection
  if (typeof window !== 'undefined') {
    windowWidth.value = window.innerWidth;
    window.addEventListener('resize', handleResize);
  }
});

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval);
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize);
  }
});

// Mobile methods
function handleResize() {
  windowWidth.value = window.innerWidth;
}

function toggleMobileAccordion(section) {
  mobileAccordions[section] = !mobileAccordions[section];
}

function goBack() {
  router.back();
}

function goToPatientProfile() {
  if (patientInfo.value._id) {
    router.push({ name: 'SpecialistPatientDashboard', params: { patientId: patientInfo.value._id } });
  }
}

// Watch for route param changes (when navigating between appointments)
watch(
  () => route.params.id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      loadAppointment();
    }
  }
);

// Computed: Status
const statusClass = computed(() => {
  const s = appointmentData.value?.status?.toLowerCase() || 'pending';
  return `status-${s.replace(/_/g, '-')}`;
});

const statusLabel = computed(() => {
  const labels = {
    open: 'Confirmed', confirmed: 'Confirmed', pending: 'Pending',
    completed: 'Completed', cancelled: 'Cancelled', missed: 'Missed',
    no_show: 'No Show', in_progress: 'In Progress', rescheduled: 'Rescheduled', ongoing: 'In Progress',
  };
  return labels[appointmentData.value?.status?.toLowerCase()] || 'Scheduled';
});

const statusIcon = computed(() => {
  const icons = {
    open: 'hi-check-circle', confirmed: 'hi-check-circle', pending: 'hi-clock',
    completed: 'hi-badge-check', cancelled: 'hi-x-circle', missed: 'hi-user-remove',
    no_show: 'hi-user-remove', in_progress: 'hi-play', rescheduled: 'hi-refresh', ongoing: 'hi-play',
  };
  return icons[appointmentData.value?.status?.toLowerCase()] || 'hi-calendar';
});

const isUrgent = computed(() => {
  const urgency = appointmentData.value?.urgency?.toLowerCase();
  return urgency === 'urgent' || urgency === 'emergency';
});

// Time calculations
const appointmentDateTime = computed(() => {
  if (!appointmentData.value?.start_time) return null;
  return new Date(appointmentData.value.start_time);
});

const isUpcoming = computed(() => {
  if (!appointmentDateTime.value) return false;
  const status = appointmentData.value?.status?.toLowerCase();
  return ['open', 'confirmed', 'pending'].includes(status) && appointmentDateTime.value > currentTime.value;
});

const isCompleted = computed(() => appointmentData.value?.status?.toLowerCase() === 'completed');

// Meeting Summary visibility
const showMeetingSummary = computed(() => {
  const status = appointmentData.value?.status?.toLowerCase();
  const hasAttendance = appointmentData.value?.attendance;
  const hasParticipants = (appointmentData.value?.participants || []).length > 0;
  const hasDuration = appointmentData.value?.call_duration?.time_taken;
  const hasRecording = appointmentData.value?.recording?.recording_url;

  return (status === 'completed' || status === 'missed') &&
         (hasAttendance || hasParticipants || hasDuration || hasRecording);
});

// Calculate actual duration from timestamps if available
const actualDuration = computed(() => {
  const mpd = appointmentData.value?.meeting_platform_data;
  if (mpd?.actual_start_time && mpd?.actual_end_time) {
    const start = new Date(mpd.actual_start_time);
    const end = new Date(mpd.actual_end_time);
    const diffMs = end - start;
    const mins = Math.round(diffMs / (1000 * 60));
    return mins > 0 ? mins : 1;
  }
  // Fallback to Zoom's reported duration or call_duration
  return mpd?.actual_duration_minutes || appointmentData.value?.call_duration?.time_taken || 0;
});

// Calculate participant count - check attendance if participants array is empty
const participantCount = computed(() => {
  const participants = appointmentData.value?.participants || [];
  if (participants.length > 0) return participants.length;

  // Check attendance data as fallback
  const attendance = appointmentData.value?.attendance;
  if (attendance) {
    let count = 0;
    if (attendance.patient_joined) count++;
    if (attendance.specialist_joined) count++;
    return count;
  }
  return 0;
});

const canJoin = computed(() => {
  if (!appointmentDateTime.value || !hasMeetingLink.value) return false;
  const status = appointmentData.value?.status?.toLowerCase();
  if (!['open', 'confirmed', 'ongoing'].includes(status)) return false;
  const diffMins = (appointmentDateTime.value - currentTime.value) / (1000 * 60);
  return diffMins <= 15 && diffMins >= -120;
});

const timeUntil = computed(() => {
  if (!appointmentDateTime.value) return null;
  const diffMs = appointmentDateTime.value - currentTime.value;
  if (diffMs <= 0) return null;
  const mins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${mins % 60}m`;
  return `${mins}m`;
});

// Channel
const channelIcon = computed(() => {
  const ch = appointmentData.value?.meeting_channel?.toLowerCase() || 'video';
  return { zoom: 'hi-video-camera', video: 'hi-video-camera', phone: 'hi-phone', audio: 'hi-phone', chat: 'hi-chat' }[ch] || 'hi-video-camera';
});
const channelLabel = computed(() => {
  const ch = appointmentData.value?.meeting_channel?.toLowerCase() || 'video';
  return { zoom: 'Video', video: 'Video', phone: 'Phone', audio: 'Audio', chat: 'Chat' }[ch] || 'Video';
});

// Meeting
const hasMeetingLink = computed(() => !!(appointmentData.value?.meeting_link || appointmentData.value?.start_url || appointmentData.value?.join_url));
const meetingLink = computed(() => appointmentData.value?.start_url || appointmentData.value?.meeting_link || appointmentData.value?.join_url || '');

// Patient
const patientInitials = computed(() => {
  const name = patientInfo.value.fullName || '';
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
});

// Documents
const sharedDocuments = computed(() => appointmentData.value?.shared_documents || []);

// Permissions
const canReschedule = computed(() => ['open', 'confirmed', 'pending'].includes(appointmentData.value?.status?.toLowerCase()));
const canCancel = computed(() => ['open', 'confirmed', 'pending'].includes(appointmentData.value?.status?.toLowerCase()));

// Load Appointment using the comprehensive API
async function loadAppointment() {
  const id = route.params.id;
  if (!id) return;

  isLoading.value = true;
  error.value = null;

  try {
    const { data } = await $http.$_getAppointmentDetailsForSpecialist(id);
    const details = data.data;

    appointmentData.value = details.appointment;

    patientInfo.value = {
      _id: details.patient._id,
      fullName: details.patient.full_name,
      firstName: details.patient.first_name || '',
      lastName: details.patient.last_name || '',
      profileImage: details.patient.profile_image,
      gender: details.patient.gender,
      weight: details.patient.weight || { value: '-', unit: '' },
      height: details.patient.height || { value: '-', unit: '' },
      age: details.patient.age,
      isSmoker: details.patient.is_smoker || 'Unknown',
      weightStatus: details.patient.weight_status || '-',
      medicalHistory: details.patient.medical_history || [],
    };

    patientVitals.value = details.vitals || {};

    healthScores.value = {
      basic: details.health_scores?.basic || null,
      advanced: details.health_scores?.advanced || null,
      advancedDetails: details.health_scores?.advanced_details || null,
    };

    healthCheckups.value = details.health_checkups || [];
    checkupCount.value = details.checkup_count || 0;

    // Load previous appointments - backend may not return them
    if (details.previous_appointments?.length) {
      previousAppointments.value = details.previous_appointments;
    } else if (details.patient?._id) {
      await loadPreviousAppointments(details.patient._id, id);
    }

    await loadPreferences();

  } catch (err) {
    console.error('Failed to load appointment:', err);
    await loadAppointmentFallback(id);
  } finally {
    isLoading.value = false;
  }
}

async function loadAppointmentFallback(id) {
  try {
    const { data } = await $http.$_getOnetAppointments(id);
    appointmentData.value = data.data;

    if (data.data.patient) {
      const patientId = typeof data.data.patient === 'string' ? data.data.patient : data.data.patient._id;
      await loadPatientInfo(patientId);
      await loadPatientVitals(patientId);
      await loadHealthCheckups(patientId);
      await loadPreviousAppointments(patientId, id);
    }
  } catch (err) {
    error.value = 'Failed to load appointment details';
  }
}

async function loadPatientInfo(patientId) {
  try {
    const { data } = await $http.$_getOneUser(patientId);
    const p = data.data;
    patientInfo.value = {
      _id: p._id,
      fullName: p.full_name || `${p.profile?.first_name || ''} ${p.profile?.last_name || ''}`.trim(),
      firstName: p.profile?.first_name || '',
      lastName: p.profile?.last_name || '',
      profileImage: p.profile?.profile_image || p.profile?.profile_photo,
      gender: p.profile?.gender || 'Not specified',
      weight: p.profile?.basic_health_info?.weight || { value: '-', unit: '' },
      height: p.profile?.basic_health_info?.height || { value: '-', unit: '' },
      age: calculateAge(p.profile?.date_of_birth),
      isSmoker: p.profile?.health_risk_factors?.is_smoker || 'Unknown',
      weightStatus: p.profile?.health_risk_factors?.weight_status || '-',
      medicalHistory: p.pre_existing_conditions || [],
    };
  } catch (err) {
    console.error('Failed to load patient info:', err);
  }
}

async function loadPatientVitals(patientId) {
  try {
    const { data } = await $http.$_getOneUserVitals(patientId);
    patientVitals.value = data.data || {};
  } catch (err) {
    patientVitals.value = {};
  }
}

async function loadHealthCheckups(patientId) {
  try {
    const { data } = await $http.$_getHealthCheckupResult(patientId);
    if (Array.isArray(data.data)) {
      healthCheckups.value = data.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      checkupCount.value = data.data.length;
    }
  } catch (err) {
    healthCheckups.value = [];
  }
}

async function loadPreferences() {
  try {
    const { data } = await $http.$_getSpecialistAvailability();
    preferences.value = data.data?.preferences || {};
  } catch (err) {
    preferences.value = {};
  }
}

async function loadPreviousAppointments(patientId, currentAppointmentId) {
  try {
    const { data } = await $http.$_getSpecialistAppointments({
      patient: patientId,
      status: 'COMPLETED',
      limit: 5,
    });
    if (Array.isArray(data.data)) {
      previousAppointments.value = data.data
        .filter(apt => apt._id !== currentAppointmentId)
        .slice(0, 3);
    }
  } catch (err) {
    previousAppointments.value = [];
  }
}

// Navigation helpers
function goToAppointment(appointmentId) {
  router.push({ name: 'SpecialistAppointmentDetail', params: { id: appointmentId } });
}

function goToAppointmentsList() {
  router.push({ name: 'SpecialistAppointmentsList', query: { patient: patientInfo.value._id, tab: 'history' } });
}

// Format helpers
function formatDateFull(dateStr) {
  if (!dateStr) return '';
  return format(new Date(dateStr), 'EEEE, MMMM dd, yyyy');
}

function formatDay(dateStr) {
  if (!dateStr) return '';
  return format(new Date(dateStr), 'EEEE');
}

function formatDateMedium(dateStr) {
  if (!dateStr) return '';
  return format(new Date(dateStr), 'MMMM dd, yyyy');
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  return format(new Date(dateStr), 'MMM dd, yyyy');
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  return format(new Date(dateStr), 'hh:mm a');
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }); }
  catch { return ''; }
}

function formatCurrency(amount) {
  if (amount === null || amount === undefined) return 'Not set';
  if (amount === 0) return 'Free';
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
}

function formatUrgency(urgency) {
  if (!urgency) return 'Routine';
  return urgency.charAt(0).toUpperCase() + urgency.slice(1).toLowerCase();
}

function formatPaymentStatus(status) {
  if (!status) return 'Pending';
  const labels = { SUCCESSFUL: 'Paid', PENDING: 'Pending', FAILED: 'Failed' };
  return labels[status?.toUpperCase()] || status;
}

function getPaymentStatusClass(status) {
  if (!status) return 'pending';
  return status.toLowerCase();
}

function getPaymentStatusIcon(status) {
  const icons = { SUCCESSFUL: 'hi-check-circle', PENDING: 'hi-clock', FAILED: 'hi-x-circle' };
  return icons[status?.toUpperCase()] || 'hi-clock';
}

function formatCallDuration(callDuration) {
  if (!callDuration?.time_taken) return 'N/A';
  const mins = callDuration.time_taken;
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hours}h ${remainMins}m` : `${hours}h`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  try { return format(new Date(dateStr), 'MMM dd, hh:mm a'); }
  catch { return ''; }
}

function formatAttendanceStatus(status) {
  const labels = { both: 'Both Joined', patient_only: 'Patient Only', specialist_only: 'Specialist Only', none: 'No One Joined', unknown: 'Meeting Held' };
  return labels[status] || status || 'Unknown';
}

function getAttendanceClass(status) {
  const classes = { both: 'attendance-both', patient_only: 'attendance-partial', specialist_only: 'attendance-partial', none: 'attendance-none', unknown: 'attendance-unknown' };
  return classes[status] || 'attendance-none';
}

function truncateTranscript(text) {
  if (!text) return '';
  if (showFullTranscript.value) return text;
  return text.length > 500 ? text.substring(0, 500) + '...' : text;
}

// Document helpers
function getDocIcon(type) {
  if (!type) return 'hi-document';
  const lowerType = type.toLowerCase();
  if (lowerType.includes('pdf')) return 'hi-document-text';
  if (lowerType.includes('image') || lowerType.includes('jpg') || lowerType.includes('png') || lowerType.includes('jpeg')) return 'hi-photograph';
  if (lowerType.includes('video')) return 'hi-video-camera';
  if (lowerType.includes('audio')) return 'hi-microphone';
  return 'hi-document';
}

function getDocTypeClass(type) {
  if (!type) return 'doc';
  const lowerType = type.toLowerCase();
  if (lowerType.includes('pdf')) return 'pdf';
  if (lowerType.includes('image') || lowerType.includes('jpg') || lowerType.includes('png') || lowerType.includes('jpeg')) return 'image';
  if (lowerType.includes('video')) return 'video';
  return 'doc';
}

function openDocument(doc) {
  if (doc.url) window.open(doc.url, '_blank');
}

function downloadDocument(doc) {
  if (doc.url) {
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.name || 'document';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started');
  }
}

function truncateLink(link) {
  if (!link) return '';
  return link.length <= 60 ? link : link.substring(0, 57) + '...';
}

function calculateAge(dob) {
  if (!dob) return 'N/A';
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// Vital helpers
function getVitalValue(vitalArray) {
  if (!vitalArray || !Array.isArray(vitalArray) || !vitalArray.length) return '-';
  return vitalArray[0]?.value || '-';
}

function getVitalUnit(vitalArray) {
  if (!vitalArray || !Array.isArray(vitalArray) || !vitalArray.length) return '';
  return vitalArray[0]?.unit || '';
}

function getVitalDate(vitalArray) {
  if (!vitalArray || !Array.isArray(vitalArray) || !vitalArray.length) return null;
  return vitalArray[0]?.updatedAt || vitalArray[0]?.created_at;
}

// Health score helpers
function getScoreClass(score) {
  if (score === null) return 'score-none';
  if (score >= 80) return 'score-excellent';
  if (score >= 60) return 'score-good';
  if (score >= 40) return 'score-fair';
  return 'score-poor';
}

function getScoreLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Attention';
}

function getBmiClass(status) {
  if (!status) return '';
  const s = status.toLowerCase();
  if (s === 'normal') return 'normal';
  if (s === 'overweight' || s === 'underweight') return 'warning';
  if (s === 'obese') return 'danger';
  return '';
}

// Checkup helpers
function getCheckupSymptoms(checkup) {
  const symptoms = checkup.request?.symptoms || checkup.request?.evidence || [];
  if (!symptoms.length) return 'General checkup';
  const names = symptoms.filter(s => s.choice_id === 'present' || s.source === 'initial').slice(0, 2).map(s => s.name || s.common_name || 'Symptom');
  return names.join(', ') || 'Health assessment';
}

function getTriageClass(level) {
  if (!level) return 'triage-unknown';
  const l = level.toLowerCase();
  if (l.includes('emergency')) return 'triage-emergency';
  if (l.includes('consultation_24')) return 'triage-urgent';
  if (l.includes('consultation')) return 'triage-moderate';
  if (l.includes('self_care')) return 'triage-low';
  return 'triage-unknown';
}

function formatTriage(level) {
  if (!level) return 'N/A';
  const l = level.toLowerCase();
  if (l.includes('emergency')) return 'Emergency';
  if (l.includes('consultation_24')) return 'Urgent';
  if (l.includes('consultation')) return 'Moderate';
  if (l.includes('self_care')) return 'Low';
  return 'N/A';
}

// Actions
function joinMeeting() {
  if (meetingLink.value) window.open(meetingLink.value, '_blank');
}

function copyToClipboard(text, label) {
  if (text) { navigator.clipboard.writeText(text); toast.success(`${label} copied to clipboard`); }
}

function editNotes() {
  // Navigate to clinical notes for this patient
  if (patientInfo.value._id) {
    router.push({ name: 'SpecialistClinicalNotes', query: { patient: patientInfo.value._id, appointment: route.params.id } });
  } else {
    toast.info('Patient information not available');
  }
}
function printReport() { window.print(); }
function shareAppointment() {
  if (navigator.share) {
    navigator.share({
      title: 'Appointment Details',
      text: `Appointment with ${patientInfo.value.fullName}`,
      url: window.location.href,
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  }
}
function scheduleFollowUp() { toast.info('Schedule follow-up coming soon'); }
function startChat() { toast.info('Chat feature coming soon'); }

function addPrescription() {
  router.push({ name: 'SpecialistPrescriptionCreate', params: { patientId: patientInfo.value._id } });
}

function addNote() {
  // Open the clinical note modal for new note
  editingNote.value = null;
  showClinicalNoteModal.value = true;
}

function editNote(note) {
  // Open the clinical note modal with existing note
  editingNote.value = note;
  showClinicalNoteModal.value = true;
}

function handleNoteSaved(note) {
  showClinicalNoteModal.value = false;
  editingNote.value = null;
  toast.success('Clinical note saved successfully');
  // Refresh appointment data to show the new/updated note
  loadAppointment();
}

function closeClinicalNoteModal() {
  showClinicalNoteModal.value = false;
  editingNote.value = null;
}

function viewFullRecords() {
  if (patientInfo.value._id) {
    router.push({ name: 'SpecialistPatientHealthRecords', params: { patientId: patientInfo.value._id }, query: { appointmentId: route.params.id } });
  }
}

function viewScoreDetails(type) {
  router.push({
    name: 'SpecialistPatientHealthScoreReport',
    params: { appointmentId: route.params.id, type },
    query: { patientName: patientInfo.value.fullName, patientGender: patientInfo.value.gender, patientAge: patientInfo.value.age },
  });
}

function viewCheckupDetails(checkup) {
  router.push({
    name: 'SpecialistPatientCheckupDetail',
    params: { appointmentId: route.params.id, checkupId: checkup._id },
    query: { patientName: patientInfo.value.fullName, patientGender: patientInfo.value.gender, patientAge: patientInfo.value.age },
  });
}

async function handleReschedule(data) {
  try {
    const response = await $http.$_rescheduleAppointment(data.appointmentId, { date: data.newDate, time: data.newTime, reason: data.reason, notify_patient: data.notifyPatient });
    if (response.data) { toast.success('Appointment rescheduled'); showRescheduleModal.value = false; await loadAppointment(); }
  } catch (err) { toast.error('Failed to reschedule'); }
}

async function handleCancel(data) {
  try {
    const response = await $http.$_cancelAppointment(data.appointmentId, { reason: data.reason, refund_option: data.refundOption, offer_reschedule: data.offerReschedule, notify_patient: data.notifyPatient });
    if (response.data) { toast.success('Appointment cancelled'); showCancelModal.value = false; await loadAppointment(); }
  } catch (err) { toast.error('Failed to cancel'); }
}
</script>

<style scoped lang="scss">
// Color Variables - Sky Blue Theme
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$success: #10B981;
$success-light: #D1FAE5;
$danger: #EF4444;
$danger-light: #FEE2E2;
$warning: #F59E0B;
$warning-light: #FEF3C7;
$purple: #8B5CF6;
$purple-light: #EDE9FE;
$orange: #FF9800;
$navy: #1A365D;
$gray-50: #F9FAFB;
$gray-100: #F3F4F6;
$gray-200: #E5E7EB;
$gray-300: #D1D5DB;
$gray-400: #9CA3AF;
$gray-500: #6B7280;
$gray-600: #4B5563;
$gray-700: #374151;
$gray-800: #1F2937;
$gray-900: #111827;
$white: #FFFFFF;

$font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
$font-mono: 'JetBrains Mono', 'Fira Code', monospace;
$radius: 12px;
$radius-sm: 8px;
$shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
$shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
$shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
$transition: 0.2s ease;

.appointment-detail-page {
  max-width: 1400px;
  margin: 0 auto;
  padding-bottom: 100px;
  font-family: $font-sans;
}

// Loading & Error States
.loading-state, .error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.loading-card, .error-card {
  background: $white;
  border-radius: $radius;
  padding: 3rem;
  text-align: center;
  box-shadow: $shadow-md;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid $gray-200;
  border-top-color: $sky;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin { to { transform: rotate(360deg); } }

.error-icon { color: $danger; margin-bottom: 1rem; }
.error-card h3 { font-size: 1.25rem; color: $navy; margin: 0 0 0.5rem; }
.error-card p { color: $gray-500; margin-bottom: 1.5rem; }
.btn-retry {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: $sky;
  color: $white;
  border: none;
  border-radius: $radius-sm;
  font-weight: 600;
  cursor: pointer;
  transition: background $transition;
  &:hover { background: $sky-dark; }
}

// Page Header
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  margin-bottom: 1rem;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: $gray-600;
  text-decoration: none;
  font-weight: 500;
  transition: color $transition;
  &:hover { color: $gray-900; }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0.5rem;
  background: $white;
  border: 1px solid $gray-200;
  border-radius: $radius-sm;
  color: $gray-600;
  cursor: pointer;
  transition: all $transition;
  &:hover {
    border-color: $sky;
    color: $sky;
    background: $sky-light;
  }
}

// Appointment Header Section
.appointment-header {
  background: $white;
  border-radius: $radius;
  border: 1px solid $gray-200;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.header-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;

  h1 {
    font-size: 1.25rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0;
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 600;

  &.status-completed, &.status-open, &.status-confirmed {
    background: $success;
    color: $white;
  }
  &.status-pending { background: $warning-light; color: $warning; }
  &.status-cancelled, &.status-missed, &.status-no-show {
    background: $danger;
    color: $white;
  }
  &.status-ongoing, &.status-in-progress {
    background: $sky;
    color: $white;
  }
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: $gray-600;
  font-size: 0.8125rem;

  .appt-id {
    font-family: $font-mono;
    font-weight: 600;
  }
  .divider { color: $gray-300; }
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border-radius: $radius-sm;
  font-weight: 600;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all $transition;
  border: 2px solid transparent;

  svg { transform: scale(0.85); }

  &.outline {
    background: $white;
    border-color: $gray-300;
    color: $gray-700;
    &:hover { background: $gray-50; border-color: $gray-400; }
  }
  &.primary {
    background: $sky;
    color: $white;
    &:hover { background: $sky-dark; }
  }
  &.danger {
    background: $danger-light;
    color: $danger;
    border-color: transparent;
    &:hover { background: $danger; color: $white; }
  }
}

// Content Grid
.content-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1.25rem;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

.main-column {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.sidebar-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (max-width: 1200px) {
    order: -1;
  }
}

// Cards
.card {
  background: $white;
  border-radius: $radius;
  border: 1px solid $gray-200;
  padding: 1rem;
}

.card-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: $gray-900;
  margin: 0 0 1rem;
}

.card-subtitle {
  font-size: 0.75rem;
  color: $gray-500;
  margin: 0;
}

.card-header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.card-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  h3 {
    font-size: 0.9375rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0;
  }
  .subtitle {
    font-size: 0.75rem;
    color: $gray-500;
  }
}

.title-icon {
  width: 36px;
  height: 36px;
  border-radius: $radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;

  &.video {
    background: $sky;
    color: $white;
  }
}

// Appointment Info Card
.appointment-info-card {
  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
}

.info-highlight {
  padding: 0.75rem;
  border-radius: $radius-sm;

  &.date-card {
    background: linear-gradient(135deg, $sky-light 0%, lighten($sky-light, 3%) 100%);
    .highlight-header svg { color: $sky; }
    .highlight-date { color: $sky; font-weight: 600; }
  }

  &.time-card {
    background: linear-gradient(135deg, $success-light 0%, lighten($success-light, 3%) 100%);
    .highlight-header svg { color: $success; }
  }

  .highlight-header {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin-bottom: 0.375rem;

    svg { transform: scale(0.85); }

    .highlight-label {
      font-size: 0.6875rem;
      font-weight: 600;
      color: $gray-700;
      text-transform: uppercase;
    }
  }

  .highlight-day {
    font-size: 0.875rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0;
  }

  .highlight-date, .highlight-time {
    font-size: 0.75rem;
    margin: 0;
  }

  .highlight-time {
    font-size: 0.9375rem;
    font-weight: 700;
    color: $gray-900;
  }

  .highlight-tz {
    font-size: 0.6875rem;
    color: $gray-600;
    margin: 0;
  }
}

.info-item {
  padding: 0.75rem;
  background: $gray-50;
  border-radius: $radius-sm;

  .info-label {
    font-size: 0.6875rem;
    font-weight: 600;
    color: $gray-500;
    text-transform: uppercase;
    margin: 0 0 0.25rem;
  }

  .info-value {
    font-size: 0.8125rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0;

    &.with-icon {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      svg { color: $sky; transform: scale(0.85); }
    }
  }
}

.urgency-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  padding: 0.125rem 0.5rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 600;

  &.routine { background: $sky-light; color: $sky; }
  &.urgent, &.emergency { background: $danger-light; color: $danger; }
}

.fee-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem;
  background: $success-light;
  border: 1px solid lighten($success, 30%);
  border-radius: $radius-sm;

  .fee-label {
    font-size: 0.75rem;
    color: $gray-600;
    margin: 0 0 0.125rem;
  }

  .fee-amount {
    font-size: 1.25rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0;
  }

  .fee-status { text-align: right; }
}

.payment-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  padding: 0.375rem 0.75rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 600;

  &.successful { background: $success; color: $white; }
  &.pending { background: $warning-light; color: $warning; }
  &.failed { background: $danger; color: $white; }
}

// Video Meeting Card
.video-meeting-card {
  background: $sky-light;
  border: 1px solid lighten($sky, 15%);
}

.meeting-status {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  padding: 0.375rem 0.75rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 600;

  &.completed { background: $success; color: $white; }
}

.join-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: $sky;
  color: $white;
  border: none;
  border-radius: $radius-sm;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background $transition;
  &:hover { background: $sky-dark; }
  svg { transform: scale(0.85); }
}

.countdown-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: $warning-light;
  color: $warning;
  border-radius: 50px;
  font-weight: 600;
  font-size: 0.75rem;
}

.meeting-link-box {
  background: $white;
  border-radius: $radius-sm;
  padding: 0.875rem;
  margin-bottom: 0.75rem;

  .link-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;

    .link-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: $gray-700;
      margin: 0;
    }
  }

  .copy-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.125rem;
    padding: 0.125rem 0.375rem;
    background: transparent;
    border: none;
    color: $sky;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    &:hover { color: $sky-dark; }
    svg { transform: scale(0.8); }
  }

  .link-content {
    padding: 0.5rem;
    background: $gray-50;
    border-radius: $radius-sm;
    font-family: $font-mono;
    font-size: 0.75rem;
    color: $gray-900;
    word-break: break-all;
  }
}

.meeting-summary-box {
  background: $white;
  border-radius: $radius-sm;
  padding: 0.875rem;

  h4 {
    font-size: 0.875rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 0.75rem;
  }
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.75rem;

  .stat-item {
    padding: 0.5rem;
    border-radius: $radius-sm;

    &.green { background: lighten($success-light, 3%); }
    &.blue { background: $sky-light; }
    &.purple { background: $purple-light; }
    &.gray { background: $gray-50; }
    &.full-width { grid-column: span 2; }

    .stat-label {
      font-size: 0.6875rem;
      color: $gray-600;
      margin: 0 0 0.125rem;
    }

    .stat-value {
      font-size: 0.8125rem;
      font-weight: 700;
      color: $gray-900;
      margin: 0;

      &.attendance-both { color: $success; }
      &.attendance-partial { color: $warning; }
      &.attendance-none { color: $danger; }
    }
  }
}

.attendance-section {
  border-top: 1px solid $gray-200;
  padding-top: 0.75rem;

  h5 {
    font-size: 0.75rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 0.5rem;
  }
}

.attendance-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.attendance-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: $gray-50;
  border-radius: $radius-sm;

  &.joined {
    background: lighten($success-light, 3%);
    .attendance-icon { color: $success; }
  }

  &:not(.joined) {
    .attendance-icon { color: $danger; }
  }

  .attendance-icon svg { transform: scale(0.85); }

  .attendance-role {
    font-size: 0.75rem;
    font-weight: 600;
    color: $gray-900;
    flex: 1;
  }

  .attendance-time {
    font-size: 0.75rem;
    color: $gray-600;

    &.not-joined { color: $danger; }
  }
}

// Participants Card
.participants-card {
  .participants-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: $gray-50;
  border-radius: $radius-sm;

  .participant-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    background: $gray-200;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $gray-500;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    svg { transform: scale(0.85); }
  }

  .participant-info {
    flex: 1;

    .participant-name {
      font-size: 0.8125rem;
      font-weight: 700;
      color: $gray-900;
      margin: 0 0 0.125rem;
    }

    .participant-email {
      font-size: 0.75rem;
      color: $gray-600;
      margin: 0 0 0.125rem;
    }

    .participant-joined {
      font-size: 0.6875rem;
      color: $gray-500;
      margin: 0;
    }
  }

  .participant-duration {
    text-align: right;

    .duration-value {
      display: block;
      font-size: 1rem;
      font-weight: 700;
      color: $sky;
    }

    .duration-label {
      font-size: 0.6875rem;
      color: $gray-500;
    }
  }
}

// Recording Card
.recording-card {
  background: $purple-light;
  border: 1px solid lighten($purple, 40%);
}

.recording-status {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  padding: 0.375rem 0.75rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 600;

  &.available { background: $success; color: $white; }
}

.recording-content {
  background: $white;
  border-radius: $radius-sm;
  padding: 0.875rem;
  margin-bottom: 0.75rem;
}

.recording-info-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;

  .recording-icon {
    width: 48px;
    height: 48px;
    background: $purple;
    color: $white;
    border-radius: $radius-sm;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .recording-details {
    flex: 1;

    .recording-duration {
      font-weight: 700;
      color: $gray-900;
      margin: 0;
    }

    .recording-desc {
      font-size: 0.875rem;
      color: $gray-600;
      margin: 0;
    }
  }

  .play-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: $sky;
    color: $white;
    border-radius: $radius-sm;
    font-weight: 600;
    text-decoration: none;
    transition: background $transition;
    &:hover { background: $sky-dark; }
  }
}

.password-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: $warning-light;
  border: 1px solid lighten($warning, 30%);
  border-radius: $radius-sm;

  > svg { color: $warning; margin-top: 2px; }

  .password-title {
    font-weight: 600;
    color: $gray-900;
    font-size: 0.875rem;
    margin: 0;
  }

  .password-value {
    font-size: 0.75rem;
    color: $gray-700;
    margin: 0.25rem 0 0;

    code {
      font-family: $font-mono;
      font-weight: 700;
      background: rgba($white, 0.5);
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
    }
  }

  .copy-btn-small {
    display: inline-flex;
    padding: 0.125rem;
    background: transparent;
    border: none;
    color: $sky;
    cursor: pointer;
    vertical-align: middle;
    margin-left: 0.25rem;
  }
}

.download-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: $white;
  border: 1px solid lighten($purple, 40%);
  border-radius: $radius-sm;
  color: $purple;
  font-weight: 600;
  text-decoration: none;
  transition: all $transition;
  cursor: pointer;

  &:hover {
    background: $purple-light;
  }

  &.small {
    width: auto;
    padding: 0.375rem 0.75rem;
    background: $sky;
    border: none;
    color: $white;
    font-size: 0.75rem;
    &:hover { background: $sky-dark; }
  }
}

// Transcript Card
.transcript-content {
  p { color: $gray-700; line-height: 1.6; margin: 0 0 0.75rem; font-size: 0.8125rem; }

  .expand-btn {
    background: transparent;
    border: none;
    color: $sky;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    &:hover { text-decoration: underline; }
  }
}

.transcript-available {
  padding: 1rem;
  background: $success-light;
  border: 1px solid lighten($success, 30%);
  border-radius: $radius-sm;
  text-align: center;

  svg { color: $success; margin-bottom: 0.5rem; }

  .available-text {
    font-size: 0.8125rem;
    font-weight: 600;
    color: $gray-700;
    margin: 0;
  }
}

.transcript-processing {
  padding: 1rem;
  background: $warning-light;
  border: 1px solid lighten($warning, 30%);
  border-radius: $radius-sm;
  text-align: center;

  svg { color: $warning; margin-bottom: 0.5rem; }

  .processing-title {
    font-size: 0.8125rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0;
  }

  .processing-desc {
    font-size: 0.75rem;
    color: $gray-700;
    margin: 0;
  }
}

// AI Summary Card
.ai-summary-card {
  .ai-icon { color: $purple; }

  .ai-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.75rem;
    background: $purple-light;
    color: $purple;
    border-radius: 50px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .summary-content {
    p { color: $gray-700; line-height: 1.6; margin: 0 0 1rem; }

    .next-steps {
      h5 {
        font-size: 0.875rem;
        font-weight: 700;
        color: $gray-900;
        margin: 0 0 0.5rem;
      }

      ul {
        margin: 0;
        padding-left: 1.25rem;

        li {
          color: $gray-700;
          margin-bottom: 0.25rem;
        }
      }
    }
  }
}

// Accordion Cards
.accordion-card {
  .accordion-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    user-select: none;

    .card-title { margin: 0; }
  }

  .accordion-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: $gray-500;
  }

  .has-content-badge {
    font-size: 0.6875rem;
    padding: 0.125rem 0.5rem;
    background: $sky-light;
    color: $sky;
    border-radius: 50px;
    font-weight: 600;
  }

  .accordion-content {
    padding-top: 1rem;
    overflow: hidden;
  }

  &.expanded {
    .accordion-header { margin-bottom: 0; }
  }
}

.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.25s ease;
  max-height: 500px;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
}

.clinical-notes-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.clinical-note-item {
  padding: 0.75rem;
  background: $gray-50;
  border-radius: $radius-sm;
  border-left: 3px solid $sky;

  &.clickable {
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      background: $gray-100;
      border-left-color: darken($sky, 10%);
      transform: translateX(2px);
    }
  }

  .note-header {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin-bottom: 0.375rem;
    color: $gray-700;
    font-weight: 600;
    font-size: 0.75rem;

    .draft-badge {
      padding: 2px 6px;
      background: #FEF3C7;
      color: #92400E;
      border-radius: 4px;
      font-size: 0.625rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .note-date {
      margin-left: auto;
      color: $gray-500;
      font-weight: 400;
    }
  }

  .note-preview {
    font-size: 0.75rem;
    color: $gray-600;
    margin: 0;
    line-height: 1.4;
  }
}

.empty-notes.compact {
  padding: 1rem;
  text-align: center;

  p {
    font-size: 0.8125rem;
    color: $gray-500;
    margin: 0;
  }
}

.add-note-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  width: 100%;
  padding: 0.625rem;
  background: $white;
  border: 1px dashed $gray-300;
  border-radius: $radius-sm;
  color: $gray-600;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all $transition;

  &:hover {
    border-color: $sky;
    color: $sky;
    background: $sky-light;
  }
}

// Patient Notes Card
.patient-note-box {
  padding: 1.25rem;
  background: $sky-light;
  border: 1px solid lighten($sky, 20%);
  border-radius: $radius-sm;
  margin-bottom: 1rem;

  .note-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    color: $sky;
    font-weight: 700;
  }

  .note-content {
    color: $gray-700;
    margin: 0;
    line-height: 1.5;
  }
}

.files-section {
  padding: 1.25rem;
  background: $gray-50;
  border-radius: $radius-sm;

  h4 {
    font-size: 0.875rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 0.75rem;
  }

  .no-files {
    font-size: 0.875rem;
    color: $gray-500;
    margin: 0;
  }
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: $white;
  border: 1px solid $gray-200;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: all $transition;

  &:hover { border-color: $sky; }

  .file-icon {
    width: 40px;
    height: 40px;
    border-radius: $radius-sm;
    display: flex;
    align-items: center;
    justify-content: center;

    &.pdf { background: $danger-light; color: $danger; }
    &.image { background: $sky-light; color: $sky; }
    &.video { background: $purple-light; color: $purple; }
    &.doc { background: $gray-100; color: $gray-600; }
  }

  .file-info {
    flex: 1;

    .file-name {
      font-weight: 600;
      color: $gray-900;
      margin: 0;
      font-size: 0.875rem;
    }

    .file-size {
      font-size: 0.75rem;
      color: $gray-500;
      margin: 0;
    }
  }

  .file-download {
    padding: 0.5rem;
    background: transparent;
    border: none;
    color: $gray-400;
    cursor: pointer;
    &:hover { color: $sky; }
  }
}

// Notes Card
.notes-card {
  .edit-btn {
    padding: 0.5rem;
    background: transparent;
    border: 1px solid $gray-200;
    border-radius: $radius-sm;
    color: $gray-400;
    cursor: pointer;
    &:hover { border-color: $sky; color: $sky; }
  }
}

.private-notes-box, .instructions-box {
  border-radius: $radius-sm;
  margin-bottom: 1rem;

  &:last-child { margin-bottom: 0; }
}

.private-notes-box {
  padding: 1.25rem;
  background: $purple-light;
  border: 1px solid lighten($purple, 30%);

  .notes-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    color: $purple;
    font-weight: 600;

    .private-badge {
      margin-left: auto;
      padding: 0.25rem 0.75rem;
      background: $purple;
      color: $white;
      border-radius: 50px;
      font-size: 0.75rem;
    }
  }

  .notes-content {
    background: $white;
    border-radius: $radius-sm;
    padding: 1rem;

    p { color: $gray-700; margin: 0; line-height: 1.5; }
  }
}

.empty-notes {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  color: $gray-400;

  p { margin: 0.75rem 0; color: $gray-500; }

  .add-note-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: $sky;
    color: $white;
    border: none;
    border-radius: $radius-sm;
    font-weight: 600;
    cursor: pointer;
    &:hover { background: $sky-dark; }
  }
}

// Sidebar Cards
.patient-profile-card {
  border: 1px solid lighten($sky, 15%);

  .profile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;

    h3 {
      font-size: 0.875rem;
      font-weight: 700;
      color: $gray-900;
      margin: 0;
    }

    .view-profile-link {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      color: $sky;
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
  }

  .profile-content { text-align: center; }

  .profile-avatar {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    overflow: hidden;
    margin: 0 auto 0.75rem;
    border: 3px solid $sky-light;
    background: $gray-200;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-initials {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
      color: $gray-600;
      background: $gray-100;
    }
  }

  .patient-name {
    font-size: 1rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 0.125rem;
  }

  .patient-meta {
    font-size: 0.8125rem;
    color: $gray-600;
    margin: 0 0 1rem;
  }

  .patient-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    text-align: left;
    margin-bottom: 1rem;
  }

  .stat-box {
    padding: 0.5rem;
    background: $gray-50;
    border-radius: $radius-sm;

    &.bmi {
      background: $success-light;
    }

    .stat-label {
      font-size: 0.6875rem;
      color: $gray-500;
      margin: 0 0 0.125rem;
    }

    .stat-value {
      font-size: 0.75rem;
      font-weight: 600;
      color: $gray-900;
      margin: 0;
    }
  }

  .bmi-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.125rem;
    padding: 0.125rem 0.375rem;
    border-radius: 50px;
    font-size: 0.6875rem;
    font-weight: 600;

    &.normal { background: $success; color: $white; }
    &.warning { background: $warning; color: $white; }
    &.danger { background: $danger; color: $white; }
  }

  .profile-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    width: 100%;
    padding: 0.5rem;
    background: $sky;
    color: $white;
    border-radius: $radius-sm;
    font-size: 0.8125rem;
    font-weight: 600;
    text-decoration: none;
    transition: background $transition;
    &:hover { background: $sky-dark; }
    svg { transform: scale(0.85); }
  }
}

// Health Score Card
.health-score-card {
  background: $success-light;
  border: 1px solid lighten($success, 30%);

  h3 {
    font-size: 0.875rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 0.75rem;
  }
}

.score-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.score-item {
  padding: 0.75rem;
  background: $white;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: all $transition;

  &:hover { box-shadow: $shadow; }

  .score-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.375rem;

    .score-name {
      font-size: 0.75rem;
      font-weight: 600;
      color: $gray-700;
    }
  }

  .score-badge {
    padding: 0.125rem 0.375rem;
    border-radius: 50px;
    font-size: 0.6875rem;
    font-weight: 600;

    &.score-excellent { background: $success; color: $white; }
    &.score-good { background: lighten($success, 10%); color: $white; }
    &.score-fair { background: $warning; color: $white; }
    &.score-poor { background: $danger; color: $white; }
  }

  .score-bar-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .score-bar {
    flex: 1;
    height: 8px;
    background: $gray-200;
    border-radius: 4px;
    overflow: hidden;

    .score-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
    }
  }

  &.score-excellent .score-fill { background: $success; }
  &.score-good .score-fill { background: lighten($success, 10%); }
  &.score-fair .score-fill { background: $warning; }
  &.score-poor .score-fill { background: $danger; }

  .score-value {
    font-size: 1rem;
    font-weight: 700;
    min-width: 32px;
    text-align: right;
  }

  &.score-excellent .score-value { color: $success; }
  &.score-good .score-value { color: lighten($success, 10%); }
  &.score-fair .score-value { color: $warning; }
  &.score-poor .score-value { color: $danger; }
}

// Vitals Card
.vitals-card {
  h3 {
    font-size: 0.875rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 0.75rem;
  }
}

.vitals-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.vital-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: $radius-sm;

  &.red { background: lighten($danger-light, 3%); .vital-icon { color: $danger; } }
  &.pink { background: #FCE4EC; .vital-icon { color: #E91E63; } }
  &.blue { background: $sky-light; .vital-icon { color: $sky; } }
  &.orange { background: $warning-light; .vital-icon { color: $warning; } }

  .vital-icon svg { transform: scale(0.85); }

  .vital-info {
    flex: 1;

    .vital-name {
      font-weight: 600;
      color: $gray-900;
      font-size: 0.75rem;
      margin: 0;
    }

    .vital-date {
      font-size: 0.6875rem;
      color: $gray-500;
      margin: 0;
    }
  }

  .vital-value {
    font-size: 0.8125rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0;
  }
}

// Checkups Card
.checkups-card {
  h3 {
    font-size: 0.875rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0;
  }

  .count-badge {
    padding: 0.125rem 0.375rem;
    background: $sky;
    color: $white;
    border-radius: 50px;
    font-size: 0.6875rem;
    font-weight: 700;
  }
}

.checkups-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.checkup-item {
  padding: 0.5rem;
  border-radius: $radius-sm;
  border-left: 3px solid;
  cursor: pointer;
  transition: all $transition;

  &:hover { box-shadow: $shadow-sm; }

  &.triage-emergency { background: $danger-light; border-color: $danger; }
  &.triage-urgent { background: lighten($warning-light, 3%); border-color: $warning; }
  &.triage-moderate { background: $sky-light; border-color: $sky; }
  &.triage-low { background: $success-light; border-color: $success; }
  &.triage-unknown { background: $gray-50; border-color: $gray-300; }

  .checkup-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.375rem;
    margin-bottom: 0.375rem;

    .checkup-condition {
      font-weight: 700;
      color: $gray-900;
      font-size: 0.75rem;
      margin: 0;
    }
  }

  .triage-badge {
    padding: 0.0625rem 0.375rem;
    border-radius: 4px;
    font-size: 0.6875rem;
    font-weight: 600;
    white-space: nowrap;

    &.triage-emergency { background: $danger; color: $white; }
    &.triage-urgent { background: $warning; color: $white; }
    &.triage-moderate { background: $sky; color: $white; }
    &.triage-low { background: $success; color: $white; }
  }

  .checkup-date {
    font-size: 0.6875rem;
    color: $gray-600;
    margin: 0 0 0.125rem;
  }

  .checkup-symptoms {
    font-size: 0.6875rem;
    color: $gray-700;
    margin: 0;
  }
}

.empty-checkups {
  padding: 1rem;
  text-align: center;
  color: $gray-500;
  font-size: 0.8125rem;

  p { margin: 0; }
}

.view-all-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.625rem;
  margin-top: 1rem;
  background: $white;
  border: 2px solid $gray-300;
  border-radius: $radius-sm;
  color: $gray-700;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all $transition;
  text-decoration: none;

  &:hover { background: $gray-50; border-color: $gray-400; }
}

// Previous Appointments Card
.prev-appointments-card {
  h3 {
    font-size: 1rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 1rem;
  }
}

.prev-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.prev-item {
  display: block;
  padding: 0.75rem;
  background: $gray-50;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: all $transition;
  text-decoration: none;

  &:hover {
    background: $gray-100;
    transform: translateX(2px);

    .prev-header svg { color: $sky; }
  }

  .prev-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.25rem;

    .prev-date {
      font-weight: 600;
      color: $gray-900;
      font-size: 0.875rem;
      margin: 0;
    }

    .note-count-badge {
      padding: 2px 6px;
      background: #DBEAFE;
      color: #1D4ED8;
      border-radius: 4px;
      font-size: 0.625rem;
      font-weight: 600;
    }

    svg {
      color: $gray-400;
      transition: color $transition;
    }
  }

  .prev-notes {
    font-size: 0.75rem;
    color: $gray-500;
    margin: 0;

    &.empty { font-style: italic; }
  }
}

// Quick Actions Card
.quick-actions-card {
  background: linear-gradient(135deg, $sky-light 0%, lighten($sky-light, 5%) 100%);
  border: 1px solid lighten($sky, 20%);

  h3 {
    font-size: 1rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 1rem;
  }
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1rem;
  background: $white;
  border: 2px solid $gray-300;
  border-radius: $radius-sm;
  color: $gray-700;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: all $transition;

  &:hover {
    background: $gray-50;
    border-color: $gray-400;
  }

  &.primary {
    background: $sky;
    border-color: $sky;
    color: $white;

    &:hover { background: $sky-dark; border-color: $sky-dark; }
  }
}

// Bottom Action Bar
.bottom-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $white;
  border-top: 1px solid $gray-200;
  padding: 1rem 2rem;
  display: flex !important; // Force flex display
  align-items: center;
  justify-content: space-between;
  z-index: 100;
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    left: 256px;
  }

  @media (max-width: 767px) {
    display: none !important; // Hide on mobile
  }
}

.back-btn-bottom {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: $white;
  border: 2px solid $gray-300;
  border-radius: $radius-sm;
  color: $gray-700;
  font-weight: 600;
  text-decoration: none;
  transition: all $transition;

  &:hover { background: $gray-50; border-color: $gray-400; }
}

.action-btns {
  display: flex;
  gap: 0.75rem;
}

// Responsive
@media (max-width: 768px) {
  .appointment-header .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .title-row {
    flex-wrap: wrap;

    h1 { font-size: 1.5rem; }
  }

  .appointment-info-card .info-grid {
    grid-template-columns: 1fr;
  }

  .summary-stats {
    grid-template-columns: 1fr;

    .stat-item.full-width { grid-column: span 1; }
  }

  .bottom-action-bar {
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;

    .back-btn-bottom, .action-btns { width: 100%; }
    .action-btns { flex-direction: column; }
    .action-btn { width: 100%; justify-content: center; }
  }
}

// ========== MOBILE STYLES ==========

// Hide/show helpers - use visibility approach to preserve display types
.mobile-only {
  display: none !important;
}

@media (max-width: 767px) {
  .mobile-only {
    display: block !important;
  }

  .mobile-accordions.mobile-only {
    display: block !important;
  }

  .mobile-patient-card.mobile-only,
  .mobile-bottom-action.mobile-only {
    display: block !important;
  }

  .desktop-only {
    display: none !important;
  }

  .appointment-detail-page {
    padding: 0;
    padding-bottom: 80px; // Account for fixed bottom button
    background: $white !important;
    min-height: 100vh;
  }

  .content-grid {
    display: none !important;
  }
}

// Mobile Patient Card
.mobile-patient-card {
  background: $white;
  border-bottom: 1px solid $gray-200;
  padding: 1rem;
  cursor: pointer;

  .patient-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .patient-avatar-mobile {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    overflow: hidden;
    border: 2px solid $sky-light;
    background: $gray-200;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .avatar-initials-mobile {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    font-weight: 700;
    color: $gray-600;
    background: $gray-100;
  }

  .patient-info-mobile {
    flex: 1;

    h3 {
      font-size: 1rem;
      font-weight: 700;
      color: $gray-900;
      margin: 0 0 0.125rem;
    }

    p {
      font-size: 0.875rem;
      color: $gray-600;
      margin: 0;
    }
  }

  .chevron-icon {
    color: $sky;
  }

  .patient-stats-mobile {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }

  .stat-mobile {
    padding: 0.5rem;
    background: $gray-50;
    border-radius: $radius-sm;
    text-align: center;

    &.bmi { background: lighten($success-light, 2%); }

    .stat-label {
      font-size: 0.6875rem;
      color: $gray-500;
      margin: 0 0 0.125rem;
    }

    .stat-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: $gray-900;
      margin: 0;
    }
  }

  .bmi-badge-mobile {
    display: inline-block;
    font-size: 0.6875rem;
    font-weight: 700;
    padding: 0.125rem 0.375rem;
    border-radius: 50px;

    &.normal { background: $success; color: $white; }
    &.warning { background: $warning; color: $white; }
    &.danger { background: $danger; color: $white; }
  }
}

// Mobile Accordions Container
.mobile-accordions {
  padding: 0;
}

// Mobile Accordion
.mobile-accordion {
  background: $white;
  border-bottom: 1px solid $gray-200;

  &.expanded {
    .accordion-trigger { border-bottom: 1px solid $gray-100; }
  }
}

.accordion-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1rem;
  background: none;
  border: none;
  cursor: pointer;

  h3 {
    font-size: 1rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0;
  }

  svg { color: $gray-400; }

  .count-badge {
    margin-left: auto;
    margin-right: 0.5rem;
    padding: 0.125rem 0.5rem;
    background: $sky;
    color: $white;
    border-radius: 50px;
    font-size: 0.75rem;
    font-weight: 700;
  }

  &.with-icon {
    .trigger-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .trigger-icon {
      width: 40px;
      height: 40px;
      border-radius: $radius-sm;
      display: flex;
      align-items: center;
      justify-content: center;

      &.video { background: $sky; color: $white; }
      &.purple { background: $purple; color: $white; }
    }

    .trigger-sub {
      font-size: 0.75rem;
      color: $gray-500;
      margin: 0;
    }
  }
}

.accordion-body {
  padding: 0 1rem 1rem;
}

// Mobile Info Cards
.mobile-info-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.mobile-info-card {
  padding: 0.75rem;
  border-radius: $radius-sm;

  &.date {
    background: linear-gradient(135deg, $sky-light 0%, lighten($sky-light, 3%) 100%);

    .info-card-header svg { color: $sky; }
    .info-card-sub { color: $sky; font-weight: 600; }
  }

  &.time {
    background: linear-gradient(135deg, $success-light 0%, lighten($success-light, 3%) 100%);

    .info-card-header svg { color: $success; }
  }

  .info-card-header {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-bottom: 0.375rem;

    span {
      font-size: 0.6875rem;
      font-weight: 600;
      color: $gray-700;
      text-transform: uppercase;
    }
  }

  .info-card-value {
    font-size: 0.875rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0;
  }

  .info-card-sub {
    font-size: 0.75rem;
    color: $gray-600;
    margin: 0;
  }
}

.mobile-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.mobile-info-item {
  padding: 0.75rem;
  background: $gray-50;
  border-radius: $radius-sm;

  .label {
    font-size: 0.6875rem;
    font-weight: 600;
    color: $gray-500;
    text-transform: uppercase;
    margin: 0 0 0.25rem;
  }

  .value {
    font-size: 0.8125rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0;

    &.with-icon {
      display: flex;
      align-items: center;
      gap: 0.25rem;

      svg { color: $sky; }
    }
  }
}

.mobile-fee-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem;
  background: linear-gradient(135deg, $success-light 0%, lighten($success-light, 5%) 100%);
  border: 2px solid lighten($success, 25%);
  border-radius: $radius-sm;

  .fee-left {
    .fee-label {
      font-size: 0.75rem;
      color: $gray-600;
      margin: 0 0 0.125rem;
    }

    .fee-amount {
      font-size: 1.25rem;
      font-weight: 700;
      color: $gray-900;
      margin: 0;
    }
  }
}

// Mobile Link Box
.mobile-link-box {
  background: $sky-light;
  border-radius: $radius-sm;
  padding: 0.75rem;
  margin-bottom: 0.75rem;

  .link-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;

    p {
      font-size: 0.75rem;
      font-weight: 600;
      color: $gray-700;
      margin: 0;
    }

    button {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      background: none;
      border: none;
      color: $sky;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }
  }

  .link-content {
    padding: 0.5rem;
    background: $white;
    border-radius: $radius-sm;
    font-family: $font-mono;
    font-size: 0.75rem;
    color: $gray-900;
    word-break: break-all;
  }
}

// Mobile Meeting Stats
.mobile-meeting-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;

  .stat-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    border-radius: $radius-sm;

    &.green { background: lighten($success-light, 2%); }
    &.blue { background: $sky-light; }
    &.purple { background: $purple-light; }

    .stat-name {
      font-size: 0.75rem;
      font-weight: 600;
      color: $gray-700;
    }

    .stat-val {
      font-size: 0.75rem;
      font-weight: 700;
      color: $gray-900;

      &.attendance-both { color: $success; }
      &.attendance-partial { color: $warning; }
      &.attendance-none { color: $danger; }
    }
  }
}

// Mobile Attendance
.mobile-attendance {
  background: $gray-50;
  border-radius: $radius-sm;
  padding: 0.75rem;

  .attendance-title {
    font-size: 0.75rem;
    font-weight: 700;
    color: $gray-700;
    margin: 0 0 0.5rem;
  }

  .attendance-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;

    &.joined svg { color: $success; }
    &:not(.joined) svg { color: $danger; }

    .role {
      flex: 1;
      font-size: 0.75rem;
      font-weight: 600;
      color: $gray-900;
    }

    .time {
      font-size: 0.75rem;
      color: $gray-600;
    }
  }
}

// Mobile Recording Box
.mobile-recording-box {
  background: $purple-light;
  border-radius: $radius-sm;
  padding: 0.75rem;
  margin-bottom: 0.75rem;

  .recording-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .recording-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.75rem;
    border-radius: 50px;
    font-size: 0.75rem;
    font-weight: 600;

    &.available { background: $success; color: $white; }
  }

  .play-btn-mobile {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    background: $sky;
    color: $white;
    border-radius: $radius-sm;
    font-size: 0.75rem;
    font-weight: 600;
    text-decoration: none;
  }

  .password-box {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.75rem;
    background: $warning-light;
    border: 1px solid lighten($warning, 30%);
    border-radius: $radius-sm;

    svg { color: $warning; margin-top: 2px; }

    .pw-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: $gray-900;
      margin: 0;
    }

    .pw-value {
      font-size: 0.75rem;
      color: $gray-700;
      margin: 0.125rem 0 0;

      code {
        font-family: $font-mono;
        font-weight: 700;
        background: rgba($white, 0.5);
        padding: 0.125rem 0.25rem;
        border-radius: 4px;
      }
    }
  }
}

.download-btn-mobile {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: $white;
  border: 2px solid lighten($purple, 35%);
  border-radius: $radius-sm;
  color: $purple;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
}

// Mobile Transcript Processing
.transcript-processing-mobile {
  padding: 1.5rem;
  background: linear-gradient(135deg, $warning-light 0%, lighten($warning-light, 5%) 100%);
  border: 2px solid lighten($warning, 25%);
  border-radius: $radius-sm;
  text-align: center;

  svg { color: $warning; margin-bottom: 0.5rem; }

  .title {
    font-size: 0.875rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 0.25rem;
  }

  .desc {
    font-size: 0.75rem;
    color: $gray-700;
    margin: 0;
  }
}

.transcript-content-mobile {
  p {
    font-size: 0.875rem;
    color: $gray-700;
    line-height: 1.5;
    margin: 0;
  }
}

// Mobile Patient Note
.mobile-patient-note {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: $sky-light;
  border: 1px solid lighten($sky, 20%);
  border-radius: $radius-sm;
  margin-bottom: 0.75rem;

  svg { color: $sky; margin-top: 2px; }

  .note-title {
    font-size: 0.875rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 0.25rem;
  }

  .note-text {
    font-size: 0.875rem;
    color: $gray-700;
    margin: 0;
  }
}

.mobile-files-section {
  background: $gray-50;
  border-radius: $radius-sm;
  padding: 0.75rem;

  .no-files {
    font-size: 0.875rem;
    color: $gray-500;
    margin: 0;
  }
}

// Mobile Clinical Notes List
.mobile-notes-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.mobile-note-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: $purple-light;
  border: 1px solid lighten($purple, 35%);
  border-radius: $radius-sm;
  cursor: pointer;

  .note-icon {
    width: 32px;
    height: 32px;
    background: $white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $purple;
    flex-shrink: 0;
  }

  .note-content {
    flex: 1;
    min-width: 0;
  }

  .note-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.375rem;

    .note-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: $gray-900;
    }

    .private-badge {
      padding: 0.125rem 0.5rem;
      background: $purple;
      color: $white;
      border-radius: 50px;
      font-size: 0.6875rem;
      font-weight: 600;
    }
  }

  .note-text {
    font-size: 0.875rem;
    color: $gray-700;
    margin: 0;
    line-height: 1.4;
  }
}

.empty-notes-text {
  text-align: center;
  color: $gray-500;
  font-size: 0.875rem;
  padding: 1rem 0;
  margin: 0;
}

// Mobile Health Score
.mobile-score-item {
  padding: 0.75rem;
  background: $white;
  border-radius: $radius-sm;
  margin-bottom: 0.75rem;
  border: 1px solid $gray-200;

  &:last-child { margin-bottom: 0; }

  .score-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.375rem;

    .score-name {
      font-size: 0.75rem;
      font-weight: 600;
      color: $gray-700;
    }

    .score-badge {
      padding: 0.125rem 0.375rem;
      border-radius: 50px;
      font-size: 0.6875rem;
      font-weight: 600;

      &.score-excellent { background: $success; color: $white; }
      &.score-good { background: lighten($success, 10%); color: $white; }
      &.score-fair { background: $warning; color: $white; }
      &.score-poor { background: $danger; color: $white; }
    }
  }

  .score-bar-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .score-bar {
    flex: 1;
    height: 8px;
    background: $gray-200;
    border-radius: 4px;
    overflow: hidden;

    .score-fill {
      height: 100%;
      border-radius: 4px;
    }
  }

  &.score-excellent .score-fill { background: $success; }
  &.score-good .score-fill { background: lighten($success, 10%); }
  &.score-fair .score-fill { background: $warning; }
  &.score-poor .score-fill { background: $danger; }

  .score-value {
    font-size: 1rem;
    font-weight: 700;
    min-width: 32px;
    text-align: right;
  }

  &.score-excellent .score-value { color: $success; }
  &.score-good .score-value { color: lighten($success, 10%); }
  &.score-fair .score-value { color: $warning; }
  &.score-poor .score-value { color: $danger; }
}

// Mobile Vitals List
.mobile-vitals-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mobile-vital-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: $radius-sm;

  &.red { background: lighten($danger-light, 3%); svg { color: $danger; } }
  &.pink { background: #FCE4EC; svg { color: #E91E63; } }
  &.blue { background: $sky-light; svg { color: $sky; } }
  &.orange { background: $warning-light; svg { color: $warning; } }

  .vital-info {
    flex: 1;

    .vital-name {
      font-size: 0.75rem;
      font-weight: 600;
      color: $gray-900;
      margin: 0;
    }

    .vital-date {
      font-size: 0.6875rem;
      color: $gray-500;
      margin: 0;
    }
  }

  .vital-value {
    font-size: 0.875rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0;
  }
}

// Mobile Checkups List
.mobile-checkups-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.mobile-checkup-item {
  padding: 0.75rem;
  border-radius: $radius-sm;
  border-left: 3px solid;
  cursor: pointer;

  &.triage-emergency { background: $danger-light; border-color: $danger; }
  &.triage-urgent { background: $warning-light; border-color: $warning; }
  &.triage-moderate { background: $sky-light; border-color: $sky; }
  &.triage-low { background: $success-light; border-color: $success; }
  &.triage-unknown { background: $gray-50; border-color: $gray-300; }

  .checkup-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.25rem;

    .checkup-condition {
      font-size: 0.75rem;
      font-weight: 700;
      color: $gray-900;
      margin: 0;
    }
  }

  .triage-badge {
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.6875rem;
    font-weight: 600;

    &.triage-emergency { background: $danger; color: $white; }
    &.triage-urgent { background: $warning; color: $white; }
    &.triage-moderate { background: $sky; color: $white; }
    &.triage-low { background: $success; color: $white; }
  }

  .checkup-date {
    font-size: 0.6875rem;
    color: $gray-600;
    margin: 0;
  }
}

.empty-checkups-text {
  text-align: center;
  color: $gray-500;
  font-size: 0.875rem;
  padding: 1rem 0;
  margin: 0;
}

.view-all-btn-mobile {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: $white;
  border: 2px solid $gray-300;
  border-radius: $radius-sm;
  color: $gray-700;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
}

// Mobile Previous Appointments
.mobile-prev-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.mobile-prev-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: $gray-50;
  border-radius: $radius-sm;
  cursor: pointer;

  &:hover { background: $gray-100; }

  .prev-content {
    flex: 1;

    .prev-date {
      font-size: 0.875rem;
      font-weight: 600;
      color: $gray-900;
      margin: 0 0 0.125rem;
    }

    .prev-notes {
      font-size: 0.75rem;
      color: $gray-500;
      margin: 0;
    }
  }

  svg { color: $gray-400; }
}

// Mobile Quick Actions
.mobile-quick-actions {
  background: $white;
  padding: 1rem;
  margin-bottom: 1rem;

  h3 {
    font-size: 1rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 0.75rem;
  }
}

.mobile-actions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mobile-action {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1rem;
  background: $white;
  border: 2px solid $gray-300;
  border-radius: $radius-sm;
  color: $gray-700;
  font-weight: 600;
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;

  &:hover { background: $gray-50; }

  &.primary {
    background: $sky;
    border-color: $sky;
    color: $white;

    &:hover { background: $sky-dark; border-color: $sky-dark; }
  }
}

// Mobile Fixed Bottom Action
.mobile-bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $white;
  border-top: 1px solid $gray-200;
  padding: 1rem;
  z-index: 99;
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    display: none;
  }
}

.mobile-followup-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.875rem;
  background: $sky;
  color: $white;
  border: none;
  border-radius: $radius-sm;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;

  &:hover { background: $sky-dark; }
}
</style>
