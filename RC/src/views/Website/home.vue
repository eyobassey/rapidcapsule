<template>
  <div class="rc-homepage">
    <!-- Abstract Background Blobs -->
    <div class="blob-bg blob-1"></div>
    <div class="blob-bg blob-2"></div>
    <div class="blob-bg blob-3"></div>

    <!-- Navigation -->
    <nav class="nav-bar" :class="{ 'is-scrolled': scrolled }">
      <div class="hp-container nav-container">
        <div class="brand">
          <img src="/images/homepage/logos/rc-logo-transparent.png" alt="Rapid Capsule Logo" class="brand-logo" />
        </div>

        <!-- Desktop Nav -->
        <div class="desktop-nav">
          <a href="#eka" class="nav-link">Eka AI</a>
          <a href="#rxgpt" class="nav-link">RxGPT</a>
          <a href="#pharmacy" class="nav-link">Pharmacy</a>
          <a href="#appointments" class="nav-link">Appointments</a>
          <a href="#recovery" class="nav-link">Recovery</a>
          <div class="nav-divider"></div>
          <router-link to="/try-eka" class="btn btn-ghost">Try Eka</router-link>
          <router-link to="/login" class="btn btn-ghost">Log in</router-link>
          <router-link to="/signup/patient" class="btn btn-primary">Get Started</router-link>
        </div>

        <!-- Mobile Menu Toggle -->
        <button class="mobile-toggle" @click="mobileMenuOpen = !mobileMenuOpen">
          <v-icon :name="mobileMenuOpen ? 'md-close' : 'hi-menu'" scale="1.5" />
        </button>
      </div>
    </nav>

    <!-- Mobile Menu -->
    <transition name="fade-slide">
      <div v-if="mobileMenuOpen" class="mobile-menu">
        <a href="#eka" class="mobile-link" @click="mobileMenuOpen = false">Eka AI</a>
        <a href="#rxgpt" class="mobile-link" @click="mobileMenuOpen = false">RxGPT</a>
        <a href="#pharmacy" class="mobile-link" @click="mobileMenuOpen = false">Pharmacy</a>
        <a href="#appointments" class="mobile-link" @click="mobileMenuOpen = false">Appointments</a>
        <a href="#recovery" class="mobile-link" @click="mobileMenuOpen = false">Recovery</a>
        <div class="mobile-divider"></div>
        <router-link to="/try-eka" class="btn btn-outline full-width" @click="mobileMenuOpen = false">Try Eka</router-link>
        <router-link to="/login" class="btn btn-outline full-width mt-3" @click="mobileMenuOpen = false">Log in</router-link>
        <router-link to="/signup/patient" class="btn btn-primary full-width mt-3" @click="mobileMenuOpen = false">Get Started</router-link>
      </div>
    </transition>

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hp-container hero-container">
        <div class="hero-text">
          <div class="badge">
            <v-icon name="fa-heartbeat" scale="0.8" />
            <span>The Future of Connected Care</span>
          </div>

          <h1 class="hero-title">
            Health intelligence that feels <span class="text-gradient">human.</span>
          </h1>

          <p class="hero-subtitle">
            Experience Eka, your 24/7 AI health companion, and RxGPT, the ultimate clinical decision support system. Seamless care, powered by advanced artificial intelligence.
          </p>

          <div class="hero-actions">
            <a href="#eka" class="btn btn-dark btn-lg">
              Meet Eka
              <v-icon name="md-chevronright" class="icon-right" />
            </a>
            <a href="#rxgpt" class="btn btn-outline btn-lg ml-4">
              Explore RxGPT
            </a>
          </div>

          <div class="social-proof">
            <div class="avatars">
              <img v-for="i in 4" :key="i" :src="`https://i.pravatar.cc/100?img=${i+10}`" alt="User" class="avatar-img" />
            </div>
            <p>Trusted by 10,000+ patients <br/>and healthcare professionals.</p>
          </div>
        </div>

        <div class="hero-visual">
          <div class="glow-backdrop"></div>
          <img src="/images/homepage/capsule-3d.png" alt="3D Capsule Concept" class="floating-img" />

          <div class="floating-card card-right">
            <div class="icon-box icon-primary">
              <v-icon name="md-showchart" />
            </div>
            <div class="card-text">
              <span class="label">Heart Rate</span>
              <span class="value">72 bpm</span>
            </div>
          </div>

          <div class="floating-card card-left">
            <div class="icon-box icon-secondary">
              <v-icon name="gi-brain" />
            </div>
            <div class="card-text">
              <span class="label">AI Diagnosis</span>
              <span class="value">All clear. You're healthy!</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Interactive Eka Section -->
    <section class="section-padded bg-muted" id="eka">
      <div class="hp-container text-center">
        <h2 class="section-kicker text-primary">Meet Eka</h2>
        <h3 class="section-heading">Your personal 24/7 <br/>AI health companion.</h3>
        <p class="section-subheading mb-large">
          Experience the power of Eka right here. Try selecting "I want a health checkup" to see the dynamic body avatar artifact and simulated AI flow.
        </p>

        <div class="eka-chat-container">
           <div class="eka-chat-glow"></div>
           <EkaChat :embedded="true" />
        </div>
      </div>
    </section>

    <!-- Prescription Analysis Section -->
    <section class="section-padded" id="prescription">
      <div class="hp-container split-layout">

        <!-- UI Mockup -->
        <div class="visual-col rx-mockup-wrapper">
          <div class="rx-mockup-glow"></div>
          <div class="glass-panel rx-mockup">
            <div class="rx-header">
              <div class="flex-align">
                <div class="icon-circle bg-emerald-light"><v-icon name="md-documentscanner" class="text-emerald" scale="1.2"/></div>
                <div>
                  <h4 class="font-bold text-sm">Prescription Analysis</h4>
                  <p class="text-xs text-muted">OCR + AI Extraction</p>
                </div>
              </div>
              <span class="status-badge status-emerald">Verified</span>
            </div>

            <div class="rx-body">
              <div class="rx-group">
                <h5 class="rx-label">Extracted Medications</h5>

                <div class="rx-item">
                   <div class="flex-align">
                      <v-icon name="md-localpharmacy" class="text-primary mr-3" />
                      <div>
                        <p class="text-sm font-bold">Amoxicillin</p>
                        <p class="text-xs text-muted">10mg &bull; 30 tablets</p>
                      </div>
                   </div>
                   <p class="font-bold">$12.50</p>
                </div>

                <div class="rx-item">
                   <div class="flex-align">
                      <v-icon name="md-localpharmacy" class="text-secondary mr-3" />
                      <div>
                        <p class="text-sm font-bold">Ibuprofen</p>
                        <p class="text-xs text-muted">400mg &bull; 20 tablets</p>
                      </div>
                   </div>
                   <p class="font-bold">$8.00</p>
                </div>
              </div>

              <div class="rx-interaction">
                 <div class="flex-align mb-2">
                    <v-icon name="md-bolt" class="text-warning mr-2" scale="0.8"/>
                    <h5 class="text-warning font-bold text-xs uppercase tracking-wider">Interaction Check</h5>
                 </div>
                 <div class="interaction-alert">
                    <div class="flex-between mb-2">
                       <span class="font-bold text-warning text-sm">Moderate Alert</span>
                       <span class="status-badge status-warning text-xxs">Monitor</span>
                    </div>
                    <p class="text-xs text-warning-muted">Potential interaction between Amoxicillin and Ibuprofen. May decrease renal function. Take with food and monitor hydration.</p>
                 </div>
              </div>

              <div class="rx-checkout">
                 <div class="flex-between mb-4">
                    <span class="text-sm text-muted">Total (incl. delivery)</span>
                    <span class="font-display font-bold text-2xl">$24.50</span>
                 </div>
                 <button class="btn btn-primary full-width btn-lg">
                    <v-icon name="md-shoppingcart" class="mr-2" /> Order to Doorstep
                 </button>
              </div>

            </div>
          </div>
        </div>

        <!-- Text Content -->
        <div class="content-col">
           <div class="badge badge-emerald">
              <v-icon name="md-documentscanner" scale="0.8" />
              <span>Instant Prescription Fulfilment</span>
            </div>
            <h2 class="section-heading">
              Snap it. <br />Analyze it. <span class="text-emerald">Order it.</span>
            </h2>
            <p class="section-subheading mb-8">
              Upload a photo of your prescription and let Eka do the heavy lifting. Using advanced AWS Textract and Claude Vision, it extracts medications, checks live inventory across currencies, and analyzes for drug interactions before you buy.
            </p>

            <div class="feature-list">
               <div class="feature-row" v-for="(feature, i) in prescriptionFeatures" :key="i">
                  <div class="dot-indicator bg-emerald-light"><div class="dot bg-emerald"></div></div>
                  <div>
                     <h4 class="font-bold mb-1">{{ feature.title }}</h4>
                     <p class="text-sm text-muted">{{ feature.desc }}</p>
                  </div>
               </div>
            </div>
        </div>
      </div>
    </section>

    <!-- Deep Dive RxGPT Section -->
    <section class="section-padded bg-dark" id="rxgpt">
      <div class="bg-texture"></div>
      <div class="hp-container split-layout">
        <div class="content-col">
          <div class="badge badge-secondary">
            <v-icon name="md-verifieduser" scale="0.8" />
            <span>For Specialists</span>
          </div>
          <h2 class="section-heading text-white">
            RxGPT: 7-Layer <br/>Clinical Decision Support
          </h2>
          <p class="section-subheading text-white-muted mb-8">
            Empowering specialists with an advanced AI prescription safety analysis system. RxGPT cross-references prescriptions against FDA APIs, NICE guidelines, and patient history in real-time.
          </p>

          <ul class="check-list">
            <li v-for="item in rxgptList" :key="item">
              <div class="check-icon">
                <v-icon name="md-check" scale="0.8" />
              </div>
              {{ item }}
            </li>
          </ul>

          <button class="btn btn-secondary btn-lg">Request Specialist Access</button>
        </div>

        <div class="visual-col">
          <div class="glass-panel report-card dark-glass">
            <div class="report-header">
              <div class="window-controls">
                <span class="dot red"></span>
                <span class="dot yellow"></span>
                <span class="dot green"></span>
              </div>
              <span class="report-title">RxGPT Analysis Report</span>
            </div>
            <div class="report-body">
              <div class="data-row">
                <div class="flex-between">
                  <span class="font-bold text-white">Patient Profile</span>
                  <span class="status-badge status-primary">Verified</span>
                </div>
                <div class="text-muted small-mono">Loading allergies and comorbidities...</div>
              </div>
              <div class="data-row">
                <div class="flex-between">
                  <span class="font-bold text-white">Medication: Lisinopril 20mg</span>
                  <span class="status-badge status-warning">Interaction Alert</span>
                </div>
                <div class="text-white-muted small">Potential moderate interaction detected with currently prescribed NSAIDs. Recommendation: Monitor blood pressure closely.</div>
              </div>
              <div class="data-row flex-between">
                 <span class="font-bold text-sm text-white">FDA Cross-check</span>
                 <div class="progress-bar"><div class="progress-fill bg-secondary"></div></div>
              </div>
            </div>
          </div>
          <div class="glow-backdrop dark-glow"></div>
        </div>
      </div>
    </section>

    <!-- Pharmacy Module Section -->
    <section class="section-padded pharmacy-bg" id="pharmacy">
      <div class="hp-container split-layout">

        <!-- Content -->
        <div class="content-col order-md-1">
          <div class="badge badge-emerald">
            <v-icon name="md-shoppingcart" scale="0.8" />
            <span>Digital Pharmacy</span>
          </div>
          <h2 class="section-heading">
            Complete medication lifecycle. <br/><span class="text-emerald">Zero friction.</span>
          </h2>
          <p class="section-subheading mb-8">
            A full-stack digital pharmacy seamlessly embedded within Rapid Capsule. From AI-assisted drug discovery to automatic MAT protocol adherence and multi-currency checkout.
          </p>

          <div class="cards-list">
             <div class="icon-card" v-for="(card, i) in pharmacyCards" :key="i">
                <div class="card-icon"><v-icon :name="card.icon" :class="card.colorClass" scale="1.2" /></div>
                <div>
                   <h4 class="font-bold mb-1">{{ card.title }}</h4>
                   <p class="text-sm text-muted">{{ card.desc }}</p>
                </div>
             </div>
          </div>
        </div>

        <!-- Visual -->
        <div class="visual-col center-content order-md-2">
           <div class="pharmacy-glow"></div>
           <img src="/images/homepage/pharmacy-3d.png" alt="Pharmacy 3D" class="floating-img pharmacy-img" />

           <div class="glass-panel floating-status">
              <div class="icon-box-sm bg-emerald-light text-emerald"><v-icon name="md-localpharmacy" scale="1.2" /></div>
              <div>
                 <p class="text-xs font-bold">Buprenorphine</p>
                 <p class="text-xxs text-muted">MAT Protocol Active</p>
                 <div class="progress-bar sm mt-2"><div class="progress-fill bg-emerald w-85"></div></div>
              </div>
           </div>
        </div>

      </div>
    </section>

    <!-- Appointments Section -->
    <section class="section-padded appointments-bg border-y" id="appointments">
       <div class="hp-container split-layout">

          <!-- Visual -->
          <div class="visual-col center-content">
             <div class="appointment-glow"></div>
             <img src="/images/homepage/appointment-3d.png" alt="Appointments 3D" class="floating-img appointment-img" />

             <div class="glass-panel floating-appt shadow-lg">
                <div class="flex-between mb-4">
                   <span class="text-xs font-bold text-indigo uppercase">Next Session</span>
                   <span class="status-badge status-indigo text-xxs">Confirmed</span>
                </div>
                <div class="flex-align mb-4">
                   <img src="https://i.pravatar.cc/150?img=32" alt="Doctor" class="doc-avatar" />
                   <div>
                      <p class="text-sm font-bold">Dr. Sarah Jenkins</p>
                      <p class="text-xs text-muted">Addiction Psychiatry</p>
                   </div>
                </div>
                <div class="appt-time bg-muted-50">
                   <v-icon name="md-calendartoday" class="text-indigo" scale="0.8" /> Today, 2:00 PM (Telehealth)
                </div>
                <button class="btn btn-indigo full-width mt-4 btn-sm">Join Video Call</button>
             </div>
          </div>

          <!-- Content -->
          <div class="content-col">
             <div class="badge badge-indigo">
                <v-icon name="md-calendartoday" scale="0.8" />
                <span>Smart Scheduling</span>
             </div>
             <h2 class="section-heading">
                Care coordination, <br/><span class="text-indigo">perfectly synchronized.</span>
             </h2>
             <p class="section-subheading mb-8">
                A robust multi-provider appointment system supporting telehealth, in-person, and group sessions. Fully integrated with clinical notes and automated reminders.
             </p>

             <div class="grid-2-col">
                <div class="glass-panel sm-card" v-for="(feature, i) in appointmentFeatures" :key="i">
                   <div class="flex-align mb-2">
                      <div class="small-icon-box shadow-sm"><v-icon :name="feature.icon" :class="feature.colorClass" scale="1"/></div>
                      <h5 class="font-bold text-sm ml-3">{{ feature.title }}</h5>
                   </div>
                   <p class="text-xs text-muted leading-relaxed">{{ feature.desc }}</p>
                </div>
             </div>
          </div>

       </div>
    </section>

    <!-- Recovery Section -->
    <section class="section-padded recovery-bg" id="recovery">
       <div class="hp-container">
          <div class="text-center mb-16 max-w-3xl mx-auto">
             <div class="badge mx-auto mb-6">
                <v-icon name="ri-focus-3-line" scale="0.8" />
                <span>Clinical-Grade Management</span>
             </div>
             <h2 class="section-heading">
                Addiction Recovery, <br/><span class="text-gradient">Powered by AI.</span>
             </h2>
             <p class="section-subheading">
                A comprehensive system spanning the full continuum of care. From clinical screening and continuous risk scoring to Eka's 24/7 therapeutic support.
             </p>
          </div>

          <div class="recovery-grid">
             <!-- Visual -->
             <div class="recovery-visual">
                <div class="recovery-glow"></div>
                <img src="/images/homepage/halo-3d.png" alt="Recovery Loop" class="floating-img halo-img" />

                <div class="glass-panel metric-badge top-left">
                   <div class="icon-circle bg-emerald-light"><v-icon name="md-check" class="text-emerald" /></div>
                   <div>
                      <p class="text-xs text-muted font-bold">Sobriety Streak</p>
                      <p class="text-lg font-bold">142 Days</p>
                   </div>
                </div>

                <div class="glass-panel metric-badge bottom-right">
                   <div class="icon-circle bg-rose-light"><v-icon name="fa-heartbeat" class="text-rose" /></div>
                   <div>
                      <p class="text-xs text-muted font-bold">Predictive Risk</p>
                      <p class="text-lg font-bold text-rose">Low (12%)</p>
                   </div>
                </div>
             </div>

             <!-- Features -->
             <div class="recovery-features">
                <div class="glass-panel hover-card" v-for="(feature, i) in recoveryFeatures" :key="i">
                   <div class="small-icon-box mb-4 shadow-sm"><v-icon :name="feature.icon" :class="feature.colorClass" scale="1.2"/></div>
                   <h4 class="font-display font-bold text-lg mb-2">{{ feature.title }}</h4>
                   <p class="text-sm text-muted leading-relaxed">{{ feature.desc }}</p>
                </div>
             </div>
          </div>
       </div>
    </section>

    <!-- Testimonials -->
    <section class="section-padded bg-muted border-y">
       <div class="hp-container">
          <div class="text-center mb-16 max-w-3xl mx-auto">
            <h2 class="section-kicker text-secondary">Trusted Ecosystem</h2>
            <h3 class="section-heading">Built for everyone in <br/>the care continuum.</h3>
            <p class="text-lg text-muted">From patients seeking clarity to hospitals optimizing care delivery.</p>
          </div>

          <div class="testimonial-grid">
             <div class="glass-panel testimonial-card hover-card" v-for="(test, i) in testimonials" :key="i">
                <div class="flex-between mb-4">
                   <div class="persona-tag" :class="test.bgClass">
                      <v-icon :name="test.icon" :class="test.colorClass" scale="0.8" class="mr-1"/>
                      <span class="text-foreground text-xs font-bold">{{ test.persona }}</span>
                   </div>
                   <div class="stars text-warning">
                      <v-icon name="md-star" scale="0.8" v-for="n in 5" :key="n" />
                   </div>
                </div>
                <p class="quote">"{{ test.quote }}"</p>
                <div class="author-info border-t mt-4 pt-4">
                   <img :src="test.avatar" alt="Avatar" class="author-img" />
                   <div>
                      <p class="text-sm font-bold">{{ test.name }}</p>
                      <p class="text-xs text-muted">Verified User</p>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </section>

    <!-- FAQ Section -->
    <section class="section-padded" id="faq">
       <div class="hp-container max-w-4xl">
          <div class="text-center mb-16">
             <div class="badge mx-auto mb-6">
                <v-icon name="md-helpoutline" scale="0.8" />
                <span>Got Questions?</span>
             </div>
             <h2 class="section-heading">Frequently Asked Questions</h2>
             <p class="section-subheading">Everything you need to know about the Rapid Capsule platform.</p>
          </div>

          <div class="glass-panel p-8 rounded-3xl shadow-xl">
             <div class="accordion">
                <div class="accordion-item" v-for="(faq, i) in faqs" :key="i" :class="{ 'is-open': openFaq === i }">
                   <button class="accordion-trigger" @click="openFaq = openFaq === i ? null : i">
                      {{ faq.q }}
                      <v-icon :name="openFaq === i ? 'md-keyboardarrowup' : 'md-keyboardarrowdown'" />
                   </button>
                   <transition name="accordion-slide">
                      <div class="accordion-content" v-if="openFaq === i">
                         <p>{{ faq.a }}</p>
                      </div>
                   </transition>
                </div>
             </div>
          </div>
       </div>
    </section>

    <!-- CTA Section -->
    <section class="section-padded text-center">
       <div class="hp-container">
          <h2 class="font-display font-bold text-5xl mb-8">Ready to transform <br/>your health journey?</h2>
          <p class="text-xl text-muted max-w-2xl mx-auto mb-10">Join thousands of patients and providers already experiencing the future of connected care with Rapid Capsule.</p>
          <div class="flex-center gap-4">
             <router-link to="/signup/patient" class="btn btn-primary btn-lg">Create Patient Account</router-link>
             <router-link to="/login" class="btn btn-outline btn-lg">Join as Provider</router-link>
          </div>
       </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="hp-container">
        <div class="footer-grid">
          <div class="footer-brand">
            <img src="/images/homepage/logos/rc-logo-transparent.png" alt="Rapid Capsule Logo" class="brand-logo mb-4" />
            <p class="text-muted mb-4">
              The clinical-grade, AI-powered health platform built for everyone in the care continuum.
            </p>
          </div>
          <div class="footer-links">
            <h4 class="footer-title">Platform</h4>
            <ul>
              <li><a href="#">For Patients</a></li>
              <li><a href="#">For Specialists</a></li>
              <li><a href="#">Pricing</a></li>
            </ul>
          </div>
          <div class="footer-links">
            <h4 class="footer-title">AI Features</h4>
            <ul>
              <li><a href="#eka">Eka Health Assistant</a></li>
              <li><a href="#rxgpt">RxGPT Verification</a></li>
              <li><a href="#eka">Symptom Checker</a></li>
            </ul>
          </div>
          <div class="footer-links">
            <h4 class="footer-title">Company</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2026 Rapid Capsule. All rights reserved.</p>
          <p class="flex-align"><v-icon name="md-verifieduser" scale="0.8" class="mr-2"/> HIPAA Compliant</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import EkaChat from "./EkaChat.vue";
