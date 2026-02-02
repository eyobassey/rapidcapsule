const mongoose = require("mongoose");

async function check() {
  await mongoose.connect("mongodb://127.0.0.1:27017/rapid_capsule?directConnection=true");

  // List all collections related to financials
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("Financial-related collections:");
  for (const c of collections) {
    if (c.name.includes("wallet") || c.name.includes("ledger") || c.name.includes("account") || c.name.includes("transaction") || c.name.includes("batch")) {
      const count = await mongoose.connection.db.collection(c.name).countDocuments();
      console.log("  ", c.name, ":", count, "documents");
    }
  }

  // Check account balances
  console.log("\nAccounts with non-zero balance:");
  const accounts = await mongoose.connection.db.collection("accounts").find({}).toArray();
  for (const a of accounts) {
    if (a.current_balance && a.current_balance !== 0) {
      console.log("  ", a.code, a.name, ":", a.current_balance);
    }
  }

  // Check all accounts
  console.log("\nAll accounts:");
  for (const a of accounts) {
    console.log("  ", a.code, a.name);
  }

  // Check patient wallets collection
  console.log("\nPatient wallets:");
  const patientWallets = await mongoose.connection.db.collection("patientwallets").find({}).limit(3).toArray();
  for (const w of patientWallets) {
    console.log("  Patient:", w.patient?.toString(), "Balance:", w.balance);
  }

  // Check specialist wallets collection
  console.log("\nSpecialist wallets collection:");
  const specWallets = await mongoose.connection.db.collection("specialistwallets").find({}).limit(3).toArray();
  for (const w of specWallets) {
    console.log("  Specialist:", w.specialist?.toString(), "Balance:", w.balance);
  }

  await mongoose.disconnect();
}

check().catch(console.error);
