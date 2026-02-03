<template>
  <div class="create-wizard-page">
    <!-- Header -->
    <div class="wizard-header">
      <div class="header-left">
        <router-link :to="{ name: 'SpecialistAppointmentsDashboard' }" class="back-link">
          <v-icon name="hi-chevron-left" scale="0.9" />
          <span>Back</span>
        </router-link>
      </div>
      <div class="header-right">
        <button class="cancel-btn" @click="$router.back()">
          <v-icon name="hi-x" scale="0.9" />
          Cancel
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <main class="wizard-main">
      <div class="wizard-container">
        <!-- Page Title & Progress -->
        <section class="wizard-title-section">
          <div class="title-block">
            <div class="title-row">
              <div>
                <h1>Book New Appointment</h1>
                <p>Step {{ currentStep }} of {{ totalSteps }}: {{ stepNames[currentStep - 1] }}</p>
              </div>
              <div class="specialist-badge">
                <div class="specialist-avatar">
                  <img v-if="specialistAvatar" :src="specialistAvatar" :alt="specialistName" />
                  <span v-else class="avatar-initials">{{ specialistName.split(' ').filter(n => n).map(n => n[0]).join('').slice(0, 2).toUpperCase() }}</span>
                </div>
                <div class="specialist-info">
                  <p class="specialist-name">{{ specialistName }}</p>
                  <p class="specialist-specialty">{{ specialistSpecialty }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Horizontal Progress Indicator -->
          <div class="progress-steps">
            <template v-for="(name, index) in stepNames" :key="index">
              <div class="step-item" :class="{ active: currentStep === index + 1, completed: currentStep > index + 1 }">
                <div class="step-circle">
                  <v-icon v-if="currentStep > index + 1" name="hi-check" scale="0.7" />
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <div class="step-text">
                  <span class="step-name">{{ name }}</span>
                  <span class="step-subtitle">{{ stepSubtitles[index] }}</span>
                </div>
              </div>
              <div v-if="index < stepNames.length - 1" class="step-line" :class="{ completed: currentStep > index + 1 }"></div>
            </template>
          </div>
        </section>

        <!-- Content Grid: Main + Sidebar -->
        <div class="content-grid">
          <!-- Main Content (8 cols) -->
          <div class="main-content">
            <!-- ===================== -->
            <!-- STEP 1: Patient Selection -->
            <!-- ===================== -->
            <div v-if="currentStep === 1" class="step-card has-tabs">
              <!-- Tabs -->
              <div class="tabs-header">
                <button
                  class="tab-btn"
                  :class="{ active: patient.selectionType === 'existing' }"
                  @click="setPatientTab('existing')"
                >
                  <v-icon name="hi-user-group" scale="0.9" />
                  Existing Patients
                </button>
                <button
                  class="tab-btn"
                  :class="{ active: patient.selectionType === 'platform' }"
                  @click="setPatientTab('platform')"
                >
                  <v-icon name="hi-search" scale="0.9" />
                  Platform Search
                </button>
                <button
                  class="tab-btn"
                  :class="{ active: patient.selectionType === 'manual' }"
                  @click="setPatientTab('manual')"
                >
                  <v-icon name="hi-user-add" scale="0.9" />
                  Manual Entry
                </button>
              </div>

              <!-- Tab: Existing Patients -->
              <div v-if="patient.selectionType === 'existing'" class="tab-content">
                <div class="search-block">
                  <label>Search Your Patients</label>
                  <div class="search-input-wrapper">
                    <v-icon name="hi-search" scale="0.9" />
                    <input
                      type="text"
                      v-model="existingPatientSearch"
                      placeholder="Search by name, email, phone, patient ID, DOB..."
                      @input="searchExistingPatients"
                    />
                    <v-icon v-if="isSearchingExisting" name="hi-refresh" scale="0.8" class="spin" />
                  </div>
                </div>

                <div class="patients-header">
                  <p class="patients-count">
                    Your Patients <span>({{ existingPatientResults.length }} found)</span>
                  </p>
                  <select class="sort-select">
                    <option>Recent visits</option>
                    <option>Name A-Z</option>
                    <option>Last visit date</option>
                  </select>
                </div>

                <div class="patients-list">
                  <div
                    v-for="p in existingPatientResults"
                    :key="p._id"
                    class="patient-card"
                    :class="{ selected: patient.id === p._id }"
                    @click="selectPatient(p, 'existing')"
                  >
                    <div class="patient-avatar">
                      <img v-if="p.profile?.profile_image" :src="p.profile.profile_image" :alt="getPatientName(p)" />
                      <span v-else class="avatar-initials">{{ getInitials(p) }}</span>
                    </div>
                    <div class="patient-info">
                      <p class="patient-name">{{ getPatientName(p) }}</p>
                      <p class="patient-email">{{ p.profile?.contact?.email || 'No email' }}</p>
                      <div class="patient-meta">
                        <span><v-icon name="hi-phone" scale="0.7" />{{ getPatientPhone(p) }}</span>
                        <span><v-icon name="hi-identification" scale="0.7" />{{ p._id?.slice(-6)?.toUpperCase() || 'N/A' }}</span>
                        <span><v-icon name="hi-calendar" scale="0.7" />DOB: {{ formatDOB(p.profile?.date_of_birth) }}</span>
                      </div>
                    </div>
                    <div class="patient-status">
                      <span class="status-badge active">
                        <v-icon name="hi-check-circle" scale="0.7" />{{ p.status || 'Active' }}
                      </span>
                      <p class="last-visit" v-if="p.stats?.lastVisit">
                        Last visit: <strong>{{ formatDate(p.stats.lastVisit) }}</strong>
                      </p>
                    </div>
                  </div>

                  <!-- Empty State -->
                  <div v-if="existingPatientResults.length === 0 && !isSearchingExisting" class="empty-state">
                    <v-icon name="hi-user-group" scale="3" />
                    <p class="empty-title">No patients found</p>
                    <p class="empty-subtitle">You don't have any patients yet, or no matches for your search</p>
                  </div>
                </div>
              </div>

              <!-- Tab: Platform Search -->
              <div v-if="patient.selectionType === 'platform'" class="tab-content">
                <div class="info-banner info">
                  <v-icon name="hi-information-circle" scale="1.2" />
                  <div>
                    <p class="banner-title">Platform-Wide Patient Search</p>
                    <p class="banner-text">Search for any patient registered on the platform. If the patient is not currently associated with your practice, you will need to confirm you have their permission to schedule an appointment on their behalf.</p>
                  </div>
                </div>

                <div class="search-block">
                  <label>Search All Platform Patients</label>
                  <div class="search-input-wrapper platform">
                    <v-icon name="hi-search" scale="0.9" />
                    <input
                      type="text"
                      v-model="platformPatientSearch"
                      placeholder="Search across entire platform by name, email, phone, patient ID..."
                      @input="searchPlatformPatients"
                    />
                    <v-icon v-if="isSearchingPlatform" name="hi-refresh" scale="0.8" class="spin" />
                  </div>
                </div>

                <div class="patients-list">
                  <div
                    v-for="p in platformPatientResults"
                    :key="p._id"
                    class="patient-card platform"
                    :class="{ selected: patient.id === p._id }"
                    @click="selectPatient(p, 'platform')"
                  >
                    <div class="patient-avatar">
                      <img v-if="p.profile?.profile_image" :src="p.profile.profile_image" :alt="getPatientName(p)" />
                      <span v-else class="avatar-initials">{{ getInitials(p) }}</span>
                    </div>
                    <div class="patient-info">
                      <p class="patient-name">{{ getPatientName(p) }}</p>
                      <p class="patient-email">{{ p.profile?.contact?.email || 'No email' }}</p>
                      <div class="patient-meta">
                        <span><v-icon name="hi-phone" scale="0.7" />{{ getPatientPhone(p) }}</span>
                        <span><v-icon name="hi-identification" scale="0.7" />{{ p._id?.slice(-6)?.toUpperCase() || 'N/A' }}</span>
                        <span><v-icon name="hi-calendar" scale="0.7" />DOB: {{ formatDOB(p.profile?.date_of_birth) }}</span>
                      </div>
                    </div>
                    <div class="patient-status">
                      <span v-if="p.isMyPatient" class="status-badge active">
                        <v-icon name="hi-check-circle" scale="0.7" />Your Patient
                      </span>
                      <span v-else class="status-badge platform">
                        <v-icon name="hi-globe" scale="0.7" />Platform Patient
                      </span>
                      <p v-if="!p.isMyPatient" class="not-in-practice">Not in your practice</p>
                      <p v-else-if="p.stats?.lastVisit" class="last-visit">
                        Last visit: <strong>{{ formatDate(p.stats.lastVisit) }}</strong>
                      </p>
                    </div>
                  </div>

                  <!-- Empty/Initial State -->
                  <div v-if="platformPatientResults.length === 0 && !isSearchingPlatform" class="empty-state">
                    <v-icon name="hi-search" scale="3" />
                    <p class="empty-title">Start searching</p>
                    <p class="empty-subtitle">Type to search for patients across the entire platform</p>
                  </div>
                </div>
              </div>

              <!-- Tab: Manual Entry -->
              <div v-if="patient.selectionType === 'manual'" class="tab-content">
                <div class="info-banner warning">
                  <v-icon name="hi-exclamation" scale="1.2" />
                  <div>
                    <p class="banner-title">Manual Patient Entry</p>
                    <p class="banner-text">You are creating an appointment for a patient who is not currently in the system. By proceeding, you confirm that you have the patient's permission to schedule this appointment on their behalf.</p>
                    <p class="banner-text">The patient will be added to the platform and will receive a notification about this appointment.</p>
                  </div>
                </div>

                <form class="manual-entry-form" @submit.prevent>
                  <div class="form-row">
                    <div class="form-group">
                      <label>First Name <span class="required">*</span></label>
                      <input type="text" v-model="manualPatient.firstName" placeholder="Enter first name" required />
                    </div>
                    <div class="form-group">
                      <label>Last Name <span class="required">*</span></label>
                      <input type="text" v-model="manualPatient.lastName" placeholder="Enter last name" required />
                    </div>
                  </div>

                  <div class="form-group">
                    <label>Email Address <span class="required">*</span></label>
                    <input type="email" v-model="manualPatient.email" placeholder="patient@email.com" required />
                    <p class="form-hint">Patient will receive appointment notifications at this email</p>
                  </div>

                  <div class="form-group">
                    <label>Phone Number <span class="required">*</span></label>
                    <input type="tel" v-model="manualPatient.phone" placeholder="+234 000 000 0000" required />
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label>Date of Birth</label>
                      <input type="date" v-model="manualPatient.dateOfBirth" />
                    </div>
                    <div class="form-group">
                      <label>Gender</label>
                      <select v-model="manualPatient.gender">
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <!-- Consent Section -->
                  <div class="consent-section">
                    <h3>Consent & Permission</h3>
                    <div class="consent-box">
                      <label class="consent-checkbox">
                        <input type="checkbox" v-model="manualPatient.consentGiven" />
                        <span class="checkmark"></span>
                        <span class="consent-text">
                          <strong>I confirm that I have permission to schedule this appointment</strong>
                          <span>I verify that the patient has authorized me to book this appointment on their behalf. I understand that the patient will be added to the platform and notified about this appointment.</span>
                        </span>
                      </label>
                    </div>

                    <div class="form-group">
                      <label>Relationship to Patient <span class="optional">(Optional)</span></label>
                      <select v-model="manualPatient.relationship">
                        <option value="">Select relationship</option>
                        <option>Referring physician</option>
                        <option>Family member</option>
                        <option>Legal guardian</option>
                        <option>Healthcare proxy</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label>Reason for Scheduling <span class="optional">(Optional)</span></label>
                      <textarea v-model="manualPatient.reason" rows="3" placeholder="Brief explanation of why you're scheduling on behalf of this patient..."></textarea>
                    </div>

                    <div class="compliance-note">
                      <v-icon name="hi-shield-check" scale="1" />
                      <div>
                        <p class="note-title">Compliance Note</p>
                        <p class="note-text">This information is collected to ensure HIPAA compliance and maintain proper authorization records. All data is encrypted and stored securely.</p>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <!-- ===================== -->
            <!-- STEP 2: Type & Details -->
            <!-- ===================== -->
            <div v-if="currentStep === 2" class="step-content">
              <!-- Appointment Channel Section -->
              <div class="step-card">
                <div class="section-header">
                  <h2>Appointment Channel</h2>
                  <p>Select how the consultation will be conducted</p>
                </div>

                <div class="channel-grid">
                  <div
                    v-for="channel in availableChannels"
                    :key="channel.value"
                    class="channel-card"
                    :class="{ selected: appointmentDetails.channel === channel.value, disabled: !channel.enabled }"
                    @click="channel.enabled && selectChannel(channel.value)"
                  >
                    <div class="channel-icon" :class="channel.colorClass">
                      <v-icon :name="channel.icon" scale="1.5" />
                    </div>
                    <p class="channel-name">{{ channel.label }}</p>
                    <p class="channel-desc">{{ channel.description }}</p>
                    <span v-if="!channel.enabled" class="channel-disabled">Not configured</span>
                  </div>
                </div>

                <!-- Channel Info Banner -->
                <div v-if="appointmentDetails.channel" class="info-banner info">
                  <v-icon name="hi-information-circle" scale="1.2" />
                  <div>
                    <p class="banner-title">Availability Note</p>
                    <p class="banner-text">{{ getChannelInfo(appointmentDetails.channel) }}</p>
                  </div>
                </div>
              </div>

              <!-- Visit Reason Section -->
              <div class="step-card">
                <div class="section-header">
                  <h2>Visit Reason</h2>
                  <p>What is the primary purpose of this appointment?</p>
                </div>

                <div class="visit-reasons-list">
                  <div
                    v-for="reason in visitReasons"
                    :key="reason.slug"
                    class="reason-card"
                    :class="{ selected: appointmentDetails.visitReason === reason.slug, urgent: reason.slug === 'urgent-care' }"
                    @click="selectVisitReason(reason)"
                  >
                    <div class="reason-icon" :style="{ background: reason.icon_bg_color }">
                      <v-icon :name="reason.icon || 'hi-clipboard-list'" scale="1.2" :style="{ color: reason.icon_color }" />
                    </div>
                    <div class="reason-info">
                      <p class="reason-name">{{ reason.label }}</p>
                      <p class="reason-desc">{{ reason.description }}</p>
                    </div>
                    <div class="reason-check">
                      <v-icon v-if="appointmentDetails.visitReason === reason.slug" name="hi-check-circle" scale="1.2" class="checked" />
                      <v-icon v-else name="ri-checkbox-blank-circle-line" scale="1.2" class="unchecked" />
                    </div>
                  </div>
                </div>

                <!-- Other Reason Input -->
                <div v-if="appointmentDetails.visitReason === 'other'" class="other-reason-input">
                  <label>Specify Reason</label>
                  <textarea
                    v-model="appointmentDetails.visitReasonCustom"
                    rows="3"
                    placeholder="Describe the visit purpose..."
                  ></textarea>
                </div>
              </div>

              <!-- Specialty Section (Optional) -->
              <div class="step-card">
                <div class="section-header">
                  <h2>Specialty <span class="optional-tag">Optional</span></h2>
                  <p>Select the medical specialty for this consultation</p>
                </div>

                <div class="form-group">
                  <label>Medical Specialty</label>
                  <select v-model="appointmentDetails.specialty">
                    <option value="">Select specialty (optional)...</option>
                    <option v-for="cat in specialtyCategories" :key="cat.slug" :value="cat.slug">
                      {{ cat.name }}
                    </option>
                  </select>
                </div>

                <div class="info-banner info">
                  <v-icon name="hi-light-bulb" scale="1.2" />
                  <div>
                    <p class="banner-title">Specialty Benefits</p>
                    <p class="banner-text">Selecting a specialty helps with documentation and may provide specialty-specific workflows for your consultation.</p>
                  </div>
                </div>
              </div>

              <!-- Clinical Intake Flags Section (Optional) -->
              <div class="step-card">
                <div class="section-header">
                  <h2>Clinical Intake Flags <span class="optional-tag">Optional</span></h2>
                  <p>Mark any special requirements or considerations for this appointment</p>
                </div>

                <div class="flags-grid">
                  <label
                    v-for="flag in clinicalFlags"
                    :key="flag.id"
                    class="flag-checkbox"
                    :class="{ checked: appointmentDetails.clinicalFlags.includes(flag.id) }"
                  >
                    <input
                      type="checkbox"
                      :value="flag.id"
                      v-model="appointmentDetails.clinicalFlags"
                    />
                    <div class="flag-content">
                      <p class="flag-name">{{ flag.name }}</p>
                      <p class="flag-desc">{{ flag.description }}</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <!-- ===================== -->
            <!-- STEP 3: Schedule -->
            <!-- ===================== -->
            <div v-if="currentStep === 3" class="step-content">
              <!-- Calendar View Toggle -->
              <div class="step-card">
                <div class="flex-header">
                  <h2>Select Date & Time</h2>
                  <div class="view-toggle">
                    <button
                      :class="{ active: schedule.viewMode === 'day' }"
                      @click="schedule.viewMode = 'day'"
                    >
                      <v-icon name="hi-calendar" scale="0.9" />Day
                    </button>
                    <button
                      :class="{ active: schedule.viewMode === 'week' }"
                      @click="schedule.viewMode = 'week'"
                    >
                      <v-icon name="hi-calendar" scale="0.9" />Week
                    </button>
                  </div>
                </div>

                <!-- Calendar Navigation -->
                <div class="calendar-nav">
                  <button class="nav-btn" @click="navigateCalendar(-1)">
                    <v-icon name="hi-chevron-left" scale="1" />
                  </button>
                  <div class="current-date">
                    <h3>{{ formatCurrentDate }}</h3>
                    <p>{{ formatCurrentDayName }}</p>
                  </div>
                  <button class="nav-btn" @click="navigateCalendar(1)">
                    <v-icon name="hi-chevron-right" scale="1" />
                  </button>
                </div>

                <!-- Day View: 7-Day Strip -->
                <div v-if="schedule.viewMode === 'day'" class="day-strip">
                  <div
                    v-for="day in weekDays"
                    :key="day.dateStr"
                    class="day-cell"
                    :class="{
                      selected: schedule.date === day.dateStr,
                      past: day.isPast,
                      today: day.isToday
                    }"
                    @click="!day.isPast && selectDate(day.dateStr)"
                  >
                    <p class="day-name">{{ day.dayName }}</p>
                    <p class="day-number">{{ day.dayNum }}</p>
                    <span v-if="day.availableCount > 0" class="slot-count">{{ day.availableCount }}</span>
                  </div>
                </div>

                <!-- Week View: Grid Calendar -->
                <div v-if="schedule.viewMode === 'week'" class="week-grid-view">
                  <!-- Week Header -->
                  <div class="week-grid-header">
                    <div class="week-time-col"></div>
                    <div
                      v-for="day in weekDays"
                      :key="day.dateStr"
                      class="week-day-col"
                      :class="{ today: day.isToday, past: day.isPast }"
                    >
                      <p class="week-day-name">{{ day.dayName }}</p>
                      <p class="week-day-num">{{ day.dayNum }}</p>
                    </div>
                  </div>

                  <!-- Week Grid Body -->
                  <div class="week-grid-body">
                    <div v-for="hour in weekViewHours" :key="hour" class="week-time-row">
                      <div class="week-time-label">{{ formatHourLabel(hour) }}</div>
                      <div
                        v-for="day in weekDays"
                        :key="`${day.dateStr}-${hour}`"
                        class="week-slot-cell"
                        :class="{
                          past: day.isPast,
                          selected: schedule.date === day.dateStr && schedule.time === `${hour.toString().padStart(2, '0')}:00`,
                          available: isSlotAvailable(day.dateStr, hour),
                          booked: isSlotBooked(day.dateStr, hour)
                        }"
                        @click="!day.isPast && selectWeekSlot(day.dateStr, hour)"
                      >
                        <span v-if="isSlotAvailable(day.dateStr, hour)" class="slot-indicator available"></span>
                        <span v-else-if="isSlotBooked(day.dateStr, hour)" class="slot-indicator booked"></span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Legend -->
                <div class="calendar-legend">
                  <div class="legend-item">
                    <span class="legend-dot available"></span>
                    <span>Available</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-dot booked"></span>
                    <span>You're Busy</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-dot patient-busy"></span>
                    <span>Patient Busy</span>
                  </div>
                </div>
              </div>

              <!-- Duration Selection -->
              <div class="step-card">
                <div class="section-header">
                  <h2>Appointment Duration</h2>
                  <p>Select how long the appointment should last</p>
                </div>

                <div class="duration-grid">
                  <button
                    v-for="dur in durationOptions"
                    :key="dur.value"
                    class="duration-btn"
                    :class="{ selected: schedule.duration === dur.value }"
                    @click="schedule.duration = dur.value"
                  >
                    {{ dur.label }}
                  </button>
                  <div class="duration-custom">
                    <input
                      type="number"
                      v-model.number="schedule.customDuration"
                      placeholder="Custom"
                      min="15"
                      max="180"
                      @input="handleCustomDuration"
                    />
                    <span>min</span>
                  </div>
                </div>
              </div>

              <!-- Time Slot Selection -->
              <div class="step-card">
                <div class="flex-header">
                  <div>
                    <h2>Available Time Slots</h2>
                    <p class="subtitle">Duration: {{ schedule.duration }} minutes</p>
                  </div>
                  <div class="timezone-display">
                    <v-icon name="hi-clock" scale="0.9" />
                    <span>{{ schedule.timezone || 'WAT (GMT+1)' }}</span>
                  </div>
                </div>

                <div v-if="isLoadingSlots" class="loading-slots">
                  <v-icon name="hi-refresh" scale="1.5" class="spin" />
                  <p>Loading available times...</p>
                </div>

                <div v-else-if="!schedule.date" class="no-date-selected">
                  <v-icon name="hi-calendar" scale="2" />
                  <p>Select a date to view available time slots</p>
                </div>

                <div v-else>
                  <!-- Morning Slots -->
                  <div v-if="morningSlots.length > 0" class="time-section">
                    <div class="time-section-header">
                      <h3><v-icon name="fa-sun" scale="0.9" class="sun-icon" />Morning (8:00 AM - 12:00 PM)</h3>
                      <span>{{ morningSlots.length }} slots</span>
                    </div>
                    <div class="time-slots-grid">
                      <button
                        v-for="slot in morningSlots"
                        :key="slot.time"
                        class="time-slot-btn"
                        :class="{
                          selected: schedule.time === slot.time,
                          booked: slot.status === 'booked',
                          'patient-conflict': slot.status === 'patient_conflict'
                        }"
                        :disabled="slot.status !== 'available'"
                        @click="selectTime(slot)"
                      >
                        <p class="slot-time">{{ formatTime(slot.time) }}</p>
                        <p class="slot-status" :class="slot.status">
                          <v-icon v-if="schedule.time === slot.time" name="hi-check-circle" scale="0.7" />
                          <v-icon v-else-if="slot.status === 'available'" name="hi-check-circle" scale="0.7" />
                          <v-icon v-else-if="slot.status === 'patient_conflict'" name="hi-user" scale="0.7" />
                          <v-icon v-else-if="slot.status === 'booked'" name="hi-ban" scale="0.7" />
                          <v-icon v-else name="hi-exclamation-triangle" scale="0.7" />
                          {{ getSlotStatusLabel(slot) }}
                        </p>
                      </button>
                    </div>
                  </div>

                  <!-- Afternoon Slots -->
                  <div v-if="afternoonSlots.length > 0" class="time-section">
                    <div class="time-section-header">
                      <h3><v-icon name="fa-cloud-sun" scale="0.9" class="afternoon-icon" />Afternoon (12:00 PM - 5:00 PM)</h3>
                      <span>{{ afternoonSlots.length }} slots</span>
                    </div>
                    <div class="time-slots-grid">
                      <button
                        v-for="slot in afternoonSlots"
                        :key="slot.time"
                        class="time-slot-btn"
                        :class="{
                          selected: schedule.time === slot.time,
                          booked: slot.status === 'booked',
                          'patient-conflict': slot.status === 'patient_conflict'
                        }"
                        :disabled="slot.status !== 'available'"
                        @click="selectTime(slot)"
                      >
                        <p class="slot-time">{{ formatTime(slot.time) }}</p>
                        <p class="slot-status" :class="slot.status">
                          <v-icon v-if="schedule.time === slot.time" name="hi-check-circle" scale="0.7" />
                          <v-icon v-else-if="slot.status === 'available'" name="hi-check-circle" scale="0.7" />
                          <v-icon v-else-if="slot.status === 'patient_conflict'" name="hi-user" scale="0.7" />
                          <v-icon v-else-if="slot.status === 'booked'" name="hi-ban" scale="0.7" />
                          <v-icon v-else name="hi-exclamation-triangle" scale="0.7" />
                          {{ getSlotStatusLabel(slot) }}
                        </p>
                      </button>
                    </div>
                  </div>

                  <!-- Evening Slots -->
                  <div v-if="eveningSlots.length > 0" class="time-section">
                    <div class="time-section-header">
                      <h3><v-icon name="fa-moon" scale="0.9" class="evening-icon" />Evening (5:00 PM - 9:00 PM)</h3>
                      <span>{{ eveningSlots.length }} slots</span>
                    </div>
                    <div class="time-slots-grid">
                      <button
                        v-for="slot in eveningSlots"
                        :key="slot.time"
                        class="time-slot-btn"
                        :class="{
                          selected: schedule.time === slot.time,
                          booked: slot.status === 'booked',
                          'patient-conflict': slot.status === 'patient_conflict'
                        }"
                        :disabled="slot.status !== 'available'"
                        @click="selectTime(slot)"
                      >
                        <p class="slot-time">{{ formatTime(slot.time) }}</p>
                        <p class="slot-status" :class="slot.status">
                          <v-icon v-if="schedule.time === slot.time" name="hi-check-circle" scale="0.7" />
                          <v-icon v-else-if="slot.status === 'available'" name="hi-check-circle" scale="0.7" />
                          <v-icon v-else-if="slot.status === 'patient_conflict'" name="hi-user" scale="0.7" />
                          <v-icon v-else-if="slot.status === 'booked'" name="hi-ban" scale="0.7" />
                          <v-icon v-else name="hi-exclamation-triangle" scale="0.7" />
                          {{ getSlotStatusLabel(slot) }}
                        </p>
                      </button>
                    </div>
                  </div>

                  <!-- No Slots Available -->
                  <div v-if="morningSlots.length === 0 && afternoonSlots.length === 0 && eveningSlots.length === 0" class="no-slots">
                    <v-icon name="hi-calendar" scale="2" />
                    <p>No available slots for this date</p>
                    <button class="custom-time-btn" @click="showCustomTimeModal = true">
                      <v-icon name="hi-plus" scale="0.9" />Add Custom Time
                    </button>
                  </div>

                  <!-- Custom Time Option -->
                  <div v-else class="custom-time-section">
                    <button class="custom-time-btn" @click="showCustomTimeModal = true">
                      <v-icon name="hi-plus" scale="0.9" />Add Custom Time Slot
                    </button>
                  </div>
                </div>
              </div>

              <!-- AI Suggested Times -->
              <div class="step-card ai-card">
                <div class="flex-header">
                  <div>
                    <h2>AI Suggested Times</h2>
                    <p class="subtitle">Based on availability patterns and optimal scheduling</p>
                  </div>
                  <span class="ai-badge">
                    <v-icon name="bi-stars" scale="0.8" />AI Powered
                  </span>
                </div>

                <div class="ai-suggestions-grid">
                  <div
                    v-for="(suggestion, index) in aiSuggestedTimes"
                    :key="index"
                    class="ai-suggestion-card"
                    :class="{ best: index === 0 }"
                    @click="applySuggestion(suggestion)"
                  >
                    <div class="suggestion-header">
                      <v-icon :name="index === 0 ? 'hi-star' : index === 1 ? 'hi-thumb-up' : 'hi-clock'" scale="1.2" />
                      <span class="suggestion-badge">{{ index === 0 ? 'Best Match' : index === 1 ? 'Good' : 'Alternative' }}</span>
                    </div>
                    <p class="suggestion-datetime">{{ suggestion.label }}</p>
                    <p class="suggestion-date">{{ suggestion.dateFormatted }}</p>
                    <div class="suggestion-score">
                      <v-icon name="hi-check-circle" scale="0.7" />
                      <span>{{ suggestion.score }}% compatibility</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Reminders & Buffer Time -->
              <div class="step-card">
                <h2 class="section-title">Reminders & Buffer Time</h2>

                <div class="reminders-section">
                  <h3>Set Reminders</h3>
                  <div class="reminder-options">
                    <label class="reminder-option">
                      <div class="reminder-left">
                        <input type="checkbox" v-model="schedule.reminders.email.enabled" />
                        <div class="reminder-info">
                          <p class="reminder-name">Email Reminder</p>
                          <p class="reminder-desc">Send to patient and doctor</p>
                        </div>
                      </div>
                      <select v-model="schedule.reminders.email.timing" :disabled="!schedule.reminders.email.enabled">
                        <option value="24h">24 hours before</option>
                        <option value="12h">12 hours before</option>
                        <option value="6h">6 hours before</option>
                        <option value="1h">1 hour before</option>
                      </select>
                    </label>

                    <label class="reminder-option">
                      <div class="reminder-left">
                        <input type="checkbox" v-model="schedule.reminders.sms.enabled" />
                        <div class="reminder-info">
                          <p class="reminder-name">SMS Reminder</p>
                          <p class="reminder-desc">Text message notification</p>
                        </div>
                      </div>
                      <select v-model="schedule.reminders.sms.timing" :disabled="!schedule.reminders.sms.enabled">
                        <option value="1h">1 hour before</option>
                        <option value="3h">3 hours before</option>
                        <option value="6h">6 hours before</option>
                        <option value="12h">12 hours before</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div class="buffer-section">
                  <h3>Buffer Time Settings</h3>
                  <div class="buffer-grid">
                    <div class="buffer-field">
                      <label>Before Appointment</label>
                      <select v-model="schedule.bufferBefore">
                        <option :value="0">No buffer</option>
                        <option :value="5">5 minutes</option>
                        <option :value="10">10 minutes</option>
                        <option :value="15">15 minutes</option>
                        <option :value="30">30 minutes</option>
                      </select>
                      <p class="field-hint">Time before appointment starts</p>
                    </div>
                    <div class="buffer-field">
                      <label>After Appointment</label>
                      <select v-model="schedule.bufferAfter">
                        <option :value="0">No buffer</option>
                        <option :value="5">5 minutes</option>
                        <option :value="10">10 minutes</option>
                        <option :value="15">15 minutes</option>
                        <option :value="30">30 minutes</option>
                      </select>
                      <p class="field-hint">Time after appointment ends</p>
                    </div>
                  </div>

                  <div class="info-banner info">
                    <v-icon name="hi-information-circle" scale="1.2" />
                    <div>
                      <p class="banner-title">Buffer Time Benefits</p>
                      <p class="banner-text">Buffer time helps prevent back-to-back scheduling, allows for preparation, and provides flexibility for appointments that run over time.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Custom Time Modal -->
            <div v-if="showCustomTimeModal" class="modal-overlay" @click.self="showCustomTimeModal = false">
              <div class="custom-time-modal">
                <div class="modal-header">
                  <h3>Add Custom Time Slot</h3>
                  <button class="close-btn" @click="showCustomTimeModal = false">
                    <v-icon name="hi-x" scale="1" />
                  </button>
                </div>
                <div class="modal-body">
                  <p class="modal-warning">
                    <v-icon name="hi-exclamation-triangle" scale="0.9" />
                    Adding a custom time may conflict with your defined availability. Use with caution.
                  </p>
                  <div class="custom-time-form">
                    <div class="form-group">
                      <label>Date</label>
                      <input type="date" v-model="customTimeEntry.date" :min="todayDate" />
                    </div>
                    <div class="form-group">
                      <label>Time</label>
                      <input type="time" v-model="customTimeEntry.time" />
                    </div>
                  </div>
                </div>
                <div class="modal-footer">
                  <button class="cancel-btn" @click="showCustomTimeModal = false">Cancel</button>
                  <button class="apply-btn" @click="applyCustomTime">Apply Custom Time</button>
                </div>
              </div>
            </div>

            <!-- Step 4: Fee & Payment -->
            <div v-if="currentStep === 4" class="step-card">
              <div class="step-content">
                <!-- Fee Structure Section -->
                <div class="section-header">
                  <h2>Consultation Fee</h2>
                  <p>Set the fee for this appointment based on your rate card</p>
                </div>

                <div class="fee-structure">
                  <div class="fee-card">
                    <div class="fee-header">
                      <div class="fee-icon">
                        <v-icon name="hi-currency-dollar" scale="1.2" />
                      </div>
                      <div class="fee-info">
                        <h4>{{ getVisitReasonLabel(appointmentDetails.visitReason) || 'Consultation' }}</h4>
                        <p>{{ getChannelLabel(appointmentDetails.channel) }} • {{ schedule.duration }} minutes</p>
                      </div>
                    </div>

                    <div class="fee-amounts">
                      <div class="fee-row">
                        <span class="fee-label">Consultation Fee</span>
                        <span class="fee-value">{{ formatCurrency(displayFee) }}</span>
                      </div>
                      <div class="fee-row">
                        <span class="fee-label">Platform Fee</span>
                        <span class="fee-value">{{ formatCurrency(payment.platformFee) }}</span>
                      </div>
                      <div class="fee-row total">
                        <span class="fee-label">Total Amount</span>
                        <span class="fee-value">{{ formatCurrency(payment.totalAmount) }}</span>
                      </div>
                    </div>

                    <div class="custom-fee-toggle">
                      <label class="toggle-label">
                        <input
                          type="checkbox"
                          :checked="payment.useCustomFee"
                          @change="setCustomFee($event.target.checked)"
                        />
                        <span>Use Custom Fee</span>
                      </label>
                      <div v-if="payment.useCustomFee" class="custom-fee-input">
                        <span class="currency-prefix">₦</span>
                        <input
                          type="text"
                          inputmode="numeric"
                          pattern="[0-9]*"
                          placeholder="Enter amount"
                          :value="formatCustomFeeDisplay(payment.customFee)"
                          @input="handleCustomFeeInput($event)"
                          @keypress="preventNonNumeric($event)"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Payment Method Section -->
                <div class="section-header" style="margin-top: 2rem;">
                  <h2>Payment Method</h2>
                  <p>Choose how this appointment will be paid for</p>
                </div>

                <div class="payment-methods">
                  <!-- Card Payment -->
                  <div
                    class="payment-option"
                    :class="{ selected: payment.source === 'card' }"
                    @click="selectPaymentSource('card')"
                  >
                    <div class="payment-icon card">
                      <v-icon name="hi-credit-card" scale="1.2" />
                    </div>
                    <div class="payment-info">
                      <h4>Credit/Debit Card</h4>
                      <p>Patient will pay via Paystack at time of booking</p>
                    </div>
                    <div class="payment-check">
                      <v-icon v-if="payment.source === 'card'" name="hi-check-circle" scale="1.1" class="checked" />
                      <v-icon v-else name="hi-check-circle" scale="1.1" class="unchecked" />
                    </div>
                  </div>

                  <!-- Rapid Wallet - Patient -->
                  <div
                    class="payment-option"
                    :class="{
                      selected: payment.source === 'patient_wallet',
                      disabled: !canSelectPatientWallet,
                      error: patientWalletError && payment.source !== 'patient_wallet'
                    }"
                    @click="selectPaymentSource('patient_wallet')"
                  >
                    <div class="payment-icon wallet-patient">
                      <v-icon name="bi-wallet2" scale="1.2" />
                    </div>
                    <div class="payment-info">
                      <h4>Patient's Rapid Wallet</h4>
                      <p v-if="patientWallet.isLoading">Checking patient wallet...</p>
                      <p v-else-if="!patientWallet.has_wallet" class="error-text">Patient does not have a wallet</p>
                      <p v-else-if="!patientWallet.allow_specialist_charge" class="error-text">Patient has disabled specialist wallet charges</p>
                      <p v-else-if="patientWallet.available_balance < payment.totalAmount" class="error-text">Insufficient funds in patient wallet</p>
                      <p v-else class="success-text">
                        <v-icon name="hi-check-circle" scale="0.8" /> Patient has sufficient funds
                      </p>
                    </div>
                    <div class="payment-check">
                      <v-icon v-if="patientWallet.isLoading" name="hi-refresh" scale="1" class="spin" />
                      <v-icon v-else-if="payment.source === 'patient_wallet'" name="hi-check-circle" scale="1.1" class="checked" />
                      <v-icon v-else-if="!canSelectPatientWallet" name="hi-x-circle" scale="1.1" class="error" />
                      <v-icon v-else name="hi-check-circle" scale="1.1" class="unchecked" />
                    </div>
                  </div>

                  <!-- Rapid Wallet - Specialist (Complimentary) -->
                  <div
                    class="payment-option specialist-wallet"
                    :class="{
                      selected: payment.source === 'specialist_wallet',
                      disabled: !canSelectSpecialistWallet,
                      error: specialistWalletError && payment.source !== 'specialist_wallet'
                    }"
                    @click="selectPaymentSource('specialist_wallet')"
                  >
                    <div class="payment-icon wallet-specialist">
                      <v-icon name="hi-gift" scale="1.2" />
                    </div>
                    <div class="payment-info">
                      <h4>Complimentary (Your Wallet)</h4>
                      <p v-if="specialistWallet.isLoading">Loading your wallet balance...</p>
                      <p v-else-if="specialistWalletError" class="error-text">{{ specialistWalletError }}</p>
                      <p v-else>
                        Free for patient • Your balance: {{ formatCurrency(specialistWallet.available_balance) }}
                      </p>
                      <span class="payment-tag">For courtesy appointments or cash already received</span>
                    </div>
                    <div class="payment-check">
                      <v-icon v-if="specialistWallet.isLoading" name="hi-refresh" scale="1" class="spin" />
                      <v-icon v-else-if="payment.source === 'specialist_wallet'" name="hi-check-circle" scale="1.1" class="checked" />
                      <v-icon v-else-if="!canSelectSpecialistWallet" name="hi-x-circle" scale="1.1" class="error" />
                      <v-icon v-else name="hi-check-circle" scale="1.1" class="unchecked" />
                    </div>
                  </div>
                </div>

                <!-- Payment Info Banner -->
                <div v-if="payment.source" class="info-banner info" style="margin-top: 1.5rem;">
                  <v-icon name="hi-information-circle" scale="1.1" />
                  <div>
                    <p class="banner-text" v-if="payment.source === 'card'">
                      Patient will be redirected to Paystack to complete payment when the appointment is confirmed.
                    </p>
                    <p class="banner-text" v-else-if="payment.source === 'patient_wallet'">
                      The amount of {{ formatCurrency(payment.totalAmount) }} will be debited from the patient's Rapid Wallet upon your confirmation.
                    </p>
                    <p class="banner-text" v-else-if="payment.source === 'specialist_wallet'">
                      The amount of {{ formatCurrency(payment.totalAmount) }} will be debited from your wallet. This is typically used for complimentary appointments or when you've already collected cash from the patient.
                    </p>
                  </div>
                </div>

                <!-- Pay Now Button (for wallet payments) -->
                <div v-if="payment.source && payment.source !== 'card'" class="pay-now-section">
                  <div v-if="paymentConsentGiven" class="payment-confirmed">
                    <v-icon name="hi-check-circle" scale="1.2" />
                    <div>
                      <h4>Payment Authorized</h4>
                      <p>{{ formatCurrency(payment.totalAmount) }} will be charged from {{ payment.source === 'patient_wallet' ? "patient's wallet" : 'your wallet' }}</p>
                    </div>
                    <button class="change-btn" @click="resetPaymentConsent">Change</button>
                  </div>
                  <button
                    v-else
                    class="pay-now-btn"
                    :disabled="(payment.source === 'patient_wallet' && !canSelectPatientWallet) || (payment.source === 'specialist_wallet' && !canSelectSpecialistWallet)"
                    @click="showPaymentConsentModal = true"
                  >
                    <v-icon name="hi-lock-closed" scale="0.9" />
                    Authorize Payment of {{ formatCurrency(payment.totalAmount) }}
                  </button>
                </div>

                <!-- Channel Configuration Section -->
                <div class="section-header" style="margin-top: 2rem;">
                  <h2>Channel Configuration</h2>
                  <p>Settings for your {{ getChannelLabel(appointmentDetails.channel) || 'appointment' }}</p>
                </div>

                <div class="channel-config">
                  <div v-if="appointmentDetails.channel === 'zoom'" class="channel-options">
                    <label class="config-option">
                      <input
                        type="checkbox"
                        v-model="payment.autoGenerateLink"
                      />
                      <div class="option-content">
                        <span class="option-name">Auto-generate Meeting Link</span>
                        <span class="option-desc">Automatically create a Zoom meeting link for this appointment</span>
                      </div>
                    </label>

                    <label class="config-option">
                      <input
                        type="checkbox"
                        v-model="payment.enableWaitingRoom"
                      />
                      <div class="option-content">
                        <span class="option-name">Enable Waiting Room</span>
                        <span class="option-desc">Patient waits for you to admit them to the meeting</span>
                      </div>
                    </label>

                    <label class="config-option">
                      <input
                        type="checkbox"
                        v-model="payment.recordSession"
                      />
                      <div class="option-content">
                        <span class="option-name">Record Session</span>
                        <span class="option-desc">Record the video consultation for your records</span>
                      </div>
                    </label>
                  </div>

                  <div v-else-if="appointmentDetails.channel === 'phone'" class="channel-info-box">
                    <v-icon name="hi-phone" scale="1.2" />
                    <div>
                      <h4>Phone Consultation</h4>
                      <p>You or the patient will initiate the call at the scheduled time. Make sure your phone number is up to date in your profile settings.</p>
                    </div>
                  </div>

                  <div v-else-if="appointmentDetails.channel === 'in_person'" class="channel-info-box">
                    <v-icon name="hi-office-building" scale="1.2" />
                    <div>
                      <h4>In-Person Visit</h4>
                      <p>Patient will visit you at your clinic/office location. Ensure your practice address is current in your profile.</p>
                    </div>
                  </div>

                  <div v-else-if="appointmentDetails.channel === 'whatsapp'" class="channel-info-box">
                    <v-icon name="bi-whatsapp" scale="1.2" />
                    <div>
                      <h4>WhatsApp Call</h4>
                      <p>Video or voice call via WhatsApp. Ensure your WhatsApp number is configured in your settings.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Payment Consent Modal -->
            <div v-if="showPaymentConsentModal" class="modal-overlay" @click.self="showPaymentConsentModal = false">
              <div class="payment-consent-modal">
                <div class="modal-header">
                  <h3>Confirm Payment Authorization</h3>
                  <button class="close-btn" @click="showPaymentConsentModal = false">
                    <v-icon name="hi-x" scale="1" />
                  </button>
                </div>

                <div class="modal-body">
                  <div class="consent-summary">
                    <div class="consent-amount">
                      <span class="label">Amount</span>
                      <span class="value">{{ formatCurrency(payment.totalAmount) }}</span>
                    </div>
                    <div class="consent-source">
                      <span class="label">Payment Source</span>
                      <span class="value">
                        <v-icon v-if="payment.source === 'patient_wallet'" name="bi-wallet2" scale="0.9" />
                        <v-icon v-else name="hi-gift" scale="0.9" />
                        {{ payment.source === 'patient_wallet' ? "Patient's Rapid Wallet" : 'Your Wallet (Complimentary)' }}
                      </span>
                    </div>
                    <div class="consent-patient">
                      <span class="label">Patient</span>
                      <span class="value">{{ patient.name || manualPatientName }}</span>
                    </div>
                  </div>

                  <div class="consent-warning" v-if="payment.source === 'patient_wallet'">
                    <v-icon name="hi-exclamation-triangle" scale="1" />
                    <div>
                      <p><strong>Important:</strong> By authorizing this payment, you confirm that:</p>
                      <ul>
                        <li>You have the patient's consent to charge their wallet</li>
                        <li>The appointment details are accurate</li>
                        <li>This action cannot be easily reversed</li>
                      </ul>
                    </div>
                  </div>

                  <div class="consent-warning specialist" v-else>
                    <v-icon name="hi-information-circle" scale="1" />
                    <div>
                      <p><strong>Note:</strong> By authorizing this payment, you confirm that:</p>
                      <ul>
                        <li>You're offering this appointment as complimentary, OR</li>
                        <li>You've already collected payment from the patient (cash/transfer)</li>
                        <li>The amount will be deducted from your wallet balance</li>
                      </ul>
                    </div>
                  </div>

                  <label class="consent-checkbox-label">
                    <input type="checkbox" v-model="paymentConsentChecked" />
                    <span>I understand and authorize this payment of {{ formatCurrency(payment.totalAmount) }}</span>
                  </label>
                </div>

                <div class="modal-footer">
                  <button class="cancel-btn" @click="showPaymentConsentModal = false">
                    Cancel
                  </button>
                  <button
                    class="confirm-btn"
                    :disabled="!paymentConsentChecked || isProcessingPayment"
                    @click="confirmPaymentConsent"
                  >
                    <v-icon v-if="isProcessingPayment" name="hi-refresh" scale="0.9" class="spin" />
                    <v-icon v-else name="hi-lock-closed" scale="0.9" />
                    {{ isProcessingPayment ? 'Processing...' : 'Authorize Payment' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- ===================== -->
            <!-- STEP 5: Notes & Instructions -->
            <!-- ===================== -->
            <div v-if="currentStep === 5" class="step-card step-5-notes-card">
              <div class="step-content step-5-content">
                <!-- Internal Notes Section -->
                <div class="notes-section internal-notes">
                  <div class="section-header-with-badge">
                    <div class="section-header">
                      <h2>Internal Notes</h2>
                      <p>Private notes visible only to healthcare providers</p>
                    </div>
                    <span class="privacy-badge private">
                      <v-icon name="hi-lock-closed" scale="0.7" />
                      Private
                    </span>
                  </div>

                  <div class="form-group">
                    <label>Clinical Notes</label>
                    <textarea
                      v-model="notes.clinicalNotes"
                      rows="6"
                      placeholder="Add clinical observations, patient history, special considerations, or any internal notes for the medical team..."
                    ></textarea>
                    <div class="textarea-footer">
                      <p class="help-text">These notes are confidential and HIPAA compliant</p>
                    </div>
                  </div>

                  <div class="step5-form-fields">
                    <div class="form-group">
                      <label>Note Category</label>
                      <select v-model="notes.noteCategory">
                        <option v-for="cat in noteCategories" :key="cat" :value="cat">{{ cat }}</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Priority Level</label>
                      <select v-model="notes.priorityLevel">
                        <option v-for="level in priorityLevels" :key="level" :value="level">{{ level }}</option>
                      </select>
                    </div>
                  </div>

                  <div class="templates-section">
                    <h3>Quick Templates</h3>
                    <div class="step5-templates-list">
                      <button
                        v-for="template in internalTemplates"
                        :key="template.id"
                        class="template-btn"
                        @click="insertInternalTemplate(template)"
                      >
                        <v-icon name="hi-document-text" scale="0.9" />
                        <div class="template-info">
                          <p class="template-name">{{ template.name }}</p>
                          <p class="template-desc">{{ template.description }}</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Patient-Visible Notes Section -->
                <div class="notes-section patient-notes">
                  <div class="section-header-with-badge">
                    <div class="section-header">
                      <h2>Patient-Visible Notes</h2>
                      <p>Information shared with the patient before appointment</p>
                    </div>
                    <span class="privacy-badge visible">
                      <v-icon name="hi-eye" scale="0.7" />
                      Visible to Patient
                    </span>
                  </div>

                  <div class="form-group">
                    <label>Pre-Visit Instructions</label>
                    <textarea
                      v-model="notes.patientInstructions"
                      rows="5"
                      placeholder="Add instructions for the patient to prepare for the appointment (e.g., fasting requirements, documents to bring, symptoms to monitor)..."
                    ></textarea>
                    <p class="help-text">Patient will receive these instructions via email and SMS</p>
                  </div>

                  <div class="templates-section">
                    <h3>Message Templates</h3>
                    <div class="step5-patient-templates">
                      <button
                        v-for="template in patientInstructionTemplates"
                        :key="template.id"
                        class="patient-template-btn"
                        @click="insertPatientTemplate(template)"
                      >
                        <v-icon :name="template.icon" scale="1.1" />
                        <div class="template-content">
                          <p class="template-name">{{ template.name }}</p>
                          <p class="template-preview">{{ template.content }}</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div class="info-card success">
                    <v-icon name="hi-information-circle" scale="1" />
                    <div>
                      <p class="info-title">Automatic Reminders</p>
                      <p class="info-text">These instructions will be sent to the patient 24 hours before the appointment and again 1 hour before.</p>
                    </div>
                  </div>
                </div>

                <!-- Attachments Section -->
                <div class="notes-section attachments-section">
                  <div class="section-header-row">
                    <div class="section-header">
                      <h2>Attachments</h2>
                      <p>Upload relevant documents, referrals, or lab results</p>
                    </div>
                    <button class="add-files-btn" @click="triggerFileUpload">
                      <v-icon name="hi-paper-clip" scale="0.9" />
                      Add Files
                    </button>
                    <input
                      ref="fileInputRef"
                      type="file"
                      multiple
                      class="hidden-input"
                      @change="handleFileUpload"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                    />
                  </div>

                  <div class="step5-upload-zones">
                    <div class="upload-zone" @click="triggerFileUpload">
                      <v-icon name="hi-document-add" scale="1.5" />
                      <p class="zone-title">Referral Letter</p>
                      <p class="zone-desc">Upload referral document</p>
                    </div>
                    <div class="upload-zone" @click="triggerFileUpload">
                      <v-icon name="bi-file-earmark-medical" scale="1.5" />
                      <p class="zone-title">Lab Results</p>
                      <p class="zone-desc">Upload test results</p>
                    </div>
                    <div class="upload-zone" @click="triggerFileUpload">
                      <v-icon name="hi-photograph" scale="1.5" />
                      <p class="zone-title">Imaging Reports</p>
                      <p class="zone-desc">Upload scans/X-rays</p>
                    </div>
                    <div class="upload-zone" @click="triggerFileUpload">
                      <v-icon name="hi-document" scale="1.5" />
                      <p class="zone-title">Other Documents</p>
                      <p class="zone-desc">Upload any files</p>
                    </div>
                  </div>

                  <!-- Uploaded Files List -->
                  <div v-if="notes.attachments.length > 0" class="uploaded-files">
                    <div
                      v-for="(file, index) in notes.attachments"
                      :key="index"
                      class="uploaded-file"
                    >
                      <div class="file-icon" :class="getFileTypeClass(file.name)">
                        <v-icon :name="getFileIcon(file.name)" scale="1.2" />
                      </div>
                      <div class="file-info">
                        <p class="file-name">{{ file.name }}</p>
                        <p class="file-meta">{{ formatFileSize(file.size) }} • Uploaded just now</p>
                      </div>
                      <div class="file-actions">
                        <button class="file-action-btn" @click="previewFile(file)" title="Preview">
                          <v-icon name="hi-eye" scale="0.9" />
                        </button>
                        <button class="file-action-btn danger" @click="removeFile(index)" title="Remove">
                          <v-icon name="hi-trash" scale="0.9" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="info-card warning">
                    <v-icon name="hi-shield-check" scale="1" />
                    <div>
                      <p class="info-title">Secure File Storage</p>
                      <p class="info-text">All files are encrypted and stored securely in compliance with HIPAA regulations. Maximum file size: 25 MB per file.</p>
                    </div>
                  </div>
                </div>

                <!-- Patient Consent Section (Only for new/unassociated patients) -->
                <div v-if="isConsentRequired" class="notes-section consent-section">
                  <div class="section-header-with-badge">
                    <div class="section-header">
                      <h2>Patient Consent & Permissions</h2>
                      <p>Required when booking on behalf of unassociated patients</p>
                    </div>
                    <span class="privacy-badge required">
                      <v-icon name="hi-exclamation" scale="0.7" />
                      Required
                    </span>
                  </div>

                  <div class="consent-alert">
                    <div class="consent-alert-icon">
                      <v-icon name="hi-shield-check" scale="1.5" />
                    </div>
                    <div class="consent-alert-content">
                      <h3>Booking for {{ patient.selectionType === 'manual' ? 'New' : 'Unassociated' }} Patient</h3>
                      <p>You are creating an appointment for <strong>{{ patient.name || manualPatientName }}</strong> who is {{ patient.selectionType === 'manual' ? 'a new patient being registered' : 'not currently associated with your practice' }}. You must confirm that you have explicit permission to schedule this appointment on their behalf.</p>

                      <div class="consent-checkboxes">
                        <label class="consent-checkbox">
                          <input type="checkbox" v-model="patientConsent.verbalConsent" />
                          <span class="checkbox-text">I confirm that I have obtained verbal or written consent from the patient to schedule this appointment</span>
                        </label>
                        <label class="consent-checkbox">
                          <input type="checkbox" v-model="patientConsent.identityVerified" />
                          <span class="checkbox-text">I have verified the patient's identity and contact information</span>
                        </label>
                        <label class="consent-checkbox">
                          <input type="checkbox" v-model="patientConsent.notificationAware" />
                          <span class="checkbox-text">The patient is aware that appointment details will be sent to their provided email and phone number</span>
                        </label>
                        <label class="consent-checkbox">
                          <input type="checkbox" v-model="patientConsent.temporaryAssociation" />
                          <span class="checkbox-text">I understand that this booking creates a temporary association until the patient confirms their account</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div class="step5-form-fields">
                    <div class="form-group">
                      <label>Consent Method</label>
                      <select v-model="patientConsent.consentMethod">
                        <option v-for="method in consentMethods" :key="method" :value="method">{{ method }}</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Consent Date & Time</label>
                      <input type="datetime-local" v-model="patientConsent.consentDateTime" />
                    </div>
                  </div>

                  <div class="form-group">
                    <label>Additional Consent Notes</label>
                    <textarea
                      v-model="patientConsent.additionalNotes"
                      rows="3"
                      placeholder="Add any additional notes about how consent was obtained..."
                    ></textarea>
                  </div>

                  <div class="info-card info" v-if="patient.selectionType === 'manual'">
                    <v-icon name="hi-information-circle" scale="1" />
                    <div>
                      <p class="info-title">Patient Account Creation</p>
                      <p class="info-text">An account invitation will be sent to {{ patient.name || manualPatientName }} after this appointment is confirmed. The patient must verify their account to access the patient portal and future appointment management.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ===================== -->
            <!-- STEP 6: Review & Confirm -->
            <!-- ===================== -->
            <div v-if="currentStep === 6" class="step-6-review">
              <!-- Appointment Summary Hero Card -->
              <div class="appointment-summary-hero">
                <div class="summary-hero-header">
                  <div>
                    <h2>Appointment Summary</h2>
                    <p>Review all details before confirming</p>
                  </div>
                  <div class="appointment-id-badge">
                    <p class="id-label">Appointment ID</p>
                    <p class="id-value">#APT-{{ generatedAppointmentId }}</p>
                  </div>
                </div>

                <div class="summary-hero-grid">
                  <div class="summary-hero-item">
                    <div class="item-icon">
                      <v-icon name="hi-calendar" scale="1.2" />
                    </div>
                    <p class="item-label">Date</p>
                    <p class="item-value">{{ formatReviewDate(schedule.date) }}</p>
                  </div>
                  <div class="summary-hero-item">
                    <div class="item-icon">
                      <v-icon name="hi-clock" scale="1.2" />
                    </div>
                    <p class="item-label">Time</p>
                    <p class="item-value">{{ formatReviewTime(schedule.time) }}</p>
                  </div>
                  <div class="summary-hero-item">
                    <div class="item-icon">
                      <v-icon name="bi-hourglass-split" scale="1.2" />
                    </div>
                    <p class="item-label">Duration</p>
                    <p class="item-value">{{ schedule.duration }} minutes</p>
                  </div>
                </div>
              </div>

              <!-- Patient Information Section -->
              <div class="review-section">
                <div class="section-header-row">
                  <h3><v-icon name="hi-user" scale="1" />Patient Information</h3>
                  <button class="edit-btn" @click="goToStep(1)">
                    <v-icon name="hi-pencil" scale="0.8" />Edit
                  </button>
                </div>

                <div class="patient-review-card">
                  <div class="patient-review-avatar">
                    <img v-if="patient.patientData?.profile?.profile_image || patient.avatar" :src="patient.patientData?.profile?.profile_image || patient.avatar" :alt="patient.name" />
                    <span v-else class="avatar-initials large">{{ getPatientInitials() }}</span>
                  </div>
                  <div class="patient-review-info">
                    <h4>{{ patient.name || manualPatientName }}</h4>
                    <div class="patient-details-grid">
                      <div class="detail-item">
                        <div class="detail-icon blue">
                          <v-icon name="hi-mail" scale="0.9" />
                        </div>
                        <div>
                          <p class="detail-label">Email</p>
                          <p class="detail-value">{{ patient.email || manualPatient.email || 'Not provided' }}</p>
                        </div>
                      </div>
                      <div class="detail-item">
                        <div class="detail-icon green">
                          <v-icon name="hi-phone" scale="0.9" />
                        </div>
                        <div>
                          <p class="detail-label">Phone</p>
                          <p class="detail-value">{{ patient.phone || manualPatient.phone || 'Not provided' }}</p>
                        </div>
                      </div>
                      <div class="detail-item">
                        <div class="detail-icon purple">
                          <v-icon name="hi-cake" scale="0.9" />
                        </div>
                        <div>
                          <p class="detail-label">Date of Birth</p>
                          <p class="detail-value">{{ formatDOB(patient.dateOfBirth || manualPatient.dateOfBirth) }}</p>
                        </div>
                      </div>
                      <div class="detail-item">
                        <div class="detail-icon pink">
                          <v-icon name="hi-user" scale="0.9" />
                        </div>
                        <div>
                          <p class="detail-label">Gender</p>
                          <p class="detail-value">{{ capitalizeFirst(patient.gender || manualPatient.gender) || 'Not specified' }}</p>
                        </div>
                      </div>
                    </div>

                    <div v-if="isConsentRequired" class="new-patient-alert">
                      <v-icon name="hi-exclamation-triangle" scale="1" />
                      <div>
                        <p class="alert-title">{{ patient.selectionType === 'manual' ? 'New Patient' : 'Unassociated Patient' }}</p>
                        <p class="alert-text">Account invitation will be sent after confirmation</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Appointment Details Section -->
              <div class="review-section">
                <div class="section-header-row">
                  <h3><v-icon name="hi-clipboard-list" scale="1" />Appointment Details</h3>
                  <button class="edit-btn" @click="goToStep(2)">
                    <v-icon name="hi-pencil" scale="0.8" />Edit
                  </button>
                </div>

                <div class="details-grid">
                  <div class="detail-card">
                    <p class="card-label">Appointment Type</p>
                    <p class="card-value">{{ getVisitReasonLabel(appointmentDetails.visitReason) }}</p>
                    <p class="card-desc">{{ getVisitReasonDescription(appointmentDetails.visitReason) }}</p>
                  </div>
                  <div class="detail-card">
                    <p class="card-label">Consultation Channel</p>
                    <p class="card-value">{{ getChannelLabel(appointmentDetails.channel) }}</p>
                    <p class="card-desc">{{ getChannelDescription(appointmentDetails.channel) }}</p>
                  </div>
                  <div v-if="appointmentDetails.specialty" class="detail-card">
                    <p class="card-label">Specialty</p>
                    <p class="card-value">{{ getSpecialtyLabel(appointmentDetails.specialty) }}</p>
                  </div>
                  <div v-if="appointmentDetails.clinicalFlags?.length" class="detail-card">
                    <p class="card-label">Clinical Flags</p>
                    <div class="flags-list">
                      <span v-for="flag in appointmentDetails.clinicalFlags" :key="flag" class="flag-badge">{{ flag }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Schedule & Timing Section -->
              <div class="review-section">
                <div class="section-header-row">
                  <h3><v-icon name="hi-calendar" scale="1" />Schedule & Timing</h3>
                  <button class="edit-btn" @click="goToStep(3)">
                    <v-icon name="hi-pencil" scale="0.8" />Edit
                  </button>
                </div>

                <div class="schedule-grid">
                  <div class="schedule-card blue">
                    <div class="schedule-icon">
                      <v-icon name="hi-calendar" scale="1.2" />
                    </div>
                    <p class="schedule-label">Date</p>
                    <p class="schedule-day">{{ formatScheduleDay(schedule.date) }}</p>
                    <p class="schedule-full-date">{{ formatScheduleFullDate(schedule.date) }}</p>
                  </div>
                  <div class="schedule-card green">
                    <div class="schedule-icon">
                      <v-icon name="hi-clock" scale="1.2" />
                    </div>
                    <p class="schedule-label">Time</p>
                    <p class="schedule-time">{{ formatReviewTime(schedule.time) }}</p>
                    <p class="schedule-timezone">{{ schedule.timezone }}</p>
                  </div>
                  <div class="schedule-card purple">
                    <div class="schedule-icon">
                      <v-icon name="bi-hourglass-split" scale="1.2" />
                    </div>
                    <p class="schedule-label">Duration</p>
                    <p class="schedule-duration">{{ schedule.duration }} min</p>
                    <p class="schedule-end">{{ calculateEndTime(schedule.time, schedule.duration) }} end</p>
                  </div>
                </div>

                <div class="reminders-info">
                  <v-icon name="hi-bell" scale="1.1" />
                  <div>
                    <p class="reminders-title">Automated Reminders Enabled</p>
                    <p class="reminders-text">Patient will receive reminders {{ schedule.reminders.email.enabled ? schedule.reminders.email.timing : '' }}{{ schedule.reminders.email.enabled && schedule.reminders.sms.enabled ? ' and ' : '' }}{{ schedule.reminders.sms.enabled ? schedule.reminders.sms.timing : '' }} before the appointment via {{ schedule.reminders.email.enabled ? 'email' : '' }}{{ schedule.reminders.email.enabled && schedule.reminders.sms.enabled ? ' and ' : '' }}{{ schedule.reminders.sms.enabled ? 'SMS' : '' }}</p>
                  </div>
                </div>
              </div>

              <!-- Channel & Payment Section -->
              <div class="review-section">
                <div class="section-header-row">
                  <h3><v-icon name="hi-credit-card" scale="1" />Channel & Payment</h3>
                  <button class="edit-btn" @click="goToStep(4)">
                    <v-icon name="hi-pencil" scale="0.8" />Edit
                  </button>
                </div>

                <div class="channel-payment-grid">
                  <div class="channel-card">
                    <div class="channel-header">
                      <div class="channel-icon">
                        <v-icon :name="getChannelIcon(appointmentDetails.channel)" scale="1.3" />
                      </div>
                      <div>
                        <p class="channel-label">Consultation Channel</p>
                        <p class="channel-value">{{ getChannelLabel(appointmentDetails.channel) }}</p>
                      </div>
                    </div>
                    <p class="channel-desc">Meeting link will be generated and sent to both parties</p>
                  </div>
                  <div class="fee-card">
                    <div class="fee-header">
                      <div class="fee-icon">
                        <v-icon name="hi-currency-dollar" scale="1.3" />
                      </div>
                      <div>
                        <p class="fee-label">Consultation Fee</p>
                        <p class="fee-value">{{ formatCurrency(displayFee) }}</p>
                      </div>
                    </div>
                    <p class="fee-desc">{{ getPaymentSourceLabel(payment.source) }}</p>
                  </div>
                </div>

                <div class="payment-breakdown">
                  <h4>Payment Breakdown</h4>
                  <div class="breakdown-rows">
                    <div class="breakdown-row">
                      <span>Consultation Fee</span>
                      <span>{{ formatCurrency(displayFee) }}</span>
                    </div>
                    <div class="breakdown-row">
                      <span>Platform Fee</span>
                      <span>{{ formatCurrency(payment.platformFee) }}</span>
                    </div>
                    <div class="breakdown-row total">
                      <span>Total Amount</span>
                      <span class="total-value">{{ formatCurrency(payment.totalAmount) }}</span>
                    </div>
                    <div class="breakdown-row earnings">
                      <span>Your Earnings</span>
                      <span class="earnings-value">{{ formatCurrency(displayFee) }}</span>
                    </div>
                  </div>
                  <div v-if="paymentConsentGiven" class="payment-status success">
                    <v-icon name="hi-check-circle" scale="1" />
                    <span>Payment Authorized (Ref: {{ payment.paymentReference }})</span>
                  </div>
                </div>
              </div>

              <!-- Notes & Attachments Section -->
              <div class="review-section">
                <div class="section-header-row">
                  <h3><v-icon name="hi-document-text" scale="1" />Notes & Attachments</h3>
                  <button class="edit-btn" @click="goToStep(5)">
                    <v-icon name="hi-pencil" scale="0.8" />Edit
                  </button>
                </div>

                <div class="notes-review-list">
                  <!-- Internal Notes -->
                  <div v-if="notes.clinicalNotes" class="notes-review-card private">
                    <div class="notes-card-header">
                      <div class="header-left">
                        <v-icon name="hi-lock-closed" scale="0.9" />
                        <h4>Internal Clinical Notes</h4>
                      </div>
                      <span class="privacy-tag private">Private</span>
                    </div>
                    <div class="notes-content">
                      <p>{{ notes.clinicalNotes }}</p>
                    </div>
                    <div class="notes-meta">
                      <span><v-icon name="hi-tag" scale="0.7" />Category: {{ notes.noteCategory }}</span>
                      <span><v-icon name="hi-flag" scale="0.7" />Priority: {{ notes.priorityLevel }}</span>
                    </div>
                  </div>

                  <!-- Patient Instructions -->
                  <div v-if="notes.patientInstructions" class="notes-review-card visible">
                    <div class="notes-card-header">
                      <div class="header-left">
                        <v-icon name="hi-eye" scale="0.9" />
                        <h4>Patient-Visible Instructions</h4>
                      </div>
                      <span class="privacy-tag visible">Visible</span>
                    </div>
                    <div class="notes-content">
                      <p>{{ notes.patientInstructions }}</p>
                    </div>
                  </div>

                  <!-- No notes message -->
                  <div v-if="!notes.clinicalNotes && !notes.patientInstructions" class="no-notes-message">
                    <v-icon name="hi-document-text" scale="1.5" />
                    <p>No notes added for this appointment</p>
                  </div>

                  <!-- Attachments -->
                  <div v-if="notes.attachments?.length" class="attachments-review-card">
                    <div class="notes-card-header">
                      <div class="header-left">
                        <v-icon name="hi-paper-clip" scale="0.9" />
                        <h4>Attachments ({{ notes.attachments.length }})</h4>
                      </div>
                    </div>
                    <div class="attachments-list">
                      <div v-for="(file, idx) in notes.attachments" :key="idx" class="attachment-item">
                        <div class="file-icon" :class="getFileTypeClass(file.name)">
                          <v-icon :name="getFileIcon(file.name)" scale="1" />
                        </div>
                        <div class="file-details">
                          <p class="file-name">{{ file.name }}</p>
                          <p class="file-size">{{ formatFileSize(file.size) }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Consent Verification Section (only if consent was required) -->
              <div v-if="isConsentRequired" class="review-section consent-verified-section">
                <div class="consent-verified-header">
                  <div class="consent-icon">
                    <v-icon name="hi-shield-check" scale="1.5" />
                  </div>
                  <div>
                    <h3>Patient Consent Verified</h3>
                    <p>All required consent confirmations have been completed</p>
                  </div>
                  <span class="verified-badge">
                    <v-icon name="hi-check-circle" scale="0.8" />Verified
                  </span>
                </div>

                <div class="consent-checks-grid">
                  <div class="consent-check-item" :class="{ checked: patientConsent.verbalConsent }">
                    <v-icon :name="patientConsent.verbalConsent ? 'hi-check-circle' : 'hi-x-circle'" scale="1" />
                    <span>Patient consent obtained</span>
                  </div>
                  <div class="consent-check-item" :class="{ checked: patientConsent.identityVerified }">
                    <v-icon :name="patientConsent.identityVerified ? 'hi-check-circle' : 'hi-x-circle'" scale="1" />
                    <span>Identity verified</span>
                  </div>
                  <div class="consent-check-item" :class="{ checked: patientConsent.notificationAware }">
                    <v-icon :name="patientConsent.notificationAware ? 'hi-check-circle' : 'hi-x-circle'" scale="1" />
                    <span>Patient notification confirmed</span>
                  </div>
                  <div class="consent-check-item" :class="{ checked: patientConsent.temporaryAssociation }">
                    <v-icon :name="patientConsent.temporaryAssociation ? 'hi-check-circle' : 'hi-x-circle'" scale="1" />
                    <span>Temporary association accepted</span>
                  </div>
                </div>

                <div class="consent-details">
                  <div class="consent-detail">
                    <p class="detail-label">Consent Method</p>
                    <p class="detail-value">{{ patientConsent.consentMethod }}</p>
                  </div>
                  <div class="consent-detail">
                    <p class="detail-label">Verified On</p>
                    <p class="detail-value">{{ formatConsentDateTime(patientConsent.consentDateTime) }}</p>
                  </div>
                </div>
              </div>

              <!-- Cancellation Policy Section -->
              <div class="review-section policy-section">
                <div class="policy-header">
                  <div class="policy-icon">
                    <v-icon name="hi-information-circle" scale="1.3" />
                  </div>
                  <div>
                    <h3>Cancellation Policy</h3>
                    <p>Please review the cancellation terms before confirming</p>
                  </div>
                </div>

                <div class="policy-items">
                  <div class="policy-item">
                    <v-icon name="hi-check-circle" scale="1" class="success" />
                    <div>
                      <p class="policy-title">Free Cancellation</p>
                      <p class="policy-desc">Cancel up to 24 hours before appointment for full refund</p>
                    </div>
                  </div>
                  <div class="policy-item">
                    <v-icon name="hi-exclamation-circle" scale="1" class="warning" />
                    <div>
                      <p class="policy-title">50% Refund</p>
                      <p class="policy-desc">Cancel between 24-6 hours before appointment</p>
                    </div>
                  </div>
                  <div class="policy-item">
                    <v-icon name="hi-x-circle" scale="1" class="danger" />
                    <div>
                      <p class="policy-title">No Refund</p>
                      <p class="policy-desc">Cancellations within 6 hours or no-shows are non-refundable</p>
                    </div>
                  </div>
                  <div class="policy-item info">
                    <v-icon name="hi-calendar" scale="1" class="info" />
                    <div>
                      <p class="policy-title">Rescheduling Policy</p>
                      <p class="policy-desc">Appointments can be rescheduled once without penalty if done 24+ hours in advance. Additional reschedules may incur a fee.</p>
                    </div>
                  </div>
                </div>

                <label class="policy-consent-checkbox">
                  <input type="checkbox" v-model="policyAccepted" />
                  <span>I have read and agree to the cancellation and rescheduling policy. I understand that these terms will be communicated to the patient.</span>
                </label>
              </div>

              <!-- Mobile Confirm Button (visible only on mobile) -->
              <div class="mobile-confirm-section">
                <div class="mobile-total-box">
                  <p class="total-label">Total Amount</p>
                  <p class="total-value">{{ formatCurrency(payment.totalAmount) }}</p>
                </div>

                <!-- Submission Error Display (Mobile) -->
                <div v-if="submissionError" class="mobile-submission-error">
                  <div class="error-header">
                    <v-icon name="hi-exclamation-circle" scale="1" />
                    <span>Booking Failed</span>
                  </div>
                  <p class="error-message">{{ submissionError.message }}</p>
                  <button v-if="submissionError.goToStep" class="error-action-btn" @click="goToStep(submissionError.goToStep); submissionError = null">
                    Go to Step {{ submissionError.goToStep }}
                  </button>
                </div>

                <button
                  class="mobile-confirm-btn"
                  :class="{ disabled: !canConfirmBooking }"
                  :disabled="!canConfirmBooking"
                  @click="submitAppointment"
                >
                  <v-icon v-if="isSubmitting" name="hi-refresh" scale="1" class="spin" />
                  <v-icon v-else-if="!policyAccepted" name="hi-lock-closed" scale="1" />
                  <v-icon v-else name="hi-check-circle" scale="1" />
                  {{ isSubmitting ? 'Creating...' : (!policyAccepted ? 'Accept Policy First' : 'Confirm Booking') }}
                </button>
                <p class="mobile-confirm-note">Patient will receive confirmation notification</p>
              </div>
            </div>
          </div>

          <!-- Right Sidebar (4 cols) -->
          <div class="right-sidebar">
            <!-- Selected Patient Card (Always First) -->
            <div class="sidebar-card selected-patient-card">
              <h3>
                <v-icon name="hi-user-check" scale="0.9" />
                Selected Patient
              </h3>

              <!-- No Patient Selected -->
              <div v-if="!patient.id && !isManualEntryValid" class="no-patient">
                <div class="no-patient-icon">
                  <v-icon name="hi-user" scale="2" />
                </div>
                <p class="no-patient-title">No patient selected</p>
                <p class="no-patient-text">Select an existing patient, search the platform, or manually enter patient details to continue</p>
              </div>

              <!-- Patient Selected -->
              <div v-else class="patient-selected">
                <div class="selected-patient-header">
                  <div class="selected-avatar">
                    <img v-if="patient.patientData?.profile?.profile_image || patient.avatar" :src="patient.patientData?.profile?.profile_image || patient.avatar" :alt="patient.name" />
                    <span v-else class="avatar-initials">{{ patient.name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?' }}</span>
                  </div>
                  <div class="selected-info">
                    <p class="selected-name">{{ patient.name || manualPatientName }}</p>
                    <p class="selected-email">{{ patient.email || manualPatient.email }}</p>
                  </div>
                </div>

                <div class="selected-details">
                  <div class="detail-row">
                    <span class="detail-label"><v-icon name="hi-identification" scale="0.8" />Patient ID</span>
                    <span class="detail-value">{{ patient.id?.slice(-6)?.toUpperCase() || 'NEW' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label"><v-icon name="hi-phone" scale="0.8" />Phone</span>
                    <span class="detail-value">{{ patient.phone || manualPatient.phone || 'N/A' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label"><v-icon name="hi-calendar" scale="0.8" />DOB</span>
                    <span class="detail-value">{{ formatDOB(patient.dateOfBirth || manualPatient.dateOfBirth) }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label"><v-icon name="hi-check-circle" scale="0.8" />Status</span>
                    <span class="status-badge small active">Active</span>
                  </div>
                  <div v-if="patient.lastVisit" class="detail-row">
                    <span class="detail-label"><v-icon name="hi-clock" scale="0.8" />Last Visit</span>
                    <span class="detail-value">{{ formatDate(patient.lastVisit) }}</span>
                  </div>
                </div>

                <!-- Consent Indicator for Platform/Manual -->
                <div v-if="patient.selectionType === 'platform' || patient.selectionType === 'manual'" class="consent-indicator">
                  <v-icon name="hi-shield-check" scale="0.9" />
                  <div>
                    <p class="consent-title">Consent Required</p>
                    <p class="consent-text">{{ patient.selectionType === 'platform' ? 'Not in your practice' : 'New patient' }}</p>
                  </div>
                </div>

                <button class="clear-selection-btn" @click="clearPatient">
                  <v-icon name="hi-x" scale="0.8" />
                  Clear Selection
                </button>
                <button class="view-profile-btn" @click="viewPatientProfile" :disabled="!patient.id">
                  <v-icon name="hi-user" scale="0.8" />
                  View Full Profile
                </button>
              </div>
            </div>

            <!-- Selected Date & Time Card (Step 3+) -->
            <div v-if="currentStep >= 3 && (schedule.date || schedule.time)" class="sidebar-card schedule-summary-card">
              <h3>
                <v-icon name="hi-calendar-check" scale="0.9" />
                Selected Date & Time
              </h3>

              <div class="schedule-display">
                <div class="date-block">
                  <div class="date-badge">
                    <p class="month">{{ schedule.date ? new Date(schedule.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : '--' }}</p>
                    <p class="day">{{ schedule.date ? new Date(schedule.date).getDate() : '--' }}</p>
                  </div>
                  <div class="date-info">
                    <p class="weekday">{{ schedule.date ? new Date(schedule.date).toLocaleDateString('en-US', { weekday: 'long' }) : 'No date' }}</p>
                    <p class="full-date">{{ schedule.date ? new Date(schedule.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Select a date' }}</p>
                  </div>
                </div>

                <div class="schedule-details">
                  <div class="schedule-row">
                    <v-icon name="hi-clock" scale="0.9" />
                    <div>
                      <p class="detail-label">Time</p>
                      <p class="detail-value">{{ schedule.time ? formatTime(schedule.time) : 'Not selected' }}</p>
                    </div>
                  </div>
                  <div class="schedule-row">
                    <v-icon name="hi-clock" scale="0.9" />
                    <div>
                      <p class="detail-label">Duration</p>
                      <p class="detail-value">{{ schedule.duration }} minutes</p>
                    </div>
                  </div>
                </div>

                <div class="schedule-status-badges">
                  <div class="status-badge-item success" v-if="schedule.date && schedule.time">
                    <v-icon name="hi-shield-check" scale="0.8" />
                    <span>No scheduling conflicts</span>
                  </div>
                  <div class="status-badge-item info" v-if="schedule.reminders.email.enabled || schedule.reminders.sms.enabled">
                    <v-icon name="hi-bell" scale="0.8" />
                    <span>{{ (schedule.reminders.email.enabled ? 1 : 0) + (schedule.reminders.sms.enabled ? 1 : 0) }} reminders active</span>
                  </div>
                  <div class="status-badge-item purple" v-if="schedule.bufferBefore > 0 || schedule.bufferAfter > 0">
                    <v-icon name="hi-clock" scale="0.8" />
                    <span>{{ schedule.bufferBefore + schedule.bufferAfter }} min buffer time</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Appointment Summary Card (Step 2+) -->
            <div v-if="currentStep >= 2" class="sidebar-card summary-card">
              <h3>
                <v-icon name="hi-clipboard-list" scale="0.9" />
                Appointment Summary
              </h3>

              <div class="summary-items">
                <div class="summary-item">
                  <span class="summary-label">Channel</span>
                  <span class="summary-value" :class="{ empty: !appointmentDetails.channel }">
                    {{ getChannelLabel(appointmentDetails.channel) || 'Not selected' }}
                  </span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Visit Reason</span>
                  <span class="summary-value" :class="{ empty: !appointmentDetails.visitReason }">
                    {{ getVisitReasonLabel(appointmentDetails.visitReason) || 'Not selected' }}
                  </span>
                </div>
                <div v-if="currentStep >= 3" class="summary-item">
                  <span class="summary-label">Date</span>
                  <span class="summary-value" :class="{ empty: !schedule.date }">
                    {{ schedule.date ? new Date(schedule.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not selected' }}
                  </span>
                </div>
                <div v-if="currentStep >= 3" class="summary-item">
                  <span class="summary-label">Time</span>
                  <span class="summary-value" :class="{ empty: !schedule.time }">
                    {{ schedule.time ? formatTime(schedule.time) : 'Not selected' }}
                  </span>
                </div>
                <div v-if="currentStep >= 3" class="summary-item">
                  <span class="summary-label">Duration</span>
                  <span class="summary-value">{{ schedule.duration }} minutes</span>
                </div>
              </div>
            </div>

            <!-- Payment Summary Card (Step 4+) -->
            <div v-if="currentStep >= 4 && payment.totalAmount > 0" class="sidebar-card payment-summary-card">
              <h3>
                <v-icon name="hi-currency-dollar" scale="0.9" />
                Payment Summary
              </h3>

              <div class="payment-summary">
                <div class="payment-summary-row">
                  <span class="label">Consultation Fee</span>
                  <span class="value">{{ formatCurrency(displayFee) }}</span>
                </div>
                <div class="payment-summary-row">
                  <span class="label">Platform Fee</span>
                  <span class="value">{{ formatCurrency(payment.platformFee) }}</span>
                </div>
                <div class="payment-summary-row total">
                  <span class="label">Total</span>
                  <span class="value">{{ formatCurrency(payment.totalAmount) }}</span>
                </div>

                <div class="payment-method-badge" v-if="payment.source">
                  <v-icon v-if="payment.source === 'card'" name="hi-credit-card" scale="0.8" />
                  <v-icon v-else-if="payment.source === 'patient_wallet'" name="bi-wallet2" scale="0.8" />
                  <v-icon v-else-if="payment.source === 'specialist_wallet'" name="hi-gift" scale="0.8" />
                  <span>
                    {{ payment.source === 'card' ? 'Card Payment' :
                       payment.source === 'patient_wallet' ? 'Patient Wallet' : 'Complimentary' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Notes Summary Card (Step 5+) -->
            <div v-if="currentStep >= 5" class="sidebar-card notes-summary-card">
              <h3>
                <v-icon name="hi-clipboard-list" scale="0.9" />
                Notes Summary
              </h3>

              <div class="notes-summary-list">
                <div class="summary-item" :class="{ filled: notes.clinicalNotes }">
                  <div class="summary-header">
                    <span class="summary-label">Internal Notes</span>
                    <span class="summary-badge private">Private</span>
                  </div>
                  <p class="summary-text">{{ notes.clinicalNotes ? '1 note added' : '0 notes added' }}</p>
                </div>

                <div class="summary-item" :class="{ filled: notes.patientInstructions }">
                  <div class="summary-header">
                    <span class="summary-label">Patient Instructions</span>
                    <span class="summary-badge visible">Visible</span>
                  </div>
                  <p class="summary-text">{{ notes.patientInstructions ? '1 instruction added' : '0 instructions added' }}</p>
                </div>

                <div class="summary-item" :class="{ filled: notes.attachments.length > 0 }">
                  <div class="summary-header">
                    <span class="summary-label">Attachments</span>
                    <span class="summary-badge files">{{ notes.attachments.length }} Files</span>
                  </div>
                  <div v-if="notes.attachments.length > 0" class="summary-files">
                    <p v-for="file in notes.attachments.slice(0, 3)" :key="file.name" class="file-item">• {{ file.name }}</p>
                    <p v-if="notes.attachments.length > 3" class="file-more">+{{ notes.attachments.length - 3 }} more</p>
                  </div>
                </div>

                <div v-if="isConsentRequired" class="summary-item" :class="{ filled: isConsentComplete }">
                  <div class="summary-header">
                    <span class="summary-label">Consent Status</span>
                    <span class="summary-badge" :class="isConsentComplete ? 'complete' : 'pending'">
                      {{ isConsentComplete ? 'Complete' : 'Pending' }}
                    </span>
                  </div>
                  <p class="summary-text">{{ consentCheckedCount }} of 4 required confirmations</p>
                </div>
              </div>

              <div v-if="isConsentRequired && !isConsentComplete" class="summary-warning">
                <v-icon name="hi-exclamation" scale="0.8" />
                <p>Complete all consent confirmations to proceed to review</p>
              </div>
            </div>

            <!-- Step 6: Confirmation Checklist Card -->
            <div v-if="currentStep === 6" class="sidebar-card confirmation-checklist-card">
              <div class="checklist-header">
                <div class="checklist-icon">
                  <v-icon name="hi-clipboard-check" scale="1.2" />
                </div>
                <div>
                  <h3>Ready to Confirm</h3>
                  <p>All requirements met</p>
                </div>
              </div>

              <div class="checklist-items">
                <div class="checklist-item completed">
                  <v-icon name="hi-check-circle" scale="0.9" />
                  <span>Patient Selected</span>
                  <v-icon name="hi-check" scale="0.7" class="check-icon" />
                </div>
                <div class="checklist-item completed">
                  <v-icon name="hi-check-circle" scale="0.9" />
                  <span>Type Configured</span>
                  <v-icon name="hi-check" scale="0.7" class="check-icon" />
                </div>
                <div class="checklist-item completed">
                  <v-icon name="hi-check-circle" scale="0.9" />
                  <span>Schedule Set</span>
                  <v-icon name="hi-check" scale="0.7" class="check-icon" />
                </div>
                <div class="checklist-item completed">
                  <v-icon name="hi-check-circle" scale="0.9" />
                  <span>Payment Configured</span>
                  <v-icon name="hi-check" scale="0.7" class="check-icon" />
                </div>
                <div class="checklist-item" :class="{ completed: notes.clinicalNotes || notes.patientInstructions }">
                  <v-icon :name="notes.clinicalNotes || notes.patientInstructions ? 'hi-check-circle' : 'hi-minus-circle'" scale="0.9" />
                  <span>Notes Added</span>
                  <v-icon v-if="notes.clinicalNotes || notes.patientInstructions" name="hi-check" scale="0.7" class="check-icon" />
                </div>
                <div v-if="isConsentRequired" class="checklist-item" :class="{ completed: isConsentComplete }">
                  <v-icon :name="isConsentComplete ? 'hi-check-circle' : 'hi-exclamation-circle'" scale="0.9" />
                  <span>Consent Verified</span>
                  <v-icon v-if="isConsentComplete" name="hi-check" scale="0.7" class="check-icon" />
                </div>
                <div class="checklist-item" :class="{ completed: policyAccepted, pending: !policyAccepted }">
                  <v-icon :name="policyAccepted ? 'hi-check-circle' : 'hi-exclamation-circle'" scale="0.9" />
                  <span>Policy Acceptance</span>
                  <v-icon v-if="policyAccepted" name="hi-check" scale="0.7" class="check-icon" />
                  <v-icon v-else name="hi-clock" scale="0.7" class="pending-icon" />
                </div>
              </div>

              <div class="total-box">
                <p class="total-label">Estimated Total</p>
                <p class="total-value">{{ formatCurrency(payment.totalAmount) }}</p>
                <p class="total-desc">Patient payment amount</p>
              </div>

              <!-- Submission Error Display -->
              <div v-if="submissionError" class="submission-error">
                <div class="error-header">
                  <v-icon name="hi-exclamation-circle" scale="1.2" />
                  <span>Booking Failed</span>
                </div>
                <p class="error-message">{{ submissionError.message }}</p>
                <p class="error-suggestion">{{ submissionError.suggestion }}</p>
                <div class="error-actions">
                  <button v-if="submissionError.goToStep" class="error-action-btn" @click="goToStep(submissionError.goToStep); submissionError = null">
                    <v-icon name="hi-arrow-left" scale="0.8" />
                    Go to Step {{ submissionError.goToStep }}
                  </button>
                  <button class="error-dismiss-btn" @click="submissionError = null">
                    Dismiss
                  </button>
                </div>
              </div>

              <button
                class="confirm-booking-btn"
                :class="{ disabled: !canConfirmBooking }"
                :disabled="!canConfirmBooking"
                @click="submitAppointment"
              >
                <v-icon v-if="isSubmitting" name="hi-refresh" scale="0.9" class="spin" />
                <v-icon v-else-if="!policyAccepted" name="hi-lock-closed" scale="0.9" />
                <v-icon v-else name="hi-check-circle" scale="0.9" />
                {{ isSubmitting ? 'Creating...' : (!policyAccepted ? 'Accept Policy to Confirm' : (submissionError ? 'Try Again' : 'Confirm Booking')) }}
              </button>
              <p class="confirm-note">Confirmation will send notifications to patient</p>
            </div>

            <!-- Step 6: Notifications Preview Card -->
            <div v-if="currentStep === 6" class="sidebar-card notifications-preview-card">
              <h3>
                <v-icon name="hi-bell" scale="0.9" />
                Notifications to be Sent
              </h3>

              <div class="notification-items">
                <div class="notification-item email">
                  <v-icon name="hi-mail" scale="0.9" />
                  <div>
                    <p class="notif-title">Email Confirmation</p>
                    <p class="notif-to">To: {{ patient.email || manualPatient.email }}</p>
                    <p class="notif-desc">Appointment details + calendar invite</p>
                  </div>
                </div>
                <div class="notification-item sms">
                  <v-icon name="hi-chat-alt" scale="0.9" />
                  <div>
                    <p class="notif-title">SMS Confirmation</p>
                    <p class="notif-to">To: {{ patient.phone || manualPatient.phone }}</p>
                    <p class="notif-desc">Appointment summary + quick links</p>
                  </div>
                </div>
                <div v-if="isConsentRequired" class="notification-item account">
                  <v-icon name="hi-user-add" scale="0.9" />
                  <div>
                    <p class="notif-title">Account Invitation</p>
                    <p class="notif-desc">Patient portal setup link</p>
                    <p class="notif-desc">Access to medical records & history</p>
                  </div>
                </div>
                <div class="notification-item reminder">
                  <v-icon name="hi-bell" scale="0.9" />
                  <div>
                    <p class="notif-title">Reminder Schedule</p>
                    <p class="notif-desc">24 hours before: Full details</p>
                    <p class="notif-desc">1 hour before: Join link + reminder</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Step 6: After Confirmation Card -->
            <div v-if="currentStep === 6" class="sidebar-card after-confirmation-card">
              <h3>After Confirmation</h3>

              <div class="after-items">
                <div class="after-item">
                  <v-icon name="hi-calendar-check" scale="0.9" />
                  <div>
                    <p class="after-title">Calendar Integration</p>
                    <p class="after-desc">Added to your practice calendar</p>
                  </div>
                </div>
                <div v-if="appointmentDetails.channel === 'zoom'" class="after-item">
                  <v-icon name="hi-video-camera" scale="0.9" />
                  <div>
                    <p class="after-title">Meeting Link Generated</p>
                    <p class="after-desc">Zoom meeting created automatically</p>
                  </div>
                </div>
                <div v-if="isConsentRequired" class="after-item">
                  <v-icon name="hi-document-text" scale="0.9" />
                  <div>
                    <p class="after-title">Patient Record Created</p>
                    <p class="after-desc">Temporary profile until verification</p>
                  </div>
                </div>
                <div class="after-item">
                  <v-icon name="hi-currency-dollar" scale="0.9" />
                  <div>
                    <p class="after-title">Payment Processed</p>
                    <p class="after-desc">{{ getPaymentSourceLabel(payment.source) }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Booking Progress Card -->
            <div class="sidebar-card progress-card">
              <h3>
                <v-icon name="hi-clipboard-list" scale="0.9" />
                Booking Progress
              </h3>
              <div class="progress-list">
                <div
                  v-for="(name, index) in stepNames"
                  :key="index"
                  class="progress-item"
                  :class="{
                    active: currentStep === index + 1,
                    completed: currentStep > index + 1,
                    pending: currentStep < index + 1
                  }"
                >
                  <div class="progress-circle">
                    <v-icon v-if="currentStep > index + 1" name="hi-check" scale="0.6" />
                    <span v-else>{{ index + 1 }}</span>
                  </div>
                  <div class="progress-text">
                    <span class="progress-name">{{ name }}</span>
                    <span class="progress-status">
                      {{ currentStep === index + 1 ? 'Current step' : currentStep > index + 1 ? 'Completed' : 'Pending' }}
                    </span>
                  </div>
                  <v-icon v-if="currentStep === index + 1" name="hi-dot" scale="1.2" class="current-dot" />
                </div>
              </div>
            </div>

            <!-- Help Card -->
            <div class="sidebar-card help-card">
              <div class="help-header">
                <div class="help-icon">
                  <v-icon name="hi-question-mark-circle" scale="1.2" />
                </div>
                <div>
                  <h3>Need Help?</h3>
                  <p>Learn more about patient selection</p>
                </div>
              </div>
              <div class="help-links">
                <button class="help-link">
                  <span><v-icon name="hi-book-open" scale="0.8" />View Documentation</span>
                  <v-icon name="hi-arrow-right" scale="0.7" />
                </button>
                <button class="help-link">
                  <span><v-icon name="hi-video-camera" scale="0.8" />Watch Tutorial</span>
                  <v-icon name="hi-arrow-right" scale="0.7" />
                </button>
                <button class="help-link">
                  <span><v-icon name="hi-support" scale="0.8" />Contact Support</span>
                  <v-icon name="hi-arrow-right" scale="0.7" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer Navigation -->
    <footer class="wizard-footer">
      <div class="footer-container">
        <button class="back-btn" @click="handleBack">
          <v-icon name="hi-chevron-left" scale="0.9" />
          Back
        </button>
        <div class="footer-right">
          <button class="draft-btn" @click="saveToLocalStorage" v-if="currentStep < totalSteps">
            <v-icon name="hi-save" scale="0.9" />
            Save Draft
          </button>
          <!-- Hide Continue button on Step 6 - use sidebar Confirm button instead -->
          <button
            v-if="currentStep < totalSteps"
            class="continue-btn"
            :class="{ disabled: !canProceed }"
            :disabled="!canProceed"
            @click="handleContinue"
          >
            Next: {{ stepNames[currentStep] }}
            <v-icon name="hi-chevron-right" scale="0.9" />
          </button>
          <!-- Step 6: Show helper text pointing to sidebar -->
          <span v-else class="confirm-hint">
            <v-icon name="hi-arrow-right" scale="0.9" />
            Use the Confirm Booking button on the right
          </span>
        </div>
      </div>
    </footer>

    <!-- Draft Restore Modal -->
    <div v-if="showDraftModal" class="modal-overlay" @click.self="discardDraft">
      <div class="draft-modal">
        <div class="draft-modal-icon">
          <v-icon name="hi-document-duplicate" scale="2" />
        </div>
        <h3>Continue where you left off?</h3>
        <p class="draft-modal-text">
          You have an unsaved appointment draft for <strong>{{ draftInfo?.patientName }}</strong>.
        </p>
        <p class="draft-modal-meta">
          <v-icon name="hi-clock" scale="0.8" />
          Saved {{ draftInfo?.formattedTime }} • Step {{ draftInfo?.step }} of 6
        </p>
        <div class="draft-modal-actions">
          <button class="discard-btn" @click="discardDraft">
            <v-icon name="hi-trash" scale="0.9" />
            Start Fresh
          </button>
          <button class="restore-btn" @click="restoreDraft">
            <v-icon name="hi-refresh" scale="0.9" />
            Continue Draft
          </button>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="modal-overlay">
      <div class="success-modal">
        <div class="success-icon">
          <v-icon name="hi-check" scale="2.5" />
        </div>
        <h2>Appointment Confirmed!</h2>
        <p class="success-message">The appointment has been successfully booked. Confirmation emails and SMS have been sent to the patient.</p>

        <div class="success-details">
          <p class="details-title">Appointment Details:</p>
          <p class="details-line">ID: #APT-{{ createdAppointmentId || generatedAppointmentId }}</p>
          <p class="details-line">Date: {{ formatReviewDate(schedule.date) }} at {{ formatReviewTime(schedule.time) }}</p>
          <p class="details-line">Patient: {{ patient.name || manualPatientName }}</p>
        </div>

        <div class="success-actions">
          <button class="view-appointment-btn" @click="viewCreatedAppointment">
            <v-icon name="hi-eye" scale="0.9" />
            View Appointment
          </button>
          <button class="back-dashboard-btn" @click="backToDashboard">
            <v-icon name="hi-arrow-left" scale="0.9" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, inject, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { useToast } from 'vue-toast-notification';

const $http = inject('$http');
const router = useRouter();
const route = useRoute();
const store = useStore();
const toast = useToast();

// Specialist Profile (logged-in user)
const specialistProfile = computed(() => store.getters.userprofile);
const specialistName = computed(() => {
  const profile = specialistProfile.value?.profile;
  if (profile) {
    return `Dr. ${profile.first_name || ''} ${profile.last_name || ''}`.trim();
  }
  return 'Specialist';
});
const specialistAvatar = computed(() => {
  const profile = specialistProfile.value?.profile;
  return profile?.profile_image || profile?.profile_photo || '';
});
const specialistSpecialty = computed(() => {
  return specialistProfile.value?.professional_practice?.category || 'Healthcare Provider';
});

// Step Configuration
const currentStep = ref(1);
const totalSteps = 6;
const stepNames = ['Patient', 'Type', 'Schedule', 'Fee & Channel', 'Notes', 'Review'];
const stepSubtitles = ['Select patient', 'Appointment type', 'Date & time', 'Payment', 'Additional info', 'Confirm'];

// Patient State
const patient = reactive({
  selectionType: 'existing',
  id: '',
  name: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  avatar: '',
  isNewPatient: false,
  lastVisit: null,
  status: 'Active',
});

// Manual Patient Entry
const manualPatient = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  consentGiven: false,
  relationship: '',
  reason: '',
});

// Search State
const existingPatientSearch = ref('');
const platformPatientSearch = ref('');
const existingPatientResults = ref([]);
const platformPatientResults = ref([]);
const isSearchingExisting = ref(false);
const isSearchingPlatform = ref(false);
let searchTimeout = null;

// Step 2: Type & Details State
const appointmentDetails = reactive({
  channel: '',
  visitReason: '',
  visitReasonCustom: '',
  specialty: '',
  clinicalFlags: [],
});

// Filter Options (from API)
const filterOptions = ref({
  channels: [],
  consultationServices: [],
});
const specialtyCategories = ref([]);
const isLoadingOptions = ref(false);

// Available channels (based on specialist preferences)
const availableChannels = computed(() => {
  const channelConfig = [
    { value: 'zoom', label: 'Video Call', description: 'Face-to-face consultation via video', icon: 'hi-video-camera', colorClass: 'blue', enabled: true },
    { value: 'in_person', label: 'In-Person', description: 'Physical visit at clinic or hospital', icon: 'hi-office-building', colorClass: 'green', enabled: true },
    { value: 'phone', label: 'Phone Call', description: 'Audio consultation via telephone', icon: 'hi-phone', colorClass: 'purple', enabled: true },
    { value: 'whatsapp', label: 'WhatsApp', description: 'Call via WhatsApp', icon: 'bi-whatsapp', colorClass: 'green', enabled: true },
  ];
  return channelConfig;
});

// Visit reasons (from consultation services)
const visitReasons = computed(() => {
  if (filterOptions.value.consultationServices?.length > 0) {
    return filterOptions.value.consultationServices.map(s => ({
      slug: s.slug,
      label: s.label,
      description: s.description,
      icon: s.icon || 'hi-clipboard-list',
      icon_color: s.icon_color || '#4FC3F7',
      icon_bg_color: s.icon_bg_color || '#E1F5FE',
    }));
  }
  // Fallback default options
  return [
    { slug: 'initial-consultation', label: 'Initial Consultation', description: 'First time visit or new patient assessment', icon: 'hi-user-add', icon_color: '#3B82F6', icon_bg_color: '#DBEAFE' },
    { slug: 'follow-up', label: 'Follow-up Visit', description: 'Continuing care or progress check', icon: 'hi-refresh', icon_color: '#10B981', icon_bg_color: '#D1FAE5' },
    { slug: 'routine-checkup', label: 'Routine Check-up', description: 'Regular health screening or wellness visit', icon: 'hi-calendar', icon_color: '#8B5CF6', icon_bg_color: '#EDE9FE' },
    { slug: 'urgent-care', label: 'Urgent Care', description: 'Time-sensitive medical concern', icon: 'hi-exclamation-triangle', icon_color: '#EF4444', icon_bg_color: '#FEE2E2' },
    { slug: 'prescription-renewal', label: 'Prescription Renewal', description: 'Medication refill or prescription review', icon: 'hi-document-text', icon_color: '#F59E0B', icon_bg_color: '#FEF3C7' },
    { slug: 'other', label: 'Other Reason', description: 'Specify custom visit purpose', icon: 'hi-dots-horizontal', icon_color: '#6B7280', icon_bg_color: '#F3F4F6' },
  ];
});

// Clinical Intake Flags
const clinicalFlags = [
  { id: 'interpreter', name: 'Interpreter Required', description: 'Language assistance needed' },
  { id: 'mobility', name: 'Mobility Assistance', description: 'Wheelchair or special access' },
  { id: 'imaging', name: 'Imaging Required', description: 'X-ray, MRI, or other scans' },
  { id: 'lab_work', name: 'Lab Work Needed', description: 'Blood tests or specimens' },
  { id: 'fasting', name: 'Fasting Required', description: 'Patient must fast before visit' },
  { id: 'extended_time', name: 'Extended Time', description: 'Extra time may be needed' },
  { id: 'guardian', name: 'Guardian Present', description: 'Legal guardian attendance' },
  { id: 'behavioral', name: 'Behavioral Support', description: 'Special behavioral needs' },
];

// Step 3: Schedule State
const schedule = reactive({
  date: '',
  time: '',
  duration: 30,
  customDuration: null,
  timezone: 'WAT (GMT+1)',
  viewMode: 'day',
  calendarBaseDate: new Date(),
  reminders: {
    email: { enabled: true, timing: '24h' },
    sms: { enabled: true, timing: '1h' },
  },
  bufferBefore: 10,
  bufferAfter: 5,
});

const availableTimeSlots = ref({});
const bookedTimeSlots = ref({});
const isLoadingSlots = ref(false);
const showCustomTimeModal = ref(false);
const customTimeEntry = reactive({
  date: '',
  time: '',
});

const durationOptions = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
];

// Step 4: Fee & Payment State
const payment = reactive({
  source: '', // 'card' | 'patient_wallet' | 'specialist_wallet'
  consultationFee: 0,
  platformFee: 500,
  customFee: null,
  useCustomFee: false,
  totalAmount: 0,
  // Payment reference (after processing)
  paymentReference: '',
  paymentRefId: '',
  // Channel Details (from Step 2 but editable)
  videoPlatform: 'zoom',
  autoGenerateLink: true,
  enableWaitingRoom: true,
  recordSession: false,
});

// Payment State
const patientWallet = reactive({
  balance: 0,
  available_balance: 0,
  has_wallet: false,
  allow_specialist_charge: true,
  isLoading: false,
  error: '',
});

const specialistWallet = reactive({
  balance: 0,
  available_balance: 0,
  has_wallet: false,
  isLoading: false,
  error: '',
});

const isProcessingPayment = ref(false);
const paymentError = ref('');
const paymentSuccess = ref(false);
const showPaymentConsentModal = ref(false);
const paymentConsentGiven = ref(false);
const paymentConsentChecked = ref(false);

// Step 5: Notes & Instructions State
const notes = reactive({
  // Internal clinical notes (private)
  clinicalNotes: '',
  noteCategory: 'General',
  priorityLevel: 'Normal',
  // Patient-visible instructions
  patientInstructions: '',
  // Attachments
  attachments: [],
});

// Consent state (for new/unassociated patients)
const patientConsent = reactive({
  verbalConsent: false,
  identityVerified: false,
  notificationAware: false,
  temporaryAssociation: false,
  consentMethod: 'Verbal Consent (Phone Call)',
  consentDateTime: '',
  additionalNotes: '',
});

// File upload state
const fileInputRef = ref(null);
const isUploadingFile = ref(false);

// Note templates
const internalTemplates = [
  { id: 'first-visit', name: 'First Visit Template', description: 'Initial consultation notes', content: 'First visit consultation. Patient presents with [chief complaint]. Medical history reviewed. Vital signs within normal limits. Plan: [treatment plan].' },
  { id: 'follow-up', name: 'Follow-up Template', description: 'Return visit notes', content: 'Follow-up visit. Patient reports [progress/concerns]. Previous treatment plan reviewed. Adjustments made as needed.' },
  { id: 'medication', name: 'Medication Review', description: 'Current medications', content: 'Current medications reviewed: [list medications]. No adverse reactions reported. Compliance good. Refills provided as needed.' },
  { id: 'referral', name: 'Referral Note', description: 'Specialist referral', content: 'Referral to specialist indicated. Reason: [indication]. Relevant medical records and test results attached.' },
];

const patientInstructionTemplates = [
  { id: 'preparation', name: 'Standard Preparation', icon: 'hi-clipboard-list', content: 'Please ensure you\'re in a quiet, private location with good internet connection. Have your ID and any relevant medical documents ready.' },
  { id: 'fasting', name: 'Fasting Instructions', icon: 'hi-clock', content: 'Please fast for 8-12 hours before your appointment. Water is allowed. Take your regular medications unless instructed otherwise.' },
  { id: 'documents', name: 'Document Checklist', icon: 'hi-document-text', content: 'Please have ready: Previous lab results, list of current medications, allergy information, and recent imaging reports.' },
];

// Note categories
const noteCategories = ['General', 'Medical History', 'Medication', 'Allergies', 'Lab Results', 'Follow-up', 'Referral'];
const priorityLevels = ['Normal', 'Important', 'Urgent', 'Critical'];
const consentMethods = ['Verbal Consent (Phone Call)', 'Written Consent (Email)', 'In-Person Consent', 'Digital Signature'];

// Computed: Check if consent is required (new patient or platform patient)
const isConsentRequired = computed(() => {
  return patient.isNewPatient || patient.selectionType === 'platform' || patient.selectionType === 'manual';
});

// Computed: Check if all consent checkboxes are checked
const isConsentComplete = computed(() => {
  if (!isConsentRequired.value) return true;
  return patientConsent.verbalConsent &&
         patientConsent.identityVerified &&
         patientConsent.notificationAware &&
         patientConsent.temporaryAssociation;
});

// Computed: Count of consent checkboxes checked
const consentCheckedCount = computed(() => {
  let count = 0;
  if (patientConsent.verbalConsent) count++;
  if (patientConsent.identityVerified) count++;
  if (patientConsent.notificationAware) count++;
  if (patientConsent.temporaryAssociation) count++;
  return count;
});

// Week View Hours (8 AM to 8 PM)
const weekViewHours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

// Week View Helper Functions
function formatHourLabel(hour) {
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour} ${ampm}`;
}

function isSlotAvailable(dateStr, hour) {
  const slots = availableTimeSlots.value[dateStr] || [];
  const timeStr = `${hour.toString().padStart(2, '0')}:00`;
  return slots.includes(timeStr);
}

function isSlotBooked(dateStr, hour) {
  const booked = bookedTimeSlots.value[dateStr] || [];
  const timeStr = `${hour.toString().padStart(2, '0')}:00`;
  // Handle both old format (string array) and new format (object array)
  return booked.some(b => (typeof b === 'string' ? b : b.time) === timeStr);
}

function getSlotBookedReason(dateStr, hour) {
  const booked = bookedTimeSlots.value[dateStr] || [];
  const timeStr = `${hour.toString().padStart(2, '0')}:00`;
  const found = booked.find(b => (typeof b === 'object' && b.time === timeStr));
  return found?.reason || null;
}

function selectWeekSlot(dateStr, hour) {
  const timeStr = `${hour.toString().padStart(2, '0')}:00`;
  if (isSlotAvailable(dateStr, hour)) {
    schedule.date = dateStr;
    schedule.time = timeStr;
  }
}

// Computed: Today's date for min date
const todayDate = computed(() => {
  return new Date().toISOString().split('T')[0];
});

// Computed: Format current date display
const formatCurrentDate = computed(() => {
  const date = schedule.calendarBaseDate;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
});

const formatCurrentDayName = computed(() => {
  const date = schedule.calendarBaseDate;
  return date.toLocaleDateString('en-US', { weekday: 'long' });
});

// Computed: Generate 7-day week strip
const weekDays = computed(() => {
  const days = [];
  const baseDate = new Date(schedule.calendarBaseDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    days.push({
      dateStr,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: date.getDate(),
      isPast: date < today,
      isToday: date.toDateString() === today.toDateString(),
      availableCount: availableTimeSlots.value[dateStr]?.length || 0,
    });
  }
  return days;
});

// Computed: Categorize time slots
const categorizeSlots = (slots) => {
  if (!slots || !Array.isArray(slots)) return [];
  return slots.map(time => {
    const hour = parseInt(time.split(':')[0]);
    const bookedList = bookedTimeSlots.value[schedule.date] || [];
    const isBooked = bookedList.includes(time);
    return {
      time,
      status: isBooked ? 'booked' : 'available',
    };
  });
};

const morningSlots = computed(() => {
  const slots = availableTimeSlots.value[schedule.date] || [];
  const allSlots = generateAllSlotsForPeriod(8, 12);
  return mergeWithAvailable(allSlots, slots);
});

const afternoonSlots = computed(() => {
  const slots = availableTimeSlots.value[schedule.date] || [];
  const allSlots = generateAllSlotsForPeriod(12, 17);
  return mergeWithAvailable(allSlots, slots);
});

const eveningSlots = computed(() => {
  const slots = availableTimeSlots.value[schedule.date] || [];
  const allSlots = generateAllSlotsForPeriod(17, 21);
  return mergeWithAvailable(allSlots, slots);
});

function generateAllSlotsForPeriod(startHour, endHour) {
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
    slots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return slots;
}

function mergeWithAvailable(allSlots, availableSlots) {
  const bookedList = bookedTimeSlots.value[schedule.date] || [];
  // bookedList is now array of { time, reason } objects
  const bookedTimes = bookedList.map(b => typeof b === 'string' ? b : b.time);
  const bookedMap = {};
  bookedList.forEach(b => {
    if (typeof b === 'object') {
      bookedMap[b.time] = b.reason;
    }
  });

  return allSlots
    .filter(time => availableSlots.includes(time) || bookedTimes.includes(time))
    .map(time => {
      const isAvailable = availableSlots.includes(time);
      const bookedReason = bookedMap[time];
      return {
        time,
        status: isAvailable ? 'available' : (bookedReason === 'patient' ? 'patient_conflict' : 'booked'),
        reason: bookedReason || null,
      };
    });
}

// Computed: AI Suggested Times
const aiSuggestedTimes = computed(() => {
  const suggestions = [];
  const today = new Date();

  // Find next 3 available slots across different days
  for (let dayOffset = 1; dayOffset <= 7 && suggestions.length < 3; dayOffset++) {
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);
    const dateStr = date.toISOString().split('T')[0];
    const slots = availableTimeSlots.value[dateStr] || [];

    if (slots.length > 0) {
      // Prefer morning slots for best match
      const preferredTimes = ['09:00', '10:00', '09:30', '10:30', '14:00', '15:00'];
      const bestSlot = preferredTimes.find(t => slots.includes(t)) || slots[0];

      suggestions.push({
        date: dateStr,
        time: bestSlot,
        label: `${date.toLocaleDateString('en-US', { weekday: 'long' })}, ${formatTime(bestSlot)}`,
        dateFormatted: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        score: Math.max(95 - (dayOffset * 5) - (suggestions.length * 8), 70),
      });
    }
  }

  return suggestions;
});

// Computed
const manualPatientName = computed(() => {
  return `${manualPatient.firstName} ${manualPatient.lastName}`.trim();
});

const isManualEntryValid = computed(() => {
  return patient.selectionType === 'manual' &&
    manualPatient.firstName &&
    manualPatient.lastName &&
    manualPatient.email &&
    manualPatient.phone &&
    manualPatient.consentGiven;
});

const canProceed = computed(() => {
  if (currentStep.value === 1) {
    return !!patient.id || isManualEntryValid.value;
  }
  if (currentStep.value === 2) {
    // Channel and visit reason are required, specialty and flags are optional
    return !!appointmentDetails.channel && !!appointmentDetails.visitReason;
  }
  if (currentStep.value === 3) {
    // Date and time are required
    return !!schedule.date && !!schedule.time;
  }
  if (currentStep.value === 4) {
    // Payment source must be selected and valid
    if (!payment.source) return false;

    // If payment was already made, allow proceeding (skip wallet availability checks)
    if (paymentConsentGiven.value && payment.paymentReference) {
      return true;
    }

    // For new payments, check wallet availability
    if (payment.source === 'patient_wallet' && !canSelectPatientWallet.value) return false;
    if (payment.source === 'specialist_wallet' && !canSelectSpecialistWallet.value) return false;
    // For wallet payments, consent must be given
    if ((payment.source === 'patient_wallet' || payment.source === 'specialist_wallet') && !paymentConsentGiven.value) return false;
    return true;
  }
  if (currentStep.value === 5) {
    // If consent is required (new/unassociated patient), all consent checkboxes must be checked
    if (isConsentRequired.value && !isConsentComplete.value) return false;
    return true;
  }
  return true;
});

// Methods
function setPatientTab(tab) {
  patient.selectionType = tab;
  if (tab === 'manual') {
    patient.isNewPatient = true;
    patient.id = '';
  } else {
    patient.isNewPatient = false;
  }

  // Load patients when switching tabs
  if (tab === 'existing' && existingPatientResults.value.length === 0) {
    loadMyPatients();
  } else if (tab === 'platform' && platformPatientResults.value.length === 0) {
    loadPlatformPatients();
  }
}

async function loadMyPatients() {
  isSearchingExisting.value = true;
  try {
    const response = await $http.$_searchPatients({
      filter: 'my_patients',
      limit: 50,
    });
    if (response.data?.statusCode === 200 || response.data?.data?.patients) {
      existingPatientResults.value = response.data.data?.patients || [];
    }
  } catch (error) {
    console.error('Failed to load patients:', error);
    existingPatientResults.value = [];
  } finally {
    isSearchingExisting.value = false;
  }
}

async function loadPlatformPatients() {
  isSearchingPlatform.value = true;
  try {
    const response = await $http.$_searchPatients({
      filter: 'all',
      limit: 50,
    });
    if (response.data?.statusCode === 200 || response.data?.data?.patients) {
      platformPatientResults.value = response.data.data?.patients || [];
    }
  } catch (error) {
    console.error('Failed to load platform patients:', error);
    platformPatientResults.value = [];
  } finally {
    isSearchingPlatform.value = false;
  }
}

async function searchExistingPatients() {
  clearTimeout(searchTimeout);
  if (!existingPatientSearch.value || existingPatientSearch.value.length < 2) {
    if (!existingPatientSearch.value) {
      loadMyPatients();
    }
    return;
  }

  isSearchingExisting.value = true;
  searchTimeout = setTimeout(async () => {
    try {
      const response = await $http.$_searchPatients({
        search: existingPatientSearch.value,
        filter: 'my_patients',
      });
      if (response.data?.statusCode === 200 || response.data?.data?.patients) {
        existingPatientResults.value = response.data.data?.patients || [];
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      isSearchingExisting.value = false;
    }
  }, 300);
}

async function searchPlatformPatients() {
  clearTimeout(searchTimeout);
  if (!platformPatientSearch.value || platformPatientSearch.value.length < 2) {
    if (!platformPatientSearch.value) {
      loadPlatformPatients();
    }
    return;
  }

  isSearchingPlatform.value = true;
  searchTimeout = setTimeout(async () => {
    try {
      const response = await $http.$_searchPatients({
        search: platformPatientSearch.value,
        filter: 'all',
      });
      if (response.data?.statusCode === 200 || response.data?.data?.patients) {
        platformPatientResults.value = response.data.data?.patients || [];
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      isSearchingPlatform.value = false;
    }
  }, 300);
}

function selectPatient(p, type) {
  // Confirm for platform patients that are NOT already in the specialist's practice
  if (type === 'platform' && !p.isMyPatient) {
    const confirmed = confirm('This patient is not in your practice.\n\nDo you confirm that you have permission to book an appointment on their behalf?\n\nThe patient will be notified about this appointment.');
    if (!confirmed) return;
  }

  // Clear cached time slots when patient changes (to refetch with patient's appointments)
  if (patient.id !== p._id) {
    availableTimeSlots.value = {};
    bookedTimeSlots.value = {};
    schedule.date = '';
    schedule.time = '';
  }

  patient.id = p._id;
  patient.name = getPatientName(p);
  patient.email = p.profile?.contact?.email || '';
  patient.phone = getPatientPhone(p);
  patient.dateOfBirth = p.profile?.date_of_birth || '';
  patient.gender = p.profile?.gender || '';
  // Check multiple possible field names for profile image
  patient.avatar = p.profile?.profile_image || p.profile?.profile_photo || p.profile?.avatar || '';
  patient.lastVisit = p.stats?.lastVisit || null;
  patient.status = p.status || 'Active';
  patient.selectionType = type;
  patient.isNewPatient = false;
  // Store the full patient object for reference (used in confirmation page query params)
  patient.patientData = p;
}

function clearPatient() {
  patient.id = '';
  patient.name = '';
  patient.email = '';
  patient.phone = '';
  patient.dateOfBirth = '';
  patient.gender = '';
  patient.avatar = '';
  patient.lastVisit = null;
  patient.isNewPatient = false;
}

function viewPatientProfile() {
  if (patient.id) {
    router.push({ name: 'SpecialistPatientDashboard', params: { patientId: patient.id } });
  }
}

// Step 2 Methods
function selectChannel(channel) {
  appointmentDetails.channel = channel;
}

function selectVisitReason(reason) {
  appointmentDetails.visitReason = reason.slug;
  if (reason.slug !== 'other') {
    appointmentDetails.visitReasonCustom = '';
  }
}

function getChannelLabel(value) {
  const channel = availableChannels.value.find(c => c.value === value);
  return channel?.label || '';
}

function getVisitReasonLabel(slug) {
  const reason = visitReasons.value.find(r => r.slug === slug);
  return reason?.label || '';
}

function getSpecialtyLabel(slug) {
  const specialty = specialtyCategories.value.find(c => c.slug === slug);
  return specialty?.name || '';
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return '';
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return `${age} years`;
}

function getChannelInfo(channel) {
  const info = {
    zoom: 'Video appointments are available 24/7. Patient will receive meeting link via email.',
    in_person: 'In-person visits are subject to clinic hours and location availability.',
    phone: 'Phone consultations are available during regular office hours.',
    whatsapp: 'WhatsApp calls are subject to your availability and data connection.',
  };
  return info[channel] || 'Select a channel to see availability information.';
}

async function loadFilterOptions() {
  isLoadingOptions.value = true;
  try {
    const response = await $http.$_getAppointmentFilterOptions();
    if (response.data?.data) {
      filterOptions.value = response.data.data;
    }
  } catch (error) {
    console.error('Failed to load filter options:', error);
  } finally {
    isLoadingOptions.value = false;
  }
}

async function loadSpecialtyCategories() {
  try {
    const response = await $http.$_getSpecialistCategories();
    if (response.data?.data?.all) {
      specialtyCategories.value = response.data.data.all;
    }
  } catch (error) {
    console.error('Failed to load specialty categories:', error);
  }
}

// Step 3 Methods
function navigateCalendar(direction) {
  const newDate = new Date(schedule.calendarBaseDate);
  newDate.setDate(newDate.getDate() + (direction * 7));
  schedule.calendarBaseDate = newDate;
  // Load slots for the new week
  loadAvailableSlotsForWeek();
}

async function selectDate(dateStr) {
  schedule.date = dateStr;
  schedule.time = ''; // Reset time when date changes
  // Load slots if not already loaded
  if (!availableTimeSlots.value[dateStr]) {
    await loadAvailableSlotsForDate(dateStr);
  }
}

function selectTime(slot) {
  if (slot.status === 'available') {
    schedule.time = slot.time;
  }
}

function getSlotStatusLabel(slot) {
  if (schedule.time === slot.time) return 'Selected';
  switch (slot.status) {
    case 'available': return 'Available';
    case 'booked': return 'Booked';
    case 'patient_conflict': return 'Patient Busy';
    default: return 'Unavailable';
  }
}

function formatTime(time) {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
}

async function loadAvailableSlotsForWeek() {
  isLoadingSlots.value = true;
  try {
    const dates = weekDays.value.map(d => ({ date: new Date(d.dateStr) }));
    const payload = {
      preferredDates: dates,
      specialistId: specialistProfile.value?._id, // Current logged-in specialist
    };
    // Include patient ID if selected to check for their existing appointments
    if (patient.id) {
      payload.patientId = patient.id;
    }
    const response = await $http.$_getAvailableTimes(payload);
    if (response.data?.data) {
      // Handle new response format: { date: { available: [], booked: [] } }
      const data = response.data.data;
      Object.keys(data).forEach(dateKey => {
        const dateData = data[dateKey];
        // Check if it's the new format or legacy format
        if (dateData.available !== undefined) {
          availableTimeSlots.value[dateKey] = dateData.available;
          bookedTimeSlots.value[dateKey] = dateData.booked || [];
        } else {
          // Legacy format - just an array of times
          availableTimeSlots.value[dateKey] = dateData;
        }
      });
    }
  } catch (error) {
    console.error('Failed to load available slots:', error);
  } finally {
    isLoadingSlots.value = false;
  }
}

async function loadAvailableSlotsForDate(dateStr) {
  isLoadingSlots.value = true;
  try {
    const payload = {
      preferredDates: [{ date: new Date(dateStr) }],
      specialistId: specialistProfile.value?._id,
    };
    if (patient.id) {
      payload.patientId = patient.id;
    }
    const response = await $http.$_getAvailableTimes(payload);
    if (response.data?.data) {
      const data = response.data.data;
      Object.keys(data).forEach(dateKey => {
        const dateData = data[dateKey];
        if (dateData.available !== undefined) {
          availableTimeSlots.value[dateKey] = dateData.available;
          bookedTimeSlots.value[dateKey] = dateData.booked || [];
        } else {
          availableTimeSlots.value[dateKey] = dateData;
        }
      });
    }
  } catch (error) {
    console.error('Failed to load slots for date:', error);
  } finally {
    isLoadingSlots.value = false;
  }
}

function applySuggestion(suggestion) {
  schedule.date = suggestion.date;
  schedule.time = suggestion.time;
  // Scroll to time slots section
  toast.info(`Applied suggestion: ${suggestion.label}`);
}

function applyCustomTime() {
  if (customTimeEntry.date && customTimeEntry.time) {
    schedule.date = customTimeEntry.date;
    schedule.time = customTimeEntry.time;
    showCustomTimeModal.value = false;
    toast.success('Custom time applied. Note: This may be outside your normal availability.');
  } else {
    toast.error('Please select both date and time');
  }
}

function getPatientName(p) {
  if (p.profile) {
    return `${p.profile.first_name || ''} ${p.profile.last_name || ''}`.trim();
  }
  return p.email || 'Unknown';
}

function getPatientPhone(p) {
  if (p.profile?.contact?.phone) {
    return `${p.profile.contact.phone.country_code || ''} ${p.profile.contact.phone.number || ''}`.trim();
  }
  return 'N/A';
}

function getInitials(p) {
  const name = getPatientName(p);
  if (!name || name === 'Unknown') return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

function formatDOB(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function handleBack() {
  if (currentStep.value > 1) {
    currentStep.value--;
  } else {
    router.back();
  }
}

function handleContinue() {
  if (canProceed.value && currentStep.value < totalSteps) {
    // For manual entry, set patient data
    if (patient.selectionType === 'manual' && isManualEntryValid.value) {
      patient.name = manualPatientName.value;
      patient.email = manualPatient.email;
      patient.phone = manualPatient.phone;
      patient.dateOfBirth = manualPatient.dateOfBirth;
      patient.gender = manualPatient.gender;
      patient.isNewPatient = true;
    }
    currentStep.value++;
  }
}

function saveToLocalStorage() {
  const draft = {
    currentStep: currentStep.value,
    patient: { ...patient },
    manualPatient: { ...manualPatient },
    appointmentDetails: { ...appointmentDetails },
    schedule: {
      ...schedule,
      calendarBaseDate: schedule.calendarBaseDate?.toISOString?.() || schedule.calendarBaseDate,
    },
    payment: { ...payment },
    notes: { ...notes },
    patientConsent: { ...patientConsent },
    // Payment consent state - critical for persistence
    paymentConsentGiven: paymentConsentGiven.value,
    paymentConsentChecked: paymentConsentChecked.value,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem('specialist_appointment_draft', JSON.stringify(draft));
  toast.success('Draft saved successfully!');
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('specialist_appointment_draft');
  if (saved) {
    try {
      const draft = JSON.parse(saved);
      const savedAt = new Date(draft.savedAt);
      const hoursDiff = (new Date() - savedAt) / (1000 * 60 * 60);

      // Drafts are valid for 72 hours
      if (hoursDiff < 72) {
        currentStep.value = draft.currentStep || 1;
        Object.assign(patient, draft.patient || {});
        Object.assign(manualPatient, draft.manualPatient || {});
        if (draft.appointmentDetails) Object.assign(appointmentDetails, draft.appointmentDetails);
        if (draft.schedule) {
          // Handle calendarBaseDate serialization
          const scheduleData = { ...draft.schedule };
          if (scheduleData.calendarBaseDate) {
            scheduleData.calendarBaseDate = new Date(scheduleData.calendarBaseDate);
          }
          Object.assign(schedule, scheduleData);
        }
        if (draft.payment) Object.assign(payment, draft.payment);
        if (draft.notes) {
          // Restore notes but clear file objects (they can't be serialized)
          const notesData = { ...draft.notes };
          if (notesData.attachments) {
            // Filter out any file objects that couldn't be serialized
            notesData.attachments = notesData.attachments.filter(a => a.name && (a.url || a.size));
          }
          Object.assign(notes, notesData);
        }
        if (draft.patientConsent) Object.assign(patientConsent, draft.patientConsent);
        // Restore payment consent state
        if (draft.paymentConsentGiven !== undefined) {
          paymentConsentGiven.value = draft.paymentConsentGiven;
        }
        if (draft.paymentConsentChecked !== undefined) {
          paymentConsentChecked.value = draft.paymentConsentChecked;
        }
      }
    } catch (e) {
      console.error('Failed to load draft:', e);
    }
  }
}

// Step 4 Methods
async function loadPatientWalletBalance() {
  if (!patient.id) return;

  patientWallet.isLoading = true;
  patientWallet.error = '';

  try {
    const response = await $http.$_getPatientWalletBalance(patient.id);
    if (response.data?.data) {
      const data = response.data.data;
      patientWallet.balance = data.balance || 0;
      patientWallet.available_balance = data.available_balance || 0;
      patientWallet.has_wallet = data.has_wallet || false;
      patientWallet.allow_specialist_charge = data.allow_specialist_charge !== false;
    }
  } catch (error) {
    console.error('Failed to load patient wallet:', error);
    patientWallet.error = 'Failed to load patient wallet';
    patientWallet.balance = 0;
    patientWallet.available_balance = 0;
    patientWallet.has_wallet = false;
  } finally {
    patientWallet.isLoading = false;
  }
}

async function loadSpecialistWalletBalance() {
  specialistWallet.isLoading = true;
  specialistWallet.error = '';

  try {
    const response = await $http.$_getSpecialistWallet();
    if (response.data?.data) {
      const data = response.data.data;
      specialistWallet.balance = data.available_balance || 0;
      specialistWallet.available_balance = data.available_balance || 0;
      specialistWallet.has_wallet = true;
    }
  } catch (error) {
    console.error('Failed to load specialist wallet:', error);
    specialistWallet.error = 'Failed to load wallet';
    specialistWallet.balance = 0;
    specialistWallet.available_balance = 0;
  } finally {
    specialistWallet.isLoading = false;
  }
}

function loadConsultationFees() {
  // Load fees from specialist preferences/rate cards
  const rateCards = specialistProfile.value?.specialist_preferences?.rate_cards;
  const serviceRates = specialistProfile.value?.specialist_preferences?.service_rates;

  let fee = 5000; // Default fee in NGN

  // First check service rates for specific consultation type
  if (serviceRates && appointmentDetails.visitReason) {
    const serviceRate = serviceRates[appointmentDetails.visitReason];
    if (serviceRate?.enabled) {
      if (appointmentDetails.visitReason === 'urgent-care' && serviceRate.urgent_rate) {
        fee = serviceRate.urgent_rate;
      } else if (serviceRate.routine_rate) {
        fee = serviceRate.routine_rate;
      } else if (serviceRate.flat_rate) {
        fee = serviceRate.flat_rate;
      }
    }
  }

  // Fallback to general rate cards based on channel
  if (fee === 5000 && rateCards) {
    if (appointmentDetails.channel === 'zoom' || appointmentDetails.channel === 'whatsapp') {
      if (rateCards.video_consultation?.enabled && rateCards.video_consultation?.routine_rate) {
        fee = rateCards.video_consultation.routine_rate;
      }
    } else if (appointmentDetails.channel === 'phone') {
      if (rateCards.audio_consultation?.enabled && rateCards.audio_consultation?.routine_rate) {
        fee = rateCards.audio_consultation.routine_rate;
      }
    }

    // Check for urgent rates if urgent care
    if (appointmentDetails.visitReason === 'urgent-care') {
      if (appointmentDetails.channel === 'zoom' && rateCards.video_consultation?.urgent_rate) {
        fee = rateCards.video_consultation.urgent_rate;
      } else if (appointmentDetails.channel === 'phone' && rateCards.audio_consultation?.urgent_rate) {
        fee = rateCards.audio_consultation.urgent_rate;
      }
    }
  }

  payment.consultationFee = fee;
  updateTotalAmount();
}

function updateTotalAmount() {
  const fee = payment.useCustomFee && payment.customFee ? payment.customFee : payment.consultationFee;
  payment.totalAmount = fee + payment.platformFee;
}

const displayFee = computed(() => {
  return payment.useCustomFee && payment.customFee ? payment.customFee : payment.consultationFee;
});

const canSelectPatientWallet = computed(() => {
  if (patientWallet.isLoading) return false;
  if (!patientWallet.has_wallet) return false;
  if (!patientWallet.allow_specialist_charge) return false;
  if (patientWallet.available_balance < payment.totalAmount) return false;
  return true;
});

const canSelectSpecialistWallet = computed(() => {
  if (specialistWallet.isLoading) return false;
  if (specialistWallet.available_balance < payment.totalAmount) return false;
  return true;
});

const patientWalletError = computed(() => {
  if (patientWallet.isLoading) return '';
  if (!patientWallet.has_wallet) return 'Patient does not have a wallet';
  if (!patientWallet.allow_specialist_charge) return 'Patient has disabled specialist wallet charges';
  if (patientWallet.available_balance < payment.totalAmount) return 'Insufficient funds in patient wallet';
  return '';
});

const specialistWalletError = computed(() => {
  if (specialistWallet.isLoading) return '';
  if (specialistWallet.available_balance < payment.totalAmount) return `Insufficient balance (₦${specialistWallet.available_balance.toLocaleString()})`;
  return '';
});

function selectPaymentSource(source) {
  if (source === 'patient_wallet' && !canSelectPatientWallet.value) {
    toast.warning(patientWalletError.value || 'Cannot select patient wallet');
    return;
  }
  if (source === 'specialist_wallet' && !canSelectSpecialistWallet.value) {
    toast.warning(specialistWalletError.value || 'Cannot select specialist wallet');
    return;
  }
  payment.source = source;
  paymentError.value = '';
}

function formatCurrency(amount) {
  return `₦${(amount || 0).toLocaleString()}`;
}

function setCustomFee(enabled) {
  payment.useCustomFee = enabled;
  if (!enabled) {
    payment.customFee = null;
  }
  updateTotalAmount();
}

function updateCustomFee(value) {
  payment.customFee = parseInt(value) || 0;
  updateTotalAmount();
}

// Prevent non-numeric characters from being typed
function preventNonNumeric(event) {
  const char = String.fromCharCode(event.which || event.keyCode);
  if (!/[0-9]/.test(char)) {
    event.preventDefault();
  }
}

// Handle custom fee input - strip non-numeric characters
function handleCustomFeeInput(event) {
  const rawValue = event.target.value;
  // Remove any non-numeric characters
  const numericValue = rawValue.replace(/[^0-9]/g, '');
  // Update the input display
  event.target.value = numericValue;
  // Update the payment state
  payment.customFee = parseInt(numericValue) || 0;
  updateTotalAmount();
}

// Format custom fee display (just show the number, no formatting)
function formatCustomFeeDisplay(value) {
  if (value === null || value === undefined || value === 0) {
    return '';
  }
  return String(value);
}

function getSelectedChannelConfig() {
  return availableChannels.value.find(c => c.value === appointmentDetails.channel);
}

async function confirmPaymentConsent() {
  if (!paymentConsentChecked.value) {
    toast.warning('Please check the consent checkbox to continue');
    return;
  }

  isProcessingPayment.value = true;
  paymentError.value = '';

  try {
    // Call the backend to process the payment
    const payload = {
      patient_id: patient.id,
      consultation_fee: displayFee.value,
      platform_fee: payment.platformFee,
      total_amount: payment.totalAmount,
      payment_source: payment.source,
      appointment_type: appointmentDetails.visitReason,
      appointment_type_name: getVisitReasonLabel(appointmentDetails.visitReason),
    };

    const response = await $http.$_processAppointmentPayment(payload);

    if (response.data?.data?.success) {
      // Store the payment reference for use when creating the appointment
      payment.paymentReference = response.data.data.payment_reference;
      payment.paymentRefId = response.data.data.payment_ref_id;

      // Mark consent as given
      paymentConsentGiven.value = true;
      showPaymentConsentModal.value = false;
      paymentConsentChecked.value = false;

      toast.success(response.data.data.message || 'Payment processed successfully');

      // Refresh wallet balances
      if (payment.source === 'patient_wallet') {
        await loadPatientWalletBalance();
      } else if (payment.source === 'specialist_wallet') {
        await loadSpecialistWalletBalance();
      }
    } else {
      throw new Error(response.data?.message || 'Payment processing failed');
    }
  } catch (error) {
    console.error('Payment processing failed:', error);
    paymentError.value = error.response?.data?.message || error.message || 'Failed to process payment';
    toast.error(paymentError.value);
  } finally {
    isProcessingPayment.value = false;
  }
}

function resetPaymentConsent() {
  paymentConsentGiven.value = false;
  paymentConsentChecked.value = false;
  payment.paymentReference = '';
  payment.paymentRefId = '';
}

// =====================
// Step 5: Notes Methods
// =====================

function insertInternalTemplate(template) {
  // Append template content to clinical notes
  if (notes.clinicalNotes) {
    notes.clinicalNotes += '\n\n' + template.content;
  } else {
    notes.clinicalNotes = template.content;
  }
  toast.success(`"${template.name}" template inserted`);
}

function insertPatientTemplate(template) {
  // Append template content to patient instructions
  if (notes.patientInstructions) {
    notes.patientInstructions += '\n\n' + template.content;
  } else {
    notes.patientInstructions = template.content;
  }
  toast.success(`"${template.name}" template inserted`);
}

function triggerFileUpload() {
  fileInputRef.value?.click();
}

function handleFileUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const maxSize = 25 * 1024 * 1024; // 25 MB

  for (const file of files) {
    if (file.size > maxSize) {
      toast.error(`File "${file.name}" exceeds 25 MB limit`);
      continue;
    }

    // Add file to attachments
    notes.attachments.push({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file, // Keep the actual file for upload later
      uploadedAt: new Date(),
    });
  }

  // Clear the input
  event.target.value = '';

  if (notes.attachments.length > 0) {
    toast.success(`${files.length} file(s) added`);
  }
}

function removeFile(index) {
  const file = notes.attachments[index];
  notes.attachments.splice(index, 1);
  toast.info(`"${file.name}" removed`);
}

function previewFile(file) {
  // For now, just open the file if it's a blob URL or create one
  if (file.file instanceof File) {
    const url = URL.createObjectURL(file.file);
    window.open(url, '_blank');
  } else if (file.url) {
    window.open(file.url, '_blank');
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileTypeClass(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['pdf'].includes(ext)) return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'word';
  if (['xls', 'xlsx'].includes(ext)) return 'excel';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'image';
  return 'other';
}

function getFileIcon(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['pdf'].includes(ext)) return 'bi-file-earmark-pdf';
  if (['doc', 'docx'].includes(ext)) return 'bi-file-earmark-word';
  if (['xls', 'xlsx'].includes(ext)) return 'bi-file-earmark-excel';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'hi-photograph';
  return 'hi-document';
}

// =====================
// Step 6: Review & Confirm
// =====================

const policyAccepted = ref(false);
const isSubmitting = ref(false);
const showSuccessModal = ref(false);
const createdAppointmentId = ref('');
const submissionError = ref(null); // { message, suggestion, canRetry }

// Generated appointment ID (preview)
const generatedAppointmentId = computed(() => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${year}${month}${day}-${random}`;
});

// Can confirm booking
const canConfirmBooking = computed(() => {
  return policyAccepted.value && !isSubmitting.value;
});

// Go to specific step for editing
function goToStep(step) {
  currentStep.value = step;
}

// Format functions for review
function formatReviewDate(dateStr) {
  if (!dateStr) return 'Not set';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatReviewTime(timeStr) {
  if (!timeStr) return 'Not set';
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function formatScheduleDay(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function formatScheduleFullDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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

function handleCustomDuration() {
  const value = schedule.customDuration;
  if (value && typeof value === 'number' && value >= 15 && value <= 180) {
    schedule.duration = value;
  } else if (!value || value === '' || isNaN(value)) {
    // If cleared or invalid, reset to default
    schedule.duration = 30;
  }
}

function formatConsentDateTime(dateTimeStr) {
  if (!dateTimeStr) return 'Not recorded';
  const date = new Date(dateTimeStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function getPatientInitials() {
  const name = patient.name || manualPatientName.value || '';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getChannelIcon(channel) {
  const icons = {
    'zoom': 'hi-video-camera',
    'in_person': 'hi-office-building',
    'phone': 'hi-phone',
    'whatsapp': 'bi-whatsapp',
  };
  return icons[channel] || 'hi-video-camera';
}

function getChannelDescription(channel) {
  const descriptions = {
    'zoom': 'Face-to-face consultation via video',
    'in_person': 'Physical visit at clinic or hospital',
    'phone': 'Audio consultation via telephone',
    'whatsapp': 'Call via WhatsApp',
  };
  return descriptions[channel] || '';
}

function getPaymentSourceLabel(source) {
  const labels = {
    'patient_wallet': 'Charged to patient wallet',
    'specialist_wallet': 'Complimentary (from your wallet)',
    'card': 'Card payment via Paystack',
  };
  return labels[source] || 'Payment method not set';
}

function getVisitReasonDescription(visitReasonId) {
  const reason = visitReasons.value.find(r => r.value === visitReasonId || r._id === visitReasonId);
  return reason?.description || '';
}

// Submit appointment
async function submitAppointment() {
  console.log('submitAppointment called');
  console.log('canConfirmBooking:', canConfirmBooking.value);
  console.log('policyAccepted:', policyAccepted.value);
  console.log('isSubmitting:', isSubmitting.value);

  if (!canConfirmBooking.value) {
    console.log('Cannot confirm booking - returning early');
    toast.warning('Please accept the policy to confirm booking');
    return;
  }

  isSubmitting.value = true;
  console.log('Starting appointment creation...');

  try {
    // Prepare appointment payload
    const appointmentPayload = {
      // Patient
      patient_id: patient.id || undefined,
      is_new_patient: patient.isNewPatient || patient.selectionType === 'manual',
      new_patient_data: patient.selectionType === 'manual' ? {
        name: manualPatientName.value,
        email: manualPatient.email,
        phone: manualPatient.phone,
        date_of_birth: manualPatient.dateOfBirth,
        gender: manualPatient.gender,
      } : undefined,

      // Appointment details
      category: appointmentDetails.specialty || 'general',
      appointment_date: schedule.date,
      start_time: schedule.time,
      duration_minutes: (typeof schedule.duration === 'number' && schedule.duration > 0) ? schedule.duration : 30,
      timezone: schedule.timezone,
      appointment_type: appointmentDetails.visitReason,
      appointment_type_name: getVisitReasonLabel(appointmentDetails.visitReason),
      meeting_channel: appointmentDetails.channel,
      clinical_flags: appointmentDetails.clinicalFlags,

      // Payment (already processed in Step 4)
      consultation_fee: displayFee.value,
      platform_fee: payment.platformFee,
      total_amount: payment.totalAmount,
      payment_source: payment.source,
      payment_timing: 'at_booking',
      currency: 'NGN',

      // Video settings
      video_settings: {
        platform: payment.videoPlatform,
        auto_generate_link: payment.autoGenerateLink,
        enable_waiting_room: payment.enableWaitingRoom,
        record_session: payment.recordSession,
      },

      // Reminders
      reminder_settings: schedule.reminders,
      buffer_time: schedule.bufferBefore,

      // Notes
      patient_notes: notes.patientInstructions,
      private_notes: notes.clinicalNotes,

      // Notifications
      notify_patient: true,
      send_reminders: true,
    };

    console.log('Appointment payload:', appointmentPayload);
    const response = await $http.$_createSpecialistAppointment(appointmentPayload);
    console.log('API response:', response);

    if (response.data?.data) {
      const createdAppointment = response.data.data;
      createdAppointmentId.value = createdAppointment._id || createdAppointment.id || generatedAppointmentId.value;

      // Clear draft since appointment was created
      clearDraft();

      toast.success('Appointment created successfully!');

      // Navigate to confirmation page with appointment data
      // Build patient name properly
      let confirmPatientName = patient.name || 'Patient';
      if (patient.selectionType === 'manual') {
        confirmPatientName = manualPatientName.value || 'Patient';
      } else if (patient.patientData?.profile) {
        const firstName = patient.patientData.profile.first_name || '';
        const lastName = patient.patientData.profile.last_name || '';
        if (firstName || lastName) {
          confirmPatientName = `${firstName} ${lastName}`.trim();
        }
      }

      // Get meeting link from response (backend returns join_url directly)
      const meetingUrl = createdAppointment.join_url
        || createdAppointment.zoom_meeting?.join_url
        || createdAppointment.meeting_link
        || createdAppointment.zoom_link
        || '';

      router.push({
        name: 'SpecialistAppointmentConfirmation',
        query: {
          id: createdAppointmentId.value,
          date: schedule.date,
          time: schedule.time,
          duration: schedule.duration,
          patientName: confirmPatientName,
          patientEmail: patient.selectionType === 'manual' ? manualPatient.email : (patient.patientData?.email || patient.email || ''),
          patientPhone: patient.selectionType === 'manual' ? manualPatient.phone : (patient.patientData?.profile?.phone_number || patient.phone || ''),
          patientAvatar: patient.selectionType === 'manual' ? '' : (patient.patientData?.profile?.profile_image || patient.avatar || ''),
          patientAge: patient.selectionType === 'manual' ? (manualPatient.dateOfBirth ? calculateAge(manualPatient.dateOfBirth) : '') : (patient.patientData?.profile?.date_of_birth ? calculateAge(patient.patientData.profile.date_of_birth) : (patient.dateOfBirth ? calculateAge(patient.dateOfBirth) : '')),
          patientGender: patient.selectionType === 'manual' ? (manualPatient.gender || '') : (patient.patientData?.profile?.gender || patient.gender || ''),
          isNewPatient: patient.selectionType === 'manual' || patient.isNewPatient ? 'true' : 'false',
          appointmentType: getVisitReasonLabel(appointmentDetails.visitReason),
          category: appointmentDetails.specialty || 'Medical Consultation',
          channel: appointmentDetails.channel,
          timezone: schedule.timezone,
          consultationFee: displayFee.value,
          platformFee: payment.platformFee,
          totalAmount: payment.totalAmount,
          paymentSource: payment.source,
          meetingLink: meetingUrl,
        }
      });
    } else {
      throw new Error(response.data?.message || 'Failed to create appointment');
    }
  } catch (error) {
    console.error('Failed to create appointment:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create appointment';

    // Parse error and provide helpful suggestions
    let suggestion = '';
    let goToStep = null;

    if (errorMessage.toLowerCase().includes('past')) {
      suggestion = 'Please go back to Step 3 and select a future date and time.';
      goToStep = 3;
    } else if (errorMessage.toLowerCase().includes('conflict') || errorMessage.toLowerCase().includes('already has an appointment')) {
      suggestion = 'Please go back to Step 3 and choose a different time slot.';
      goToStep = 3;
    } else if (errorMessage.toLowerCase().includes('patient')) {
      suggestion = 'Please go back to Step 1 and verify patient information.';
      goToStep = 1;
    } else if (errorMessage.toLowerCase().includes('wallet') || errorMessage.toLowerCase().includes('balance') || errorMessage.toLowerCase().includes('insufficient')) {
      suggestion = 'Please go back to Step 4 and choose a different payment method or top up the wallet.';
      goToStep = 4;
    } else if (errorMessage.toLowerCase().includes('zoom') || errorMessage.toLowerCase().includes('meeting')) {
      suggestion = 'There was an issue creating the video meeting. Please try again or contact support.';
    } else {
      suggestion = 'Please review your appointment details and try again. If the problem persists, contact support.';
    }

    submissionError.value = {
      message: errorMessage,
      suggestion: suggestion,
      goToStep: goToStep,
      canRetry: true
    };

    toast.error(errorMessage);
  } finally {
    isSubmitting.value = false;
  }
}

function viewCreatedAppointment() {
  showSuccessModal.value = false;
  router.push({ name: 'SpecialistAppointmentDetails', params: { id: createdAppointmentId.value } });
}

function backToDashboard() {
  showSuccessModal.value = false;
  router.push({ name: 'SpecialistAppointmentsDashboard' });
}

// Reset payment consent when payment source changes (but not on initial load)
let previousPaymentSource = payment.source;
watch(() => payment.source, (newSource, oldSource) => {
  // Only reset if the source actually changed by user action (not from draft restore)
  if (oldSource && newSource !== oldSource && previousPaymentSource !== null) {
    paymentConsentGiven.value = false;
    paymentConsentChecked.value = false;
    payment.paymentReference = '';
    payment.paymentRefId = '';
  }
  previousPaymentSource = newSource;
});

// Lifecycle
// Draft restore modal state
const showDraftModal = ref(false);
const draftInfo = ref(null);

onMounted(() => {
  checkForExistingDraft();
  loadMyPatients();
  loadFilterOptions();
  loadSpecialtyCategories();
});

// Check for existing draft and show restore prompt
function checkForExistingDraft() {
  // If navigating with fresh=true query param, skip draft restore
  if (route.query.fresh === 'true') {
    clearDraft();
    // Clear the query param from URL without navigation
    router.replace({ name: 'SpecialistAppointmentsCreate', query: {} });
    return;
  }

  const saved = localStorage.getItem('specialist_appointment_draft');
  if (saved) {
    try {
      const draft = JSON.parse(saved);
      const savedAt = new Date(draft.savedAt);
      const hoursDiff = (new Date() - savedAt) / (1000 * 60 * 60);

      // Only show restore prompt if draft is less than 72 hours old and has meaningful data
      if (hoursDiff < 72 && draft.currentStep >= 2) {
        draftInfo.value = {
          step: draft.currentStep,
          patientName: draft.patient?.name || draft.manualPatient?.firstName + ' ' + draft.manualPatient?.lastName || 'Unknown',
          savedAt: savedAt,
          formattedTime: savedAt.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
        };
        showDraftModal.value = true;
      } else if (hoursDiff >= 72) {
        // Draft expired, clear it
        clearDraft();
      }
    } catch (e) {
      console.error('Failed to parse draft:', e);
      clearDraft();
    }
  }
}

function restoreDraft() {
  loadFromLocalStorage();
  showDraftModal.value = false;
  toast.success('Draft restored successfully!');
}

function discardDraft() {
  clearDraft();
  showDraftModal.value = false;
  toast.info('Draft discarded. Starting fresh.');
}

function clearDraft() {
  localStorage.removeItem('specialist_appointment_draft');
  draftInfo.value = null;
}

// Auto-save draft when leaving steps 2-5
function autoSaveDraft() {
  // Only auto-save if we have meaningful data (at least completed step 1)
  if (currentStep.value >= 2 || patient.id || isManualEntryValid.value) {
    const draft = {
      currentStep: currentStep.value,
      patient: { ...patient },
      manualPatient: { ...manualPatient },
      appointmentDetails: { ...appointmentDetails },
      schedule: {
        ...schedule,
        calendarBaseDate: schedule.calendarBaseDate.toISOString(), // Serialize date
      },
      payment: { ...payment },
      notes: { ...notes },
      patientConsent: { ...patientConsent },
      // Payment consent state
      paymentConsentGiven: paymentConsentGiven.value,
      paymentConsentChecked: paymentConsentChecked.value,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('specialist_appointment_draft', JSON.stringify(draft));
  }
}

// Watch for step changes to load data and auto-save
watch(currentStep, (newStep, oldStep) => {
  // Auto-save when moving between steps (except when completing step 6)
  if (oldStep >= 1 && oldStep <= 5 && newStep <= 6) {
    autoSaveDraft();
  }

  if (newStep === 3) {
    // Load available slots when entering Step 3
    loadAvailableSlotsForWeek();
  }
  if (newStep === 4) {
    // Load wallet balances and fees when entering Step 4
    loadPatientWalletBalance();
    loadSpecialistWalletBalance();
    loadConsultationFees();
    // Set channel details from Step 2
    payment.videoPlatform = appointmentDetails.channel === 'zoom' ? 'zoom' : appointmentDetails.channel;
  }
});

// Also auto-save when browser is about to unload (refresh/close)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (currentStep.value >= 2) {
      autoSaveDraft();
    }
  });
}
</script>

<style scoped lang="scss">
@import './styles/sa-variables';

// Additional Variables
$success: #10B981;
$danger: #EF4444;
$warning: #F59E0B;
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

.create-wizard-page {
  min-height: 100vh;
  background: $gray-50;
  font-family: 'Inter', sans-serif;
  padding-top: 65px; // Account for fixed header
  padding-bottom: 100px; // Account for fixed footer
}

// Header
.wizard-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: white;
  border-bottom: 1px solid $gray-200;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  height: 65px;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: $gray-600;
  text-decoration: none;
  font-weight: 500;
  &:hover { color: $gray-900; }
}

.cancel-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: white;
  border: 1px solid $gray-300;
  border-radius: 0.5rem;
  color: $gray-700;
  font-weight: 500;
  cursor: pointer;
  &:hover { background: $gray-50; }
}

// Main Content
.wizard-main {
  padding: 2rem;
}

.wizard-container {
  max-width: 1400px;
  margin: 0 auto;
}

// Title Section
.wizard-title-section {
  margin-bottom: 2rem;
}

.title-block {
  margin-bottom: 1.5rem;

  .title-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  h1 {
    font-size: 1.875rem;
    font-weight: 700;
    color: $sa-sky-dark;
    margin: 0 0 0.5rem;
  }
  p {
    font-size: 1.125rem;
    color: $gray-500;
    margin: 0;
  }
}

// Specialist Badge
.specialist-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid $gray-200;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  .specialist-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    background: linear-gradient(135deg, $sa-sky-light, $sa-sky);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-initials {
      color: white;
      font-weight: 700;
      font-size: 1rem;
    }
  }

  .specialist-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;

    .specialist-name {
      font-weight: 600;
      font-size: 0.9375rem;
      color: $gray-900;
      margin: 0;
    }

    .specialist-specialty {
      font-size: 0.8125rem;
      color: $gray-500;
      margin: 0;
    }
  }
}

// Progress Steps
.progress-steps {
  display: flex;
  align-items: center;
  background: white;
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid $gray-200;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;

  &.active .step-circle {
    background: $sa-sky;
    color: white;
  }
  &.completed .step-circle {
    background: $success;
    color: white;
  }
  &.active .step-name { color: $gray-900; }
  &.completed .step-name { color: $gray-900; }
}

.step-circle {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: $gray-200;
  color: $gray-500;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.step-text {
  display: flex;
  flex-direction: column;
}

.step-name {
  font-weight: 600;
  color: $gray-500;
  font-size: 0.875rem;
}

.step-subtitle {
  font-size: 0.75rem;
  color: $gray-400;
}

.step-line {
  flex: 1;
  height: 2px;
  background: $gray-200;
  margin: 0 1rem;
  &.completed { background: $success; }
}

// Content Grid
.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

// Step Card
.step-card {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid $gray-200;
  padding: 1.5rem;
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }

  // For cards with tabs (Step 1), remove padding - tab-content handles it
  &.has-tabs {
    padding: 0;
    overflow: hidden;
  }
}

// Tabs
.tabs-header {
  display: flex;
  border-bottom: 1px solid $gray-200;
  padding: 0 1.5rem;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: $gray-600;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: $gray-900;
    background: $gray-50;
  }

  &.active {
    color: $sa-sky-dark;
    border-bottom-color: $sa-sky;
  }
}

// Tab Content
.tab-content {
  padding: 1.5rem;
}

// Search Block
.search-block {
  margin-bottom: 1.5rem;

  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: $gray-700;
    margin-bottom: 0.75rem;
  }
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border: 1px solid $gray-300;
  border-radius: 0.5rem;
  background: white;

  &:focus-within {
    border-color: $sa-sky;
    box-shadow: 0 0 0 3px rgba($sa-sky, 0.1);
  }

  &.platform:focus-within {
    border-color: $sa-sky;
    box-shadow: 0 0 0 3px rgba($sa-sky, 0.1);
  }

  input {
    flex: 1;
    border: none;
    background: none;
    font-size: 0.875rem;
    color: $gray-900;
    &::placeholder { color: $gray-400; }
    &:focus { outline: none; }
  }

  svg { color: $gray-400; }
}

// Patients Header
.patients-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.patients-count {
  font-size: 0.875rem;
  font-weight: 600;
  color: $gray-700;
  span { color: $gray-500; font-weight: 400; }
}

.sort-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid $gray-300;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: $gray-700;
  background: white;
  cursor: pointer;
}

// Patients List
.patients-list {
  max-height: 500px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

// Patient Card
.patient-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border: 2px solid $gray-200;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: $sa-sky;
    background: rgba($sa-sky, 0.02);
  }

  &.selected {
    border-color: $sa-sky;
    background: rgba($sa-sky, 0.05);
  }

  &.platform {
    border-color: rgba($sa-sky, 0.3);
    &:hover {
      border-color: $sa-sky;
      background: rgba($sa-sky, 0.02);
    }
    &.selected {
      border-color: $sa-sky;
      background: rgba($sa-sky, 0.05);
    }
  }
}

.patient-avatar {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, $gray-100, $gray-200);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid $gray-100;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-initials {
    font-size: 1rem;
    font-weight: 700;
    color: $gray-500;
  }
}

.patient-info {
  flex: 1;
  min-width: 0;
}

.patient-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: $gray-900;
  margin: 0 0 0.25rem;
}

.patient-email {
  font-size: 0.875rem;
  color: $gray-600;
  margin: 0 0 0.5rem;
}

.patient-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.75rem;
  color: $gray-500;

  span {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }
}

.patient-status {
  text-align: right;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;

  &.active {
    background: rgba($success, 0.1);
    color: $success;
  }

  &.platform {
    background: rgba($sa-sky, 0.1);
    color: $sa-sky-dark;
  }

  &.small {
    padding: 0.25rem 0.5rem;
    font-size: 0.6875rem;
  }
}

.last-visit, .not-in-practice {
  font-size: 0.75rem;
  color: $gray-500;
  margin: 0;
  strong { font-weight: 600; }
}

// Info Banner
.info-banner {
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem;
  border-radius: 0.5rem;
  margin-top: 1.5rem;
  border-left: 4px solid;

  &.info {
    background: rgba($sa-sky, 0.05);
    border-color: $sa-sky;
    svg { color: $sa-sky; }
  }

  &.warning {
    background: rgba($warning, 0.05);
    border-color: $warning;
    svg { color: $warning; }
  }

  svg { flex-shrink: 0; margin-top: 0.125rem; }
}

.banner-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: $gray-900;
  margin: 0 0 0.5rem;
}

.banner-text {
  font-size: 0.875rem;
  color: $gray-700;
  line-height: 1.5;
  margin: 0 0 0.5rem;
  &:last-child { margin-bottom: 0; }
}

// Empty State
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  background: $gray-50;
  border: 2px dashed $gray-300;
  border-radius: 0.75rem;

  svg { color: $gray-300; margin-bottom: 1rem; }
}

.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: $gray-600;
  margin: 0 0 0.5rem;
}

.empty-subtitle {
  font-size: 0.875rem;
  color: $gray-500;
  margin: 0;
}

// Manual Entry Form
.manual-entry-form {
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-group {
    margin-bottom: 1.25rem;

    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: $gray-700;
      margin-bottom: 0.5rem;

      .required { color: $danger; }
      .optional { color: $gray-500; font-weight: 400; }
    }

    input, select, textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid $gray-300;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      color: $gray-900;
      &:focus {
        outline: none;
        border-color: $sa-sky;
        box-shadow: 0 0 0 3px rgba($sa-sky, 0.1);
      }
    }

    textarea { resize: vertical; }
  }

  .form-hint {
    font-size: 0.75rem;
    color: $gray-500;
    margin-top: 0.375rem;
  }
}

// Consent Section
.consent-section {
  border-top: 1px solid $gray-200;
  padding-top: 1.5rem;
  margin-top: 1rem;

  h3 {
    font-size: 1.125rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 1rem;
  }
}

.consent-box {
  border: 2px solid $warning;
  border-radius: 0.5rem;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.consent-checkbox {
  display: flex;
  gap: 0.75rem;
  cursor: pointer;

  input[type="checkbox"] {
    width: 1.25rem;
    height: 1.25rem;
    margin-top: 0.125rem;
    flex-shrink: 0;
  }

  .consent-text {
    font-size: 0.875rem;
    color: $gray-700;

    strong {
      display: block;
      color: $gray-900;
      margin-bottom: 0.25rem;
    }
  }
}

.compliance-note {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba($sa-sky, 0.05);
  border: 1px solid rgba($sa-sky, 0.2);
  border-radius: 0.5rem;
  margin-top: 1rem;

  svg { color: $sa-sky; flex-shrink: 0; }
}

.note-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: $gray-900;
  margin: 0 0 0.25rem;
}

.note-text {
  font-size: 0.75rem;
  color: $gray-700;
  margin: 0;
  line-height: 1.5;
}

// Right Sidebar
.right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sidebar-card {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid $gray-200;
  padding: 1.5rem;

  h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.125rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 1rem;
    svg { color: $sa-sky; }
  }
}

// Selected Patient Card
.no-patient {
  text-align: center;
  padding: 2rem 1rem;
}

.no-patient-icon {
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  background: $gray-100;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  svg { color: $gray-300; }
}

.no-patient-title {
  font-weight: 600;
  color: $gray-700;
  margin: 0 0 0.5rem;
}

.no-patient-text {
  font-size: 0.875rem;
  color: $gray-500;
  line-height: 1.5;
  margin: 0;
}

.selected-patient-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid $gray-200;
  margin-bottom: 1rem;
}

