# Rapid Capsule Patient Design System

A comprehensive design guide for building consistent patient-facing pages in the Rapid Capsule telemedicine platform.

---

## Table of Contents

1. [Design Tokens](#design-tokens)
2. [Typography](#typography)
3. [Spacing System](#spacing-system)
4. [Layout Patterns](#layout-patterns)
5. [Components](#components)
6. [Icons](#icons)
7. [Animations](#animations)
8. [Responsive Design](#responsive-design)
9. [Code Examples](#code-examples)

---

## Design Tokens

### Color Palette

#### Primary - Sky Blue (Brand Color)
```scss
$sky: #4FC3F7;           // Primary actions, highlights
$sky-light: #E1F5FE;     // Light backgrounds, hover states
$sky-dark: #0288D1;      // Text on light bg, active states
$sky-darker: #01579B;    // Dark accents, gradients
```

#### Neutrals
```scss
$navy: #0F172A;          // Headings, primary text
$slate: #334155;         // Body text, labels
$gray: #64748B;          // Secondary text, descriptions
$light-gray: #94A3B8;    // Placeholder text, icons
$bg: #F8FAFC;            // Page background
$card-bg: #FFFFFF;       // Card backgrounds
```

#### Semantic Colors
```scss
// Success / Positive
$emerald: #10B981;       // Success states, confirmations
$emerald-light: #D1FAE5; // Success backgrounds

// Warning
$amber: #F59E0B;         // Warnings, caution states
$amber-light: #FEF3C7;   // Warning backgrounds

// Error / Urgent
$rose: #F43F5E;          // Errors, urgent states
$rose-light: #FFE4E6;    // Error backgrounds

// Premium / Special
$violet: #8B5CF6;        // Premium features, AI
$violet-light: #EDE9FE;  // Premium backgrounds
```

#### Priority Colors (Health Tips)
```scss
// Urgent Priority
$priority-urgent: #F43F5E;
$priority-urgent-bg: linear-gradient(135deg, #FFF1F2, #FFE4E6);
$priority-urgent-border: #FDA4AF;

// High Priority
$priority-high: #F59E0B;
$priority-high-bg: linear-gradient(135deg, #FFFBEB, #FEF3C7);
$priority-high-border: #FCD34D;

// Medium Priority
$priority-medium: #4FC3F7;
$priority-medium-bg: linear-gradient(135deg, #F0F9FF, #E0F2FE);
$priority-medium-border: #7DD3FC;

// Low Priority
$priority-low: #10B981;
$priority-low-bg: linear-gradient(135deg, #F0FDF4, #DCFCE7);
$priority-low-border: #86EFAC;
```

---

## Typography

### Font Family
```scss
font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
```

### Type Scale
| Element | Size | Weight | Line Height | Color |
|---------|------|--------|-------------|-------|
| Page Title | 24px | 700 | 1.2 | $navy |
| Section Title | 18px | 600 | 1.3 | $navy |
| Card Title | 15px | 600 | 1.4 | $navy |
| Body Text | 14px | 400 | 1.5 | $slate |
| Secondary Text | 13px | 400/500 | 1.4 | $gray |
| Small/Caption | 12px | 500 | 1.3 | $gray |
| Tiny/Label | 11px | 500/600 | 1.2 | $light-gray |
| Badge Text | 10px | 600 | 1 | varies |

### Text Styles
```scss
// Greeting/Hero Title
.greeting-name {
  font-size: 24px;
  font-weight: 700;
  color: white; // or $navy on light bg
  line-height: 1.2;
}

// Card Header
.card-title {
  font-size: 15px;
  font-weight: 600;
  color: $navy;
  margin: 0;
}

// Body Text
.body-text {
  font-size: 14px;
  color: $slate;
  line-height: 1.5;
}

// Secondary/Description
.description {
  font-size: 13px;
  color: $gray;
  line-height: 1.4;
}

// Link Text
.link {
  font-size: 13px;
  color: $sky-dark;
  font-weight: 500;
  text-decoration: none;

  &:hover {
    color: $sky-darker;
  }
}
```

---

## Spacing System

### Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight gaps, badge padding |
| sm | 8px | Icon gaps, small padding |
| md | 12px | Standard gaps between elements |
| lg | 16px | Card padding, section gaps |
| xl | 20px | Bento grid gaps |
| 2xl | 24px | Section margins |
| 3xl | 32px | Hero padding |

### Common Spacing Patterns
```scss
// Card Padding
padding: 20px;           // Desktop
padding: 16px;           // Mobile

// Section Margins
margin-bottom: 24px;     // Between sections

// Element Gaps
gap: 12px;               // Between related items
gap: 16px;               // Between card sections
gap: 20px;               // Grid gaps
```

---

## Layout Patterns

### Page Container
```scss
.page-content {
  flex: 1;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 2rem 100px;  // 100px bottom for mobile nav

  @media (max-width: 768px) {
    padding: 20px 16px 100px;
  }
}
```

### Bento Grid System
```scss
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(6, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

// Card Spans
.card-small { grid-column: span 4; }   // 1/3 width
.card-medium { grid-column: span 6; }  // 1/2 width
.card-large { grid-column: span 8; }   // 2/3 width
.card-full { grid-column: span 12; }   // Full width
```

### Card Header Pattern
```scss
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

  .see-all {
    font-size: 13px;
    color: $sky-dark;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 500;

    &:hover {
      color: $sky-darker;
    }
  }
}
```

---

## Components

### Glass Card
```scss
@mixin glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.04),
    0 1px 2px rgba(0, 0, 0, 0.02);
}

.bento-card {
  @include glass-card;
  border-radius: 20px;
  padding: 20px;

  @media (max-width: 640px) {
    padding: 16px;
    border-radius: 16px;
  }
}
```

### Card Hover Effect
```scss
@mixin card-hover {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.08),
      0 4px 12px rgba(0, 0, 0, 0.04);
  }
}
```

### Primary Button
```scss
.btn-primary {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, $sky, $sky-dark);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba($sky, 0.3);
  }

  &:active {
    transform: scale(0.98);
  }
}
```

### Secondary Button
```scss
.btn-secondary {
  width: 100%;
  padding: 12px;
  background: $sky-light;
  color: $sky-dark;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: lighten($sky-light, 3%);
  }
}
```

### Success Button
```scss
.btn-success {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, $emerald, darken($emerald, 10%));
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba($emerald, 0.3);
  }
}
```

### Action Button (Quick Actions)
```scss
.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 12px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: white;
    border-color: $sky;
    box-shadow: 0 4px 12px rgba($sky, 0.15);
  }

  &:active {
    transform: scale(0.98);
  }

  span {
    font-size: 12px;
    font-weight: 500;
    color: $slate;
  }
}

.action-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;

  // Color variants
  &.sky { background: linear-gradient(135deg, $sky-light, lighten($sky-light, 5%)); color: $sky-dark; }
  &.emerald { background: linear-gradient(135deg, $emerald-light, lighten($emerald-light, 5%)); color: $emerald; }
  &.rose { background: linear-gradient(135deg, $rose-light, lighten($rose-light, 5%)); color: $rose; }
  &.violet { background: linear-gradient(135deg, $violet-light, lighten($violet-light, 5%)); color: $violet; }
  &.amber { background: linear-gradient(135deg, $amber-light, lighten($amber-light, 5%)); color: $amber; }
}
```

### Date Badge
```scss
.date-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, $sky, $sky-dark);
  border-radius: 14px;
  color: white;
  flex-shrink: 0;

  .date-day {
    font-size: 20px;
    font-weight: 700;
    line-height: 1;
  }

  .date-month {
    font-size: 11px;
    text-transform: uppercase;
    opacity: 0.9;
    letter-spacing: 0.5px;
  }
}
```

### Time Pill
```scss
.time-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: linear-gradient(135deg, #F0FDF4, #DCFCE7);
  border: 1px solid #86EFAC;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: #16A34A;
}
```

### Avatar
```scss
.avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
  flex-shrink: 0;

  &.placeholder {
    background: $sky-light;
    color: $sky-dark;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  // Size variants
  &.sm { width: 36px; height: 36px; border-radius: 10px; }
  &.md { width: 48px; height: 48px; border-radius: 12px; }
  &.lg { width: 64px; height: 64px; border-radius: 16px; }
  &.xl { width: 80px; height: 80px; border-radius: 20px; }
}
```

### Badge
```scss
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  font-size: 10px;
  font-weight: 600;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  // Variants
  &.ai {
    background: linear-gradient(135deg, $violet, $sky-dark);
    color: white;
  }

  &.premium {
    background: linear-gradient(135deg, $amber, #D97706);
    color: white;
  }

  &.new {
    background: $emerald;
    color: white;
  }

  &.urgent {
    background: $rose;
    color: white;
    animation: pulse-badge 2s ease-in-out infinite;
  }
}

@keyframes pulse-badge {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

### Info Card (List Item)
```scss
.info-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: #F8FAFC;
  border-radius: 14px;
  border: 1px solid #E2E8F0;

  .info-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .info-content {
    flex: 1;
    min-width: 0;

    h4 {
      font-size: 15px;
      font-weight: 600;
      color: $navy;
      margin: 0 0 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    p {
      font-size: 13px;
      color: $gray;
      margin: 0;
    }
  }
}
```

### Empty State
```scss
.empty-state {
  text-align: center;
  padding: 32px 20px;

  .empty-icon {
    width: 72px;
    height: 72px;
    background: $sky-light;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    color: $sky;
  }

  p {
    color: $gray;
    font-size: 14px;
    margin: 0 0 16px;
  }

  .empty-action {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    background: $sky;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;

    &:hover {
      background: $sky-dark;
    }
  }
}
```

### Progress Ring
```scss
.progress-ring-container {
  position: relative;
  width: 48px;
  height: 48px;
}

.progress-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-ring__bg {
  fill: none;
  stroke: #E2E8F0;
  stroke-width: 4;
}

.progress-ring__fill {
  fill: none;
  stroke: $sky;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 125.66; // 2 * PI * radius (20)
  transition: stroke-dashoffset 0.6s ease;

  &.complete {
    stroke: $emerald;
  }
}

.progress-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: 700;
  color: $sky-dark;
}
```

### Timeline Item
```scss
.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #F1F5F9;

  &:last-child {
    border-bottom: none;
  }

  .timeline-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: $sky-light;
    color: $sky-dark;
  }

  .timeline-content {
    flex: 1;
    min-width: 0;

    .activity-title {
      font-size: 13px;
      font-weight: 500;
      color: $slate;
      display: block;
      margin-bottom: 2px;
    }

    .activity-time {
      font-size: 12px;
      color: $light-gray;
    }
  }
}
```

---

## Icons

### Icon Library
Using **oh-vue-icons** with these icon sets:
- `Hi` - Heroicons (primary)
- `Fa` - Font Awesome
- `Bi` - Bootstrap Icons
- `Ri` - Remix Icons
- `Md` - Material Design

### Registered Icons
```javascript
// Navigation & UI
HiMenu, HiMenuAlt2, HiX, HiChevronRight, HiChevronLeft, HiChevronDown, HiChevronUp,
HiArrowRight, HiArrowLeft, HiBell, HiCog, HiSearch, HiRefresh

// Health & Medical
HiHeart, HiScale, HiClipboardCheck, HiClipboardList, HiBeaker, HiShieldCheck,
FaLungs, FaThermometerHalf, FaWeight, RiCapsuleLine, BiDropletFill

// Actions
HiPlus, HiPlusCircle, HiPencil, HiDownload, HiShare, HiVideoCamera, HiPhone

// Status
HiCheckCircle, HiExclamation, HiExclamationCircle, HiInformationCircle,
HiLightBulb, HiSparkles

// Data & Charts
HiChartBar, HiDocumentText, HiCalendar, HiClock, HiTrendingUp

// People
HiUser, HiUsers, HiUserCircle, HiUserAdd

// Lifestyle
FaSun, FaAppleAlt, FaRunning, HiMoon, HiLightningBolt, HiEmojiHappy
```

### Icon Sizing
```javascript
// In template
<v-icon name="hi-heart" scale="0.8" />  // Small (in badges)
<v-icon name="hi-heart" scale="0.9" />  // Medium (in lists)
<v-icon name="hi-heart" scale="1.0" />  // Default
<v-icon name="hi-heart" scale="1.1" />  // Large (in buttons)
<v-icon name="hi-heart" scale="1.5" />  // Extra large (avatars)
<v-icon name="hi-heart" scale="2.5" />  // Hero (empty states)
```

### Category Icon Mapping
```javascript
const getCategoryIcon = (category) => {
  const iconMap = {
    vitals: 'hi-heart',
    lifestyle: 'fa-sun',
    nutrition: 'fa-apple-alt',
    fitness: 'hi-lightning-bolt',
    mental_health: 'hi-emoji-happy',
    preventive_care: 'hi-shield-check',
    chronic_condition: 'hi-clipboard-list',
    medication: 'ri-capsule-line',
    sleep: 'hi-moon',
    hydration: 'hi-beaker',
  };
  return iconMap[category] || 'hi-light-bulb';
};
```

---

## Animations

### Transitions
```scss
// Standard transition
transition: all 0.2s;

// Smooth easing for interactions
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

// Progress/loading animations
transition: stroke-dashoffset 0.6s ease;
```

### Hover Effects
```scss
// Card lift
&:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
}

// Button press
&:active {
  transform: scale(0.98);
}

// Link slide
&:hover {
  transform: translateX(2px);
}
```

### Keyframe Animations
```scss
// Floating orbs (background)
@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(20px, -20px) scale(1.05); }
  50% { transform: translate(-10px, 10px) scale(0.95); }
  75% { transform: translate(-20px, -10px) scale(1.02); }
}

// Pulse for badges
@keyframes pulse-badge {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

// Health orb pulse
@keyframes pulse-ring {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.3; }
}
```

---

## Responsive Design

### Breakpoints
```scss
// Desktop: > 1024px (12 column grid)
// Tablet: 641px - 1024px (6 column grid)
// Mobile: <= 640px (1 column grid)

@media (max-width: 1024px) { /* Tablet */ }
@media (max-width: 768px) { /* Large mobile / small tablet */ }
@media (max-width: 640px) { /* Mobile */ }
```

### Grid Responsive Behavior
```scss
.bento-card {
  // Desktop: span 4 of 12 (1/3)
  grid-column: span 4;

  @media (max-width: 1024px) {
    // Tablet: span 6 of 6 (full or half)
    grid-column: span 6;
  }

  @media (max-width: 640px) {
    // Mobile: full width
    grid-column: span 1;
  }
}
```

### Mobile Adjustments
```scss
// Padding
padding: 20px;
@media (max-width: 640px) { padding: 16px; }

// Border radius
border-radius: 20px;
@media (max-width: 640px) { border-radius: 16px; }

// Font sizes (optional reduction)
font-size: 15px;
@media (max-width: 640px) { font-size: 14px; }

// Hide non-essential elements
.desktop-only {
  @media (max-width: 768px) { display: none; }
}
```

---

## Code Examples

### Basic Page Structure
```vue
<template>
  <div class="page-container">
    <!-- Page Header -->
    <section class="page-header">
      <h1>Page Title</h1>
      <p class="page-subtitle">Optional subtitle or description</p>
    </section>

    <!-- Content Grid -->
    <section class="bento-grid">
      <div class="bento-card card-medium">
        <div class="card-header">
          <h3>Card Title</h3>
          <router-link to="/more" class="see-all">
            See all <v-icon name="hi-arrow-right" scale="0.7" />
          </router-link>
        </div>
        <!-- Card content -->
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
// Import design tokens
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;

// Mixins
@mixin glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 2rem 100px;

  @media (max-width: 768px) {
    padding: 20px 16px 100px;
  }
}

.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(6, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.bento-card {
  @include glass-card;
  border-radius: 20px;
  padding: 20px;
}

.card-medium {
  grid-column: span 6;

  @media (max-width: 640px) {
    grid-column: span 1;
  }
}
</style>
```

### List with Items
```vue
<template>
  <div class="list-container">
    <div v-for="item in items" :key="item.id" class="list-item">
      <div class="item-icon" :class="item.type">
        <v-icon :name="item.icon" scale="1" />
      </div>
      <div class="item-content">
        <h4>{{ item.title }}</h4>
        <p>{{ item.description }}</p>
      </div>
      <v-icon name="hi-chevron-right" scale="0.8" class="item-arrow" />
    </div>
  </div>
</template>
```

### Action Buttons Grid
```vue
<template>
  <div class="actions-grid">
    <button class="action-btn" @click="doAction">
      <div class="action-icon sky">
        <v-icon name="hi-clipboard-check" scale="1.1" />
      </div>
      <span>Action Label</span>
    </button>
  </div>
</template>
```

---

## Best Practices

1. **Consistency**: Always use design tokens instead of hardcoded colors
2. **Accessibility**: Maintain color contrast ratios, use semantic HTML
3. **Performance**: Use CSS transitions over JavaScript animations
4. **Mobile-first**: Design for mobile, enhance for desktop
5. **Whitespace**: Use generous padding and margins for readability
6. **Feedback**: Provide visual feedback on all interactive elements
7. **Loading States**: Show skeletons or spinners during data fetching
8. **Empty States**: Always handle empty data with helpful messaging
9. **Error States**: Display user-friendly error messages
10. **Icons**: Keep icon usage consistent across similar actions

---

## File References

- **Dashboard V2**: `RC/src/views/Mainapp/patient-dashboard-v2.vue`
- **Onboarding Dashboard**: `RC/src/views/Mainapp/SpecialistApp/Onboarding/dashboard.vue`
- **Main.js Icons**: `RC/src/main.js`

---

*Last Updated: February 2026*
*Version: 1.0.0*