import { ref, onMounted, onUnmounted } from 'vue';

const scrolled = ref(false);
const mobileMenuOpen = ref(false);
const openFaq = ref(0);

const handleScroll = () => {
  scrolled.value = window.scrollY > 50;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

// --- Data Models ---

const prescriptionFeatures = [
  { title: "Smart OCR Extraction", desc: "Recognizes handwriting and typed text instantly." },
  { title: "Live Price Matching", desc: "Compares inventory and supports multi-currency pricing (NGN/USD/GBP/EUR)." },
  { title: "AI Safety Guardrails", desc: "Automatically cross-references your current medications to prevent adverse reactions." }
];

const rxgptList = [
  "Real-time Claude Sonnet 4 Analysis",
  "OpenFDA Drug Label Verification",
  "NICE Guidelines Compliance Check"
];

const pharmacyCards = [
  { icon: 'md-documentscanner', colorClass: 'text-emerald', title: "For Patients: Smart Discovery & OCR", desc: "Search by symptoms, upload prescriptions for instant OCR extraction, and track orders to your doorstep." },
  { icon: 'md-verifieduser', colorClass: 'text-primary', title: "For Specialists: Automated Compliance", desc: "Built-in MAT (Medication-Assisted Treatment) protocols, 30-day compliance tracking, and automated tapering schedules." },
  { icon: 'md-bolt', colorClass: 'text-secondary', title: "Safety Guardrails", desc: "Real-time interaction screening, controlled substance monitoring, and automated naloxone co-prescription prompts." }
];

const appointmentFeatures = [
  { icon: 'md-videocam', colorClass: 'text-indigo', title: "Secure Telehealth", desc: "Integrated video rooms with waiting areas." },
  { icon: 'md-accesstime', colorClass: 'text-primary', title: "Automated Reminders", desc: "SMS & push notifications reduce no-shows." },
  { icon: 'md-people', colorClass: 'text-secondary', title: "Group Sessions", desc: "Manage cohorts and peer support matching." },
  { icon: 'md-documentscanner', colorClass: 'text-emerald', title: "SOAP Notes", desc: "Specialists can log clinical notes directly." }
];

const recoveryFeatures = [
  { icon: 'md-showchart', colorClass: 'text-primary', title: "Clinical Screening", desc: "Integrated with 6 validated instruments interpreted instantly by Claude Sonnet 4." },
  { icon: 'gi-brain', colorClass: 'text-secondary', title: "Therapeutic AI Companion", desc: "Eka provides 24/7 CBT, DBT, and urge surfing techniques." },
  { icon: 'md-timeline', colorClass: 'text-emerald', title: "Predictive Risk Engine", desc: "A 5-category weighted scoring system analyzing signals to prevent relapse." },
  { icon: 'md-people', colorClass: 'text-indigo', title: "Peer & Group Support", desc: "Algorithmic matching for peer support and group therapy management." }
];

const testimonials = [
  { persona: "Patient", name: "Sarah Jenkins", avatar: "https://i.pravatar.cc/150?img=44", quote: "Eka helped me understand my symptoms at 2 AM. The symptom checker is incredibly intuitive and reassuring.", icon: "fa-heartbeat", colorClass: "text-rose", bgClass: "bg-rose-light" },
  { persona: "Specialist", name: "Dr. Marcus Chen", avatar: "https://i.pravatar.cc/150?img=11", quote: "RxGPT acts as a phenomenal second pair of eyes. The 7-layer verification gives me immense confidence.", icon: "md-verifieduser", colorClass: "text-primary", bgClass: "bg-primary-light" },
  { persona: "Pharmacist", name: "Elena Rodriguez", avatar: "https://i.pravatar.cc/150?img=5", quote: "The prescription OCR and automated inventory matching saves us hours every day.", icon: "md-localpharmacy", colorClass: "text-emerald", bgClass: "bg-emerald-light" },
  { persona: "Hospital Admin", name: "James Thorne", avatar: "https://i.pravatar.cc/150?img=33", quote: "Deploying Rapid Capsule across our wards reduced medication errors by 40% in the first quarter.", icon: "md-showchart", colorClass: "text-secondary", bgClass: "bg-secondary-light" }
];

const faqs = [
  { q: "What is Eka and how does it work?", a: "Eka is our AI health assistant that conducts intelligent symptom interviews, provides triage assessments, checks drug interactions, and connects you with the right specialist — all through natural conversation available 24/7." },
  { q: "How accurate is RxGPT's prescription verification?", a: "RxGPT verifies prescriptions against 6 clinical databases including PubMed, WHO Essential Medicines, and OpenFDA. Our 7-layer hallucination detection pipeline ensures clinical accuracy with full traceability." },
  { q: "How do video consultations work?", a: "Book a consultation with a verified specialist, connect via HD video in-app, and receive prescriptions, clinical notes, and follow-up plans — all in one seamless experience." },
  { q: "Is my health data secure?", a: "Absolutely. We use end-to-end encryption, HIPAA-aware infrastructure, and verify every specialist's license before activation." }
];
</script>

<style lang="scss">
/* NON-SCOPED overrides to beat App.vue global styles */

/* Reset color: $color-black from App.vue's * selector.
   Use plain specificity (no !important) so scoped component classes like
   .btn-dark, .text-primary, .text-muted etc. can still override. */
.rc-homepage,
.rc-homepage *,
.rc-homepage *::before,
.rc-homepage *::after {
  color: inherit;
  font-family: inherit;
  box-sizing: border-box;
}

/* Base styles for the homepage root */
.rc-homepage {
  color: #f8fafc;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16px;
}

.rc-homepage h1,
.rc-homepage h2,
.rc-homepage h3,
.rc-homepage h4,
.rc-homepage .font-display {
  font-family: 'Outfit', sans-serif;
}

/* --- Responsive Tailwind Container Implementation --- */
.rc-homepage .hp-container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}
@media (min-width: 640px) {
  .rc-homepage .hp-container { max-width: 640px; }
}
@media (min-width: 768px) {
  .rc-homepage .hp-container { max-width: 768px; }
}
@media (min-width: 1024px) {
  .rc-homepage .hp-container { max-width: 1024px; padding-left: 2rem; padding-right: 2rem; }
}
@media (min-width: 1280px) {
  .rc-homepage .hp-container { max-width: 1280px; }
}
@media (min-width: 1536px) {
  .rc-homepage .hp-container { max-width: 1536px; }
}