.selected-avatar {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  overflow: hidden;
  background: $gray-100;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-initials {
    font-size: 1.25rem;
    font-weight: 700;
    color: $gray-500;
  }
}

.selected-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: $gray-900;
  margin: 0 0 0.25rem;
}

.selected-email {
  font-size: 0.875rem;
  color: $gray-600;
  margin: 0;
}

.selected-details {
  margin-bottom: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: $gray-600;
  svg { color: $gray-400; }
}

.detail-value {
  font-weight: 600;
  color: $gray-900;
  font-size: 0.875rem;
}

.consent-indicator {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba($warning, 0.1);
  border: 1px solid rgba($warning, 0.3);
  border-radius: 0.5rem;
  margin-bottom: 1rem;

  svg { color: $warning; }
}

.consent-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: $gray-900;
  margin: 0;
}

.consent-text {
  font-size: 0.6875rem;
  color: $gray-600;
  margin: 0;
}

.clear-selection-btn, .view-profile-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.clear-selection-btn {
  background: $gray-100;
  border: none;
  color: $gray-700;
  &:hover { background: $gray-200; }
}

.view-profile-btn {
  background: white;
  border: 1px solid $gray-300;
  color: $gray-700;
  &:hover { background: $gray-50; }
}

// Progress Card
.progress-card {
  background: linear-gradient(135deg, rgba($sa-sky, 0.05), white);
  border-color: rgba($sa-sky, 0.2);
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  &.pending { opacity: 0.4; }
  &.active .progress-circle {
    background: $sa-sky;
    color: white;
    box-shadow: 0 2px 8px rgba($sa-sky, 0.3);
  }
  &.completed .progress-circle {
    background: $success;
    color: white;
  }
  &.active .progress-name { color: $gray-900; font-weight: 700; }
  &.active .progress-status { color: $sa-sky-dark; font-weight: 500; }
}

