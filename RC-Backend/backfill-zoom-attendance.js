/**
 * Backfill Script: Fetch Zoom attendance data for past appointments
 *
 * This script:
 * 1. Finds appointments with meeting_id that are OPEN or MISSED
 * 2. Fetches participant data from Zoom API
 * 3. Updates appointments with attendance info and correct status
 *
 * Run: node backfill-zoom-attendance.js
 */

const mongoose = require('mongoose');
const axios = require('axios');

// MongoDB connection
const MONGO_URL = 'mongodb://127.0.0.1:27017/rapid_capsule?replicaSet=rs0&directConnection=true';

// Zoom credentials
const ZOOM_ACCOUNT_ID = 'UOt8zMcoRiaIABmqVDrrMQ';
const ZOOM_CLIENT_ID = '62Gv0WbwTROBpKEo0Rm_aA';
const ZOOM_CLIENT_SECRET = '4UfR5KgvYFwr4qhb8lUNuj0aIaaMvCKs';

let accessToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const authUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`;
  const authHeader = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');

  const response = await axios.post(authUrl, null, {
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  accessToken = response.data.access_token;
  tokenExpiry = Date.now() + ((response.data.expires_in - 300) * 1000);
  return accessToken;
}

async function getPastMeetingParticipants(meetingId, retries = 3) {
  try {
    const token = await getAccessToken();

    // Double-encode UUID if it contains slashes
    const encodedMeetingId = meetingId.includes('/')
      ? encodeURIComponent(encodeURIComponent(meetingId))
      : meetingId;

    const url = `https://api.zoom.us/v2/past_meetings/${encodedMeetingId}/participants`;
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data?.participants || [];
  } catch (error) {
    // Rate limit - wait and retry
    if (error.response?.status === 429 && retries > 0) {
      console.log(`  Rate limited, waiting 2s and retrying...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return getPastMeetingParticipants(meetingId, retries - 1);
    }
    if (error.response?.data?.message?.includes('rate limit') && retries > 0) {
      console.log(`  Rate limited, waiting 2s and retrying...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return getPastMeetingParticipants(meetingId, retries - 1);
    }
    if (error.response?.status === 404) {
      console.log(`  No participants found (meeting may not have occurred)`);
      return [];
    }
    if (error.response?.status === 3001) {
      console.log(`  Meeting does not exist or has expired`);
      return [];
    }
    console.log(`  Error fetching participants: ${error.response?.data?.message || error.message}`);
    return [];
  }
}

async function getPastMeetingDetails(meetingId) {
  try {
    const token = await getAccessToken();
    const url = `https://api.zoom.us/v2/past_meetings/${meetingId}`;
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    return null;
  }
}

function determineAttendanceStatus(participants) {
  if (!participants || participants.length === 0) {
    return 'none';
  }
  if (participants.length >= 2) {
    return 'both';
  }
  return 'both'; // Assume both if any participants exist
}

async function run() {
  console.log('='.repeat(60));
  console.log('Zoom Attendance Backfill Script');
  console.log('='.repeat(60));

  // Connect to MongoDB
  console.log('\nConnecting to MongoDB...');
  await mongoose.connect(MONGO_URL);
  console.log('Connected!\n');

  const db = mongoose.connection.db;
  const appointmentsCollection = db.collection('appointments');

  // Find appointments with meeting_id that need updating
  const appointments = await appointmentsCollection.find({
    meeting_id: { $exists: true, $ne: null, $ne: '' },
    $or: [
      { status: 'OPEN' },
      { status: 'MISSED' },
      { 'attendance.attendance_status': { $exists: false } },
    ],
    start_time: { $lt: new Date() }, // Only past appointments
  }).toArray();

  console.log(`Found ${appointments.length} appointments to process\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const apt of appointments) {
    console.log(`Processing: ${apt._id}`);
    console.log(`  Meeting ID: ${apt.meeting_id}`);
    console.log(`  Current Status: ${apt.status}`);
    console.log(`  Start Time: ${apt.start_time}`);

    try {
      // Fetch participants from Zoom
      const participants = await getPastMeetingParticipants(apt.meeting_id);
      console.log(`  Participants found: ${participants.length}`);

      if (participants.length > 0) {
        // Get meeting details for duration
        const meetingDetails = await getPastMeetingDetails(apt.meeting_id);

        // Map participants
        const mappedParticipants = participants.map(p => ({
          participant_id: p.id || p.user_id,
          name: p.name,
          email: p.user_email,
          user_type: 'unknown',
          join_time: p.join_time ? new Date(p.join_time) : null,
          leave_time: p.leave_time ? new Date(p.leave_time) : null,
          duration_minutes: p.duration,
        }));

        const attendanceStatus = determineAttendanceStatus(participants);
        const totalDuration = participants.reduce((sum, p) => sum + (p.duration || 0), 0);
        const avgDuration = Math.round(totalDuration / participants.length);

        // Update appointment
        await appointmentsCollection.updateOne(
          { _id: apt._id },
          {
            $set: {
              status: 'COMPLETED',
              'attendance.patient_joined': true,
              'attendance.specialist_joined': true,
              'attendance.both_joined': attendanceStatus === 'both',
              'attendance.attendance_status': attendanceStatus,
              participants: mappedParticipants,
              'call_duration.time_taken': meetingDetails?.duration || avgDuration,
              'call_duration.unit': 'Minutes',
              'call_duration.formatted_string': `${meetingDetails?.duration || avgDuration} Minutes`,
              'meeting_platform_data.actual_start_time': meetingDetails?.start_time ? new Date(meetingDetails.start_time) : null,
              'meeting_platform_data.actual_end_time': meetingDetails?.end_time ? new Date(meetingDetails.end_time) : null,
              'meeting_platform_data.actual_duration_minutes': meetingDetails?.duration,
              updated_at: new Date(),
            },
          }
        );

        console.log(`  ✅ Updated to COMPLETED (${participants.length} participants, ${avgDuration} min avg)`);
        updated++;
      } else {
        // No participants - check if it should be MISSED
        const gracePeriod = 2 * 60 * 60 * 1000; // 2 hours
        const cutoffTime = new Date(Date.now() - gracePeriod);

        if (new Date(apt.start_time) < cutoffTime) {
          await appointmentsCollection.updateOne(
            { _id: apt._id },
            {
              $set: {
                status: 'MISSED',
                'attendance.attendance_status': 'none',
                'attendance.patient_joined': false,
                'attendance.specialist_joined': false,
                'attendance.both_joined': false,
                updated_at: new Date(),
              },
            }
          );
          console.log(`  ⚠️  Marked as MISSED (no participants, past grace period)`);
          updated++;
        } else {
          console.log(`  ⏳ Skipped (still within grace period)`);
          skipped++;
        }
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      errors++;
    }

    console.log('');

    // Rate limiting - wait 500ms between requests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('='.repeat(60));
  console.log('Summary:');
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log('='.repeat(60));

  await mongoose.disconnect();
  console.log('\nDone!');
}

run().catch(console.error);
