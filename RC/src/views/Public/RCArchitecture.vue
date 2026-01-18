<template>
  <div class="architecture-page">
    <!-- Animated background -->
    <div class="background-effects">
      <div class="glow glow-1"></div>
      <div class="glow glow-2"></div>
      <div class="glow glow-3"></div>
    </div>

    <!-- Header -->
    <header class="page-header">
      <div class="header-content">
        <div class="brand">
          <div class="logo-icon">
            <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" class="logo-img" />
          </div>
          <div class="brand-text">
            <h1>Rapid Capsule</h1>
            <p>AI-Powered Telemedicine Platform</p>
          </div>
        </div>
        <div class="badges">
          <span class="badge badge-green">v2.0.0</span>
          <span class="badge badge-cyan">January 2026</span>
        </div>
      </div>
    </header>

    <div class="main-container">
      <div class="layout">
        <!-- Sidebar Navigation -->
        <nav class="sidebar">
          <div class="nav-items">
            <button
              v-for="section in sections"
              :key="section.id"
              @click="activeSection = section.id"
              :class="['nav-btn', { active: activeSection === section.id }]"
            >
              <span class="nav-icon" v-html="section.icon"></span>
              <span class="nav-label">{{ section.label }}</span>
            </button>
          </div>
        </nav>

        <!-- Main Content -->
        <main class="content-area">
          <div class="content-card">
            <!-- Overview Section -->
            <div v-if="activeSection === 'overview'" class="section-content">
              <div class="section-header">
                <h2 class="gradient-text-cyan">System Architecture Overview</h2>
                <p class="section-desc">AI-powered telemedicine platform serving patients, specialists, and healthcare administrators</p>
              </div>

              <!-- User Layer -->
              <div class="user-grid">
                <div v-for="(user, i) in users" :key="i" class="user-card" :class="'border-' + user.color">
                  <div class="user-icon" :class="'bg-' + user.color">
                    <span v-html="user.iconSvg"></span>
                  </div>
                  <h3>{{ user.title }}</h3>
                  <p>{{ user.desc }}</p>
                </div>
              </div>

              <!-- Connection arrows -->
              <div class="arrows-row">
                <div v-for="i in 4" :key="i" class="arrow-container">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" :class="{ bounce: animationPhase === i-1 }">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <polyline points="19 12 12 19 5 12"></polyline>
                  </svg>
                </div>
              </div>

              <!-- Frontend Layer -->
              <div class="frontend-grid">
                <div class="frontend-card border-blue">
                  <div class="frontend-header">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                      <line x1="12" y1="18" x2="12.01" y2="18"></line>
                    </svg>
                    <div>
                      <h3>Patient App</h3>
                      <p>Vue.js 3 SPA - Port 3000</p>
                    </div>
                  </div>
                  <div class="tags">
                    <span class="tag tag-blue">PWA</span>
                    <span class="tag tag-blue">Mobile-First</span>
                    <span class="tag tag-blue">Offline</span>
                  </div>
                </div>
                <div class="frontend-card border-purple">
                  <div class="frontend-header">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                    <div>
                      <h3>Admin Portal</h3>
                      <p>Vue.js 3 + Vuetify - Port 8080</p>
                    </div>
                  </div>
                  <div class="tags">
                    <span class="tag tag-purple">Dashboard</span>
                    <span class="tag tag-purple">Analytics</span>
                    <span class="tag tag-purple">Realtime</span>
                  </div>
                </div>
              </div>

              <!-- API Gateway -->
              <div class="arrows-row single">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" :class="{ bounce: animationPhase === 1 }">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
              </div>
              <div class="gateway-card">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                <div>
                  <h3>NGINX API Gateway</h3>
                  <p>SSL Termination - Load Balancing - Route Management</p>
                </div>
              </div>

              <!-- Backend Services -->
              <div class="arrows-row single">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" :class="{ bounce: animationPhase === 2 }">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
              </div>
              <div class="backend-grid">
                <div class="backend-card border-green">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                    <rect x="9" y="9" width="6" height="6"></rect>
                  </svg>
                  <h3>Patient Backend</h3>
                  <p>NestJS - Port 5020</p>
                </div>
                <div class="backend-card border-orange">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                    <rect x="9" y="9" width="6" height="6"></rect>
                  </svg>
                  <h3>Admin Backend</h3>
                  <p>NestJS - Port 5021</p>
                </div>
                <div class="backend-card border-pink">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                  <h3>WebSocket</h3>
                  <p>Socket.io - Realtime</p>
                </div>
              </div>

              <!-- Data Layer -->
              <div class="arrows-row single">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" :class="{ bounce: animationPhase === 3 }">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
              </div>
              <div class="data-grid">
                <div class="data-card border-yellow">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                    <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                  </svg>
                  <h3>MongoDB Atlas</h3>
                  <p>Shared Database</p>
                </div>
                <div class="data-card border-teal">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
                  </svg>
                  <h3>AWS S3</h3>
                  <p>File Storage</p>
                </div>
              </div>
            </div>

            <!-- Architecture Section -->
            <div v-else-if="activeSection === 'architecture'" class="section-content">
              <div class="section-header">
                <h2 class="gradient-text-green">Microservices Architecture</h2>
                <p class="section-desc">Scalable, modular backend with dedicated service layers</p>
              </div>

              <div class="services-grid">
                <!-- Patient API -->
                <div class="service-card border-blue">
                  <h3 class="service-title text-blue">
                    <span class="pulse-dot bg-blue"></span>
                    Patient API Service
                  </h3>
                  <div class="modules-grid">
                    <div v-for="mod in patientModules" :key="mod.name" class="module-item">
                      <span v-html="mod.icon"></span>
                      <span>{{ mod.name }}</span>
                    </div>
                  </div>
                </div>

                <!-- Admin API -->
                <div class="service-card border-purple">
                  <h3 class="service-title text-purple">
                    <span class="pulse-dot bg-purple"></span>
                    Admin API Service
                  </h3>
                  <div class="modules-grid">
                    <div v-for="mod in adminModules" :key="mod.name" class="module-item">
                      <span v-html="mod.icon"></span>
                      <span>{{ mod.name }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Data Stores -->
              <div class="stores-section">
                <h3>Data Stores</h3>
                <div class="stores-grid">
                  <div class="store-card border-yellow">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                      <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                    </svg>
                    <h4>MongoDB Atlas</h4>
                    <p>Primary Document Store</p>
                  </div>
                  <div class="store-card border-red">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    <h4>Redis Cache</h4>
                    <p>Session & Cache Layer</p>
                  </div>
                  <div class="store-card border-orange">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>
                    </svg>
                    <h4>AWS S3</h4>
                    <p>File & Media Storage</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- AI Section -->
            <div v-else-if="activeSection === 'ai'" class="section-content">
              <div class="section-header">
                <h2 class="gradient-text-purple">AI/ML Services Integration</h2>
                <p class="section-desc">Cutting-edge AI powering intelligent healthcare decisions</p>
              </div>

              <div class="ai-grid">
                <!-- Infermedica -->
                <div class="ai-card border-violet">
                  <div class="ai-icon bg-violet">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                    </svg>
                  </div>
                  <h3>Infermedica AI</h3>
                  <p class="ai-desc">Symptom Analysis & Diagnosis Engine</p>
                  <div class="features">
                    <div class="feature"><span class="check text-violet">✓</span> NLP Symptom Parsing</div>
                    <div class="feature"><span class="check text-violet">✓</span> Interview Engine</div>
                    <div class="feature"><span class="check text-violet">✓</span> Triage Assessment</div>
                    <div class="feature"><span class="check text-violet">✓</span> Condition Matching</div>
                  </div>
                </div>

                <!-- Claude AI -->
                <div class="ai-card border-pink">
                  <div class="ai-icon bg-pink">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                      <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                      <rect x="9" y="9" width="6" height="6"></rect>
                    </svg>
                  </div>
                  <h3>Claude AI</h3>
                  <p class="ai-desc">LLM for Health Intelligence</p>
                  <div class="features">
                    <div class="feature"><span class="check text-pink">✓</span> Health Summaries</div>
                    <div class="feature"><span class="check text-pink">✓</span> Document Analysis</div>
                    <div class="feature"><span class="check text-pink">✓</span> Vision OCR</div>
                    <div class="feature"><span class="check text-pink">✓</span> Patient Reports</div>
                  </div>
                </div>

                <!-- AWS Textract -->
                <div class="ai-card border-amber">
                  <div class="ai-icon bg-amber">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                  </div>
                  <h3>AWS Textract</h3>
                  <p class="ai-desc">5-Level OCR Pipeline</p>
                  <div class="features">
                    <div class="feature"><span class="check text-amber">✓</span> Line Extraction</div>
                    <div class="feature"><span class="check text-amber">✓</span> Block Analysis</div>
                    <div class="feature"><span class="check text-amber">✓</span> Form Detection</div>
                    <div class="feature"><span class="check text-amber">✓</span> Table Extraction</div>
                    <div class="feature"><span class="check text-amber">✓</span> Key-Value Pairs</div>
                  </div>
                </div>
              </div>

              <!-- Health Score System -->
              <div class="health-score-section">
                <h3 class="text-cyan">6-Domain Health Score System</h3>
                <div class="domains-grid">
                  <div v-for="domain in domains" :key="domain.name" class="domain-item">
                    <div class="domain-circle" :class="'border-' + domain.color">
                      <span :class="'text-' + domain.color">{{ domain.weight }}%</span>
                    </div>
                    <p>{{ domain.name }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Security Section -->
            <div v-else-if="activeSection === 'security'" class="section-content">
              <div class="section-header">
                <h2 class="gradient-text-red">Security Architecture</h2>
                <p class="section-desc">Multi-layered defense protecting sensitive health data</p>
              </div>

              <div class="security-grid">
                <div v-for="layer in securityLayers" :key="layer.title" class="security-card" :class="'border-' + layer.color">
                  <h3 :class="'text-' + layer.color">{{ layer.title }}</h3>
                  <div class="security-items">
                    <div v-for="item in layer.items" :key="item" class="security-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                      <span>{{ item }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- RBAC -->
              <div class="rbac-section">
                <h3>Role-Based Access Control (RBAC)</h3>
                <div class="rbac-table-container">
                  <table class="rbac-table">
                    <thead>
                      <tr>
                        <th>Permission</th>
                        <th class="text-blue">Patient</th>
                        <th class="text-green">Specialist</th>
                        <th class="text-orange">Lifeguard</th>
                        <th class="text-purple">Admin</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in rbacRows" :key="row.perm">
                        <td>{{ row.perm }}</td>
                        <td><span :class="row.p ? 'check-mark' : 'empty-mark'">{{ row.p ? '✓' : '○' }}</span></td>
                        <td><span :class="row.s ? 'check-mark' : 'empty-mark'">{{ row.s ? '✓' : '○' }}</span></td>
                        <td><span :class="row.l ? 'check-mark' : 'empty-mark'">{{ row.l ? '✓' : '○' }}</span></td>
                        <td><span :class="row.a ? 'check-mark' : 'empty-mark'">{{ row.a ? '✓' : '○' }}</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Flows Section -->
            <div v-else-if="activeSection === 'flows'" class="section-content">
              <div class="section-header">
                <h2 class="gradient-text-teal">Key System Flows</h2>
                <p class="section-desc">Critical user journeys and data pipelines</p>
              </div>

              <div class="flows-grid">
                <!-- Health Checkup Flow -->
                <div class="flow-card border-teal">
                  <h3 class="text-teal">AI Health Checkup Flow</h3>
                  <div class="flow-steps">
                    <div v-for="(item, i) in healthCheckupSteps" :key="i" class="flow-step">
                      <div class="step-number" :class="item.status">{{ item.step }}</div>
                      <span :class="{ muted: item.status === 'pending' }">{{ item.label }}</span>
                    </div>
                  </div>
                </div>

                <!-- Prescription Flow -->
                <div class="flow-card border-amber">
                  <h3 class="text-amber">Prescription Processing</h3>
                  <div class="flow-steps">
                    <div v-for="(item, i) in prescriptionSteps" :key="i" class="flow-step">
                      <div class="step-number amber">{{ item.step }}</div>
                      <span>{{ item.label }}</span>
                    </div>
                  </div>
                </div>

                <!-- WhatsApp Flow -->
                <div class="flow-card border-green">
                  <h3 class="text-green">WhatsApp Integration</h3>
                  <div class="state-tags">
                    <span v-for="state in whatsappStates" :key="state" class="state-tag">{{ state }}</span>
                  </div>
                  <p class="flow-note">State machine architecture for conversational commerce</p>
                </div>

                <!-- Appointment Flow -->
                <div class="flow-card border-blue">
                  <h3 class="text-blue">Multi-Channel Appointments</h3>
                  <div class="channels-grid">
                    <div v-for="channel in appointmentChannels" :key="channel.label" class="channel-item">
                      <span v-html="channel.icon"></span>
                      <p class="channel-label">{{ channel.label }}</p>
                      <p class="channel-desc">{{ channel.desc }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tech Section -->
            <div v-else-if="activeSection === 'tech'" class="section-content">
              <div class="section-header">
                <h2 class="gradient-text-green">Technology Stack</h2>
                <p class="section-desc">Modern, scalable technologies powering the platform</p>
              </div>

              <div class="tech-grid">
                <div v-for="stack in techStacks" :key="stack.title" class="tech-card" :class="'border-' + stack.color">
                  <h3 :class="'text-' + stack.color">{{ stack.title }}</h3>
                  <div class="tech-items">
                    <div v-for="item in stack.items" :key="item" class="tech-item">
                      <span class="tech-dot" :class="'bg-' + stack.color"></span>
                      <span>{{ item }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Innovation Highlights -->
              <div class="innovation-section">
                <h3 class="gradient-text-cyan">Innovation Highlights for Global Talent Visa</h3>
                <div class="innovations-grid">
                  <div v-for="innovation in innovations" :key="innovation.title" class="innovation-card">
                    <h4>{{ innovation.title }}</h4>
                    <p>{{ innovation.desc }}</p>
                    <div class="impact">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                      </svg>
                      <span>{{ innovation.impact }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Read Me Section -->
            <div v-else-if="activeSection === 'readme'" class="section-content readme-section">
              <div class="section-header">
                <h2 class="gradient-text-cyan">Architecture Documentation</h2>
                <p class="section-desc">Comprehensive technical documentation for the Rapid Capsule platform</p>
              </div>

              <!-- Platform Statistics -->
              <div class="stats-card">
                <h3>Platform Statistics</h3>
                <div class="stats-grid">
                  <div class="stat-item"><span class="stat-value">4</span><span class="stat-label">Total Services</span></div>
                  <div class="stat-item"><span class="stat-value">46+</span><span class="stat-label">Backend Modules</span></div>
                  <div class="stat-item"><span class="stat-value">100+</span><span class="stat-label">API Endpoints</span></div>
                  <div class="stat-item"><span class="stat-value">273</span><span class="stat-label">Frontend Components</span></div>
                  <div class="stat-item"><span class="stat-value">20+</span><span class="stat-label">Database Collections</span></div>
                  <div class="stat-item"><span class="stat-value">10+</span><span class="stat-label">External Integrations</span></div>
                </div>
              </div>

              <!-- Service Ports -->
              <div class="ports-card">
                <h3>Service Configuration</h3>
                <div class="ports-table">
                  <div class="port-row header">
                    <span>Service</span><span>Port</span><span>Domain</span>
                  </div>
                  <div class="port-row"><span>Patient Frontend</span><span>3000</span><span>rapidcapsule.com</span></div>
                  <div class="port-row"><span>Patient Backend</span><span>5020</span><span>api.rapidcapsule.com</span></div>
                  <div class="port-row"><span>Admin Frontend</span><span>8080</span><span>admin.rapidcapsule.com</span></div>
                  <div class="port-row"><span>Admin Backend</span><span>5021</span><span>Internal API</span></div>
                </div>
              </div>

              <!-- Key Innovations -->
              <div class="readme-innovations">
                <h3>Key Technical Innovations</h3>
                <div class="innovation-list">
                  <div class="innovation-item">
                    <h4>AI-Powered Diagnostics</h4>
                    <p>Infermedica API integration for intelligent symptom analysis, triage assessment, and condition matching using NLP-based parsing.</p>
                  </div>
                  <div class="innovation-item">
                    <h4>LLM Health Intelligence</h4>
                    <p>Claude AI integration for generating patient-friendly health summaries, document analysis, and comprehensive medical reports.</p>
                  </div>
                  <div class="innovation-item">
                    <h4>6-Domain Health Score System</h4>
                    <p>Proprietary digital health twin with weighted metrics across Cardiovascular (20%), Metabolic (20%), Mental (15%), Lifestyle (15%), Physical (15%), and Preventive (15%) domains.</p>
                  </div>
                  <div class="innovation-item">
                    <h4>5-Level OCR Pipeline</h4>
                    <p>AWS Textract integration with Line Extraction, Block Analysis, Form Detection, Table Extraction, and Key-Value Pairs for prescription digitization.</p>
                  </div>
                  <div class="innovation-item">
                    <h4>WhatsApp Conversational Commerce</h4>
                    <p>State machine architecture for pharmacy ordering via WhatsApp with 8 states: IDLE, VERIFICATION, MENU, PRESCRIPTION_UPLOAD, OCR_PROCESSING, ORDER_CREATION, PAYMENT_PENDING, PHARMACIST_CHAT.</p>
                  </div>
                  <div class="innovation-item">
                    <h4>Multi-Channel Telehealth</h4>
                    <p>Six consultation types supported: Video (Zoom), Voice (Twilio), Chat (In-App), In-Person (Clinic), Home Visit, and Emergency consultations.</p>
                  </div>
                </div>
              </div>

              <!-- Architecture Summary -->
              <div class="arch-summary">
                <h3>Architecture Highlights</h3>
                <div class="arch-points">
                  <div class="arch-point"><span class="bullet">•</span>Microservices architecture with NestJS backends</div>
                  <div class="arch-point"><span class="bullet">•</span>Vue.js 3 frontends with Composition API</div>
                  <div class="arch-point"><span class="bullet">•</span>MongoDB with Mongoose ODM for data persistence</div>
                  <div class="arch-point"><span class="bullet">•</span>Redis caching for session and performance optimization</div>
                  <div class="arch-point"><span class="bullet">•</span>AWS S3 for file and media storage</div>
                  <div class="arch-point"><span class="bullet">•</span>Socket.io for real-time WebSocket communications</div>
                  <div class="arch-point"><span class="bullet">•</span>NGINX API Gateway with SSL termination</div>
                  <div class="arch-point"><span class="bullet">•</span>Cloudflare for DDoS protection and CDN</div>
                  <div class="arch-point"><span class="bullet">•</span>JWT authentication with role-based access control</div>
                  <div class="arch-point"><span class="bullet">•</span>AES-256 encryption for sensitive data</div>
                </div>
              </div>
            </div>

            <!-- GitHub Section -->
            <div v-else-if="activeSection === 'github'" class="section-content github-section">
              <div class="section-header">
                <h2 class="gradient-text-purple">Source Code Repository</h2>
                <p class="section-desc">Explore the complete codebase on GitHub</p>
              </div>

              <!-- GitHub CTA -->
              <div class="github-hero">
                <div class="github-logo">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.5">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                </div>
                <h3>eyobassey/rapidcapsule</h3>
                <p>AI-Powered Telemedicine Platform - Complete source code with 4 services, 46+ modules, and 400K+ lines of code</p>
                <a href="https://github.com/eyobassey/rapidcapsule" target="_blank" rel="noopener noreferrer" class="github-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                  View on GitHub
                </a>
              </div>

              <!-- Repository Stats -->
              <div class="repo-stats">
                <h3>Repository Statistics</h3>
                <div class="stats-grid">
                  <div class="stat-item"><span class="stat-value">1,600+</span><span class="stat-label">Files</span></div>
                  <div class="stat-item"><span class="stat-value">400K+</span><span class="stat-label">Lines of Code</span></div>
                  <div class="stat-item"><span class="stat-value">4</span><span class="stat-label">Services</span></div>
                  <div class="stat-item"><span class="stat-value">46+</span><span class="stat-label">Backend Modules</span></div>
                  <div class="stat-item"><span class="stat-value">273</span><span class="stat-label">Components</span></div>
                  <div class="stat-item"><span class="stat-value">100+</span><span class="stat-label">API Endpoints</span></div>
                </div>
              </div>

              <!-- Project Structure -->
              <div class="repo-structure">
                <h3>Project Structure</h3>
                <div class="structure-grid">
                  <a href="https://github.com/eyobassey/rapidcapsule/tree/main/RC" target="_blank" class="structure-card border-blue">
                    <div class="structure-icon bg-blue">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                        <line x1="12" y1="18" x2="12.01" y2="18"></line>
                      </svg>
                    </div>
                    <div class="structure-info">
                      <h4>RC/</h4>
                      <p>Patient Frontend</p>
                      <span class="tech-badge">Vue.js 3</span>
                    </div>
                  </a>
                  <a href="https://github.com/eyobassey/rapidcapsule/tree/main/RC-Backend" target="_blank" class="structure-card border-green">
                    <div class="structure-icon bg-green">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                        <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                        <rect x="9" y="9" width="6" height="6"></rect>
                      </svg>
                    </div>
                    <div class="structure-info">
                      <h4>RC-Backend/</h4>
                      <p>Patient API (32 modules)</p>
                      <span class="tech-badge">NestJS</span>
                    </div>
                  </a>
                  <a href="https://github.com/eyobassey/rapidcapsule/tree/main/RC_Admin_UI" target="_blank" class="structure-card border-purple">
                    <div class="structure-icon bg-purple">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      </svg>
                    </div>
                    <div class="structure-info">
                      <h4>RC_Admin_UI/</h4>
                      <p>Admin Dashboard</p>
                      <span class="tech-badge">Vuetify 3</span>
                    </div>
                  </a>
                  <a href="https://github.com/eyobassey/rapidcapsule/tree/main/RC_Admin_Backend" target="_blank" class="structure-card border-orange">
                    <div class="structure-icon bg-orange">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                        <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                        <rect x="9" y="9" width="6" height="6"></rect>
                      </svg>
                    </div>
                    <div class="structure-info">
                      <h4>RC_Admin_Backend/</h4>
                      <p>Admin API (14 modules)</p>
                      <span class="tech-badge">NestJS</span>
                    </div>
                  </a>
                </div>
              </div>

              <!-- Key Files -->
              <div class="key-files">
                <h3>Key Documentation</h3>
                <div class="files-list">
                  <a href="https://github.com/eyobassey/rapidcapsule/blob/main/README.md" target="_blank" class="file-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <span>README.md</span>
                    <span class="file-desc">Project overview & setup guide</span>
                  </a>
                  <a href="https://github.com/eyobassey/rapidcapsule/blob/main/docs/ARCHITECTURE.md" target="_blank" class="file-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <span>docs/ARCHITECTURE.md</span>
                    <span class="file-desc">System architecture documentation</span>
                  </a>
                  <a href="https://github.com/eyobassey/rapidcapsule/blob/main/docs/DIAGRAMS.md" target="_blank" class="file-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <span>docs/DIAGRAMS.md</span>
                    <span class="file-desc">Mermaid architecture diagrams</span>
                  </a>
                  <a href="https://github.com/eyobassey/rapidcapsule/blob/main/ecosystem.config.example.js" target="_blank" class="file-link">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <span>ecosystem.config.example.js</span>
                    <span class="file-desc">PM2 deployment configuration</span>
                  </a>
                </div>
              </div>

              <!-- Tech Badges -->
              <div class="tech-badges-section">
                <h3>Technologies Used</h3>
                <div class="badges-row">
                  <span class="tech-pill vue">Vue.js 3</span>
                  <span class="tech-pill nest">NestJS</span>
                  <span class="tech-pill ts">TypeScript</span>
                  <span class="tech-pill mongo">MongoDB</span>
                  <span class="tech-pill redis">Redis</span>
                  <span class="tech-pill aws">AWS</span>
                  <span class="tech-pill socket">Socket.io</span>
                  <span class="tech-pill ai">Infermedica AI</span>
                  <span class="tech-pill ai">Claude AI</span>
                </div>
              </div>
            </div>

            <!-- API Documentation Section -->
            <div v-else-if="activeSection === 'apidoc'" class="section-content apidoc-section">
              <div class="section-header">
                <h2 class="gradient-text-cyan">API Documentation</h2>
                <p class="section-desc">Complete REST API reference for the Rapid Capsule platform</p>
              </div>

              <!-- Postman Hero -->
              <div class="apidoc-hero">
                <div class="postman-logo">
                  <svg width="48" height="48" viewBox="0 0 256 256" fill="none">
                    <circle cx="128" cy="128" r="128" fill="#FF6C37"/>
                    <path d="M152.7 96.3l-43.2 43.2-11.8-11.8c-2.9-2.9-7.7-2.9-10.6 0-2.9 2.9-2.9 7.7 0 10.6l17.1 17.1c1.5 1.5 3.4 2.2 5.3 2.2s3.8-.7 5.3-2.2l48.5-48.5c2.9-2.9 2.9-7.7 0-10.6-2.9-2.9-7.7-2.9-10.6 0z" fill="#fff"/>
                  </svg>
                </div>
                <div class="hero-text">
                  <h3>Rapid Capsule API Collection</h3>
                  <p>Interactive API documentation hosted on Postman</p>
                </div>
                <a
                  href="https://www.postman.com/eyobassey-a7ce0a56-2594020/rapid-capsule/collection/51609967-e16995aa-e4f8-4453-819a-d5b01a386cd2"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="view-docs-btn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                  View API Documentation
                </a>
              </div>

              <!-- API Stats -->
              <div class="api-stats-grid">
                <div class="api-stat-card">
                  <div class="stat-icon blue">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <div class="stat-value">300+</div>
                  <div class="stat-label">API Endpoints</div>
                </div>
                <div class="api-stat-card">
                  <div class="stat-icon green">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="3" y1="9" x2="21" y2="9"></line>
                      <line x1="9" y1="21" x2="9" y2="9"></line>
                    </svg>
                  </div>
                  <div class="stat-value">3</div>
                  <div class="stat-label">API Categories</div>
                </div>
                <div class="api-stat-card">
                  <div class="stat-icon purple">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                  </div>
                  <div class="stat-value">100%</div>
                  <div class="stat-label">Documented</div>
                </div>
                <div class="api-stat-card">
                  <div class="stat-icon orange">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                  </div>
                  <div class="stat-value">JSON</div>
                  <div class="stat-label">Response Format</div>
                </div>
              </div>

              <!-- API Categories -->
              <h3 class="subsection-title">API Categories</h3>
              <div class="api-categories-grid">
                <div class="api-category-card border-blue">
                  <div class="category-header">
                    <div class="category-icon bg-blue">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                      </svg>
                    </div>
                    <div>
                      <h4>Patient API</h4>
                      <span class="endpoint-count">150+ endpoints</span>
                    </div>
                  </div>
                  <ul class="category-features">
                    <li>Authentication & User Management</li>
                    <li>Health Checkups & AI Diagnosis</li>
                    <li>Appointments & Video Calls</li>
                    <li>Prescriptions & Pharmacy Orders</li>
                    <li>Vitals & Health Monitoring</li>
                    <li>Wallet & Payment Processing</li>
                  </ul>
                </div>

                <div class="api-category-card border-green">
                  <div class="category-header">
                    <div class="category-icon bg-green">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                      </svg>
                    </div>
                    <div>
                      <h4>Specialist API</h4>
                      <span class="endpoint-count">80+ endpoints</span>
                    </div>
                  </div>
                  <ul class="category-features">
                    <li>Prescription Management</li>
                    <li>Specialist Wallet & Earnings</li>
                    <li>Patient Records Access</li>
                    <li>Drug Catalog & Inventory</li>
                    <li>Clinical Notes & Templates</li>
                    <li>Appointment Management</li>
                  </ul>
                </div>

                <div class="api-category-card border-purple">
                  <div class="category-header">
                    <div class="category-icon bg-purple">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                    </div>
                    <div>
                      <h4>Admin API</h4>
                      <span class="endpoint-count">70+ endpoints</span>
                    </div>
                  </div>
                  <ul class="category-features">
                    <li>Dashboard & Analytics</li>
                    <li>Patient & Specialist Management</li>
                    <li>Pharmacy Administration</li>
                    <li>Settings & Configuration</li>
                    <li>Compliance & Audit Logs</li>
                    <li>Revenue & Reports</li>
                  </ul>
                </div>
              </div>

              <!-- Authentication Info -->
              <h3 class="subsection-title">Authentication</h3>
              <div class="auth-info-card">
                <div class="auth-method">
                  <div class="auth-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <div class="auth-details">
                    <h4>JWT Bearer Token</h4>
                    <p>All authenticated endpoints require a valid JWT token in the Authorization header</p>
                    <code>Authorization: Bearer &lt;your_token&gt;</code>
                  </div>
                </div>
                <div class="auth-methods-list">
                  <div class="auth-type">
                    <span class="auth-badge">Email/Password</span>
                    <span>Standard login with OTP verification</span>
                  </div>
                  <div class="auth-type">
                    <span class="auth-badge google">Google OAuth</span>
                    <span>Social login with Google account</span>
                  </div>
                  <div class="auth-type">
                    <span class="auth-badge apple">Apple Sign-In</span>
                    <span>Social login with Apple ID</span>
                  </div>
                </div>
              </div>

              <!-- Base URLs -->
              <h3 class="subsection-title">Base URLs</h3>
              <div class="base-urls-grid">
                <div class="url-card">
                  <div class="url-label">Patient API</div>
                  <code class="url-value">https://api.rapidcapsule.com/api</code>
                  <span class="port-badge">Port 5020</span>
                </div>
                <div class="url-card">
                  <div class="url-label">Admin API</div>
                  <code class="url-value">https://admin.rapidcapsule.com/admin-api</code>
                  <span class="port-badge">Port 5021</span>
                </div>
              </div>

              <!-- Quick Links -->
              <div class="quick-links-section">
                <a
                  href="https://www.postman.com/eyobassey-a7ce0a56-2594020/rapid-capsule/collection/51609967-e16995aa-e4f8-4453-819a-d5b01a386cd2"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="quick-link-btn primary"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                  Open Full Documentation
                </a>
                <a
                  href="https://github.com/eyobassey/rapidcapsule"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="quick-link-btn secondary"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                  View Source Code
                </a>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>

    <!-- Footer with Creator Credit -->
    <footer class="page-footer">
      <div class="footer-content">
        <div class="creator-credit">
          <span class="created-by">Created by</span>
          <span class="creator-name">Bassey Eyo</span>
          <span class="creator-title">Founder & CTO</span>
          <a href="mailto:eyobassey@gmail.com" class="creator-email">eyobassey@gmail.com</a>
        </div>
        <div class="copyright">
          <span>© 2024-2026 Rapid Capsule. All rights reserved.</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';

export default {
  name: 'RCArchitecture',
  setup() {
    const activeSection = ref('overview');
    const animationPhase = ref(0);
    let intervalId = null;

    const sections = [
      { id: 'overview', label: 'System Overview', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>' },
      { id: 'architecture', label: 'Architecture', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>' },
      { id: 'ai', label: 'AI Services', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect></svg>' },
      { id: 'security', label: 'Security', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>' },
      { id: 'flows', label: 'Data Flows', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>' },
      { id: 'tech', label: 'Tech Stack', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>' },
      { id: 'readme', label: 'Read Me', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>' },
      { id: 'github', label: 'GitHub', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>' },
      { id: 'apidoc', label: 'API Doc', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path><line x1="8" y1="6" x2="16" y2="6"></line><line x1="8" y1="10" x2="16" y2="10"></line><line x1="8" y1="14" x2="12" y2="14"></line></svg>' }
    ];

    const users = [
      { title: 'Patients', color: 'blue', desc: 'Health checkups, appointments, Health Score, prescriptions & pharmacy', iconSvg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>' },
      { title: 'Specialists', color: 'green', desc: 'Consultations & prescriptions', iconSvg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>' },
      { title: 'Lifeguards', color: 'orange', desc: 'Emergency response', iconSvg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>' },
      { title: 'Administrators', color: 'purple', desc: 'Platform management', iconSvg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>' }
    ];

    const patientModules = [
      { name: 'Auth Module', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>' },
      { name: 'Health Checkup', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>' },
      { name: 'Appointments', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>' },
      { name: 'Vitals', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>' },
      { name: 'Prescriptions', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path><path d="m8.5 8.5 7 7"></path></svg>' },
      { name: 'Payments', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>' },
      { name: 'WhatsApp', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>' },
      { name: 'Video Calls', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>' }
    ];

    const adminModules = [
      { name: 'Admin Auth', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>' },
      { name: 'Dashboard', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>' },
      { name: 'Patient Mgmt', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>' },
      { name: 'Analytics', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>' },
      { name: 'Claude AI', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect></svg>' },
      { name: 'Reports', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>' }
    ];

    const domains = [
      { name: 'Cardiovascular', weight: 20, color: 'red' },
      { name: 'Metabolic', weight: 20, color: 'orange' },
      { name: 'Mental', weight: 15, color: 'purple' },
      { name: 'Lifestyle', weight: 15, color: 'green' },
      { name: 'Physical', weight: 15, color: 'blue' },
      { name: 'Preventive', weight: 15, color: 'teal' }
    ];

    const securityLayers = [
      { title: 'Client Security', color: 'blue', items: ['HTTPS/TLS 1.3', 'Content Security Policy', 'XSS Protection', 'CSRF Tokens'] },
      { title: 'Edge Security', color: 'purple', items: ['Cloudflare DDoS', 'Web App Firewall', 'Rate Limiting', 'Bot Protection'] },
      { title: 'API Security', color: 'green', items: ['JWT Authentication', 'Guard Chain', 'Role-Based Access', 'Session Mgmt'] },
      { title: 'Data Security', color: 'orange', items: ['Bcrypt Hashing', 'AES-256 Encryption', 'Input Sanitization', 'Audit Logging'] }
    ];

    const rbacRows = [
      { perm: 'View Own Data', p: true, s: true, l: true, a: true },
      { perm: 'View Patient Data', p: false, s: true, l: true, a: true },
      { perm: 'Create Prescriptions', p: false, s: true, l: false, a: true },
      { perm: 'Manage Users', p: false, s: false, l: false, a: true },
      { perm: 'View Analytics', p: false, s: false, l: false, a: true },
      { perm: 'System Config', p: false, s: false, l: false, a: true }
    ];

    const healthCheckupSteps = [
      { step: '1', label: 'Patient describes symptoms', status: 'complete' },
      { step: '2', label: 'Infermedica NLP parsing', status: 'complete' },
      { step: '3', label: 'AI interview questions', status: 'active' },
      { step: '4', label: 'Diagnosis & triage', status: 'pending' },
      { step: '5', label: 'Claude health summary', status: 'pending' },
      { step: '6', label: 'Specialist recommendations', status: 'pending' }
    ];

    const prescriptionSteps = [
      { step: '1', label: 'Upload prescription image' },
      { step: '2', label: 'AWS Textract 5-level OCR' },
      { step: '3', label: 'Medication parsing & matching' },
      { step: '4', label: 'Stock & interaction check' },
      { step: '5', label: 'Payment processing' },
      { step: '6', label: 'Pharmacy fulfillment' }
    ];

    const whatsappStates = ['IDLE', 'VERIFICATION', 'MENU', 'PRESCRIPTION_UPLOAD', 'OCR_PROCESSING', 'ORDER_CREATION', 'PAYMENT_PENDING', 'PHARMACIST_CHAT'];

    const appointmentChannels = [
      { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>', label: 'Video', desc: 'Zoom' },
      { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>', label: 'Voice', desc: 'Twilio' },
      { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>', label: 'Chat', desc: 'In-App' },
      { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>', label: 'In-Person', desc: 'Clinic' },
      { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>', label: 'Home', desc: 'Visit' },
      { icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>', label: 'Emergency', desc: 'Urgent' }
    ];

    const techStacks = [
      { title: 'Frontend', color: 'blue', items: ['Vue.js 3', 'Vuetify 3', 'Pinia', 'PWA', 'Composition API'] },
      { title: 'Backend', color: 'green', items: ['NestJS 9', 'TypeScript', 'Mongoose', 'Passport.js', 'Socket.io'] },
      { title: 'Database', color: 'yellow', items: ['MongoDB Atlas', 'Redis Cache', 'AWS S3', 'Document Store'] },
      { title: 'Integrations', color: 'purple', items: ['Zoom API', 'Paystack', 'Twilio', 'Brevo', 'Gupshup'] }
    ];

    const innovations = [
      { title: 'AI-Powered Diagnostics', desc: 'Infermedica integration for symptom analysis', impact: 'Democratizes medical AI' },
      { title: 'LLM Health Summaries', desc: 'Claude AI for patient-friendly explanations', impact: 'Improves health literacy' },
      { title: '6-Domain Health Scoring', desc: 'Digital health twin with weighted metrics', impact: 'Longitudinal tracking' },
      { title: 'WhatsApp Commerce', desc: 'Conversational pharmacy ordering', impact: 'Underserved market access' },
      { title: '5-Level OCR Pipeline', desc: 'AWS Textract prescription processing', impact: 'Digitizes handwritten Rx' },
      { title: 'Multi-Channel Telehealth', desc: '6 consultation types supported', impact: 'Flexible care delivery' }
    ];

    onMounted(() => {
      intervalId = setInterval(() => {
        animationPhase.value = (animationPhase.value + 1) % 4;
      }, 2000);
    });

    onUnmounted(() => {
      if (intervalId) clearInterval(intervalId);
    });

    return {
      activeSection,
      animationPhase,
      sections,
      users,
      patientModules,
      adminModules,
      domains,
      securityLayers,
      rbacRows,
      healthCheckupSteps,
      prescriptionSteps,
      whatsappStates,
      appointmentChannels,
      techStacks,
      innovations
    };
  }
};
</script>

<style lang="scss" scoped>
.architecture-page {
  min-height: 100vh;
  background-color: #0f172a;
  color: #f1f5f9;
  overflow-x: hidden;
  position: relative;
}

.background-effects {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  animation: pulse 4s ease-in-out infinite;
}

.glow-1 { top: 0; left: 25%; width: 24rem; height: 24rem; background: rgba(6, 182, 212, 0.15); }
.glow-2 { bottom: 0; right: 25%; width: 24rem; height: 24rem; background: rgba(168, 85, 247, 0.15); animation-delay: 1s; }
.glow-3 { top: 50%; left: 50%; transform: translate(-50%, -50%); width: 24rem; height: 24rem; background: rgba(59, 130, 246, 0.1); animation-delay: 2s; }

@keyframes pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

.page-header {
  position: relative;
  z-index: 10;
  border-bottom: 1px solid rgba(51, 65, 85, 0.5);
  backdrop-filter: blur(12px);
  background: rgba(15, 23, 42, 0.9);
}

.header-content {
  max-width: 80rem;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  .logo-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

/* Make all SVG icons white */
svg {
  color: #ffffff;
}

.brand-text {
  h1 {
    font-size: 1.25rem;
    font-weight: 700;
    background: linear-gradient(90deg, #22d3ee, #60a5fa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
  }
  p { font-size: 0.75rem; color: #94a3b8; margin: 0; }
}

.badges { display: flex; gap: 0.5rem; }
.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  border: 1px solid;
}
.badge-green { background: rgba(34, 197, 94, 0.2); color: #4ade80; border-color: rgba(34, 197, 94, 0.3); }
.badge-cyan { background: rgba(6, 182, 212, 0.2); color: #22d3ee; border-color: rgba(6, 182, 212, 0.3); }

.main-container {
  position: relative;
  z-index: 10;
  max-width: 80rem;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.layout { display: flex; gap: 2rem; }

.sidebar { width: 14rem; flex-shrink: 0; }
.nav-items {
  position: sticky;
  top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid transparent;
  background: rgba(30, 41, 59, 0.5);
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 500;

  &:hover {
    color: #ffffff;
    background: rgba(51, 65, 85, 0.7);
    border-color: rgba(71, 85, 105, 0.5);
  }

  &.active {
    background: linear-gradient(90deg, rgba(6, 182, 212, 0.25), rgba(59, 130, 246, 0.25));
    color: #ffffff;
    border-color: rgba(6, 182, 212, 0.4);
    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.15);
    .nav-icon { color: #22d3ee; }
  }
}

.nav-icon {
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

.nav-label { color: inherit; }

.content-area { flex: 1; min-width: 0; }
.content-card {
  border-radius: 1.5rem;
  border: 1px solid rgba(51, 65, 85, 0.5);
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(12px);
  padding: 2rem;
}

.section-content { display: flex; flex-direction: column; gap: 2rem; }
.section-header {
  text-align: center;
  margin-bottom: 1rem;
  h2 { font-size: 1.875rem; font-weight: 700; margin-bottom: 0.75rem; }
}
.section-desc { color: #94a3b8; max-width: 42rem; margin: 0 auto; }

.gradient-text-cyan { background: linear-gradient(90deg, #22d3ee, #60a5fa, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.gradient-text-green { background: linear-gradient(90deg, #34d399, #22d3ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.gradient-text-purple { background: linear-gradient(90deg, #a78bfa, #c084fc, #f472b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.gradient-text-red { background: linear-gradient(90deg, #f87171, #fb923c, #facc15); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.gradient-text-teal { background: linear-gradient(90deg, #2dd4bf, #22d3ee, #60a5fa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

.user-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.user-card {
  border-radius: 1rem;
  border: 1px solid rgba(71, 85, 105, 0.5);
  background: linear-gradient(135deg, rgba(51, 65, 85, 0.6), rgba(30, 41, 59, 0.8));
  padding: 1.25rem;
  transition: all 0.3s;
  &:hover { transform: translateY(-2px); }
  &.border-blue:hover { border-color: rgba(59, 130, 246, 0.5); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15); }
  &.border-green:hover { border-color: rgba(34, 197, 94, 0.5); box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15); }
  &.border-orange:hover { border-color: rgba(249, 115, 22, 0.5); box-shadow: 0 4px 12px rgba(249, 115, 22, 0.15); }
  &.border-purple:hover { border-color: rgba(168, 85, 247, 0.5); box-shadow: 0 4px 12px rgba(168, 85, 247, 0.15); }
  .user-icon {
    width: 3rem; height: 3rem; border-radius: 0.75rem;
    display: flex; align-items: center; justify-content: center; margin-bottom: 0.75rem;
    &.bg-blue { background: rgba(59, 130, 246, 0.2); svg { color: #60a5fa; } }
    &.bg-green { background: rgba(34, 197, 94, 0.2); svg { color: #4ade80; } }
    &.bg-orange { background: rgba(249, 115, 22, 0.2); svg { color: #fb923c; } }
    &.bg-purple { background: rgba(168, 85, 247, 0.2); svg { color: #c084fc; } }
  }
  h3 { font-weight: 600; color: #ffffff; margin-bottom: 0.25rem; font-size: 1rem; }
  p { font-size: 0.75rem; color: #94a3b8; margin: 0; }
}

.arrows-row {
  display: flex; justify-content: center; gap: 3rem; margin: 0.75rem 0;
  &.single { gap: 0; }
  svg { color: rgba(6, 182, 212, 0.7); &.bounce { animation: bounce 1s infinite; } }
}
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }

.frontend-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; max-width: 42rem; margin: 0 auto; }
.frontend-card {
  border-radius: 1rem; padding: 1.25rem;
  &.border-blue { border: 1px solid rgba(59, 130, 246, 0.4); background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(30, 41, 59, 0.9)); svg { color: #60a5fa; } }
  &.border-purple { border: 1px solid rgba(168, 85, 247, 0.4); background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(30, 41, 59, 0.9)); svg { color: #c084fc; } }
  .frontend-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; h3 { font-weight: 600; color: #ffffff; margin: 0; font-size: 1rem; } p { font-size: 0.75rem; color: #94a3b8; margin: 0; } }
}

.tags { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-top: 0.75rem; }
.tag { padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; }
.tag-blue { background: rgba(59, 130, 246, 0.25); color: #93c5fd; }
.tag-purple { background: rgba(168, 85, 247, 0.25); color: #d8b4fe; }

.gateway-card {
  max-width: 28rem; margin: 0 auto; border-radius: 1rem;
  border: 1px solid rgba(6, 182, 212, 0.4);
  background: linear-gradient(90deg, rgba(6, 182, 212, 0.15), rgba(30, 41, 59, 0.9), rgba(6, 182, 212, 0.15));
  padding: 1rem; text-align: center;
  display: flex; align-items: center; justify-content: center; gap: 0.75rem;
  svg { color: #22d3ee; }
  h3 { font-weight: 600; color: #ffffff; margin: 0; font-size: 1rem; }
  p { font-size: 0.75rem; color: #94a3b8; margin: 0; }
}

.backend-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; max-width: 48rem; margin: 0 auto; }
.backend-card {
  border-radius: 1rem; padding: 1rem; text-align: left;
  &.border-green { border: 1px solid rgba(34, 197, 94, 0.4); background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(30, 41, 59, 0.9)); svg { color: #4ade80; } }
  &.border-orange { border: 1px solid rgba(249, 115, 22, 0.4); background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(30, 41, 59, 0.9)); svg { color: #fb923c; } }
  &.border-pink { border: 1px solid rgba(236, 72, 153, 0.4); background: linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(30, 41, 59, 0.9)); svg { color: #f472b6; } }
  svg { margin-bottom: 0.5rem; }
  h3 { font-weight: 600; color: #ffffff; font-size: 0.875rem; margin: 0 0 0.25rem 0; }
  p { font-size: 0.75rem; color: #94a3b8; margin: 0; }
}

.data-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; max-width: 32rem; margin: 0 auto; }
.data-card {
  border-radius: 1rem; padding: 1rem; text-align: center;
  &.border-yellow { border: 1px solid rgba(234, 179, 8, 0.4); background: linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(30, 41, 59, 0.9)); svg { color: #facc15; } }
  &.border-teal { border: 1px solid rgba(20, 184, 166, 0.4); background: linear-gradient(135deg, rgba(20, 184, 166, 0.15), rgba(30, 41, 59, 0.9)); svg { color: #2dd4bf; } }
  svg { margin: 0 auto 0.5rem; }
  h3 { font-weight: 600; color: #ffffff; font-size: 0.875rem; margin: 0 0 0.25rem 0; }
  p { font-size: 0.75rem; color: #94a3b8; margin: 0; }
}

.services-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; }
.service-card {
  border-radius: 1.5rem; padding: 1.5rem;
  &.border-blue { border: 1px solid rgba(59, 130, 246, 0.3); background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(30, 41, 59, 0.95)); }
  &.border-purple { border: 1px solid rgba(168, 85, 247, 0.3); background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(30, 41, 59, 0.95)); }
}
.service-title { font-size: 1.125rem; font-weight: 700; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
.text-blue { color: #60a5fa; }
.text-purple { color: #c084fc; }
.text-green { color: #4ade80; }
.text-orange { color: #fb923c; }
.text-red { color: #f87171; }
.text-teal { color: #2dd4bf; }
.text-cyan { color: #22d3ee; }
.text-amber { color: #fbbf24; }
.text-yellow { color: #facc15; }
.text-pink { color: #f472b6; }
.text-violet { color: #a78bfa; }

.pulse-dot { width: 0.75rem; height: 0.75rem; border-radius: 50%; animation: pulse 2s infinite; }
.bg-blue { background: #60a5fa; }
.bg-purple { background: #c084fc; }
.bg-green { background: #4ade80; }
.bg-orange { background: #fb923c; }
.bg-yellow { background: #facc15; }
.bg-red { background: #f87171; }
.bg-teal { background: #2dd4bf; }
.bg-violet { background: #a78bfa; }
.bg-pink { background: #f472b6; }
.bg-amber { background: #fbbf24; }

.modules-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
.module-item {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.625rem; border-radius: 0.75rem;
  background: rgba(51, 65, 85, 0.5); border: 1px solid rgba(71, 85, 105, 0.5);
  span { font-size: 0.75rem; color: #cbd5e1; }
}
.service-card.border-blue .module-item svg { color: #60a5fa; }
.service-card.border-purple .module-item svg { color: #c084fc; }

.stores-section {
  border-radius: 1.5rem; border: 1px solid rgba(71, 85, 105, 0.3);
  background: rgba(30, 41, 59, 0.5); padding: 1.5rem;
  h3 { font-size: 1.125rem; font-weight: 700; color: #cbd5e1; margin-bottom: 1rem; text-align: center; }
}
.stores-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.store-card {
  text-align: center; padding: 1rem; border-radius: 1rem;
  &.border-yellow { background: linear-gradient(135deg, rgba(234, 179, 8, 0.15), transparent); border: 1px solid rgba(234, 179, 8, 0.3); svg { color: #facc15; } }
  &.border-red { background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), transparent); border: 1px solid rgba(239, 68, 68, 0.3); svg { color: #f87171; } }
  &.border-orange { background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), transparent); border: 1px solid rgba(249, 115, 22, 0.3); svg { color: #fb923c; } }
  svg { margin: 0 auto 0.5rem; }
  h4 { font-weight: 600; color: #ffffff; margin: 0 0 0.25rem 0; font-size: 1rem; }
  p { font-size: 0.75rem; color: #94a3b8; margin: 0; }
}

.ai-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
.ai-card {
  border-radius: 1.5rem; padding: 1.5rem;
  &.border-violet { border: 1px solid rgba(139, 92, 246, 0.4); background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(30, 41, 59, 0.95), rgba(168, 85, 247, 0.15)); }
  &.border-pink { border: 1px solid rgba(236, 72, 153, 0.4); background: linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(30, 41, 59, 0.95), rgba(239, 68, 68, 0.15)); }
  &.border-amber { border: 1px solid rgba(245, 158, 11, 0.4); background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(30, 41, 59, 0.95), rgba(249, 115, 22, 0.15)); }
  h3 { font-size: 1.25rem; font-weight: 700; color: #ffffff; margin: 0 0 0.5rem 0; }
}
.ai-desc { font-size: 0.875rem; color: #94a3b8; margin: 0 0 1rem 0; }
.ai-icon {
  width: 3.5rem; height: 3.5rem; border-radius: 1rem;
  display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;
  &.bg-violet { background: linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(168, 85, 247, 0.4)); svg { color: #a78bfa; } }
  &.bg-pink { background: linear-gradient(135deg, rgba(236, 72, 153, 0.4), rgba(239, 68, 68, 0.4)); svg { color: #f472b6; } }
  &.bg-amber { background: linear-gradient(135deg, rgba(245, 158, 11, 0.4), rgba(249, 115, 22, 0.4)); svg { color: #fbbf24; } }
}
.features { display: flex; flex-direction: column; gap: 0.5rem; }
.feature { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: #cbd5e1; }
.check { font-size: 1rem; font-weight: bold; }

.health-score-section {
  border-radius: 1.5rem; border: 1px solid rgba(6, 182, 212, 0.3);
  background: linear-gradient(90deg, rgba(6, 182, 212, 0.1), rgba(30, 41, 59, 0.95), rgba(20, 184, 166, 0.1));
  padding: 1.5rem;
  h3 { font-size: 1.125rem; font-weight: 700; margin-bottom: 1.5rem; text-align: center; }
}
.domains-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1rem; }
.domain-item { text-align: center; p { font-size: 0.75rem; color: #cbd5e1; margin: 0; } }
.domain-circle {
  width: 4rem; height: 4rem; margin: 0 auto 0.5rem;
  border-radius: 50%; border-width: 4px; border-style: solid;
  display: flex; align-items: center; justify-content: center;
  span { font-size: 1rem; font-weight: 700; }
  &.border-red { border-color: rgba(239, 68, 68, 0.5); background: rgba(239, 68, 68, 0.15); }
  &.border-orange { border-color: rgba(249, 115, 22, 0.5); background: rgba(249, 115, 22, 0.15); }
  &.border-purple { border-color: rgba(168, 85, 247, 0.5); background: rgba(168, 85, 247, 0.15); }
  &.border-green { border-color: rgba(34, 197, 94, 0.5); background: rgba(34, 197, 94, 0.15); }
  &.border-blue { border-color: rgba(59, 130, 246, 0.5); background: rgba(59, 130, 246, 0.15); }
  &.border-teal { border-color: rgba(20, 184, 166, 0.5); background: rgba(20, 184, 166, 0.15); }
}

.security-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.security-card {
  border-radius: 1rem; padding: 1.25rem;
  &.border-blue { border: 1px solid rgba(59, 130, 246, 0.4); background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(30, 41, 59, 0.9)); }
  &.border-purple { border: 1px solid rgba(168, 85, 247, 0.4); background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(30, 41, 59, 0.9)); }
  &.border-green { border: 1px solid rgba(34, 197, 94, 0.4); background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(30, 41, 59, 0.9)); }
  &.border-orange { border: 1px solid rgba(249, 115, 22, 0.4); background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(30, 41, 59, 0.9)); }
  h3 { font-weight: 700; margin-bottom: 1rem; text-align: center; }
}
.security-items { display: flex; flex-direction: column; gap: 0.5rem; }
.security-item {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem; border-radius: 0.5rem; background: rgba(51, 65, 85, 0.5);
  span { font-size: 0.75rem; color: #cbd5e1; }
}
.security-card.border-blue .security-item svg { color: #60a5fa; }
.security-card.border-purple .security-item svg { color: #c084fc; }
.security-card.border-green .security-item svg { color: #4ade80; }
.security-card.border-orange .security-item svg { color: #fb923c; }

.rbac-section {
  border-radius: 1.5rem; border: 1px solid rgba(71, 85, 105, 0.3);
  background: rgba(30, 41, 59, 0.5); padding: 1.5rem;
  h3 { font-size: 1.125rem; font-weight: 700; color: #cbd5e1; margin-bottom: 1.5rem; text-align: center; }
}
.rbac-table-container { overflow-x: auto; }
.rbac-table {
  width: 100%; font-size: 0.875rem; border-collapse: collapse;
  th, td { padding: 0.75rem 1rem; text-align: center; }
  th { border-bottom: 1px solid #475569; color: #94a3b8; &:first-child { text-align: left; } }
  td { border-bottom: 1px solid #334155; &:first-child { text-align: left; color: #cbd5e1; } }
  .check-mark { color: #4ade80; font-size: 1.25rem; }
  .empty-mark { color: #475569; font-size: 1.25rem; }
}

.flows-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
.flow-card {
  border-radius: 1.5rem; padding: 1.5rem;
  &.border-teal { border: 1px solid rgba(20, 184, 166, 0.3); background: linear-gradient(135deg, rgba(20, 184, 166, 0.1), rgba(30, 41, 59, 0.95)); }
  &.border-amber { border: 1px solid rgba(245, 158, 11, 0.3); background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(30, 41, 59, 0.95)); }
  &.border-green { border: 1px solid rgba(34, 197, 94, 0.3); background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(30, 41, 59, 0.95)); }
  &.border-blue { border: 1px solid rgba(59, 130, 246, 0.3); background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(30, 41, 59, 0.95)); }
  h3 { font-size: 1.125rem; font-weight: 700; margin-bottom: 1rem; }
}
.flow-steps { display: flex; flex-direction: column; gap: 0.75rem; }
.flow-step { display: flex; align-items: center; gap: 0.75rem; }
.step-number {
  width: 2rem; height: 2rem; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 700;
  &.complete { background: #14b8a6; color: white; }
  &.active { background: rgba(20, 184, 166, 0.3); color: #2dd4bf; box-shadow: 0 0 0 2px #14b8a6; animation: pulse 2s infinite; }
  &.pending { background: #334155; color: #64748b; }
  &.amber { background: rgba(245, 158, 11, 0.25); color: #fbbf24; }
}
.flow-step span { font-size: 0.875rem; color: #cbd5e1; &.muted { color: #64748b; } }
.state-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.state-tag { padding: 0.375rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; background: rgba(34, 197, 94, 0.25); color: #86efac; border: 1px solid rgba(34, 197, 94, 0.4); }
.flow-note { font-size: 0.75rem; color: #94a3b8; margin-top: 1rem; }
.channels-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
.channel-item {
  text-align: center; padding: 0.75rem; border-radius: 0.75rem; background: rgba(51, 65, 85, 0.5);
  svg { color: #60a5fa; margin-bottom: 0.25rem; }
  .channel-label { font-size: 0.75rem; color: #ffffff; font-weight: 500; margin: 0; }
  .channel-desc { font-size: 0.625rem; color: #64748b; margin: 0; }
}

.tech-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
.tech-card {
  border-radius: 1rem; padding: 1.25rem;
  &.border-blue { border: 1px solid rgba(59, 130, 246, 0.4); background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(30, 41, 59, 0.9)); }
  &.border-green { border: 1px solid rgba(34, 197, 94, 0.4); background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(30, 41, 59, 0.9)); }
  &.border-yellow { border: 1px solid rgba(234, 179, 8, 0.4); background: linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(30, 41, 59, 0.9)); }
  &.border-purple { border: 1px solid rgba(168, 85, 247, 0.4); background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(30, 41, 59, 0.9)); }
  h3 { font-weight: 700; margin-bottom: 1rem; text-align: center; }
}
.tech-items { display: flex; flex-direction: column; gap: 0.5rem; }
.tech-item {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem; border-radius: 0.5rem; background: rgba(51, 65, 85, 0.5);
  span { font-size: 0.75rem; color: #cbd5e1; }
}
.tech-dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; }

.innovation-section {
  border-radius: 1.5rem; border: 1px solid rgba(6, 182, 212, 0.3);
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(30, 41, 59, 0.95), rgba(168, 85, 247, 0.1));
  padding: 1.5rem;
  h3 { font-size: 1.25rem; font-weight: 700; text-align: center; margin-bottom: 1.5rem; }
}
.innovations-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.innovation-card {
  padding: 1rem; border-radius: 0.75rem;
  background: rgba(51, 65, 85, 0.5); border: 1px solid rgba(71, 85, 105, 0.5);
  h4 { font-weight: 600; color: #ffffff; font-size: 0.875rem; margin: 0 0 0.25rem 0; }
  p { font-size: 0.75rem; color: #94a3b8; margin: 0 0 0.5rem 0; }
  .impact { display: flex; align-items: center; gap: 0.25rem; svg { color: #facc15; } span { font-size: 0.75rem; color: #facc15; } }
}

/* Read Me Section Styles */
.readme-section {
  h3 { font-size: 1.125rem; font-weight: 700; color: #22d3ee; margin-bottom: 1rem; }
}

.stats-card {
  border-radius: 1.5rem; border: 1px solid rgba(6, 182, 212, 0.3);
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(30, 41, 59, 0.95));
  padding: 1.5rem;
}

.stats-grid {
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 1rem;
}

.stat-item {
  text-align: center; padding: 1rem; border-radius: 0.75rem;
  background: rgba(51, 65, 85, 0.5); border: 1px solid rgba(71, 85, 105, 0.3);
  .stat-value { display: block; font-size: 1.5rem; font-weight: 700; color: #22d3ee; }
  .stat-label { display: block; font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem; }
}

.ports-card {
  border-radius: 1.5rem; border: 1px solid rgba(168, 85, 247, 0.3);
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(30, 41, 59, 0.95));
  padding: 1.5rem;
}

.ports-table { display: flex; flex-direction: column; gap: 0.5rem; }

.port-row {
  display: grid; grid-template-columns: 2fr 1fr 2fr; gap: 1rem;
  padding: 0.75rem 1rem; border-radius: 0.5rem;
  background: rgba(51, 65, 85, 0.5);
  span { font-size: 0.875rem; color: #cbd5e1; }
  &.header {
    background: rgba(168, 85, 247, 0.2);
    span { font-weight: 600; color: #c084fc; }
  }
}

.readme-innovations {
  border-radius: 1.5rem; border: 1px solid rgba(34, 197, 94, 0.3);
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(30, 41, 59, 0.95));
  padding: 1.5rem;
}

.innovation-list { display: flex; flex-direction: column; gap: 1rem; }

.innovation-item {
  padding: 1rem; border-radius: 0.75rem;
  background: rgba(51, 65, 85, 0.5); border: 1px solid rgba(71, 85, 105, 0.3);
  h4 { font-size: 1rem; font-weight: 600; color: #4ade80; margin: 0 0 0.5rem 0; }
  p { font-size: 0.875rem; color: #cbd5e1; margin: 0; line-height: 1.5; }
}

.arch-summary {
  border-radius: 1.5rem; border: 1px solid rgba(59, 130, 246, 0.3);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(30, 41, 59, 0.95));
  padding: 1.5rem;
}

.arch-points { display: flex; flex-direction: column; gap: 0.5rem; }

.arch-point {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.5rem 1rem; border-radius: 0.5rem;
  background: rgba(51, 65, 85, 0.5);
  font-size: 0.875rem; color: #cbd5e1;
  .bullet { color: #60a5fa; font-size: 1.25rem; }
}

/* Footer Styles */
.page-footer {
  position: relative; z-index: 10;
  border-top: 1px solid rgba(51, 65, 85, 0.5);
  background: rgba(15, 23, 42, 0.95);
  padding: 1.5rem;
}

.footer-content {
  max-width: 80rem; margin: 0 auto;
  display: flex; justify-content: space-between; align-items: center;
  flex-wrap: wrap; gap: 1rem;
}

.creator-credit {
  display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
}

.created-by { font-size: 0.875rem; color: #64748b; }

.creator-name {
  font-size: 1rem; font-weight: 700;
  background: linear-gradient(90deg, #22d3ee, #60a5fa);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}

.creator-title {
  font-size: 0.875rem; color: #94a3b8;
  padding: 0.25rem 0.75rem; border-radius: 9999px;
  background: rgba(6, 182, 212, 0.2); border: 1px solid rgba(6, 182, 212, 0.3);
}

.creator-email {
  font-size: 0.875rem; color: #60a5fa;
  text-decoration: none;
  &:hover { color: #93c5fd; text-decoration: underline; }
}

.copyright { font-size: 0.75rem; color: #64748b; }

/* GitHub Section Styles */
.github-section {
  h3 { font-size: 1.125rem; font-weight: 700; color: #c084fc; margin-bottom: 1rem; }
}

.github-hero {
  text-align: center;
  padding: 3rem 2rem;
  border-radius: 1.5rem;
  border: 1px solid rgba(168, 85, 247, 0.3);
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(30, 41, 59, 0.95), rgba(59, 130, 246, 0.1));

  .github-logo {
    margin-bottom: 1.5rem;
    svg { opacity: 0.9; }
  }

  h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 0.75rem;
  }

  p {
    color: #94a3b8;
    max-width: 32rem;
    margin: 0 auto 1.5rem;
    line-height: 1.6;
  }
}

.github-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, #a855f7, #6366f1);
  color: #ffffff;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(168, 85, 247, 0.4);
  }
}

.repo-stats {
  border-radius: 1.5rem;
  border: 1px solid rgba(6, 182, 212, 0.3);
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(30, 41, 59, 0.95));
  padding: 1.5rem;
}

.repo-structure {
  border-radius: 1.5rem;
  border: 1px solid rgba(59, 130, 246, 0.3);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(30, 41, 59, 0.95));
  padding: 1.5rem;
}

.structure-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.structure-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  background: rgba(51, 65, 85, 0.5);
  text-decoration: none;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    background: rgba(51, 65, 85, 0.7);
  }

  &.border-blue { border: 1px solid rgba(59, 130, 246, 0.4); &:hover { border-color: rgba(59, 130, 246, 0.6); } }
  &.border-green { border: 1px solid rgba(34, 197, 94, 0.4); &:hover { border-color: rgba(34, 197, 94, 0.6); } }
  &.border-purple { border: 1px solid rgba(168, 85, 247, 0.4); &:hover { border-color: rgba(168, 85, 247, 0.6); } }
  &.border-orange { border: 1px solid rgba(249, 115, 22, 0.4); &:hover { border-color: rgba(249, 115, 22, 0.6); } }
}

.structure-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.bg-blue { background: rgba(59, 130, 246, 0.3); }
  &.bg-green { background: rgba(34, 197, 94, 0.3); }
  &.bg-purple { background: rgba(168, 85, 247, 0.3); }
  &.bg-orange { background: rgba(249, 115, 22, 0.3); }
}

.structure-info {
  h4 { font-size: 1rem; font-weight: 600; color: #ffffff; margin: 0 0 0.25rem 0; }
  p { font-size: 0.75rem; color: #94a3b8; margin: 0 0 0.5rem 0; }
}

.tech-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.625rem;
  font-weight: 600;
  background: rgba(6, 182, 212, 0.2);
  color: #22d3ee;
  border: 1px solid rgba(6, 182, 212, 0.3);
}

.key-files {
  border-radius: 1.5rem;
  border: 1px solid rgba(34, 197, 94, 0.3);
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(30, 41, 59, 0.95));
  padding: 1.5rem;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  background: rgba(51, 65, 85, 0.5);
  text-decoration: none;
  transition: all 0.3s;

  &:hover {
    background: rgba(51, 65, 85, 0.7);
    transform: translateX(4px);
  }

  span {
    font-size: 0.875rem;
    color: #60a5fa;
    font-weight: 500;
  }

  .file-desc {
    color: #64748b;
    font-weight: 400;
    margin-left: auto;
  }
}

.tech-badges-section {
  border-radius: 1.5rem;
  border: 1px solid rgba(249, 115, 22, 0.3);
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.1), rgba(30, 41, 59, 0.95));
  padding: 1.5rem;
}

.badges-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}

.tech-pill {
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid;

  &.vue { background: rgba(66, 184, 131, 0.2); color: #42b883; border-color: rgba(66, 184, 131, 0.4); }
  &.nest { background: rgba(229, 33, 58, 0.2); color: #e5213a; border-color: rgba(229, 33, 58, 0.4); }
  &.ts { background: rgba(49, 120, 198, 0.2); color: #3178c6; border-color: rgba(49, 120, 198, 0.4); }
  &.mongo { background: rgba(0, 237, 100, 0.2); color: #00ed64; border-color: rgba(0, 237, 100, 0.4); }
  &.redis { background: rgba(220, 50, 47, 0.2); color: #dc322f; border-color: rgba(220, 50, 47, 0.4); }
  &.aws { background: rgba(255, 153, 0, 0.2); color: #ff9900; border-color: rgba(255, 153, 0, 0.4); }
  &.socket { background: rgba(37, 37, 37, 0.4); color: #ffffff; border-color: rgba(255, 255, 255, 0.3); }
  &.ai { background: rgba(168, 85, 247, 0.2); color: #c084fc; border-color: rgba(168, 85, 247, 0.4); }
}

@media (max-width: 1024px) {
  .layout { flex-direction: column; }
  .sidebar { width: 100%; }
  .nav-items { position: static; flex-direction: row; flex-wrap: wrap; gap: 0.5rem; }
  .nav-btn { width: auto; flex: 1; min-width: 8rem; justify-content: center; }
  .user-grid, .security-grid, .tech-grid { grid-template-columns: repeat(2, 1fr); }
  .services-grid, .flows-grid { grid-template-columns: 1fr; }
  .domains-grid { grid-template-columns: repeat(3, 1fr); }
  .ai-grid { grid-template-columns: 1fr; }
  .innovations-grid { grid-template-columns: repeat(2, 1fr); }
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
  .footer-content { flex-direction: column; text-align: center; }
}

@media (max-width: 640px) {
  .header-content { flex-direction: column; gap: 1rem; }
  .user-grid, .frontend-grid, .backend-grid, .data-grid, .stores-grid, .security-grid, .tech-grid, .channels-grid, .innovations-grid { grid-template-columns: 1fr; }
  .domains-grid { grid-template-columns: repeat(2, 1fr); }
  .nav-btn { min-width: 100%; }
  .content-card { padding: 1rem; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .creator-credit { justify-content: center; }
}

/* ============ API Documentation Section ============ */
.apidoc-section {
  .section-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .section-desc {
    color: rgba(255, 255, 255, 0.7);
    font-size: 1.1rem;
    margin-top: 0.5rem;
  }
}

.apidoc-hero {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  background: linear-gradient(135deg, rgba(255, 108, 55, 0.15) 0%, rgba(255, 108, 55, 0.05) 100%);
  border: 1px solid rgba(255, 108, 55, 0.3);
  border-radius: 1rem;
  margin-bottom: 2rem;
}

.postman-logo {
  flex-shrink: 0;
}

.hero-text {
  flex: 1;

  h3 {
    color: #ffffff;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
  }

  p {
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
  }
}

.view-docs-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #FF6C37 0%, #ff8c5a 100%);
  color: #ffffff;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(255, 108, 55, 0.4);
  }
}

.api-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.api-stat-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem auto;

  &.blue { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
  &.green { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
  &.purple { background: rgba(168, 85, 247, 0.2); color: #a855f7; }
  &.orange { background: rgba(255, 108, 55, 0.2); color: #ff6c37; }
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.25rem;
}

.stat-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
}

.subsection-title {
  color: #ffffff;
  font-size: 1.25rem;
  font-weight: 600;
  margin: 2rem 0 1rem 0;
}

.api-categories-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.api-category-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid;

  &.border-blue { border-color: rgba(59, 130, 246, 0.4); }
  &.border-green { border-color: rgba(34, 197, 94, 0.4); }
  &.border-purple { border-color: rgba(168, 85, 247, 0.4); }
}

.category-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;

  h4 {
    color: #ffffff;
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0;
  }
}

.category-icon {
  width: 48px;
  height: 48px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.bg-blue { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
  &.bg-green { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
  &.bg-purple { background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%); }
}

.endpoint-count {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.category-features {
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    padding: 0.5rem 0;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    gap: 0.5rem;

    &::before {
      content: '•';
      color: #22d3ee;
    }

    &:last-child {
      border-bottom: none;
    }
  }
}

.auth-info-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(34, 211, 238, 0.2);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.auth-method {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1rem;
}

.auth-icon {
  width: 48px;
  height: 48px;
  background: rgba(34, 211, 238, 0.1);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.auth-details {
  h4 {
    color: #ffffff;
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  p {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.875rem;
    margin: 0 0 0.75rem 0;
  }

  code {
    display: inline-block;
    background: rgba(0, 0, 0, 0.3);
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    font-family: 'Fira Code', monospace;
    font-size: 0.8rem;
    color: #22d3ee;
  }
}

.auth-methods-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.auth-type {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  span:last-child {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.875rem;
  }
}

.auth-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;

  &.google { background: rgba(234, 67, 53, 0.2); color: #ea4335; }
  &.apple { background: rgba(255, 255, 255, 0.15); color: #ffffff; }
}

.base-urls-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.url-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  padding: 1.25rem;
}

.url-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.url-value {
  display: block;
  background: rgba(0, 0, 0, 0.3);
  padding: 0.625rem 0.875rem;
  border-radius: 0.375rem;
  font-family: 'Fira Code', monospace;
  font-size: 0.85rem;
  color: #22d3ee;
  margin-bottom: 0.75rem;
  word-break: break-all;
}

.port-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
}

.quick-links-section {
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding-top: 1rem;
}

.quick-link-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;

  &.primary {
    background: linear-gradient(135deg, #FF6C37 0%, #ff8c5a 100%);
    color: #ffffff;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(255, 108, 55, 0.4);
    }
  }

  &.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }
  }
}

/* API Doc Responsive */
@media (max-width: 1024px) {
  .api-stats-grid { grid-template-columns: repeat(2, 1fr); }
  .api-categories-grid { grid-template-columns: 1fr; }
  .base-urls-grid { grid-template-columns: 1fr; }
}

@media (max-width: 640px) {
  .apidoc-hero {
    flex-direction: column;
    text-align: center;
  }
  .api-stats-grid { grid-template-columns: repeat(2, 1fr); }
  .quick-links-section {
    flex-direction: column;
  }
  .quick-link-btn {
    justify-content: center;
  }
}
</style>
