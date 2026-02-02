const mongoose = require('mongoose');

const MONGO_URL = "mongodb://127.0.0.1:27017/rapid_capsule?replicaSet=rs0&directConnection=true";

const newSpecialists = [
  {
    first_name: 'Sarah',
    last_name: 'Thompson',
    gender: 'Female',
    specialty: 'Cardiologist',
    email: 'sarah.thompson@rapidcapsule-test.com',
    university: 'University of Oxford',
    years: '12',
  },
  {
    first_name: 'James',
    last_name: 'Okonkwo',
    gender: 'Male',
    specialty: 'Pediatrician',
    email: 'james.okonkwo@rapidcapsule-test.com',
    university: 'University of Lagos',
    years: '8',
  },
  {
    first_name: 'Amara',
    last_name: 'Nwosu',
    gender: 'Female',
    specialty: 'Neurologist',
    email: 'amara.nwosu@rapidcapsule-test.com',
    university: 'University of Ibadan',
    years: '15',
  },
  {
    first_name: 'David',
    last_name: 'Chen',
    gender: 'Male',
    specialty: 'Dermatologist',
    email: 'david.chen@rapidcapsule-test.com',
    university: 'Imperial College London',
    years: '7',
  },
  {
    first_name: 'Elena',
    last_name: 'Rodriguez',
    gender: 'Female',
    specialty: 'Oncologist',
    email: 'elena.rodriguez@rapidcapsule-test.com',
    university: 'University of Edinburgh',
    years: '20',
  },
];

async function seedSpecialists() {
  await mongoose.connect(MONGO_URL);
  console.log('Connected to MongoDB');

  const User = mongoose.connection.collection('users');

  for (const spec of newSpecialists) {
    // Check if already exists
    const existing = await User.findOne({ email: spec.email });
    if (existing) {
      console.log(`Already exists: ${spec.first_name} ${spec.last_name} (${spec.specialty}) - skipping`);
      continue;
    }

    const uniquePhone = `555-${String(Date.now()).slice(-4)}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const doc = {
      profile: {
        contact: {
          phone: { country_code: '+44', number: uniquePhone },
          email: spec.email,
          address1: '123 Medical Centre',
          state: 'London',
          country: 'United Kingdom',
          zip_code: 'W1A 1AA',
          address2: '',
        },
        first_name: spec.first_name,
        last_name: spec.last_name,
        password: '$2b$10$V1H55byIgguNNmUFaw4EFunZIN1w59p9wS8wRBJve2sfn7BtlvDyK', // placeholder hash
        date_of_birth: '1985-01-15T00:00:00.000Z',
        basic_health_info: {},
        health_risk_factors: {},
        gender: spec.gender,
        marital_status: 'Single',
      },
      user_type: 'Specialist',
      terms: true,
      marketing: false,
      is_email_verified: true,
      is_phone_verified: false,
      is_auth_app_enabled: false,
      reg_medium: 'LOCAL',
      earnings: '0',
      average_rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10, // 3.5-5.0
      verification_status: 'Verified',
      status: 'Active',
      emergency_contacts: [],
      pre_existing_conditions: [],
      dependants: [],
      documents: [],
      awards: [],
      professional_practice: {
        category: 'Medical Doctor',
        area_of_specialty: spec.specialty,
        consultation_fee: 500,
        years_of_practice: spec.years,
        license_number: `LIC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        place_of_housemanship: { end_year: null, name: '', start_year: null },
        university: {
          name: spec.university,
          start_year: '2005',
          end_year: '2011',
        },
      },
      is_active: true,
      is_suspended: false,
      email: spec.email,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await User.insertOne(doc);
    console.log(`Created: Dr. ${spec.first_name} ${spec.last_name} - ${spec.specialty}`);
  }

  // Verify final state
  const allSpecs = await User.find({ user_type: 'Specialist' }).toArray();
  console.log(`\nTotal specialists: ${allSpecs.length}`);
  console.log('Specialty distribution:');
  for (const s of allSpecs) {
    const name = `${s.profile?.first_name} ${s.profile?.last_name}`;
    const specialty = s.professional_practice?.area_of_specialty || 'Unknown';
    console.log(`  ${name}: ${specialty} (rating: ${s.average_rating})`);
  }

  await mongoose.disconnect();
}

seedSpecialists().catch(err => {
  console.error('Error:', err);
  mongoose.disconnect();
  process.exit(1);
});
