/**
 * Migration Script: Backfill prescription_number for existing patient_prescription_uploads
 *
 * This script generates sequential prescription numbers for all existing uploads
 * that don't have a prescription_number field.
 *
 * Run with: mongosh rapid_capsule scripts/migrate-prescription-numbers.js
 *
 * IMPORTANT: Run this script during low-traffic periods as it modifies the counter
 */

// Configuration
const DRY_RUN = false; // Set to true to preview changes without applying them
const BATCH_SIZE = 100;

// Helper to format date as YYYYMMDD
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// Get or create counter for a specific date
async function getNextSequence(countersCollection, dateStr) {
  const counterName = `prescription_${dateStr}`;

  const result = await countersCollection.findOneAndUpdate(
    { name: counterName },
    {
      $inc: { sequence: 1 },
      $setOnInsert: {
        prefix: 'RX',
        date_format: 'YYYYMMDD',
      }
    },
    {
      returnDocument: 'after',
      upsert: true,
    }
  );

  return result.sequence;
}

// Main migration function
async function migrate() {
  print('='.repeat(60));
  print('Migration: Backfill prescription_number for patient uploads');
  print('='.repeat(60));
  print(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);
  print('');

  const uploadsCollection = db.patient_prescription_uploads;
  const countersCollection = db.counters;

  // Find all uploads without prescription_number
  const query = {
    $or: [
      { prescription_number: { $exists: false } },
      { prescription_number: null },
      { prescription_number: '' }
    ]
  };

  const totalCount = await uploadsCollection.countDocuments(query);
  print(`Found ${totalCount} uploads without prescription_number`);

  if (totalCount === 0) {
    print('No records to migrate. Exiting.');
    return;
  }

  // Group uploads by date for efficient counter updates
  const uploadsByDate = {};
  const uploads = await uploadsCollection.find(query).sort({ created_at: 1 }).toArray();

  for (const upload of uploads) {
    const dateStr = formatDate(upload.created_at || new Date());
    if (!uploadsByDate[dateStr]) {
      uploadsByDate[dateStr] = [];
    }
    uploadsByDate[dateStr].push(upload);
  }

  print(`Uploads grouped by ${Object.keys(uploadsByDate).length} dates`);
  print('');

  let migrated = 0;
  let errors = 0;

  // Process each date group
  for (const [dateStr, dateUploads] of Object.entries(uploadsByDate)) {
    print(`Processing ${dateUploads.length} uploads for date ${dateStr}...`);

    for (const upload of dateUploads) {
      try {
        // Generate prescription number
        const sequence = await getNextSequence(countersCollection, dateStr);
        const prescriptionNumber = `RX-${dateStr}-${String(sequence).padStart(4, '0')}`;

        if (DRY_RUN) {
          print(`  [DRY RUN] Would assign ${prescriptionNumber} to upload ${upload._id}`);
        } else {
          // Update the upload
          await uploadsCollection.updateOne(
            { _id: upload._id },
            { $set: { prescription_number: prescriptionNumber } }
          );
          print(`  Assigned ${prescriptionNumber} to upload ${upload._id}`);
        }

        migrated++;
      } catch (error) {
        print(`  ERROR processing upload ${upload._id}: ${error.message}`);
        errors++;
      }
    }
  }

  print('');
  print('='.repeat(60));
  print('Migration Summary');
  print('='.repeat(60));
  print(`Total found:   ${totalCount}`);
  print(`Migrated:      ${migrated}`);
  print(`Errors:        ${errors}`);
  print(`Mode:          ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  print('');

  if (DRY_RUN) {
    print('This was a dry run. Set DRY_RUN = false to apply changes.');
  } else {
    print('Migration completed successfully!');
  }
}

// Run migration
migrate().catch(error => {
  print(`Migration failed: ${error.message}`);
  print(error.stack);
});
