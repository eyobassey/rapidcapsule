const mongoose = require('mongoose');

const MONGO_URL = "mongodb://127.0.0.1:27017/rapid_capsule?replicaSet=rs0&directConnection=true";

const patientId = new mongoose.Types.ObjectId('68a69d289c14210371f26eb5');
const specialistId = new mongoose.Types.ObjectId('68a6bbd6905b81ce0b50feec');

// Realistic appointment scenarios for January 2026
const appointmentScenarios = [
  {
    date: new Date('2026-01-03T09:00:00Z'),
    category: 'General Medicine',
    appointment_type: 'Follow-up Consultation',
    duration: 25,
    patient_notes: 'Patient reported mild headaches and fatigue for the past week',
    clinical_notes: [
      {
        content: 'Patient presents with tension-type headache. Blood pressure slightly elevated at 135/85. Advised lifestyle modifications including reduced screen time and regular breaks.',
        completed: true
      },
      {
        content: 'Recommended OTC pain relief (Paracetamol 500mg PRN). Follow-up in 2 weeks if symptoms persist.',
        completed: true
      }
    ],
    private_notes: 'Consider stress assessment if headaches continue'
  },
  {
    date: new Date('2026-01-06T14:30:00Z'),
    category: 'Internal Medicine',
    appointment_type: 'New Patient Consultation',
    duration: 45,
    patient_notes: 'First visit - general health checkup requested',
    clinical_notes: [
      {
        content: 'Comprehensive health assessment performed. Patient in overall good health. BMI: 24.2. Vitals within normal range.',
        completed: true
      },
      {
        content: 'Lab work ordered: CBC, Lipid Panel, FBS, HbA1c, Liver Function Tests, Kidney Function Tests.',
        completed: true
      },
      {
        content: 'Discussed preventive care measures. Patient advised on balanced diet and regular exercise routine.',
        completed: true
      }
    ],
    private_notes: 'Family history of diabetes - monitor glucose levels'
  },
  {
    date: new Date('2026-01-08T11:00:00Z'),
    category: 'General Medicine',
    appointment_type: 'Urgent Care',
    duration: 20,
    patient_notes: 'Experiencing severe stomach pain since yesterday',
    clinical_notes: [
      {
        content: 'Acute gastritis suspected. Abdominal examination shows epigastric tenderness. No rebound or guarding.',
        completed: true
      },
      {
        content: 'Prescribed Omeprazole 20mg daily before breakfast for 14 days. Antacid suspension PRN.',
        completed: true
      }
    ],
    private_notes: 'Rule out H. pylori if symptoms recur'
  },
  {
    date: new Date('2026-01-10T16:00:00Z'),
    category: 'General Medicine',
    appointment_type: 'Lab Results Review',
    duration: 30,
    patient_notes: 'Follow-up to review blood test results',
    clinical_notes: [
      {
        content: 'Lab results reviewed with patient. FBS: 95 mg/dL (normal). HbA1c: 5.4% (excellent). Lipid panel shows borderline high LDL at 135 mg/dL.',
        completed: true
      },
      {
        content: 'Liver and kidney function tests all within normal limits. CBC unremarkable.',
        completed: true
      },
      {
        content: 'Dietary counseling provided for cholesterol management. Recommended increased fiber intake and omega-3 fatty acids.',
        completed: true
      }
    ],
    private_notes: 'Recheck lipid panel in 3 months'
  },
  {
    date: new Date('2026-01-13T10:00:00Z'),
    category: 'Internal Medicine',
    appointment_type: 'Chronic Care Management',
    duration: 35,
    patient_notes: 'Regular checkup for blood pressure monitoring',
    clinical_notes: [
      {
        content: 'Blood pressure today: 128/82 mmHg - improved from previous visit. Patient reports compliance with lifestyle modifications.',
        completed: true
      },
      {
        content: 'Weight stable at 72kg. DASH diet being followed. Walking 30 minutes daily as advised.',
        completed: true
      },
      {
        content: 'Encouraged to continue current regimen. No medication needed at this time. Continue monitoring at home.',
        completed: true
      }
    ],
    private_notes: 'Consider starting low-dose antihypertensive if BP rises above 140/90 on subsequent visits'
  },
  {
    date: new Date('2026-01-15T13:00:00Z'),
    category: 'General Medicine',
    appointment_type: 'Follow-up Consultation',
    duration: 25,
    patient_notes: 'Stomach issues resolved, but experiencing occasional acid reflux',
    clinical_notes: [
      {
        content: 'Gastritis symptoms resolved. Mild GERD symptoms reported - occasional heartburn after meals.',
        completed: true
      },
      {
        content: 'Continue Omeprazole for additional 2 weeks. Advised to avoid spicy foods, caffeine, and late-night eating.',
        completed: true
      },
      {
        content: 'Discussed proper sleep positioning (elevated head). Weight management encouraged.',
        completed: true
      }
    ],
    private_notes: 'Consider endoscopy referral if symptoms persist beyond 4 weeks'
  },
  {
    date: new Date('2026-01-18T15:30:00Z'),
    category: 'Internal Medicine',
    appointment_type: 'Preventive Care',
    duration: 40,
    patient_notes: 'Annual wellness visit',
    clinical_notes: [
      {
        content: 'Annual wellness examination completed. All vaccinations up to date. Flu shot administered today.',
        completed: true
      },
      {
        content: 'Cancer screening discussion: Age-appropriate screenings recommended. Colonoscopy due in 2 years.',
        completed: true
      },
      {
        content: 'Mental health screening: PHQ-9 score 2 (minimal depression). Patient reports good quality of life.',
        completed: true
      },
      {
        content: 'Preventive care plan reviewed. Annual labs scheduled for next January.',
        completed: true
      }
    ],
    private_notes: 'Excellent patient engagement and compliance'
  },
  {
    date: new Date('2026-01-20T09:30:00Z'),
    category: 'General Medicine',
    appointment_type: 'Sick Visit',
    duration: 20,
    patient_notes: 'Cold symptoms - runny nose, sore throat, mild cough',
    clinical_notes: [
      {
        content: 'Upper respiratory infection - viral etiology suspected. Throat examination shows mild pharyngeal erythema. No tonsillar exudate.',
        completed: true
      },
      {
        content: 'Lungs clear to auscultation. No signs of lower respiratory involvement.',
        completed: true
      },
      {
        content: 'Symptomatic treatment prescribed: Rest, fluids, throat lozenges, and decongestant as needed. No antibiotics required.',
        completed: true
      }
    ],
    private_notes: 'Advised to return if fever develops or symptoms worsen'
  }
];

