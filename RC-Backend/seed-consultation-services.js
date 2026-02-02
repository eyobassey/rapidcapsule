/**
 * Seed script for Consultation Services (Appointment Types)
 *
 * Run this script to populate the consultation_services collection
 * Usage: node seed-consultation-services.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rapidcapsule';

// Consultation Services Schema
const consultationServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  icon: { type: String, default: 'hi-video-camera' },
  icon_color: { type: String, default: '#4FC3F7' },
  icon_bg_color: { type: String, default: '#E3F2FD' },
  pricing_type: {
    type: String,
    enum: ['flat', 'routine_urgent'],
    default: 'routine_urgent'
  },
  min_rate: { type: Number, default: 2000 },
  max_rate: { type: Number, default: null },
  default_currency: { type: String, default: 'NGN' },
  is_active: { type: Boolean, default: true },
  display_order: { type: Number, default: 0 },
  is_default: { type: Boolean, default: false },
  info_text: { type: String, default: null },
  show_ai_badge: { type: Boolean, default: false },
}, {
  collection: 'consultation_services',
  timestamps: true,
});

const ConsultationService = mongoose.model('ConsultationService', consultationServiceSchema);

// Initial consultation services data
// Note: Slugs use underscores to match admin UI validation (/^[a-z0-9_]+$/)
const consultationServices = [
  {
    name: 'Initial Appointment',
    slug: 'initial_appointment',
    description: 'First time seeing this specialist for a new health concern',
    icon: 'hi-user-add',
    icon_color: '#0284C7',
    icon_bg_color: '#E0F2FE',
    pricing_type: 'routine_urgent',
    min_rate: 5000,
    max_rate: 25000,
    is_active: true,
    display_order: 1,
    is_default: true,
    info_text: 'Recommended for first-time consultations',
    show_ai_badge: false,
  },
  {
    name: 'Follow-up Appointment',
    slug: 'follow_up_appointment',
    description: 'Continuing care with a specialist you\'ve seen before',
    icon: 'hi-refresh',
    icon_color: '#16A34A',
    icon_bg_color: '#F0FDF4',
    pricing_type: 'routine_urgent',
    min_rate: 3000,
    max_rate: 15000,
    is_active: true,
    display_order: 2,
    is_default: true,
    info_text: 'For follow-up visits and ongoing care',
    show_ai_badge: false,
  },
  {
    name: 'Second Opinion',
    slug: 'second_opinion',
    description: 'Get another specialist\'s perspective on your diagnosis or treatment',
    icon: 'hi-users',
    icon_color: '#7C3AED',
    icon_bg_color: '#F3E8FF',
    pricing_type: 'routine_urgent',
    min_rate: 7500,
    max_rate: 35000,
    is_active: true,
    display_order: 3,
    is_default: false,
    info_text: 'Bring your existing medical records for review',
    show_ai_badge: false,
  },
  {
    name: 'Prescription Renewal',
    slug: 'prescription_renewal',
    description: 'Renew an existing prescription without a full consultation',
    icon: 'hi-document-text',
    icon_color: '#EA580C',
    icon_bg_color: '#FFF7ED',
    pricing_type: 'flat',
    min_rate: 2000,
    max_rate: 5000,
    is_active: true,
    display_order: 4,
    is_default: false,
    info_text: 'Quick appointment for prescription refills only',
    show_ai_badge: false,
  },
  {
    name: 'Lab Results Review',
    slug: 'lab_results_review',
    description: 'Discuss and understand your recent laboratory test results',
    icon: 'hi-clipboard-list',
    icon_color: '#0891B2',
    icon_bg_color: '#E0F7FA',
    pricing_type: 'flat',
    min_rate: 3000,
    max_rate: 10000,
    is_active: true,
    display_order: 5,
    is_default: false,
    info_text: 'Upload your lab results before the appointment',
    show_ai_badge: false,
  },
  {
    name: 'Mental Health Check-in',
    slug: 'mental_health_checkin',
    description: 'Ongoing mental health support and therapy sessions',
    icon: 'hi-heart',
    icon_color: '#EC4899',
    icon_bg_color: '#FCE7F3',
    pricing_type: 'routine_urgent',
    min_rate: 5000,
    max_rate: 20000,
    is_active: true,
    display_order: 6,
    is_default: false,
    info_text: 'Confidential mental health support',
    show_ai_badge: true,
  },
];

async function seedConsultationServices() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('\nSeeding consultation services...');

    for (const service of consultationServices) {
      const existing = await ConsultationService.findOne({ slug: service.slug });

      if (existing) {
        console.log(`  - Updating: ${service.name}`);
        await ConsultationService.updateOne(
          { slug: service.slug },
          { $set: service }
        );
      } else {
        console.log(`  - Creating: ${service.name}`);
        await ConsultationService.create(service);
      }
    }

    console.log('\n✅ Consultation services seeded successfully!');

    // Display summary
    const total = await ConsultationService.countDocuments();
    const active = await ConsultationService.countDocuments({ is_active: true });
    console.log(`\nSummary:`);
    console.log(`  - Total services: ${total}`);
    console.log(`  - Active services: ${active}`);

  } catch (error) {
    console.error('Error seeding consultation services:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seed function
seedConsultationServices();
