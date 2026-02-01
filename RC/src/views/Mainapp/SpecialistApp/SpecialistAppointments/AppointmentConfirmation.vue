<template>
  <div class="confirmation-page">
    <!-- Header -->
    <div class="confirmation-header">
      <div class="header-left">
        <div class="success-badge">
          <v-icon name="hi-check" scale="1" />
        </div>
        <div>
          <h2>Booking Confirmed</h2>
          <p>Appointment #{{ appointmentId }}</p>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="confirmation-main">
      <div class="confirmation-container">
        <!-- Success Hero -->
        <section class="success-hero">
          <div class="hero-decorations">
            <div class="decoration-circle top-right"></div>
            <div class="decoration-circle bottom-left"></div>
          </div>

          <div class="hero-content">
            <div class="hero-icon">
              <v-icon name="hi-check" scale="3" />
            </div>

            <h1>Appointment Successfully Booked!</h1>
            <p class="hero-subtitle">All notifications have been sent to the patient</p>

            <div class="hero-summary">
              <div class="summary-item">
                <v-icon name="hi-calendar" scale="1.5" />
                <p class="label">Date</p>
                <p class="value">{{ formatDate(appointmentData.date) }}</p>
              </div>
              <div class="summary-item">
                <v-icon name="hi-clock" scale="1.5" />
                <p class="label">Time</p>
                <p class="value">{{ formatTime(appointmentData.time) }}</p>
              </div>
              <div class="summary-item">
                <v-icon name="hi-user" scale="1.5" />
                <p class="label">Patient</p>
                <p class="value">{{ appointmentData.patientName }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Content Grid -->
        <div class="content-grid">
          <!-- Main Column -->
          <div class="main-column">
            <!-- Confirmation Details -->
            <section class="confirmation-card">
              <div class="card-header">
                <h3>Confirmation Details</h3>
                <span class="confirmed-badge">
                  <v-icon name="hi-check-circle" scale="0.8" />Confirmed
                </span>
              </div>

              <div class="details-row">
                <div class="detail-box blue">
                  <p class="box-label">Appointment ID</p>
                  <p class="box-value mono">#{{ appointmentId }}</p>
                  <p class="box-desc">Reference number for tracking</p>
                </div>
                <div class="detail-box purple">
                  <p class="box-label">Booking Time</p>
                  <p class="box-value">{{ formatDateTime(bookingTime) }}</p>
                  <p class="box-desc">Confirmation timestamp</p>
                </div>
              </div>

              <div class="systems-activated">
                <div class="systems-header">
                  <div class="systems-icon">
                    <v-icon name="hi-bell" scale="1.2" />
                  </div>
                  <div>
                    <h4>All Systems Activated</h4>
                    <p>The following actions have been completed automatically:</p>
                  </div>
                </div>
                <div class="systems-grid">
                  <div class="system-item">
                    <v-icon name="hi-check" scale="0.8" />
                    <span>Calendar event created</span>
                  </div>
                  <div class="system-item">
                    <v-icon name="hi-check" scale="0.8" />
                    <span>Meeting link generated</span>
                  </div>
                  <div class="system-item">
                    <v-icon name="hi-check" scale="0.8" />
                    <span>Patient record updated</span>
                  </div>
                  <div class="system-item">
                    <v-icon name="hi-check" scale="0.8" />
                    <span>Reminders scheduled</span>
                  </div>
                  <div class="system-item">
                    <v-icon name="hi-check" scale="0.8" />
                    <span>Email notifications sent</span>
                  </div>
                  <div class="system-item">
                    <v-icon name="hi-check" scale="0.8" />
                    <span>SMS confirmations sent</span>
                  </div>
                </div>
              </div>
            </section>

            <!-- Patient Summary -->
            <section class="confirmation-card">
              <h3>
                <v-icon name="hi-user-check" scale="1" class="success" />
                Patient Information
              </h3>

              <div class="patient-summary">
                <div class="patient-avatar">
                  <img v-if="appointmentData.patientAvatar" :src="appointmentData.patientAvatar" :alt="appointmentData.patientName" />
                  <span v-else class="avatar-initials">{{ getInitials(appointmentData.patientName) }}</span>
                </div>
                <div class="patient-info">
                  <h4>{{ appointmentData.patientName }}</h4>
                  <p class="patient-meta">{{ appointmentData.patientAge || 'Age N/A' }} • {{ capitalizeFirst(appointmentData.patientGender) || 'Gender N/A' }} • {{ appointmentData.isNewPatient ? 'New Patient' : 'Existing Patient' }}</p>
                  <div class="patient-badges">
                    <span v-if="appointmentData.isNewPatient" class="badge yellow">
                      <v-icon name="hi-user-add" scale="0.7" />Account Invitation Sent
                    </span>
                    <span class="badge green">
                      <v-icon name="hi-check-circle" scale="0.7" />Consent Verified
                    </span>
                  </div>
                </div>
              </div>

              <div class="contact-grid">
                <div class="contact-item">
                  <div class="contact-icon blue">
                    <v-icon name="hi-mail" scale="0.9" />
                  </div>
                  <div>
                    <p class="contact-label">Email</p>
                    <p class="contact-value">{{ appointmentData.patientEmail }}</p>
                  </div>
                </div>
                <div class="contact-item">
                  <div class="contact-icon green">
                    <v-icon name="hi-phone" scale="0.9" />
                  </div>
                  <div>
                    <p class="contact-label">Phone</p>
                    <p class="contact-value">{{ appointmentData.patientPhone }}</p>
                  </div>
                </div>
              </div>
            </section>

            <!-- Appointment Details -->
            <section class="confirmation-card">
              <h3>
                <v-icon name="hi-clipboard-list" scale="1" />
                Appointment Details
              </h3>

              <div class="appointment-type-row">
                <div>
                  <p class="type-label">Appointment Type</p>
                  <p class="type-value">{{ appointmentData.appointmentType }}</p>
                </div>
                <span class="type-badge">{{ appointmentData.category || 'Medical Consultation' }}</span>
              </div>

              <div class="schedule-grid">
                <div class="schedule-item blue">
                  <div class="schedule-icon">
                    <v-icon name="hi-calendar" scale="1" />
                  </div>
                  <p class="schedule-label">Date</p>
                  <p class="schedule-day">{{ formatDayName(appointmentData.date) }}</p>
                  <p class="schedule-full">{{ formatDate(appointmentData.date) }}</p>
                </div>
                <div class="schedule-item green">
                  <div class="schedule-icon">
                    <v-icon name="hi-clock" scale="1" />
                  </div>
                  <p class="schedule-label">Time</p>
                  <p class="schedule-time">{{ formatTime(appointmentData.time) }}</p>
                  <p class="schedule-tz">{{ appointmentData.timezone || 'WAT (GMT+1)' }}</p>
                </div>
                <div class="schedule-item purple">
                  <div class="schedule-icon">
                    <v-icon name="bi-hourglass-split" scale="1" />
                  </div>
                  <p class="schedule-label">Duration</p>
                  <p class="schedule-duration">{{ appointmentData.duration }} min</p>
                  <p class="schedule-end">Ends {{ calculateEndTime(appointmentData.time, appointmentData.duration) }}</p>
                </div>
              </div>

              <div v-if="appointmentData.channel === 'zoom'" class="channel-row">
                <div class="channel-info">
                  <div class="channel-icon">
                    <v-icon name="hi-video-camera" scale="1.2" />
                  </div>
                  <div>
                    <p class="channel-label">Consultation Channel</p>
                    <p class="channel-value">Video Call</p>
                  </div>
                </div>
                <button class="get-link-btn" @click="copyMeetingLink">
                  <v-icon name="hi-link" scale="0.9" />Get Link
                </button>
              </div>
            </section>

            <!-- Meeting Access (if video) -->
            <section v-if="appointmentData.channel === 'zoom' || appointmentData.channel === 'video'" class="meeting-access-card">
              <div class="meeting-header">
                <div class="meeting-icon">
                  <v-icon name="hi-video-camera" scale="1.5" />
                </div>
                <div>
                  <h3>{{ appointmentData.meetingLink ? 'Video Meeting Link Ready' : 'Video Meeting Scheduled' }}</h3>
                  <p>{{ appointmentData.meetingLink ? 'The meeting link has been generated and shared with the patient' : 'Meeting link will be available shortly and sent to the patient' }}</p>
                </div>
              </div>

              <div v-if="appointmentData.meetingLink" class="meeting-url-box">
                <div class="url-header">
                  <p>Meeting URL</p>
                  <button @click="copyMeetingLink">
                    <v-icon name="hi-clipboard-copy" scale="0.8" />Copy Link
                  </button>
                </div>
                <div class="url-value">{{ appointmentData.meetingLink }}</div>
              </div>
              <div v-else class="meeting-pending-box">
                <v-icon name="hi-clock" scale="1" />
                <p>Meeting link is being generated. It will be emailed to both you and the patient once ready.</p>
              </div>

              <div class="meeting-actions">
                <button v-if="appointmentData.meetingLink" class="open-meeting-btn" @click="openMeeting">
                  <v-icon name="hi-external-link" scale="0.9" />Open Meeting
                </button>
                <button class="resend-link-btn" @click="resendLink">
                  <v-icon name="hi-paper-airplane" scale="0.9" />Resend Link
                </button>
              </div>
            </section>

            <!-- Payment Summary -->
            <section class="confirmation-card">
              <h3>
                <v-icon name="hi-currency-dollar" scale="1" class="success" />
                Payment Summary
              </h3>

              <div class="payment-hero">
                <div class="payment-info">
                  <p class="payment-label">Consultation Fee</p>
                  <p class="payment-amount">{{ formatCurrency(appointmentData.consultationFee) }}</p>
                </div>
                <div class="payment-check">
                  <v-icon name="hi-check" scale="1.5" />
                </div>
              </div>
              <p class="payment-note">{{ getPaymentStatusText() }}</p>

              <div class="payment-breakdown">
                <div class="breakdown-row">
                  <span>Consultation Fee</span>
                  <span>{{ formatCurrency(appointmentData.consultationFee) }}</span>
                </div>
                <div class="breakdown-row">
                  <span>Platform Fee</span>
                  <span>{{ formatCurrency(appointmentData.platformFee) }}</span>
                </div>
                <div class="breakdown-row total">
                  <span>Total Amount</span>
                  <span class="total-value">{{ formatCurrency(appointmentData.totalAmount) }}</span>
                </div>
                <div class="breakdown-row earnings">
                  <span>Your Earnings</span>
                  <span class="earnings-value">{{ formatCurrency(appointmentData.consultationFee) }}</span>
                </div>
              </div>

              <div v-if="appointmentData.paymentSource === 'patient_wallet'" class="payment-status-box success">
                <v-icon name="hi-check-circle" scale="1" />
                <div>
                  <p class="status-title">Payment Completed</p>
                  <p class="status-desc">Patient wallet was charged successfully.</p>
                </div>
              </div>
              <div v-else-if="appointmentData.paymentSource === 'specialist_wallet'" class="payment-status-box info">
                <v-icon name="hi-gift" scale="1" />
                <div>
                  <p class="status-title">Complimentary Appointment</p>
                  <p class="status-desc">This appointment was covered from your wallet.</p>
                </div>
              </div>
            </section>
          </div>

          <!-- Sidebar -->
          <div class="sidebar-column">
            <!-- Quick Actions -->
            <section class="sidebar-card quick-actions-card">
              <h3>
                <v-icon name="hi-lightning-bolt" scale="0.9" />Quick Actions
              </h3>

              <div class="quick-actions-list">
                <button class="action-btn primary" @click="viewAppointment">
                  <span><v-icon name="hi-eye" scale="0.9" />View Full Details</span>
                  <v-icon name="hi-chevron-right" scale="0.8" />
                </button>
                <button class="action-btn">
                  <span><v-icon name="hi-calendar" scale="0.9" />Add to Calendar</span>
                  <v-icon name="hi-chevron-right" scale="0.8" />
                </button>
                <button class="action-btn" @click="printConfirmation">
                  <span><v-icon name="hi-printer" scale="0.9" />Print Confirmation</span>
                  <v-icon name="hi-chevron-right" scale="0.8" />
                </button>
                <button class="action-btn" @click="downloadConfirmation">
                  <span><v-icon name="hi-download" scale="0.9" />Download PDF</span>
                  <v-icon name="hi-chevron-right" scale="0.8" />
                </button>
                <button class="action-btn" @click="shareDetails">
                  <span><v-icon name="hi-share" scale="0.9" />Share Details</span>
                  <v-icon name="hi-chevron-right" scale="0.8" />
                </button>
              </div>

              <button class="book-another-btn" @click="bookAnother">
                <v-icon name="hi-plus" scale="0.9" />Book Another Appointment
              </button>
            </section>

            <!-- Notifications Sent -->
            <section class="sidebar-card">
              <h3>
                <v-icon name="hi-bell" scale="0.9" class="success" />Notifications Sent
              </h3>

              <div class="notifications-list">
                <div class="notification-item">
                  <div class="notif-check">
                    <v-icon name="hi-check" scale="0.6" />
                  </div>
                  <div>
                    <p class="notif-title">Email Confirmation</p>
                    <p class="notif-to">Sent to {{ appointmentData.patientEmail }}</p>
                    <p class="notif-time">{{ formatTime(bookingTime) }} • Delivered</p>
                  </div>
                </div>
                <div class="notification-item">
                  <div class="notif-check">
                    <v-icon name="hi-check" scale="0.6" />
                  </div>
                  <div>
                    <p class="notif-title">SMS Confirmation</p>
                    <p class="notif-to">Sent to {{ appointmentData.patientPhone }}</p>
                    <p class="notif-time">{{ formatTime(bookingTime) }} • Delivered</p>
                  </div>
                </div>
                <div class="notification-item">
                  <div class="notif-check">
                    <v-icon name="hi-check" scale="0.6" />
                  </div>
                  <div>
                    <p class="notif-title">Calendar Invite</p>
                    <p class="notif-to">iCal attachment included</p>
                    <p class="notif-time">{{ formatTime(bookingTime) }} • Delivered</p>
                  </div>
                </div>
                <div v-if="appointmentData.isNewPatient" class="notification-item">
                  <div class="notif-check">
                    <v-icon name="hi-check" scale="0.6" />
                  </div>
                  <div>
                    <p class="notif-title">Account Invitation</p>
                    <p class="notif-to">Portal access link sent</p>
                    <p class="notif-time">{{ formatTime(bookingTime) }} • Delivered</p>
                  </div>
                </div>
              </div>
            </section>

            <!-- Scheduled Reminders -->
            <section class="sidebar-card">
              <h3>
                <v-icon name="hi-clock" scale="0.9" class="warning" />Scheduled Reminders
              </h3>

              <div class="reminders-list">
                <div class="reminder-item">
                  <div class="reminder-header">
                    <p class="reminder-title">24-Hour Reminder</p>
                    <span class="reminder-badge">Scheduled</span>
                  </div>
                  <p class="reminder-date">{{ calculateReminderDate(appointmentData.date, 24) }}</p>
                  <p class="reminder-channels">Email + SMS notification</p>
                </div>
                <div class="reminder-item">
                  <div class="reminder-header">
                    <p class="reminder-title">1-Hour Reminder</p>
                    <span class="reminder-badge">Scheduled</span>
                  </div>
                  <p class="reminder-date">{{ calculateReminderDate(appointmentData.date, 1) }}</p>
                  <p class="reminder-channels">Email + SMS with join link</p>
                </div>
              </div>
            </section>

            <!-- Next Steps -->
            <section class="sidebar-card next-steps-card">
              <h3>
                <v-icon name="hi-clipboard-list" scale="0.9" />Next Steps
              </h3>

              <div class="steps-list">
                <div class="step-item">
                  <div class="step-number">1</div>
                  <div>
                    <p class="step-title">Review Patient History</p>
                    <p class="step-desc">Check medical records before appointment</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">2</div>
                  <div>
                    <p class="step-title">Prepare Clinical Notes</p>
                    <p class="step-desc">Have template ready for consultation</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">3</div>
                  <div>
                    <p class="step-title">Test Video Connection</p>
                    <p class="step-desc">15 minutes before scheduled time</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">4</div>
                  <div>
                    <p class="step-title">Join Meeting</p>
                    <p class="step-desc">Be ready 5 minutes early</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer Actions -->
    <footer class="confirmation-footer">
      <div class="footer-content">
        <button class="back-btn" @click="backToDashboard">
          <v-icon name="hi-arrow-left" scale="0.9" />Back to Dashboard
        </button>
        <div class="footer-right">
          <button class="view-all-btn" @click="viewAllAppointments">
            <v-icon name="hi-calendar" scale="0.9" />View All Appointments
          </button>
          <button class="book-another-btn" @click="bookAnother">
            <v-icon name="hi-plus" scale="0.9" />Book Another
          </button>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'vue-toast-notification';

const router = useRouter();
const route = useRoute();
const toast = useToast();

// Get appointment data from route query/state
const appointmentId = ref(route.query.id || 'APT-2026-0130');
const bookingTime = ref(new Date());

const appointmentData = ref({
  date: route.query.date || new Date().toISOString().split('T')[0],
  time: route.query.time || '09:30',
  duration: parseInt(route.query.duration) || 30,
  patientName: route.query.patientName || 'Patient',
  patientEmail: route.query.patientEmail || 'patient@email.com',
  patientPhone: route.query.patientPhone || '+234 000 000 0000',
  patientAvatar: route.query.patientAvatar || '',
  patientAge: route.query.patientAge || '',
  patientGender: route.query.patientGender || '',
  isNewPatient: route.query.isNewPatient === 'true',
  appointmentType: route.query.appointmentType || 'Consultation',
  category: route.query.category || 'Medical Consultation',
  channel: route.query.channel || 'zoom',
  timezone: route.query.timezone || 'WAT (GMT+1)',
  consultationFee: parseFloat(route.query.consultationFee) || 0,
  platformFee: parseFloat(route.query.platformFee) || 500,
  totalAmount: parseFloat(route.query.totalAmount) || 0,
  paymentSource: route.query.paymentSource || 'patient_wallet',
  meetingLink: route.query.meetingLink || '',
});

// Format functions
function formatDate(dateStr) {
  if (!dateStr) return 'Not set';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDayName(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function formatTime(timeOrDate) {
  if (!timeOrDate) return '';
  if (typeof timeOrDate === 'string' && timeOrDate.includes(':')) {
    const [hours, minutes] = timeOrDate.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }
  if (timeOrDate instanceof Date) {
    return timeOrDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  return timeOrDate;
}

function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function calculateEndTime(timeStr, duration) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  const ampm = endHours >= 12 ? 'PM' : 'AM';
  const displayHour = endHours % 12 || 12;
  return `${displayHour}:${String(endMinutes).padStart(2, '0')} ${ampm}`;
}

function calculateReminderDate(dateStr, hoursBefore) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  date.setHours(date.getHours() - hoursBefore);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getPaymentStatusText() {
  if (appointmentData.value.paymentSource === 'patient_wallet') {
    return 'Patient wallet was charged successfully';
  } else if (appointmentData.value.paymentSource === 'specialist_wallet') {
    return 'Covered from your wallet (complimentary)';
  }
  return 'Payment link sent via email and SMS';
}

// Actions
function viewAppointment() {
  router.push({ name: 'SpecialistAppointmentDetail', params: { id: appointmentId.value } });
}

function backToDashboard() {
  router.push({ name: 'SpecialistAppointmentsDashboard' });
}

function viewAllAppointments() {
  router.push({ name: 'SpecialistAppointmentsDashboard' });
}

function bookAnother() {
  // Clear any existing draft to ensure fresh start
  localStorage.removeItem('specialist_appointment_draft');
  // Navigate with fresh=true query param to signal a new booking
  router.push({ name: 'SpecialistAppointmentsCreate', query: { fresh: 'true' } });
}

function copyMeetingLink() {
  if (appointmentData.value.meetingLink) {
    navigator.clipboard.writeText(appointmentData.value.meetingLink).then(() => {
      toast.success('Meeting link copied to clipboard');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  } else {
    toast.warning('Meeting link is not yet available. Please check back shortly or refresh the page.');
  }
}

function openMeeting() {
  if (appointmentData.value.meetingLink) {
    window.open(appointmentData.value.meetingLink, '_blank');
  } else {
    toast.warning('Meeting link is not yet available. Please check back shortly.');
  }
}

function resendLink() {
  toast.success('Meeting link resent to patient');
}

async function shareDetails() {
  const shareText = `Appointment Confirmation - #${appointmentId.value}\n\nPatient: ${appointmentData.value.patientName}\nDate: ${formatDate(appointmentData.value.date)}\nTime: ${formatTime(appointmentData.value.time)}\nDuration: ${appointmentData.value.duration} minutes\nChannel: ${appointmentData.value.channel}\n\nBooked via Rapid Capsule`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Appointment Confirmation - #${appointmentId.value}`,
        text: shareText,
        url: window.location.href
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        copyToClipboard(shareText);
      }
    }
  } else {
    copyToClipboard(shareText);
  }
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success('Appointment details copied to clipboard');
  }).catch(() => {
    toast.error('Failed to copy details');
  });
}