.progress-circle {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  background: $gray-200;
  color: $gray-500;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.progress-text {
  flex: 1;
}

.progress-name {
  display: block;
  font-weight: 600;
  color: $gray-600;
  font-size: 0.875rem;
}

.progress-status {
  display: block;
  font-size: 0.75rem;
  color: $gray-400;
}

.current-dot {
  color: $sa-sky;
}

// Help Card
.help-header {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.25rem;

  h3 {
    font-size: 1rem;
    margin: 0 0 0.25rem;
  }

  p {
    font-size: 0.875rem;
    color: $gray-600;
    margin: 0;
  }
}

.help-icon {
  width: 2.75rem;
  height: 2.75rem;
  background: rgba($sa-sky, 0.1);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  svg { color: $sa-sky; }
}

.help-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.help-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0.75rem 1rem;
  background: $gray-50;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: $gray-700;
  cursor: pointer;
  transition: background 0.2s;

  &:hover { background: $gray-100; }

  span {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    svg { color: $sa-sky; }
  }
}

// Footer
.wizard-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid $gray-200;
  padding: 1rem 2rem;
  z-index: 30;
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.05);
}

.footer-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-btn, .draft-btn, .continue-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn {
  background: white;
  border: 2px solid $gray-300;
  color: $gray-700;
  &:hover { background: $gray-50; }
}

