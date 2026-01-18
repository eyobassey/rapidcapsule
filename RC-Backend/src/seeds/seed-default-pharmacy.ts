import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const PharmacySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    trading_name: { type: String },
    description: { type: String },
    pharmacy_type: {
      type: String,
      enum: ['RETAIL', 'HOSPITAL', 'COMMUNITY', 'ONLINE', 'COMPOUNDING'],
      default: 'RETAIL',
    },
    registration_number: { type: String, required: true, unique: true },
    license_number: { type: String },
    license_expiry: { type: Date },
    cac_registration: { type: String },
    tax_id: { type: String },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    alternate_phone: { type: String },
    website: { type: String },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, default: 'Nigeria' },
      postal_code: { type: String },
      landmark: { type: String },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    },
    operating_hours: [
      {
        day: {
          type: String,
          enum: [
            'MONDAY',
            'TUESDAY',
            'WEDNESDAY',
            'THURSDAY',
            'FRIDAY',
            'SATURDAY',
            'SUNDAY',
          ],
          required: true,
        },
        is_open: { type: Boolean, default: true },
        open_time: { type: String },
        close_time: { type: String },
        break_start: { type: String },
        break_end: { type: String },
      },
    ],
    is_24_hours: { type: Boolean, default: false },
    offers_delivery: { type: Boolean, default: true },
    delivery_zones: { type: [String], default: [] },
    delivery_fee: { type: Number, default: 0 },
    free_delivery_threshold: { type: Number, default: 0 },
    min_order_amount: { type: Number, default: 0 },
    estimated_delivery_time: { type: String },
    delivery_radius_km: { type: Number, default: 10 },
    offers_pickup: { type: Boolean, default: true },
    pickup_instructions: { type: String },
    verification_status: {
      type: String,
      enum: [
        'PENDING',
        'UNDER_REVIEW',
        'VERIFIED',
        'SUSPENDED',
        'REJECTED',
        'EXPIRED',
      ],
      default: 'PENDING',
      index: true,
    },
    verified_at: { type: Date },
    verified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verification_notes: { type: String },
    documents: [
      {
        document_type: {
          type: String,
          enum: [
            'PHARMACY_LICENSE',
            'BUSINESS_REGISTRATION',
            'NAFDAC_REGISTRATION',
            'TAX_CERTIFICATE',
            'SUPERINTENDENT_PHARMACIST_LICENSE',
            'PROOF_OF_ADDRESS',
            'BANK_STATEMENT',
            'OTHER',
          ],
          required: true,
        },
        url: { type: String, required: true },
        file_name: { type: String },
        uploaded_at: { type: Date, default: Date.now },
        verified: { type: Boolean, default: false },
        verified_at: { type: Date },
        verified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rejection_reason: { type: String },
      },
    ],
    superintendent_pharmacist: {
      name: { type: String },
      license_number: { type: String },
      phone: { type: String },
      email: { type: String },
    },
    average_rating: { type: Number, default: 0 },
    total_ratings: { type: Number, default: 0 },
    total_orders: { type: Number, default: 0 },
    bank_details: {
      bank_name: { type: String },
      bank_code: { type: String },
      account_number: { type: String },
      account_name: { type: String },
      verified: { type: Boolean, default: false },
    },
    commission_rate: { type: Number, default: 0 },
    wallet_balance: { type: Number, default: 0 },
    accepted_payment_methods: {
      type: [String],
      enum: ['CARD', 'BANK_TRANSFER', 'CASH_ON_DELIVERY', 'WALLET', 'INSURANCE'],
      default: ['CARD', 'BANK_TRANSFER', 'WALLET'],
    },
    accepts_insurance: { type: Boolean, default: false },
    accepted_insurance_providers: { type: [String], default: [] },
    offers_consultation: { type: Boolean, default: false },
    consultation_fee: { type: Number, default: 0 },
    can_dispense_controlled: { type: Boolean, default: false },
    offers_compounding: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true },
    is_online: { type: Boolean, default: true },
    last_online_at: { type: Date },
    offline_reason: { type: String },
    is_featured: { type: Boolean, default: false },
    is_suspended: { type: Boolean, default: false },
    suspension_reason: { type: String },
    suspended_at: { type: Date },
    suspended_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    staff: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