function printConfirmation() {
  // Set print date for the footer
  const mainColumn = document.querySelector('.main-column');
  if (mainColumn) {
    mainColumn.setAttribute('data-print-date', new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }));
  }

  // Trigger print dialog
  window.print();
}

async function downloadConfirmation() {
  toast.info('Preparing PDF download...');

  try {
    // Dynamic import for html2pdf
    const html2pdf = (await import('html2pdf.js')).default;

    const element = document.querySelector('.confirmation-container');
    if (!element) {
      toast.error('Unable to generate PDF');
      return;
    }

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Appointment_Confirmation_${appointmentId.value}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    await html2pdf().set(opt).from(element).save();
    toast.success('PDF downloaded successfully!');
  } catch (error) {
    console.error('PDF generation error:', error);
    // Fallback to print if html2pdf fails
    toast.info('Opening print dialog as fallback...');
    printConfirmation();
  }
}
</script>

<style scoped lang="scss">
@import '../SpecialistAppointments/styles/sa-variables';

$success: #10B981;
$warning: #F59E0B;
$danger: #EF4444;
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

.confirmation-page {
  min-height: 100vh;
  background: $gray-50;
}

.confirmation-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  border-bottom: 1px solid $gray-200;
  padding: 1rem 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .success-badge {
    width: 2.5rem;
    height: 2.5rem;
    background: $success;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    svg { color: white; }
  }

  h2 {
    font-size: 1.125rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0;
  }

  p {
    font-size: 0.875rem;
    color: $gray-600;
    margin: 0;
  }
}

