/**
 * One-time migration script
 * Run with: node run-migration.js
 */
// Set environment variables from ecosystem.config.js
process.env.MONGO_URL = "mongodb://127.0.0.1:27017/rapid_capsule?replicaSet=rs0&directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.5.6";
process.env.PORT = "5020";
process.env.JWTKEY = "theBestKepSecret";
process.env.NODE_ENV = "production";

const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/src/app.module');
const { MigrationService } = require('./dist/src/modules/accounting/services/migration.service');

async function runMigration() {
  console.log('Starting migration...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const migrationService = app.get(MigrationService);

  // Check status first
  const isComplete = await migrationService.isMigrationComplete();
  if (isComplete) {
    console.log('Migration has already been completed.');

    // Verify existing migration
    const verification = await migrationService.verifyMigration();
    console.log('\nVerification Result:');
    console.log(JSON.stringify(verification, null, 2));

    await app.close();
    return;
  }

  // Run the migration
  console.log('Running migration...\n');
  const result = await migrationService.runMigration();

  console.log('\nMigration Result:');
  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    // Verify migration
    console.log('\nVerifying migration...');
    const verification = await migrationService.verifyMigration();
    console.log('\nVerification Result:');
    console.log(JSON.stringify(verification, null, 2));
  }

  await app.close();
}

runMigration().catch(console.error);
