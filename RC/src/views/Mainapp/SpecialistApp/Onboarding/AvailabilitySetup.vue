<template>
  <div class="availability-page" :class="{ 'drawer-open': showMobileDrawer }">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <v-icon name="hi-refresh" scale="2" class="spin" />
        <span>Loading your availability...</span>
      </div>
    </div>

    <!-- Mobile Header (visible < 768px) -->
    <header class="mobile-header">
      <button class="mobile-menu-btn" @click="showMobileDrawer = true">
        <v-icon name="hi-menu" scale="1.1" />
      </button>
      <div class="mobile-logo">
        <div class="logo-icon">
          <v-icon name="hi-heart" scale="0.9" />
        </div>
        <span>Rapid Capsule</span>
      </div>
      <button class="mobile-help-btn">
        <v-icon name="hi-question-mark-circle" scale="1.1" />
      </button>
    </header>

    <!-- Mobile Progress Bar -->
    <div class="mobile-progress">
      <div class="progress-info">
        <span class="progress-step">Step 5 of 7</span>
        <span class="progress-percent">60% Complete</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: 60%"></div>
      </div>
    </div>

    <!-- Mobile Drawer Overlay -->
    <div v-if="showMobileDrawer" class="drawer-overlay" @click="showMobileDrawer = false"></div>

    <!-- Mobile Side Drawer -->
    <aside class="mobile-drawer" :class="{ open: showMobileDrawer }">
      <div class="drawer-header">
        <div class="drawer-logo">
          <div class="logo-icon">
            <v-icon name="hi-heart" scale="0.9" />
          </div>
          <span>Menu</span>
        </div>
        <button class="drawer-close" @click="showMobileDrawer = false">
          <v-icon name="hi-x" scale="1.1" />
        </button>
      </div>

      <div class="drawer-content">
        <!-- Profile Section -->
        <div class="drawer-profile">
          <div class="profile-avatar">
            <v-icon name="hi-user" scale="1.2" />
          </div>
          <div class="profile-info">
            <span class="profile-name">Dr. {{ userName }}</span>
            <span class="profile-status">Setup In Progress</span>
          </div>
        </div>

        <!-- Main Menu -->
        <div class="drawer-section">
          <h3 class="drawer-section-title">Main Menu</h3>
          <nav class="drawer-nav">
            <a href="#" class="drawer-nav-item active">
              <v-icon name="hi-rocket-launch" scale="0.9" />
              Setup Dashboard
            </a>
            <a href="#" class="drawer-nav-item disabled">
              <v-icon name="hi-calendar" scale="0.9" />
              Appointments
            </a>
            <a href="#" class="drawer-nav-item disabled">
              <v-icon name="hi-user-group" scale="0.9" />
              Patient Queue
            </a>
            <a href="#" class="drawer-nav-item disabled">
              <v-icon name="hi-credit-card" scale="0.9" />
              Earnings
            </a>
          </nav>
        </div>

        <!-- Setup Progress -->
        <div class="drawer-section">
          <h3 class="drawer-section-title">Setup Progress</h3>
          <div class="setup-progress-list">
            <div class="progress-item completed">
              <div class="progress-check"><v-icon name="hi-check" scale="0.6" /></div>
              <span>Account Creation</span>
            </div>
            <div class="progress-item completed">
              <div class="progress-check"><v-icon name="hi-check" scale="0.6" /></div>
              <span>Quick Bio</span>
            </div>
            <div class="progress-item completed">
              <div class="progress-check"><v-icon name="hi-check" scale="0.6" /></div>
              <span>Setup Dashboard</span>
            </div>
            <div class="progress-item completed">
              <div class="progress-check"><v-icon name="hi-check" scale="0.6" /></div>
              <span>Profile Config</span>
            </div>
            <div class="progress-item active">
              <div class="progress-dot"></div>
              <span>Availability</span>
            </div>
            <div class="progress-item pending">
              <div class="progress-number">6</div>
              <span>Identity & Compliance</span>
            </div>
            <div class="progress-item pending">
              <div class="progress-number">7</div>
              <span>Review & Activation</span>
            </div>
          </div>
        </div>
      </div>

      <div class="drawer-footer">
        <button class="drawer-settings-btn">
          <v-icon name="hi-cog" scale="0.9" />
          Settings
        </button>
      </div>
    </aside>

    <!-- Scrollable Content -->
    <div v-if="!isLoading" class="page-scroll">
      <!-- Page Header (Desktop) -->
      <div class="page-header desktop-only">
        <div class="header-left">
          <h1 class="page-title">Set Your Availability</h1>
          <p class="page-subtitle">Configure your working hours, time zones, and urgent slot preferences.</p>
        </div>
        <div class="header-actions">
          <button class="action-btn secondary" @click="syncGoogleCalendar" :disabled="syncingGoogle">
            <v-icon name="bi-google" scale="0.8" />
            {{ syncingGoogle ? 'Syncing...' : 'Sync Google Calendar' }}
          </button>
          <button class="action-btn secondary" @click="syncAppleCalendar" :disabled="syncingApple">
            <v-icon name="hi-desktop-computer" scale="0.8" />
            {{ syncingApple ? 'Syncing...' : 'Sync Apple Calendar' }}
          </button>
          <button class="action-btn primary" @click="autoFillSchedule">
            <v-icon name="fa-magic" scale="0.8" />
            Auto-Fill (AI)
          </button>
        </div>
      </div>

      <!-- Mobile Page Title -->
      <div class="mobile-page-title">
        <h1>Set Your Availability</h1>
        <p>Configure your working hours and preferences</p>
      </div>

      <!-- Mobile Configuration Cards -->
      <div class="mobile-config-section">
        <!-- Timezone Card -->
        <div class="config-card">
          <label class="config-label">Your Timezone</label>
          <div class="config-select-wrapper">
            <v-icon name="hi-globe-alt" scale="0.9" class="config-icon" />
            <select v-model="preferences.timezone" class="config-select">
              <option value="Africa/Lagos">West Africa Time (GMT+1)</option>
              <option value="Africa/Accra">Greenwich Mean Time (GMT+0)</option>
              <option value="Africa/Nairobi">East Africa Time (GMT+3)</option>
              <option value="Africa/Johannesburg">South Africa Time (GMT+2)</option>
              <option value="Europe/London">UK Time (GMT+0)</option>
              <option value="America/New_York">US Eastern (GMT-5)</option>
              <option value="America/Los_Angeles">US Pacific (GMT-8)</option>
            </select>
            <v-icon name="hi-chevron-down" scale="0.6" class="config-arrow" />
          </div>
        </div>

        <!-- Slot Duration & Buffer Grid -->
        <div class="config-grid">
          <div class="config-card">
            <label class="config-label">Slot Duration</label>
            <div class="config-select-wrapper">
              <v-icon name="hi-clock" scale="0.8" class="config-icon" />
              <select v-model="slotDuration" class="config-select">
                <option :value="15">15 Min</option>
                <option :value="30">30 Min</option>
                <option :value="60">60 Min</option>
              </select>
              <v-icon name="hi-chevron-down" scale="0.5" class="config-arrow" />
            </div>
          </div>

          <div class="config-card">
            <label class="config-label">Buffer Time</label>
            <div class="config-select-wrapper">
              <v-icon name="hi-clock" scale="0.8" class="config-icon" />
              <select v-model="bufferTime" class="config-select">
                <option :value="0">None</option>
                <option :value="5">5 Min</option>
                <option :value="10">10 Min</option>
                <option :value="15">15 Min</option>
              </select>
              <v-icon name="hi-chevron-down" scale="0.5" class="config-arrow" />
            </div>
          </div>
        </div>

        <!-- AI Priority Toggle Card -->
        <div class="config-card toggle-card">
          <div class="toggle-info">
            <span class="toggle-title">AI Triage Priority</span>
            <span class="toggle-subtitle">Auto-open urgent slots</span>
          </div>
          <label class="mobile-toggle">
            <input type="checkbox" v-model="aiTriagePriority" />
            <span class="mobile-toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- Configuration Toolbar (Desktop) -->
      <div class="toolbar-card desktop-only">
        <!-- Timezone -->
        <div class="toolbar-item">
          <label>YOUR TIMEZONE</label>
          <div class="select-wrapper">
            <v-icon name="hi-globe-alt" scale="0.8" class="select-icon" />
            <select v-model="preferences.timezone" class="toolbar-select wide">
              <option value="Africa/Lagos">West Africa Time (GMT+1)</option>
              <option value="Africa/Accra">Greenwich Mean Time (GMT+0)</option>
              <option value="Africa/Nairobi">East Africa Time (GMT+3)</option>
              <option value="Africa/Johannesburg">South Africa Time (GMT+2)</option>
              <option value="Europe/London">UK Time (GMT+0)</option>
              <option value="America/New_York">US Eastern (GMT-5)</option>
              <option value="America/Los_Angeles">US Pacific (GMT-8)</option>
            </select>
            <v-icon name="hi-chevron-down" scale="0.6" class="select-arrow" />
          </div>
        </div>

        <!-- Slot Duration -->
        <div class="toolbar-item">
          <label>SLOT DURATION</label>
          <div class="select-wrapper">
            <v-icon name="hi-clock" scale="0.8" class="select-icon" />
            <select v-model="slotDuration" class="toolbar-select">
              <option :value="30">30 Min</option>
              <option :value="45">45 Min</option>
              <option :value="60">60 Min</option>
              <option :value="90">90 Min</option>
              <option :value="120">120 Min</option>
            </select>
            <v-icon name="hi-chevron-down" scale="0.6" class="select-arrow" />
          </div>
        </div>

        <!-- Buffer Time -->
        <div class="toolbar-item">
          <label>BUFFER TIME</label>
          <div class="select-wrapper">
            <v-icon name="hi-clock" scale="0.8" class="select-icon" />
            <select v-model="bufferTime" class="toolbar-select">
              <option :value="0">No Buffer</option>
              <option :value="5">5 Min</option>
              <option :value="10">10 Min</option>
              <option :value="15">15 Min</option>
            </select>
            <v-icon name="hi-chevron-down" scale="0.6" class="select-arrow" />
          </div>
        </div>

        <!-- AI Triage Priority -->
        <div class="toolbar-item toggle-item">
          <div class="toggle-wrapper">
            <label class="toggle-switch">
              <input type="checkbox" v-model="aiTriagePriority" />
              <span class="toggle-slider"></span>
            </label>
            <div class="toggle-text">
              <span class="toggle-label">AI Triage Priority</span>
              <span class="toggle-desc">Auto-open slots for urgent cases</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="content-area">
        <!-- Calendar Section -->
        <div class="calendar-section">
          <!-- Week Navigation & Legend -->
          <div class="calendar-header">
            <div class="week-nav">
              <button class="nav-btn" @click="previousWeek">
                <v-icon name="hi-chevron-left" scale="0.9" />
              </button>
              <span class="week-label">{{ weekRangeLabel }}</span>
              <button class="nav-btn" @click="nextWeek">
                <v-icon name="hi-chevron-right" scale="0.9" />
              </button>
            </div>

            <div class="legend">
              <div class="legend-item">
                <span class="legend-dot available"></span>
                <span>Available</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot urgent"></span>
                <span>Urgent</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot blocked"></span>
                <span>Blocked</span>
              </div>
            </div>
          </div>

          <!-- Mobile Days Header -->
          <div class="mobile-days-header">
            <div
              v-for="day in weekDays"
              :key="day.date"
              class="mobile-day-col"
              :class="{ weekend: day.isWeekend, today: day.isToday }"
            >
              {{ day.shortName }} {{ day.dayNum }}
            </div>
          </div>

          <!-- Mobile Slots List View -->
          <div class="mobile-slots-list">
            <div
              v-for="slot in flatSlotsList"
              :key="`${slot.date}-${slot.start_time}`"
              class="mobile-slot-item"
              :class="slot.type"
              @click="openSlotEditorForDate(slot)"
            >
              <div class="slot-main">
                <span class="slot-day">{{ slot.dayShort }}</span>
                <span class="slot-time">{{ slot.start_time }} - {{ slot.end_time }}</span>
              </div>
              <div class="slot-type-label">
                <v-icon v-if="slot.type === 'urgent'" name="hi-lightning-bolt" scale="0.5" />
                {{ getSlotTypeLabel(slot.type) }}
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="flatSlotsList.length === 0" class="mobile-slots-empty">
              <v-icon name="hi-calendar" scale="2" />
              <p>No slots configured</p>
              <span>Tap on a time in the calendar to add availability</span>
            </div>

            <!-- Add Slot Button (Mobile) -->
            <button class="mobile-add-slot-btn" @click="openQuickSlotEditor">
              <v-icon name="hi-plus" scale="0.9" />
              Add Time Slot
            </button>
          </div>

          <!-- Calendar Grid (Desktop) -->
          <div class="calendar-grid desktop-only">
            <!-- Header Row -->
            <div class="grid-header">
              <div class="time-col-header">{{ timezoneShort }}</div>
              <div
                v-for="day in weekDays"
                :key="day.date"
                class="day-col-header"
                :class="{ weekend: day.isWeekend, today: day.isToday }"
              >
                <span class="day-name">{{ day.shortName }}</span>
                <span class="day-date">{{ day.dayNum }}</span>
              </div>
            </div>

            <!-- Time Rows -->
            <div class="grid-body">
              <div
                v-for="hour in displayHours"
                :key="hour"
                class="time-row"
              >
                <div class="time-col">{{ formatHour(hour) }}</div>
                <div
                  v-for="day in weekDays"
                  :key="`${day.date}-${hour}`"
                  class="slot-cell"
                  :class="getSlotClass(day.date, hour)"
                  @click="openSlotEditor(day, hour, $event)"
                >
                  <template v-if="getSlot(day.date, hour)">
                    <div class="slot-content" :class="getSlot(day.date, hour).type">
                      <v-icon
                        v-if="getSlot(day.date, hour).type === 'urgent'"
                        name="hi-lightning-bolt"
                        scale="0.5"
                      />
                      <span class="slot-label">{{ getSlotLabel(day.date, hour) }}</span>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- Mobile Weekly Summary -->
          <div class="mobile-summary-card">
            <h3>Weekly Summary</h3>
            <div class="mobile-summary-chart">
              <div class="donut-chart small">
                <svg viewBox="0 0 100 100">
                  <circle
                    class="donut-ring"
                    cx="50" cy="50" r="40"
                    fill="transparent"
                    stroke="#E2E8F0"
                    stroke-width="12"
                  />
                  <circle
                    class="donut-segment routine-segment"
                    cx="50" cy="50" r="40"
                    fill="transparent"
                    stroke="#4FC3F7"
                    stroke-width="12"
                    :stroke-dasharray="`${routineArc} ${251.2 - routineArc}`"
                    stroke-dashoffset="62.8"
                  />
                  <circle
                    class="donut-segment urgent-segment"
                    cx="50" cy="50" r="40"
                    fill="transparent"
                    stroke="#FF9800"
                    stroke-width="12"
                    :stroke-dasharray="`${urgentArc} ${251.2 - urgentArc}`"
                    :stroke-dashoffset="62.8 - routineArc"
                  />
                </svg>
              </div>
            </div>
            <div class="mobile-summary-stats">
              <div class="stat-item">
                <span class="stat-label">Total Hours</span>
                <span class="stat-value">{{ totalHours }} Hrs</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Urgent Slots</span>
                <span class="stat-value urgent">{{ urgentHours }} Hrs ({{ urgentPercent }}%)</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Potential Earnings</span>
                <span class="stat-value earnings">₦{{ formattedEarnings }}</span>
              </div>
            </div>
          </div>

          <!-- Mobile Vacation Card -->
          <div class="mobile-vacation-card">
            <div class="vacation-icon">
              <v-icon name="fa-plane-departure" scale="2" />
            </div>
            <h3 class="vacation-title">Taking a Break?</h3>
            <p class="vacation-text">Block dates for vacation</p>
            <button class="vacation-block-btn" @click="openVacationModal">
              Add Vacation Block
            </button>
          </div>

          <!-- Mobile Recurring Pattern (commented out for now) -->
          <!-- <div class="mobile-recurring-card" v-if="hasRecurringPattern">
            <div class="recurring-header">
              <h3>Recurring Pattern</h3>
              <button class="edit-pattern-btn">Edit</button>
            </div>
            <div class="recurring-content">
              <div class="recurring-icon">
                <v-icon name="hi-clock" scale="0.9" />
              </div>
              <div class="recurring-info">
                <span class="recurring-title">Weekdays</span>
                <span class="recurring-time">{{ recurringPatternTime }}</span>
                <div class="recurring-days">
                  <span v-for="day in recurringDays" :key="day" class="day-pill" :class="{ active: day.active }">
                    {{ day.letter }}
                  </span>
                </div>
              </div>
            </div>
          </div> -->
        </div>

        <!-- Right Sidebar (Desktop) -->
        <aside class="sidebar desktop-only">
          <!-- Summary Card -->
          <div class="summary-card">
            <h3 class="card-title">Availability Summary</h3>
            <div class="summary-chart">
              <div class="donut-chart">
                <svg viewBox="0 0 100 100">
                  <circle
                    class="donut-ring"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#E2E8F0"
                    stroke-width="12"
                  />
                  <circle
                    class="donut-segment routine-segment"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#4FC3F7"
                    stroke-width="12"
                    :stroke-dasharray="`${routineArc} ${251.2 - routineArc}`"
                    stroke-dashoffset="62.8"
                  />
                  <circle
                    class="donut-segment urgent-segment"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#FF9800"
                    stroke-width="12"
                    :stroke-dasharray="`${urgentArc} ${251.2 - urgentArc}`"
                    :stroke-dashoffset="62.8 - routineArc"
                  />
                  <circle
                    class="donut-segment both-segment"
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#9C27B0"
                    stroke-width="12"
                    :stroke-dasharray="`${bothArc} ${251.2 - bothArc}`"
                    :stroke-dashoffset="62.8 - routineArc - urgentArc"
                  />
                </svg>
                <div class="donut-center">
                  <span class="donut-value">{{ totalHours }}</span>
                  <span class="donut-label">hrs/week</span>
                </div>
              </div>
            </div>
            <div class="summary-stats">
              <div class="stat-row">
                <span class="stat-label">Total Hours</span>
                <span class="stat-value">{{ totalHours }} Hrs</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">
                  <span class="legend-dot-inline routine"></span>
                  Routine
                </span>
                <span class="stat-value routine">{{ routineHours }} Hrs ({{ routinePercent }}%)</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">
                  <span class="legend-dot-inline urgent"></span>
                  Urgent
                </span>
                <span class="stat-value urgent">{{ urgentHours }} Hrs ({{ urgentPercent }}%)</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">
                  <span class="legend-dot-inline both"></span>
                  Flexible
                </span>
                <span class="stat-value both">{{ bothHours }} Hrs ({{ bothPercent }}%)</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Potential Earnings</span>
                <span class="stat-value earnings">₦{{ formattedEarnings }}</span>
              </div>
            </div>
          </div>

          <!-- Vacation Card -->
          <div class="vacation-card">
            <div class="vacation-bg-icon">
              <v-icon name="hi-calendar" scale="3" />
            </div>
            <h3 class="vacation-title">Taking a Break?</h3>
            <p class="vacation-text">Block out dates for vacation. We'll automatically notify your patients.</p>
            <button class="vacation-btn" @click="openVacationModal">
              <v-icon name="hi-plus" scale="0.7" />
              Add Vacation Block
            </button>
          </div>
        </aside>
      </div>
    </div>

    <!-- Sticky Footer (Desktop) -->
    <div class="sticky-footer desktop-only">
      <div class="sticky-footer-inner">
        <button class="draft-btn" @click="saveDraft" :disabled="isSaving">
          {{ isSaving ? 'Saving...' : 'Save as Draft' }}
        </button>
        <div class="footer-right">
          <span v-if="!isOnboardingComplete" class="next-hint">Next: Rate Cards</span>
          <button class="continue-btn" @click="saveAndContinue" :disabled="isSaving">
            <v-icon v-if="isSaving" name="hi-refresh" scale="0.8" class="spin" />
            {{ isSaving ? 'Saving...' : (isOnboardingComplete ? 'Save Changes' : 'Save Availability') }}
            <v-icon v-if="!isSaving && !isOnboardingComplete" name="hi-arrow-right" scale="0.8" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Sticky Footer -->
    <div class="mobile-sticky-footer">
      <button class="mobile-draft-btn" @click="saveDraft" :disabled="isSaving">
        Save Draft
      </button>
      <button class="mobile-save-btn" @click="saveAndContinue" :disabled="isSaving">
        <v-icon v-if="isSaving" name="hi-refresh" scale="0.8" class="spin" />
        {{ isSaving ? 'Saving...' : (isOnboardingComplete ? 'Save' : 'Save') }}
        <v-icon v-if="!isSaving && !isOnboardingComplete" name="hi-arrow-right" scale="0.8" />
      </button>
    </div>

    <!-- Slot Editor Modal -->
    <div v-if="showSlotEditor" class="modal-overlay" @click.self="closeSlotEditor">
      <div class="slot-editor-modal">
        <div class="modal-header">
          <h3>{{ editingSlot ? 'Edit Time Slot' : 'Add Time Slot' }}</h3>
          <button class="close-btn" @click="closeSlotEditor">
            <v-icon name="hi-x" scale="1" />
          </button>
        </div>

        <div class="modal-body">
          <!-- Date Display -->
          <div class="editor-date">
            <v-icon name="hi-calendar" scale="0.9" />
            <span>{{ selectedDayLabel }}</span>
          </div>

          <!-- Time Range -->
          <div class="time-range-section">
            <div class="form-group">
              <label>Start Time</label>
              <select v-model="editorStartTime" class="form-select">
                <option v-for="time in timeOptions" :key="time" :value="time">{{ time }}</option>
              </select>
            </div>
            <span class="time-separator">to</span>
            <div class="form-group">
              <label>End Time</label>
              <select v-model="editorEndTime" class="form-select">
                <option v-for="time in endTimeOptions" :key="time" :value="time">{{ time }}</option>
              </select>
            </div>
          </div>

          <!-- Slot Type -->
          <div class="slot-type-section">
            <label>Slot Type</label>
            <div class="type-options">
              <button
                :class="['type-btn', 'routine', { active: editorSlotType === 'routine' }]"
                @click="editorSlotType = 'routine'"
              >
                <v-icon name="hi-check-circle" scale="0.9" />
                <span>Routine</span>
                <small>Regular only</small>
              </button>
              <button
                :class="['type-btn', 'urgent', { active: editorSlotType === 'urgent' }]"
                @click="editorSlotType = 'urgent'"
              >
                <v-icon name="hi-lightning-bolt" scale="0.9" />
                <span>Urgent</span>
                <small>Priority only</small>
              </button>
              <button
                :class="['type-btn', 'both', { active: editorSlotType === 'both' }]"
                @click="editorSlotType = 'both'"
              >
                <v-icon name="hi-sparkles" scale="0.9" />
                <span>Both</span>
                <small>First come first served</small>
              </button>
              <button
                :class="['type-btn', 'break', { active: editorSlotType === 'break' }]"
                @click="editorSlotType = 'break'"
              >
                <v-icon name="hi-minus-circle" scale="0.9" />
                <span>Break</span>
                <small>Blocked time</small>
              </button>
            </div>
          </div>

          <!-- Duration Info -->
          <div class="duration-info">
            <v-icon name="hi-clock" scale="0.8" />
            <span>Duration: {{ calculatedDuration }} minutes</span>
          </div>

          <!-- Recurrence Section -->
          <div class="recurrence-section">
            <label>Repeat This Slot</label>
            <div class="recurrence-options">
              <label class="recurrence-checkbox">
                <input type="checkbox" v-model="recurrenceDaily" />
                <span class="checkbox-mark"></span>
                <span class="checkbox-label">Daily (6 months)</span>
              </label>
              <label class="recurrence-checkbox">
                <input type="checkbox" v-model="recurrenceWeekly" />
                <span class="checkbox-mark"></span>
                <span class="checkbox-label">Weekly (6 months)</span>
              </label>
              <label class="recurrence-checkbox">
                <input type="checkbox" v-model="recurrenceMonthly" />
                <span class="checkbox-mark"></span>
                <span class="checkbox-label">Monthly (6 months)</span>
              </label>
            </div>
            <p v-if="recurrenceDaily || recurrenceWeekly || recurrenceMonthly" class="recurrence-info">
              <v-icon name="hi-information-circle" scale="0.7" />
              This will create slots for the next 6 months
            </p>
          </div>
        </div>

        <div class="modal-footer">
          <button v-if="editingSlot" class="delete-btn" @click="deleteSlot">
            <v-icon name="hi-trash" scale="0.8" />
            Delete
          </button>
          <div class="footer-actions">
            <button class="cancel-btn" @click="closeSlotEditor">Cancel</button>
            <button class="save-btn" @click="saveSlot" :disabled="!canSaveSlot">
              {{ editingSlot ? 'Update Slot' : 'Add Slot' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Vacation Modal -->
    <div v-if="showVacationModal" class="modal-overlay" @click.self="showVacationModal = false">
      <div class="vacation-modal">
        <div class="modal-header">
          <h3>Add Vacation Block</h3>
          <button class="close-btn" @click="showVacationModal = false">
            <v-icon name="hi-x" scale="1" />
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Start Date</label>
            <input type="date" v-model="vacationStart" class="form-input" :min="minDate" />
          </div>
          <div class="form-group">
            <label>End Date</label>
            <input type="date" v-model="vacationEnd" class="form-input" :min="vacationStart || minDate" />
          </div>
          <div class="form-group">
            <label>Reason (optional)</label>
            <input type="text" v-model="vacationReason" class="form-input" placeholder="e.g., Annual leave" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="showVacationModal = false">Cancel</button>
          <button class="save-btn" @click="addVacationBlock" :disabled="!vacationStart || !vacationEnd">
            Add Block
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, inject, reactive, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useOnboardingState } from './composables/useOnboardingState';
import { useToast } from 'vue-toast-notification';

const store = useStore();
const router = useRouter();
const $http = inject('$http');
const toast = useToast();
const { completeStep, goToStep, saveProgress, progressPercent, stepCompletion } = useOnboardingState();

// Check if onboarding is already complete (editing mode vs setup mode)
const isOnboardingComplete = computed(() => {
  return progressPercent.value >= 100 || stepCompletion.review;
});

// State
const isLoading = ref(true);
const isSaving = ref(false);
const syncingGoogle = ref(false);
const syncingApple = ref(false);
const showMobileDrawer = ref(false);

// Preferences from DB
const preferences = ref({
  timezone: 'Africa/Lagos',
  language: 'English (African)',
  gender: 'All',
});

const slotDuration = ref(30);
const bufferTime = ref(5);
const aiTriagePriority = ref(true);

// Current week
const currentWeekStart = ref(getWeekStart(new Date()));

// Slots data: { 'YYYY-MM-DD': [{ start_time, end_time, type }] }
const slots = ref({});

// Store raw time_availability from backend to re-apply when week changes
const savedTimeAvailability = ref([]);

// Slot Editor
const showSlotEditor = ref(false);
const editingSlot = ref(null);
const selectedDay = ref(null);
const selectedHour = ref(null);
const editorStartTime = ref('09:00');
const editorEndTime = ref('10:00');
const editorSlotType = ref('routine');

// Vacation
const showVacationModal = ref(false);
const vacationStart = ref('');
const vacationEnd = ref('');
const vacationReason = ref('');

// Recurrence options
const recurrenceDaily = ref(false);
const recurrenceWeekly = ref(false);
const recurrenceMonthly = ref(false);

// Hours to display (6am to 10pm for wider coverage)
const displayHours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

// Time options for dropdowns
const timeOptions = computed(() => {
  const options = [];
  for (let h = 6; h <= 22; h++) {
    options.push(`${h.toString().padStart(2, '0')}:00`);
    options.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return options;
});

const endTimeOptions = computed(() => {
  if (!editorStartTime.value) return timeOptions.value;
  const startIndex = timeOptions.value.indexOf(editorStartTime.value);
  return timeOptions.value.slice(startIndex + 1);
});

const calculatedDuration = computed(() => {
  if (!editorStartTime.value || !editorEndTime.value) return 0;
  const start = parseTimeToMinutes(editorStartTime.value);
  const end = parseTimeToMinutes(editorEndTime.value);
  return end - start;
});

const canSaveSlot = computed(() => {
  return editorStartTime.value && editorEndTime.value && editorSlotType.value && calculatedDuration.value > 0;
});

const selectedDayLabel = computed(() => {
  if (!selectedDay.value) return '';
  const date = new Date(selectedDay.value.date);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
});

// Computed
const timezoneShort = computed(() => {
  const tzMap = {
    'Africa/Lagos': 'GMT+1',
    'Africa/Accra': 'GMT+0',
    'Africa/Nairobi': 'GMT+3',
    'Africa/Johannesburg': 'GMT+2',
    'Europe/London': 'GMT+0',
    'America/New_York': 'GMT-5',
    'America/Los_Angeles': 'GMT-8',
  };
  return tzMap[preferences.value.timezone] || 'GMT+1';
});

const weekDays = computed(() => {
  const days = [];
  const start = new Date(currentWeekStart.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dayOfWeek = date.getDay();

    days.push({
      date: formatDateKey(date),
      shortName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
      dayNum: date.getDate(),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      isToday: date.getTime() === today.getTime(),
    });
  }
  return days;
});

const weekRangeLabel = computed(() => {
  const start = new Date(currentWeekStart.value);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startMonth = start.toLocaleString('en-US', { month: 'short' });
  const endMonth = end.toLocaleString('en-US', { month: 'short' });
  const year = start.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${year}`;
  }
  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`;
});

const minDate = computed(() => formatDateKey(new Date()));

// Calculate total hours
const totalHours = computed(() => {
  let total = 0;
  Object.values(slots.value).forEach(daySlots => {
    daySlots.forEach(slot => {
      if (slot.type !== 'break') {
        const start = parseTimeToMinutes(slot.start_time);
        const end = parseTimeToMinutes(slot.end_time);
        total += (end - start) / 60;
      }
    });
  });
  return Math.round(total);
});

const urgentHours = computed(() => {
  let total = 0;
  Object.values(slots.value).forEach(daySlots => {
    daySlots.forEach(slot => {
      if (slot.type === 'urgent') {
        const start = parseTimeToMinutes(slot.start_time);
        const end = parseTimeToMinutes(slot.end_time);
        total += (end - start) / 60;
      }
    });
  });
  return Math.round(total);
});

const routineHours = computed(() => {
  let total = 0;
  Object.values(slots.value).forEach(daySlots => {
    daySlots.forEach(slot => {
      if (slot.type === 'routine') {
        const start = parseTimeToMinutes(slot.start_time);
        const end = parseTimeToMinutes(slot.end_time);
        total += (end - start) / 60;
      }
    });
  });
  return Math.round(total * 10) / 10;
});

const bothHours = computed(() => {
  let total = 0;
  Object.values(slots.value).forEach(daySlots => {
    daySlots.forEach(slot => {
      if (slot.type === 'both') {
        const start = parseTimeToMinutes(slot.start_time);
        const end = parseTimeToMinutes(slot.end_time);
        total += (end - start) / 60;
      }
    });
  });
  return Math.round(total * 10) / 10;
});

const urgentPercent = computed(() => {
  if (totalHours.value === 0) return 0;
  return Math.round((urgentHours.value / totalHours.value) * 100);
});

const routinePercent = computed(() => {
  if (totalHours.value === 0) return 0;
  return Math.round((routineHours.value / totalHours.value) * 100);
});

const bothPercent = computed(() => {
  if (totalHours.value === 0) return 0;
  return Math.round((bothHours.value / totalHours.value) * 100);
});

// Donut chart calculations - show proportion of routine, urgent, and both
const routineArc = computed(() => {
  if (totalHours.value === 0) return 0;
  const proportion = routineHours.value / totalHours.value;
  return proportion * 251.2;
});

const urgentArc = computed(() => {
  if (totalHours.value === 0) return 0;
  const proportion = urgentHours.value / totalHours.value;
  return proportion * 251.2;
});

const bothArc = computed(() => {
  if (totalHours.value === 0) return 0;
  const proportion = bothHours.value / totalHours.value;
  return proportion * 251.2;
});

const formattedEarnings = computed(() => {
  const earnings = totalHours.value * 12000;
  return earnings.toLocaleString();
});

// User name for mobile drawer
const userName = computed(() => {
  const profile = store.getters.getUserProfile;
  return profile?.profile?.first_name || 'Specialist';
});

// Flat list of slots for mobile view
const flatSlotsList = computed(() => {
  const list = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  weekDays.value.forEach(day => {
    const daySlots = slots.value[day.date] || [];
    daySlots.forEach(slot => {
      if (slot.type !== 'break') {
        list.push({
          ...slot,
          date: day.date,
          dayShort: day.shortName,
          dayName: day.dayName,
        });
      }
    });
  });

  // Sort by day then by start time
  return list.sort((a, b) => {
    const dayCompare = new Date(a.date) - new Date(b.date);
    if (dayCompare !== 0) return dayCompare;
    return parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time);
  });
});

// Check if there's a recurring pattern
const hasRecurringPattern = computed(() => {
  return savedTimeAvailability.value.length > 0;
});

// Get recurring pattern time display
const recurringPatternTime = computed(() => {
  if (!savedTimeAvailability.value.length) return '';
  const firstSlot = savedTimeAvailability.value[0];
  return `${firstSlot.start_time} - ${firstSlot.end_time}`;
});

// Days for recurring pattern display
const recurringDays = computed(() => {
  const days = [
    { letter: 'M', day: 'Monday', active: false },
    { letter: 'T', day: 'Tuesday', active: false },
    { letter: 'W', day: 'Wednesday', active: false },
    { letter: 'T', day: 'Thursday', active: false },
    { letter: 'F', day: 'Friday', active: false },
  ];

  savedTimeAvailability.value.forEach(slot => {
    const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].indexOf(slot.day);
    if (dayIndex !== -1) {
      days[dayIndex].active = true;
    }
  });

  return days;
});