.confirmation-main {
  padding: 2rem;
  padding-bottom: 6rem;
}

.confirmation-container {
  max-width: 1400px;
  margin: 0 auto;
}

// Success Hero
.success-hero {
  background: linear-gradient(135deg, $success, darken($success, 10%));
  border-radius: 1rem;
  padding: 3rem;
  color: white;
  text-align: center;
  position: relative;
  overflow: hidden;
  margin-bottom: 2rem;

  .hero-decorations {
    .decoration-circle {
      position: absolute;
      background: rgba(white, 0.1);
      border-radius: 50%;

      &.top-right {
        width: 16rem;
        height: 16rem;
        top: -8rem;
        right: -8rem;
      }

      &.bottom-left {
        width: 12rem;
        height: 12rem;
        bottom: -6rem;
        left: -6rem;
      }
    }
  }

  .hero-content {
    position: relative;
    z-index: 1;
  }

  .hero-icon {
    width: 6rem;
    height: 6rem;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);

    svg { color: $success; }
  }

  h1 {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
  }

  .hero-subtitle {
    font-size: 1.125rem;
    opacity: 0.9;
    margin-bottom: 2rem;
  }

  .hero-summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    max-width: 48rem;
    margin: 0 auto;

    .summary-item {
      background: rgba(white, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 0.75rem;
      padding: 1rem;

      svg {
        margin-bottom: 0.5rem;
      }

      .label {
        font-size: 0.875rem;
        opacity: 0.8;
        margin-bottom: 0.25rem;
      }

      .value {
        font-size: 1.125rem;
        font-weight: 700;
      }
    }
  }
}

