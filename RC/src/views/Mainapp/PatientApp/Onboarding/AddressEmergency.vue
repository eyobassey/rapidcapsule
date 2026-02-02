<template>
  <div class="step-container">
    <div class="step-scroll">
      <div class="step-content">
        <!-- Step Header -->
        <div class="step-header">
          <button class="back-btn" @click="goBack">
            <v-icon name="hi-arrow-left" scale="0.9" />
            <span>Back</span>
          </button>
          <div class="step-info">
            <span class="step-badge required">Step 3 of 9 - Required</span>
            <h1 class="step-title">Address & Emergency Contact</h1>
            <p class="step-description">
              Add your address and emergency contacts who can be reached on your behalf.
            </p>
          </div>
        </div>

        <!-- Form Content -->
        <div class="form-sections">
          <!-- Address Section -->
          <div class="form-section">
            <h2 class="section-title">Your Address</h2>
            <div class="form-grid">
              <div class="form-group full-width">
                <label class="form-label">Street Address</label>
                <input
                  type="text"
                  v-model="addressEmergency.address"
                  class="form-input"
                  placeholder="Enter your street address"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Country</label>
                <select v-model="addressEmergency.country" class="form-select" @change="onCountryChange">
                  <option value="">Select country</option>
                  <option v-for="country in countries" :key="country.code" :value="country.name">
                    {{ country.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">State/Province</label>
                <select v-model="addressEmergency.state" class="form-select" :disabled="!addressEmergency.country">
                  <option value="">Select state</option>
                  <option v-for="state in availableStates" :key="state" :value="state">
                    {{ state }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">City</label>
                <input
                  type="text"
                  v-model="addressEmergency.city"
                  class="form-input"
                  placeholder="Enter city"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Postal Code</label>
                <input
                  type="text"
                  v-model="addressEmergency.postal_code"
                  class="form-input"
                  placeholder="e.g., 100001"
                />
              </div>
            </div>
          </div>

          <!-- Primary Emergency Contact Section -->
          <div class="form-section">
            <div class="section-header">
              <div>
                <h2 class="section-title">Primary Emergency Contact</h2>
                <p class="section-description">
                  This person will be contacted first in case of a medical emergency.
                </p>
              </div>
            </div>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label required">Full Name</label>
                <input
                  type="text"
                  v-model="addressEmergency.emergency_contact.name"
                  class="form-input"
                  placeholder="Contact's full name"
                />
              </div>
              <div class="form-group">
                <label class="form-label required">Relationship</label>
                <select v-model="addressEmergency.emergency_contact.relationship" class="form-select">
                  <option value="">Select relationship</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Child">Child</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="form-group full-width">
                <label class="form-label required">Phone Number</label>
                <div class="phone-input-group">
                  <select v-model="addressEmergency.emergency_contact.phone_country_code" class="country-code-select">
                    <option value="+234">+234 (NG)</option>
                    <option value="+233">+233 (GH)</option>
                    <option value="+254">+254 (KE)</option>
                    <option value="+27">+27 (ZA)</option>
                    <option value="+1">+1 (US)</option>
                    <option value="+44">+44 (UK)</option>
                  </select>
                  <input
                    type="tel"
                    v-model="addressEmergency.emergency_contact.phone_number"
                    class="form-input phone-input"
                    placeholder="8012345678"
                    maxlength="10"
                  />
                </div>
              </div>
              <div class="form-group full-width">
                <label class="form-label">Email (Optional)</label>
                <input
                  type="email"
                  v-model="addressEmergency.emergency_contact.email"
                  class="form-input"
                  placeholder="contact@email.com"
                />
              </div>

              <!-- Address Same as Patient Checkbox -->
              <div class="form-group full-width">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    v-model="primaryContactSameAddress"
                    @change="onPrimarySameAddressChange"
                  />
                  <span class="checkbox-text">Same address as patient</span>
                </label>
              </div>

              <!-- Primary Contact Address Fields -->
              <template v-if="!primaryContactSameAddress">
                <div class="form-group full-width">
                  <label class="form-label">Street Address</label>
                  <input
                    type="text"
                    v-model="addressEmergency.emergency_contact.address"
                    class="form-input"
                    placeholder="Contact's street address"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Country</label>
                  <select
                    v-model="addressEmergency.emergency_contact.country"
                    class="form-select"
                    @change="onPrimaryContactCountryChange"
                  >
                    <option value="">Select country</option>
                    <option v-for="country in countries" :key="country.code" :value="country.name">
                      {{ country.name }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">State/Province</label>
                  <select
                    v-model="addressEmergency.emergency_contact.state"
                    class="form-select"
                    :disabled="!addressEmergency.emergency_contact.country"
                  >
                    <option value="">Select state</option>
                    <option v-for="state in primaryContactStates" :key="state" :value="state">
                      {{ state }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">City</label>
                  <input
                    type="text"
                    v-model="addressEmergency.emergency_contact.city"
                    class="form-input"
                    placeholder="Enter city"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Postal Code</label>
                  <input
                    type="text"
                    v-model="addressEmergency.emergency_contact.postal_code"
                    class="form-input"
                    placeholder="e.g., 100001"
                  />
                </div>
              </template>
            </div>
          </div>

          <!-- Additional Emergency Contacts Section -->
          <div class="form-section">
            <div class="section-header">
              <div>
                <h2 class="section-title">Additional Emergency Contacts</h2>
                <p class="section-description">
                  Add more contacts who can be reached if the primary contact is unavailable.
                </p>
              </div>
            </div>

            <!-- Existing additional contacts -->
            <div v-if="addressEmergency.additional_contacts.length > 0" class="contacts-list">
              <div
                v-for="(contact, index) in addressEmergency.additional_contacts"
                :key="index"
                class="contact-card"
              >
                <div class="contact-avatar">
                  <v-icon name="hi-user" scale="1" />
                </div>
                <div class="contact-info">
                  <h4>{{ contact.name }}</h4>
                  <p>{{ contact.relationship }} • {{ formatPhoneNumber(contact) }}</p>
                  <p v-if="contact.city || contact.country" class="contact-address">
                    {{ [contact.city, contact.state, contact.country].filter(Boolean).join(', ') }}
                  </p>
                </div>
                <button class="edit-btn" @click="editAdditionalContact(index)">
                  <v-icon name="hi-pencil" scale="0.8" />
                </button>
                <button class="remove-btn" @click="removeAdditionalContact(index)">
                  <v-icon name="hi-trash" scale="0.8" />
                </button>
              </div>
            </div>

            <!-- Add another contact button -->
            <button class="add-contact-btn" @click="openAddContactModal">
              <v-icon name="hi-plus" scale="0.8" />
              <span>Add Another Emergency Contact</span>
            </button>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="step-footer">
          <div class="footer-info">
            <v-icon name="hi-information-circle" scale="0.8" />
            <span>Fields marked with * are required</span>
          </div>
          <div class="footer-actions">
            <button class="btn-secondary" @click="saveAndExit">
              Save & Exit
            </button>
            <button class="btn-primary" @click="saveAndContinue" :disabled="!isValid || isSaving">
              <span>{{ isSaving ? 'Saving...' : 'Continue' }}</span>
              <v-icon v-if="!isSaving" name="hi-arrow-right" scale="0.8" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Additional Contact Modal -->
    <div v-if="showContactModal" class="modal-overlay" @click.self="closeContactModal">
      <div class="contact-modal">
        <div class="modal-header">
          <h3>{{ isEditingContact ? 'Edit Contact' : 'Add Emergency Contact' }}</h3>
          <button class="close-btn" @click="closeContactModal">
            <v-icon name="hi-x" scale="1" />
          </button>
        </div>

        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group full-width">
              <label class="form-label required">Full Name</label>
              <input
                type="text"
                v-model="contactFormData.name"
                class="form-input"
                placeholder="Contact's full name"
              />
            </div>
            <div class="form-group full-width">
              <label class="form-label required">Relationship</label>
              <select v-model="contactFormData.relationship" class="form-select">
                <option value="">Select relationship</option>
                <option value="Spouse">Spouse</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Child">Child</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group full-width">
              <label class="form-label required">Phone Number</label>
              <div class="phone-input-group">
                <select v-model="contactFormData.phone_country_code" class="country-code-select">
                  <option value="+234">+234 (NG)</option>
                  <option value="+233">+233 (GH)</option>
                  <option value="+254">+254 (KE)</option>
                  <option value="+27">+27 (ZA)</option>
                  <option value="+1">+1 (US)</option>
                  <option value="+44">+44 (UK)</option>
                </select>
                <input
                  type="tel"
                  v-model="contactFormData.phone_number"
                  class="form-input phone-input"
                  placeholder="8012345678"
                  maxlength="10"
                />
              </div>
            </div>
            <div class="form-group full-width">
              <label class="form-label">Email (Optional)</label>
              <input
                type="email"
                v-model="contactFormData.email"
                class="form-input"
                placeholder="contact@email.com"
              />
            </div>

            <!-- Same Address Checkbox -->
            <div class="form-group full-width">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  v-model="contactFormData.same_address"
                  @change="onModalSameAddressChange"
                />
                <span class="checkbox-text">Same address as patient</span>
              </label>
            </div>

            <!-- Contact Address Fields -->
            <template v-if="!contactFormData.same_address">
              <div class="form-group full-width">
                <label class="form-label">Street Address</label>
                <input
                  type="text"
                  v-model="contactFormData.address"
                  class="form-input"
                  placeholder="Contact's street address"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Country</label>
                <select
                  v-model="contactFormData.country"
                  class="form-select"
                  @change="onModalContactCountryChange"
                >
                  <option value="">Select country</option>
                  <option v-for="country in countries" :key="country.code" :value="country.name">
                    {{ country.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">State/Province</label>
                <select
                  v-model="contactFormData.state"
                  class="form-select"
                  :disabled="!contactFormData.country"
                >
                  <option value="">Select state</option>
                  <option v-for="state in modalContactStates" :key="state" :value="state">
                    {{ state }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">City</label>
                <input
                  type="text"
                  v-model="contactFormData.city"
                  class="form-input"
                  placeholder="Enter city"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Postal Code</label>
                <input
                  type="text"
                  v-model="contactFormData.postal_code"
                  class="form-input"
                  placeholder="e.g., 100001"
                />
              </div>
            </template>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="closeContactModal">Cancel</button>
          <button class="btn-primary" @click="saveAdditionalContact" :disabled="!isContactFormValid">
            {{ isEditingContact ? 'Update' : 'Add' }} Contact
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, inject, watch, getCurrentInstance } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { usePatientOnboardingState } from './composables/usePatientOnboardingState';

const router = useRouter();
const store = useStore();
const $http = inject('$http');
const $toast = getCurrentInstance().appContext.config.globalProperties.$toast;

const {
  addressEmergency,
  completeStep,
  saveProgress,
  goToStep,
} = usePatientOnboardingState();

const isSaving = ref(false);
const showContactModal = ref(false);
const isEditingContact = ref(false);
const editingContactIndex = ref(-1);
// Initialize from loaded data
const primaryContactSameAddress = ref(addressEmergency.emergency_contact?.same_as_patient || false);

// Countries and their states
const countries = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
];

const statesByCountry = {
  Nigeria: [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)', 'Gombe',
    'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
    'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
    'Taraba', 'Yobe', 'Zamfara'
  ],
  Ghana: [
    'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern', 'Greater Accra',
    'North East', 'Northern', 'Oti', 'Savannah', 'Upper East', 'Upper West', 'Volta',
    'Western', 'Western North'
  ],
  Kenya: [
    'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu', 'Garissa',
    'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho', 'Kiambu', 'Kilifi',
    'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia', 'Lamu', 'Machakos',
    'Makueni', 'Mandera', 'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Muranga', 'Nairobi',
    'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu', 'Siaya',
    'Taita-Taveta', 'Tana River', 'Tharaka-Nithi', 'Trans-Nzoia', 'Turkana', 'Uasin Gishu',
    'Vihiga', 'Wajir', 'West Pokot'
  ],
  'South Africa': [
    'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga',
    'North West', 'Northern Cape', 'Western Cape'
  ],
  'United Kingdom': [
    'England', 'Scotland', 'Wales', 'Northern Ireland'
  ],
  'United States': [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
    'Wisconsin', 'Wyoming'
  ],
};

const contactFormData = ref({
  name: '',
  relationship: '',
  phone_country_code: '+234',
  phone_number: '',
  email: '',
  same_address: false,
  address: '',
  country: '',
  state: '',
  city: '',
  postal_code: '',
});

// Computed states based on selected country
const availableStates = computed(() => {
  return statesByCountry[addressEmergency.country] || [];
});

const primaryContactStates = computed(() => {
  return statesByCountry[addressEmergency.emergency_contact.country] || [];
});

const modalContactStates = computed(() => {
  return statesByCountry[contactFormData.value.country] || [];
});

const isValid = computed(() => {
  return (
    addressEmergency.emergency_contact.name?.trim() &&
    addressEmergency.emergency_contact.relationship &&
    addressEmergency.emergency_contact.phone_number?.length >= 10
  );
});

const isContactFormValid = computed(() => {
  return (
    contactFormData.value.name?.trim() &&
    contactFormData.value.relationship &&
    contactFormData.value.phone_number?.length >= 10
  );
});

const formatPhoneNumber = (contact) => {
  const code = contact.phone_country_code || '+234';
  const number = contact.phone_number || '';
  return `${code} ${number}`;
};

// Event handlers for country changes
const onCountryChange = () => {
  // Reset state when country changes
  addressEmergency.state = '';
};

const onPrimaryContactCountryChange = () => {
  addressEmergency.emergency_contact.state = '';
};

const onModalContactCountryChange = () => {
  contactFormData.value.state = '';
};

// Handle "Same address as patient" checkbox
const onPrimarySameAddressChange = () => {
  if (primaryContactSameAddress.value) {
    // Copy patient address to emergency contact
    addressEmergency.emergency_contact.address = addressEmergency.address;
    addressEmergency.emergency_contact.country = addressEmergency.country;
    addressEmergency.emergency_contact.state = addressEmergency.state;
    addressEmergency.emergency_contact.city = addressEmergency.city;
    addressEmergency.emergency_contact.postal_code = addressEmergency.postal_code;
  }
};

const onModalSameAddressChange = () => {
  if (contactFormData.value.same_address) {
    // Copy patient address to contact form
    contactFormData.value.address = addressEmergency.address;
    contactFormData.value.country = addressEmergency.country;
    contactFormData.value.state = addressEmergency.state;
    contactFormData.value.city = addressEmergency.city;
    contactFormData.value.postal_code = addressEmergency.postal_code;
  }
};

// Initialize address fields if not present
if (!addressEmergency.emergency_contact.address) {
  addressEmergency.emergency_contact.address = '';
  addressEmergency.emergency_contact.country = '';
  addressEmergency.emergency_contact.state = '';
  addressEmergency.emergency_contact.city = '';
  addressEmergency.emergency_contact.postal_code = '';
}

const goBack = () => {
  goToStep(2); // Back to Personal Details
};

const resetContactForm = () => {
  contactFormData.value = {
    name: '',
    relationship: '',
    phone_country_code: '+234',
    phone_number: '',
    email: '',
    same_address: false,
    address: '',
    country: '',
    state: '',
    city: '',
    postal_code: '',
  };
};

const openAddContactModal = () => {
  resetContactForm();
  isEditingContact.value = false;
  editingContactIndex.value = -1;
  showContactModal.value = true;
};

const editAdditionalContact = (index) => {
  const contact = addressEmergency.additional_contacts[index];
  contactFormData.value = {
    name: contact.name || '',
    relationship: contact.relationship || '',
    phone_country_code: contact.phone_country_code || '+234',
    phone_number: contact.phone_number || '',
    email: contact.email || '',
    same_address: contact.same_address || false,
    address: contact.address || '',
    country: contact.country || '',
    state: contact.state || '',
    city: contact.city || '',
    postal_code: contact.postal_code || '',
  };
  isEditingContact.value = true;
  editingContactIndex.value = index;
  showContactModal.value = true;
};

const closeContactModal = () => {
  showContactModal.value = false;
  resetContactForm();
};

const saveAdditionalContact = () => {
  if (!isContactFormValid.value) return;

  const newContact = { ...contactFormData.value };

  if (isEditingContact.value && editingContactIndex.value >= 0) {
    // Update existing contact
    addressEmergency.additional_contacts[editingContactIndex.value] = newContact;
  } else {
    // Add new contact
    if (!addressEmergency.additional_contacts) {
      addressEmergency.additional_contacts = [];
    }
    addressEmergency.additional_contacts.push(newContact);
  }

  closeContactModal();
  saveProgress();
};

const removeAdditionalContact = (index) => {
  if (confirm('Are you sure you want to remove this contact?')) {
    addressEmergency.additional_contacts.splice(index, 1);
    saveProgress();
  }
};

const saveAndExit = async () => {
  await saveToBackend();
  saveProgress();
  router.push({ name: 'Patient Dashboard' });
};

const saveAndContinue = async () => {
  // Validate required fields with toast messages
  if (!addressEmergency.emergency_contact.name?.trim()) {
    $toast.error('Please enter emergency contact full name');
    return;
  }
  if (!addressEmergency.emergency_contact.relationship) {
    $toast.error('Please select emergency contact relationship');
    return;
  }
  if (!addressEmergency.emergency_contact.phone_number || addressEmergency.emergency_contact.phone_number.length < 10) {
    $toast.error('Please enter a valid phone number for emergency contact');
    return;
  }

  await saveToBackend();
  completeStep('addressEmergency');
  saveProgress();
  goToStep(4); // Go to Dependants
};

const saveToBackend = async () => {
  try {
    isSaving.value = true;

    // Build all emergency contacts array (primary + additional)
    const allContacts = [];

    // Primary contact
    if (addressEmergency.emergency_contact.name) {
      const primaryContact = {
        first_name: addressEmergency.emergency_contact.name?.split(' ')[0] || '',
        last_name: addressEmergency.emergency_contact.name?.split(' ').slice(1).join(' ') || '',
        relationship: addressEmergency.emergency_contact.relationship,
        phone: {
          country_code: addressEmergency.emergency_contact.phone_country_code,
          number: addressEmergency.emergency_contact.phone_number,
        },
        email: addressEmergency.emergency_contact.email,
      };

      // Add address fields (backend uses address1 and zip_code)
      if (primaryContactSameAddress.value) {
        primaryContact.address1 = addressEmergency.address;
        primaryContact.country = addressEmergency.country;
        primaryContact.state = addressEmergency.state;
        primaryContact.city = addressEmergency.city;
        primaryContact.zip_code = addressEmergency.postal_code;
        primaryContact.same_as_patient = true;
      } else {
        primaryContact.address1 = addressEmergency.emergency_contact.address;
        primaryContact.country = addressEmergency.emergency_contact.country;
        primaryContact.state = addressEmergency.emergency_contact.state;
        primaryContact.city = addressEmergency.emergency_contact.city;
        primaryContact.zip_code = addressEmergency.emergency_contact.postal_code;
        primaryContact.same_as_patient = false;
      }

      allContacts.push(primaryContact);
    }

    // Additional contacts
    if (addressEmergency.additional_contacts?.length > 0) {
      addressEmergency.additional_contacts.forEach(contact => {
        const additionalContact = {
          first_name: contact.name?.split(' ')[0] || '',
          last_name: contact.name?.split(' ').slice(1).join(' ') || '',
          relationship: contact.relationship,
          phone: {
            country_code: contact.phone_country_code,
            number: contact.phone_number,
          },
          email: contact.email,
        };

        // Add address fields (backend uses address1 and zip_code)
        if (contact.same_address) {
          additionalContact.address1 = addressEmergency.address;
          additionalContact.country = addressEmergency.country;
          additionalContact.state = addressEmergency.state;
          additionalContact.city = addressEmergency.city;
          additionalContact.zip_code = addressEmergency.postal_code;
          additionalContact.same_as_patient = true;
        } else {
          additionalContact.address1 = contact.address;
          additionalContact.country = contact.country;
          additionalContact.state = contact.state;
          additionalContact.city = contact.city;
          additionalContact.zip_code = contact.postal_code;
          additionalContact.same_as_patient = false;
        }

        allContacts.push(additionalContact);
      });
    }

    const payload = {
      profile: {
        contact: {
          address1: addressEmergency.address,
          city: addressEmergency.city,
          state: addressEmergency.state,
          country: addressEmergency.country,
          zip_code: addressEmergency.postal_code,
        },
      },
      emergency_contacts: allContacts,
    };

    await $http.$_updateUser(payload);
    await store.dispatch('authenticate', localStorage.getItem('token') || sessionStorage.getItem('token'));
  } catch (error) {
    console.error('Failed to save address/emergency contact:', error);
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped lang="scss">
@import './styles/step-common.scss';

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.75rem 1rem;
  background: #F0F9FF;
  border: 1px solid #BAE6FD;
  border-radius: 0.625rem;
  transition: all 0.2s;

  &:hover {
    background: #E0F7FA;
  }

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #0288D1;
    cursor: pointer;
  }

  .checkbox-text {
    font-size: 0.875rem;
    font-weight: 500;
    color: #1A365D;
  }
}

.contacts-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.contact-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #F8FAFC;
  border-radius: 0.75rem;
}

.contact-avatar {
  width: 40px;
  height: 40px;
  background: #E2E8F0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748B;
}

.contact-info {
  flex: 1;

  h4 {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1A365D;
    margin: 0 0 0.25rem 0;
  }

  p {
    font-size: 0.8125rem;
    color: #64748B;
    margin: 0;

    &.contact-address {
      margin-top: 0.25rem;
      font-size: 0.75rem;
      color: #94A3B8;
    }
  }
}

.edit-btn, .remove-btn {
  padding: 0.5rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #F1F5F9;
  }
}

.remove-btn:hover {
  background: #FEE2E2;
  border-color: #FECACA;
  color: #DC2626;
}

.add-contact-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.875rem;
  background: transparent;
  border: 2px dashed #CBD5E1;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #4FC3F7;
    color: #0288D1;
  }
}

// Modal Styles
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.contact-modal {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #E2E8F0;

  h3 {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1A365D;
    margin: 0;
  }

  .close-btn {
    padding: 0.5rem;
    background: transparent;
    border: none;
    color: #64748B;
    cursor: pointer;
    border-radius: 0.5rem;
    transition: all 0.2s;

    &:hover {
      background: #F1F5F9;
      color: #1A365D;
    }
  }
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;

    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }
  }

  .form-group {
    &.full-width {
      grid-column: 1 / -1;
    }
  }

  .form-label {
    display: block;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.375rem;

    &.required::after {
      content: ' *';
      color: #DC2626;
    }
  }

  .form-input, .form-select {
    width: 100%;
    padding: 0.75rem 1rem;
    background: #F8FAFC;
    border: 2px solid #E2E8F0;
    border-radius: 0.625rem;
    font-size: 0.9375rem;
    color: #1A365D;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: #4FC3F7;
      background: white;
    }

    &::placeholder {
      color: #94A3B8;
    }

    &:disabled {
      background: #F1F5F9;
      color: #94A3B8;
      cursor: not-allowed;
    }
  }

  .phone-input-group {
    display: flex;
    gap: 0.5rem;

    .country-code-select {
      width: 130px;
      flex-shrink: 0;
    }

    .phone-input {
      flex: 1;
    }
  }

  .checkbox-label {
    margin-top: 0.5rem;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #E2E8F0;
  background: #F8FAFC;
}
</style>