// Get slot type label
function getSlotTypeLabel(type) {
  const labels = {
    routine: 'Routine Consultation',
    urgent: 'Urgent Priority',
    both: 'Flexible',
    break: 'Blocked',
  };
  return labels[type] || type;
}

// Open slot editor for a specific slot (mobile)
function openSlotEditorForDate(slot) {
  const day = weekDays.value.find(d => d.date === slot.date);
  if (day) {
    selectedDay.value = day;
    editingSlot.value = slot;
    editorStartTime.value = slot.start_time;
    editorEndTime.value = slot.end_time;
    editorSlotType.value = slot.type;
    showSlotEditor.value = true;
  }
}

// Quick add slot (mobile)
function openQuickSlotEditor() {
  // Default to first weekday in current week
  const firstWeekday = weekDays.value.find(d => !d.isWeekend) || weekDays.value[0];
  selectedDay.value = firstWeekday;
  selectedHour.value = 9;
  editingSlot.value = null;
  editorStartTime.value = '09:00';
  editorEndTime.value = '10:00';
  editorSlotType.value = 'routine';
  recurrenceDaily.value = false;
  recurrenceWeekly.value = false;
  recurrenceMonthly.value = false;
  showSlotEditor.value = true;
}

// Helper functions
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateKey(date) {
  return new Date(date).toISOString().split('T')[0];
}

