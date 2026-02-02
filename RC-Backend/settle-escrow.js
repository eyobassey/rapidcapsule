const mongoose = require("mongoose");

async function settleEscrow() {
  await mongoose.connect("mongodb://127.0.0.1:27017/rapid_capsule?directConnection=true");

  const appointmentId = "697d195bd45476d32c8977a8";

  // Get the appointment
  const appointment = await mongoose.connection.db.collection("appointments")
    .findOne({ _id: new mongoose.Types.ObjectId(appointmentId) });

  if (!appointment) {
    console.log("Appointment not found");
    await mongoose.disconnect();
    return;
  }

  console.log("=== APPOINTMENT ===");
  console.log("ID:", appointment._id.toString());
  console.log("Status:", appointment.status);
  console.log("Payment Source:", appointment.payment_source);
  console.log("Consultation Fee:", appointment.appointment_fee);
  console.log("Platform Fee:", appointment.platform_fee);
  console.log("Total Amount:", appointment.total_amount);
  console.log("Escrow:", JSON.stringify(appointment.escrow, null, 2));

  if (appointment.escrow?.status !== 'held') {
    console.log("\nEscrow not in 'held' status, nothing to settle");
    await mongoose.disconnect();
    return;
  }

  const patientId = appointment.patient.toString();
  const specialistId = appointment.specialist.toString();
  const consultationFee = appointment.appointment_fee || 5000;
  const platformFee = appointment.platform_fee || 500;
  const totalAmount = appointment.total_amount || 5500;
  const paymentSource = appointment.payment_source || 'patient_wallet';

  // Generate batch ID
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const batchCount = await mongoose.connection.db.collection("transaction_batches").countDocuments();
  const batchId = `TB-${dateStr}-${String(batchCount + 1).padStart(6, '0')}`;

  console.log("\n=== CREATING SETTLEMENT ===");
  console.log("Batch ID:", batchId);
  console.log("Settlement Type: completed");
  console.log("Specialist gets:", consultationFee);
  console.log("Platform gets:", platformFee);

  // Get specialist wallet (using correct collection name and field)
  const specialistWallet = await mongoose.connection.db.collection("unified_wallets")
    .findOne({ owner_id: new mongoose.Types.ObjectId(specialistId), owner_type: "SPECIALIST" });

  if (!specialistWallet) {
    console.log("Specialist wallet not found!");
    await mongoose.disconnect();
    return;
  }

  console.log("Specialist Wallet ID:", specialistWallet.wallet_id);
  console.log("Current Balance:", specialistWallet.available_balance);

  // Create the transaction batch
  const batch = {
    batch_id: batchId,
    category: "APPOINTMENT_ESCROW_SETTLE",
    description: "Appointment completed - settlement",
    status: "POSTED",
    reference_type: "appointment_escrow",
    reference_id: new mongoose.Types.ObjectId(appointmentId),
    to_user: new mongoose.Types.ObjectId(specialistId),
    to_wallet: specialistWallet._id,
    metadata: {
      appointment_id: appointmentId,
      patient_id: patientId,
      specialist_id: specialistId,
      payment_source: paymentSource,
      consultation_fee: consultationFee,
      platform_fee: platformFee,
      total_amount: totalAmount,
      settlement_type: "completed",
      original_hold_batch: appointment.escrow.hold_batch_id,
    },
    created_at: now,
    updated_at: now,
  };

  await mongoose.connection.db.collection("transaction_batches").insertOne(batch);
  console.log("Transaction batch created:", batchId);

  // Create ledger entries
  const entries = [
    // Debit escrow (release held funds)
    {
      entry_id: `LE-${Date.now()}-001`,
      batch_id: batchId,
      account_code: "2100.003.001", // LIABILITY_APPOINTMENT_ESCROW
      entry_type: "DEBIT",
      amount: totalAmount,
      description: "Release funds from appointment escrow",
      user_id: new mongoose.Types.ObjectId(specialistId),
      wallet_id: specialistWallet._id,
      status: "POSTED",
      created_at: now,
    },
    // Credit specialist wallet with consultation fee
    {
      entry_id: `LE-${Date.now()}-002`,
      batch_id: batchId,
      account_code: "2100.002.001", // LIABILITY_SPECIALIST_WALLETS
      entry_type: "CREDIT",
      amount: consultationFee,
      description: "Consultation fee earnings",
      user_id: new mongoose.Types.ObjectId(specialistId),
      wallet_id: specialistWallet._id,
      status: "POSTED",
      created_at: now,
    },
    // Credit platform with platform fee
    {
      entry_id: `LE-${Date.now()}-003`,
      batch_id: batchId,
      account_code: "4100.003.001", // REVENUE_PLATFORM_COMMISSION
      entry_type: "CREDIT",
      amount: platformFee,
      description: "Platform fee - appointment completed",
      user_id: new mongoose.Types.ObjectId(specialistId),
      wallet_id: specialistWallet._id,
      status: "POSTED",
      created_at: now,
    },
  ];

  await mongoose.connection.db.collection("ledger_entries").insertMany(entries);
  console.log("Ledger entries created:", entries.length);

  // Update specialist wallet balance
  const newBalance = specialistWallet.available_balance + consultationFee;
  await mongoose.connection.db.collection("unified_wallets").updateOne(
    { _id: specialistWallet._id },
    {
      $inc: {
        available_balance: consultationFee,
        total_credited: consultationFee,
        transaction_count: 1,
      },
      $set: {
        last_credit_at: now,
        last_transaction_at: now,
      },
    }
  );
  console.log("Specialist wallet updated, new balance:", newBalance);

  // Update escrow liability account balance (decrease liability)
  await mongoose.connection.db.collection("accounts").updateOne(
    { code: "2100.003.001" },
    { $inc: { current_balance: -totalAmount } }
  );
  console.log("Escrow account updated (decreased by", totalAmount, ")");

  // Update specialist liability account balance (increase liability = increase what we owe them)
  await mongoose.connection.db.collection("accounts").updateOne(
    { code: "2100.002.001" },
    { $inc: { current_balance: consultationFee } }
  );
  console.log("Specialist liability account updated (increased by", consultationFee, ")");

  // Update platform revenue account balance
  await mongoose.connection.db.collection("accounts").updateOne(
    { code: "4100.003.001" },
    { $inc: { current_balance: platformFee } }
  );
  console.log("Platform revenue account updated (increased by", platformFee, ")");

  // Update appointment escrow status
  await mongoose.connection.db.collection("appointments").updateOne(
    { _id: new mongoose.Types.ObjectId(appointmentId) },
    {
      $set: {
        "escrow.status": "settled",
        "escrow.settled_at": now,
        "escrow.settlement_batch_id": batchId,
        "escrow.settlement_type": "completed",
        "escrow.consultation_fee_settled": consultationFee,
        "escrow.platform_fee_settled": platformFee,
      },
    }
  );
  console.log("Appointment escrow status updated to 'settled'");

  console.log("\n=== SETTLEMENT COMPLETE ===");
  console.log("Specialist received ₦" + consultationFee + " (consultation fee)");
  console.log("Platform received ₦" + platformFee + " (platform fee)");

  await mongoose.disconnect();
}

settleEscrow().catch(console.error);
