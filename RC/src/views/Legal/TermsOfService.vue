<template>
  <div class="terms-of-service">
    <div class="container">
      <div class="header">
        <h1>Terms of Service</h1>
        <p class="last-updated">Last updated: August 22, 2025</p>
      </div>

      <div class="content">
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Rapid Capsule's telemedicine platform and services 
            ("Service"), you agree to be bound by these Terms of Service ("Terms"). 
            If you disagree with any part of these Terms, you may not access the Service.
          </p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>
            Rapid Capsule provides a telemedicine platform that connects patients 
            with licensed healthcare professionals through video consultations, 
            AI-powered health assessments, prescription management, and health 
            monitoring services.
          </p>
        </section>

        <section>
          <h2>3. Medical Disclaimer</h2>
          <p>
            <strong>The Service is not intended for medical emergencies.</strong> 
            In case of a medical emergency, call emergency services immediately. 
            The Service supplements but does not replace traditional healthcare 
            and should not be used as the sole basis for medical decisions.
          </p>
        </section>

        <section>
          <h2>4. User Accounts and Responsibilities</h2>
          <ul>
            <li>You must provide accurate and complete information</li>
            <li>You are responsible for maintaining account security</li>
            <li>You must not share your account credentials</li>
            <li>You must notify us of any unauthorized use</li>
            <li>You must be at least 18 years old to use the Service</li>
          </ul>
        </section>

        <section>
          <h2>5. Health App Integrations</h2>
          <p>
            By connecting third-party health applications (Apple Health, Google Fit, 
            Samsung Health), you grant us permission to access and use your health 
            data as described in our Privacy Policy. You may revoke these permissions 
            at any time.
          </p>
        </section>

        <section>
          <h2>6. Payment Terms</h2>
          <ul>
            <li>Consultation fees are due at the time of booking</li>
            <li>Prescription costs are separate from consultation fees</li>
            <li>Refunds are provided according to our Refund Policy</li>
            <li>We use secure third-party payment processors</li>
          </ul>
        </section>

        <section>
          <h2>7. Prohibited Uses</h2>
          <p>You may not use our Service to:</p>
          <ul>
            <li>Violate any laws or regulations</li>
            <li>Impersonate others or provide false information</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Attempt to gain unauthorized access</li>
            <li>Use the Service for commercial purposes without permission</li>
          </ul>
        </section>

        <section>
          <h2>8. Intellectual Property</h2>
          <p>
            All content, features, and functionality of the Service are owned by 
            Rapid Capsule and are protected by copyright, trademark, and other 
            intellectual property laws.
          </p>
        </section>

        <section>
          <h2>9. Privacy and Data Protection</h2>
          <p>
            Your privacy is important to us. Please review our Privacy Policy, 
            which also governs your use of the Service, to understand our practices.
          </p>
        </section>

        <section>
          <h2>10. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Rapid Capsule shall not be 
            liable for any indirect, incidental, special, consequential, or 
            punitive damages resulting from your use of the Service.
          </p>
        </section>

        <section>
          <h2>11. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior 
            notice, for conduct that we believe violates these Terms or is harmful 
            to other users, us, or third parties.
          </p>
        </section>

        <section>
          <h2>12. Contact Information</h2>
          <div class="contact-info">
            <p><strong>Email:</strong> info@rapidcapsule.com</p>
            <p><strong>Address:</strong> Rapid Capsule Ltd.<br>
            No 8 New Creation Street, Lekki Phase 1<br>
            Lagos, Nigeria</p>
            <p><strong>Phone:</strong> +234-7052230000</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TermsOfService',
  metaInfo: {
    title: 'Terms of Service - Rapid Capsule',
    meta: [
      {
        name: 'description',
        content: 'Rapid Capsule Terms of Service - Legal terms and conditions for using our telemedicine platform.'
      }
    ]
  }
}
</script>

<style lang="scss" scoped>
.terms-of-service {
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