async function seedDefaultPharmacy() {
  try {
    const mongoUrl = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/rapid_capsule';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUrl);
    console.log('Connected to MongoDB');

    const Pharmacy = mongoose.model('Pharmacy', PharmacySchema);

    // Check if pharmacy already exists
    const existingPharmacy = await Pharmacy.findOne({
      registration_number: 'RC-PHARM-DEFAULT-001',
    });

    if (existingPharmacy) {
      console.log('Default pharmacy already exists:', existingPharmacy.name);
      console.log('Pharmacy ID:', existingPharmacy._id);
      await mongoose.disconnect();
      return;
    }

    const defaultPharmacy = new Pharmacy({
      name: 'Rapid Capsule Pharmacy (Platform Default)',
      trading_name: 'Rapid Capsule Pharmacy',
      description:
        'The official Rapid Capsule platform pharmacy, providing quality medications and healthcare products with fast delivery across Nigeria.',
      pharmacy_type: 'ONLINE',
      registration_number: 'RC-PHARM-DEFAULT-001',
      license_number: 'PCN-RC-2024-001',
      license_expiry: new Date('2026-12-31'),
      cac_registration: 'RC-1234567',
      tax_id: 'TIN-RC-001',
      email: 'pharmacy@rapidcapsule.com',
      phone: '+2348001234567',
      alternate_phone: '+2349001234567',
      website: 'https://rapidcapsule.com/pharmacy',
      address: {
        street: '123 Healthcare Avenue, Victoria Island',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        postal_code: '101241',
        landmark: 'Near Victoria Island Mall',
        coordinates: {
          latitude: 6.4281,
          longitude: 3.4219,
        },
      },
      operating_hours: [
        { day: 'MONDAY', is_open: true, open_time: '08:00', close_time: '22:00' },
        { day: 'TUESDAY', is_open: true, open_time: '08:00', close_time: '22:00' },
        { day: 'WEDNESDAY', is_open: true, open_time: '08:00', close_time: '22:00' },
        { day: 'THURSDAY', is_open: true, open_time: '08:00', close_time: '22:00' },
        { day: 'FRIDAY', is_open: true, open_time: '08:00', close_time: '22:00' },
        { day: 'SATURDAY', is_open: true, open_time: '09:00', close_time: '20:00' },
        { day: 'SUNDAY', is_open: true, open_time: '10:00', close_time: '18:00' },
      ],
      is_24_hours: false,
      offers_delivery: true,
      delivery_zones: [
        'Lagos Island',
        'Victoria Island',
        'Ikoyi',
        'Lekki',
        'Ajah',
        'Surulere',
        'Yaba',
        'Ikeja',
        'Maryland',
        'Gbagada',
        'Ogudu',
        'Magodo',
        'Ojodu',
        'Ogba',
        'Agege',
        'Oshodi',
        'Mushin',
        'Apapa',
        'Festac',
        'Amuwo-Odofin',
        'Nationwide',
      ],
      delivery_fee: 1500,
      free_delivery_threshold: 20000,
      min_order_amount: 2000,
      estimated_delivery_time: '2-4 hours within Lagos, 1-3 days nationwide',
      delivery_radius_km: 50,
      offers_pickup: true,
      pickup_instructions:
        'Please bring a valid ID and your order confirmation number when picking up your order.',
      verification_status: 'VERIFIED',
      verified_at: new Date(),
      verification_notes: 'Platform default pharmacy - auto-verified',
      superintendent_pharmacist: {
        name: 'Dr. Adaeze Okafor',
        license_number: 'PCN-SP-2020-12345',
        phone: '+2348012345678',
        email: 'pharmacist@rapidcapsule.com',
      },
      average_rating: 4.8,
      total_ratings: 150,
      total_orders: 500,
      bank_details: {
        bank_name: 'First Bank of Nigeria',
        bank_code: '011',
        account_number: '3000000001',
        account_name: 'Rapid Capsule Pharmacy Ltd',
        verified: true,
      },
      commission_rate: 0,
      wallet_balance: 0,
      accepted_payment_methods: ['CARD', 'BANK_TRANSFER', 'WALLET', 'CASH_ON_DELIVERY'],
      accepts_insurance: true,
      accepted_insurance_providers: [
        'NHIS',
        'HMO Partners',
        'Leadway Health',
        'AXA Mansard',
        'Hygeia',
        'Reliance HMO',
      ],
      offers_consultation: true,
      consultation_fee: 2000,
      can_dispense_controlled: true,
      offers_compounding: false,
      is_active: true,
      is_online: true,
      last_online_at: new Date(),
      is_featured: true,
      is_suspended: false,
    });

    const savedPharmacy = await defaultPharmacy.save();
    console.log('Default pharmacy created successfully!');
    console.log('Pharmacy Name:', savedPharmacy.name);
    console.log('Pharmacy ID:', savedPharmacy._id);
    console.log('Registration Number:', savedPharmacy.registration_number);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding default pharmacy:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedDefaultPharmacy();
