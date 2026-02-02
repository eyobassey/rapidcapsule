/**
 * Cleanup script to remove duplicate consultation services with hyphenated slugs
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rapidcapsule';

async function cleanup() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected');

    // Delete records with hyphenated slugs
    const result = await mongoose.connection.db.collection('consultation_services').deleteMany({
      slug: { $regex: /-/ }
    });
    console.log('Deleted', result.deletedCount, 'records with hyphenated slugs');

    // Show remaining records
    const remaining = await mongoose.connection.db.collection('consultation_services').find({}).toArray();
    console.log('\nRemaining records:');
    remaining.forEach(r => console.log(`  - ${r.name} (${r.slug})`));
    console.log(`\nTotal: ${remaining.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDone');
    process.exit(0);
  }
}

cleanup();
