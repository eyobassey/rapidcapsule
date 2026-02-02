const mongoose = require('mongoose');

const MONGO_URL = "mongodb://127.0.0.1:27017/rapid_capsule?replicaSet=rs0&directConnection=true";

// Days of the week for availability
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Time slots throughout the day (9 AM to 5 PM)
const timeAvailability = daysOfWeek.map(day => ({
  day,
  start_time: '09:00',
  end_time: '17:00',
}));

async function seedSpecialistAvailability() {
  await mongoose.connect(MONGO_URL);
  console.log('Connected to MongoDB');

  const User = mongoose.connection.collection('users');
  const SpecialistPreferences = mongoose.connection.collection('specialist_preferences');

  // Get all specialists
  const specialists = await User.find({
    user_type: 'Specialist',
    status: 'Active'
  }).toArray();

  console.log(`Found ${specialists.length} active specialists`);

  for (const specialist of specialists) {
    const specialistId = specialist._id;
    const name = `${specialist.profile?.first_name} ${specialist.profile?.last_name}`;

    // Check if preferences already exist
    const existingPrefs = await SpecialistPreferences.findOne({ userId: specialistId });

    if (existingPrefs) {
      // Update existing preferences with time availability
      await SpecialistPreferences.updateOne(
        { userId: specialistId },
        {
          $set: {
            time_availability: timeAvailability,
            preferences: {
              gender: 'All',
              language: 'English',
              timezone: 'Africa/Lagos',
            },
            meeting_preferences: {
              preferred_channels: ['zoom', 'phone', 'chat'],
              zoom_configured: true,
              google_meet_configured: false,
              teams_configured: false,
            },
            updated_at: new Date(),
          }
        }
      );
      console.log(`Updated availability for: ${name}`);
    } else {
      // Create new preferences
      await SpecialistPreferences.insertOne({
        userId: specialistId,
        time_availability: timeAvailability,
        preferences: {
          gender: 'All',
          language: 'English',
          timezone: 'Africa/Lagos',
        },
        meeting_preferences: {
          preferred_channels: ['zoom', 'phone', 'chat'],
          zoom_configured: true,
          google_meet_configured: false,
          teams_configured: false,
        },
        created_at: new Date(),
        updated_at: new Date(),
      });
      console.log(`Created availability for: ${name}`);
    }
  }

  // Also update all specialists to be "General Practitioner" for testing
  const updateResult = await User.updateMany(
    { user_type: 'Specialist' },
    {
      $set: {
        'professional_practice.area_of_specialty': 'General Practitioner',
        'professional_practice.category': 'Medical Doctor',
        updated_at: new Date(),
      }
    }
  );
  console.log(`\nUpdated ${updateResult.modifiedCount} specialists to General Practitioner`);

  // Verify
  console.log('\n--- Verification ---');
  const allPrefs = await SpecialistPreferences.find({}).toArray();
  console.log(`Total specialist preferences records: ${allPrefs.length}`);

  for (const pref of allPrefs) {
    const user = await User.findOne({ _id: pref.userId });
    const name = user ? `${user.profile?.first_name} ${user.profile?.last_name}` : 'Unknown';
    const days = pref.time_availability?.length || 0;
    console.log(`  ${name}: ${days} days configured`);
  }

  await mongoose.disconnect();
  console.log('\nDone!');
}

seedSpecialistAvailability().catch(err => {
  console.error('Error:', err);
  mongoose.disconnect();
  process.exit(1);
});