function formatHour(hour) {
  return `${hour.toString().padStart(2, '0')}:00`;
}

function parseTimeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function previousWeek() {
  const newStart = new Date(currentWeekStart.value);
  newStart.setDate(newStart.getDate() - 7);
  currentWeekStart.value = newStart;
}

function nextWeek() {
  const newStart = new Date(currentWeekStart.value);
  newStart.setDate(newStart.getDate() + 7);
  currentWeekStart.value = newStart;
}

// Get slot for a specific hour
function getSlot(date, hour) {
  const daySlots = slots.value[date] || [];
  const hourStr = `${hour.toString().padStart(2, '0')}:00`;

  for (const slot of daySlots) {
    const start = parseTimeToMinutes(slot.start_time);
    const end = parseTimeToMinutes(slot.end_time);
    const hourMinutes = hour * 60;

    if (hourMinutes >= start && hourMinutes < end) {
      return slot;
    }
  }
  return null;
}

function getSlotClass(date, hour) {
  const slot = getSlot(date, hour);
  const day = weekDays.value.find(d => d.date === date);

  const classes = [];
  if (day?.isWeekend && !slot) classes.push('weekend-cell');
  if (slot) classes.push(`slot-${slot.type}`);

  // Check if this is start of slot
  if (slot) {
    const hourStr = `${hour.toString().padStart(2, '0')}:00`;
    if (slot.start_time === hourStr) {
      classes.push('slot-start');
    }
  }

  return classes;
}

