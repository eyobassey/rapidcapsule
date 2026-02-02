/**
 * One-time migration script
 * Run with: npx ts-node run-migration.ts
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { MigrationService } from './src/modules/accounting/services/migration.service';

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