.rc-homepage .nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rc-homepage a {
  text-decoration: none;
}
</style>

<style scoped lang="scss">
/* Base Variables & Reset */
.rc-homepage {
  --background: #0f172a;
  --foreground: #f8fafc;
  --primary: #0ea5e9;
  --primary-glow: rgba(14, 165, 233, 0.2);
  --secondary: #f97316;
  --secondary-glow: rgba(249, 115, 22, 0.2);
  --emerald: #10b981;
  --emerald-glow: rgba(16, 185, 129, 0.2);
  --indigo: #818cf8;
  --indigo-glow: rgba(129, 140, 248, 0.2);
  --rose: #f43f5e;
  --warning: #f59e0b;

  --card-bg: rgba(15, 23, 42, 0.6);
  --border-color: rgba(255, 255, 255, 0.1);
  --muted: #64748b;
  --muted-50: rgba(255,255,255,0.05);

  background-color: var(--background);
  color: var(--foreground);
  font-family: 'Plus Jakarta Sans', sans-serif;
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;

}

/* Utilities */
h1, h2, h3, h4, .font-display { font-family: 'Outfit', sans-serif; letter-spacing: -0.02em; }
.text-gradient { background-clip: text; -webkit-text-fill-color: transparent; background-image: linear-gradient(to right, var(--primary), var(--secondary)); }
.text-primary { color: var(--primary); }
.text-secondary { color: var(--secondary); }
.text-emerald { color: var(--emerald); }
.text-indigo { color: var(--indigo); }
.text-rose { color: var(--rose); }
.text-warning { color: var(--warning); }
.text-muted { color: var(--muted); }
.text-warning-muted { color: rgba(245, 158, 11, 0.8); }
.text-white { color: #fff; }
.text-white-muted { color: rgba(255, 255, 255, 0.7); }
.text-foreground { color: var(--foreground); }
.text-center { text-align: center; }
.text-sm { font-size: 0.875rem; }
.text-xs { font-size: 0.75rem; }
.text-xxs { font-size: 0.625rem; }
.text-lg { font-size: 1.125rem; }
.text-xl { font-size: 1.25rem; }
.text-2xl { font-size: 1.5rem; }
.text-5xl { font-size: 48px; @media(min-width: 768px){ font-size: 60px; } }
.font-bold { font-weight: 700; }
.font-display { font-family: 'Outfit', sans-serif; }
.uppercase { text-transform: uppercase; }
.tracking-wider { letter-spacing: 0.05em; }
.leading-relaxed { line-height: 1.6; }

.bg-primary-light { background-color: rgba(14, 165, 233, 0.1); }
.bg-secondary-light { background-color: rgba(249, 115, 22, 0.1); }
.bg-emerald-light { background-color: rgba(16, 185, 129, 0.1); }
.bg-emerald { background-color: var(--emerald); }
.bg-indigo-light { background-color: rgba(129, 140, 248, 0.1); }
.bg-rose-light { background-color: rgba(244, 63, 94, 0.1); }
.bg-muted-50 { background-color: var(--muted-50); }
.border-y { border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); }
.border-t { border-top: 1px solid var(--border-color); }

