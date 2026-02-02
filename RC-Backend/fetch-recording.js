/**
 * Script to fetch recording from Zoom API and update the appointment
 * Run with: node fetch-recording.js
 */

const mongoose = require('mongoose');
const axios = require('axios');

const MONGO_URL = 'mongodb://127.0.0.1:27017/rapid_capsule?replicaSet=rs0&directConnection=true';
const MEETING_ID = '86910566919';

// Zoom credentials from ecosystem.config.js
const ZOOM_ACCOUNT_ID = 'UOt8zMcoRiaIABmqVDrrMQ';
const ZOOM_CLIENT_ID = '62Gv0WbwTROBpKEo0Rm_aA';
const ZOOM_CLIENT_SECRET = '4UfR5KgvYFwr4qhb8lUNuj0aIaaMvCKs';

async function getZoomAccessToken() {
  const authUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`;
  const authHeader = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');

  const response = await axios.post(authUrl, null, {
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return response.data.access_token;
}

async function getMeetingRecordings(accessToken, meetingId) {
  try {
    const url = `https://api.zoom.us/v2/meetings/${meetingId}/recordings`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('No recordings found for this meeting');
      return null;
    }
    throw error;
  }
}

async function getMeetingParticipants(accessToken, meetingId) {
  try {
    const url = `https://api.zoom.us/v2/past_meetings/${meetingId}/participants`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data.participants || [];
  } catch (error) {
    console.log('Could not fetch participants:', error.response?.data || error.message);
    return [];
  }
}

async function main() {
  try {
    console.log('Getting Zoom access token...');
    const accessToken = await getZoomAccessToken();
    console.log('Got access token');

    console.log('\nFetching recordings for meeting:', MEETING_ID);
    const recordings = await getMeetingRecordings(accessToken, MEETING_ID);

    if (recordings) {
      console.log('\nRecordings found:');
      console.log('  Share URL:', recordings.share_url);
      console.log('  Password:', recordings.password);
      console.log('  Duration:', recordings.duration, 'minutes');
      console.log('  Files:', recordings.recording_files?.length || 0);

      if (recordings.recording_files) {
        recordings.recording_files.forEach((f, i) => {
          console.log(`\n  File ${i + 1}:`);
          console.log('    Type:', f.recording_type);
          console.log('    Format:', f.file_type);
          console.log('    Size:', (f.file_size / 1024 / 1024).toFixed(2), 'MB');
          console.log('    Download URL:', f.download_url?.substring(0, 80) + '...');
        });
      }
    }

    console.log('\nFetching participants...');
    const participants = await getMeetingParticipants(accessToken, MEETING_ID);
    console.log('Participants:', participants.length);
    participants.forEach(p => {
      console.log(`  - ${p.name} (${p.user_email || 'no email'}) - ${p.duration} seconds`);
    });

    // Connect to MongoDB and update
    console.log('\nConnecting to MongoDB...');
    await mongoose.connect(MONGO_URL);
    const db = mongoose.connection.db;

    if (recordings) {
      // Find video recording
      const videoFile = recordings.recording_files?.find(
        f => f.recording_type === 'shared_screen_with_speaker_view' || f.file_type === 'MP4'
      );

      // Find transcript
      const transcriptFile = recordings.recording_files?.find(
        f => f.file_type === 'TRANSCRIPT' || f.recording_type === 'audio_transcript'
      );

      const updateData = {
        'recording.recording_url': recordings.share_url,
        'recording.recording_password': recordings.password,
        'recording.recording_duration_minutes': recordings.duration,
        'recording.recording_status': 'available',
      };

      if (videoFile) {
        updateData['recording.recording_download_url'] = videoFile.download_url;
        updateData['recording.recording_file_size'] = String(videoFile.file_size);
      }

      if (transcriptFile) {
        updateData['transcript.transcript_url'] = transcriptFile.download_url;
        updateData['transcript.transcript_status'] = 'available';
      }

      // Update participants if found
      if (participants.length > 0) {
        updateData['participants'] = participants.map(p => ({
          participant_id: p.id || p.user_id,
          name: p.name,
          email: p.user_email,
          user_type: 'unknown',
          join_time: p.join_time ? new Date(p.join_time) : null,
          leave_time: p.leave_time ? new Date(p.leave_time) : null,
          duration_minutes: Math.round(p.duration / 60),
        }));
        updateData['attendance.attendance_status'] = participants.length >= 2 ? 'both' : 'unknown';
      }

      console.log('\nUpdating appointment with recording data...');
      const result = await db.collection('appointments').updateOne(
        { meeting_id: MEETING_ID },
        { $set: updateData }
      );

      console.log('Update result:', result);
      console.log('\n✓ Appointment updated with recording and participant data');
    } else {
      console.log('\nNo recordings to update');
    }

    await mongoose.disconnect();
    console.log('Done!');

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    process.exit(1);
  }
}

main();
