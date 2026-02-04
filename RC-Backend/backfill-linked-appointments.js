/**
 * Backfill script to link appointments to health checkups
 *
 * This script finds all appointments that have health_checkup_id set
 * and updates the corresponding health checkup with linked_appointment
 *
 * Run with: node backfill-linked-appointments.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/rapid_capsule?replicaSet=rs0&directConnection=true';

async function backfillLinkedAppointments() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const appointmentsCollection = db.collection('appointments');
    const healthCheckupsCollection = db.collection('health_checkups');

    // Find all appointments that have health_checkup_id set
    const appointmentsWithCheckups = await appointmentsCollection.find({
      health_checkup_id: { $exists: true, $ne: null }
    }).toArray();

    console.log(`Found ${appointmentsWithCheckups.length} appointments with linked health checkups`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const appointment of appointmentsWithCheckups) {
      try {
        const checkupId = appointment.health_checkup_id;
        const appointmentId = appointment._id;

        // Check if health checkup exists
        const checkup = await healthCheckupsCollection.findOne({ _id: checkupId });

        if (!checkup) {
          console.log(`  Skipped: Health checkup ${checkupId} not found for appointment ${appointmentId}`);
          skipped++;
          continue;
        }

        // Check if already linked
        if (checkup.linked_appointment) {
          console.log(`  Skipped: Health checkup ${checkupId} already has linked_appointment`);
          skipped++;
          continue;
        }

        // Update the health checkup with linked_appointment
        await healthCheckupsCollection.updateOne(
          { _id: checkupId },
          { $set: { linked_appointment: appointmentId } }
        );

        console.log(`  Updated: Health checkup ${checkupId} -> Appointment ${appointmentId}`);
        updated++;

      } catch (err) {
        console.error(`  Error processing appointment ${appointment._id}: ${err.message}`);
        errors++;
      }
    }

    console.log('\n=== Backfill Summary ===');
    console.log(`Total appointments with health_checkup_id: ${appointmentsWithCheckups.length}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);

  } catch (error) {
    console.error('Backfill failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

backfillLinkedAppointments();
