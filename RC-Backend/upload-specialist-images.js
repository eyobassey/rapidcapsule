const mongoose = require('mongoose');
const AWS = require('aws-sdk');
const https = require('https');
const http = require('http');
const path = require('path');

// Load credentials from ecosystem.config.js
const ecosystemConfig = require(path.resolve(__dirname, '../ecosystem.config.js'));
const backendEnv = ecosystemConfig.apps.find(app => app.name === 'RC-Backend')?.env || {};

// S3 Configuration - credentials loaded from ecosystem.config.js
const s3 = new AWS.S3({
  accessKeyId: backendEnv.AWS_ACCESS_KEY,
  secretAccessKey: backendEnv.AWS_ACCESS_SECRET_KEY,
  region: 'us-east-2'
});

const BUCKET_NAME = backendEnv.AWS_BUCKET_NAME || 'rapidcapsules';

// Stock doctor images from public sources (Unsplash - free to use)
const stockImages = {
  male: [
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face', // Male doctor with stethoscope
    'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face', // Male doctor smiling
  ],
  female: [
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face', // Female doctor
    'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop&crop=face', // Female doctor smiling
    'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&h=400&fit=crop&crop=face', // Female doctor with glasses
  ]
};

// Specialists without images
const specialistsToUpdate = [
  { id: '697474df7ac87d1f1f00f1bd', name: 'Sarah Thompson', gender: 'female' },
  { id: '697474eef6100f649d659fc6', name: 'James Okonkwo', gender: 'male' },
  { id: '697474eef6100f649d659fc9', name: 'Amara Nwosu', gender: 'female' },
  { id: '697474eef6100f649d659fcc', name: 'David Chen', gender: 'male' },
  { id: '697474eef6100f649d659fcf', name: 'Elena Rodriguez', gender: 'female' },
];

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      // Handle redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadImage(response.headers.location).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error('Failed to download image: ' + response.statusCode));
        return;
      }

      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

async function uploadToS3(buffer, key) {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: 'image/jpeg',
  };

  const result = await s3.upload(params).promise();
  return result.Location;
}

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/rapid_capsule?replicaSet=rs0&directConnection=true');
  console.log('Connected to MongoDB');

  let maleIndex = 0;
  let femaleIndex = 0;

  for (const specialist of specialistsToUpdate) {
    try {
      console.log('\nProcessing: ' + specialist.name + ' (' + specialist.gender + ')');

      // Select image based on gender
      let imageUrl;
      if (specialist.gender === 'male') {
        imageUrl = stockImages.male[maleIndex % stockImages.male.length];
        maleIndex++;
      } else {
        imageUrl = stockImages.female[femaleIndex % stockImages.female.length];
        femaleIndex++;
      }

      console.log('  Downloading from: ' + imageUrl.substring(0, 60) + '...');
      const imageBuffer = await downloadImage(imageUrl);
      console.log('  Downloaded: ' + imageBuffer.length + ' bytes');

      // Upload to S3
      const timestamp = Date.now();
      const s3Key = timestamp + '-' + specialist.id + '-profilePhoto.jpeg';
      console.log('  Uploading to S3: ' + s3Key);
      const s3Url = await uploadToS3(imageBuffer, s3Key);
      console.log('  S3 URL: ' + s3Url);

      // Update database
      const result = await mongoose.connection.db.collection('users').updateOne(
        { _id: new mongoose.Types.ObjectId(specialist.id) },
        { $set: { 'profile.profile_photo': s3Key } }
      );
      console.log('  Database updated: ' + result.modifiedCount + ' document(s)');

    } catch (error) {
      console.error('  Error processing ' + specialist.name + ': ' + error.message);
    }
  }

  await mongoose.disconnect();
  console.log('\nDone!');
}

main().catch(console.error);
