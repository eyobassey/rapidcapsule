<template>
  <div class="confirmation-page">
    <!-- Left Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-content">
        <h3 class="sidebar-label">Your Specialist</h3>

        <!-- Doctor Profile Card -->
        <div class="doctor-card">
          <div class="doctor-avatar-wrapper">
            <img
              v-if="appointment.specialist?.profile?.profile_photo"
              :src="appointment.specialist.profile.profile_photo"
              :alt="appointment.specialist.full_name"
              class="doctor-avatar"
            />
            <div v-else class="doctor-avatar-placeholder">
              {{ getInitials(appointment.specialist) }}
            </div>
            <div class="verified-badge">
              <v-icon name="hi-check" scale="0.5" />
            </div>
          </div>
          <h2 class="doctor-name">{{ appointment.specialist?.full_name || 'Dr. Specialist' }}</h2>
          <p class="doctor-specialty">
            {{ appointment.specialist?.professional_practice?.area_of_specialty || appointment.category }}
          </p>
          <div class="doctor-rating" v-if="appointment.specialist?.average_rating">
            <v-icon name="bi-star-fill" scale="0.6" class="star-icon" />
            <span class="rating-value">{{ appointment.specialist.average_rating.toFixed(1) }}</span>
            <span class="rating-count">({{ appointment.specialist?.review_count || 0 }} reviews)</span>
          </div>
          <div class="doctor-rating" v-else>
            <span class="rating-count">No ratings yet</span>
          </div>
          <div class="doctor-actions">
            <button class="btn-profile">View Profile</button>
            <button class="btn-message">Message</button>
          </div>
        </div>

        <!-- Appointment Timeline -->
        <div class="timeline">
          <div class="timeline-item">
            <div class="timeline-dot sky"></div>
            <div class="timeline-content">
              <span class="timeline-label">Date</span>
              <span class="timeline-value">{{ formattedDate }}</span>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot orange"></div>
            <div class="timeline-content">
              <span class="timeline-label">Time</span>
              <span class="timeline-value">{{ formattedTime }}</span>
              <span class="timeline-subtitle">({{ appointment.timezone || 'West Africa Time' }})</span>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot navy"></div>
            <div class="timeline-content">
              <span class="timeline-label">Type</span>
              <div class="timeline-type">
                <v-icon :name="meetingIcon" scale="0.8" />
                <span>{{ meetingTypeLabel }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Support Box -->
        <div class="support-box">
          <div class="support-header">
            <div class="support-icon">
              <v-icon name="hi-chat-alt-2" scale="0.9" />
            </div>
            <div class="support-text">
              <strong>Having trouble?</strong>
              <p>Chat with our support team if you need to reschedule or have technical issues.</p>
            </div>
          </div>
          <button class="btn-support">
            Start Support Chat
            <v-icon name="hi-arrow-right" scale="0.7" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <div class="content-wrapper">
        <!-- Success Hero -->
        <div class="success-hero">
          <div class="success-icon">
            <v-icon name="hi-check" scale="1.5" />
          </div>
          <h1 class="success-title">Appointment Confirmed!</h1>
          <p class="success-desc">
            Your session with {{ appointment.specialist?.full_name || 'your specialist' }} is scheduled.
            A confirmation email has been sent to {{ userEmail }}.
          </p>
          <div class="appointment-id">
            Appointment ID: <span>#{{ appointment._id?.slice(-8) || 'RC-0000' }}</span>
          </div>
        </div>

        <!-- Action Cards Grid -->
        <div class="action-grid">
          <!-- Zoom Card -->
          <div class="action-card zoom-card">
            <div class="card-accent"></div>
            <div class="card-content">
              <div class="card-header">
                <div class="zoom-logo">
                  <v-icon name="hi-video-camera" scale="1.2" />
                  <span>Video Call</span>
                </div>
                <span class="badge badge-blue">Video Call</span>
              </div>
              <h3 class="card-title">Join Consultation</h3>
              <p class="card-desc">Link activates 10 mins before appointment time.</p>

              <div class="meeting-info">
                <div class="meeting-id-box">
                  <div>
                    <span class="meeting-label">Meeting ID</span>
                    <span class="meeting-id">{{ displayMeetingId }}</span>
                  </div>
                  <button class="btn-copy" @click="copyMeetingId" :disabled="!appointment.meeting_id">
                    <v-icon name="hi-clipboard-copy" scale="0.85" />
                  </button>
                </div>
              </div>

              <button class="btn-zoom" @click="launchZoom">
                <v-icon name="hi-video-camera" scale="0.9" />
                Launch Zoom App
              </button>
            </div>
          </div>

          <!-- Reminders Card -->
          <div class="action-card reminders-card">
            <h3 class="card-title">Manage Reminders</h3>

            <div class="reminder-options">
              <!-- Calendar -->
              <div class="calendar-dropdown">
                <div class="reminder-item" @click="showCalendarOptions = !showCalendarOptions">
                  <div class="reminder-icon orange">
                    <v-icon name="hi-calendar" scale="0.9" />
                  </div>
                  <div class="reminder-content">
                    <span class="reminder-title">Add to Calendar</span>
                    <span class="reminder-subtitle">Google, Outlook, iCal</span>
                  </div>
                  <v-icon :name="showCalendarOptions ? 'hi-chevron-down' : 'hi-chevron-right'" scale="0.7" class="reminder-arrow" />
                </div>
                <div class="calendar-options" v-if="showCalendarOptions">
                  <button @click="addToCalendar" class="calendar-option">
                    <v-icon name="bi-google" scale="0.8" />
                    Google Calendar
                  </button>
                  <button @click="downloadICS" class="calendar-option">
                    <v-icon name="hi-calendar" scale="0.8" />
                    Download .ics (Outlook/iCal)
                  </button>
                </div>
              </div>

              <!-- WhatsApp -->
              <div class="reminder-item whatsapp-item">
                <div class="reminder-icon green">
                  <v-icon name="co-whatsapp" scale="0.9" />
                </div>
                <div class="reminder-content">
                  <span class="reminder-title">WhatsApp Reminders</span>
                  <span class="reminder-subtitle">Get notified on your phone</span>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" v-model="whatsappReminders" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Pre-Visit Checklist -->
        <div class="checklist-section">
          <div class="checklist-header">
            <div>
              <h2 class="checklist-title">Pre-Visit Checklist</h2>
              <p class="checklist-desc">Complete these steps now to save time during your consultation.</p>
            </div>
            <div class="checklist-progress">
              <span class="progress-count">{{ completedCount }}/3</span> Completed
            </div>
          </div>

          <div class="checklist-items">
            <!-- Step 1: Tech Check -->
            <div class="checklist-item" :class="{ completed: checklist.techCheck }">
              <div class="item-icon sky">
                <v-icon :name="checklist.techCheck ? 'hi-check-circle' : 'hi-desktop-computer'" scale="1" />
              </div>
              <div class="item-content">
                <h4 class="item-title">Test Your Device</h4>
                <p class="item-desc">Check your camera and microphone to ensure the doctor can see and hear you clearly.</p>
              </div>
              <button class="btn-item" @click="startTechCheck" :disabled="checklist.techCheck">
                {{ checklist.techCheck ? 'Completed' : 'Start Test' }}
              </button>
            </div>

            <!-- Step 2: Vitals Upload -->
            <div class="checklist-item vitals-item" :class="{ completed: checklist.vitals }">
              <div class="item-icon orange">
                <v-icon name="hi-heart" scale="1" />
              </div>
              <div class="item-content">
                <div class="item-header">
                  <div>
                    <h4 class="item-title">Upload Current Vitals</h4>
                    <p class="item-desc">Please provide recent readings if available.</p>
                  </div>
                  <span class="badge badge-orange">Required</span>
                </div>

                <div class="vitals-form" v-if="!checklist.vitals">
                  <div class="vitals-grid">
                    <div class="vital-input">
                      <label>Blood Pressure (SYS/DIA)</label>
                      <div class="bp-inputs">
                        <input type="number" v-model="vitals.systolic" placeholder="120" />
                        <span>/</span>
                        <input type="number" v-model="vitals.diastolic" placeholder="80" />
                      </div>
                    </div>
                    <div class="vital-input">
                      <label>Temperature (°C)</label>
                      <input type="number" v-model="vitals.temperature" placeholder="36.5" step="0.1" />
                    </div>
                    <div class="vital-input">
                      <button class="btn-save-vitals" @click="saveVitals" :disabled="isSavingVitals">
                        {{ isSavingVitals ? 'Saving...' : 'Save Vitals' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 3: AI Prep -->
            <div class="checklist-item ai-item" :class="{ completed: checklist.aiPrep }">
              <div class="item-icon purple">
                <v-icon name="fa-robot" scale="1" />
              </div>
              <div class="item-content">
                <div class="item-header">
                  <div>
                    <h4 class="item-title">AI Pre-Visit Assessment</h4>
                    <p class="item-desc">Answer quick questions to help your doctor prepare.</p>
                  </div>
                  <span class="badge badge-purple">Recommended</span>
                </div>

                <div class="ai-question" v-if="!checklist.aiPrep">
                  <div class="question-box">
                    <div class="question-icon">
                      <v-icon name="fa-magic" scale="0.8" />
                    </div>
                    <p class="question-text">Have you experienced any shortness of breath along with your symptoms?</p>
                  </div>
                  <div class="question-options">
                    <button @click="answerAiQuestion('yes')">Yes, often</button>
                    <button @click="answerAiQuestion('sometimes')">Only with exertion</button>
                    <button @click="answerAiQuestion('no')">No</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Trust Badges -->
        <div class="trust-section">
          <span class="trust-label">Powered by trusted partners:</span>
          <div class="trust-badges">
            <div class="trust-badge">
              <v-icon name="hi-shield-check" scale="1.2" />
              <span>Infermedica</span>
            </div>
            <div class="trust-badge">
              <v-icon name="hi-video-camera" scale="1.2" />
              <span>Zoom Health</span>
            </div>
            <div class="trust-badge">
              <v-icon name="hi-lock-closed" scale="1.2" />
              <span>Paystack</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Sticky Footer -->
      <div class="sticky-footer">
        <router-link to="/app/patient/dashboard" class="btn-back">
          <v-icon name="hi-arrow-left" scale="0.8" />
          Back to Home
        </router-link>
        <router-link to="/app/patient/appointments" class="btn-dashboard">
          Go to Dashboard
          <v-icon name="hi-arrow-right" scale="0.8" />
        </router-link>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { useRoute } from 'vue-router';
import { format, parseISO } from 'date-fns';

const route = useRoute();
const $http = inject('$_HTTP');

const appointment = ref({});
const userEmail = ref('');
const whatsappReminders = ref(true);

const checklist = ref({
  techCheck: false,
  vitals: false,
  aiPrep: false,
});

const vitals = ref({
  systolic: '',
  diastolic: '',
  temperature: '',
});

const isSavingVitals = ref(false);
const showCalendarOptions = ref(false);

// Computed for meeting ID display
const displayMeetingId = computed(() => {
  const id = appointment.value.meeting_id || appointment.value.zoom_meeting_id;
  if (!id) return '--- --- ----';
  // Format as XXX XXX XXXX if it's a number
  const idStr = String(id).replace(/\D/g, '');
  if (idStr.length >= 9) {
    return `${idStr.slice(0, 3)} ${idStr.slice(3, 6)} ${idStr.slice(6, 10)}`;
  }
  return id;
});

const completedCount = computed(() => {
  return Object.values(checklist.value).filter(Boolean).length;
});

const formattedDate = computed(() => {
  if (!appointment.value.date) return 'Date TBD';
  try {
    const date = typeof appointment.value.date === 'string'
      ? new Date(appointment.value.date)
      : appointment.value.date;
    return format(date, 'EEEE, MMM d, yyyy');
  } catch {
    return appointment.value.date;
  }
});

const formattedTime = computed(() => {
  const time = appointment.value.time;
  if (!time) return 'Time TBD';
  if (time.includes('AM') || time.includes('PM')) return time;
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
});

const meetingIcon = computed(() => {
  switch (appointment.value.meeting_channel) {
    case 'zoom': return 'hi-video-camera';
    case 'phone': return 'hi-phone';
    case 'chat': return 'hi-chat';
    default: return 'hi-video-camera';
  }
});

const meetingTypeLabel = computed(() => {
  switch (appointment.value.meeting_channel) {
    case 'zoom': return 'Video Consultation';
    case 'phone': return 'Phone Call';
    case 'chat': return 'Chat Consultation';
    default: return 'Video Consultation';
  }
});

const getInitials = (specialist) => {
  if (!specialist?.profile) return 'DR';
  const first = specialist.profile.first_name?.charAt(0) || '';
  const last = specialist.profile.last_name?.charAt(0) || '';
  return (first + last).toUpperCase() || 'DR';
};

const $toast = inject('$toast', { success: () => {}, error: () => {} });

const copyMeetingId = () => {
  const meetingId = appointment.value.meeting_id || appointment.value.zoom_meeting_id;
  if (meetingId) {
    navigator.clipboard.writeText(meetingId);
    $toast.success('Meeting ID copied to clipboard!');
  }
};

const launchZoom = () => {
  const zoomUrl = appointment.value.zoom_join_url || appointment.value.join_url;
  if (zoomUrl) {
    window.open(zoomUrl, '_blank');
  } else {
    $toast.error('Zoom link not available yet. It will be available 10 minutes before your appointment.');
  }
};

const addToCalendar = () => {
  // Generate Google Calendar URL
  const title = encodeURIComponent(`Medical Appointment with ${appointment.value.specialist?.full_name || 'Specialist'}`);
  const details = encodeURIComponent(`Telemedicine consultation via Rapid Capsule.\n\nMeeting ID: ${appointment.value.meeting_id || 'TBD'}\n\nJoin Link: ${appointment.value.zoom_join_url || 'Will be provided'}`);

  // Parse date and time
  const dateStr = appointment.value.date;
  const timeStr = appointment.value.time || '09:00';

  let startDate;
  try {
    const dateObj = new Date(dateStr);
    const [hours, minutes] = timeStr.split(':').map(Number);
    dateObj.setHours(hours, minutes, 0, 0);
    startDate = dateObj;
  } catch {
    startDate = new Date();
  }

  // Format dates for Google Calendar (YYYYMMDDTHHmmssZ)
  const formatGoogleDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 min appointment

  const googleCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&details=${details}&location=Online%20(Zoom)`;

  window.open(googleCalUrl, '_blank');
};

const downloadICS = () => {
  // Generate ICS file for Outlook/iCal
  const title = `Medical Appointment with ${appointment.value.specialist?.full_name || 'Specialist'}`;
  const dateStr = appointment.value.date;
  const timeStr = appointment.value.time || '09:00';

  let startDate;
  try {
    const dateObj = new Date(dateStr);
    const [hours, minutes] = timeStr.split(':').map(Number);
    dateObj.setHours(hours, minutes, 0, 0);
    startDate = dateObj;
  } catch {
    startDate = new Date();
  }

  const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

  const formatICSDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Rapid Capsule//Appointment//EN
BEGIN:VEVENT
UID:${appointment.value._id || Date.now()}@rapidcapsule.com
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${title}
DESCRIPTION:Telemedicine consultation via Rapid Capsule
LOCATION:Online (Zoom)
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'appointment.ics';
  a.click();
  URL.revokeObjectURL(url);
};

const startTechCheck = async () => {
  try {
    // Request camera and microphone permissions
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    // Stop the stream immediately (we just wanted to check permissions)
    stream.getTracks().forEach(track => track.stop());

    checklist.value.techCheck = true;
    $toast.success('Camera and microphone are working!');
  } catch (error) {
    console.error('Tech check failed:', error);
    $toast.error('Unable to access camera/microphone. Please check your permissions.');
  }
};

const saveVitals = async () => {
  if (!vitals.value.systolic || !vitals.value.diastolic) {
    $toast.error('Please enter blood pressure values');
    return;
  }

  isSavingVitals.value = true;

  try {
    const timestamp = Date.now();
    const payload = {
      blood_pressure: {
        [timestamp]: `${vitals.value.systolic}/${vitals.value.diastolic}`,
      },
    };

    if (vitals.value.temperature) {
      payload.body_temp = {
        [timestamp]: String(vitals.value.temperature),
      };
    }

    await $http.$_createVitals(payload);
    checklist.value.vitals = true;
    $toast.success('Vitals saved successfully!');
  } catch (error) {
    console.error('Error saving vitals:', error);
    $toast.error('Failed to save vitals. Please try again.');
  } finally {
    isSavingVitals.value = false;
  }
};

const answerAiQuestion = (answer) => {
  checklist.value.aiPrep = true;
  $toast.success('Thank you! Your response has been recorded.');
};

onMounted(async () => {
  const appointmentId = route.params.id || route.query.id;

  // Get user email
  try {
    const { data } = await $http.$_getCurrentUser();
    const userData = data?.result || data?.data || data || {};
    userEmail.value = userData?.email || '';
  } catch (e) {
    console.error('Error fetching user:', e);
  }

  // First, check if coming from booking flow with appointment data (has specialist details)
  if (route.query.data) {
    try {
      const queryData = JSON.parse(decodeURIComponent(route.query.data));
      appointment.value = queryData;
    } catch (e) {
      console.error('Error parsing appointment data:', e);
    }
  }

  // Then fetch from API to get the actual _id and any additional data
  if (appointmentId) {
    try {
      const { data } = await $http.$_getAppointmentById(appointmentId);
      const appointmentData = data?.result || data?.data || data || {};
      // Merge API data with query data - API takes precedence for _id
      appointment.value = { ...appointment.value, ...appointmentData };
    } catch (error) {
      console.error('Error fetching appointment:', error);
    }
  }
});
</script>

<style scoped lang="scss">
$v2-sky: #4FC3F7;
$v2-sky-light: #E1F5FE;
$v2-sky-dark: #0288D1;
$v2-orange: #FF9800;
$v2-orange-light: #FFF3E0;
$v2-success: #4CAF50;
$v2-success-light: #E8F5E9;
$v2-purple: #8B5CF6;
$v2-purple-light: #EDE9FE;
$v2-navy: #1A365D;

.confirmation-page {
  display: flex;
  min-height: 100vh;
  background: #F5F9FF;
}

// Sidebar
.sidebar {
  width: 320px;
  background: white;
  border-right: 1px solid #e5e7eb;
  flex-shrink: 0;
  display: none;

  @media (min-width: 1024px) {
    display: block;
  }
}

.sidebar-content {
  padding: 24px;
}

.sidebar-label {
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 16px;
}

// Doctor Card
.doctor-card {
  background: white;
  border: 1px solid #f3f4f6;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
}

.doctor-avatar-wrapper {
  position: relative;
  width: 96px;
  height: 96px;
  margin: 0 auto 12px;
}

.doctor-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid $v2-sky-light;
}

.doctor-avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: $v2-sky-light;
  color: $v2-sky-dark;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  border: 4px solid $v2-sky-light;
}

.verified-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  background: $v2-success;
  border-radius: 50%;
  border: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.doctor-name {
  font-size: 18px;
  font-weight: 700;
  color: $v2-navy;
  margin: 0 0 4px;
}

.doctor-specialty {
  font-size: 12px;
  color: $v2-sky;
  font-weight: 500;
  margin: 0 0 8px;
}

.doctor-rating {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 16px;

  .star-icon {
    color: $v2-orange;
  }

  .rating-value {
    font-weight: 700;
    color: #374151;
  }
}

.doctor-actions {
  display: flex;
  gap: 8px;
}

.btn-profile,
.btn-message {
  flex: 1;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-profile {
  background: $v2-sky-light;
  color: $v2-sky;
  border: none;

  &:hover {
    background: $v2-sky;
    color: white;
  }
}

.btn-message {
  background: white;
  color: #6b7280;
  border: 1px solid #e5e7eb;

  &:hover {
    border-color: $v2-sky;
    color: $v2-sky;
  }
}

// Timeline
.timeline {
  position: relative;
  padding-left: 16px;
  border-left: 2px solid #f3f4f6;
  margin-bottom: 24px;
}

.timeline-item {
  position: relative;
  padding-bottom: 20px;

  &:last-child {
    padding-bottom: 0;
  }
}

.timeline-dot {
  position: absolute;
  left: -21px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &.sky { background: $v2-sky; }
  &.orange { background: $v2-orange; }
  &.navy { background: $v2-navy; }
}

.timeline-content {
  padding-left: 8px;
}

.timeline-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.timeline-value {
  font-size: 14px;
  font-weight: 700;
  color: #374151;
}

.timeline-subtitle {
  display: block;
  font-size: 10px;
  color: #9ca3af;
}

.timeline-type {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #374151;

  svg {
    color: $v2-navy;
  }
}

// Support Box
.support-box {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}

.support-header {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.support-icon {
  width: 32px;
  height: 32px;
  background: white;
  border: 1px solid #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $v2-sky;
  flex-shrink: 0;
}

.support-text {
  strong {
    font-size: 12px;
    color: $v2-navy;
    display: block;
    margin-bottom: 4px;
  }

  p {
    font-size: 10px;
    color: #9ca3af;
    margin: 0;
    line-height: 1.5;
  }
}

.btn-support {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: $v2-sky;
    color: $v2-sky;

    svg {
      transform: translateX(3px);
    }
  }

  svg {
    transition: transform 0.2s;
  }
}

// Main Content
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.content-wrapper {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 24px 120px;
  width: 100%;
}

// Success Hero
.success-hero {
  text-align: center;
  margin-bottom: 40px;
}

.success-icon {
  width: 80px;
  height: 80px;
  background: $v2-success-light;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  color: $v2-success;
  box-shadow: 0 8px 24px rgba(76, 175, 80, 0.2);
}

.success-title {
  font-size: 28px;
  font-weight: 700;
  color: $v2-navy;
  margin: 0 0 8px;
}

.success-desc {
  font-size: 15px;
  color: #6b7280;
  margin: 0 0 16px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.appointment-id {
  display: inline-block;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 50px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;

  span {
    color: $v2-navy;
  }
}

// Action Grid
.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.action-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #f3f4f6;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.zoom-card {
  position: relative;
  border-left: 4px solid #2563eb;

  .card-accent {
    position: absolute;
    right: -40px;
    top: -40px;
    width: 120px;
    height: 120px;
    background: #EFF6FF;
    border-radius: 50%;
  }

  .card-content {
    position: relative;
    padding: 24px;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.zoom-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2563eb;
  font-weight: 700;
  font-size: 14px;
}

.badge {
  padding: 4px 10px;
  border-radius: 50px;
  font-size: 10px;
  font-weight: 700;

  &.badge-blue {
    background: #DBEAFE;
    color: #1D4ED8;
  }

  &.badge-orange {
    background: $v2-orange-light;
    color: #C2410C;
    text-transform: uppercase;
  }

  &.badge-purple {
    background: $v2-purple-light;
    color: $v2-purple;
    text-transform: uppercase;
  }
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: $v2-navy;
  margin: 0 0 4px;
}

.card-desc {
  font-size: 12px;
  color: #9ca3af;
  margin: 0 0 20px;
}

.meeting-info {
  margin-bottom: 16px;
}

.meeting-id-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  border-radius: 10px;
  padding: 12px 16px;
}

.meeting-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.meeting-id {
  font-size: 14px;
  font-weight: 700;
  font-family: monospace;
  color: #374151;
}

.btn-copy {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;

  &:hover {
    color: $v2-sky;
  }
}

.btn-zoom {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  transition: all 0.2s;

  &:hover {
    background: #1D4ED8;
  }
}

// Reminders Card
.reminders-card {
  padding: 24px;
}

.reminder-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.calendar-dropdown {
  border-radius: 12px;
  overflow: hidden;

  .reminder-item {
    margin: 0;
  }
}

.calendar-options {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px 12px 64px;
  background: #f9fafb;
  border-top: 1px solid #f3f4f6;
}

.calendar-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: $v2-sky;
    color: $v2-sky;
    background: $v2-sky-light;
  }

  svg {
    color: #9ca3af;
  }

  &:hover svg {
    color: $v2-sky;
  }
}

.reminder-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f9fafb;
  }

  &.whatsapp-item {
    background: rgba(34, 197, 94, 0.05);
    border: 1px solid rgba(34, 197, 94, 0.2);
  }
}

.reminder-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.orange {
    background: $v2-orange-light;
    color: $v2-orange;
  }

  &.green {
    background: #DCFCE7;
    color: #16A34A;
  }
}

.reminder-content {
  flex: 1;
}

.reminder-title {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #374151;
}

.reminder-subtitle {
  font-size: 10px;
  color: #9ca3af;
}

.reminder-arrow {
  color: #d1d5db;
}

// Toggle Switch
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #e5e7eb;
    transition: 0.3s;
    border-radius: 20px;

    &:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }
  }

  input:checked + .toggle-slider {
    background-color: #22C55E;
  }

  input:checked + .toggle-slider:before {
    transform: translateX(16px);
  }
}

// Checklist Section
.checklist-section {
  margin-bottom: 40px;
}

.checklist-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 12px;
  }
}

.checklist-title {
  font-size: 20px;
  font-weight: 700;
  color: $v2-navy;
  margin: 0 0 4px;
}

.checklist-desc {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
}

.checklist-progress {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 50px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 700;
  color: #6b7280;
  white-space: nowrap;

  .progress-count {
    color: $v2-success;
  }
}

.checklist-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.checklist-item {
  background: white;
  border: 1px solid #f3f4f6;
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
  }

  &.completed {
    background: #f9fafb;
    opacity: 0.7;
  }

  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.item-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.sky {
    background: $v2-sky-light;
    color: $v2-sky;
  }

  &.orange {
    background: $v2-orange-light;
    color: $v2-orange;
  }

  &.purple {
    background: $v2-purple-light;
    color: $v2-purple;
  }
}

.item-content {
  flex: 1;
}

.item-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 8px;
  }
}

.item-title {
  font-size: 16px;
  font-weight: 700;
  color: $v2-navy;
  margin: 0 0 4px;
}

.item-desc {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}

.btn-item {
  padding: 10px 20px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    border-color: $v2-sky;
    color: $v2-sky;
  }

  .completed & {
    background: $v2-success-light;
    border-color: $v2-success;
    color: $v2-success;
  }
}

// Vitals Form
.vitals-form {
  margin-top: 16px;
}

.vitals-grid {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 16px;
  align-items: end;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.vital-input {
  label {
    display: block;
    font-size: 10px;
    font-weight: 700;
    color: #9ca3af;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  input {
    width: 100%;
    padding: 10px 14px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    font-size: 14px;
    color: #374151;

    &:focus {
      outline: none;
      border-color: $v2-sky;
    }
  }
}

.bp-inputs {
  display: flex;
  align-items: center;
  gap: 8px;

  input {
    width: 70px;
  }

  span {
    color: #9ca3af;
  }
}

.btn-save-vitals {
  padding: 10px 20px;
  background: $v2-navy;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(26, 54, 93, 0.2);
  transition: all 0.2s;

  &:hover {
    background: #0F172A;
  }
}

// AI Question
.ai-question {
  margin-top: 16px;
}

.question-box {
  display: flex;
  gap: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.question-icon {
  width: 24px;
  height: 24px;
  background: $v2-purple;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.question-text {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin: 0;
}

.question-options {
  display: flex;
  gap: 12px;
  padding-left: 36px;

  @media (max-width: 600px) {
    flex-direction: column;
    padding-left: 0;
  }

  button {
    padding: 8px 16px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: $v2-purple;
      color: $v2-purple;
    }
  }
}

// Trust Section
.trust-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 32px;
  border-top: 1px solid #e5e7eb;
  opacity: 0.6;
  transition: opacity 0.3s;

  &:hover {
    opacity: 1;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
}

.trust-label {
  font-size: 12px;
  font-weight: 700;
  color: #9ca3af;
}

.trust-badges {
  display: flex;
  align-items: center;
  gap: 32px;
}

.trust-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #6b7280;

  svg {
    color: #374151;
  }
}

// Sticky Footer
.sticky-footer {
  position: sticky;
  bottom: 0;
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #9ca3af;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: $v2-navy;
  }
}

.btn-dashboard {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: $v2-sky;
  color: white;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);
  transition: all 0.2s;

  &:hover {
    background: $v2-sky-dark;
  }
}
</style>