// Content Grid
.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

.main-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sidebar-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

// Cards
.confirmation-card,
.sidebar-card {
  background: white;
  border: 1px solid $gray-200;
  border-radius: 0.75rem;
  padding: 1.5rem;

  h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.125rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 1.5rem;

    svg {
      color: $sa-sky;

      &.success { color: $success; }
      &.warning { color: $warning; }
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h3 {
    margin: 0;
  }
}

.confirmed-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: $success;
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
}

// Detail boxes
.details-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.detail-box {
  padding: 1rem;
  border-radius: 0.75rem;

  &.blue { background: rgba($sa-sky, 0.1); }
  &.purple { background: rgba(#7C3AED, 0.1); }

  .box-label {
    font-size: 0.6875rem;
    font-weight: 700;
    color: $gray-500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }

  .box-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: $gray-900;

    &.mono { font-family: monospace; }
  }

  .box-desc {
    font-size: 0.8125rem;
    color: $gray-600;
    margin-top: 0.5rem;
  }
}

// Systems activated
.systems-activated {
  background: linear-gradient(135deg, rgba($success, 0.05), rgba($success, 0.1));
  border: 2px solid $success;
  border-radius: 0.75rem;
  padding: 1.25rem;

  .systems-header {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;

    .systems-icon {
      width: 3rem;
      height: 3rem;
      background: $success;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;

      svg { color: white; }
    }

    h4 {
      font-size: 1rem;
      font-weight: 700;
      color: $gray-900;
      margin: 0 0 0.25rem;
    }

    p {
      font-size: 0.875rem;
      color: $gray-700;
      margin: 0;
    }
  }

  .systems-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .system-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: $gray-900;

    svg { color: $success; }
  }
}