function getSlotLabel(date, hour) {
  const slot = getSlot(date, hour);
  if (!slot) return '';

  // Only show label at start of slot
  const hourStr = `${hour.toString().padStart(2, '0')}:00`;
  if (slot.start_time !== hourStr) return '';

  const duration = parseTimeToMinutes(slot.end_time) - parseTimeToMinutes(slot.start_time);

  const labels = {
    routine: duration > 60 ? 'Routine (Long)' : 'Routine',
    urgent: 'Urgent',
    both: 'Flexible',
    break: 'Break',
  };
  return labels[slot.type] || '';
}

// Slot Editor
function openSlotEditor(day, hour, event) {
  selectedDay.value = day;
  selectedHour.value = hour;

  // Reset recurrence options
  recurrenceDaily.value = false;
  recurrenceWeekly.value = false;
  recurrenceMonthly.value = false;

  const existingSlot = getSlot(day.date, hour);

  if (existingSlot) {
    // Edit existing slot
    editingSlot.value = existingSlot;
    editorStartTime.value = existingSlot.start_time;
    editorEndTime.value = existingSlot.end_time;
    editorSlotType.value = existingSlot.type;
  } else {
    // New slot
    editingSlot.value = null;
    const startHour = hour.toString().padStart(2, '0');
    editorStartTime.value = `${startHour}:00`;

    // Use slot duration setting
    const endMinutes = hour * 60 + slotDuration.value;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    editorEndTime.value = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
    editorSlotType.value = 'routine';
  }

  showSlotEditor.value = true;
}

