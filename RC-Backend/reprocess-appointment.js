/**
 * Script to reprocess an appointment that was incorrectly marked as MISSED
 * Run with: node reprocess-appointment.js
 */

const mongoose = require('mongoose');

const MONGO_URL = 'mongodb://127.0.0.1:27017/rapid_capsule?replicaSet=rs0&directConnection=true';
const MEETING_ID = '86910566919'; // The Zoom meeting ID (without spaces)

async function main() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB');

    // Get the appointments collection
    const db = mongoose.connection.db;
    const appointmentsCollection = db.collection('appointments');

    // Find the appointment
    console.log(`\nLooking for appointment with meeting_id: ${MEETING_ID}`);
    const appointment = await appointmentsCollection.findOne({ meeting_id: MEETING_ID });

    if (!appointment) {
      console.log('Appointment not found!');
      process.exit(1);
    }

    console.log('\nFound appointment:');
    console.log('  ID:', appointment._id);
    console.log('  Current Status:', appointment.status);
    console.log('  Start Time:', appointment.start_time);
    console.log('  Meeting Platform Data:', JSON.stringify(appointment.meeting_platform_data, null, 2));
    console.log('  Current Attendance:', JSON.stringify(appointment.attendance, null, 2));
    console.log('  Call Duration:', JSON.stringify(appointment.call_duration, null, 2));

    // Check if meeting actually happened (has duration or actual_end_time)
    const duration = appointment.meeting_platform_data?.actual_duration_minutes ||
                     appointment.call_duration?.time_taken || 0;
    const hasEndTime = !!appointment.meeting_platform_data?.actual_end_time;

    console.log('\nMeeting analysis:');
    console.log('  Duration:', duration, 'minutes');
    console.log('  Has End Time:', hasEndTime);

    if (duration > 0 || hasEndTime) {
      console.log('\n✓ Meeting definitely happened! Updating status...');

      // Update the appointment
      const updateResult = await appointmentsCollection.updateOne(
        { _id: appointment._id },
        {
          $set: {
            status: 'COMPLETED',
            'attendance.attendance_status': 'unknown',
          }
        }
      );

      console.log('\nUpdate result:', updateResult);

      // Verify the update
      const updated = await appointmentsCollection.findOne({ _id: appointment._id });
      console.log('\nUpdated appointment:');
      console.log('  Status:', updated.status);
      console.log('  Attendance Status:', updated.attendance?.attendance_status);

      console.log('\n✓ Appointment successfully updated to COMPLETED with UNKNOWN attendance');
    } else {
      console.log('\n✗ Cannot confirm meeting happened (no duration or end time)');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

main();