// Patient Summary
.patient-summary {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  .patient-avatar {
    width: 5rem;
    height: 5rem;
    border-radius: 50%;
    overflow: hidden;
    border: 4px solid rgba($success, 0.2);
    flex-shrink: 0;

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
      background: $sa-sky;
      color: white;
      font-size: 1.5rem;
      font-weight: 700;
    }
  }

  .patient-info {
    h4 {
      font-size: 1.5rem;
      font-weight: 700;
      color: $gray-900;
      margin: 0 0 0.25rem;
    }

    .patient-meta {
      font-size: 0.875rem;
      color: $gray-600;
      margin-bottom: 0.75rem;
    }

    .patient-badges {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.6875rem;
      font-weight: 700;

      &.yellow {
        background: rgba($warning, 0.1);
        color: darken($warning, 10%);
      }

      &.green {
        background: rgba($success, 0.1);
        color: $success;
      }
    }
  }
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: $gray-50;
  border-radius: 0.5rem;

  .contact-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;

    &.blue {
      background: rgba($sa-sky, 0.1);
      svg { color: $sa-sky; }
    }

    &.green {
      background: rgba($success, 0.1);
      svg { color: $success; }
    }
  }

  .contact-label {
    font-size: 0.6875rem;
    color: $gray-500;
    margin-bottom: 0.125rem;
  }

  .contact-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: $gray-900;
  }
}

// Appointment Details
.appointment-type-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: $gray-50;
  border-radius: 0.5rem;
  margin-bottom: 1rem;

  .type-label {
    font-size: 0.875rem;
    color: $gray-500;
    margin-bottom: 0.25rem;
  }

  .type-value {
    font-size: 1rem;
    font-weight: 700;
    color: $gray-900;
  }

  .type-badge {
    background: rgba($sa-sky, 0.1);
    color: $sa-sky;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 700;
  }
}

.schedule-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.schedule-item {
  padding: 1rem;
  border-radius: 0.5rem;

  &.blue { background: linear-gradient(135deg, rgba($sa-sky, 0.05), rgba($sa-sky, 0.1)); }
  &.green { background: linear-gradient(135deg, rgba($success, 0.05), rgba($success, 0.1)); }
  &.purple { background: linear-gradient(135deg, rgba(#7C3AED, 0.05), rgba(#7C3AED, 0.1)); }

  .schedule-icon {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;

    svg {
      color: $sa-sky;
    }
  }

  .schedule-label {
    font-size: 0.6875rem;
    font-weight: 700;
    color: $gray-700;
    text-transform: uppercase;
    margin-bottom: 0.25rem;
  }

  .schedule-day,
  .schedule-time,
  .schedule-duration {
    font-size: 1.25rem;
    font-weight: 700;
    color: $gray-900;
  }

  .schedule-full,
  .schedule-tz,
  .schedule-end {
    font-size: 0.75rem;
    color: $gray-600;
  }
}

.channel-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, rgba($sa-sky, 0.05), rgba($sa-sky, 0.1));
  border: 1px solid rgba($sa-sky, 0.2);
  border-radius: 0.5rem;

  .channel-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .channel-icon {
      width: 3rem;
      height: 3rem;
      background: $sa-sky;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;

      svg { color: white; }
    }

    .channel-label {
      font-size: 0.75rem;
      color: $gray-600;
    }

    .channel-value {
      font-size: 1rem;
      font-weight: 700;
      color: $gray-900;
    }
  }

  .get-link-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: $sa-sky;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;

    &:hover { background: darken($sa-sky, 5%); }
  }
}

// Meeting Access Card
.meeting-access-card {
  background: linear-gradient(135deg, rgba($sa-sky, 0.05), rgba(#6366F1, 0.05));
  border: 2px solid $sa-sky;
  border-radius: 0.75rem;
  padding: 1.5rem;

  .meeting-header {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;

    .meeting-icon {
      width: 3.5rem;
      height: 3.5rem;
      background: $sa-sky;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;

      svg { color: white; }
    }

    h3 {
      font-size: 1.125rem;
      font-weight: 700;
      color: $gray-900;
      margin: 0 0 0.25rem;
    }

    p {
      font-size: 0.875rem;
      color: $gray-700;
      margin: 0;
    }
  }

  .meeting-url-box {
    background: white;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;

    .url-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;

      p {
        font-size: 0.75rem;
        font-weight: 600;
        color: $gray-700;
        margin: 0;
      }

      button {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        background: none;
        border: none;
        color: $sa-sky;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;

        &:hover { color: darken($sa-sky, 10%); }
      }
    }

    .url-value {
      background: $gray-50;
      border-radius: 0.375rem;
      padding: 0.75rem;
      font-family: monospace;
      font-size: 0.8125rem;
      color: $gray-900;
      word-break: break-all;
    }
  }

  .meeting-pending-box {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    background: #FEF3C7;
    border: 1px solid #FCD34D;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;

    svg {
      flex-shrink: 0;
      color: #D97706;
    }

    p {
      font-size: 0.8125rem;
      color: #92400E;
      margin: 0;
      line-height: 1.4;
    }
  }

  .meeting-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;

    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
    }

    .open-meeting-btn {
      background: $sa-sky;
      color: white;
      border: none;

      &:hover { background: darken($sa-sky, 5%); }
    }

    .resend-link-btn {
      background: white;
      color: $sa-sky;
      border: 2px solid $sa-sky;

      &:hover { background: rgba($sa-sky, 0.05); }
    }
  }
}

// Payment Summary
.payment-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, rgba($success, 0.05), rgba($success, 0.1));
  border: 2px solid $success;
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-bottom: 0.5rem;

  .payment-info {
    .payment-label {
      font-size: 0.875rem;
      color: $gray-600;
      margin-bottom: 0.25rem;
    }

    .payment-amount {
      font-size: 2.5rem;
      font-weight: 700;
      color: $gray-900;
    }
  }

  .payment-check {
    width: 4rem;
    height: 4rem;
    background: $success;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    svg { color: white; }
  }
}

.payment-note {
  font-size: 0.875rem;
  color: $gray-700;
  margin-bottom: 1rem;
}

.payment-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;

  .breakdown-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: $gray-50;
    border-radius: 0.5rem;

    span:first-child { color: $gray-700; }
    span:last-child {
      font-weight: 600;
      color: $gray-900;
    }

    &.total {
      background: rgba($sa-sky, 0.1);
      border-top: 2px solid $sa-sky;

      .total-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: $success;
      }
    }

    &.earnings {
      background: rgba($success, 0.1);

      .earnings-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: $sa-sky;
      }
    }
  }
}

.payment-status-box {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;

  &.success {
    background: rgba($success, 0.1);
    border: 1px solid rgba($success, 0.2);

    svg { color: $success; }
  }

  &.info {
    background: rgba($sa-sky, 0.1);
    border: 1px solid rgba($sa-sky, 0.2);

    svg { color: $sa-sky; }
  }

  .status-title {
    font-size: 0.875rem;
    font-weight: 700;
    color: $gray-900;
    margin-bottom: 0.25rem;
  }

  .status-desc {
    font-size: 0.8125rem;
    color: $gray-700;
  }
}

