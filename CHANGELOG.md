# Changelog

All notable changes to the Rapid Capsule project are documented in this file.

## [2.1.0] - September 11, 2025
### Added
- Infermedica API 2024-2025 documentation
- Duration feature implementation for symptom tracking

## [2.0.0] - September 2025 - Comprehensive Admin System

### Phase 1: Healthcare-Specific Information
- **Medical History Dashboard**: Complete healthcare data visualization with BMI calculation, pre-existing conditions, and health risk factors
- **Health Metrics Integration**: Real-time vital signs display and health analytics
- **Recent Health Activity**: Clickable health checkup history with detailed AI diagnosis reports

### Phase 2: Data Completeness & Quality
- **Emergency Contacts Enhancement**: Improved data validation and fallback handling
- **Subscription Information**: Real-time subscription status and billing integration
- **Last Seen Activity**: Accurate activity tracking based on login history

### Phase 3: Visual & UX Improvements
- **Activity Timeline**: Comprehensive patient interaction tracking with date grouping
- **Quick Actions Panel**: Admin controls for account suspension and deactivation
- **Health Status Overview**: Visual health dashboard with scoring and risk assessment

### Phase 4: Advanced Admin Features
- **Communication History**: Complete communication tracking with filtering and timeline view
- **Notes Section**: Full admin notes system with categories, priorities, and search functionality
- **Account Management**: Complete account status management with confirmation dialogs and audit trails

### Technical Achievements
- 8 New Admin Components for comprehensive patient management
- 15 New API Endpoints for administrative operations
- Real Data Integration with live MongoDB data
- Enhanced Security with admin action logging
- Professional UI/UX with Material Design 3 and Vuetify

### New Admin Components
1. `MedicalHistory.vue` - Healthcare dashboard with clickable reports
2. `ActivityTimeline.vue` - Patient interaction timeline
3. `HealthStatusOverview.vue` - Visual health analytics
4. `QuickActions.vue` - Administrative action panel
5. `CommunicationHistory.vue` - Communication tracking system
6. `NotesSection.vue` - Admin notes management
7. `AccountManagement.vue` - Account status controls
8. `BioPanel.vue` - Enhanced patient bio display

## Bug Fixes

### September 2025
- **Risk Factors Display** - Fixed data source access in Health Status Overview
- **Admin Data Structure Issues** - Corrected MongoDB document parsing in admin services
- **Notes Section Dialog Issue** - Fixed Vue watcher for add note functionality

### August 2025
- **Health Checkup Results 404** - Added missing `/api/health-checkup/results/:userId` endpoint

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 2.1.0 | Sep 2025 | Infermedica API documentation update |
| 2.0.0 | Sep 2025 | Comprehensive Admin System |
| 1.x.x | Pre-2025 | Initial patient platform |
