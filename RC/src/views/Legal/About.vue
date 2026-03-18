<template>
  <div class="about-page">
    <div class="container">
      <div class="header">
        <h1>About Rapid Capsule</h1>
        <p class="last-updated">Your health, connected.</p>
      </div>

      <div class="content">
        <section>
          <h2>Who We Are</h2>
          <p>
            Rapid Capsule is a telemedicine platform that connects patients with
            licensed medical specialists through secure, technology-driven healthcare
            services. We combine artificial intelligence, real-time communication, and
            clinical expertise to deliver quality healthcare that is accessible from
            anywhere.
          </p>
        </section>

        <section>
          <h2>Our Mission</h2>
          <p>
            We believe that quality healthcare should be accessible to everyone,
            regardless of location or circumstance. Our mission is to remove the
            barriers between patients and the care they need by providing a platform
            that is fast, reliable, and built around the patient experience.
          </p>
        </section>

        <section>
          <h2>What We Offer</h2>
          <ul>
            <li>
              <strong>AI-Powered Health Checkups</strong> - Describe your symptoms and
              receive an intelligent preliminary assessment powered by clinically validated
              AI, helping guide you toward the right specialist.
            </li>
            <li>
              <strong>Specialist Consultations</strong> - Get matched with licensed
              healthcare professionals across a wide range of medical specialties,
              and book appointments at times that work for you.
            </li>
            <li>
              <strong>Video Consultations</strong> - Consult with your specialist
              face-to-face through secure, high-quality video calls without leaving
              your home.
            </li>
            <li>
              <strong>Prescription Management</strong> - Receive and manage digital
              prescriptions directly through the platform, with options for pharmacy
              fulfillment and delivery.
            </li>
            <li>
              <strong>Vital Monitoring</strong> - Track key health metrics such as
              blood pressure, heart rate, blood glucose, and more, giving you and
              your healthcare provider a clearer picture of your health over time.
            </li>
            <li>
              <strong>Health Device Integration</strong> - Connect your wearable
              devices and health apps to sync your health data seamlessly into your
              Rapid Capsule profile.
            </li>
          </ul>
        </section>

        <section>
          <h2>How It Works</h2>
          <div class="steps">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <strong>Sign Up</strong>
                <p>Create your account and complete your health profile in minutes.</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <strong>Describe Your Symptoms</strong>
                <p>Use our AI-powered health checkup to describe what you are experiencing and get a preliminary assessment.</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <strong>Get Matched</strong>
                <p>Based on your assessment, we recommend the right specialist for your needs.</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">4</div>
              <div class="step-content">
                <strong>Consult</strong>
                <p>Meet with your specialist via secure video consultation at your scheduled time.</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">5</div>
              <div class="step-content">
                <strong>Receive Care</strong>
                <p>Get your prescriptions, follow-up plans, and ongoing health monitoring all in one place.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2>Your Privacy and Security</h2>
          <p>
            We take the protection of your personal and medical information seriously.
            All data is encrypted and handled in accordance with healthcare privacy
            standards. For full details, please review our
            <router-link to="/privacy-policy">Privacy Policy</router-link> and
            <router-link to="/terms-of-service">Terms of Service</router-link>.
          </p>
        </section>

        <section>
          <h2>Contact Us</h2>
          <div class="contact-info">
            <p>
              We would love to hear from you. Whether you have questions, feedback,
              or need support, our team is here to help.
            </p>
            <p><strong>Email:</strong> support@rapidcapsule.com</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'About',
  metaInfo: {
    title: 'About - Rapid Capsule',
    meta: [
      {
        name: 'description',
        content: 'Learn about Rapid Capsule - a telemedicine platform connecting patients with medical specialists through AI-powered health assessments, video consultations, and more.'
      }
    ]
  }
}
</script>

<style lang="scss" scoped>
.about-page {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 2rem 0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.header h1 {
  font-size: 2.5rem;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.last-updated {
  color: #64748b;
  font-size: 1rem;
}

.content {
  background: white;
  border-radius: 12px;
  padding: 3rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

section {
  margin-bottom: 2.5rem;
}

h2 {
  font-size: 1.5rem;
  color: #1e293b;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
}

p {
  color: #475569;
  line-height: 1.6;
  margin-bottom: 1rem;
}

ul {
  color: #475569;
  line-height: 1.6;
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.5rem;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1rem;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.step-number {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
}

.step-content {
  flex: 1;
}

.step-content strong {
  color: #1e293b;
  font-size: 1.05rem;
}

.step-content p {
  margin-top: 0.25rem;
  margin-bottom: 0;
}

.contact-info {
  background: #f1f5f9;
  padding: 1.5rem;
  border-radius: 8px;
  margin: 1rem 0;
}

.contact-info p {
  margin-bottom: 0.5rem;
}

strong {
  color: #1e293b;
}

a {
  color: #3b82f6;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 1rem;
  }

  .content {
    padding: 1.5rem;
  }

  .header h1 {
    font-size: 2rem;
  }
}
</style>