// Sidebar Cards
.quick-actions-card {
  border: 2px solid $sa-sky;

  .quick-actions-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .action-btn {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 0.75rem 1rem;
    background: white;
    border: 2px solid $gray-300;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: $gray-700;
    cursor: pointer;
    text-align: left;

    span {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    &:hover {
      background: $gray-50;
    }

    &.primary {
      background: $sa-sky;
      border-color: $sa-sky;
      color: white;

      &:hover { background: darken($sa-sky, 5%); }
    }
  }

  .book-another-btn {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: $success;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;

    &:hover { background: darken($success, 5%); }
  }
}

// Notifications List
.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.notification-item {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba($success, 0.05);
  border: 1px solid rgba($success, 0.2);
  border-radius: 0.5rem;

  .notif-check {
    width: 2rem;
    height: 2rem;
    background: $success;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    svg { color: white; }
  }

  .notif-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: $gray-900;
    margin-bottom: 0.125rem;
  }

  .notif-to {
    font-size: 0.6875rem;
    color: $gray-600;
  }

  .notif-time {
    font-size: 0.6875rem;
    color: $gray-500;
    margin-top: 0.25rem;
  }
}

// Reminders List
.reminders-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.reminder-item {
  padding: 0.75rem;
  background: rgba($warning, 0.1);
  border: 1px solid rgba($warning, 0.2);
  border-radius: 0.5rem;

  .reminder-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.25rem;

    .reminder-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: $gray-900;
    }

    .reminder-badge {
      background: $warning;
      color: white;
      padding: 0.125rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.6875rem;
      font-weight: 700;
    }
  }

  .reminder-date {
    font-size: 0.6875rem;
    color: $gray-600;
  }

  .reminder-channels {
    font-size: 0.6875rem;
    color: $gray-500;
    margin-top: 0.25rem;
  }
}

// Next Steps
.next-steps-card {
  background: linear-gradient(135deg, rgba($sa-sky, 0.05), rgba(#6366F1, 0.05));
  border-color: rgba($sa-sky, 0.2);
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.step-item {
  display: flex;
  gap: 0.75rem;

  .step-number {
    width: 1.5rem;
    height: 1.5rem;
    background: $sa-sky;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6875rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .step-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: $gray-900;
    margin-bottom: 0.125rem;
  }

  .step-desc {
    font-size: 0.6875rem;
    color: $gray-600;
  }
}

// Footer
.confirmation-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid $gray-200;
  padding: 1rem 2rem;
  z-index: 100;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.05);
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-right {
  display: flex;
  gap: 0.75rem;
}

.back-btn,
.view-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: white;
  border: 2px solid $gray-300;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: $gray-700;
  cursor: pointer;

  &:hover { background: $gray-50; }
}

.view-all-btn {
  border-color: $sa-sky;
  color: $sa-sky;

  &:hover { background: rgba($sa-sky, 0.05); }
}

.footer-right .book-another-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: $sa-sky;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;

  &:hover { background: darken($sa-sky, 5%); }
}

// Responsive
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .hero-summary {
    grid-template-columns: 1fr;
  }

  .details-row,
  .contact-grid,
  .schedule-grid {
    grid-template-columns: 1fr;
  }
}

// Tablet breakpoint (768px)
@media (max-width: 768px) {
  .confirmation-header {
    padding: 0.75rem 1rem;

    .success-badge {
      width: 2rem;
      height: 2rem;
    }

    h2 {
      font-size: 1rem;
    }

    p {
      font-size: 0.75rem;
    }
  }

  .confirmation-main {
    padding: 1rem;
    padding-bottom: 5rem;
  }

  .success-hero {
    padding: 2rem 1.5rem;
    border-radius: 0.75rem;
    margin-bottom: 1.5rem;

    .hero-icon {
      width: 4rem;
      height: 4rem;
      margin-bottom: 1rem;

      svg {
        transform: scale(0.8);
      }
    }

    h1 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .hero-subtitle {
      font-size: 0.9375rem;
    }

    .hero-summary {
      margin-top: 1.5rem;
      gap: 1rem;
      grid-template-columns: repeat(3, 1fr);

      .summary-item {
        padding: 0.75rem;

        p.label {
          font-size: 0.6875rem;
        }

        p.value {
          font-size: 0.875rem;
        }
      }
    }
  }

  .hero-decorations {
    display: none; // Hide decorations on mobile
  }

  .confirmation-card {
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 0.75rem;

    .card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
      margin-bottom: 1rem;

      h3 {
        font-size: 1rem;
      }
    }

    h3 {
      font-size: 1rem;
      gap: 0.5rem;
    }
  }

  .details-row {
    gap: 0.75rem;
  }

  .detail-box {
    padding: 1rem;
    border-radius: 0.5rem;

    .box-label {
      font-size: 0.6875rem;
    }

    .box-value {
      font-size: 1rem;

      &.mono {
        font-size: 0.9375rem;
      }
    }

    .box-desc {
      font-size: 0.6875rem;
    }
  }

  .systems-activated {
    padding: 1rem;
    border-radius: 0.75rem;

    .systems-header {
      flex-direction: column;
      text-align: center;
      gap: 0.5rem;
      margin-bottom: 1rem;

      .systems-icon {
        width: 2.5rem;
        height: 2.5rem;
      }

      h4 {
        font-size: 0.9375rem;
      }

      p {
        font-size: 0.8125rem;
      }
    }

    .systems-grid {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }

    .system-item {
      font-size: 0.8125rem;
      padding: 0.5rem 0;
    }
  }

  .patient-summary {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;

    .patient-avatar {
      width: 60px;
      height: 60px;
    }

    .patient-info {
      h4 {
        font-size: 1rem;
      }

      .patient-meta {
        font-size: 0.8125rem;
      }
    }

    .patient-badges {
      justify-content: center;
    }
  }

  .contact-grid {
    gap: 0.75rem;
  }

  .contact-item {
    padding: 0.75rem;
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;

    .contact-icon {
      width: 2.5rem;
      height: 2.5rem;
    }

    p {
      font-size: 0.8125rem;
    }
  }

  .schedule-card-grid {
    grid-template-columns: 1fr !important;
    gap: 0.75rem;
  }

  .schedule-detail-card {
    padding: 1rem;
  }

  .meeting-card {
    padding: 1rem;
    border-radius: 0.75rem;

    .meeting-header {
      flex-direction: column;
      gap: 0.5rem;

      .meeting-icon {
        width: 2.5rem;
        height: 2.5rem;
      }

      h3 {
        font-size: 0.9375rem;
      }
    }

    .meeting-url-box {
      .url-value {
        font-size: 0.75rem;
        word-break: break-all;
      }
    }

    .meeting-actions {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
  }

  .payment-hero {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
    padding: 1rem;

    .payment-amount {
      font-size: 2rem;
    }

    .payment-check {
      width: 3rem;
      height: 3rem;
    }
  }

  .payment-breakdown {
    .breakdown-row {
      padding: 0.625rem;
      font-size: 0.875rem;

      &.total .total-value {
        font-size: 1.125rem;
      }
    }
  }

  // Sidebar
  .sidebar-column {
    display: none; // Hide sidebar on mobile
  }

  // Footer - Clean mobile layout
  .confirmation-footer {
    padding: 0.75rem 1rem;

    .footer-content {
      flex-direction: column;
      gap: 0.75rem;
    }

    .back-btn {
      width: 100%;
      justify-content: center;
      order: 3; // Move to bottom
      background: transparent;
      border: none;
      color: $gray-600;
      padding: 0.5rem;
      font-size: 0.8125rem;

      &:hover {
        color: $sa-sky;
        background: transparent;
      }
    }

    .footer-right {
      width: 100%;
      flex-direction: column;
      gap: 0.5rem;
    }

    .view-all-btn {
      width: 100%;
      justify-content: center;
      order: 2;
      padding: 0.875rem;
      font-size: 0.875rem;
      border-width: 1px;
    }

    .footer-right .book-another-btn {
      width: 100%;
      justify-content: center;
      order: 1;
      padding: 0.875rem;
      font-size: 0.875rem;
      box-shadow: 0 2px 8px rgba($sa-sky, 0.3);
    }
  }
}

