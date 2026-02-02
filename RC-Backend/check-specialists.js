const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/rapid_capsule?replicaSet=rs0&directConnection=true');

  const specialists = await mongoose.connection.db.collection('users').find({
    user_type: 'Specialist'
  }, {
    projection: {
      _id: 1,
      'profile.first_name': 1,
      'profile.last_name': 1,
      'profile.profile_photo': 1,
      'profile.profile_image': 1,
      'profile.gender': 1
    }
  }).toArray();

  console.log('All Specialists:');
  specialists.forEach(s => {
    const hasImage = s.profile?.profile_photo || s.profile?.profile_image;
    const name = (s.profile?.first_name || '') + ' ' + (s.profile?.last_name || '');
    const gender = s.profile?.gender || 'unknown';
    console.log('  ' + s._id + ': ' + name + ' - Gender: ' + gender + ' - Image: ' + (hasImage || 'NONE'));
  });

  const withoutImages = specialists.filter(s => !s.profile?.profile_photo && !s.profile?.profile_image);
  console.log('\nSpecialists without images: ' + withoutImages.length);

  await mongoose.disconnect();
}
check().catch(console.error);