.flex-align { display: flex; align-items: center; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.flex-center { display: flex; justify-content: center; align-items: center; }
.full-width { width: 100%; }
.gap-4 { gap: 1rem; }
.shadow-sm { box-shadow: 0 1px 2px 0 rgba(0,0,0,0.1); }
.shadow-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); }
.shadow-xl { box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
.rounded-3xl { border-radius: 1.5rem; }

/* Spacing */
.mb-1 { margin-bottom: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mb-8 { margin-bottom: 2rem; }
.mb-10 { margin-bottom: 2.5rem; }
.mb-16 { margin-bottom: 4rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 0.75rem; }
.mt-4 { margin-top: 1rem; }
.ml-3 { margin-left: 0.75rem; }
.ml-4 { margin-left: 1rem; }
.mr-1 { margin-right: 0.25rem; }
.mr-2 { margin-right: 0.5rem; }
.mr-3 { margin-right: 0.75rem; }
.pt-4 { padding-top: 1rem; }
.p-8 { padding: 2rem; }
.mx-auto { margin-left: auto; margin-right: auto; }
.max-w-2xl { max-width: 672px; }
.max-w-3xl { max-width: 768px; }
.max-w-4xl { max-width: 896px; }

/* Layout */
.section-padded { padding: 6rem 0; position: relative; }
.bg-muted { background-color: rgba(255, 255, 255, 0.02); }
.bg-dark { background-color: #020617; }
.bg-texture { position: absolute; inset: 0; opacity: 0.03; z-index: 0; pointer-events: none; }
.split-layout { display: grid; grid-template-columns: 1fr; gap: 4rem; align-items: center; @media (min-width: 1024px) { grid-template-columns: 1fr 1fr; } }
.grid-2-col { display: grid; grid-template-columns: 1fr; gap: 1rem; @media (min-width: 640px) { grid-template-columns: 1fr 1fr; } }

.order-md-1 { @media(min-width: 1024px) { order: 1; } }
.order-md-2 { @media(min-width: 1024px) { order: 2; } }

/* Shared Components */
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 0.5rem 1.25rem; border-radius: 9999px; font-weight: 500; font-size: 0.875rem;
  transition: all 0.3s ease; cursor: pointer; border: none; text-decoration: none;

  &.btn-sm { padding: 0.25rem 1rem; font-size: 0.75rem; height: 2.5rem; }
  &.btn-lg { padding: 1rem 2rem; font-size: 1rem; height: 3.5rem; }
  &.btn-primary { background-color: var(--primary); color: #fff !important; box-shadow: 0 10px 15px -3px var(--primary-glow); &:hover { filter: brightness(0.9); } }
  &.btn-secondary { background-color: var(--secondary); color: #fff !important; &:hover { filter: brightness(0.9); } }
  &.btn-indigo { background-color: var(--indigo); color: #fff !important; &:hover { filter: brightness(0.9); } }
  &.btn-dark { background-color: var(--foreground); color: var(--background) !important; &:hover { opacity: 0.9; } }
  &.btn-outline { background-color: transparent; border: 1px solid var(--border-color); color: var(--foreground); backdrop-filter: blur(8px); &:hover { background-color: rgba(255, 255, 255, 0.05); } }
  &.btn-ghost { background-color: transparent; color: var(--foreground); &:hover { color: var(--primary); background-color: rgba(14, 165, 233, 0.1); } }
}

.glass-panel { background-color: var(--card-bg); backdrop-filter: blur(16px); border: 1px solid var(--border-color); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
.dark-glass { background-color: rgba(2, 6, 23, 0.8); }
.hover-card { transition: transform 0.3s; &:hover { transform: translateY(-5px); background-color: rgba(30, 41, 59, 0.8); } }

.badge {
  display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem;
  border-radius: 9999px; font-size: 0.875rem; font-weight: 500; margin-bottom: 2rem;
  background-color: var(--card-bg); border: 1px solid var(--primary-glow); color: var(--primary);
  &.badge-secondary { border-color: var(--secondary-glow); color: var(--secondary); }
  &.badge-emerald { border-color: var(--emerald-glow); color: var(--emerald); }
  &.badge-indigo { border-color: var(--indigo-glow); color: var(--indigo); }
}

.status-badge {
  font-size: 0.65rem; font-weight: bold; padding: 0.25rem 0.5rem; border-radius: 0.25rem;
  &.status-primary { background-color: rgba(14, 165, 233, 0.1); color: var(--primary); }
  &.status-emerald { background-color: rgba(16, 185, 129, 0.1); color: var(--emerald); border: 1px solid var(--emerald-glow); }
  &.status-warning { background-color: rgba(245, 158, 11, 0.2); color: var(--warning); border: 1px solid rgba(245, 158, 11, 0.3); }
  &.status-indigo { background-color: rgba(129, 140, 248, 0.1); color: var(--indigo); border: 1px solid var(--indigo-glow); }
}

.icon-circle { width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 0.75rem; }
.icon-box-sm { width: 2.5rem; height: 2.5rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.small-icon-box { width: 2rem; height: 2rem; border-radius: 0.5rem; background-color: var(--background); display: flex; align-items: center; justify-content: center; }

/* Progress Bar */
.progress-bar { width: 100%; height: 0.5rem; background-color: rgba(255,255,255,0.1); border-radius: 999px; overflow: hidden; &.sm { height: 0.35rem; } }
.progress-fill { height: 100%; border-radius: 999px; width: 100%; &.w-85 { width: 85%; } &.bg-secondary { background-color: var(--secondary); } &.bg-emerald { background-color: var(--emerald); } }

/* Typography Globals */
.section-kicker { font-size: 0.875rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.75rem; }
.section-heading { font-size: 40px; margin-bottom: 1.5rem; line-height: 1.1; @media(min-width: 768px){ font-size: 48px;} }
.section-subheading { font-size: 1.125rem; color: var(--muted); font-weight: 300; line-height: 1.6;}
.mb-large { margin-bottom: 4rem; }

/* Animations */
@keyframes float { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-20px) rotate(2deg); } }
@keyframes blob-bounce { 0% { transform: scale(1) translate(0, 0); } 100% { transform: scale(1.1) translate(20px, 20px); } }

/* --- specific section styles --- */

/* Nav */
.nav-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 50; transition: all 0.5s ease; padding: 1.5rem 0; border-bottom: 1px solid transparent; &.is-scrolled { background-color: rgba(15, 23, 42, 0.8); backdrop-filter: blur(16px); border-bottom-color: var(--border-color); padding: 1rem 0; } }
.nav-container { display: flex; justify-content: space-between; align-items: center; }
.brand-logo { height: 2.5rem; width: auto; }
.desktop-nav { display: none; align-items: center; gap: 2rem; @media (min-width: 768px) { display: flex; } }
.nav-link { font-size: 0.875rem; font-weight: 500; color: rgba(255, 255, 255, 0.8); text-decoration: none; transition: color 0.3s; &:hover { color: var(--primary); } }
.nav-divider { height: 1rem; width: 1px; background-color: var(--border-color); }
.mobile-toggle { display: block; background: none; border: none; color: var(--foreground); cursor: pointer; @media (min-width: 768px) { display: none; } }
.mobile-menu { position: fixed; inset: 0; z-index: 40; background-color: rgba(15, 23, 42, 0.95); backdrop-filter: blur(16px); padding: 6rem 1.5rem 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
.mobile-link { font-size: 1.5rem; font-family: 'Outfit', sans-serif; font-weight: 600; color: var(--foreground); text-decoration: none; }
.mobile-divider { height: 1px; background-color: var(--border-color); }
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-20px); }

/* Hero */
.hero-section { padding-top: 10rem; padding-bottom: 5rem; position: relative; overflow: hidden; }
.hero-container { display: grid; grid-template-columns: 1fr; gap: 3rem; align-items: center; @media (min-width: 1024px) { grid-template-columns: 1fr 1fr; gap: 4rem; } }
.hero-title { font-size: 48px; line-height: 1.1; margin-bottom: 1.5rem; @media (min-width: 768px) { font-size: 72px; } }
.hero-subtitle { font-size: 1.125rem; font-weight: 300; color: rgba(255, 255, 255, 0.7); margin-bottom: 2rem; line-height: 1.6; max-width: 600px; }
.hero-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 1rem; }
.social-proof { margin-top: 3rem; display: flex; align-items: center; gap: 1.5rem; font-size: 0.875rem; color: rgba(255, 255, 255, 0.6); .avatars { display: flex; margin-left: 10px; .avatar-img { width: 2.5rem; height: 2.5rem; border-radius: 50%; border: 2px solid var(--background); margin-left: -10px; } } }
.hero-visual { position: relative; display: flex; justify-content: center; align-items: center; height: 400px; @media (min-width: 1024px) { height: 600px; } }
.floating-img { width: 100%; max-width: 400px; animation: float 6s ease-in-out infinite; }
.glow-backdrop { position: absolute; inset: 0; background: linear-gradient(to top right, var(--primary-glow), var(--secondary-glow)); filter: blur(80px); border-radius: 50%; z-index: -1; &.dark-glow { background: linear-gradient(to top right, rgba(249, 115, 22, 0.15), rgba(14, 165, 233, 0.15)); } }
.floating-card { position: absolute; background: var(--card-bg); backdrop-filter: blur(12px); border: 1px solid var(--border-color); padding: 1rem; border-radius: 1rem; display: flex; align-items: center; gap: 1rem; animation: float 8s ease-in-out infinite reverse; &.card-right { right: -2rem; top: 25%; } &.card-left { left: -3rem; bottom: 25%; animation-delay: 1s; } }
.icon-box { width: 2.5rem; height: 2.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; &.icon-primary { background: var(--primary-glow); color: var(--primary); } &.icon-secondary { background: var(--secondary-glow); color: var(--secondary); } }
.card-text { display: flex; flex-direction: column; .label { font-size: 0.75rem; color: var(--muted); } .value { font-size: 1rem; font-weight: bold; } }
.icon-right { margin-left: 0.25rem; }

/* Eka Chat */
.eka-chat-container { position: relative; max-width: 1200px; margin: 0 auto; height: 700px; border-radius: 2rem; }
.eka-chat-glow { position: absolute; inset: 0; background: linear-gradient(to top right, var(--primary-glow), var(--secondary-glow)); filter: blur(100px); border-radius: 50%; z-index: 0; opacity: 0.5;}

/* Prescription */
.rx-mockup-wrapper { position: relative; }
.rx-mockup-glow { position: absolute; inset: 0; background: linear-gradient(to bottom right, var(--emerald-glow), var(--primary-glow)); filter: blur(100px); border-radius: 3rem; z-index: 0; }
.rx-mockup { position: relative; z-index: 10; border-radius: 1.5rem; overflow: hidden; }
.rx-header { padding: 1rem 1.5rem; background-color: rgba(0,0,0,0.2); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
.rx-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
.rx-label { font-size: 0.75rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin-bottom: 0.75rem; }
.rx-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background-color: var(--background); border: 1px solid var(--border-color); border-radius: 0.75rem; margin-bottom: 0.5rem; }
.interaction-alert { background-color: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); padding: 1rem; border-radius: 0.75rem; }
.rx-checkout { border-top: 1px solid var(--border-color); padding-top: 1rem; }
.feature-list { display: flex; flex-direction: column; gap: 1.5rem; }
.feature-row { display: flex; gap: 1rem; }
.dot-indicator { width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 0.25rem; .dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; } }