// Small phone breakpoint (480px)
@media (max-width: 480px) {
  .confirmation-header {
    padding: 0.5rem 0.75rem;

    .header-left {
      gap: 0.5rem;
    }

    .success-badge {
      width: 1.75rem;
      height: 1.75rem;
    }

    h2 {
      font-size: 0.9375rem;
    }

    p {
      font-size: 0.6875rem;
    }
  }

  .confirmation-main {
    padding: 0.75rem;
    padding-bottom: 4.5rem;
  }

  .success-hero {
    padding: 1.5rem 1rem;

    .hero-icon {
      width: 3.5rem;
      height: 3.5rem;
    }

    h1 {
      font-size: 1.25rem;
    }

    .hero-subtitle {
      font-size: 0.8125rem;
    }

    .hero-summary {
      grid-template-columns: 1fr;
      gap: 0.75rem;

      .summary-item {
        flex-direction: row;
        justify-content: space-between;
        padding: 0.625rem 0.75rem;

        svg {
          display: none;
        }

        p.label {
          font-size: 0.75rem;
          margin-bottom: 0;
        }

        p.value {
          font-size: 0.9375rem;
        }
      }
    }
  }

  .confirmation-card {
    padding: 0.75rem;

    h3 {
      font-size: 0.9375rem;
    }
  }

  .detail-box {
    padding: 0.75rem;

    .box-value {
      font-size: 0.9375rem;
    }
  }

  .systems-activated {
    padding: 0.75rem;
  }

  .patient-summary {
    .patient-avatar {
      width: 52px;
      height: 52px;
    }
  }

  .schedule-detail-card {
    padding: 0.75rem;

    .detail-icon {
      width: 2rem;
      height: 2rem;
    }

    h4 {
      font-size: 0.8125rem;
    }

    p {
      font-size: 0.9375rem;
    }
  }

  .meeting-card {
    padding: 0.75rem;
  }

  .payment-hero {
    padding: 0.75rem;

    .payment-amount {
      font-size: 1.75rem;
    }

    .payment-check {
      width: 2.5rem;
      height: 2.5rem;
    }
  }

  .confirmation-footer {
    padding: 0.5rem 0.75rem;

    .footer-content {
      gap: 0.5rem;
    }

    .back-btn {
      padding: 0.375rem;
      font-size: 0.75rem;
    }

    .view-all-btn,
    .footer-right .book-another-btn {
      padding: 0.75rem;
      font-size: 0.8125rem;
    }
  }
}