.footer-right {
  display: flex;
  gap: 0.75rem;
}

.draft-btn {
  background: white;
  border: 2px solid $gray-300;
  color: $gray-700;
  &:hover { background: $gray-50; }
}

.continue-btn {
  background: $sa-sky;
  border: 2px solid $sa-sky;
  color: white;
  &:hover { background: $sa-sky-dark; border-color: $sa-sky-dark; }

  &.disabled {
    background: $gray-300;
    border-color: $gray-300;
    color: $gray-500;
    cursor: not-allowed;
  }
}

.confirm-hint {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: $sa-sky;
  font-size: 0.875rem;
  font-weight: 500;
}

// Utilities
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// Placeholder for other steps
.step-placeholder {
  padding: 3rem;
  text-align: center;
  color: $gray-500;

  h2 {
    color: $gray-900;
    margin-bottom: 0.5rem;
  }
}

// =====================
// STEP 2: Type & Details
// =====================
.step-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  // Form elements for Step 2+
  .form-group {
    margin-bottom: 1rem;

    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: $gray-700;
      margin-bottom: 0.5rem;
    }

    input[type="text"],
    input[type="email"],
    input[type="tel"],
    input[type="date"],
    input[type="datetime-local"],
    input[type="number"] {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid $gray-300;
      border-radius: 0.5rem;
      font-size: 0.9375rem;
      color: $gray-900;
      background: white;

      &:focus {
        outline: none;
        border-color: $sa-sky;
        box-shadow: 0 0 0 3px rgba($sa-sky, 0.1);
      }

      &::placeholder {
        color: $gray-400;
      }
    }

    textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid $gray-300;
      border-radius: 0.5rem;
      font-size: 0.9375rem;
      color: $gray-900;
      background: white;
      resize: vertical;
      font-family: inherit;
      line-height: 1.5;

      &:focus {
        outline: none;
        border-color: $sa-sky;
        box-shadow: 0 0 0 3px rgba($sa-sky, 0.1);
      }

      &::placeholder {
        color: $gray-400;
      }
    }

    select {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid $gray-300;
      border-radius: 0.5rem;
      font-size: 0.9375rem;
      color: $gray-900;
      background: white;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      background-size: 1.25rem;

      &:focus {
        outline: none;
        border-color: $sa-sky;
        box-shadow: 0 0 0 3px rgba($sa-sky, 0.1);
      }
    }
  }
}