function closeSlotEditor() {
  showSlotEditor.value = false;
  editingSlot.value = null;
  selectedDay.value = null;
  selectedHour.value = null;
}

function saveSlot() {
  if (!canSaveSlot.value || !selectedDay.value) return;

  const slotData = {
    start_time: editorStartTime.value,
    end_time: editorEndTime.value,
    type: editorSlotType.value,
  };

  // Generate all dates to apply the slot to
  const datesToApply = [];
  const baseDate = new Date(selectedDay.value.date);

  if (recurrenceDaily.value || recurrenceWeekly.value || recurrenceMonthly.value) {
    // Calculate 6 months from now
    const endDate = new Date(baseDate);
    endDate.setMonth(endDate.getMonth() + 6);

    if (recurrenceDaily.value) {
      // Every day for 6 months
      for (let d = new Date(baseDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        datesToApply.push(formatDateKey(new Date(d)));
      }
    } else if (recurrenceWeekly.value) {
      // Same day every week for 6 months
      for (let d = new Date(baseDate); d <= endDate; d.setDate(d.getDate() + 7)) {
        datesToApply.push(formatDateKey(new Date(d)));
      }
    } else if (recurrenceMonthly.value) {
      // Same date every month for 6 months
      const dayOfMonth = baseDate.getDate();
      for (let d = new Date(baseDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
        // Handle months with fewer days
        const targetDate = new Date(d);
        targetDate.setDate(Math.min(dayOfMonth, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
        datesToApply.push(formatDateKey(targetDate));
      }
    }
  } else {
    // Single date only
    datesToApply.push(selectedDay.value.date);
  }

  // Apply slot to all dates
  datesToApply.forEach(dateKey => {
    if (!slots.value[dateKey]) {
      slots.value[dateKey] = [];
    }

    // Remove existing slot if editing (only for the original date)
    if (editingSlot.value && dateKey === selectedDay.value.date) {
      slots.value[dateKey] = slots.value[dateKey].filter(s => s !== editingSlot.value);
    }

    // Remove any overlapping slots
    const newStart = parseTimeToMinutes(slotData.start_time);
    const newEnd = parseTimeToMinutes(slotData.end_time);

    slots.value[dateKey] = slots.value[dateKey].filter(slot => {
      const slotStart = parseTimeToMinutes(slot.start_time);
      const slotEnd = parseTimeToMinutes(slot.end_time);
      // Keep if no overlap
      return slotEnd <= newStart || slotStart >= newEnd;
    });

    // Add new slot
    slots.value[dateKey].push({ ...slotData });

    // Sort slots by start time
    slots.value[dateKey].sort((a, b) =>
      parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time)
    );
  });

  closeSlotEditor();

  if (datesToApply.length > 1) {
    toast.success(`Slot added to ${datesToApply.length} dates`);
  } else {
    toast.success(editingSlot.value ? 'Slot updated' : 'Slot added');
  }
}

function deleteSlot() {
  if (!editingSlot.value || !selectedDay.value) return;

  const dateKey = selectedDay.value.date;
  slots.value[dateKey] = slots.value[dateKey].filter(s => s !== editingSlot.value);

  if (slots.value[dateKey].length === 0) {
    delete slots.value[dateKey];
  }

  closeSlotEditor();
  toast.success('Slot deleted');
}

function autoFillSchedule() {
  // Auto-fill Mon-Fri 9am-5pm with break at noon
  weekDays.value.filter(d => !d.isWeekend).forEach(day => {
    slots.value[day.date] = [
      { start_time: '09:00', end_time: '12:00', type: 'routine' },
      { start_time: '12:00', end_time: '13:00', type: 'break' },
      { start_time: '13:00', end_time: '17:00', type: 'routine' },
    ];
  });

  toast.success('Schedule auto-filled with standard hours');
}

// Vacation
function openVacationModal() {
  vacationStart.value = '';
  vacationEnd.value = '';
  vacationReason.value = '';
  showVacationModal.value = true;
}

function addVacationBlock() {
  if (!vacationStart.value || !vacationEnd.value) return;

  const start = new Date(vacationStart.value);
  const end = new Date(vacationEnd.value);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateKey = formatDateKey(d);
    slots.value[dateKey] = [
      { start_time: '00:00', end_time: '23:59', type: 'break' }
    ];
  }

  showVacationModal.value = false;
  toast.success('Vacation block added');
}

// Calendar Sync
async function syncGoogleCalendar() {
  syncingGoogle.value = true;
  try {
    // Use the existing Google Client ID from environment
    const clientId = process.env.VUE_APP_GOOGLE_KEY;
    if (!clientId) {
      toast.error('Google Calendar sync is not configured. Please contact support.');
      syncingGoogle.value = false;
      return;
    }

    // The redirect URI must be registered in Google Cloud Console
    // Using the same domain with a specific path for calendar callback
    const baseUrl = window.location.origin;
    // Try to use the app-settings redirect URI which is already registered for Google
    const redirectUri = `${baseUrl}/app/patient/app-settings`;
    const scope = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.freebusy';

    // Store current page to return after auth
    localStorage.setItem('google_calendar_return_url', window.location.pathname);
    localStorage.setItem('google_calendar_pending', 'true');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('access_type', 'online');
    authUrl.searchParams.set('include_granted_scopes', 'true');
    authUrl.searchParams.set('state', 'calendar_sync');
    authUrl.searchParams.set('prompt', 'consent');

    toast.info('Redirecting to Google for authorization...', { duration: 2000 });

    // Small delay for toast to show
    setTimeout(() => {
      window.location.href = authUrl.toString();
    }, 500);
  } catch (error) {
    console.error('Google Calendar sync error:', error);
    toast.error('Failed to connect to Google Calendar');
    syncingGoogle.value = false;
  }
}

async function syncAppleCalendar() {
  syncingApple.value = true;
  try {
    // Apple Calendar uses CalDAV protocol - requires app-specific password
    // For now, show instructions for manual setup
    showAppleCalendarInstructions();
  } catch (error) {
    console.error('Apple Calendar sync error:', error);
    toast.error('Failed to connect to Apple Calendar');
  } finally {
    syncingApple.value = false;
  }
}

function showAppleCalendarInstructions() {
  // Create a modal/alert with instructions
  const instructions = `
To sync your Apple Calendar:

1. Open Calendar app on your Mac or iCloud.com
2. Go to File → Export → Export...
3. Save the .ics file
4. Upload it using the import button below

Alternatively, you can manually copy your busy times from Apple Calendar.
  `;

  toast.info('Apple Calendar sync: Please export your calendar as .ics file and import it manually. Full iCloud integration coming soon!', {
    duration: 8000,
  });
}

// Handle Google Calendar callback (check on mount)
function handleGoogleCalendarCallback() {
  const hash = window.location.hash;
  if (hash && hash.includes('access_token')) {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');

    if (accessToken) {
      fetchGoogleCalendarEvents(accessToken);
      // Clean up URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  }
}

async function fetchGoogleCalendarEvents(accessToken) {
  try {
    toast.info('Fetching your Google Calendar events...');

    // Get busy times from Google Calendar
    const now = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/freeBusy`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeMin: now.toISOString(),
          timeMax: sixMonthsLater.toISOString(),
          items: [{ id: 'primary' }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch calendar data');
    }

    const data = await response.json();
    const busyTimes = data.calendars?.primary?.busy || [];

    // Convert busy times to break slots
    let addedCount = 0;
    busyTimes.forEach(busy => {
      const startDate = new Date(busy.start);
      const endDate = new Date(busy.end);
      const dateKey = formatDateKey(startDate);

      const startTime = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

      if (!slots.value[dateKey]) {
        slots.value[dateKey] = [];
      }

      // Add as break (blocked time)
      slots.value[dateKey].push({
        start_time: startTime,
        end_time: endTime,
        type: 'break',
      });
      addedCount++;
    });

    // Sort all slots
    Object.keys(slots.value).forEach(dateKey => {
      slots.value[dateKey].sort((a, b) =>
        parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time)
      );
    });

    toast.success(`Synced ${addedCount} busy times from Google Calendar as blocked slots`);
  } catch (error) {
    console.error('Error fetching Google Calendar:', error);
    toast.error('Failed to fetch Google Calendar events. Please try again.');
  }
}

// Convert slots to backend format (recurring by day-of-week)
function convertSlotsToBackend() {
  // Use a Map to deduplicate by day + start_time + end_time
  const slotMap = new Map();

  Object.entries(slots.value).forEach(([dateKey, daySlots]) => {
    const date = new Date(dateKey);
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];

    daySlots.forEach(slot => {
      // Create unique key for deduplication
      const key = `${dayName}-${slot.start_time}-${slot.end_time}`;

      // Only add if not already exists (prefer the first occurrence)
      if (!slotMap.has(key)) {
        slotMap.set(key, {
          day: dayName,
          start_time: slot.start_time,
          end_time: slot.end_time,
          slot_type: slot.type || 'routine',
        });
      }
    });
  });

  const timeAvailability = Array.from(slotMap.values());
  console.log('Saving time_availability:', timeAvailability);
  return timeAvailability;
}

// Apply saved time availability to current week's slots
function applyTimeAvailabilityToWeek() {
  if (!savedTimeAvailability.value.length) return;

  savedTimeAvailability.value.forEach(slot => {
    // Apply to matching days in current week
    weekDays.value.forEach(day => {
      if (day.dayName === slot.day) {
        if (!slots.value[day.date]) {
          slots.value[day.date] = [];
        }

        // Check if slot already exists
        const exists = slots.value[day.date].some(
          s => s.start_time === slot.start_time && s.end_time === slot.end_time
        );

        if (!exists) {
          slots.value[day.date].push({
            start_time: slot.start_time,
            end_time: slot.end_time,
            type: slot.slot_type || 'routine',
          });
        }
      }
    });
  });

  // Sort all day slots
  Object.keys(slots.value).forEach(dateKey => {
    slots.value[dateKey].sort((a, b) =>
      parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time)
    );
  });
}

// Watch for week changes and re-apply slots
watch(currentWeekStart, () => {
  applyTimeAvailabilityToWeek();
});

// Load existing data from DB
async function loadExistingData() {
  try {
    const response = await $http.$_getSpecialistAvailability();
    console.log('Load availability response:', response);
    const data = response?.data?.data;

    if (data) {
      // Load preferences (including timezone)
      if (data.preferences) {
        preferences.value = {
          timezone: data.preferences.timezone || 'Africa/Lagos',
          language: data.preferences.language || 'English (African)',
          gender: data.preferences.gender || 'All',
        };
        console.log('Loaded preferences:', preferences.value);
      }

      // Load time_availability into slots
      if (data.time_availability && Array.isArray(data.time_availability)) {
        console.log('Loading time_availability:', data.time_availability);

        // Store raw data for re-applying when week changes
        savedTimeAvailability.value = data.time_availability;

        // Clear existing slots first to avoid duplicates
        slots.value = {};

        // Apply to current week
        applyTimeAvailabilityToWeek();

        console.log('Slots after loading:', slots.value);
      }
    }
  } catch (error) {
    console.error('Failed to load availability:', error);
    console.error('Error details:', error.response?.data || error);
  }
}

async function saveToBackend() {
  const timeAvailability = convertSlotsToBackend();

  console.log('Saving availability with payload:', { time_availability: timeAvailability });

  try {
    const availResponse = await $http.$_specialistAvailability({
      time_availability: timeAvailability,
    });
    console.log('Availability save response:', availResponse);

    const prefResponse = await $http.$_specialistPreference({
      preferences: preferences.value,
    });
    console.log('Preferences save response:', prefResponse);

    await store.dispatch('fetchUserProfile');
  } catch (error) {
    console.error('Save error details:', error.response?.data || error);
    throw error;
  }
}

async function saveDraft() {
  isSaving.value = true;
  try {
    await saveToBackend();
    saveProgress();
    toast.success('Draft saved successfully');
  } catch (error) {
    console.error('Failed to save draft:', error);
    toast.error('Failed to save. Please try again.');
  } finally {
    isSaving.value = false;
  }
}

async function saveAndContinue() {
  if (totalHours.value === 0) {
    toast.warning('Please add at least one time slot');
    return;
  }

  isSaving.value = true;
  try {
    await saveToBackend();
    saveProgress();
    completeStep('availability');

    // If onboarding is complete, just save and stay. Otherwise, continue to next step.
    if (!isOnboardingComplete.value) {
      goToStep(6);
    } else {
      toast.success('Availability saved successfully');
    }
  } catch (error) {
    console.error('Failed to save availability:', error);
    toast.error('Failed to save. Please try again.');
  } finally {
    isSaving.value = false;
  }
}

onMounted(async () => {
  // Check if returning from Google Calendar OAuth
  handleGoogleCalendarCallback();

  await loadExistingData();
  isLoading.value = false;
});
</script>

<style scoped lang="scss">
.availability-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #F8FAFC;
  width: 100%;
  align-items: center;
}

// Mobile: force full-width, no borders
@media screen and (max-width: 1024px) {
  .availability-page {
    width: 100vw !important;
    max-width: 100vw !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: white !important;
    position: relative !important;
    left: 0 !important;
    right: 0 !important;
  }
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(248, 250, 252, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #64748B;
}

.page-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 2rem;
  padding-bottom: 6rem;
  width: 100%;
  max-width: 1400px;
}

// Page Header
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1A365D;
  margin: 0 0 0.25rem 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #64748B;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.secondary {
    background: white;
    border: 1px solid #E2E8F0;
    color: #475569;

    &:hover:not(:disabled) {
      border-color: #4FC3F7;
      color: #0288D1;
    }
  }

  &.primary {
    background: linear-gradient(135deg, #4FC3F7 0%, #0288D1 100%);
    border: none;
    color: white;

    &:hover:not(:disabled) {
      box-shadow: 0 4px 12px rgba(79, 195, 247, 0.4);
    }
  }
}

// Toolbar
.toolbar-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: flex-end;
  gap: 2rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.toolbar-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  > label {
    font-size: 0.6875rem;
    font-weight: 700;
    color: #64748B;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &.toggle-item {
    margin-left: auto;
  }
}

.select-wrapper {
  position: relative;
}

.select-icon {
  position: absolute;
  left: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: #64748B;
  pointer-events: none;
}

.select-arrow {
  position: absolute;
  right: 0.875rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  pointer-events: none;
}

.toolbar-select {
  padding: 0.75rem 2.5rem;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
  appearance: none;
  cursor: pointer;
  min-width: 130px;

  &.wide {
    min-width: 240px;
  }

  &:focus {
    outline: none;
    border-color: #4FC3F7;
  }
}

// Toggle
.toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toggle-switch {
  position: relative;
  width: 48px;
  height: 26px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background: #CBD5E1;
    border-radius: 26px;
    transition: 0.3s;

    &::before {
      content: '';
      position: absolute;
      height: 20px;
      width: 20px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: 0.3s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
  }

  input:checked + .toggle-slider {
    background: #4FC3F7;
  }

  input:checked + .toggle-slider::before {
    transform: translateX(22px);
  }
}

.toggle-text {
  display: flex;
  flex-direction: column;
}

.toggle-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1A365D;
}

.toggle-desc {
  font-size: 0.75rem;
  color: #64748B;
}

// Content Area
.content-area {
  display: flex;
  gap: 1.5rem;
  width: 100%;
}

// Calendar Section
.calendar-section {
  flex: 1;
  min-width: 0; // Prevents flex shrinking issues
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.week-nav {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #E1F5FE;
    border-color: #4FC3F7;
    color: #0288D1;
  }
}

.week-label {
  font-size: 1rem;
  font-weight: 600;
  color: #1A365D;
  min-width: 180px;
  text-align: center;
}

.legend {
  display: flex;
  gap: 1.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #64748B;
}

.legend-dot {
  width: 14px;
  height: 14px;
  border-radius: 4px;

  &.available { background: #4FC3F7; }
  &.urgent { background: #FF9800; }
  &.both { background: linear-gradient(135deg, #4FC3F7 0%, #9C27B0 100%); }
  &.blocked { background: #E2E8F0; }
}

// Calendar Grid
.calendar-grid {
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  overflow: hidden;
  min-width: 100%;
}

.grid-header {
  display: grid;
  grid-template-columns: 65px repeat(7, minmax(80px, 1fr));
  background: #F8FAFC;
  border-bottom: 2px solid #E2E8F0;
}

.time-col-header {
  padding: 1rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #1A365D;
  text-align: center;
  border-right: 1px solid #E2E8F0;
}

.day-col-header {
  padding: 0.875rem 0.5rem;
  text-align: center;
  border-right: 1px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;

  &:last-child { border-right: none; }

  &.weekend {
    background: #F1F5F9;
    .day-name, .day-date { color: #94A3B8; }
  }

  &.today {
    background: #E1F5FE;
    .day-date { color: #0288D1; }
  }
}

.day-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748B;
}

.day-date {
  font-size: 1rem;
  font-weight: 700;
  color: #1A365D;
}

.grid-body {
  max-height: 500px;
  overflow-y: auto;
}

.time-row {
  display: grid;
  grid-template-columns: 65px repeat(7, minmax(80px, 1fr));
  border-bottom: 1px solid #E2E8F0;

  &:last-child { border-bottom: none; }
}

.time-col {
  padding: 0.875rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748B;
  text-align: center;
  border-right: 1px solid #E2E8F0;
  background: #FAFBFC;
}

.slot-cell {
  min-height: 52px;
  border-right: 1px solid #E2E8F0;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;

  &:last-child { border-right: none; }

  &:hover:not(.slot-routine):not(.slot-urgent):not(.slot-break) {
    background: #F0F9FF;
  }

  &.weekend-cell {
    background: #FAFBFC;
  }

  &.slot-routine {
    background: #E1F5FE;
  }

  &.slot-urgent {
    background: #FFF3E0;
  }

  &.slot-both {
    background: linear-gradient(135deg, #E1F5FE 0%, #F3E5F5 100%);
  }

  &.slot-break {
    background: #F1F5F9;
  }
}

.slot-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.375rem 0.625rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  width: 100%;
  max-width: calc(100% - 0.5rem);

  &.routine {
    background: #4FC3F7;
    color: white;
  }

  &.urgent {
    background: #FF9800;
    color: white;
  }

  &.both {
    background: linear-gradient(135deg, #4FC3F7 0%, #9C27B0 100%);
    color: white;
  }

  &.break {
    background: #CBD5E1;
    color: #64748B;
  }
}

.slot-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// Sidebar
.sidebar {
  width: 280px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex-shrink: 0;
}

// Summary Card
.summary-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);

  .card-title {
    font-size: 1rem;
    font-weight: 700;
    color: #1A365D;
    margin: 0 0 1.25rem 0;
  }
}

.summary-chart {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.donut-chart {
  position: relative;
  width: 150px;
  height: 150px;

  svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .donut-ring { stroke: #E2E8F0; }
  .donut-segment { transition: stroke-dasharray 0.3s ease; }
}

.donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.donut-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1A365D;
}

.donut-label {
  font-size: 0.8125rem;
  color: #64748B;
}

.summary-stats {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748B;
}

.stat-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-dot-inline {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;

  &.routine { background: #4FC3F7; }
  &.urgent { background: #FF9800; }
  &.both { background: linear-gradient(135deg, #4FC3F7 0%, #9C27B0 100%); }
}

.stat-value {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1A365D;

  &.routine { color: #0288D1; }
  &.urgent { color: #FF9800; }
  &.both { color: #9C27B0; }
  &.earnings { color: #4CAF50; }
}

// Vacation Card
.vacation-card {
  background: linear-gradient(135deg, #1A365D 0%, #2D3748 100%);
  border-radius: 1rem;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
}

.vacation-bg-icon {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  opacity: 0.1;
  color: white;
}

.vacation-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: white !important;
  position: relative;
}

.vacation-text {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.85) !important;
  margin: 0 0 1.25rem 0;
  line-height: 1.5;
  position: relative;
}

.vacation-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.5rem;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
}

// Footer
.sticky-footer {
  position: fixed;
  bottom: 0;
  left: 260px;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  border-top: 1px solid #E2E8F0;
  z-index: 50;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
}

.sticky-footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1400px;
}

.draft-btn {
  padding: 0.75rem 1.25rem;
  background: none;
  border: none;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #64748B;
  cursor: pointer;

  &:hover:not(:disabled) { color: #1A365D; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.next-hint {
  font-size: 0.875rem;
  color: #94A3B8;
}

.continue-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: #FF9800;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.9375rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #F57C00;
    transform: translateY(-1px);
  }

  &:disabled { opacity: 0.7; cursor: not-allowed; }
}

// Modals
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.slot-editor-modal,
.vacation-modal {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #E2E8F0;

  h3 {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1A365D;
    margin: 0;
  }
}

.close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F8FAFC;
  border: none;
  border-radius: 0.5rem;
  color: #64748B;
  cursor: pointer;

  &:hover {
    background: #E2E8F0;
    color: #1A365D;
  }
}

.modal-body {
  padding: 1.5rem;
}

.editor-date {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #F8FAFC;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  font-weight: 600;
  color: #1A365D;

  svg { color: #4FC3F7; }
}

.time-range-section {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1.5rem;

  .form-group {
    flex: 1;
  }
}

.time-separator {
  padding-bottom: 0.875rem;
  color: #64748B;
  font-weight: 500;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748B;
    text-transform: uppercase;
  }
}

.form-select,
.form-input {
  padding: 0.875rem 1rem;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  color: #334155;

  &:focus {
    outline: none;
    border-color: #4FC3F7;
  }
}

.slot-type-section {
  margin-bottom: 1.5rem;

  > label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748B;
    text-transform: uppercase;
    margin-bottom: 0.75rem;
  }
}

.type-options {
  display: flex;
  gap: 0.75rem;
}

.type-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 1rem 0.5rem;
  background: #F8FAFC;
  border: 2px solid #E2E8F0;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;

  span {
    font-size: 0.875rem;
    font-weight: 600;
    color: #334155;
  }

  small {
    font-size: 0.6875rem;
    color: #94A3B8;
  }

  &.routine {
    &:hover, &.active {
      border-color: #4FC3F7;
      background: #E1F5FE;
      svg { color: #0288D1; }
    }
    svg { color: #4FC3F7; }
  }

  &.urgent {
    &:hover, &.active {
      border-color: #FF9800;
      background: #FFF3E0;
      svg { color: #F57C00; }
    }
    svg { color: #FF9800; }
  }

  &.both {
    &:hover, &.active {
      border-color: #9C27B0;
      background: linear-gradient(135deg, #E1F5FE 0%, #F3E5F5 100%);
      svg { color: #7B1FA2; }
    }
    svg { color: #9C27B0; }
  }

  &.break {
    &:hover, &.active {
      border-color: #94A3B8;
      background: #F1F5F9;
      svg { color: #64748B; }
    }
    svg { color: #94A3B8; }
  }

  &.active {
    box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.2);
  }
}

.duration-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #F0F9FF;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #0288D1;
  margin-bottom: 1.5rem;

  svg { color: #4FC3F7; }
}

// Recurrence Section
.recurrence-section {
  > label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748B;
    text-transform: uppercase;
    margin-bottom: 0.75rem;
  }
}

.recurrence-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.recurrence-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.75rem 1rem;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  transition: all 0.2s;

  &:hover {
    border-color: #4FC3F7;
    background: #F0F9FF;
  }

  input {
    display: none;

    &:checked + .checkbox-mark {
      background: #4FC3F7;
      border-color: #4FC3F7;

      &::after {
        display: block;
      }
    }

    &:checked ~ .checkbox-label {
      color: #1A365D;
      font-weight: 600;
    }
  }

  .checkbox-mark {
    width: 20px;
    height: 20px;
    border: 2px solid #CBD5E1;
    border-radius: 4px;
    position: relative;
    flex-shrink: 0;
    transition: all 0.2s;

    &::after {
      content: '';
      position: absolute;
      display: none;
      left: 6px;
      top: 2px;
      width: 5px;
      height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
  }

  .checkbox-label {
    font-size: 0.875rem;
    color: #64748B;
  }
}

.recurrence-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.625rem 1rem;
  background: #FFF7ED;
  border: 1px solid #FFEDD5;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  color: #C2410C;

  svg { color: #EA580C; }
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #E2E8F0;
  background: #FAFBFC;
}

.delete-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 1rem;
  background: none;
  border: 1px solid #FCA5A5;
  border-radius: 0.5rem;
  color: #DC2626;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: #FEF2F2;
  }
}

.footer-actions {
  display: flex;
  gap: 0.75rem;
}

.cancel-btn {
  padding: 0.75rem 1.25rem;
  background: none;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #64748B;
  cursor: pointer;

  &:hover { background: #F8FAFC; }
}

.save-btn {
  padding: 0.75rem 1.5rem;
  background: #4FC3F7;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  cursor: pointer;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:hover:not(:disabled) { background: #0288D1; }
}

// Animations
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spin { animation: spin 1s linear infinite; }

// Responsive
@media (max-width: 1024px) {
  .content-area {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;

    > * {
      flex: 1;
      min-width: 280px;
    }
  }
}

@media (max-width: 768px) {
  .page-scroll {
    padding: 0;
    padding-bottom: 5rem;
  }

  .page-header {
    flex-direction: column;
    padding: 1rem;
    background: white;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;

    .action-btn {
      width: 100%;
      justify-content: center;
    }
  }

  .toolbar-card {
    flex-direction: column;
    gap: 1rem;
  }

  .toolbar-item.toggle-item {
    margin-left: 0;
  }

  .calendar-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .legend {
    order: 2;
  }

  .grid-header,
  .time-row {
    grid-template-columns: 55px repeat(7, 1fr);
  }

  .slot-content {
    padding: 0.25rem;
    font-size: 0.625rem;
  }

  .sticky-footer {
    padding: 1rem;
  }

  .next-hint {
    display: none;
  }

  .continue-btn {
    padding: 0.875rem 1.5rem;
  }
}

// =====================================
// MOBILE STYLES (< 768px)
// =====================================

// Hide desktop elements on mobile
.desktop-only {
  @media (max-width: 767px) {
    display: none !important;
  }
}

// Mobile Header - HIDDEN (OnboardingHeader provides this now)
.mobile-header {
  display: none !important; // OnboardingHeader in layout provides mobile header
}

.mobile-menu-btn,
.mobile-help-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #64748B;
  cursor: pointer;
}

.mobile-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .logo-icon {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #4FC3F7, #0288D1);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  span {
    font-size: 1rem;
    font-weight: 700;
    color: #1A365D;
  }
}

// Mobile Progress Bar - HIDDEN (OnboardingHeader drawer provides this now)
.mobile-progress {
  display: none !important; // OnboardingHeader drawer provides progress
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.progress-step {
  font-size: 0.75rem;
  font-weight: 700;
  color: #1A365D;
}

.progress-percent {
  font-size: 0.75rem;
  color: #64748B;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #E2E8F0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4FC3F7;
  border-radius: 4px;
  transition: width 0.3s ease;
}

// Mobile Page Title
.mobile-page-title {
  display: none;
  padding: 1rem 1rem 0;
  background: white;
  border-bottom: 1px solid #E2E8F0;
  padding-bottom: 1rem;

  @media (max-width: 767px) {
    display: block;
  }

  h1 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1A365D;
    margin: 0 0 0.25rem 0;
  }

  p {
    font-size: 0.75rem;
    color: #64748B;
    margin: 0;
  }
}

// Mobile Configuration Cards
.mobile-config-section {
  display: none;
  padding: 1rem;
  gap: 0.75rem;
  flex-direction: column;

  @media (max-width: 767px) {
    display: flex;
  }
}

.config-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  padding: 1rem;
}

.config-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748B;
  margin-bottom: 0.5rem;
}

.config-select-wrapper {
  position: relative;
}

.config-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  pointer-events: none;
}

.config-arrow {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  pointer-events: none;
}

.config-select {
  width: 100%;
  padding: 0.875rem 2.5rem;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
  appearance: none;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #4FC3F7;
  }
}

.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.toggle-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.toggle-info {
  display: flex;
  flex-direction: column;
}

.toggle-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1A365D;
}

.toggle-subtitle {
  font-size: 0.75rem;
  color: #64748B;
}

.mobile-toggle {
  position: relative;
  width: 44px;
  height: 24px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .mobile-toggle-slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background: #CBD5E1;
    border-radius: 24px;
    transition: 0.3s;

    &::before {
      content: '';
      position: absolute;
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: 0.3s;
    }
  }

  input:checked + .mobile-toggle-slider {
    background: #4FC3F7;
  }

  input:checked + .mobile-toggle-slider::before {
    transform: translateX(20px);
  }
}

// Mobile Days Header
.mobile-days-header {
  display: none;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid #E2E8F0;

  @media (max-width: 767px) {
    display: grid;
  }
}

.mobile-day-col {
  text-align: center;
  padding: 0.5rem 0.25rem;
  font-size: 0.625rem;
  font-weight: 700;
  color: #1A365D;
  border-right: 1px solid #E2E8F0;

  &:last-child {
    border-right: none;
  }

  &.weekend {
    color: #94A3B8;
  }

  &.today {
    background: #E1F5FE;
    color: #0288D1;
  }
}

// Mobile Slots List
.mobile-slots-list {
  display: none;
  padding: 0.75rem;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 256px;
  overflow-y: auto;

  @media (max-width: 767px) {
    display: flex;
  }
}

.mobile-slot-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: #E1F5FE;
  border-radius: 6px;
  border-left: 3px solid #0288D1;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &.urgent {
    background: #FFF3E0;
    border-left-color: #F57C00;
  }

  &.both {
    background: linear-gradient(135deg, #E1F5FE 0%, #F3E5F5 100%);
    border-left-color: #9C27B0;
  }

  &.break {
    background: #F1F5F9;
    border-left-color: #94A3B8;
  }

  .slot-main {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .slot-day {
    font-size: 0.6875rem;
    font-weight: 700;
    color: #0288D1;
  }

  .slot-time {
    font-size: 0.6875rem;
    font-weight: 500;
    color: #334155;
  }

  .slot-type-label {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.625rem;
    color: #64748B;
  }

  &.urgent .slot-day {
    color: #F57C00;
  }

  &.both .slot-day {
    color: #9C27B0;
  }
}

.mobile-slots-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  color: #94A3B8;
  text-align: center;

  p {
    margin: 0.75rem 0 0.25rem;
    font-weight: 600;
    color: #64748B;
  }

  span {
    font-size: 0.75rem;
  }
}

.mobile-add-slot-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #F0F9FF;
  border: 1px dashed #4FC3F7;
  border-radius: 6px;
  color: #0288D1;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;

  &:hover {
    background: #E1F5FE;
  }
}

// Mobile Summary Card
.mobile-summary-card {
  display: none;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-top: 1rem;

  @media (max-width: 767px) {
    display: block;
  }

  h3 {
    font-size: 0.875rem;
    font-weight: 700;
    color: #1A365D;
    margin: 0 0 0.75rem 0;
  }
}

.mobile-summary-chart {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;

  .donut-chart.small {
    width: 100px;
    height: 100px;
  }
}

.mobile-summary-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;

  .stat-label {
    color: #64748B;
  }

  .stat-value {
    font-weight: 700;
    color: #1A365D;

    &.urgent {
      color: #FF9800;
    }

    &.earnings {
      color: #4CAF50;
    }
  }
}

// Mobile Vacation Card
.mobile-vacation-card {
  display: none;
  background: linear-gradient(135deg, #1A365D 0%, #2D3748 100%);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-top: 1rem;
  position: relative;
  overflow: hidden;

  @media (max-width: 767px) {
    display: block;
  }

  .vacation-icon {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    opacity: 0.1;
    color: white;
  }

  .vacation-title {
    font-size: 0.875rem;
    font-weight: 700;
    margin: 0 0 0.25rem 0;
    color: white !important;
  }

  .vacation-text {
    font-size: 0.75rem;
    margin: 0 0 0.75rem 0;
    color: rgba(255, 255, 255, 0.8) !important;
  }

  .vacation-block-btn {
    width: 100%;
    padding: 0.625rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

// Mobile Recurring Pattern Card
.mobile-recurring-card {
  display: none;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-top: 1rem;
  margin-bottom: 6rem;

  @media (max-width: 767px) {
    display: block;
  }

  .recurring-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;

    h3 {
      font-size: 0.875rem;
      font-weight: 700;
      color: #1A365D;
      margin: 0;
    }

    .edit-pattern-btn {
      font-size: 0.75rem;
      font-weight: 700;
      color: #4FC3F7;
      background: none;
      border: none;
      cursor: pointer;
    }
  }

  .recurring-content {
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #F8FAFC;
    border-radius: 0.5rem;
    border: 1px solid #E2E8F0;
  }

  .recurring-icon {
    width: 36px;
    height: 36px;
    background: #E1F5FE;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0288D1;
    flex-shrink: 0;
  }

  .recurring-info {
    flex: 1;
  }

  .recurring-title {
    display: block;
    font-size: 0.875rem;
    font-weight: 700;
    color: #334155;
  }

  .recurring-time {
    display: block;
    font-size: 0.75rem;
    color: #64748B;
    margin-bottom: 0.5rem;
  }

  .recurring-days {
    display: flex;
    gap: 0.25rem;
  }

  .day-pill {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #E2E8F0;
    border-radius: 4px;
    font-size: 0.625rem;
    font-weight: 700;
    color: #94A3B8;

    &.active {
      background: #4FC3F7;
      color: white;
    }
  }
}

// Mobile Sticky Footer
.mobile-sticky-footer {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #E2E8F0;
  padding: 1rem;
  gap: 0.75rem;
  z-index: 100;

  @media (max-width: 767px) {
    display: flex;
  }
}

.mobile-draft-btn {
  flex: 1;
  padding: 0.875rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748B;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.mobile-save-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem;
  background: #FF9800;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// Mobile Drawer - HIDDEN (OnboardingHeader provides drawer now)
.drawer-overlay {
  display: none !important; // OnboardingHeader provides drawer
}

.mobile-drawer {
  display: none !important; // OnboardingHeader provides drawer
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #E2E8F0;
}

.drawer-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .logo-icon {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #4FC3F7, #0288D1);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  span {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1A365D;
  }
}

.drawer-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #64748B;
  cursor: pointer;
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.drawer-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #F8FAFC;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
}

.profile-avatar {
  width: 40px;
  height: 40px;
  background: #E2E8F0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748B;
  border: 2px solid white;
}

.profile-info {
  display: flex;
  flex-direction: column;
}

.profile-name {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1A365D;
}

.profile-status {
  font-size: 0.625rem;
  font-weight: 500;
  color: #FF9800;
}

.drawer-section {
  margin-bottom: 1.5rem;
}

.drawer-section-title {
  font-size: 0.6875rem;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.75rem 0;
}

.drawer-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.drawer-nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  color: #64748B;
  text-decoration: none;
  transition: all 0.2s;

  &.active {
    background: rgba(79, 195, 247, 0.1);
    color: #0288D1;
    font-weight: 700;
    border: 1px solid rgba(79, 195, 247, 0.2);
  }

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}

.setup-progress-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;

  &.completed {
    span {
      color: #64748B;
      text-decoration: line-through;
    }
  }

  &.active {
    span {
      font-weight: 700;
      color: #1A365D;
    }
  }

  &.pending {
    span {
      color: #94A3B8;
    }
  }
}

.progress-check {
  width: 24px;
  height: 24px;
  background: #4CAF50;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.progress-dot {
  width: 24px;
  height: 24px;
  background: white;
  border: 2px solid #4FC3F7;
  border-radius: 50%;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    background: #4FC3F7;
    border-radius: 50%;
  }
}

.progress-number {
  width: 24px;
  height: 24px;
  background: #F1F5F9;
  border: 2px solid #E2E8F0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.625rem;
  font-weight: 700;
  color: #94A3B8;
}

.drawer-footer {
  padding: 1rem;
  border-top: 1px solid #E2E8F0;
}

.drawer-settings-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #F8FAFC;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748B;
  cursor: pointer;

  &:hover {
    background: #E2E8F0;
  }
}

// Fix mobile layout - edge-to-edge content like RateCards
@media (max-width: 768px) {
  .availability-page {
    background: white !important;
    margin: 0 !important;
    padding: 0 !important;
    border-radius: 0 !important;
    border: none !important;
    box-shadow: none !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .page-scroll {
    padding: 0 !important;
    padding-bottom: 6rem !important;
    margin: 0 !important;
    border-radius: 0 !important;
  }

  .content-area {
    flex-direction: column;
    padding: 0 !important;
    margin: 0 !important;
  }

  .mobile-page-title {
    padding: 1rem;
    border-bottom: 1px solid #E2E8F0;
    margin: 0;
  }

  .mobile-config-section {
    padding: 1rem;
    background: white;
    border-bottom: 1px solid #E2E8F0;
    margin: 0;
  }

  .config-card {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
  }

  .calendar-section {
    padding: 0 !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: white !important;
    overflow: hidden;
    margin: 0 !important;
  }

  .calendar-header {
    padding: 1rem;
    background: white;
    border-bottom: 1px solid #E2E8F0;
    flex-direction: column;
    gap: 0.75rem;
  }

  .week-nav {
    width: 100%;
    justify-content: space-between;
  }

  .week-label {
    font-size: 0.875rem;
    min-width: auto;
  }

  .legend {
    width: 100%;
    justify-content: flex-start;
    gap: 0.75rem;
    font-size: 0.625rem;
  }

  .legend-dot {
    width: 10px;
    height: 10px;
  }

  .sidebar {
    display: none !important;
  }
}
</style>