// Print Styles - Professional Confirmation Document
@media print {
  // Hide non-printable elements
  .confirmation-header,
  .sidebar-column,
  .confirmation-footer,
  .systems-activated,
  .meeting-btn-group,
  .get-link-btn,
  .action-btn,
  .book-another-btn,
  .confirmed-badge,
  .footer-nav-btn,
  .view-all-btn,
  button,
  .hero-decorations {
    display: none !important;
  }

  // Reset page styles
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  body, html {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
  }

  .confirmation-page {
    background: white !important;
    min-height: auto !important;
    padding: 0 !important;
  }

  .confirmation-main {
    padding: 0 !important;
  }

  .confirmation-container {
    max-width: 100% !important;
    padding: 0 !important;
  }

  // Print Header with Logo
  .success-hero {
    background: linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%) !important;
    border-radius: 0 !important;
    margin: 0 !important;
    padding: 2rem !important;
    page-break-after: avoid;

    &::before {
      content: 'RAPID CAPSULE';
      display: block;
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: 2px;
      color: white;
      margin: 0 auto 1.5rem;
      text-align: center;
    }

    .hero-content {
      padding: 0 !important;

      h1 {
        font-size: 1.75rem !important;
        margin-bottom: 0.5rem !important;
      }

      .hero-subtitle {
        font-size: 1rem !important;
        opacity: 0.9;
      }
    }

    .hero-icon {
      display: none !important;
    }

    .hero-summary {
      margin-top: 1.5rem !important;
      gap: 1rem !important;

      .summary-item {
        padding: 1rem !important;
        background: rgba(255,255,255,0.15) !important;

        .label {
          font-size: 0.6875rem !important;
        }

        .value {
          font-size: 1rem !important;
        }

        svg { display: none !important; }
      }
    }
  }

  // Main Content Grid - Single Column for Print
  .content-grid {
    display: block !important;
    padding: 1.5rem !important;
  }

  .main-column {
    width: 100% !important;
  }

  // Card Styles
  .confirmation-card {
    border: 1px solid #E5E7EB !important;
    border-radius: 0.5rem !important;
    margin-bottom: 1rem !important;
    padding: 1.25rem !important;
    page-break-inside: avoid;
    box-shadow: none !important;

    h3 {
      font-size: 1rem !important;
      color: #1F2937 !important;
      margin-bottom: 1rem !important;
      padding-bottom: 0.75rem !important;
      border-bottom: 2px solid #0EA5E9 !important;

      svg { display: none !important; }
    }
  }

  // Details Boxes
  .details-row {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 1rem !important;
  }

  .detail-box {
    padding: 1rem !important;
    border-radius: 0.5rem !important;
    border: 1px solid #E5E7EB !important;

    &.blue { background: #EFF6FF !important; border-color: #BFDBFE !important; }
    &.purple { background: #F5F3FF !important; border-color: #DDD6FE !important; }

    .box-label {
      font-size: 0.6875rem !important;
      text-transform: uppercase !important;
      letter-spacing: 0.5px !important;
      color: #6B7280 !important;
    }

    .box-value {
      font-size: 1rem !important;
      font-weight: 700 !important;
      color: #1F2937 !important;
    }

    .box-desc {
      font-size: 0.75rem !important;
      color: #9CA3AF !important;
    }
  }

  // Patient Summary
  .patient-summary {
    display: flex !important;
    align-items: center !important;
    gap: 1rem !important;
    padding: 1rem !important;
    background: #F9FAFB !important;
    border-radius: 0.5rem !important;
    margin-bottom: 1rem !important;

    .patient-avatar {
      width: 3rem !important;
      height: 3rem !important;
      border-radius: 50% !important;
      background: #0EA5E9 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      color: white !important;
      font-weight: 700 !important;
      font-size: 1rem !important;

      img { border-radius: 50% !important; }
    }

    .patient-info h4 {
      font-size: 1rem !important;
      margin: 0 0 0.25rem !important;
    }

    .patient-meta {
      font-size: 0.75rem !important;
      color: #6B7280 !important;
    }

    .patient-badges { display: none !important; }
  }

  // Contact Grid
  .contact-grid {
    display: grid !important;
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 0.75rem !important;

    .contact-item {
      display: flex !important;
      align-items: center !important;
      gap: 0.75rem !important;
      padding: 0.75rem !important;
      background: #F9FAFB !important;
      border-radius: 0.5rem !important;

      .contact-icon {
        width: 2rem !important;
        height: 2rem !important;
        border-radius: 0.375rem !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;

        svg { display: none !important; }

        &.blue { background: #DBEAFE !important; }
        &.green { background: #DCFCE7 !important; }

        &::after {
          font-size: 0.875rem !important;
        }

        &.blue::after { content: '✉️'; }
        &.green::after { content: '📞'; }
      }

      .contact-label {
        font-size: 0.6875rem !important;
        color: #9CA3AF !important;
        text-transform: uppercase !important;
      }

      .contact-value {
        font-size: 0.875rem !important;
        font-weight: 600 !important;
        color: #1F2937 !important;
      }
    }
  }

  // Schedule Grid
  .schedule-grid {
    display: grid !important;
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 0.75rem !important;

    .schedule-item {
      padding: 1rem !important;
      border-radius: 0.5rem !important;
      text-align: center !important;

      &.blue { background: #EFF6FF !important; }
      &.green { background: #ECFDF5 !important; }
      &.purple { background: #F5F3FF !important; }

      .schedule-icon { display: none !important; }

      .schedule-label {
        font-size: 0.625rem !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
        color: #6B7280 !important;
        margin-bottom: 0.25rem !important;

        &::before {
          font-size: 1rem !important;
          display: block !important;
          margin-bottom: 0.25rem !important;
        }
      }

      &.blue .schedule-label::before { content: '📅'; }
      &.green .schedule-label::before { content: '🕐'; }
      &.purple .schedule-label::before { content: '⏱️'; }

      .schedule-day,
      .schedule-time,
      .schedule-duration {
        font-size: 1.125rem !important;
        font-weight: 700 !important;
        color: #1F2937 !important;
      }

      .schedule-full,
      .schedule-tz,
      .schedule-end {
        font-size: 0.6875rem !important;
        color: #6B7280 !important;
      }
    }
  }

  // Channel Row
  .channel-row {
    display: flex !important;
    align-items: center !important;
    gap: 1rem !important;
    padding: 1rem !important;
    background: #EFF6FF !important;
    border: 1px solid #BFDBFE !important;
    border-radius: 0.5rem !important;

    .channel-icon {
      background: #0EA5E9 !important;

      svg { display: none !important; }

      &::after {
        content: '📹';
        font-size: 1.25rem !important;
      }
    }
  }

  // Meeting Access Card
  .meeting-access-card {
    padding: 1.25rem !important;
    background: #EFF6FF !important;
    border: 2px solid #0EA5E9 !important;
    page-break-inside: avoid;

    .meeting-header {
      margin-bottom: 1rem !important;

      .meeting-icon {
        svg { display: none !important; }
        &::after {
          content: '🎥';
          font-size: 1.5rem !important;
        }
      }

      h3 { font-size: 1rem !important; }
      p { font-size: 0.8125rem !important; }
    }

    .meeting-url-box {
      background: white !important;
      padding: 1rem !important;
      border-radius: 0.5rem !important;

      .url-header {
        margin-bottom: 0.5rem !important;

        p { font-size: 0.6875rem !important; }
        button { display: none !important; }
      }

      .meeting-url {
        font-size: 0.75rem !important;
        word-break: break-all !important;
        color: #0EA5E9 !important;
      }
    }
  }

  // Payment Summary
  .payment-summary {
    background: #ECFDF5 !important;
    border: 1px solid #A7F3D0 !important;
    border-radius: 0.5rem !important;
    padding: 1rem !important;

    .payment-row {
      display: flex !important;
      justify-content: space-between !important;
      padding: 0.5rem 0 !important;
      border-bottom: 1px dashed #D1FAE5 !important;

      &:last-child { border-bottom: none !important; }

      &.total {
        border-top: 2px solid #10B981 !important;
        border-bottom: none !important;
        padding-top: 0.75rem !important;
        margin-top: 0.5rem !important;

        .payment-label,
        .payment-value {
          font-weight: 700 !important;
          color: #059669 !important;
        }
      }
    }

    .payment-label {
      font-size: 0.8125rem !important;
      color: #065F46 !important;
    }

    .payment-value {
      font-size: 0.8125rem !important;
      font-weight: 600 !important;
      color: #065F46 !important;
    }
  }

  // Print Footer
  .confirmation-container::after {
    content: '';
    display: block;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 2px solid #E5E7EB;
    text-align: center;
    font-size: 0.75rem;
    color: #9CA3AF;
  }

  .main-column::after {
    content: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\A\ARapid Capsule Health Technologies  •  rapidcapsule.com  •  support@rapidcapsule.com\A\AThis document confirms your appointment booking. Please keep this for your records.\AFor any changes, please contact us at least 24 hours before your scheduled appointment.\A\ADocument generated on ' attr(data-print-date) ' • © 2026 Rapid Capsule. All rights reserved.';
    white-space: pre-wrap;
    display: block;
    margin-top: 2rem;
    padding: 1.5rem;
    background: #F9FAFB;
    border-radius: 0.5rem;
    text-align: center;
    font-size: 0.6875rem;
    color: #6B7280;
    line-height: 1.8;
  }

  // Page Setup
  @page {
    size: A4;
    margin: 1cm;
  }
}
</style>