async function seedData() {
  await mongoose.connect(MONGO_URL);
  console.log('Connected to MongoDB');

  const appointmentsCollection = mongoose.connection.db.collection('appointments');
  const prescriptionsCollection = mongoose.connection.db.collection('specialistprescriptions');

  // Create appointments
  const createdAppointments = [];

  for (let i = 0; i < appointmentScenarios.length; i++) {
    const scenario = appointmentScenarios[i];
    const appointmentId = new mongoose.Types.ObjectId();

    // Calculate end time
    const startTime = new Date(scenario.date);
    const endTime = new Date(startTime.getTime() + scenario.duration * 60 * 1000);

    // Format clinical notes with full data
    const clinicalNotes = scenario.clinical_notes.map((note, idx) => ({
      note_id: new mongoose.Types.ObjectId().toString(),
      content: note.content,
      created_at: new Date(startTime.getTime() + (idx + 1) * 5 * 60 * 1000),
      updated_at: new Date(startTime.getTime() + (idx + 1) * 5 * 60 * 1000),
      completed: note.completed,
      created_by: specialistId,
      platform: 'custom'
    }));

    // Generate random meeting IDs
    const meetingId = String(Math.floor(Math.random() * 9000000000) + 1000000000);

    const appointment = {
      _id: appointmentId,
      category: scenario.category,
      start_time: startTime,
      end_time: endTime,
      timezone: 'Africa/Lagos',
      appointment_type: scenario.appointment_type,
      call_duration: {
        time_taken: scenario.duration,
        unit: 'Minutes',
        formatted_string: scenario.duration + ' Minutes'
      },
      patient: patientId,
      specialist: specialistId,
      join_url: 'https://zoom.us/j/' + meetingId,
      start_url: 'https://zoom.us/s/' + meetingId + '?zak=eyJ0eXAi',
      meeting_id: meetingId,
      meeting_class: 'instant',
      meeting_channel: 'zoom',
      meeting_platform_data: {
        uuid: 'ZOOM-' + appointmentId.toString().slice(0, 8),
        host_id: specialistId.toString(),
        duration: scenario.duration
      },
      clinical_notes: clinicalNotes,
      appointment_fee: 15000,
      payment_status: 'successful',
      status: 'COMPLETED',
      meeting_type: 'Video and audio',
      notes: [
        {
          content: 'Appointment completed successfully. Duration: ' + scenario.duration + ' minutes.',
          createdAt: endTime
        }
      ],
      patient_notes: scenario.patient_notes,
      private_notes: scenario.private_notes,
      duration_minutes: scenario.duration,
      created_at: new Date(startTime.getTime() - 24 * 60 * 60 * 1000),
      updated_at: endTime
    };

    await appointmentsCollection.insertOne(appointment);
    createdAppointments.push({ id: appointmentId, scenario, date: startTime });
    console.log('Created appointment ' + (i + 1) + ': ' + scenario.appointment_type + ' on ' + startTime.toDateString());
  }

  // Create prescriptions for appointments 3, 4, and 6 (indexes 2, 3, 5)
  const prescriptionAppointments = [2, 3, 5];
  const prescriptionData = [
    {
      items: [
        { drug_name: 'Omeprazole', strength: '20mg', quantity: 14, dosage: '1 capsule', frequency: 'Once daily', duration: '14 days', instructions: 'Take before breakfast', unit_price: 150 },
        { drug_name: 'Antacid Suspension', strength: '200ml', quantity: 1, dosage: '10ml', frequency: 'As needed', duration: 'PRN', instructions: 'Take after meals when needed', unit_price: 850 }
      ],
      clinical_notes: 'Prescribed for acute gastritis. Follow up if symptoms persist.'
    },
    {
      items: [
        { drug_name: 'Vitamin D3', strength: '1000IU', quantity: 30, dosage: '1 tablet', frequency: 'Once daily', duration: '30 days', instructions: 'Take with food', unit_price: 50 },
        { drug_name: 'Omega-3 Fish Oil', strength: '1000mg', quantity: 30, dosage: '1 softgel', frequency: 'Once daily', duration: '30 days', instructions: 'Take with meals', unit_price: 100 }
      ],
      clinical_notes: 'Preventive supplements for cardiovascular health.'
    },
    {
      items: [
        { drug_name: 'Omeprazole', strength: '20mg', quantity: 14, dosage: '1 capsule', frequency: 'Once daily', duration: '14 days', instructions: 'Continue as previously prescribed', unit_price: 150 }
      ],
      clinical_notes: 'Continuation of treatment for GERD symptoms.'
    }
  ];

  for (let i = 0; i < prescriptionAppointments.length; i++) {
    const aptIndex = prescriptionAppointments[i];
    const apt = createdAppointments[aptIndex];
    const rxData = prescriptionData[i];

    const prescriptionId = new mongoose.Types.ObjectId();
    const dateStr = apt.date.toISOString().slice(0, 10).replace(/-/g, '');
    const prescriptionNumber = 'RX-' + dateStr + '-' + String(i + 1).padStart(4, '0');

    const items = rxData.items.map(function(item) {
      return {
        drug_id: new mongoose.Types.ObjectId(),
        drug_name: item.drug_name,
        generic_name: item.drug_name,
        drug_strength: item.strength,
        manufacturer: 'Generic Pharma',
        quantity: item.quantity,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        instructions: item.instructions,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
        stock_reserved: false,
        patient_accepted: true
      };
    });

    const subtotal = items.reduce(function(sum, item) { return sum + item.total_price; }, 0);

    const prescription = {
      _id: prescriptionId,
      prescription_number: prescriptionNumber,
      specialist_id: specialistId,
      patient_id: patientId,
      items: items,
      subtotal: subtotal,
      discount: 0,
      delivery_fee: 500,
      total_amount: subtotal + 500,
      currency: 'NGN',
      payment_method: 'patient_online',
      payment_status: 'paid',
      payment_reference: 'PAY-' + prescriptionNumber,
      paid_at: new Date(apt.date.getTime() + 60 * 60 * 1000),
      paid_by: 'patient',
      delivery_address: {
        street: '15 Marina Road',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        postal_code: '101001',
        phone: '+234 800 123 4567',
        recipient_name: 'Patient Name'
      },
      status: 'delivered',
      status_history: [
        { status: 'draft', changed_at: apt.date, changed_by: specialistId },
        { status: 'pending_payment', changed_at: new Date(apt.date.getTime() + 30 * 60 * 1000), changed_by: specialistId },
        { status: 'paid', changed_at: new Date(apt.date.getTime() + 60 * 60 * 1000), changed_by: patientId },
        { status: 'processing', changed_at: new Date(apt.date.getTime() + 2 * 60 * 60 * 1000), changed_by: specialistId },
        { status: 'dispensed', changed_at: new Date(apt.date.getTime() + 4 * 60 * 60 * 1000), changed_by: specialistId },
        { status: 'shipped', changed_at: new Date(apt.date.getTime() + 6 * 60 * 60 * 1000), changed_by: specialistId },
        { status: 'delivered', changed_at: new Date(apt.date.getTime() + 24 * 60 * 60 * 1000), changed_by: specialistId }
      ],
      clinical_notes: rxData.clinical_notes,
      patient_notes: 'Please take medications as prescribed. Contact us if you have any questions.',
      dispensed_at: new Date(apt.date.getTime() + 4 * 60 * 60 * 1000),
      dispensed_by: specialistId,
      shipped_at: new Date(apt.date.getTime() + 6 * 60 * 60 * 1000),
      shipping_method: 'Standard Delivery',
      courier_name: 'GIG Logistics',
      tracking_number: 'TRK' + String(Math.floor(Math.random() * 900000) + 100000),
      delivered_at: new Date(apt.date.getTime() + 24 * 60 * 60 * 1000),
      delivery_confirmation: 'Delivered to recipient',
      appointment_id: apt.id,
      patient_response: 'accepted',
      patient_responded_at: new Date(apt.date.getTime() + 45 * 60 * 1000),
      is_refillable: true,
      refill_count: 2,
      refills_used: 0,
      days_supply: 14,
      last_fill_date: new Date(apt.date.getTime() + 4 * 60 * 60 * 1000),
      created_by: specialistId,
      created_at: apt.date,
      updated_at: new Date(apt.date.getTime() + 24 * 60 * 60 * 1000)
    };

    await prescriptionsCollection.insertOne(prescription);
    console.log('Created prescription ' + prescriptionNumber + ' for appointment on ' + apt.date.toDateString());
  }

  // Summary
  console.log('\n========== SEED DATA SUMMARY ==========');
  console.log('Created ' + createdAppointments.length + ' COMPLETED appointments in January 2026');
  console.log('Created ' + prescriptionAppointments.length + ' delivered prescriptions');
  console.log('Patient ID: ' + patientId);
  console.log('Specialist ID: ' + specialistId);
  console.log('\nAppointment dates:');
  createdAppointments.forEach(function(apt, i) {
    console.log('  ' + (i + 1) + '. ' + apt.date.toISOString().slice(0, 10) + ' - ' + apt.scenario.appointment_type + ' (' + apt.scenario.duration + ' min)');
  });

  await mongoose.disconnect();
  console.log('\nDone!');
}

seedData().catch(function(err) {
  console.error('Error:', err);
  process.exit(1);
});