.section-header {
  margin-bottom: 1.5rem;

  h2 {
    font-size: 1.25rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 0.5rem;

    .optional-tag {
      font-size: 0.75rem;
      font-weight: 500;
      color: $gray-500;
      background: $gray-100;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      margin-left: 0.5rem;
    }
  }

  p {
    font-size: 0.875rem;
    color: $gray-600;
    margin: 0;
  }
}

// Channel Grid
.channel-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.channel-card {
  padding: 1.5rem;
  border: 2px solid $gray-200;
  border-radius: 0.75rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover:not(.disabled) {
    border-color: $sa-sky;
    background: rgba($sa-sky, 0.02);
  }

  &.selected {
    border-color: $sa-sky;
    background: rgba($sa-sky, 0.05);

    .channel-icon {
      background: $sa-sky !important;
      svg { color: white !important; }
    }
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.channel-icon {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  transition: all 0.2s;

  &.blue { background: #DBEAFE; svg { color: #3B82F6; } }
  &.green { background: #D1FAE5; svg { color: #10B981; } }
  &.purple { background: #EDE9FE; svg { color: #8B5CF6; } }
}

.channel-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: $gray-900;
  margin: 0 0 0.5rem;
}

.channel-desc {
  font-size: 0.875rem;
  color: $gray-600;
  margin: 0;
}

.channel-disabled {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.625rem;
  color: $gray-500;
  background: $gray-100;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

// Visit Reasons List
.visit-reasons-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.reason-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border: 2px solid $gray-200;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: $sa-sky;
    background: rgba($sa-sky, 0.02);
  }

  &.selected {
    border-color: $sa-sky;
    background: rgba($sa-sky, 0.05);

    .reason-check .checked { color: $sa-sky; }
  }

  &.urgent:hover {
    border-color: $danger;
    background: rgba($danger, 0.02);
  }

  &.urgent.selected {
    border-color: $danger;
    background: rgba($danger, 0.05);
  }
}

.reason-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.reason-info {
  flex: 1;
}

.reason-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: $gray-900;
  margin: 0 0 0.25rem;
}

.reason-desc {
  font-size: 0.875rem;
  color: $gray-600;
  margin: 0;
}

.reason-check {
  .unchecked { color: $gray-300; }
  .checked { color: $sa-sky; }
}

.other-reason-input {
  margin-top: 1rem;

  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: $gray-700;
    margin-bottom: 0.5rem;
  }

  textarea {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid $gray-300;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    resize: vertical;

    &:focus {
      outline: none;
      border-color: $sa-sky;
      box-shadow: 0 0 0 3px rgba($sa-sky, 0.1);
    }
  }
}

// Clinical Flags Grid
.flags-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.flag-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid $gray-200;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: $gray-50;
  }

  &.checked {
    border-color: $sa-sky;
    background: rgba($sa-sky, 0.05);
  }

  input[type="checkbox"] {
    width: 1.25rem;
    height: 1.25rem;
    margin-top: 0.125rem;
    accent-color: $sa-sky;
  }
}

.flag-content {
  flex: 1;
}

.flag-name {
  font-weight: 600;
  color: $gray-900;
  margin: 0 0 0.25rem;
}

.flag-desc {
  font-size: 0.75rem;
  color: $gray-600;
  margin: 0;
}

// Schedule Summary Card (Step 3+)
.schedule-summary-card {
  background: linear-gradient(135deg, rgba($sa-sky, 0.05), white);
  border-color: rgba($sa-sky, 0.2);
}

.schedule-display {
  .date-block {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding-bottom: 1rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid $gray-200;
  }

  .date-badge {
    width: 3.5rem;
    height: 3.5rem;
    background: $sa-sky;
    border-radius: 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;

    .month {
      font-size: 0.625rem;
      font-weight: 600;
      margin: 0;
    }

    .day {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
      line-height: 1;
    }
  }

  .date-info {
    .weekday {
      font-weight: 700;
      color: $gray-900;
      margin: 0;
    }

    .full-date {
      font-size: 0.875rem;
      color: $gray-600;
      margin: 0;
    }
  }
}

.schedule-details {
  margin-bottom: 1rem;
}

.schedule-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid $gray-100;

  svg { color: $sa-sky; }

  .detail-label {
    font-size: 0.75rem;
    color: $gray-500;
    margin: 0;
  }

  .detail-value {
    font-weight: 600;
    color: $gray-900;
    margin: 0;
  }
}

.schedule-status-badges {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.status-badge-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 500;

  &.success {
    background: rgba($success, 0.1);
    border: 1px solid rgba($success, 0.2);
    color: $gray-700;
    svg { color: $success; }
  }

  &.info {
    background: rgba($sa-sky, 0.1);
    border: 1px solid rgba($sa-sky, 0.2);
    color: $gray-700;
    svg { color: $sa-sky; }
  }

  &.purple {
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(139, 92, 246, 0.2);
    color: $gray-700;
    svg { color: #7C3AED; }
  }
}

// Summary Card (Step 2+)
.summary-card {
  background: linear-gradient(135deg, rgba($sa-sky, 0.05), white);
  border-color: rgba($sa-sky, 0.2);
}

.summary-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.summary-item {
  background: white;
  border: 1px solid $gray-200;
  border-radius: 0.5rem;
  padding: 0.875rem;
}

.summary-label {
  display: block;
  font-size: 0.6875rem;
  font-weight: 600;
  color: $gray-500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.375rem;
}

.summary-value {
  display: block;
  font-weight: 600;
  color: $gray-900;

  &.empty {
    color: $gray-400;
    font-weight: 400;
  }
}

// =====================
// STEP 3: Schedule
// =====================
.flex-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;

  h2 {
    font-size: 1.25rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0;
  }

  .subtitle {
    font-size: 0.875rem;
    color: $gray-600;
    margin: 0.25rem 0 0;
  }
}

.view-toggle {
  display: flex;
  background: $gray-100;
  border-radius: 0.5rem;
  padding: 0.25rem;

  button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    color: $gray-600;
    font-weight: 500;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s;

    &.active {
      background: white;
      color: $gray-900;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
  }
}

.calendar-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, rgba($sa-sky, 0.04), rgba($sa-sky, 0.02));
  border-radius: 0.75rem;
  border: 1px solid rgba($sa-sky, 0.1);
}

.nav-btn {
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid $gray-200;
  background: white;
  border-radius: 0.625rem;
  cursor: pointer;
  color: $gray-600;
  transition: all 0.2s;

  &:hover {
    border-color: $sa-sky;
    background: rgba($sa-sky, 0.05);
    color: $sa-sky;
  }
}

.current-date {
  text-align: center;

  h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: $sa-sky-dark;
    margin: 0;
  }

  p {
    font-size: 0.875rem;
    color: $gray-500;
    margin: 0.25rem 0 0;
  }
}

.day-strip {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.625rem;
  margin-bottom: 1.5rem;
}

.day-cell {
  text-align: center;
  padding: 1rem 0.5rem;
  border-radius: 0.75rem;
  border: 2px solid transparent;
  background: $gray-50;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover:not(.past) {
    background: white;
    border-color: rgba($sa-sky, 0.3);
    box-shadow: 0 2px 8px rgba($sa-sky, 0.1);
  }

  &.selected {
    background: linear-gradient(135deg, $sa-sky, $sa-sky-dark);
    border-color: $sa-sky-dark;
    box-shadow: 0 4px 12px rgba($sa-sky, 0.3);

    .day-name, .day-number { color: white; }
    .slot-count {
      background: white;
      color: $sa-sky-dark;
      font-weight: 700;
    }
  }

  &.past {
    opacity: 0.4;
    cursor: not-allowed;
    background: $gray-100;
  }

  &.today {
    border-color: $sa-sky;
    background: white;

    .day-number {
      font-weight: 800;
      color: $sa-sky;
    }
  }
}

.day-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: $gray-500;
  margin-bottom: 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.day-number {
  font-size: 1.375rem;
  font-weight: 700;
  color: $gray-800;
}

.slot-count {
  position: absolute;
  top: 0.375rem;
  right: 0.375rem;
  font-size: 0.625rem;
  font-weight: 600;
  background: $success;
  color: white;
  padding: 0.125rem 0.5rem;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba($success, 0.3);
}

// Week Grid View
.week-grid-view {
  border: 1px solid $gray-200;
  border-radius: 0.75rem;
  overflow: hidden;
  margin-bottom: 1rem;
}

.week-grid-header {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
  background: linear-gradient(135deg, $gray-50, white);
  border-bottom: 1px solid $gray-200;
}

.week-time-col {
  padding: 0.75rem 0.5rem;
  border-right: 1px solid $gray-200;
}

.week-day-col {
  padding: 0.75rem 0.5rem;
  text-align: center;
  border-right: 1px solid $gray-100;

  &:last-child {
    border-right: none;
  }

  &.today {
    background: rgba($sa-sky, 0.08);

    .week-day-num {
      color: $sa-sky;
      font-weight: 800;
    }
  }

  &.past {
    opacity: 0.5;
  }
}

.week-day-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: $gray-500;
  text-transform: uppercase;
  margin: 0 0 0.25rem;
}

.week-day-num {
  font-size: 1.125rem;
  font-weight: 700;
  color: $gray-800;
  margin: 0;
}

.week-grid-body {
  max-height: 400px;
  overflow-y: auto;
}

.week-time-row {
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
  border-bottom: 1px solid $gray-100;

  &:last-child {
    border-bottom: none;
  }
}

.week-time-label {
  padding: 0.75rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: $gray-500;
  text-align: right;
  border-right: 1px solid $gray-200;
  background: $gray-50;
}

.week-slot-cell {
  padding: 0.5rem;
  min-height: 44px;
  border-right: 1px solid $gray-100;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:last-child {
    border-right: none;
  }

  &:hover:not(.past):not(.booked) {
    background: rgba($sa-sky, 0.08);
  }

  &.past {
    background: $gray-50;
    cursor: not-allowed;
  }

  &.available {
    background: rgba($success, 0.06);

    &:hover {
      background: rgba($success, 0.12);
    }
  }

  &.booked {
    background: rgba($gray-400, 0.1);
    cursor: not-allowed;
  }

  &.selected {
    background: linear-gradient(135deg, rgba($sa-sky, 0.15), rgba($sa-sky, 0.08));
    box-shadow: inset 0 0 0 2px $sa-sky;
  }
}

.slot-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.available {
    background: $success;
    box-shadow: 0 0 0 2px rgba($success, 0.2);
  }

  &.booked {
    background: $gray-400;
  }
}

.calendar-legend {
  display: flex;
  gap: 1.5rem;
  padding: 1rem 0;
  margin-top: 0.5rem;
  border-top: 1px solid $gray-100;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: $gray-600;
}

.legend-dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

  &.available { background: $success; }
  &.booked { background: $gray-400; }
  &.conflict { background: $danger; }
  &.patient-busy { background: $warning; }
}

// Duration Grid
.duration-grid {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.duration-btn {
  padding: 0.875rem 1.75rem;
  border: 2px solid $gray-200;
  background: white;
  border-radius: 0.625rem;
  font-weight: 600;
  font-size: 0.9375rem;
  color: $gray-700;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $sa-sky;
    background: rgba($sa-sky, 0.03);
    transform: translateY(-1px);
  }

  &.selected {
    border-color: $sa-sky;
    background: linear-gradient(135deg, rgba($sa-sky, 0.08), rgba($sa-sky, 0.03));
    color: $sa-sky-dark;
    box-shadow: 0 2px 8px rgba($sa-sky, 0.15);
  }
}

.duration-custom {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1rem;
  border: 2px solid $gray-200;
  border-radius: 0.625rem;
  background: white;
  transition: all 0.2s;

  &:focus-within {
    border-color: $sa-sky;
    box-shadow: 0 0 0 3px rgba($sa-sky, 0.1);
  }

  input {
    width: 4rem;
    border: none;
    padding: 0.875rem 0;
    font-size: 0.9375rem;
    font-weight: 600;
    color: $gray-900;
    background: transparent;

    &:focus { outline: none; }
    &::placeholder { color: $gray-400; }
  }

  span {
    color: $gray-500;
    font-size: 0.875rem;
    font-weight: 500;
  }
}

// Timezone Display
.timezone-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: $gray-600;
  background: linear-gradient(135deg, $gray-100, $gray-50);
  padding: 0.625rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid $gray-200;
}

// Loading & Empty States
.loading-slots, .no-date-selected, .no-slots {
  text-align: center;
  padding: 3rem 2rem;
  color: $gray-500;
  background: $gray-50;
  border-radius: 0.75rem;
  border: 2px dashed $gray-200;

  svg {
    color: $gray-400;
    margin-bottom: 1rem;
  }

  p {
    margin: 0;
    font-weight: 500;
  }

  .spin {
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// Time Sections
.time-section {
  margin-bottom: 2rem;
}

.time-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid $gray-100;

  h3 {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    font-size: 1rem;
    font-weight: 700;
    color: $gray-800;
    margin: 0;

    .sun-icon { color: #F59E0B; }
    .afternoon-icon { color: #F97316; }
    .evening-icon { color: #6366F1; }
  }

  span {
    font-size: 0.8125rem;
    font-weight: 500;
    color: $gray-500;
    background: $gray-100;
    padding: 0.25rem 0.75rem;
    border-radius: 1rem;
  }
}

.time-slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
}

.time-slot-btn {
  padding: 1rem 0.75rem;
  border: 2px solid $gray-200;
  background: white;
  border-radius: 0.625rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;

  &:hover:not(:disabled) {
    border-color: $sa-sky;
    background: rgba($sa-sky, 0.03);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba($sa-sky, 0.12);
  }

  &.selected {
    border-color: $sa-sky;
    background: linear-gradient(135deg, rgba($sa-sky, 0.1), rgba($sa-sky, 0.05));
    box-shadow: 0 4px 12px rgba($sa-sky, 0.2);

    .slot-time { color: $sa-sky-dark; }
    .slot-status { color: $sa-sky-dark; font-weight: 600; }
  }

  &.booked {
    opacity: 0.5;
    cursor: not-allowed;
    background: $gray-50;
    border-color: $gray-200;
  }

  &.conflict {
    border-color: rgba($danger, 0.4);
    background: rgba($danger, 0.05);
    cursor: not-allowed;
  }

  &:disabled {
    cursor: not-allowed;
  }
}

.slot-time {
  font-weight: 700;
  font-size: 1rem;
  color: $gray-800;
  margin: 0 0 0.375rem;
}

.slot-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  margin: 0;

  &.available { color: $success; }
  &.booked { color: $gray-400; }
  &.conflict { color: $danger; }
  &.patient_conflict { color: $warning; }
}

.time-slot-btn.patient-conflict {
  border-color: rgba($warning, 0.4);
  background: rgba($warning, 0.05);
  cursor: not-allowed;

  .slot-time { color: $gray-500; }
}

.custom-time-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid $gray-200;
  text-align: center;
}

.custom-time-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1.75rem;
  border: 2px dashed $gray-300;
  background: white;
  border-radius: 0.625rem;
  color: $gray-600;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $sa-sky;
    color: $sa-sky;
    background: rgba($sa-sky, 0.02);
    transform: translateY(-1px);
  }

  svg {
    transition: transform 0.2s;
  }

  &:hover svg {
    transform: rotate(90deg);
  }
}

// AI Card
.ai-card {
  background: linear-gradient(135deg, rgba($sa-sky, 0.05), white);
  border-color: rgba($sa-sky, 0.2);
}

.ai-badge {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  background: linear-gradient(135deg, rgba($sa-sky, 0.15), rgba($sa-sky, 0.08));
  color: $sa-sky-dark;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 1rem;
}

.ai-suggestions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.ai-suggestion-card {
  padding: 1.25rem;
  border: 2px solid $gray-200;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;

  &:hover {
    border-color: $sa-sky;
    background: rgba($sa-sky, 0.02);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba($sa-sky, 0.12);
  }

  &.best {
    border-color: rgba($sa-sky, 0.4);
    background: linear-gradient(135deg, rgba($sa-sky, 0.06), rgba($sa-sky, 0.02));
  }
}

.suggestion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;

  svg { color: $sa-sky; }
}

.suggestion-badge {
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  background: linear-gradient(135deg, rgba($sa-sky, 0.15), rgba($sa-sky, 0.08));
  color: $sa-sky-dark;
}

.suggestion-datetime {
  font-size: 1.125rem;
  font-weight: 700;
  color: $gray-800;
  margin: 0 0 0.25rem;
}

.suggestion-date {
  font-size: 0.875rem;
  color: $gray-600;
  margin: 0 0 0.75rem;
}

.suggestion-score {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: $gray-600;

  svg { color: $success; }
}

// Reminders Section
.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: $gray-800;
  margin: 0 0 1.5rem;
}

.reminders-section {
  margin-bottom: 2rem;

  h3 {
    font-size: 1rem;
    font-weight: 700;
    color: $gray-800;
    margin: 0 0 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    svg { color: $sa-sky; }
  }
}

.reminder-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.reminder-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border: 2px solid $gray-200;
  border-radius: 0.625rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;

  &:hover {
    background: $gray-50;
    border-color: rgba($sa-sky, 0.2);
  }

  &:has(input:checked) {
    border-color: rgba($sa-sky, 0.3);
    background: rgba($sa-sky, 0.02);
  }
}

.reminder-left {
  display: flex;
  align-items: center;
  gap: 0.875rem;

  input[type="checkbox"] {
    width: 1.25rem;
    height: 1.25rem;
    accent-color: $sa-sky;
    cursor: pointer;
  }
}

.reminder-info {
  .reminder-name {
    font-weight: 600;
    color: $gray-800;
    margin: 0;
  }

  .reminder-desc {
    font-size: 0.75rem;
    color: $gray-500;
    margin: 0.125rem 0 0;
  }
}

.reminder-option select {
  padding: 0.5rem 0.875rem;
  border: 1px solid $gray-300;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: $gray-700;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: $sa-sky;
  }

  &:focus {
    outline: none;
    border-color: $sa-sky;
    box-shadow: 0 0 0 3px rgba($sa-sky, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// Buffer Section
.buffer-section {
  padding-top: 1.5rem;
  border-top: 1px solid $gray-200;

  h3 {
    font-size: 1rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 1rem;
  }
}

.buffer-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.buffer-field {
  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: $gray-700;
    margin-bottom: 0.5rem;
  }

  select {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid $gray-300;
    border-radius: 0.5rem;
    font-size: 0.9375rem;

    &:focus {
      outline: none;
      border-color: $sa-sky;
    }
  }

  .field-hint {
    font-size: 0.75rem;
    color: $gray-500;
    margin: 0.375rem 0 0;
  }
}

// Custom Time Modal
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.custom-time-modal {
  background: white;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 28rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid $gray-200;

  h3 {
    font-size: 1.125rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    color: $gray-500;
    cursor: pointer;
    padding: 0.25rem;

    &:hover { color: $gray-700; }
  }
}

.modal-body {
  padding: 1.5rem;
}

.modal-warning {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba($warning, 0.1);
  border: 1px solid rgba($warning, 0.3);
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: $gray-700;

  svg { color: $warning; flex-shrink: 0; margin-top: 0.125rem; }
}

.custom-time-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  .form-group {
    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: $gray-700;
      margin-bottom: 0.5rem;
    }

    input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid $gray-300;
      border-radius: 0.5rem;
      font-size: 0.9375rem;

      &:focus {
        outline: none;
        border-color: $sa-sky;
      }
    }
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid $gray-200;
  background: $gray-50;
  border-radius: 0 0 0.75rem 0.75rem;

  .cancel-btn {
    padding: 0.75rem 1.5rem;
    border: 1px solid $gray-300;
    background: white;
    border-radius: 0.5rem;
    font-weight: 500;
    color: $gray-700;
    cursor: pointer;

    &:hover { background: $gray-50; }
  }

  .apply-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    background: $sa-sky;
    border-radius: 0.5rem;
    font-weight: 500;
    color: white;
    cursor: pointer;

    &:hover { background: $sa-sky-dark; }
  }
}

// =====================
// STEP 4: Fee & Payment
// =====================

// Fee Structure
.fee-structure {
  margin-bottom: 1.5rem;
}

.fee-card {
  background: white;
  border: 2px solid $gray-200;
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.fee-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1.25rem;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid $gray-200;
}

.fee-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, rgba($sa-sky, 0.15), rgba($sa-sky, 0.05));
  display: flex;
  align-items: center;
  justify-content: center;
  color: $sa-sky;
}

.fee-info {
  flex: 1;

  h4 {
    font-size: 1.125rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 0.25rem;
  }

  p {
    font-size: 0.875rem;
    color: $gray-500;
    margin: 0;
  }
}

.fee-amounts {
  margin-bottom: 1.25rem;
}

.fee-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid $gray-100;

  &:last-child {
    border-bottom: none;
  }

  &.total {
    padding-top: 1rem;
    margin-top: 0.5rem;
    border-top: 2px solid $gray-200;
    border-bottom: none;

    .fee-label {
      font-weight: 700;
      font-size: 1rem;
      color: $gray-900;
    }

    .fee-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: $sa-sky-dark;
    }
  }
}

.fee-label {
  font-size: 0.9375rem;
  color: $gray-600;
}

.fee-value {
  font-size: 1rem;
  font-weight: 600;
  color: $gray-900;
}

.custom-fee-toggle {
  padding-top: 1rem;
  border-top: 1px solid $gray-200;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;

  input[type="checkbox"] {
    width: 1.25rem;
    height: 1.25rem;
    accent-color: $sa-sky;
  }

  span {
    font-weight: 600;
    color: $gray-700;
  }
}

.custom-fee-input {
  display: flex;
  align-items: center;
  margin-top: 0.75rem;
  border: 2px solid $gray-300;
  border-radius: 0.5rem;
  overflow: hidden;
  background: white;

  &:focus-within {
    border-color: $sa-sky;
    box-shadow: 0 0 0 3px rgba($sa-sky, 0.1);
  }

  .currency-prefix {
    padding: 0.75rem 1rem;
    background: $gray-100;
    font-weight: 600;
    color: $gray-600;
    border-right: 1px solid $gray-300;
    flex-shrink: 0;
  }

  input {
    flex: 1;
    min-width: 0;
    border: none;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    font-weight: 600;
    color: $gray-900;
    background: white;
    -moz-appearance: textfield; // Hide number spinners Firefox

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    &:focus {
      outline: none;
    }

    &::placeholder {
      color: $gray-400;
      font-weight: 400;
      font-weight: 400;
    }
  }
}

// Payment Methods
.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.payment-option {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  border: 2px solid $gray-200;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  background: white;

  &:hover:not(.disabled) {
    border-color: $sa-sky;
    background: rgba($sa-sky, 0.02);
  }

  &.selected {
    border-color: $sa-sky;
    background: rgba($sa-sky, 0.05);
  }

  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: $gray-50;
  }

  &.error:not(.selected) {
    border-color: rgba($danger, 0.3);
    background: rgba($danger, 0.02);
  }

  &.specialist-wallet {
    border-style: dashed;

    &.selected {
      border-style: solid;
    }
  }
}

.payment-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.card {
    background: #DBEAFE;
    color: #3B82F6;
  }

  &.wallet-patient {
    background: #D1FAE5;
    color: #10B981;
  }

  &.wallet-specialist {
    background: #FEF3C7;
    color: #F59E0B;
  }
}

.payment-info {
  flex: 1;

  h4 {
    font-size: 1rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 0.25rem;
  }

  p {
    font-size: 0.875rem;
    color: $gray-600;
    margin: 0;
    line-height: 1.4;

    &.error-text {
      color: $danger;
    }
  }
}

.payment-tag {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 500;
  color: $gray-500;
  background: $gray-100;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  margin-top: 0.5rem;
}

.payment-check {
  flex-shrink: 0;

  .unchecked {
    color: $gray-300;
  }

  .checked {
    color: $sa-sky;
  }

  .error {
    color: $danger;
  }
}

// Channel Configuration
.channel-config {
  background: $gray-50;
  border-radius: 0.75rem;
  padding: 1.25rem;
}

.channel-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.config-option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border: 1px solid $gray-200;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: rgba($sa-sky, 0.3);
    background: rgba($sa-sky, 0.02);
  }

  &:has(input:checked) {
    border-color: $sa-sky;
    background: rgba($sa-sky, 0.05);
  }

  input[type="checkbox"] {
    width: 1.25rem;
    height: 1.25rem;
    margin-top: 0.125rem;
    accent-color: $sa-sky;
    flex-shrink: 0;
  }
}

.option-content {
  flex: 1;

  .option-name {
    display: block;
    font-weight: 600;
    color: $gray-800;
    margin-bottom: 0.25rem;
  }

  .option-desc {
    display: block;
    font-size: 0.8125rem;
    color: $gray-500;
    line-height: 1.4;
  }
}

.channel-info-box {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: white;
  border: 1px solid $gray-200;
  border-radius: 0.5rem;

  svg {
    color: $sa-sky;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  h4 {
    font-size: 1rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 0.5rem;
  }

  p {
    font-size: 0.875rem;
    color: $gray-600;
    margin: 0;
    line-height: 1.5;
  }
}

// Pay Now Section
.pay-now-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid $gray-200;
}

.pay-now-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, $sa-sky, $sa-sky-dark);
  border: none;
  border-radius: 0.75rem;
  color: white;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba($sa-sky, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba($sa-sky, 0.4);
  }

  &:disabled {
    background: $gray-300;
    cursor: not-allowed;
    box-shadow: none;
  }
}

.payment-confirmed {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba($success, 0.1);
  border: 2px solid rgba($success, 0.3);
  border-radius: 0.75rem;

  > svg {
    color: $success;
    flex-shrink: 0;
  }

  h4 {
    font-size: 1rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 0.25rem;
  }

  p {
    font-size: 0.875rem;
    color: $gray-600;
    margin: 0;
  }

  .change-btn {
    margin-left: auto;
    padding: 0.5rem 1rem;
    background: white;
    border: 1px solid $gray-300;
    border-radius: 0.5rem;
    color: $gray-700;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: $gray-50;
      border-color: $gray-400;
    }
  }
}

// Payment Consent Modal
.payment-consent-modal {
  background: white;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 32rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.consent-summary {
  background: $gray-50;
  border-radius: 0.5rem;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.consent-amount,
.consent-source,
.consent-patient {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;

  &:not(:last-child) {
    border-bottom: 1px solid $gray-200;
  }

  .label {
    font-size: 0.875rem;
    color: $gray-500;
  }

  .value {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: $gray-900;

    svg {
      color: $sa-sky;
    }
  }
}

.consent-amount .value {
  font-size: 1.25rem;
  color: $sa-sky-dark;
}

.consent-warning {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba($warning, 0.1);
  border: 1px solid rgba($warning, 0.3);
  border-radius: 0.5rem;
  margin-bottom: 1.25rem;

  > svg {
    color: $warning;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  p {
    font-size: 0.875rem;
    color: $gray-700;
    margin: 0 0 0.5rem;
  }

  ul {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.8125rem;
    color: $gray-600;

    li {
      margin-bottom: 0.25rem;
    }
  }

  &.specialist {
    background: rgba($sa-sky, 0.08);
    border-color: rgba($sa-sky, 0.2);

    > svg {
      color: $sa-sky;
    }
  }
}

.consent-checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba($sa-sky, 0.05);
  border: 2px solid rgba($sa-sky, 0.2);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: $sa-sky;
  }

  &:has(input:checked) {
    border-color: $sa-sky;
    background: rgba($sa-sky, 0.1);
  }

  input[type="checkbox"] {
    width: 1.25rem;
    height: 1.25rem;
    margin-top: 0.125rem;
    accent-color: $sa-sky;
    flex-shrink: 0;
  }

  span {
    font-size: 0.9375rem;
    font-weight: 500;
    color: $gray-700;
    line-height: 1.4;
  }
}

.payment-consent-modal .modal-footer {
  .confirm-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, $sa-sky, $sa-sky-dark);
    border: none;
    border-radius: 0.5rem;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba($sa-sky, 0.3);
    }

    &:disabled {
      background: $gray-300;
      cursor: not-allowed;
    }
  }
}

// Success text for payment options
.payment-info .success-text {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: $success !important;
  font-weight: 500;

  svg {
    color: $success;
  }
}

// Payment Summary Sidebar Card
.payment-summary-card {
  background: linear-gradient(135deg, rgba($success, 0.05), white);
  border-color: rgba($success, 0.2);
}

.payment-summary {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.payment-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;

  .label {
    font-size: 0.875rem;
    color: $gray-600;
  }

  .value {
    font-size: 0.875rem;
    font-weight: 600;
    color: $gray-900;
  }

  &.total {
    border-top: 1px solid $gray-200;
    margin-top: 0.5rem;
    padding-top: 0.75rem;

    .label {
      font-weight: 600;
      color: $gray-800;
    }

    .value {
      font-size: 1.125rem;
      font-weight: 700;
      color: $success;
    }
  }
}

.payment-method-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: rgba($sa-sky, 0.1);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: $sa-sky-dark;

  svg {
    color: $sa-sky;
  }
}

// =====================
// Step 5: Notes & Instructions Styles
// =====================

.notes-section {
  background: white;
  border: 1px solid $gray-200;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }

  // Form elements inside notes section
  .form-group {
    margin-bottom: 1rem;

    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: $gray-700;
      margin-bottom: 0.5rem;
    }

    input[type="text"],
    input[type="email"],
    input[type="tel"],
    input[type="date"],
    input[type="datetime-local"],
    input[type="number"] {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid $gray-300;
      border-radius: 0.5rem;
      font-size: 0.9375rem;
      color: $gray-900;
      background: white;

      &:focus {
        outline: none;
        border-color: $sa-sky;
        box-shadow: 0 0 0 3px rgba($sa-sky, 0.1);
      }

      &::placeholder {
        color: $gray-400;
      }
    }

    textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid $gray-300;
      border-radius: 0.5rem;
      font-size: 0.9375rem;
      color: $gray-900;
      background: white;
      resize: vertical;
      font-family: inherit;
      line-height: 1.5;
      min-height: 100px;

      &:focus {
        outline: none;
        border-color: $sa-sky;
        box-shadow: 0 0 0 3px rgba($sa-sky, 0.1);
      }

      &::placeholder {
        color: $gray-400;
      }
    }

    select {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid $gray-300;
      border-radius: 0.5rem;
      font-size: 0.9375rem;
      color: $gray-900;
      background: white;
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      background-size: 1.25rem;

      &:focus {
        outline: none;
        border-color: $sa-sky;
        box-shadow: 0 0 0 3px rgba($sa-sky, 0.1);
      }
    }
  }
}

