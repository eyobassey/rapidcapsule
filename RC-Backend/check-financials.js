const mongoose = require("mongoose");

async function checkFinancials() {
  const uri = "mongodb://127.0.0.1:27017/rapid_capsule?directConnection=true";
  await mongoose.connect(uri);

  // Get recent appointments with escrow
  const appointments = await mongoose.connection.db.collection("appointments")
    .find({ "escrow.status": { $exists: true, $ne: "none" } })
    .sort({ updated_at: -1 })
    .limit(5)
    .toArray();

  console.log("\n========================================");
  console.log("  APPOINTMENT FINANCIAL REPORT");
  console.log("========================================");

  if (appointments.length === 0) {
    console.log("\nNo appointments with active escrow found.");

    const recentApts = await mongoose.connection.db.collection("appointments")
      .find({})
      .sort({ updated_at: -1 })
      .limit(3)
      .toArray();

    console.log("\nMost Recent Appointments:");
    for (const apt of recentApts) {
      console.log("\n- ID:", apt._id.toString());
      console.log("  Status:", apt.status);
      console.log("  Payment Status:", apt.payment_status);
      console.log("  Payment Source:", apt.payment_source);
      console.log("  Fee:", apt.appointment_fee, "Platform:", apt.platform_fee, "Total:", apt.total_amount);
      console.log("  Escrow:", JSON.stringify(apt.escrow));
    }
  }

  for (const apt of appointments) {
    console.log("\n┌─────────────────────────────────────────");
    console.log("│ Appointment:", apt._id.toString());
    console.log("├─────────────────────────────────────────");
    console.log("│ Status:", apt.status, "| Payment:", apt.payment_status);
    console.log("│ Payment Source:", apt.payment_source);
    console.log("│ Fees: Consultation ₦" + (apt.appointment_fee || 0) + " + Platform ₦" + (apt.platform_fee || 0) + " = Total ₦" + (apt.total_amount || 0));
    console.log("│ Escrow Status:", apt.escrow?.status);
    console.log("│ Hold Batch:", apt.escrow?.hold_batch_id || "N/A");
    console.log("│ Settlement Batch:", apt.escrow?.settlement_batch_id || "N/A");
    console.log("│ Settlement Type:", apt.escrow?.settlement_type || "N/A");
    console.log("└─────────────────────────────────────────");
  }

  // Get transaction batches
  const batches = await mongoose.connection.db.collection("transactionbatches")
    .find({ reference_type: "appointment_escrow" })
    .sort({ created_at: -1 })
    .limit(10)
    .toArray();

  console.log("\n\n========================================");
  console.log("  ESCROW TRANSACTION BATCHES");
  console.log("========================================");

  if (batches.length === 0) {
    console.log("\nNo escrow transaction batches found yet.");
  }

  for (const batch of batches) {
    console.log("\n┌ Batch:", batch.batch_id);
    console.log("│ Category:", batch.category);
    console.log("│ Status:", batch.status);
    console.log("│ Description:", batch.description);
    console.log("│ Appointment:", batch.reference_id?.toString());
    console.log("│ Payment Source:", batch.metadata?.payment_source);
    console.log("│ Amounts: Consultation ₦" + (batch.metadata?.consultation_fee || 0) + " + Platform ₦" + (batch.metadata?.platform_fee || 0));
    console.log("└ Settlement:", batch.metadata?.settlement_type || "N/A");
  }

  // Get ledger entries for escrow batches
  if (batches.length > 0) {
    const ledgerEntries = await mongoose.connection.db.collection("ledgerentries")
      .find({ batch_id: { $in: batches.map(b => b.batch_id) } })
      .sort({ batch_id: 1, created_at: 1 })
      .toArray();

    console.log("\n\n========================================");
    console.log("  LEDGER ENTRIES (Double-Entry)");
    console.log("========================================");

    let currentBatch = "";
    for (const entry of ledgerEntries) {
      if (entry.batch_id !== currentBatch) {
        currentBatch = entry.batch_id;
        console.log("\n--- Batch:", currentBatch, "---");
      }
      const sign = entry.entry_type === "DEBIT" ? "DR" : "CR";
      console.log("  " + sign + " " + entry.account_code + " ₦" + entry.amount + " - " + (entry.description || "").substring(0, 40));
    }
  }

  // Check wallet balances
  const wallets = await mongoose.connection.db.collection("unifiedwallets").find({}).toArray();

  console.log("\n\n========================================");
  console.log("  WALLET BALANCES");
  console.log("========================================");

  for (const wallet of wallets) {
    console.log("│ " + (wallet.owner_type || "unknown").padEnd(12) + " │ ₦" + (wallet.available_balance || 0).toString().padStart(10) + " │ " + wallet.wallet_id);
  }

  // Check key account balances
  const accounts = await mongoose.connection.db.collection("accounts")
    .find({ code: { $in: ["2100.003.001", "2100.001.001", "2100.002.001", "4100.001.001", "4100.003.001"] } })
    .toArray();

  console.log("\n\n========================================");
  console.log("  KEY ACCOUNT BALANCES");
  console.log("========================================");

  for (const acc of accounts) {
    console.log("│ " + acc.code + " │ " + (acc.name || "").padEnd(30) + " │ ₦" + (acc.current_balance || 0));
  }

  await mongoose.disconnect();
}

checkFinancials().catch(console.error);