/* RxGPT */
.check-list { list-style: none; padding: 0; margin-bottom: 2.5rem; li { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; color: rgba(255, 255, 255, 0.9); font-weight: 500; } }
.check-icon { width: 1.5rem; height: 1.5rem; border-radius: 50%; background-color: rgba(249, 115, 22, 0.2); color: var(--secondary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.report-card { border-radius: 1.5rem; overflow: hidden; position: relative; z-index: 10; }
.report-header { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; .window-controls { display: flex; gap: 0.5rem; .dot { width: 0.75rem; height: 0.75rem; border-radius: 50%; } .red { background-color: #ef4444; } .yellow { background-color: #f59e0b; } .green { background-color: #10b981; } } .report-title { font-size: 0.75rem; color: var(--muted); font-family: monospace; } }
.report-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.data-row { background-color: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: 0.75rem; padding: 1rem; }
.small-mono { font-size: 0.75rem; font-family: monospace; }
.small { font-size: 0.75rem; line-height: 1.5; }

/* Pharmacy & Appointments */
.pharmacy-bg { position: relative; &::before { content: ''; position: absolute; inset: 0; background-color: var(--emerald-glow); opacity: 0.1; z-index: 0; pointer-events: none; } }
.appointments-bg { background-color: rgba(255,255,255,0.02); }
.cards-list { display: flex; flex-direction: column; gap: 1rem; }
.icon-card { display: flex; gap: 1rem; padding: 1rem; background-color: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 1rem; transition: background 0.3s; &:hover { background-color: rgba(255,255,255,0.06); } }
.card-icon { width: 2.5rem; height: 2.5rem; background: var(--background); border: 1px solid var(--border-color); border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;}
.center-content { position: relative; display: flex; justify-content: center; align-items: center; }
.pharmacy-glow { position: absolute; inset: 0; background: var(--emerald-glow); filter: blur(100px); border-radius: 50%; z-index: 0; }
.appointment-glow { position: absolute; inset: 0; background: var(--indigo-glow); filter: blur(100px); border-radius: 50%; z-index: 0; }
.pharmacy-img, .appointment-img { max-width: 350px; position: relative; z-index: 10; animation: float 7s ease-in-out infinite; }
.floating-status { position: absolute; bottom: 10%; left: 0; z-index: 20; padding: 1rem; border-radius: 1rem; display: flex; align-items: center; gap: 1rem; width: 240px; border-color: var(--emerald-glow); }
.floating-appt { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 20; padding: 1.25rem; border-radius: 1.5rem; width: 280px; border-color: var(--indigo-glow); }
.doc-avatar { width: 3rem; height: 3rem; border-radius: 50%; border: 2px solid var(--indigo); margin-right: 0.75rem; }
.appt-time { font-size: 0.75rem; padding: 0.5rem; border-radius: 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
.sm-card { padding: 1rem; border-radius: 1rem; }

/* Recovery */
.recovery-bg { position: relative; &::before { content: ''; position: absolute; inset: 0; background: linear-gradient(to bottom, transparent, var(--primary-glow), transparent); opacity: 0.2; z-index: 0; pointer-events: none; } }
.recovery-grid { display: grid; grid-template-columns: 1fr; gap: 4rem; align-items: center; @media (min-width: 1024px) { grid-template-columns: 5fr 7fr; } }
.recovery-visual { position: relative; display: flex; justify-content: center; align-items: center; }
.halo-img { max-width: 300px; position: relative; z-index: 10; animation: float 8s ease-in-out infinite; }
.recovery-glow { position: absolute; inset: 0; background: var(--primary-glow); filter: blur(80px); border-radius: 50%; z-index: 0; }
.metric-badge { position: absolute; padding: 1rem; border-radius: 1rem; display: flex; align-items: center; gap: 1rem; z-index: 20; &.top-left { top: 20%; left: -5%; } &.bottom-right { bottom: 20%; right: -5%; } }
.recovery-features { display: grid; grid-template-columns: 1fr; gap: 1.5rem; @media (min-width: 640px) { grid-template-columns: 1fr 1fr; } .hover-card { padding: 1.5rem; border-radius: 1.25rem; } }

/* Testimonials */
.testimonial-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; @media (min-width: 768px) { grid-template-columns: 1fr 1fr; } @media (min-width: 1024px) { grid-template-columns: repeat(4, 1fr); } }
.testimonial-card { padding: 1.5rem; border-radius: 1.5rem; display: flex; flex-direction: column; height: 100%; }
.persona-tag { display: inline-flex; align-items: center; padding: 0.25rem 0.75rem; border-radius: 999px; }
.stars { display: flex; gap: 0.125rem; }
.quote { font-style: italic; font-size: 0.875rem; line-height: 1.6; color: rgba(255,255,255,0.8); flex-grow: 1; }
.author-info { display: flex; align-items: center; gap: 0.75rem; border-color: var(--border-color); }
.author-img { width: 2.5rem; height: 2.5rem; border-radius: 50%; border: 2px solid var(--background); }

/* FAQ Accordion */
.accordion { display: flex; flex-direction: column; gap: 1rem; }
.accordion-item { border: 1px solid rgba(255,255,255,0.05); background-color: rgba(255,255,255,0.02); border-radius: 0.75rem; overflow: hidden; transition: all 0.3s; &.is-open { background-color: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); } }
.accordion-trigger { width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; background: none; border: none; color: var(--foreground); font-family: 'Outfit', sans-serif; font-weight: 600; font-size: 1.125rem; text-align: left; cursor: pointer; transition: color 0.3s; &:hover { color: var(--primary); } }
.accordion-content { padding: 0 1.5rem 1.5rem; color: rgba(255,255,255,0.7); line-height: 1.6; }
.accordion-slide-enter-active, .accordion-slide-leave-active { transition: all 0.3s ease; max-height: 200px; opacity: 1; }
.accordion-slide-enter-from, .accordion-slide-leave-to { max-height: 0; opacity: 0; padding-bottom: 0; }

/* Blob Backgrounds */
.blob-bg { position: absolute; border-radius: 50%; filter: blur(80px); z-index: -1; opacity: 0.4; animation: blob-bounce 10s infinite alternate; }
.blob-1 { background-color: var(--primary-glow); width: 600px; height: 600px; top: -100px; left: -100px; }
.blob-2 { background-color: var(--secondary-glow); width: 500px; height: 500px; bottom: 10%; right: -100px; animation-delay: 2s; }
.blob-3 { background-color: rgba(14, 165, 233, 0.1); width: 400px; height: 400px; top: 40%; left: 20%; animation-delay: 4s; }

/* Footer */
.footer { border-top: 1px solid var(--border-color); padding: 4rem 0 2rem; background-color: var(--background); }
.footer-grid { display: grid; grid-template-columns: 1fr; gap: 3rem; margin-bottom: 4rem; @media (min-width: 768px) { grid-template-columns: 2fr 1fr 1fr 1fr; } }
.footer-title { font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1.5rem; }
.footer-links ul { list-style: none; padding: 0; }
.footer-links li { margin-bottom: 1rem; }
.footer-links a { color: var(--muted); text-decoration: none; font-size: 0.875rem; transition: color 0.3s; }
.footer-links a:hover { color: var(--primary); }
.footer-bottom { border-top: 1px solid var(--border-color); padding-top: 2rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; color: var(--muted); }
</style>