.section-header-with-badge {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.privacy-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;

  &.private {
    background: rgba(147, 51, 234, 0.1);
    color: #7C3AED;
  }

  &.visible {
    background: rgba($sa-sky, 0.1);
    color: $sa-sky;
  }

  &.required {
    background: rgba($danger, 0.1);
    color: $danger;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    display: flex !important;
    flex-direction: column !important;
    grid-template-columns: none !important;
  }
}

.textarea-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.help-text {
  font-size: 0.75rem;
  color: $gray-500;
}

.templates-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid $gray-200;

  h3 {
    font-size: 0.9375rem;
    font-weight: 700;
    color: $gray-900;
    margin-bottom: 1rem;
  }
}

.templates-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;

  @media (max-width: 768px) {
    display: flex !important;
    flex-direction: column !important;
    grid-template-columns: none !important;
  }
}

// Step 5 specific - these use explicit classes to avoid conflicts
.step5-form-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.step5-templates-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.step5-patient-templates {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.step5-upload-zones {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.template-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: $gray-50;
  border: 1px solid $gray-200;
  border-radius: 0.5rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba($sa-sky, 0.05);
    border-color: rgba($sa-sky, 0.3);
  }

  svg {
    color: $sa-sky;
    flex-shrink: 0;
  }

  .template-info {
    .template-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: $gray-900;
      margin-bottom: 0.125rem;
    }

    .template-desc {
      font-size: 0.75rem;
      color: $gray-500;
    }
  }
}

.patient-templates-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.patient-template-btn {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba($sa-sky, 0.05);
  border: 1px solid rgba($sa-sky, 0.2);
  border-radius: 0.5rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba($sa-sky, 0.1);
    border-color: rgba($sa-sky, 0.3);
  }

  svg {
    color: $sa-sky;
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .template-content {
    flex: 1;

    .template-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: $gray-900;
      margin-bottom: 0.25rem;
    }

    .template-preview {
      font-size: 0.8125rem;
      color: $gray-600;
      line-height: 1.5;
    }
  }
}

.info-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-top: 1rem;

  svg {
    flex-shrink: 0;
    margin-top: 0.125rem;
  }

  .info-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: $gray-900;
    margin-bottom: 0.25rem;
  }

  .info-text {
    font-size: 0.8125rem;
    color: $gray-700;
    line-height: 1.5;
  }

  &.success {
    background: rgba($success, 0.05);
    border: 1px solid rgba($success, 0.2);

    svg { color: $success; }
  }

  &.warning {
    background: rgba($warning, 0.05);
    border: 1px solid rgba($warning, 0.2);

    svg { color: $warning; }
  }

  &.info {
    background: rgba($sa-sky, 0.05);
    border: 1px solid rgba($sa-sky, 0.2);

    svg { color: $sa-sky; }
  }
}

// Attachments Section
.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.add-files-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: $sa-sky;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: darken($sa-sky, 5%);
  }
}

.hidden-input {
  display: none;
}

.upload-zones {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 0.5rem !important;
    width: 100% !important;
    max-width: 100% !important;
  }
}

.upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  border: 2px dashed $gray-300;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;

  &:hover {
    border-color: $sa-sky;
    background: rgba($sa-sky, 0.02);
  }

  svg {
    color: $gray-400;
    margin-bottom: 0.75rem;
  }

  .zone-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: $gray-900;
    margin-bottom: 0.25rem;
  }

  .zone-desc {
    font-size: 0.75rem;
    color: $gray-500;
  }
}

.uploaded-files {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.uploaded-file {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: $gray-50;
  border: 1px solid $gray-200;
  border-radius: 0.5rem;

  .file-icon {
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.5rem;

    &.pdf {
      background: rgba($danger, 0.1);
      svg { color: $danger; }
    }

    &.word {
      background: rgba($sa-sky, 0.1);
      svg { color: $sa-sky; }
    }

    &.excel {
      background: rgba($success, 0.1);
      svg { color: $success; }
    }

    &.image {
      background: rgba(147, 51, 234, 0.1);
      svg { color: #7C3AED; }
    }

    &.other {
      background: rgba($gray-500, 0.1);
      svg { color: $gray-500; }
    }
  }

  .file-info {
    flex: 1;

    .file-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: $gray-900;
      margin-bottom: 0.125rem;
    }

    .file-meta {
      font-size: 0.75rem;
      color: $gray-500;
    }
  }

  .file-actions {
    display: flex;
    gap: 0.5rem;
  }

  .file-action-btn {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border: 1px solid $gray-200;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s;

    svg { color: $gray-400; }

    &:hover {
      background: $gray-100;
      svg { color: $sa-sky; }
    }

    &.danger:hover {
      svg { color: $danger; }
    }
  }
}

// Consent Section
.consent-alert {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba($danger, 0.05);
  border: 2px solid rgba($danger, 0.2);
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;

  .consent-alert-icon {
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $danger;
    border-radius: 50%;
    flex-shrink: 0;

    svg { color: white; }
  }

  .consent-alert-content {
    flex: 1;

    h3 {
      font-size: 1rem;
      font-weight: 700;
      color: $gray-900;
      margin-bottom: 0.5rem;
    }

    > p {
      font-size: 0.875rem;
      color: $gray-700;
      margin-bottom: 1rem;
      line-height: 1.6;

      strong {
        color: $gray-900;
      }
    }
  }
}

.consent-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.consent-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;

  input[type="checkbox"] {
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
    margin-top: 0.125rem;
    accent-color: $sa-sky;
  }

  .checkbox-text {
    font-size: 0.875rem;
    color: $gray-900;
    line-height: 1.5;
  }
}

// Notes Summary Sidebar Card
.notes-summary-card {
  background: linear-gradient(135deg, rgba($sa-sky, 0.03), white);
}

.notes-summary-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.summary-item {
  padding: 0.875rem;
  border-radius: 0.5rem;
  background: $gray-50;
  border: 1px solid $gray-200;

  &.filled {
    background: rgba($success, 0.05);
    border-color: rgba($success, 0.2);
  }

  .summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.375rem;
  }

  .summary-label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: $gray-700;
  }

  .summary-badge {
    font-size: 0.6875rem;
    font-weight: 700;
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    text-transform: uppercase;

    &.private {
      background: #7C3AED;
      color: white;
    }

    &.visible {
      background: $sa-sky;
      color: white;
    }

    &.files {
      background: $success;
      color: white;
    }

    &.complete {
      background: $success;
      color: white;
    }

    &.pending {
      background: $danger;
      color: white;
    }
  }

  .summary-text {
    font-size: 0.75rem;
    color: $gray-500;
  }

  .summary-files {
    margin-top: 0.5rem;

    .file-item {
      font-size: 0.6875rem;
      color: $gray-600;
      margin-bottom: 0.125rem;
    }

    .file-more {
      font-size: 0.6875rem;
      color: $gray-400;
      font-style: italic;
    }
  }
}

.summary-warning {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba($warning, 0.1);
  border: 1px solid rgba($warning, 0.2);
  border-radius: 0.5rem;

  svg {
    color: $warning;
    flex-shrink: 0;
  }

  p {
    font-size: 0.75rem;
    color: $gray-700;
  }
}

// Draft Restore Modal
.draft-modal {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  max-width: 420px;
  width: 90%;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

  .draft-modal-icon {
    width: 4rem;
    height: 4rem;
    margin: 0 auto 1.25rem;
    background: rgba($sa-sky, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      color: $sa-sky;
    }
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: $gray-900;
    margin-bottom: 0.75rem;
  }

  .draft-modal-text {
    font-size: 0.9375rem;
    color: $gray-600;
    margin-bottom: 0.5rem;
    line-height: 1.5;

    strong {
      color: $gray-900;
    }
  }

  .draft-modal-meta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.8125rem;
    color: $gray-500;
    margin-bottom: 1.5rem;

    svg {
      color: $gray-400;
    }
  }

  .draft-modal-actions {
    display: flex;
    gap: 0.75rem;

    button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .discard-btn {
      background: white;
      border: 1px solid $gray-300;
      color: $gray-700;

      &:hover {
        background: $gray-50;
        border-color: $gray-400;
      }
    }

    .restore-btn {
      background: $sa-sky;
      border: none;
      color: white;

      &:hover {
        background: darken($sa-sky, 5%);
      }
    }
  }
}

// Step 6: Review & Confirm Styles
// =====================

.step-6-review {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

// Hide mobile confirm section on desktop
.mobile-confirm-section {
  display: none;
}

// Details Grid (Appointment Details section)
.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.detail-card {
  padding: 1rem;
  background: $gray-50;
  border-radius: 0.5rem;

  .card-label {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: $gray-500;
    margin: 0 0 0.5rem;
  }

  .card-value {
    font-size: 1.125rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 0.25rem;
  }

  .card-desc {
    font-size: 0.8125rem;
    color: $gray-600;
    margin: 0;
  }

  .flags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .flag-badge {
    display: inline-block;
    padding: 0.25rem 0.625rem;
    background: rgba($sa-sky, 0.1);
    color: $sa-sky;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 9999px;
  }
}

// Schedule Grid (Schedule & Timing section)
.schedule-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.schedule-card {
  padding: 1.25rem;
  border-radius: 0.75rem;

  &.blue {
    background: linear-gradient(135deg, rgba($sa-sky, 0.05), rgba($sa-sky, 0.15));
  }

  &.green {
    background: linear-gradient(135deg, rgba($success, 0.05), rgba($success, 0.15));
  }

  &.purple {
    background: linear-gradient(135deg, rgba(#7C3AED, 0.05), rgba(#7C3AED, 0.15));
  }

  .schedule-icon {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;

    svg { color: $sa-sky; }
  }

  &.green .schedule-icon svg { color: $success; }
  &.purple .schedule-icon svg { color: #7C3AED; }

  .schedule-label {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: $gray-600;
    margin: 0 0 0.25rem;
  }

  .schedule-day,
  .schedule-time,
  .schedule-duration {
    font-size: 1.5rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 0.125rem;
  }

  .schedule-full-date,
  .schedule-timezone,
  .schedule-end {
    font-size: 0.8125rem;
    color: $gray-600;
    margin: 0;
  }

  &.blue .schedule-full-date { color: $sa-sky; font-weight: 600; }
}

.reminders-info {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba($sa-sky, 0.05);
  border: 1px solid rgba($sa-sky, 0.2);
  border-radius: 0.5rem;

  svg { color: $sa-sky; flex-shrink: 0; margin-top: 0.125rem; }

  .reminders-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: $gray-900;
    margin: 0 0 0.25rem;
  }

  .reminders-text {
    font-size: 0.8125rem;
    color: $gray-700;
    margin: 0;
  }
}

// Channel & Payment Grid
.channel-payment-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.channel-card {
  padding: 1.25rem;
  background: linear-gradient(135deg, rgba($sa-sky, 0.05), rgba($sa-sky, 0.1));
  border: 2px solid $sa-sky;
  border-radius: 0.75rem;

  .channel-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

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
    font-weight: 600;
    color: $gray-600;
    margin: 0 0 0.125rem;
  }

  .channel-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0;
  }

  .channel-desc {
    font-size: 0.8125rem;
    color: $gray-700;
    margin: 0;
  }
}

.fee-card {
  padding: 1.25rem;
  background: linear-gradient(135deg, rgba($success, 0.05), rgba($success, 0.1));
  border: 2px solid $success;
  border-radius: 0.75rem;

  .fee-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .fee-icon {
    width: 3rem;
    height: 3rem;
    background: $success;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;

    svg { color: white; }
  }

  .fee-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: $gray-600;
    margin: 0 0 0.125rem;
  }

  .fee-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0;
  }

  .fee-desc {
    font-size: 0.8125rem;
    color: $gray-700;
    margin: 0;
  }
}

.payment-breakdown {
  padding: 1.25rem;
  background: $gray-50;
  border-radius: 0.75rem;

  h4 {
    font-size: 1rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 1rem;
  }

  .breakdown-rows {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .breakdown-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px dashed $gray-200;

    &:last-child { border-bottom: none; }

    span:first-child {
      font-size: 0.875rem;
      color: $gray-700;
    }

    span:last-child {
      font-size: 0.875rem;
      font-weight: 600;
      color: $gray-900;
    }

    &.total {
      border-top: 2px solid $gray-300;
      border-bottom: none;
      padding-top: 0.875rem;
      margin-top: 0.5rem;

      span:first-child {
        font-weight: 700;
        color: $gray-900;
      }

      .total-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: $success;
      }
    }

    &.earnings {
      span:first-child {
        font-weight: 700;
        color: $gray-900;
      }

      .earnings-value {
        font-size: 1.125rem;
        font-weight: 700;
        color: $sa-sky;
      }
    }
  }

  .payment-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;

    &.success {
      background: rgba($success, 0.1);
      color: $success;
    }
  }
}

// Notes Review Cards
.notes-review-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notes-review-card {
  padding: 1.25rem;
  border-radius: 0.75rem;

  &.private {
    background: rgba(#7C3AED, 0.05);
    border: 1px solid rgba(#7C3AED, 0.2);
  }

  &.visible {
    background: rgba($sa-sky, 0.05);
    border: 1px solid rgba($sa-sky, 0.2);
  }

  .notes-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      svg { color: #7C3AED; }

      h4 {
        font-size: 0.9375rem;
        font-weight: 700;
        color: $gray-900;
        margin: 0;
      }
    }
  }

  &.visible .notes-card-header .header-left svg { color: $sa-sky; }

  .privacy-tag {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;

    &.private {
      background: #7C3AED;
      color: white;
    }

    &.visible {
      background: $sa-sky;
      color: white;
    }
  }

  .notes-content {
    background: white;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 0.75rem;

    p {
      font-size: 0.875rem;
      color: $gray-700;
      line-height: 1.6;
      margin: 0;
    }
  }

  .notes-meta {
    display: flex;
    gap: 1.5rem;
    font-size: 0.8125rem;
    color: $gray-600;

    span {
      display: flex;
      align-items: center;
      gap: 0.25rem;

      svg { color: $gray-400; }
    }
  }
}

.no-notes-message {
  text-align: center;
  padding: 2rem;
  background: $gray-50;
  border-radius: 0.5rem;

  svg { color: $gray-300; margin-bottom: 0.75rem; }

  p {
    font-size: 0.875rem;
    color: $gray-500;
    margin: 0;
  }
}

// Attachments Review
.attachments-review {
  padding: 1.25rem;
  background: rgba($success, 0.05);
  border: 1px solid rgba($success, 0.2);
  border-radius: 0.75rem;

  .attachments-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;

    svg { color: $success; }

    h4 {
      font-size: 0.9375rem;
      font-weight: 700;
      color: $gray-900;
      margin: 0;
    }
  }

  .attachments-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .attachment-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background: white;
    border-radius: 0.5rem;

    .attachment-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .attachment-icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;

      &.pdf { background: rgba($danger, 0.1); svg { color: $danger; } }
      &.excel { background: rgba($success, 0.1); svg { color: $success; } }
      &.word { background: rgba($sa-sky, 0.1); svg { color: $sa-sky; } }
      &.image { background: rgba(#7C3AED, 0.1); svg { color: #7C3AED; } }
    }

    .attachment-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: $gray-900;
      margin: 0 0 0.125rem;
    }

    .attachment-size {
      font-size: 0.6875rem;
      color: $gray-500;
      margin: 0;
    }

    .attachment-download {
      background: none;
      border: none;
      color: $sa-sky;
      cursor: pointer;
      padding: 0.5rem;

      &:hover { color: darken($sa-sky, 10%); }
    }
  }
}

// Attachments Review Card (in Step 6)
.attachments-review-card {
  padding: 1.25rem;
  background: rgba($success, 0.05);
  border: 1px solid rgba($success, 0.2);
  border-radius: 0.75rem;

  .notes-card-header {
    margin-bottom: 1rem;

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      svg { color: $success; }

      h4 {
        font-size: 0.9375rem;
        font-weight: 700;
        color: $gray-900;
        margin: 0;
      }
    }
  }

  .attachments-list {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .attachment-item {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 0.875rem 1rem;
    background: white;
    border-radius: 0.5rem;
    border: 1px solid $gray-100;

    .file-icon {
      width: 2.75rem;
      height: 2.75rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;

      &.pdf { background: rgba($danger, 0.1); svg { color: $danger; } }
      &.image { background: rgba(#7C3AED, 0.1); svg { color: #7C3AED; } }
      &.document { background: rgba($sa-sky, 0.1); svg { color: $sa-sky; } }
      &.spreadsheet { background: rgba($success, 0.1); svg { color: $success; } }
    }

    .file-details {
      flex: 1;

      .file-name {
        font-size: 0.875rem;
        font-weight: 600;
        color: $gray-900;
        margin: 0 0 0.125rem;
      }

      .file-size {
        font-size: 0.75rem;
        color: $gray-500;
        margin: 0;
      }
    }
  }
}

// Consent Verification Section
.consent-verified-section {
  border: 2px solid $success !important;

  .consent-verified-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;

    .consent-icon {
      width: 3.5rem;
      height: 3.5rem;
      background: $success;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      svg { color: white; }
    }

    h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: $gray-900;
      margin: 0 0 0.25rem;
    }

    p {
      font-size: 0.875rem;
      color: $gray-600;
      margin: 0;
    }

    .verified-badge {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 1rem;
      background: $success;
      color: white;
      font-size: 0.8125rem;
      font-weight: 700;
      border-radius: 9999px;
    }
  }

  .consent-checks-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .consent-check-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem;
    background: $gray-50;
    border-radius: 0.5rem;

    svg { color: $gray-400; }

    span {
      font-size: 0.875rem;
      color: $gray-700;
      font-weight: 500;
    }

    &.checked {
      background: rgba($success, 0.1);

      svg { color: $success; }
    }
  }

  .consent-details {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    padding: 1rem;
    background: $gray-50;
    border-radius: 0.5rem;

    .consent-detail {
      .detail-label {
        font-size: 0.6875rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: $gray-500;
        margin: 0 0 0.25rem;
      }

      .detail-value {
        font-size: 0.9375rem;
        font-weight: 600;
        color: $gray-900;
        margin: 0;
      }
    }
  }
}

// Cancellation Policy Section
.policy-section {
  .policy-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.5rem;

    .policy-icon {
      width: 3rem;
      height: 3rem;
      background: rgba($warning, 0.15);
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      svg { color: $warning; }
    }

    h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: $gray-900;
      margin: 0 0 0.25rem;
    }

    p {
      font-size: 0.875rem;
      color: $gray-600;
      margin: 0;
    }
  }

  .policy-items {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .policy-item {
    display: flex;
    align-items: flex-start;
    gap: 0.875rem;
    padding: 1rem;
    background: $gray-50;
    border-radius: 0.5rem;

    svg {
      flex-shrink: 0;
      margin-top: 0.125rem;

      &.success { color: $success; }
      &.warning { color: $warning; }
      &.danger { color: $danger; }
      &.info { color: $sa-sky; }
    }

    .policy-title {
      font-size: 0.9375rem;
      font-weight: 700;
      color: $gray-900;
      margin: 0 0 0.25rem;
    }

    .policy-desc {
      font-size: 0.8125rem;
      color: $gray-700;
      margin: 0;
      line-height: 1.5;
    }

    &.info {
      background: rgba($sa-sky, 0.05);
      border: 1px solid rgba($sa-sky, 0.2);
    }
  }

  .policy-consent-checkbox {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    background: $gray-50;
    border-radius: 0.5rem;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s;

    &:hover {
      background: rgba($sa-sky, 0.05);
    }

    &:has(input:checked) {
      background: rgba($sa-sky, 0.05);
      border-color: $sa-sky;
    }

    input[type="checkbox"] {
      width: 1.25rem;
      height: 1.25rem;
      margin-top: 0.125rem;
      accent-color: $sa-sky;
      cursor: pointer;
      flex-shrink: 0;
    }

    span {
      font-size: 0.875rem;
      color: $gray-700;
      line-height: 1.6;
    }
  }
}

.appointment-summary-hero {
  background: linear-gradient(135deg, $sa-sky 0%, darken($sa-sky, 10%) 100%);
  border-radius: 1rem;
  padding: 2rem;
  color: white;

  .summary-hero-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;

    h2 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 0.25rem;
    }

    p {
      font-size: 0.875rem;
      opacity: 0.9;
      margin: 0;
    }
  }

  .appointment-id-badge {
    background: rgba(white, 0.2);
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    text-align: right;

    .id-label {
      font-size: 0.6875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.8;
      margin: 0 0 0.25rem;
    }

    .id-value {
      font-size: 1rem;
      font-weight: 700;
      font-family: monospace;
      margin: 0;
    }
  }

  .summary-hero-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }

  .summary-hero-item {
    background: rgba(white, 0.15);
    padding: 1.25rem;
    border-radius: 0.75rem;
    text-align: center;

    .item-icon {
      width: 3rem;
      height: 3rem;
      background: rgba(white, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 0.75rem;
    }

    .item-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.8;
      margin: 0 0 0.25rem;
    }

    .item-value {
      font-size: 1.125rem;
      font-weight: 700;
      margin: 0;
    }
  }
}

.review-section {
  background: white;
  border: 1px solid $gray-200;
  border-radius: 0.75rem;
  padding: 1.5rem;

  .section-header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid $gray-100;

    h3 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      font-weight: 700;
      color: $gray-900;
      margin: 0;

      svg { color: $sa-sky; }
    }

    .edit-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.875rem;
      background: rgba($sa-sky, 0.1);
      border: none;
      border-radius: 0.375rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: $sa-sky;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: rgba($sa-sky, 0.2);
      }
    }
  }
}

.patient-review-card {
  display: flex;
  gap: 1.25rem;
  padding: 1.25rem;
  background: $gray-50;
  border-radius: 0.75rem;
  margin-bottom: 1rem;

  .patient-review-avatar {
    width: 5rem;
    height: 5rem;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    background: $sa-sky;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-initials.large {
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
    }
  }

  .patient-review-info {
    flex: 1;

    h4 {
      font-size: 1.125rem;
      font-weight: 700;
      color: $gray-900;
      margin: 0 0 0.75rem;
    }
  }

  .patient-details-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .detail-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;

    .detail-icon {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.blue { background: rgba($sa-sky, 0.1); svg { color: $sa-sky; } }
      &.green { background: rgba($success, 0.1); svg { color: $success; } }
      &.purple { background: rgba(#7C3AED, 0.1); svg { color: #7C3AED; } }
      &.pink { background: rgba(#EC4899, 0.1); svg { color: #EC4899; } }
    }

    .detail-label {
      font-size: 0.6875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: $gray-500;
      margin: 0 0 0.125rem;
    }

    .detail-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: $gray-900;
      margin: 0;
    }
  }

  .new-patient-alert {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-top: 1rem;
    padding: 0.875rem;
    background: rgba($warning, 0.1);
    border: 1px solid rgba($warning, 0.2);
    border-radius: 0.5rem;

    svg { color: $warning; flex-shrink: 0; }

    .alert-title {
      font-size: 0.8125rem;
      font-weight: 600;
      color: darken($warning, 15%);
      margin: 0 0 0.125rem;
    }

    .alert-text {
      font-size: 0.75rem;
      color: darken($warning, 10%);
      margin: 0;
    }
  }
}

.appointment-review-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.review-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: $gray-50;
  border-radius: 0.5rem;

  .review-item-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.blue { background: rgba($sa-sky, 0.1); svg { color: $sa-sky; } }
    &.green { background: rgba($success, 0.1); svg { color: $success; } }
    &.purple { background: rgba(#7C3AED, 0.1); svg { color: #7C3AED; } }
  }

  .review-item-label {
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: $gray-500;
    margin: 0 0 0.25rem;
  }

  .review-item-value {
    font-size: 0.9375rem;
    font-weight: 600;
    color: $gray-900;
    margin: 0;
  }
}

.channel-review-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  background: linear-gradient(135deg, rgba($sa-sky, 0.05), rgba($sa-sky, 0.1));
  border: 1px solid rgba($sa-sky, 0.2);
  border-radius: 0.75rem;
  margin-top: 1rem;

  .channel-info {
    display: flex;
    align-items: center;
    gap: 1rem;

    .channel-icon-box {
      width: 3.5rem;
      height: 3.5rem;
      background: $sa-sky;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;

      svg { color: white; }
    }

    .channel-label {
      font-size: 0.75rem;
      color: $gray-500;
      margin: 0 0 0.25rem;
    }

    .channel-value {
      font-size: 1rem;
      font-weight: 700;
      color: $gray-900;
      margin: 0;
    }
  }

  .channel-badge {
    background: white;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    color: $sa-sky;
    border: 1px solid rgba($sa-sky, 0.2);
  }
}

.schedule-review-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.schedule-review-item {
  padding: 1.25rem;
  border-radius: 0.75rem;
  text-align: center;

  &.blue { background: linear-gradient(135deg, rgba($sa-sky, 0.05), rgba($sa-sky, 0.1)); }
  &.green { background: linear-gradient(135deg, rgba($success, 0.05), rgba($success, 0.1)); }
  &.purple { background: linear-gradient(135deg, rgba(#7C3AED, 0.05), rgba(#7C3AED, 0.1)); }

  .schedule-icon {
    margin-bottom: 0.5rem;
    svg { color: $sa-sky; }
  }

  &.green .schedule-icon svg { color: $success; }
  &.purple .schedule-icon svg { color: #7C3AED; }

  .schedule-label {
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: $gray-600;
    margin: 0 0 0.25rem;
  }

  .schedule-main {
    font-size: 1.25rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 0.125rem;
  }

  .schedule-sub {
    font-size: 0.75rem;
    color: $gray-500;
    margin: 0;
  }
}

.payment-review-card {
  background: linear-gradient(135deg, rgba($success, 0.05), rgba($success, 0.1));
  border: 1px solid rgba($success, 0.2);
  border-radius: 0.75rem;
  padding: 1.5rem;

  .payment-source-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: white;
    border-radius: 9999px;
    font-size: 0.8125rem;
    font-weight: 600;
    color: $success;
    margin-bottom: 1.25rem;
    border: 1px solid rgba($success, 0.2);
  }

  .payment-breakdown {
    background: white;
    border-radius: 0.5rem;
    padding: 1rem;
  }

  .payment-row {
    display: flex;
    justify-content: space-between;
    padding: 0.625rem 0;
    border-bottom: 1px dashed $gray-200;

    &:last-child { border-bottom: none; }

    &.total {
      border-top: 2px solid $success;
      border-bottom: none;
      margin-top: 0.5rem;
      padding-top: 0.875rem;

      .payment-label,
      .payment-value {
        font-weight: 700;
        color: $success;
        font-size: 1rem;
      }
    }
  }

  .payment-label {
    font-size: 0.875rem;
    color: $gray-600;
  }

  .payment-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: $gray-900;
  }
}

.notes-review-card {
  padding: 1.25rem;
  background: $gray-50;
  border-radius: 0.75rem;
  margin-bottom: 1rem;

  &:last-child { margin-bottom: 0; }

  .notes-review-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;

    .notes-icon {
      width: 2rem;
      height: 2rem;
      background: rgba($sa-sky, 0.1);
      border-radius: 0.375rem;
      display: flex;
      align-items: center;
      justify-content: center;

      svg { color: $sa-sky; }

      &.yellow {
        background: rgba($warning, 0.1);
        svg { color: $warning; }
      }
    }

    h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: $gray-900;
      margin: 0;
    }
  }

  .notes-content {
    font-size: 0.875rem;
    color: $gray-700;
    line-height: 1.6;
    white-space: pre-wrap;
    padding: 1rem;
    background: white;
    border-radius: 0.5rem;
    border: 1px solid $gray-200;
  }

  .empty-notes {
    font-size: 0.875rem;
    color: $gray-400;
    font-style: italic;
  }
}

.consent-verification-box {
  background: linear-gradient(135deg, rgba($warning, 0.05), rgba($warning, 0.1));
  border: 1px solid rgba($warning, 0.3);
  border-radius: 0.75rem;
  padding: 1.5rem;

  .consent-header {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 1rem;

    .consent-icon {
      width: 2.5rem;
      height: 2.5rem;
      background: rgba($warning, 0.2);
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      svg { color: darken($warning, 10%); }
    }

    h4 {
      font-size: 1rem;
      font-weight: 600;
      color: darken($warning, 15%);
      margin: 0 0 0.25rem;
    }

    p {
      font-size: 0.8125rem;
      color: darken($warning, 5%);
      margin: 0;
    }
  }

  .consent-items {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    background: white;
    border-radius: 0.5rem;
    padding: 1rem;
  }

  .consent-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;

    svg {
      flex-shrink: 0;
      &.success { color: $success; }
      &.pending { color: $gray-400; }
    }

    span {
      font-size: 0.875rem;
      color: $gray-700;
    }
  }
}

.policy-acceptance-box {
  background: $gray-50;
  border: 1px solid $gray-200;
  border-radius: 0.75rem;
  padding: 1.5rem;

  .policy-checkbox {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    cursor: pointer;

    input[type="checkbox"] {
      width: 1.25rem;
      height: 1.25rem;
      margin-top: 0.125rem;
      accent-color: $sa-sky;
      cursor: pointer;
    }

    .policy-text {
      font-size: 0.875rem;
      color: $gray-700;
      line-height: 1.5;

      a {
        color: $sa-sky;
        text-decoration: none;
        font-weight: 500;

        &:hover { text-decoration: underline; }
      }
    }
  }

  .policy-details {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid $gray-200;
  }

  .policy-item {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-size: 0.8125rem;
    color: $gray-600;

    svg {
      color: $gray-400;
      flex-shrink: 0;
      margin-top: 0.125rem;
    }
  }
}

// Step 6 Sidebar Cards
.confirmation-checklist-card {
  .checklist-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.25rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid $gray-100;

    .checklist-icon {
      width: 2.5rem;
      height: 2.5rem;
      background: rgba($success, 0.1);
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;

      svg { color: $success; }
    }

    h3 {
      font-size: 1rem;
      font-weight: 700;
      color: $gray-900;
      margin: 0 0 0.125rem;
    }

    p {
      font-size: 0.75rem;
      color: $gray-500;
      margin: 0;
    }
  }

  .checklist-items {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    margin-bottom: 1.25rem;
  }

  .checklist-item {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding: 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.8125rem;
    color: $gray-500;

    svg:first-child { color: $gray-300; }

    .check-icon { color: $success; margin-left: auto; }
    .pending-icon { color: $warning; margin-left: auto; }

    &.completed {
      color: $gray-700;
      background: rgba($success, 0.05);

      svg:first-child { color: $success; }
    }

    &.pending {
      color: $warning;
      background: rgba($warning, 0.05);

      svg:first-child { color: $warning; }
    }
  }

  .total-box {
    background: linear-gradient(135deg, rgba($sa-sky, 0.05), rgba($sa-sky, 0.1));
    border-radius: 0.5rem;
    padding: 1rem;
    text-align: center;
    margin-bottom: 1rem;

    .total-label {
      font-size: 0.75rem;
      color: $gray-500;
      margin: 0 0 0.25rem;
    }

    .total-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: $sa-sky;
      margin: 0 0 0.25rem;
    }

    .total-desc {
      font-size: 0.6875rem;
      color: $gray-400;
      margin: 0;
    }
  }

  .submission-error {
    background: #FEF2F2;
    border: 1px solid #FECACA;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;

    .error-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #DC2626;
      font-weight: 600;
      font-size: 0.9375rem;
      margin-bottom: 0.5rem;

      svg {
        color: #DC2626;
      }
    }

    .error-message {
      color: #991B1B;
      font-size: 0.8125rem;
      margin: 0 0 0.5rem 0;
      line-height: 1.4;
    }

    .error-suggestion {
      color: #7F1D1D;
      font-size: 0.75rem;
      margin: 0 0 0.75rem 0;
      padding: 0.5rem;
      background: rgba(220, 38, 38, 0.1);
      border-radius: 0.25rem;
      line-height: 1.4;
    }

    .error-actions {
      display: flex;
      gap: 0.5rem;
    }

    .error-action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      padding: 0.5rem 0.75rem;
      background: #DC2626;
      color: white;
      border: none;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: #B91C1C;
      }
    }

    .error-dismiss-btn {
      padding: 0.5rem 0.75rem;
      background: white;
      color: #6B7280;
      border: 1px solid #D1D5DB;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #F3F4F6;
        color: #374151;
      }
    }
  }

  .confirm-booking-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    background: $success;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.9375rem;
    font-weight: 700;
    color: white;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(.disabled) {
      background: darken($success, 5%);
    }

    &.disabled {
      background: $gray-300;
      cursor: not-allowed;
    }

    .spin {
      animation: spin 1s linear infinite;
    }
  }

  .confirm-note {
    text-align: center;
    font-size: 0.6875rem;
    color: $gray-400;
    margin: 0.75rem 0 0;
  }
}

.notifications-preview-card {
  h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9375rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 1rem;

    svg { color: $sa-sky; }

    .success { color: $success; }
  }

  .notification-items {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .notification-item {
    display: flex;
    gap: 0.75rem;
    padding: 0.875rem;
    background: $gray-50;
    border-radius: 0.5rem;

    svg {
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    &.email svg { color: $sa-sky; }
    &.sms svg { color: $success; }
    &.account svg { color: #7C3AED; }
    &.reminder svg { color: $warning; }

    .notif-title {
      font-size: 0.8125rem;
      font-weight: 600;
      color: $gray-900;
      margin: 0 0 0.25rem;
    }

    .notif-to {
      font-size: 0.75rem;
      color: $gray-600;
      margin: 0 0 0.125rem;
    }

    .notif-desc {
      font-size: 0.6875rem;
      color: $gray-400;
      margin: 0;
    }
  }
}

.after-confirmation-card {
  h3 {
    font-size: 0.9375rem;
    font-weight: 700;
    color: $gray-900;
    margin: 0 0 1rem;
  }

  .after-items {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .after-item {
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem;
    background: $gray-50;
    border-radius: 0.5rem;

    svg {
      color: $sa-sky;
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    .after-title {
      font-size: 0.8125rem;
      font-weight: 600;
      color: $gray-900;
      margin: 0 0 0.125rem;
    }

    .after-desc {
      font-size: 0.6875rem;
      color: $gray-500;
      margin: 0;
    }
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// Responsive
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .right-sidebar {
    order: -1;
    flex-direction: row;
    flex-wrap: wrap;

    .sidebar-card {
      flex: 1;
      min-width: 280px;
    }
  }

  .progress-steps {
    overflow-x: auto;
    .step-text { display: none; }
  }
}

// =============================================
// MOBILE RESPONSIVE STYLES (768px and below)
// =============================================
// The parent layout (index.vue) provides the mobile header with
// Rapid Capsule logo. We hide the wizard's own header on mobile.

@media (max-width: 768px) {
  .create-wizard-page {
    padding-top: 0; // Parent header handles top spacing
    padding-bottom: 100px;
    min-height: auto;
  }

  // Hide the wizard's own header on mobile - parent header with logo shows
  .wizard-header {
    display: none;
  }

  .wizard-main {
    padding: 1rem;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    box-sizing: border-box;
  }

  .wizard-container {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    box-sizing: border-box;
  }

  .main-content {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
    box-sizing: border-box;
  }

  // Title section - compact mobile layout
  .wizard-title-section {
    margin-bottom: 1rem;
  }

  .title-block {
    margin-bottom: 1rem;

    .title-row {
      flex-direction: column;
      gap: 0;
    }

    h1 {
      font-size: 1.25rem;
      font-weight: 700;
      color: $gray-900;
      margin-bottom: 0.25rem;
    }

    p {
      font-size: 0.875rem;
      color: $gray-500;
    }
  }

  // Hide specialist badge on mobile
  .specialist-badge {
    display: none;
  }

  // Progress steps - horizontal scrollable with step numbers
  .progress-steps {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    gap: 0;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .step-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    flex: 0 0 auto;
  }

  .step-circle {
    width: 2rem;
    height: 2rem;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .step-text {
    display: flex;
    flex-direction: column;
    align-items: center;

    .step-name {
      font-size: 0.625rem;
      font-weight: 600;
      text-align: center;
      white-space: nowrap;
    }

    .step-subtitle {
      display: none;
    }
  }

  .step-line {
    flex: 1;
    height: 2px;
    min-width: 1rem;
    max-width: 2rem;
    margin: 0 0.25rem;
    margin-bottom: 1rem; // Align with circles
  }

  // Content Grid - single column
  .content-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }

  // Hide right sidebar on mobile
  .right-sidebar {
    display: none;
  }

  // Step cards
  .step-card {
    background: white;
    border-radius: 0.75rem;
    border: 1px solid $gray-200;
    padding: 1rem;
    margin-bottom: 1rem;

    &.has-tabs {
      padding: 0;
    }
  }

  // Tabs - horizontal scroll
  .tabs-header {
    display: flex;
    padding: 0 0.75rem;
    border-bottom: 1px solid $gray-200;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.75rem 1rem;
    font-size: 0.8125rem;
    font-weight: 600;
    white-space: nowrap;
    border-bottom: 2px solid transparent;

    svg {
      width: 14px;
      height: 14px;
    }

    &.active {
      color: $sa-sky-dark;
      border-bottom-color: $sa-sky;
    }
  }

  .tab-content {
    padding: 1rem;
  }

  // Search input
  .search-block {
    margin-bottom: 1rem;

    label {
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
  }

  .search-input-wrapper {
    padding: 0.75rem;
    border-radius: 0.5rem;

    input {
      font-size: 0.875rem;
    }
  }

  // Patients list
  .patients-header {
    margin-bottom: 0.75rem;
  }

  .patients-count {
    font-size: 0.75rem;
  }

  .sort-select {
    padding: 0.375rem 0.5rem;
    font-size: 0.75rem;
  }

  .patients-list {
    max-height: 400px;
    gap: 0.75rem;
  }

  // Patient card - mobile optimized (fix overflow)
  .patient-card {
    display: flex;
    flex-wrap: wrap;
    padding: 0.75rem;
    border-radius: 0.75rem;
    border-width: 2px;
    gap: 0.75rem;
    align-items: flex-start;

    &.selected {
      border-color: $sa-sky;
      background: rgba($sa-sky, 0.05);
    }

    &.platform {
      border-color: rgba($sa-sky, 0.3);
    }
  }

  .patient-avatar {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    border-radius: 50%;
    overflow: hidden;
  }

  // Fix: patient-info class (not patient-details)
  .patient-info {
    flex: 1;
    min-width: 0;
    max-width: calc(100% - 60px); // Avatar width + gap

    .patient-name {
      font-size: 0.875rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .patient-email {
      font-size: 0.75rem;
      color: $gray-600;
      margin-bottom: 0.5rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .patient-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.6875rem;
    color: $gray-500;
    margin-bottom: 0.5rem;

    span {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      white-space: nowrap;
    }
  }

  // Patient status - move to new row on mobile
  .patient-status {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 0.5rem;
    border-top: 1px solid $gray-100;
    margin-top: 0.25rem;
    text-align: left;

    .status-badge {
      margin-bottom: 0;
    }

    .not-in-practice,
    .last-visit {
      font-size: 0.6875rem;
      margin: 0;
    }
  }

  .patient-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.6875rem;
  }

  // Info banner - mobile fix
  .info-banner {
    flex-direction: column;
    padding: 1rem;
    margin-top: 0;
    margin-bottom: 1rem;
    gap: 0.5rem;

    svg {
      flex-shrink: 0;
    }

    .banner-title {
      font-size: 0.875rem;
    }

    .banner-text {
      font-size: 0.75rem;
      line-height: 1.5;
    }
  }

  // Manual entry form
  .manual-entry-form {
    .form-row {
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .form-group {
      label {
        font-size: 0.75rem;
        margin-bottom: 0.375rem;
      }

      input, select, textarea {
        padding: 0.75rem;
        font-size: 16px; // Prevent iOS zoom
        border-radius: 0.5rem;
      }
    }
  }

  // Step 2: Channel selection
  .channel-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .channel-card {
    display: flex;
    align-items: center;
    padding: 1rem;
    border: 2px solid $gray-200;
    border-radius: 0.75rem;
    gap: 0.75rem;

    &.selected {
      border-color: $sa-sky;
      background: rgba($sa-sky, 0.05);
    }

    .channel-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .channel-info {
      flex: 1;

      h4 {
        font-size: 0.875rem;
        font-weight: 700;
        margin-bottom: 0.125rem;
      }

      p {
        font-size: 0.75rem;
        color: $gray-600;
      }
    }
  }

  // Visit reasons
  .visit-reasons-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .visit-reason-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    border: 2px solid $gray-200;
    border-radius: 0.5rem;
    background: white;

    &.selected {
      border-color: $sa-sky;
      background: rgba($sa-sky, 0.05);
    }

    .reason-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .reason-icon {
        width: 40px;
        height: 40px;
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .reason-text {
        h4 {
          font-size: 0.875rem;
          font-weight: 700;
        }

        p {
          font-size: 0.6875rem;
          color: $gray-600;
        }
      }
    }
  }

  // Specialty & Template dropdowns
  .specialty-template-section {
    .form-group {
      margin-bottom: 0.75rem;

      label {
        font-size: 0.75rem;
        font-weight: 600;
        margin-bottom: 0.375rem;
      }

      select {
        width: 100%;
        padding: 0.875rem;
        font-size: 16px;
        border: 1px solid $gray-300;
        border-radius: 0.5rem;
      }
    }
  }

  // Duration grid
  .duration-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .duration-btn {
    padding: 1rem;
    border: 2px solid $gray-200;
    border-radius: 0.5rem;
    text-align: center;
    background: white;

    &.selected {
      border-color: $sa-sky;
      background: rgba($sa-sky, 0.05);
    }

    .duration-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: $gray-900;
    }

    .duration-label {
      font-size: 0.75rem;
      color: $gray-600;
    }
  }

  // Clinical flags - collapsible
  .clinical-flags-section {
    .flags-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 0;
      cursor: pointer;

      h3 {
        font-size: 0.875rem;
        font-weight: 700;
      }

      p {
        font-size: 0.75rem;
        color: $gray-600;
      }
    }
  }

  .clinical-flags-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .flag-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    border: 2px solid $gray-200;
    border-radius: 0.5rem;

    input[type="checkbox"] {
      width: 20px;
      height: 20px;
      margin-top: 0.125rem;
      flex-shrink: 0;
    }

    .flag-text {
      h4 {
        font-size: 0.875rem;
        font-weight: 600;
      }

      p {
        font-size: 0.6875rem;
        color: $gray-600;
      }
    }
  }

  // =============================================
  // Step 3: Schedule - Mobile Styles
  // =============================================

  // Selected datetime summary card (collapsible)
  .selected-datetime-summary {
    background: linear-gradient(135deg, rgba($sa-sky, 0.1) 0%, white 100%);
    border: 1px solid rgba($sa-sky, 0.3);
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1rem;

    .summary-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .date-icon {
        width: 48px;
        height: 48px;
        background: $sa-sky;
        border-radius: 0.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        flex-shrink: 0;

        .month {
          font-size: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .day {
          font-size: 1.125rem;
          font-weight: 700;
          line-height: 1;
        }
      }

      .summary-info {
        flex: 1;
        min-width: 0;

        .date-text {
          font-size: 0.9375rem;
          font-weight: 700;
          color: $gray-900;
        }

        .time-text {
          font-size: 0.8125rem;
          color: $gray-600;
        }
      }

      .toggle-btn {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: $gray-600;
        flex-shrink: 0;
      }
    }

    .summary-details {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid rgba($sa-sky, 0.2);

      .detail-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 0;
        font-size: 0.8125rem;

        .label {
          color: $gray-600;
        }

        .value {
          font-weight: 600;
          color: $gray-900;
        }
      }
    }
  }

  // Calendar section card
  .calendar-section {
    background: white;
    border: 1px solid $gray-200;
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .flex-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;

    h2 {
      font-size: 1rem;
      font-weight: 700;
      color: $gray-900;
    }
  }

  .view-toggle {
    display: flex;
    align-items: center;
    background: $gray-100;
    border-radius: 0.5rem;
    padding: 0.25rem;
    gap: 0.25rem;

    button {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 500;
      border-radius: 0.375rem;
      color: $gray-600;
      background: transparent;
      border: none;
      cursor: pointer;

      &.active {
        background: white;
        color: $gray-900;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      }
    }
  }

  .calendar-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;

    .nav-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.5rem;
      border: none;
      background: transparent;
      color: $gray-600;
      cursor: pointer;

      &:hover {
        background: $gray-100;
      }
    }

    .current-date {
      text-align: center;

      h3 {
        font-size: 1rem;
        font-weight: 700;
        color: $gray-900;
      }

      p {
        font-size: 0.75rem;
        color: $gray-500;
      }
    }
  }

  // 7-Day Strip Calendar
  .day-strip {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.25rem;
    margin-bottom: 1rem;
  }

  .day-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem 0.25rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;

    &:hover:not(.past) {
      background: $gray-50;
    }

    &.selected {
      background: $sa-sky;

      .day-name, .day-number {
        color: white;
      }

      .slot-count {
        background: white;
        color: $sa-sky;
      }
    }

    &.today:not(.selected) {
      border: 2px solid $sa-sky;
    }

    &.past {
      opacity: 0.5;
      cursor: not-allowed;

      .day-number {
        color: $gray-400;
      }
    }

    .day-name {
      font-size: 0.625rem;
      font-weight: 600;
      color: $gray-500;
      text-transform: uppercase;
      margin-bottom: 0.25rem;
    }

    .day-number {
      font-size: 0.875rem;
      font-weight: 700;
      color: $gray-900;
    }

    .slot-count {
      position: absolute;
      bottom: 0.125rem;
      font-size: 0.5rem;
      font-weight: 600;
      background: rgba($sa-sky, 0.2);
      color: $sa-sky;
      padding: 0.125rem 0.25rem;
      border-radius: 0.25rem;
    }
  }

  // Calendar Legend
  .calendar-legend {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 0.75rem;
    border-top: 1px solid $gray-200;
    font-size: 0.6875rem;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      color: $gray-600;

      .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;

        &.available {
          background: $sa-success;
        }

        &.booked {
          background: $gray-300;
        }

        &.patient-busy {
          background: $sa-warning;
        }
      }
    }

    .timezone-btn {
      color: $sa-sky;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
  }

  // Time Slots Section
  .time-slots-card {
    background: white;
    border: 1px solid $gray-200;
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1rem;

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;

      h2 {
        font-size: 1rem;
        font-weight: 700;
        color: $gray-900;
      }

      .duration-badge {
        font-size: 0.6875rem;
        color: $gray-500;
      }
    }
  }

  .time-section {
    margin-bottom: 1rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .time-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.75rem;

    h3 {
      font-size: 0.875rem;
      font-weight: 700;
      color: $gray-900;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .sun-icon {
        color: #F59E0B;
      }

      .afternoon-icon {
        color: #F59E0B;
      }

      .evening-icon {
        color: #8B5CF6;
      }
    }

    span {
      font-size: 0.6875rem;
      color: $gray-500;
    }
  }

  .time-slots-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }

  .time-slot-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.625rem 0.5rem;
    border: 2px solid $gray-200;
    border-radius: 0.5rem;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      border-color: $sa-sky;
      background: rgba($sa-sky, 0.05);
    }

    &.selected {
      border-color: $sa-sky;
      background: rgba($sa-sky, 0.1);

      .slot-time {
        color: $gray-900;
      }

      .slot-status {
        color: $sa-sky;
      }
    }

    &.booked, &:disabled {
      background: $gray-50;
      border-color: $gray-200;
      cursor: not-allowed;
      opacity: 0.6;

      .slot-time {
        color: $gray-500;
      }

      .slot-status {
        color: $gray-400;
      }
    }

    &.patient-conflict {
      border-color: #EF4444;
      background: rgba(#EF4444, 0.05);

      .slot-status {
        color: #EF4444;
      }
    }

    .slot-time {
      font-size: 0.8125rem;
      font-weight: 600;
      color: $gray-900;
    }

    .slot-status {
      font-size: 0.625rem;
      margin-top: 0.25rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;

      &.available {
        color: $sa-success;
      }
    }
  }

  // Conflict warning banner
  .conflict-warning {
    margin-top: 1rem;
    padding: 0.75rem;
    background: rgba(#F59E0B, 0.1);
    border: 1px solid rgba(#F59E0B, 0.3);
    border-radius: 0.5rem;
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;

    svg {
      color: #F59E0B;
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    .warning-text {
      .title {
        font-size: 0.75rem;
        font-weight: 600;
        color: $gray-900;
        margin-bottom: 0.125rem;
      }

      p {
        font-size: 0.6875rem;
        color: $gray-700;
      }
    }
  }

  // AI Suggestions Card
  .ai-card {
    background: white;
    border: 1px solid $gray-200;
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1rem;

    .ai-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      background: rgba(#8B5CF6, 0.1);
      color: #8B5CF6;
      border-radius: 1rem;
      font-size: 0.6875rem;
      font-weight: 700;
    }
  }

  .ai-suggestions-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .ai-suggestion-card {
    padding: 1rem;
    border: 2px solid $gray-200;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: $sa-sky;
      background: rgba($sa-sky, 0.05);
    }

    &.best {
      border-color: rgba(#8B5CF6, 0.4);
      background: rgba(#8B5CF6, 0.05);
    }

    .suggestion-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;

      svg {
        color: #8B5CF6;
      }

      .suggestion-badge {
        font-size: 0.625rem;
        font-weight: 700;
        padding: 0.125rem 0.5rem;
        border-radius: 0.25rem;
        background: rgba(#8B5CF6, 0.2);
        color: #8B5CF6;
      }
    }

    .suggestion-datetime {
      font-size: 0.9375rem;
      font-weight: 700;
      color: $gray-900;
      margin-bottom: 0.125rem;
    }

    .suggestion-date {
      font-size: 0.75rem;
      color: $gray-600;
      margin-bottom: 0.5rem;
    }

    .suggestion-score {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.6875rem;
      color: $gray-600;

      svg {
        color: $sa-success;
      }
    }
  }

  // Collapsible Sections (Reminders & Buffer)
  .collapsible-section {
    background: white;
    border: 1px solid $gray-200;
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1rem;

    .section-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;

      h2 {
        font-size: 1rem;
        font-weight: 700;
        color: $gray-900;
      }

      svg {
        color: $gray-600;
        transition: transform 0.2s ease;
      }

      &.expanded svg {
        transform: rotate(180deg);
      }
    }

    .section-content {
      margin-top: 1rem;
    }
  }

  // Reminder options
  .reminder-options {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .reminder-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    border: 2px solid $gray-200;
    border-radius: 0.5rem;
    cursor: pointer;

    .reminder-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
      min-width: 0;

      input[type="checkbox"] {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        accent-color: $sa-sky;
      }

      .reminder-info {
        flex: 1;
        min-width: 0;

        .reminder-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: $gray-900;
        }

        .reminder-desc {
          font-size: 0.6875rem;
          color: $gray-600;
        }
      }
    }

    select {
      padding: 0.375rem 0.5rem;
      border: 1px solid $gray-300;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      flex-shrink: 0;
      margin-left: 0.5rem;
    }
  }

  // Buffer time fields
  .buffer-section {
    h3 {
      font-size: 0.9375rem;
      font-weight: 700;
      color: $gray-900;
      margin-bottom: 0.75rem;
    }
  }

  .buffer-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    .buffer-field {
      label {
        display: block;
        font-size: 0.8125rem;
        font-weight: 600;
        color: $gray-700;
        margin-bottom: 0.5rem;
      }

      select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid $gray-300;
        border-radius: 0.5rem;
        font-size: 16px; // Prevent iOS zoom
      }

      .field-hint {
        font-size: 0.6875rem;
        color: $gray-500;
        margin-top: 0.375rem;
      }
    }
  }

  // Reminders section (existing structure support)
  .reminders-section {
    margin-bottom: 1.5rem;

    h3 {
      font-size: 0.9375rem;
      font-weight: 700;
      color: $gray-900;
      margin-bottom: 0.75rem;
    }
  }

  // =============================================
  // Step 4: Fee & Payment - Mobile Styles
  // =============================================

  // Cost Summary Card (collapsible)
  .cost-summary-card {
    background: linear-gradient(135deg, rgba($sa-success, 0.1) 0%, white 100%);
    border: 1px solid rgba($sa-success, 0.3);
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1rem;

    .summary-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;

      h3 {
        font-size: 0.9375rem;
        font-weight: 700;
        color: $gray-900;
        display: flex;
        align-items: center;
        gap: 0.5rem;

        svg {
          color: $sa-success;
        }
      }

      .details-toggle {
        color: $sa-sky;
        font-size: 0.8125rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.25rem;
        background: none;
        border: none;
        cursor: pointer;
      }
    }

    .total-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;

      .label {
        font-size: 0.8125rem;
        color: $gray-600;
      }

      .amount {
        font-size: 1.5rem;
        font-weight: 700;
        color: $sa-sky;
      }
    }

    .cost-details {
      padding-top: 1rem;
      border-top: 1px solid $gray-200;

      .detail-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 0;
        font-size: 0.8125rem;

        .label {
          color: $gray-600;
        }

        .value {
          font-weight: 600;
          color: $gray-900;

          &.discount {
            color: $sa-success;
          }
        }
      }
    }

    .status-badges {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;

      .badge {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        padding: 0.5rem;
        border-radius: 0.5rem;
        font-size: 0.6875rem;
        font-weight: 600;

        &.timing {
          background: rgba($sa-sky, 0.1);
          border: 1px solid rgba($sa-sky, 0.3);
          color: $gray-700;
        }

        &.verified {
          background: rgba($sa-success, 0.1);
          border: 1px solid rgba($sa-success, 0.3);
          color: $gray-700;
        }
      }
    }
  }

  // Fee Structure Section
  .fee-structure-card {
    background: white;
    border: 1px solid $gray-200;
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1rem;

    h2 {
      font-size: 1rem;
      font-weight: 700;
      color: $gray-900;
      margin-bottom: 1rem;
    }
  }

  // Payment type radio cards
  .payment-type-options {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;

    label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: $gray-700;
      margin-bottom: 0.5rem;
      display: block;
    }
  }

  .payment-type-card {
    display: flex;
    align-items: center;
    padding: 1rem;
    border: 2px solid $gray-200;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &.selected {
      border-color: $sa-sky;
      background: rgba($sa-sky, 0.05);
    }

    input[type="radio"] {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      accent-color: $sa-sky;
    }

    .card-content {
      flex: 1;
      margin-left: 0.75rem;

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.25rem;

        h4 {
          font-size: 0.9375rem;
          font-weight: 700;
          color: $gray-900;
        }

        svg {
          color: $sa-sky;
          font-size: 1.25rem;
        }
      }

      p {
        font-size: 0.6875rem;
        color: $gray-600;
      }
    }
  }

  // Fee input fields
  .fee-inputs {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .form-group {
      label {
        display: block;
        font-size: 0.8125rem;
        font-weight: 600;
        color: $gray-700;
        margin-bottom: 0.5rem;
      }

      .input-wrapper {
        position: relative;

        .currency-prefix {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: $gray-500;
          font-weight: 600;
        }

        input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2rem;
          border: 1px solid $gray-300;
          border-radius: 0.5rem;
          font-size: 16px;
          font-weight: 600;
        }
      }

      .help-text {
        font-size: 0.6875rem;
        color: $gray-500;
        margin-top: 0.375rem;
      }
    }
  }

  // Payment Collection Section
  .payment-collection-card {
    background: white;
    border: 1px solid $gray-200;
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1rem;

    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1rem;

      .header-text {
        h2 {
          font-size: 1rem;
          font-weight: 700;
          color: $gray-900;
        }

        p {
          font-size: 0.6875rem;
          color: $gray-600;
          margin-top: 0.25rem;
        }
      }

      .toggle-switch {
        // Toggle switch styling
      }
    }
  }

  // Payment timing options
  .payment-timing-options {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .timing-option {
    display: flex;
    align-items: center;
    padding: 1rem;
    border: 2px solid $gray-200;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &.selected {
      border-color: $sa-sky;
      background: rgba($sa-sky, 0.05);

      .option-icon {
        color: $sa-sky;
      }

      .check-icon {
        display: block;
        color: $sa-sky;
      }
    }

    .option-icon {
      font-size: 1.5rem;
      color: $gray-400;
      margin-right: 0.75rem;
    }

    .option-content {
      flex: 1;

      h4 {
        font-size: 0.9375rem;
        font-weight: 700;
        color: $gray-900;
      }

      p {
        font-size: 0.6875rem;
        color: $gray-600;
      }
    }

    .check-icon {
      display: none;
      font-size: 1.125rem;
    }
  }

  // Payment methods
  .payment-methods-section {
    padding-top: 1rem;
    border-top: 1px solid $gray-200;

    h3 {
      font-size: 0.875rem;
      font-weight: 700;
      color: $gray-900;
      margin-bottom: 0.75rem;
    }
  }

  .payment-methods-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .payment-method-item {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    border: 2px solid $gray-200;
    border-radius: 0.5rem;
    cursor: pointer;

    input[type="checkbox"] {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      accent-color: $sa-sky;
    }

    svg {
      margin: 0 0.75rem;
      color: $gray-600;
      font-size: 1.125rem;
    }

    span {
      font-size: 0.875rem;
      font-weight: 600;
      color: $gray-900;
    }
  }

  // Existing payment source cards (for step 4)
  .payment-source-grid,
  .payment-methods {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .payment-option {
    display: flex;
    align-items: center;
    padding: 1rem;
    border: 2px solid $gray-200;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &.selected {
      border-color: $sa-sky;
      background: rgba($sa-sky, 0.05);
    }

    &.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .payment-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.card {
        background: rgba($sa-sky, 0.1);
        color: $sa-sky;
      }

      &.wallet-patient {
        background: rgba($sa-success, 0.1);
        color: $sa-success;
      }

      &.wallet-specialist {
        background: rgba(#8B5CF6, 0.1);
        color: #8B5CF6;
      }
    }

    .payment-info {
      flex: 1;
      margin-left: 0.75rem;

      h4 {
        font-size: 0.9375rem;
        font-weight: 700;
        color: $gray-900;
      }

      p {
        font-size: 0.6875rem;
        color: $gray-600;
        margin-top: 0.125rem;

        &.success-text {
          color: $sa-success;
        }

        &.error-text {
          color: #EF4444;
        }
      }

      .payment-tag {
        display: inline-block;
        font-size: 0.625rem;
        color: $gray-500;
        margin-top: 0.25rem;
      }
    }

    .payment-check {
      flex-shrink: 0;
      margin-left: 0.5rem;

      .checked {
        color: $sa-sky;
      }

      .unchecked {
        color: $gray-300;
      }

      .error {
        color: #EF4444;
      }

      .spin {
        animation: spin 1s linear infinite;
      }
    }
  }

  // Channel Details Section
  .channel-config-card {
    background: white;
    border: 1px solid $gray-200;
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1rem;

    h2 {
      font-size: 1rem;
      font-weight: 700;
      color: $gray-900;
      margin-bottom: 1rem;
    }
  }

  // Channel selection cards
  .channel-selection {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;

    label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: $gray-700;
      margin-bottom: 0.5rem;
      display: block;
    }
  }

  .channel-option {
    display: flex;
    align-items: center;
    padding: 1rem;
    border: 2px solid $gray-200;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;

    &.selected {
      border-color: $sa-sky;
      background: rgba($sa-sky, 0.05);

      .channel-icon {
        color: $sa-sky;
      }

      .check-icon {
        display: block;
        color: $sa-sky;
      }
    }

    .channel-icon {
      font-size: 1.5rem;
      color: $gray-400;
      margin-right: 0.75rem;
    }

    .channel-content {
      flex: 1;

      h4 {
        font-size: 0.9375rem;
        font-weight: 700;
        color: $gray-900;
      }

      p {
        font-size: 0.6875rem;
        color: $gray-600;
      }
    }

    .check-icon {
      display: none;
      font-size: 1.125rem;
    }
  }

  // Video platform options
  .video-platform-section {
    padding-top: 1rem;
    border-top: 1px solid $gray-200;

    h3 {
      font-size: 0.875rem;
      font-weight: 700;
      color: $gray-900;
      margin-bottom: 0.75rem;
    }
  }

  .platform-options {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .platform-option {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    border: 2px solid $gray-200;
    border-radius: 0.5rem;
    cursor: pointer;

    &.selected {
      border-color: $sa-sky;
      background: rgba($sa-sky, 0.05);
    }

    input[type="radio"] {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      accent-color: $sa-sky;
    }

    svg {
      margin: 0 0.75rem;
      color: $sa-sky;
      font-size: 1.125rem;
    }

    span {
      font-size: 0.875rem;
      font-weight: 600;
      color: $gray-900;
    }
  }

  // Auto-generate link card
  .auto-generate-card {
    padding: 1rem;
    background: linear-gradient(135deg, rgba($sa-sky, 0.05) 0%, rgba(#8B5CF6, 0.05) 100%);
    border: 1px solid rgba($sa-sky, 0.2);
    border-radius: 0.75rem;
    margin-bottom: 1rem;

    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 0.75rem;

      .header-text {
        h4 {
          font-size: 0.875rem;
          font-weight: 700;
          color: $gray-900;
          margin-bottom: 0.125rem;
        }

        p {
          font-size: 0.6875rem;
          color: $gray-600;
        }
      }
    }

    .auto-note {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.6875rem;
      color: $gray-700;

      svg {
        color: #8B5CF6;
      }
    }
  }

  // Video settings checkboxes
  .video-settings {
    h3 {
      font-size: 0.875rem;
      font-weight: 700;
      color: $gray-900;
      margin-bottom: 0.75rem;
    }
  }

  .settings-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .setting-item {
    display: flex;
    align-items: flex-start;

    input[type="checkbox"] {
      width: 20px;
      height: 20px;
      margin-top: 0.125rem;
      flex-shrink: 0;
      accent-color: $sa-sky;
    }

    .setting-text {
      margin-left: 0.75rem;

      span {
        font-size: 0.875rem;
        font-weight: 600;
        color: $gray-900;
        display: block;
      }

      p {
        font-size: 0.6875rem;
        color: $gray-600;
        margin-top: 0.125rem;
      }
    }
  }

  // Additional Settings Section
  .additional-settings-card {
    background: white;
    border: 1px solid $gray-200;
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1rem;

    h2 {
      font-size: 1rem;
      font-weight: 700;
      color: $gray-900;
      margin-bottom: 1rem;
    }
  }

  .toggle-settings-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .toggle-setting {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 0.75rem;
    background: $gray-50;
    border-radius: 0.5rem;

    .setting-info {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      flex: 1;

      svg {
        color: $sa-sky;
        font-size: 1.125rem;
        margin-top: 0.125rem;
      }

      .text {
        p:first-child {
          font-size: 0.875rem;
          font-weight: 600;
          color: $gray-900;
        }

        p:last-child {
          font-size: 0.6875rem;
          color: $gray-600;
          margin-top: 0.125rem;
        }
      }
    }

    .toggle-switch {
      flex-shrink: 0;
      margin-left: 0.5rem;
    }
  }

  // Channel config (existing structure)
  .channel-config {
    .channel-options {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .config-option {
      display: flex;
      align-items: flex-start;
      padding: 0.75rem;
      border: 2px solid $gray-200;
      border-radius: 0.5rem;
      cursor: pointer;

      input[type="checkbox"] {
        width: 20px;
        height: 20px;
        margin-top: 0.125rem;
        flex-shrink: 0;
        accent-color: $sa-sky;
      }

      .option-content {
        margin-left: 0.75rem;

        .option-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: $gray-900;
          display: block;
        }

        .option-desc {
          font-size: 0.6875rem;
          color: $gray-600;
          display: block;
          margin-top: 0.125rem;
        }
      }
    }

    .channel-info-box {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: $gray-50;
      border: 1px solid $gray-200;
      border-radius: 0.75rem;

      svg {
        color: $sa-sky;
        font-size: 1.25rem;
        flex-shrink: 0;
      }

      h4 {
        font-size: 0.9375rem;
        font-weight: 700;
        color: $gray-900;
        margin-bottom: 0.25rem;
      }

      p {
        font-size: 0.75rem;
        color: $gray-600;
        line-height: 1.5;
      }
    }
  }

  // Fee card (existing structure)
  .fee-structure {
    .fee-card {
      background: $gray-50;
      border: 1px solid $gray-200;
      border-radius: 0.75rem;
      padding: 1rem;

      .fee-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;

        .fee-icon {
          width: 40px;
          height: 40px;
          background: rgba($sa-sky, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: $sa-sky;
        }

        .fee-info {
          h4 {
            font-size: 0.9375rem;
            font-weight: 700;
            color: $gray-900;
          }

          p {
            font-size: 0.6875rem;
            color: $gray-600;
          }
        }
      }

      .fee-amounts {
        border-top: 1px solid $gray-200;
        padding-top: 0.75rem;

        .fee-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0;

          .fee-label {
            font-size: 0.8125rem;
            color: $gray-600;
          }

          .fee-value {
            font-size: 0.9375rem;
            font-weight: 600;
            color: $gray-900;
          }

          &.total {
            border-top: 1px solid $gray-200;
            margin-top: 0.5rem;
            padding-top: 0.75rem;

            .fee-label, .fee-value {
              font-weight: 700;
            }

            .fee-value {
              color: $sa-sky;
              font-size: 1.125rem;
            }
          }
        }
      }

      .custom-fee-toggle {
        margin-top: 1rem;
        padding-top: 0.75rem;
        border-top: 1px solid $gray-200;

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;

          input[type="checkbox"] {
            width: 18px;
            height: 18px;
            accent-color: $sa-sky;
          }

          span {
            font-size: 0.8125rem;
            font-weight: 600;
            color: $gray-700;
          }
        }

        .custom-fee-input {
          display: flex;
          align-items: center;
          margin-top: 0.75rem;
          border: 2px solid $gray-300;
          border-radius: 0.5rem;
          overflow: hidden;
          background: white;

          &:focus-within {
            border-color: $sa-sky;
            box-shadow: 0 0 0 3px rgba($sa-sky, 0.1);
          }

          .currency-prefix {
            padding: 0.75rem;
            background: $gray-100;
            font-weight: 600;
            font-size: 0.9375rem;
            color: $gray-600;
            border-right: 1px solid $gray-300;
            flex-shrink: 0;
          }

          input {
            flex: 1;
            width: 100%;
            min-width: 0;
            padding: 0.75rem;
            border: none;
            font-size: 16px; // Prevent iOS zoom
            font-weight: 600;
            color: $gray-900;
            background: white;
            -moz-appearance: textfield; // Hide number spinners Firefox

            &::-webkit-outer-spin-button,
            &::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }

            &:focus {
              outline: none;
            }

            &::placeholder {
              color: $gray-400;
              font-weight: 400;
            }
          }
        }
      }
    }
  }

  // Pay now section
  .pay-now-section {
    margin-top: 1rem;

    .pay-now-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      background: $sa-sky;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .payment-confirmed {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba($sa-success, 0.1);
      border: 1px solid rgba($sa-success, 0.3);
      border-radius: 0.5rem;

      > svg {
        color: $sa-success;
        flex-shrink: 0;
      }

      > div {
        flex: 1;

        h4 {
          font-size: 0.875rem;
          font-weight: 700;
          color: $gray-900;
        }

        p {
          font-size: 0.6875rem;
          color: $gray-600;
        }
      }

      .change-btn {
        padding: 0.375rem 0.75rem;
        background: white;
        border: 1px solid $gray-300;
        border-radius: 0.375rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: $gray-700;
        cursor: pointer;
      }
    }
  }

  // Security info banner
  .security-banner {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 0.75rem;
    background: rgba($sa-success, 0.1);
    border: 1px solid rgba($sa-success, 0.3);
    border-radius: 0.5rem;

    svg {
      color: $sa-success;
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    p {
      font-size: 0.6875rem;
      color: $gray-700;
    }
  }

  // Appointment Summary (collapsible)
  .appointment-summary-card {
    background: white;
    border: 1px solid $gray-200;
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1rem;

    .summary-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;

      h3 {
        font-size: 0.9375rem;
        font-weight: 700;
        color: $gray-900;
        display: flex;
        align-items: center;
        gap: 0.5rem;

        svg {
          color: $gray-600;
        }
      }

      > svg {
        color: $gray-600;
        transition: transform 0.2s ease;
      }
    }

    .summary-content {
      margin-top: 1rem;

      .summary-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid $gray-100;
        font-size: 0.8125rem;

        &:last-child {
          border-bottom: none;
        }

        .label {
          color: $gray-600;
        }

        .value {
          font-weight: 600;
          color: $gray-900;
        }
      }
    }
  }

  // Fee breakdown (existing)
  .fee-breakdown {
    padding: 1rem;
    border-radius: 0.75rem;
    background: $gray-50;
  }

  // Section header
  .section-header {
    margin-bottom: 1rem;

    h2 {
      font-size: 1rem;
      font-weight: 700;
      color: $gray-900;
      margin-bottom: 0.25rem;
    }

    p {
      font-size: 0.75rem;
      color: $gray-600;
    }
  }

  // Step 5 & 6: Notes & Review
  .review-section {
    padding: 1rem;
    margin-bottom: 1rem;
    background: white;
    border-radius: 0.75rem;
    border: 1px solid $gray-200;
  }

  .section-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;

    h3 {
      font-size: 0.9375rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .edit-btn {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    }
  }

  .details-row {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .detail-box {
    padding: 0.875rem;
    background: $gray-50;
    border-radius: 0.5rem;

    .box-label {
      font-size: 0.625rem;
      font-weight: 600;
      color: $gray-500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.25rem;
    }

    .box-value {
      font-size: 0.9375rem;
      font-weight: 600;
      color: $gray-900;
    }
  }

  .consent-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .consent-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: white;
    border: 1px solid $gray-200;
    border-radius: 0.5rem;

    input[type="checkbox"] {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    label {
      font-size: 0.8125rem;
      color: $gray-700;
    }
  }

  // =============================================
  // Step 5: Notes & Instructions - Mobile Styles
  // =============================================

  // Step 5 SPECIFIC container - force all children to respect width
  .step-5-notes-card {
    width: 100% !important;
    max-width: 100% !important;
    overflow: hidden !important;
    box-sizing: border-box !important;

    // Force ALL descendants to respect container width
    * {
      max-width: 100% !important;
      box-sizing: border-box !important;
    }
  }

  .step-5-content {
    width: 100% !important;
    max-width: 100% !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }

  // Step 5 specific classes - CRITICAL for mobile layout
  .step5-form-fields {
    display: flex !important;
    flex-direction: column !important;
    gap: 0.75rem !important;
    width: 100% !important;
    max-width: 100% !important;
    margin-bottom: 1rem;

    .form-group {
      width: 100% !important;
      min-width: 0 !important;
      flex: none !important;
    }
  }

  .step5-templates-list {
    display: flex !important;
    flex-direction: column !important;
    gap: 0.5rem !important;
    width: 100% !important;
    max-width: 100% !important;

    .template-btn {
      width: 100% !important;
      min-width: 0 !important;

      .template-info {
        flex: 1;
        min-width: 0;
        overflow: hidden;

        .template-desc {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
  }

  .step5-patient-templates {
    display: flex !important;
    flex-direction: column !important;
    gap: 0.5rem !important;
    width: 100% !important;
    max-width: 100% !important;

    .patient-template-btn {
      width: 100% !important;
      min-width: 0 !important;

      .template-content {
        flex: 1;
        min-width: 0;
        overflow: hidden;
      }
    }
  }

  .step5-upload-zones {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 0.5rem !important;
    width: 100% !important;
    max-width: 100% !important;
    margin-bottom: 1rem;

    .upload-zone {
      min-width: 0 !important;
      padding: 0.75rem 0.5rem;

      .zone-title {
        font-size: 0.6875rem;
      }

      .zone-desc {
        font-size: 0.5625rem;
      }
    }
  }

  // Notes section container
  .notes-section {
    background: white;
    border: 1px solid $gray-200;
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1rem;
    width: 100% !important;
    max-width: 100% !important;
    overflow: hidden !important;
    box-sizing: border-box !important;

    textarea {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }

    .form-group {
      width: 100% !important;
      max-width: 100% !important;

      select, input {
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
    }
  }

  // Consent section mobile fixes
  .consent-section {
    .consent-alert {
      width: 100% !important;
      max-width: 100% !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
      padding: 0.75rem;

      .consent-alert-content {
        width: 100%;
        overflow: hidden;

        h3 {
          font-size: 0.875rem;
          word-wrap: break-word;
        }

        p {
          font-size: 0.75rem;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
      }
    }

    .consent-checkboxes {
      width: 100% !important;
      max-width: 100% !important;

      .consent-checkbox {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        width: 100%;

        input[type="checkbox"] {
          flex-shrink: 0;
          width: 1.25rem;
          height: 1.25rem;
          margin-top: 0.125rem;
        }

        .checkbox-text {
          flex: 1;
          min-width: 0;
          font-size: 0.75rem;
          line-height: 1.4;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
      }
    }
  }

  // Uploaded files list
  .uploaded-files {
    width: 100% !important;
    max-width: 100% !important;

    .uploaded-file {
      width: 100% !important;
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .file-icon {
        flex-shrink: 0;
      }

      .file-info {
        flex: 1;
        min-width: 0;
        overflow: hidden;

        .file-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .file-actions {
        flex-shrink: 0;
      }
    }
  }

  // Info card mobile
  .info-card {
    width: 100% !important;
    max-width: 100% !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
    padding: 0.75rem;

    .info-text {
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
  }

  .section-header-with-badge {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
    width: 100%;
    max-width: 100%;
    overflow: hidden;

    .section-header {
      max-width: 100%;
      overflow: hidden;

      h2 {
        font-size: 1rem;
        font-weight: 700;
        color: $gray-900;
        margin-bottom: 0.25rem;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }

      p {
        font-size: 0.75rem;
        color: $gray-600;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
    }

    .privacy-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.375rem 0.625rem;
      font-size: 0.6875rem;
      font-weight: 700;
      border-radius: 1rem;
      align-self: flex-start;
      flex-shrink: 0;

      &.private {
        background: rgba(#8B5CF6, 0.1);
        color: #8B5CF6;
      }

      &.visible {
        background: rgba($sa-sky, 0.1);
        color: $sa-sky;
      }

      &.required {
        background: rgba(#EF4444, 0.1);
        color: #EF4444;
      }
    }
  }

  // Textarea styling
  .notes-section textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid $gray-300;
    border-radius: 0.5rem;
    font-size: 16px; // Prevent iOS zoom
    resize: none;
    font-family: inherit;

    &:focus {
      outline: none;
      border-color: $sa-sky;
      box-shadow: 0 0 0 3px rgba($sa-sky, 0.1);
    }

    &::placeholder {
      color: $gray-400;
    }
  }

  .textarea-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 0.5rem;

    .help-text {
      font-size: 0.6875rem;
      color: $gray-500;
    }

    button {
      color: $sa-sky;
      font-size: 0.75rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
  }

  // Form row for dropdowns - MUST stack vertically on mobile
  .form-row {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 1rem;
    width: 100%;
    max-width: 100%;
    overflow: hidden;
  }

  // Form group - ensure full width and no overflow
  .form-group {
    flex: 1;
    width: 100%;
    max-width: 100%;
    overflow: hidden;
    box-sizing: border-box;

    label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: $gray-700;
      margin-bottom: 0.5rem;
    }

    select, input, textarea {
      width: 100%;
      max-width: 100%;
      padding: 0.75rem;
      border: 1px solid $gray-300;
      border-radius: 0.5rem;
      font-size: 16px; // Prevent iOS zoom
      background: white;
      box-sizing: border-box;
      -webkit-appearance: none;
      appearance: none;

      &:focus {
        outline: none;
        border-color: $sa-sky;
        box-shadow: 0 0 0 3px rgba($sa-sky, 0.1);
      }
    }

    select {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      background-size: 1rem;
      padding-right: 2.5rem;
    }

    textarea {
      resize: none;
      font-family: inherit;

      &::placeholder {
        color: $gray-400;
      }
    }

    // Help text under inputs
    .help-text {
      font-size: 0.6875rem;
      color: $gray-500;
      margin-top: 0.375rem;
    }
  }

  // Templates section
  .templates-section {
    border-top: 1px solid $gray-200;
    padding-top: 1rem;
    margin-top: 1rem;

    h3 {
      font-size: 0.9375rem;
      font-weight: 700;
      color: $gray-900;
      margin-bottom: 0.75rem;
    }
  }

  .templates-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .template-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem;
    background: $gray-50;
    border: 1px solid $gray-200;
    border-radius: 0.5rem;
    text-align: left;
    cursor: pointer;

    &:hover {
      background: $gray-100;
    }

    svg {
      color: $sa-sky;
      flex-shrink: 0;
    }

    .template-info {
      flex: 1;
      min-width: 0;

      .template-name {
        font-size: 0.875rem;
        font-weight: 600;
        color: $gray-900;
      }

      .template-desc {
        font-size: 0.6875rem;
        color: $gray-600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }

  // Patient instruction templates
  .patient-templates-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .patient-template-btn {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem;
    background: rgba($sa-sky, 0.05);
    border: 1px solid rgba($sa-sky, 0.2);
    border-radius: 0.5rem;
    text-align: left;
    cursor: pointer;

    &:hover {
      background: rgba($sa-sky, 0.1);
    }

    svg {
      color: $sa-sky;
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    .template-content {
      flex: 1;
      min-width: 0;

      .template-name {
        font-size: 0.875rem;
        font-weight: 600;
        color: $gray-900;
        margin-bottom: 0.25rem;
      }

      .template-preview {
        font-size: 0.6875rem;
        color: $gray-700;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
  }

  // Info cards
  .info-card {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    margin-top: 1rem;

    svg {
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    .info-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: $gray-900;
      margin-bottom: 0.125rem;
    }

    .info-text {
      font-size: 0.6875rem;
      color: $gray-700;
    }

    &.success {
      background: rgba($sa-success, 0.1);
      border: 1px solid rgba($sa-success, 0.3);

      svg {
        color: $sa-success;
      }
    }

    &.warning {
      background: rgba(#F59E0B, 0.1);
      border: 1px solid rgba(#F59E0B, 0.3);

      svg {
        color: #F59E0B;
      }
    }

    &.info {
      background: rgba($sa-sky, 0.1);
      border: 1px solid rgba($sa-sky, 0.3);

      svg {
        color: $sa-sky;
      }
    }
  }

  // Attachments section
  .section-header-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 1rem;
    width: 100%;
    max-width: 100%;
    overflow: hidden;

    .section-header {
      flex: 1;
      min-width: 0; // Allow shrinking
      overflow: hidden;

      h2 {
        font-size: 1rem;
        font-weight: 700;
        color: $gray-900;
        margin-bottom: 0.25rem;
        word-wrap: break-word;
      }

      p {
        font-size: 0.75rem;
        color: $gray-600;
        word-wrap: break-word;
      }
    }

    .add-files-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.75rem;
      background: $sa-sky;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      flex-shrink: 0;
      white-space: nowrap;
    }
  }

  // Upload zones grid
  .upload-zones {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .upload-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem 0.5rem;
    border: 2px dashed $gray-300;
    border-radius: 0.5rem;
    cursor: pointer;
    text-align: center;
    transition: all 0.2s ease;

    &:hover {
      border-color: $sa-sky;
      background: rgba($sa-sky, 0.05);
    }

    svg {
      color: $gray-400;
      margin-bottom: 0.5rem;
    }

    .zone-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: $gray-900;
      margin-bottom: 0.125rem;
    }

    .zone-desc {
      font-size: 0.625rem;
      color: $gray-600;
    }
  }

  // Uploaded files list
  .uploaded-files {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .uploaded-file {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    background: $gray-50;
    border: 1px solid $gray-200;
    border-radius: 0.5rem;

    .file-icon {
      width: 40px;
      height: 40px;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.pdf {
        background: rgba(#EF4444, 0.1);
        color: #EF4444;
      }

      &.excel {
        background: rgba($sa-success, 0.1);
        color: $sa-success;
      }

      &.image {
        background: rgba($sa-sky, 0.1);
        color: $sa-sky;
      }

      &.doc {
        background: rgba(#3B82F6, 0.1);
        color: #3B82F6;
      }
    }

    .file-info {
      flex: 1;
      min-width: 0;
      margin-left: 0.75rem;

      .file-name {
        font-size: 0.875rem;
        font-weight: 600;
        color: $gray-900;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .file-meta {
        font-size: 0.6875rem;
        color: $gray-600;
      }
    }

    .file-actions {
      display: flex;
      gap: 0.25rem;
      flex-shrink: 0;

      .file-action-btn {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 0.375rem;
        color: $gray-400;
        background: white;
        border: none;
        cursor: pointer;

        &:hover {
          color: $sa-sky;
          background: $gray-100;
        }

        &.danger:hover {
          color: #EF4444;
        }
      }
    }
  }

  // Consent section
  .consent-section {
    overflow: hidden; // Prevent horizontal overflow

    // Form row inside consent section - stack vertically
    .form-row {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    // Ensure form groups take full width and don't overflow
    .form-group {
      width: 100%;
      max-width: 100%;
      overflow: hidden;

      label {
        display: block;
        font-size: 0.8125rem;
        font-weight: 600;
        color: $gray-700;
        margin-bottom: 0.5rem;
      }

      select, input, textarea {
        width: 100%;
        max-width: 100%;
        padding: 0.75rem;
        border: 1px solid $gray-300;
        border-radius: 0.5rem;
        font-size: 16px; // Prevent iOS zoom
        background: white;
        box-sizing: border-box;

        &:focus {
          outline: none;
          border-color: $sa-sky;
          box-shadow: 0 0 0 3px rgba($sa-sky, 0.1);
        }
      }

      // Datetime-local specific fix
      input[type="datetime-local"] {
        min-height: 48px;
        -webkit-appearance: none;
        appearance: none;
      }

      textarea {
        resize: none;
        font-family: inherit;

        &::placeholder {
          color: $gray-400;
        }
      }
    }
  }

  .consent-alert {
    background: rgba(#EF4444, 0.05);
    border: 2px solid rgba(#EF4444, 0.3);
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1rem;
    overflow: hidden;

    .consent-alert-icon {
      width: 40px;
      height: 40px;
      background: #EF4444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      margin-bottom: 0.75rem;
      flex-shrink: 0;
    }

    .consent-alert-content {
      overflow: hidden;
      word-wrap: break-word;

      h3 {
        font-size: 0.9375rem;
        font-weight: 700;
        color: $gray-900;
        margin-bottom: 0.5rem;
      }

      > p {
        font-size: 0.75rem;
        color: $gray-700;
        margin-bottom: 1rem;
        line-height: 1.5;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
    }

    .consent-checkboxes {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .consent-checkbox {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      cursor: pointer;

      input[type="checkbox"] {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        margin-top: 0.125rem;
        accent-color: $sa-sky;
      }

      .checkbox-text {
        font-size: 0.75rem;
        color: $gray-900;
        line-height: 1.4;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
    }
  }

  // =============================================
  // Step 6: Review & Confirm - Mobile Styles
  // =============================================

  .step-6-review {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  // Appointment summary hero card
  .appointment-summary-hero {
    background: linear-gradient(135deg, $sa-sky 0%, darken($sa-sky, 10%) 100%);
    border-radius: 0.75rem;
    padding: 1rem;
    color: white;

    .summary-hero-header {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;

      h2 {
        font-size: 1.125rem;
        font-weight: 700;
        margin-bottom: 0.125rem;
      }

      p {
        font-size: 0.75rem;
        opacity: 0.9;
      }

      .appointment-id-badge {
        background: rgba(white, 0.2);
        border-radius: 0.5rem;
        padding: 0.5rem 0.75rem;
        display: inline-block;
        align-self: flex-start;

        .id-label {
          font-size: 0.625rem;
          opacity: 0.8;
          margin-bottom: 0.125rem;
        }

        .id-value {
          font-size: 0.875rem;
          font-weight: 700;
          font-family: monospace;
        }
      }
    }

    .summary-hero-grid {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .summary-hero-item {
        background: rgba(white, 0.15);
        border-radius: 0.5rem;
        padding: 0.75rem;

        .item-icon {
          display: none; // Hide icon on mobile
        }

        .item-label {
          font-size: 0.6875rem;
          opacity: 0.8;
          margin-bottom: 0.25rem;
        }

        .item-value {
          font-size: 1rem;
          font-weight: 700;
        }
      }
    }
  }

  // Review sections
  .review-section {
    background: white;
    border: 1px solid $gray-200;
    border-radius: 0.75rem;
    padding: 1rem;

    .section-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;

      h3 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1rem;
        font-weight: 700;
        color: $gray-900;

        svg {
          color: $sa-sky;
        }
      }

      .edit-btn {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.375rem 0.625rem;
        background: $gray-100;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: $gray-700;
        cursor: pointer;

        &:hover {
          background: $gray-200;
        }
      }
    }
  }

  // Patient review card
  .patient-review-card {
    display: flex;
    flex-direction: column; // Stack vertically on mobile
    align-items: center;
    text-align: center;
    gap: 0.75rem;
    padding: 1rem;

    .patient-review-avatar {
      width: 80px;
      height: 80px;
      flex-shrink: 0;
      margin: 0 auto;

      img {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        object-fit: cover;
        display: block;
      }

      .avatar-initials {
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, $sa-sky, darken($sa-sky, 15%));
        color: white;
        border-radius: 50%;
        font-size: 1.5rem;
        font-weight: 700;
      }

      // Ensure the large class also works
      .avatar-initials.large {
        width: 80px;
        height: 80px;
      }
    }

    .patient-review-info {
      h4 {
        font-size: 1.125rem;
        font-weight: 700;
        color: $gray-900;
        margin-bottom: 1rem;
      }
    }

    .patient-details-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
      text-align: left;

      .detail-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .detail-icon {
          width: 40px;
          height: 40px;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          &.blue {
            background: rgba($sa-sky, 0.1);
            color: $sa-sky;
          }

          &.green {
            background: rgba($sa-success, 0.1);
            color: $sa-success;
          }

          &.purple {
            background: rgba(#8B5CF6, 0.1);
            color: #8B5CF6;
          }

          &.pink {
            background: rgba(#EC4899, 0.1);
            color: #EC4899;
          }
        }

        .detail-label {
          font-size: 0.6875rem;
          color: $gray-500;
        }

        .detail-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: $gray-900;
          word-break: break-word;
        }
      }
    }

    .new-patient-alert {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 0.75rem;
      background: rgba(#F59E0B, 0.1);
      border: 1px solid rgba(#F59E0B, 0.3);
      border-radius: 0.5rem;
      text-align: left;

      svg {
        color: #F59E0B;
        flex-shrink: 0;
      }

      .alert-title {
        font-size: 0.75rem;
        font-weight: 600;
        color: $gray-900;
      }

      .alert-text {
        font-size: 0.6875rem;
        color: $gray-700;
      }
    }
  }

  // Details grid
  .details-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    .detail-card {
      padding: 0.75rem;
      background: $gray-50;
      border-radius: 0.5rem;

      .card-label {
        font-size: 0.625rem;
        font-weight: 600;
        color: $gray-500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.25rem;
      }

      .card-value {
        font-size: 0.9375rem;
        font-weight: 700;
        color: $gray-900;
      }

      .card-desc {
        font-size: 0.6875rem;
        color: $gray-600;
        margin-top: 0.25rem;
      }
    }
  }

  // Schedule grid
  .schedule-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    .schedule-card {
      padding: 0.75rem;
      border-radius: 0.5rem;
      display: flex;
      flex-direction: column;

      &.blue {
        background: linear-gradient(135deg, rgba($sa-sky, 0.1), rgba($sa-sky, 0.2));
      }

      &.green {
        background: linear-gradient(135deg, rgba($sa-success, 0.1), rgba($sa-success, 0.2));
      }

      &.purple {
        background: linear-gradient(135deg, rgba(#8B5CF6, 0.1), rgba(#8B5CF6, 0.2));
      }

      .schedule-icon {
        display: none; // Hide on mobile
      }

      .schedule-label {
        font-size: 0.625rem;
        font-weight: 600;
        color: $gray-700;
        text-transform: uppercase;
        margin-bottom: 0.25rem;
      }

      .schedule-day, .schedule-time, .schedule-duration {
        font-size: 1.125rem;
        font-weight: 700;
        color: $gray-900;
      }

      .schedule-full-date, .schedule-timezone, .schedule-end {
        font-size: 0.6875rem;
        color: $gray-600;
      }
    }
  }

  .reminders-info {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin-top: 1rem;
    padding: 0.75rem;
    background: rgba($sa-sky, 0.1);
    border: 1px solid rgba($sa-sky, 0.3);
    border-radius: 0.5rem;

    svg {
      color: $sa-sky;
      flex-shrink: 0;
    }

    .reminders-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: $gray-900;
      margin-bottom: 0.125rem;
    }

    .reminders-text {
      font-size: 0.6875rem;
      color: $gray-700;
    }
  }

  // Channel & Payment grid
  .channel-payment-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    .channel-card, .fee-card {
      padding: 1rem;
      border-radius: 0.75rem;
      border: 2px solid;

      .channel-header, .fee-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;

        .channel-icon, .fee-icon {
          width: 40px;
          height: 40px;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .channel-label, .fee-label {
          font-size: 0.6875rem;
          color: $gray-700;
        }

        .channel-value {
          font-size: 1rem;
          font-weight: 700;
          color: $gray-900;
        }

        .fee-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: $gray-900;
        }
      }

      .channel-desc, .fee-desc {
        font-size: 0.6875rem;
        color: $gray-700;
      }
    }

    .channel-card {
      background: linear-gradient(135deg, rgba($sa-sky, 0.05), rgba($sa-sky, 0.1));
      border-color: $sa-sky;

      .channel-icon {
        background: $sa-sky;
        color: white;
      }
    }

    .fee-card {
      background: linear-gradient(135deg, rgba($sa-success, 0.05), rgba($sa-success, 0.1));
      border-color: $sa-success;

      .fee-icon {
        background: $sa-success;
        color: white;
      }
    }
  }

  // Payment breakdown
  .payment-breakdown {
    margin-top: 1rem;
    padding: 1rem;
    background: $gray-50;
    border-radius: 0.5rem;

    h4 {
      font-size: 0.9375rem;
      font-weight: 700;
      color: $gray-900;
      margin-bottom: 0.75rem;
    }

    .breakdown-rows {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .breakdown-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.875rem;

      span:first-child {
        color: $gray-700;
      }

      span:last-child {
        font-weight: 600;
        color: $gray-900;
      }

      &.total {
        padding-top: 0.75rem;
        border-top: 2px solid $gray-300;
        margin-top: 0.25rem;

        span:last-child {
          font-size: 1.25rem;
          color: $sa-success;
        }
      }

      &.earnings {
        span:last-child {
          font-size: 1rem;
          color: $sa-sky;
        }
      }
    }
  }

  // Notes review list
  .notes-review-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .notes-review-card {
    padding: 0.75rem;
    border-radius: 0.5rem;

    &.private {
      background: rgba(#8B5CF6, 0.05);
      border: 1px solid rgba(#8B5CF6, 0.3);
    }

    &.visible {
      background: rgba($sa-sky, 0.05);
      border: 1px solid rgba($sa-sky, 0.3);
    }

    .notes-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;

      .header-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        svg {
          color: $gray-700;
        }

        h4 {
          font-size: 0.875rem;
          font-weight: 700;
          color: $gray-900;
        }
      }

      .privacy-tag {
        font-size: 0.625rem;
        font-weight: 700;
        padding: 0.25rem 0.5rem;
        border-radius: 1rem;

        &.private {
          background: #8B5CF6;
          color: white;
        }

        &.visible {
          background: $sa-sky;
          color: white;
        }
      }
    }

    .notes-content {
      background: white;
      border-radius: 0.375rem;
      padding: 0.75rem;
      margin-bottom: 0.5rem;

      p {
        font-size: 0.75rem;
        color: $gray-700;
        line-height: 1.5;
      }
    }

    .notes-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.6875rem;
      color: $gray-600;

      span {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }
    }
  }

  .attachments-review-card {
    padding: 0.75rem;
    background: rgba($sa-success, 0.05);
    border: 1px solid rgba($sa-success, 0.3);
    border-radius: 0.5rem;

    .notes-card-header {
      margin-bottom: 0.5rem;

      .header-left {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        svg {
          color: $sa-success;
        }

        h4 {
          font-size: 0.875rem;
          font-weight: 700;
          color: $gray-900;
        }
      }
    }

    .attachments-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .attachment-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem;
        background: white;
        border-radius: 0.375rem;

        .file-icon {
          width: 32px;
          height: 32px;
          border-radius: 0.375rem;
          display: flex;
          align-items: center;
          justify-content: center;

          &.pdf {
            background: rgba(#EF4444, 0.1);
            color: #EF4444;
          }

          &.excel {
            background: rgba($sa-success, 0.1);
            color: $sa-success;
          }
        }

        .file-details {
          flex: 1;
          min-width: 0; // Allow flex item to shrink
          margin-left: 0.5rem;
          overflow: hidden;

          .file-name {
            font-size: 0.75rem;
            font-weight: 600;
            color: $gray-900;
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-all; // Force break long file names/URLs
          }

          .file-size {
            font-size: 0.625rem;
            color: $gray-600;
          }
        }
      }
    }
  }

  // Consent verified section
  .consent-verified-section {
    border-color: $sa-success;

    .consent-verified-header {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1rem;

      .consent-icon {
        width: 48px;
        height: 48px;
        background: $sa-success;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        flex-shrink: 0;
      }

      h3 {
        font-size: 1rem;
        font-weight: 700;
        color: $gray-900;
      }

      p {
        font-size: 0.6875rem;
        color: $gray-700;
      }

      .verified-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.375rem 0.625rem;
        background: $sa-success;
        color: white;
        border-radius: 1rem;
        font-size: 0.6875rem;
        font-weight: 700;
        margin-left: auto;
      }
    }

    .consent-checks-grid {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 0.75rem;

      .consent-check-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: rgba($sa-success, 0.1);
        border-radius: 0.375rem;

        svg {
          color: $sa-success;
          flex-shrink: 0;
        }

        span {
          font-size: 0.75rem;
          font-weight: 500;
          color: $gray-900;
        }
      }
    }

    .consent-details {
      padding: 0.75rem;
      background: $gray-50;
      border-radius: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .consent-detail {
        .detail-label {
          font-size: 0.625rem;
          color: $gray-500;
          margin-bottom: 0.125rem;
        }

        .detail-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: $gray-900;
        }
      }
    }
  }

  // Policy section
  .policy-section {
    .policy-header {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 1rem;

      .policy-icon {
        width: 40px;
        height: 40px;
        background: rgba(#F59E0B, 0.1);
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #F59E0B;
        flex-shrink: 0;
      }

      h3 {
        font-size: 1rem;
        font-weight: 700;
        color: $gray-900;
        margin-bottom: 0.125rem;
      }

      p {
        font-size: 0.6875rem;
        color: $gray-600;
      }
    }

    .policy-items {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;

      .policy-item {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
        padding: 0.75rem;
        background: $gray-50;
        border-radius: 0.5rem;

        svg {
          flex-shrink: 0;
          margin-top: 0.125rem;

          &.success {
            color: $sa-success;
          }

          &.warning {
            color: #F59E0B;
          }

          &.danger {
            color: #EF4444;
          }

          &.info {
            color: $sa-sky;
          }
        }

        .policy-title {
          font-size: 0.875rem;
          font-weight: 700;
          color: $gray-900;
          margin-bottom: 0.125rem;
        }

        .policy-desc {
          font-size: 0.6875rem;
          color: $gray-700;
        }

        &.info {
          background: rgba($sa-sky, 0.05);
          border: 1px solid rgba($sa-sky, 0.2);
        }
      }
    }

    .policy-consent-checkbox {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      cursor: pointer;
      padding: 0.75rem;
      background: $gray-50;
      border-radius: 0.5rem;

      input[type="checkbox"] {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        margin-top: 0.125rem;
        accent-color: $sa-sky;
      }

      span {
        font-size: 0.75rem;
        color: $gray-900;
        line-height: 1.4;
      }
    }
  }

  // Mobile Confirm Section (visible only on mobile)
  .mobile-confirm-section {
    display: block; // Show on mobile
    background: white;
    border: 2px solid $sa-sky;
    border-radius: 0.75rem;
    padding: 1rem;
    margin-top: 1rem;

    .mobile-total-box {
      text-align: center;
      padding: 0.75rem;
      background: linear-gradient(135deg, rgba($sa-sky, 0.1), rgba($sa-sky, 0.05));
      border-radius: 0.5rem;
      margin-bottom: 1rem;

      .total-label {
        font-size: 0.6875rem;
        color: $gray-600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.25rem;
      }

      .total-value {
        font-size: 1.5rem;
        font-weight: 800;
        color: $sa-sky;
      }
    }

    .mobile-submission-error {
      background: rgba(#EF4444, 0.1);
      border: 1px solid rgba(#EF4444, 0.3);
      border-radius: 0.5rem;
      padding: 0.75rem;
      margin-bottom: 1rem;

      .error-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        font-weight: 700;
        color: #EF4444;
        margin-bottom: 0.5rem;
      }

      .error-message {
        font-size: 0.75rem;
        color: $gray-700;
        margin-bottom: 0.5rem;
      }

      .error-action-btn {
        width: 100%;
        padding: 0.5rem;
        background: #EF4444;
        color: white;
        border: none;
        border-radius: 0.375rem;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
      }
    }

    .mobile-confirm-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      background: linear-gradient(135deg, $sa-sky 0%, darken($sa-sky, 10%) 100%);
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba($sa-sky, 0.3);
      transition: all 0.2s;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba($sa-sky, 0.4);
      }

      &:disabled, &.disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background: $gray-400;
        box-shadow: none;
      }

      .spin {
        animation: spin 1s linear infinite;
      }
    }

    .mobile-confirm-note {
      text-align: center;
      font-size: 0.6875rem;
      color: $gray-500;
      margin-top: 0.75rem;
    }
  }

  // Sidebar cards on mobile
  .sidebar-card {
    background: white;
    border: 1px solid $gray-200;
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1rem;

    h3 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9375rem;
      font-weight: 700;
      color: $gray-900;
      margin-bottom: 1rem;

      svg {
        color: $sa-sky;
      }
    }
  }

  // Confirmation checklist card
  .confirmation-checklist-card {
    .checklist-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;

      .checklist-icon {
        width: 40px;
        height: 40px;
        background: $sa-sky;
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        flex-shrink: 0;
      }

      h3 {
        font-size: 1rem;
        font-weight: 700;
        color: $gray-900;
        margin-bottom: 0;
      }

      p {
        font-size: 0.6875rem;
        color: $gray-600;
      }
    }

    .checklist-items {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;

      .checklist-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem;
        background: rgba(#F59E0B, 0.1);
        border-radius: 0.375rem;

        svg:first-child {
          color: #F59E0B;
          flex-shrink: 0;
        }

        span {
          flex: 1;
          font-size: 0.75rem;
          font-weight: 500;
          color: $gray-900;
          margin-left: 0.5rem;
        }

        .check-icon {
          color: #F59E0B;
        }

        &.completed {
          background: rgba($sa-success, 0.1);

          svg:first-child, .check-icon {
            color: $sa-success;
          }
        }
      }
    }

    .total-preview {
      padding: 0.75rem;
      background: rgba($sa-sky, 0.1);
      border: 1px solid rgba($sa-sky, 0.3);
      border-radius: 0.5rem;
      margin-bottom: 0.75rem;

      .total-label {
        font-size: 0.625rem;
        font-weight: 600;
        color: $gray-700;
        text-transform: uppercase;
        margin-bottom: 0.25rem;
      }

      .total-amount {
        font-size: 1.5rem;
        font-weight: 700;
        color: $sa-sky;
      }

      .total-desc {
        font-size: 0.6875rem;
        color: $gray-600;
      }
    }

    .confirm-note {
      font-size: 0.6875rem;
      color: $gray-500;
      text-align: center;
    }
  }

  // No notes message
  .no-notes-message {
    text-align: center;
    padding: 1.5rem;
    color: $gray-400;

    svg {
      margin-bottom: 0.5rem;
    }

    p {
      font-size: 0.875rem;
    }
  }

  // Footer - fixed at bottom
  .wizard-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: white;
    border-top: 1px solid $gray-200;
    padding: 0.75rem 1rem;
    z-index: 40;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
  }

  .footer-container {
    display: flex;
    flex-direction: row;
    gap: 0.75rem;
    max-width: 100%;
  }

  .back-btn {
    flex: 0 0 auto;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    min-width: 80px;
    justify-content: center;
  }

  .footer-right {
    flex: 1;
    display: flex;
    gap: 0.5rem;
  }

  .draft-btn {
    display: none; // Hide on mobile
  }

  .continue-btn {
    flex: 1;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    justify-content: center;
  }

  .confirm-hint {
    display: none;
  }
}

// =============================================
// SMALL PHONE BREAKPOINT (480px and below)
// =============================================
@media (max-width: 480px) {
  .wizard-main {
    padding: 0.75rem;
  }

  .title-block {
    h1 {
      font-size: 1.125rem;
    }

    p {
      font-size: 0.8125rem;
    }
  }

  .progress-steps {
    padding: 0.5rem;
  }

  .step-circle {
    width: 1.75rem;
    height: 1.75rem;
    font-size: 0.6875rem;
  }

  .step-text .step-name {
    font-size: 0.5625rem;
  }

  .step-line {
    min-width: 0.5rem;
    max-width: 1rem;
  }

  .step-card {
    padding: 0.75rem;
    border-radius: 0.5rem;

    &.has-tabs {
      .tab-content {
        padding: 0.75rem;
      }
    }
  }

  .tab-btn {
    padding: 0.625rem 0.75rem;
    font-size: 0.75rem;

    svg {
      display: none;
    }
  }

  // Form inputs - prevent iOS zoom
  input, select, textarea {
    font-size: 16px !important;
  }

  // Patient cards
  .patient-card {
    padding: 0.625rem;
  }

  .patient-avatar {
    width: 44px;
    height: 44px;
  }

  // Duration
  .duration-btn {
    padding: 0.75rem 0.5rem;

    .duration-value {
      font-size: 1.25rem;
    }
  }

  // Week calendar
  .week-day-btn {
    min-width: 42px;
    padding: 0.375rem 0.25rem;

    .day-name {
      font-size: 0.5625rem;
    }

    .day-date {
      font-size: 0.9375rem;
    }
  }

  // Step 3: Time slots - 2 columns on very small screens
  .time-slots-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .time-slots-group .slots-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .time-slot-btn {
    padding: 0.5rem 0.375rem;
    font-size: 0.75rem;

    .slot-time {
      font-size: 0.75rem;
    }

    .slot-status {
      font-size: 0.5625rem;
    }
  }

  // Day strip - tighter on small screens
  .day-strip {
    gap: 0.125rem;
  }

  .day-cell {
    padding: 0.375rem 0.125rem;

    .day-name {
      font-size: 0.5625rem;
    }

    .day-number {
      font-size: 0.75rem;
    }

    .slot-count {
      font-size: 0.4375rem;
      padding: 0.0625rem 0.1875rem;
    }
  }

  // AI suggestions - more compact
  .ai-suggestion-card {
    padding: 0.75rem;

    .suggestion-datetime {
      font-size: 0.875rem;
    }

    .suggestion-date {
      font-size: 0.6875rem;
    }
  }

  // Reminders - tighter
  .reminder-option {
    padding: 0.625rem;
    flex-wrap: wrap;

    .reminder-left {
      gap: 0.5rem;

      .reminder-info {
        .reminder-name {
          font-size: 0.8125rem;
        }

        .reminder-desc {
          font-size: 0.625rem;
        }
      }
    }

    select {
      font-size: 0.6875rem;
      padding: 0.25rem 0.375rem;
    }
  }

  // Step 4: Cost summary - compact
  .cost-summary-card {
    padding: 0.75rem;

    .total-row {
      .amount {
        font-size: 1.25rem;
      }
    }

    .cost-details .detail-row {
      font-size: 0.75rem;
    }

    .status-badges .badge {
      font-size: 0.625rem;
      padding: 0.375rem;
    }
  }

  // Payment type cards - more compact
  .payment-type-card {
    padding: 0.75rem;

    .card-content {
      margin-left: 0.5rem;

      .card-header h4 {
        font-size: 0.875rem;
      }

      p {
        font-size: 0.625rem;
      }
    }
  }

  // Payment options - compact
  .payment-option {
    padding: 0.75rem;

    .payment-icon {
      width: 40px;
      height: 40px;
    }

    .payment-info {
      margin-left: 0.5rem;

      h4 {
        font-size: 0.875rem;
      }

      p {
        font-size: 0.625rem;
      }

      .payment-tag {
        font-size: 0.5625rem;
      }
    }
  }

  // Timing options - compact
  .timing-option {
    padding: 0.75rem;

    .option-icon {
      font-size: 1.25rem;
      margin-right: 0.5rem;
    }

    .option-content {
      h4 {
        font-size: 0.875rem;
      }

      p {
        font-size: 0.625rem;
      }
    }
  }

  // Channel options - compact
  .channel-option {
    padding: 0.75rem;

    .channel-icon {
      font-size: 1.25rem;
      margin-right: 0.5rem;
    }

    .channel-content {
      h4 {
        font-size: 0.875rem;
      }

      p {
        font-size: 0.625rem;
      }
    }
  }

  // Platform options
  .platform-option {
    padding: 0.625rem;

    input[type="radio"] {
      width: 18px;
      height: 18px;
    }

    svg {
      margin: 0 0.5rem;
    }

    span {
      font-size: 0.8125rem;
    }
  }

  // Settings - compact
  .toggle-setting {
    padding: 0.625rem;

    .setting-info {
      gap: 0.5rem;

      svg {
        font-size: 1rem;
      }

      .text {
        p:first-child {
          font-size: 0.8125rem;
        }

        p:last-child {
          font-size: 0.625rem;
        }
      }
    }
  }

  .setting-item {
    input[type="checkbox"] {
      width: 18px;
      height: 18px;
    }

    .setting-text {
      margin-left: 0.5rem;

      span {
        font-size: 0.8125rem;
      }

      p {
        font-size: 0.625rem;
      }
    }
  }

  // Fee card compact
  .fee-structure .fee-card {
    padding: 0.75rem;

    .fee-header {
      .fee-icon {
        width: 36px;
        height: 36px;
      }

      .fee-info {
        h4 {
          font-size: 0.875rem;
        }

        p {
          font-size: 0.625rem;
        }
      }
    }

    .fee-amounts .fee-row {
      .fee-label {
        font-size: 0.75rem;
      }

      .fee-value {
        font-size: 0.875rem;
      }

      &.total .fee-value {
        font-size: 1rem;
      }
    }
  }

  // Appointment summary compact
  .appointment-summary-card {
    padding: 0.75rem;

    .summary-content .summary-row {
      font-size: 0.75rem;
      padding: 0.375rem 0;
    }
  }

  // =============================================
  // Step 5: Notes - 480px Compact Styles
  // =============================================

  .notes-section {
    padding: 0.75rem;

    textarea {
      font-size: 14px;
    }

    .section-header-with-badge {
      gap: 0.5rem;

      .section-header {
        h2 {
          font-size: 0.9375rem;
        }

        p {
          font-size: 0.6875rem;
        }
      }

      .privacy-badge {
        font-size: 0.625rem;
        padding: 0.25rem 0.5rem;
      }
    }
  }

  .templates-section h3 {
    font-size: 0.875rem;
  }

  .template-btn {
    padding: 0.625rem;

    .template-info {
      .template-name {
        font-size: 0.8125rem;
      }

      .template-desc {
        font-size: 0.625rem;
      }
    }
  }

  .patient-template-btn {
    padding: 0.625rem;

    .template-content {
      .template-name {
        font-size: 0.8125rem;
      }

      .template-preview {
        font-size: 0.625rem;
      }
    }
  }

  .info-card {
    padding: 0.625rem;

    .info-title {
      font-size: 0.8125rem;
    }

    .info-text {
      font-size: 0.625rem;
    }
  }

  .upload-zones {
    gap: 0.375rem;
  }

  .upload-zone {
    padding: 0.75rem 0.375rem;

    .zone-title {
      font-size: 0.6875rem;
    }

    .zone-desc {
      font-size: 0.5625rem;
    }
  }

  .uploaded-file {
    padding: 0.625rem;

    .file-icon {
      width: 36px;
      height: 36px;
    }

    .file-info {
      margin-left: 0.5rem;

      .file-name {
        font-size: 0.8125rem;
      }

      .file-meta {
        font-size: 0.625rem;
      }
    }

    .file-actions .file-action-btn {
      width: 28px;
      height: 28px;
    }
  }

  // Consent section - 480px
  .consent-section {
    padding: 0.75rem;
    overflow: hidden;

    .form-row {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .form-group {
      width: 100%;

      label {
        font-size: 0.75rem;
        margin-bottom: 0.375rem;
      }

      select, input, textarea {
        padding: 0.625rem;
        font-size: 14px;
      }
    }
  }

  .consent-alert {
    padding: 0.75rem;

    .consent-alert-icon {
      width: 36px;
      height: 36px;
    }

    .consent-alert-content {
      h3 {
        font-size: 0.875rem;
      }

      > p {
        font-size: 0.6875rem;
      }

      .consent-checkbox {
        gap: 0.5rem;

        input[type="checkbox"] {
          width: 18px;
          height: 18px;
        }

        .checkbox-text {
          font-size: 0.6875rem;
        }
      }
    }
  }

  // =============================================
  // Step 6: Review - 480px Compact Styles
  // =============================================

  .appointment-summary-hero {
    padding: 0.75rem;

    .summary-hero-header {
      h2 {
        font-size: 1rem;
      }

      p {
        font-size: 0.6875rem;
      }

      .appointment-id-badge {
        padding: 0.375rem 0.625rem;

        .id-label {
          font-size: 0.5625rem;
        }

        .id-value {
          font-size: 0.8125rem;
        }
      }
    }

    .summary-hero-grid .summary-hero-item {
      padding: 0.625rem;

      .item-label {
        font-size: 0.625rem;
      }

      .item-value {
        font-size: 0.9375rem;
      }
    }
  }

  .review-section {
    padding: 0.75rem;

    .section-header-row {
      h3 {
        font-size: 0.9375rem;
      }

      .edit-btn {
        padding: 0.25rem 0.5rem;
        font-size: 0.6875rem;
      }
    }
  }

  .patient-review-card {
    .patient-review-avatar {
      img, .avatar-initials {
        width: 64px;
        height: 64px;
      }

      .avatar-initials {
        font-size: 1.25rem;
      }
    }

    .patient-review-info h4 {
      font-size: 1rem;
    }

    .patient-details-grid .detail-item {
      .detail-icon {
        width: 36px;
        height: 36px;
      }

      .detail-label {
        font-size: 0.625rem;
      }

      .detail-value {
        font-size: 0.8125rem;
      }
    }

    .new-patient-alert {
      padding: 0.625rem;

      .alert-title {
        font-size: 0.6875rem;
      }

      .alert-text {
        font-size: 0.625rem;
      }
    }
  }

  .details-grid .detail-card {
    padding: 0.625rem;

    .card-label {
      font-size: 0.5625rem;
    }

    .card-value {
      font-size: 0.875rem;
    }

    .card-desc {
      font-size: 0.625rem;
    }
  }

  .schedule-grid .schedule-card {
    padding: 0.625rem;

    .schedule-label {
      font-size: 0.5625rem;
    }

    .schedule-day, .schedule-time, .schedule-duration {
      font-size: 1rem;
    }

    .schedule-full-date, .schedule-timezone, .schedule-end {
      font-size: 0.625rem;
    }
  }

  .reminders-info {
    padding: 0.625rem;

    .reminders-title {
      font-size: 0.6875rem;
    }

    .reminders-text {
      font-size: 0.625rem;
    }
  }

  .channel-payment-grid {
    .channel-card, .fee-card {
      padding: 0.75rem;

      .channel-header, .fee-header {
        .channel-icon, .fee-icon {
          width: 36px;
          height: 36px;
        }

        .channel-label, .fee-label {
          font-size: 0.625rem;
        }

        .channel-value {
          font-size: 0.9375rem;
        }

        .fee-value {
          font-size: 1.25rem;
        }
      }

      .channel-desc, .fee-desc {
        font-size: 0.625rem;
      }
    }
  }

  .payment-breakdown {
    padding: 0.75rem;

    h4 {
      font-size: 0.875rem;
    }

    .breakdown-row {
      font-size: 0.8125rem;

      &.total span:last-child {
        font-size: 1.125rem;
      }

      &.earnings span:last-child {
        font-size: 0.9375rem;
      }
    }
  }

  .notes-review-card {
    padding: 0.625rem;

    .notes-card-header {
      .header-left h4 {
        font-size: 0.8125rem;
      }

      .privacy-tag {
        font-size: 0.5625rem;
        padding: 0.1875rem 0.375rem;
      }
    }

    .notes-content {
      padding: 0.625rem;

      p {
        font-size: 0.6875rem;
      }
    }

    .notes-meta {
      font-size: 0.625rem;
    }
  }

  .attachments-review-card {
    padding: 0.625rem;

    .notes-card-header .header-left h4 {
      font-size: 0.8125rem;
    }

    .attachments-list .attachment-item {
      padding: 0.375rem;

      .file-icon {
        width: 28px;
        height: 28px;
      }

      .file-details {
        .file-name {
          font-size: 0.6875rem;
        }

        .file-size {
          font-size: 0.5625rem;
        }
      }
    }
  }

  .consent-verified-section {
    .consent-verified-header {
      .consent-icon {
        width: 40px;
        height: 40px;
      }

      h3 {
        font-size: 0.9375rem;
      }

      .verified-badge {
        font-size: 0.625rem;
        padding: 0.25rem 0.5rem;
      }
    }

    .consent-checks-grid .consent-check-item {
      padding: 0.375rem;

      span {
        font-size: 0.6875rem;
      }
    }

    .consent-details {
      padding: 0.625rem;

      .consent-detail {
        .detail-label {
          font-size: 0.5625rem;
        }

        .detail-value {
          font-size: 0.8125rem;
        }
      }
    }
  }

  .policy-section {
    .policy-header {
      .policy-icon {
        width: 36px;
        height: 36px;
      }

      h3 {
        font-size: 0.9375rem;
      }

      p {
        font-size: 0.625rem;
      }
    }

    .policy-items .policy-item {
      padding: 0.625rem;

      .policy-title {
        font-size: 0.8125rem;
      }

      .policy-desc {
        font-size: 0.625rem;
      }
    }

    .policy-consent-checkbox {
      padding: 0.625rem;

      input[type="checkbox"] {
        width: 18px;
        height: 18px;
      }

      span {
        font-size: 0.6875rem;
      }
    }
  }

  .confirmation-checklist-card {
    padding: 0.75rem;

    .checklist-header {
      .checklist-icon {
        width: 36px;
        height: 36px;
      }

      h3 {
        font-size: 0.9375rem;
      }

      p {
        font-size: 0.625rem;
      }
    }

    .checklist-items .checklist-item {
      padding: 0.375rem;

      span {
        font-size: 0.6875rem;
      }
    }

    .total-preview {
      padding: 0.625rem;

      .total-label {
        font-size: 0.5625rem;
      }

      .total-amount {
        font-size: 1.25rem;
      }

      .total-desc {
        font-size: 0.625rem;
      }
    }

    .confirm-note {
      font-size: 0.625rem;
    }
  }

  // Review
  .detail-box {
    padding: 0.75rem;

    .box-label {
      font-size: 0.5625rem;
    }

    .box-value {
      font-size: 0.875rem;
    }
  }

  // Footer
  .wizard-footer {
    padding: 0.5rem 0.75rem;
  }

  .back-btn {
    padding: 0.625rem 0.75rem;
    font-size: 0.8125rem;
    min-width: 70px;
  }

  .continue-btn {
    padding: 0.625rem 0.75rem;
    font-size: 0.8125rem;
  }
}
</style>
