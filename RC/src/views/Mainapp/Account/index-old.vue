<template>
  <div class="page-content">
    <TopBar
      type="title-only"
      title="Account"
      :showButtons="true"
      @open-side-nav="$emit('openSideNav')"
    />
    <div class="page-content__body">
      <TabNav
        :tabItems="priTabList"
        :selected="selectedPri"
        @selected="setSelectedPri"
      >
        <div class="tab__content-group">
          <transition name="slide" mode="in-out">
            <TabContent :isSelected="selectedPri == priTabList[0]">
              <div class="section-1">
                <AvatarFixed
                  size="medium"
                  :firstname="userBasicInfo.first_name"
                  :lastname="userBasicInfo.last_name"
                  :image="profileImage"
                />
                <div class="user-bio">
                  <h2 class="title">
                    {{ userBasicInfo.first_name }} {{ userBasicInfo.last_name }}
                  </h2>
                  <div class="pri-data">
                    <div class="col-1">
                      <p>{{ userBasicInfo.gender }}</p>
                      <p>{{ userBasicInfo.marital_status }}</p>
                      <p v-show="weight">Weight: {{ weight }}</p>
                      <p>Email: {{ userBasicInfo.contact.email }}</p>
                    </div>
                    <div class="col-2">
                      <p>Born {{ extractDate(userBasicInfo.date_of_birth) }}</p>
                      <p>{{ isSmoker }}</p>
                      <p v-show="height">Height: {{ height }}</p>
                      <p>Phone: {{ phoneNumber }}</p>
                    </div>
                  </div>
                  <div class="address">
                    <p>Address:</p>
                    <p>
                      {{ address }}
                    </p>
                  </div>
                </div>
                <ButtonIcon
                  type="primary"
                  iconName="edit"
                  id="btn-edit"
                  @click="openModal({ name: modalNames[2] })"
                />
              </div>
              <div class="section-2">
                <TabNav
                  :tabItems="secTabList"
                  :selected="selectedSec"
                  @selected="setSelectedSec"
                >
                  <div class="tab__content-group">
                    <transition name="slide" mode="in-out">
                      <TabContent :isSelected="selectedSec == secTabList[0]">
                        <DataListForm
                          :hasList="hasPreExCond"
                          button-label="Add Condition"
                          @click-action="
                            openModal({
                              name: modalNames[3],
                              action: 'add',
                            })
                          "
                        >
                          <OneColListItem
                            v-for="(item, index) in preExCond"
                            :key="index"
                            :line-count="3"
                            :line-one-content="item.name"
                            :line-two-content="item.description"
                            :line-three-content="
                              extractDate(item.start_date) +
                              '  -  ' +
                              (item.end_date
                                ? extractDate(item.end_date)
                                : 'Present')
                            "
                          >
                            <div class="btn-group">
                              <ContextMenuKebab
                                class="context-menu"
                                :dropList="listMenu"
                                buttonType="tertiary"
                                button-size="small"
                                size="400%"
                                @selection="
                                  (i) => {
                                    if (i == 0) {
                                      openModal({
                                        name: modalNames[3],
                                        action: 'edit',
                                        index: index,
                                      });
                                    } else if (i == 1) {
                                      removeItem(
                                        'pre-existing-condition',
                                        item
                                      );
                                    }
                                  }
                                "
                              />
                              <div class="action-btns">
                                <ButtonIcon
                                  type="secondary"
                                  iconName="edit"
                                  color="#008C99"
                                  @click="
                                    openModal({
                                      name: modalNames[3],
                                      action: 'edit',
                                      index: index,
                                    })
                                  "
                                />
                                <ButtonIcon
                                  type="secondary"
                                  iconName="times"
                                  color="#D81818"
                                  @click="
                                    removeItem('pre-existing-condition', item)
                                  "
                                />
                              </div>
                            </div>
                          </OneColListItem>
                        </DataListForm>
                      </TabContent>
                    </transition>
                    <transition name="slide" mode="in-out">
                      <TabContent :isSelected="selectedSec == secTabList[1]">
                        <DataListForm
                          :hasList="hasEmContact"
                          button-label="Add Contact"
                          @click-action="
                            openModal({
                              name: modalNames[4],
                              action: 'add',
                            })
                          "
                        >
                          <OneColListItem
                            v-for="(item, index) in emContact"
                            :key="index"
                            :line-count="2"
                            :line-one-content="
                              item.first_name + ' ' + item.last_name
                            "
                            :line-two-content="
                              formatPhone(
                                item.phone.country_code,
                                item.phone.number
                              )
                            "
                          >
                            <template class="btn-group">
                              <ContextMenuKebab
                                class="context-menu"
                                :dropList="listMenu"
                                buttonType="tertiary"
                                button-size="small"
                                size="400%"
                                @selection="
                                  (i) => {
                                    if (i == 0) {
                                      openModal({
                                        name: modalNames[4],
                                        action: 'edit',
                                        index: index,
                                      });
                                    } else if (i == 1) {
                                      removeItem('emergency-contact', item);
                                    }
                                  }
                                "
                              />
                              <div class="action-btns">
                                <ButtonIcon
                                  type="secondary"
                                  iconName="edit"
                                  color="#008C99"
                                  @click="
                                    openModal({
                                      name: modalNames[4],
                                      action: 'edit',
                                      index: index,
                                    })
                                  "
                                />
                                <ButtonIcon
                                  type="secondary"
                                  iconName="times"
                                  color="#D81818"
                                  @click="removeItem('emergency-contact', item)"
                                />
                              </div>
                            </template>
                          </OneColListItem>
                        </DataListForm>
                      </TabContent>
                    </transition>
                    <transition name="slide" mode="in-out">
                      <TabContent :isSelected="selectedSec == secTabList[2]">
                        <DataListForm
                          :hasList="hasDependants"
                          button-label="Add Dependent"
                          @click-action="
                            openModal({
                              name: modalNames[5],
                              action: 'add',
                            })
                          "
                        >
                          <OneColListItem
                            v-for="(item, index) in dependants"
                            :key="index"
                            :line-count="2"
                            :line-one-content="
                              item.first_name + ' ' + item.last_name
                            "
                            :line-two-content="item.relationship"
                          >
                            <div class="btn-group">
                              <ContextMenuKebab
                                class="context-menu"
                                :dropList="listMenu"
                                buttonType="tertiary"
                                button-size="small"
                                size="400%"
                                @selection="
                                  (i) => {
                                    if (i == 0) {
                                      openModal({
                                        name: modalNames[5],
                                        action: 'edit',
                                        index: index,
                                      });
                                    } else if (i == 1) {
                                      removeItem('dependent', item);
                                    }
                                  }
                                "
                              />
                              <div class="action-btns">
                                <ButtonIcon
                                  type="secondary"
                                  iconName="edit"
                                  color="#008C99"
                                  @click="
                                    openModal({
                                      name: modalNames[5],
                                      action: 'edit',
                                      index: index,
                                    })
                                  "
                                />
                                <ButtonIcon
                                  type="secondary"
                                  iconName="times"
                                  color="#D81818"
                                  @click="removeItem('dependent', item)"
                                />
                              </div>
                            </div>
                          </OneColListItem>
                        </DataListForm>
                      </TabContent>
                    </transition>
                  </div>
                </TabNav>
              </div>
            </TabContent>
          </transition>
          <transition name="slide" mode="in-out">
            <TabContent :isSelected="selectedPri == priTabList[1]">
              <Section title="Subscription Plan">
                <div class="section__body">
                  <div class="card-list-item">
                    <div class="text-group-row">
                      <h2 class="plan-title">Rapid Capsule Free</h2>
                      <p class="hint">128 MB of 5 GB used</p>
                    </div>
                    <Button
                      type="primary"
                      size="medium"
                      label="Upgrade Plan"
                      @click="openModal({ name: modalNames[6] })"
                    />
                  </div>
                </div>
              </Section>
              <Section
                title="Payment Method"
                :has-button="userCards.length > 0"
                label="Add Card"
                icon="plus"
                :iconLeft="true"
                @handle-action="addCard"
              >
                <div class="section__body">
                  <div v-if="userCards.length == 0" class="unpopulated">
                    <Button
                      type="text-secondary"
                      label="Add Card"
                      size="medium"
                      :iconLeft="true"
                      iconName="plus"
                      @click="addCard"
                    />
                  </div>
                  <div v-if="userCards.length > 0" class="poppulated">
                    <RadioList :list-array="userCards" />
                  </div>
                </div>
              </Section>
              <Section title="Payment History">
                <div class="section__body">
                  <div class="unpopulated">
                    <p class="hint">You are on Rapid Capsule Free Plan.</p>
                    <Button
                      type="tertiary"
                      label="Upgrade Plan"
                      size="medium"
                      @click="openModal({ name: modalNames[6] })"
                    />
                  </div>
                </div>
              </Section>
            </TabContent>
          </transition>
          <transition name="slide" mode="in-out">
            <TabContent :isSelected="selectedPri == priTabList[2]">
              <div class="list-container">
                <div class="list-item">
                  <div class="text-group-row">
                    <h3>********</h3>
                    <p class="hint">Password</p>
                  </div>
                  <Button
                    type="text-secondary"
                    label="Reset Password"
                    @click="passReset"
                  />
                </div>
                <Accordian v-show="regMedium">
                  <template v-slot:head-content>
                    <div class="text-group-row">
                      <h3>Two-factor Authentication (2FA)</h3>
                      <p class="hint">Active method: {{ activeAuthMedium }}</p>
                    </div>
                  </template>
                  <template v-slot:body-content>
                    <div class="list-lvl2" v-for="(item, index) of twoFAs">
                      <div class="method-left-pane">
                        <p>{{ item.title }}</p>
                        <span
                          @click="handleChangeAction(item.title)"
                          role="button"
                          class="text-secondary"
                          >{{ item.action ?? "" }}</span
                        >
                      </div>
                      <div class="right" @click="selectedMethod(index)">
                        <LoaderAlone v-if="item.isLoading" color="primary" />
                        <InputSwitch
                          class="switch"
                          :name="item.name"
                          :label="item.label"
                          v-model="item.isActive"
                        />
                      </div>
                    </div>
                  </template>
                </Accordian>
              </div>

              <!-- WhatsApp Integration Section -->
              <div class="whatsapp-section">
                <WhatsAppSettings />
              </div>
            </TabContent>
          </transition>
        </div>
      </TabNav>
    </div>
  </div>

  <!-- Modal to setup phone number as authentication method -->
  <DialogModal
    v-show="selectedModal === modalNames[0]"
    :title="modalNames[0]"
    @closeModal="closeModal(modalNames[0])"
  >
    <template v-slot:body>
      <div class="modal__body-content">
        <p class="align-center">
          Enter the 6-digit code sent to your phone number
        </p>

        <DigitArray
          v-model:input1="otpPhone[0]"
          v-model:input2="otpPhone[1]"
          v-model:input3="otpPhone[2]"
          v-model:input4="otpPhone[3]"
          v-model:input5="otpPhone[4]"
          v-model:input6="otpPhone[5]"
          :placeholder="placeHolders"
          @input="autoSubmitPhone()"
        />
        <Button
          label="Resend OTP"
          type="tertiary"
          size="medium"
          @click="resendCode"
        />
      </div>
    </template>
    <template v-slot:loader>
      <Loader v-if="loadingPhone" :useOverlay="true" :rounded="true" />
    </template>
  </DialogModal>

  <!-- Modal to setup authentication app as authentication method -->
  <DialogModal
    v-show="selectedModal === modalNames[1]"
    :title="modalNames[1]"
    @closeModal="
      closeModal(modalNames[1]);
      qrNext = false;
    "
  >
    <template v-slot:body>
      <div v-if="qrNext == false" class="modal__body-content">
        <p class="align-center">
          Scan the QR code with your auth app and click the button below
        </p>
        <img :src="qrUrl" alt="QR code image" />
        <Button
          label="Authorize App"
          type="tertiary"
          size="medium"
          @click="qrNext = true"
        />
      </div>
      <div v-if="qrNext == true" class="modal__body-content">
        <p class="align-center">
          Enter the active 6-digit code from your auth app
        </p>

        <DigitArray
          v-model:input1="otpApp[0]"
          v-model:input2="otpApp[1]"
          v-model:input3="otpApp[2]"
          v-model:input4="otpApp[3]"
          v-model:input5="otpApp[4]"
          v-model:input6="otpApp[5]"
          :placeholder="placeHolders"
          @input="autoSubmitApp()"
        />
      </div>
    </template>
    <template v-slot:loader>
      <Loader v-if="loadingApp" :useOverlay="true" :rounded="true" />
    </template>
  </DialogModal>

  <!-- Modal for profile edit -->
  <DialogModal
    v-show="selectedModal === modalNames[2]"
    :title="modalNames[2]"
    @closeModal="closeModal(modalNames[2])"
    :has-footer="true"
  >
    <template v-slot:body>
      <div class="modal__content">
        <Avatar
          size="medium"
          :firstname="userProfile.profile.first_name"
          :lastname="userProfile.profile.last_name"
          :extSrc="profileImage"
          v-model="profile.profile_photo"
        />
        <div class="body__inputs">
          <div class="input__group">
            <Text
              type="text"
              label="Firstname"
              name="fname"
              v-model="userProfile.profile.first_name"
              :disabled="true"
            ></Text>

            <Text
              type="text"
              label="Lastname"
              name="lname"
              v-model="userProfile.profile.last_name"
              :disabled="true"
            ></Text>
          </div>
          <div class="input__group">
            <Dropdown
              :options="genderArray"
              label="Gender"
              :required="true"
              v-model="profile.gender"
            ></Dropdown>

            <DatePicker
              Label="Date of Birth"
              v-model="userProfile.profile.date_of_birth"
              :disabled="true"
            />
            <Dropdown
              :options="maritalStatusArray"
              label="Marital Status"
              :required="true"
              v-model="profile.marital_status"
            ></Dropdown>
          </div>
          <div class="input__group">
            <NumberInputSuffix
              label="Height"
              name="height"
              max-digits="3"
              :options="heightArray"
              v-model="profile.basic_health_info.height.unit"
              v-model:number-input="profile.basic_health_info.height.value"
            ></NumberInputSuffix>
            <NumberInputSuffix
              label="Weight"
              name="weight"
              max-digits="3"
              :options="weightArray"
              v-model="profile.basic_health_info.weight.unit"
              v-model:number-input="profile.basic_health_info.weight.value"
            ></NumberInputSuffix>
            <Dropdown
              :options="smokerArray"
              :required="true"
              label="Smoker?"
              v-model="profile.health_risk_factors.is_smoker"
            />
          </div>
        </div>
        <div class="body__inputs">
          <div class="input__group">
            <Text
              class="col-2"
              type="email"
              label="Email"
              name="email"
              v-model="userProfile.profile.contact.email"
              :disabled="true"
            >
            </Text>
            <PhoneInput
              v-model:phone-number="userBasicInfo.contact.phone.number"
              v-model="userBasicInfo.contact.phone.country_code"
              :disabled="userProfile.profile.contact.hasOwnProperty('phone')"
            />
          </div>
        </div>
        <div class="body__inputs">
          <div class="input__group--row">
            <Text
              type="text"
              label="Address Line 1"
              name="address1"
              max-chars="50"
              :required="true"
              v-model="profile.contact.address1"
            ></Text>
            <Text
              type="text"
              label="Address Line 2"
              max-chars="50"
              name="address1"
              v-model="profile.contact.address2"
            />
          </div>
          <div class="input__group">
            <SelectFilterInput
              name="patient-country"
              label="Country"
              position="top"
              mode="country"
              :required="true"
              v-model:country-value="profile.contact.country"
              @selected-item="selectedItem"
            />
            <SelectFilterInput
              name="patient-state"
              label="State"
              position="top"
              mode="state"
              :required="true"
              :based-on="patientCountry"
              v-model:state-value="profile.contact.state"
            />
            <Text
              type="text"
              label="ZIP Code"
              name="zip"
              :required="true"
              v-model="profile.contact.zip_code"
            ></Text>
          </div>
        </div>
      </div>
    </template>
    <template v-slot:foot>
      <Button
        type="primary"
        label="Save"
        size="medium"
        class="button"
        @click="updateData(modalNames[2])"
      />
    </template>
    <template v-slot:loader>
      <Loader
        v-if="loadingModal && modalNames[2]"
        :useOverlay="true"
        :rounded="true"
      />
    </template>
  </DialogModal>

  <!-- Modal to edit/add pre-existing condition -->
  <DialogModal
    v-show="selectedModal === modalNames[3]"
    :title="modalNames[3]"
    @closeModal="closeModal(modalNames[3])"
    :has-footer="true"
  >
    <template v-slot:body>
      <div class="modal__content">
        <div class="input__group--row">
          <Text
            type="text"
            label="Condition Name"
            name="condition"
            :required="true"
            v-model="pre_existing_conditions.name"
          />
          <AreaText
            name="description"
            label="description"
            placeholder="Describe the condition"
            rows="5"
            v-model="pre_existing_conditions.description"
          />
        </div>
        <DateRangePicker
          v-model:startDate="pre_existing_conditions.start_date"
          v-model:endDate="pre_existing_conditions.end_date"
          v-model:status="pre_existing_conditions.is_condition_exists"
        />
        <FileUploadForm v-model="pre_existing_conditions.file" />
      </div>
    </template>
    <template v-slot:foot>
      <Button
        type="primary"
        label="Save"
        size="medium"
        class="button"
        :disabled="v$.pre_existing_conditions.$invalid"
        @click="updateData(modalNames[3])"
      />
    </template>
    <template v-slot:loader>
      <Loader
        v-if="loadingModal && modalNames[3]"
        :useOverlay="true"
        :rounded="true"
      />
    </template>
  </DialogModal>

  <!-- Modal for editing/adding emergency contacts -->
  <DialogModal
    v-show="selectedModal === modalNames[4]"
    :title="modalNames[4]"
    @closeModal="closeModal(modalNames[4])"
    :has-footer="true"
  >
    <template v-slot:body>
      <div class="modal__content">
        <div class="input__group">
          <Text
            type="text"
            label="Firstname"
            name="Emergency-contact-firstname"
            :required="true"
            v-model="emergency_contacts.first_name"
          />
          <Text
            type="text"
            label="Lastname"
            name="Emergency-contact-lastname"
            :required="true"
            v-model="emergency_contacts.last_name"
          />
        </div>
        <div class="input__group">
          <Dropdown
            :options="relationshipArray"
            label="Relationship"
            :required="true"
            v-model="emergency_contacts.relationship"
          />
          <PhoneInput
            v-model:phone-number="emergency_contacts.phone.number"
            v-model="emergency_contacts.phone.country_code"
          />
        </div>
        <div class="input__group--row">
          <Text
            type="text"
            label="Address Line 1"
            max-chars="50"
            name="emergency-contact-address1"
            :required="true"
            v-model="emergency_contacts.address1"
          ></Text>
          <Text
            type="text"
            label="Address Line 2"
            max-chars="50"
            name="emergency-contact-address2"
            v-model="emergency_contacts.address2"
          />
        </div>
        <div class="input__group">
          <SelectFilterInput
            name="emergency-contact-country"
            label="Country"
            position="top"
            mode="country"
            :required="true"
            v-model:country-value="emergency_contacts.country"
            @selected-item="selectedItem"
          />
          <SelectFilterInput
            name="emergency-contact-state"
            label="State"
            position="top"
            mode="state"
            :required="true"
            :based-on="contactCountry"
            v-model:state-value="emergency_contacts.state"
          />
          <Text
            type="text"
            label="ZIP Code"
            name="emergency-contact-zip"
            :required="true"
            v-model="emergency_contacts.zip_code"
          ></Text>
        </div>
      </div>
    </template>
    <template v-slot:foot>
      <Button
        type="primary"
        label="Save"
        size="medium"
        class="button"
        :disabled="v$.emergency_contacts.$invalid"
        @click="updateData(modalNames[4])"
      />
    </template>
    <template v-slot:loader>
      <Loader
        v-if="loadingModal && modalNames[4]"
        :useOverlay="true"
        :rounded="true"
      />
    </template>
  </DialogModal>

  <!-- Modal for editing/adding dependents -->
  <DialogModal
    v-show="selectedModal === modalNames[5]"
    :title="modalNames[5]"
    @closeModal="closeModal(modalNames[5])"
    :has-footer="true"
  >
    <template v-slot:body>
      <div class="modal__content">
        <div class="input__group">
          <Text
            type="text"
            label="Firstname"
            name="dependatn-fname"
            :required="true"
            v-model="dependent.first_name"
          />

          <Text
            type="text"
            label="Lastname"
            name="dependant-lname"
            :required="true"
            v-model="dependent.last_name"
          />
        </div>
        <div class="input__group">
          <Dropdown
            :options="genderArray"
            label="Gender"
            :required="true"
            v-model="dependent.gender"
          />

          <DatePicker Label="Date of Birth" v-model="dependent.date_of_birth" />
          <Dropdown
            :options="relationshipArray"
            label="Relationship"
            :required="true"
            v-model="dependent.relationship"
          />
        </div>
        <div class="input__group">
          <NumberInputSuffix
            label="Height"
            name="dependant-height"
            max-digits="3"
            :options="heightArray"
            v-model="dependent.basic_health_info.height.unit"
            v-model:number-input="dependent.basic_health_info.height.value"
          />
          <NumberInputSuffix
            label="Weight"
            name="dependant-weight"
            max-digits="3"
            :options="weightArray"
            v-model="dependent.basic_health_info.weight.unit"
            v-model:number-input="dependent.basic_health_info.weight.value"
          />
        </div>

        <div class="input__group">
          <Text
            class="col-2"
            type="email"
            label="Email"
            name="dependant-email"
            :required="true"
            v-model="dependent.contact.email"
          />
          <PhoneInput
            v-model:phone-number="dependent.contact.phone.number"
            v-model="dependent.contact.phone.country_code"
          />
        </div>
        <div class="body__inputs">
          <div class="input__group--row">
            <Text
              type="text"
              label="Address Line 1"
              name="dependant-address1"
              max-chars="50"
              :required="true"
              v-model="dependent.contact.address1"
            />
            <Text
              type="text"
              label="Address Line 2"
              name="dependant-address1"
              max-chars="50"
              v-model="dependent.contact.address2"
            />
          </div>
          <div class="input__group">
            <SelectFilterInput
              name="dependant-country"
              label="Country"
              position="top"
              mode="country"
              :required="true"
              v-model:country-value="dependent.contact.country"
              @selected-item="selectedItem"
            />
            <SelectFilterInput
              name="dependant-state"
              label="State"
              position="top"
              mode="state"
              :required="true"
              :based-on="dependantCountry"
              v-model:state-value="dependent.contact.state"
            />
            <Text
              type="text"
              label="ZIP Code"
              name="dependant-zip"
              :required="true"
              v-model="dependent.contact.zip_code"
            />
          </div>
        </div>
      </div>
    </template>
    <template v-slot:foot>
      <Button
        type="primary"
        label="Save"
        size="medium"
        class="button"
        :disabled="v$.dependent.$invalid"
        @click="updateData(modalNames[5])"
      />
    </template>
    <template v-slot:loader>
      <Loader
        v-if="loadingModal && modalNames[5]"
        :useOverlay="true"
        :rounded="true"
      />
    </template>
  </DialogModal>

  <!-- Dialog for changing Email -->
  <ChangeEmailModal
    v-if="isChangingEmail"
    @closeChangeEmailDialog="isChangingEmail = false"
    @hasSentOtp="handleDisplayOtpDialog"
  />

  <!-- Dialog for changing phone number -->
  <ChangePhoneModal
    v-if="isChangingPhoneNumber"
    @closeChangePhoneDialog="isChangingPhoneNumber = false"
    @hasSentOtp="handleDisplayOtpDialog"
  />

  <!-- Dialog for validating otp -->
  <ValidateOtpModal
    v-if="hasSentOtp"
    :title="otpVerificationModalTitle"
    :description="otpVerificationModalDescription"
    :payloadForOtpVerification="payloadForOtpVerification"
    @handleCloseModal="hasSentOtp = false"
    @handleReload="handleFetchUser"
  />

  <!-- Modal for subscription plan update -->
  <!-- v-show="selectedModal === modalNames[6]" -->
  <Modal
    v-show="selectedModal === modalNames[6]"
    @closeModal="closeModal(modalNames[6])"
  >
    <template v-slot:body>
      <div class="modal__content special">
        <div class="section__top">
          <TwoWaySwitch
            default="Monthly"
            option1="Annual"
            option2="Monthly"
            @selectedValue="handleSelection"
          />
          <div class="message-box">
            <p class="message">Save 40% when you pay annually</p>
          </div>
        </div>
        <div class="section__plans">
          <PlanCard :active="true" />
          <PlanCard :featured="true" />
          <PlanCard />
        </div>
      </div>
    </template>
    <template v-slot:loader>
      <Loader
        v-if="loadingModal && modalNames[6]"
        :useOverlay="true"
        :rounded="true"
      />
    </template>
  </Modal>

  <!-- Caution modal. Pops-up when a user attempts to delete an item -->
  <ModalCaution
    v-show="openCautionModal == true"
    title="Remove Item"
    @closeModal="openCautionModal = false"
    :has-footer="true"
  >
    <template v-slot:body>
      <div class="modal__content">
        <div class="caution">
          <p class="text">
            This action is irreversible. Are you sure you want to remove this
            Item?
          </p>
        </div>
      </div>
    </template>
    <template v-slot:foot>
      <Button
        type="tertiary"
        label="No"
        size="small"
        class="button"
        @click="closeCautionModal()"
      />
      <Button
        type="primary"
        label="Yes"
        size="small"
        :loading="loadingCaution"
        class="button"
        @click="accept()"
      />
    </template>
  </ModalCaution>
</template>

<script>
import io from "socket.io-client";
import { useFormatDateNumbers, useConvertToFile } from "@/Utility-functions";
import { mapGetters, mapActions, mapMutations } from "vuex";
import { useVuelidate } from "@vuelidate/core";
import { required, minLength } from "@vuelidate/validators";
import axios from "axios";
import TopBar from "@/components/Navigation/top-bar.vue";
import ButtonIcon from "@/components/buttons/button-icon.vue";
import Button from "@/components/buttons/button-primary.vue";
import TabNav from "@/components/tab-components/tab-navigation.vue";
import TabContent from "@/components/tab-components/tab.vue";
import AvatarFixed from "@/components/Avatars/avatar-fixed.vue";
import Avatar from "@/components/Avatars/avatar.vue";
import Section from "@/components/section.vue";
import InputSwitch from "@/components/inputs/switch.vue";
import DataListForm from "@/components/forms/list-data-form.vue";
import OneColListItem from "@/components/Lists/single-col-list.vue";
import Accordian from "@/components/Lists/accordian.vue";
import DialogModal from "@/components/modals/dialog-modal.vue";
import Modal from "@/components/modals/modal.vue";
import ModalCaution from "@/components/modals/modal-caution.vue";
import DigitArray from "@/components/inputs/digit-array.vue";
import Loader from "@/components/Loader/main-loader.vue";
import LoaderAlone from "@/components/Loader/loader-standalone.vue";
import ContextMenuKebab from "@/components/utitlity/context-menu-kebab.vue";
import Text from "@/components/inputs/text.vue";
import NumberInputSuffix from "@/components/inputs/digits-suffix.vue";
import PhoneInput from "@/components/inputs/phone-number.vue";
import DatePicker from "@/components/inputs/date-picker.vue";
import Dropdown from "@/components/inputs/select-dropdown.vue";
import SelectFilterInput from "@/components/inputs/select-filter-input.vue";
import Toast from "@/components/alerts/toasts.vue";
import AreaText from "@/components/inputs/area-text.vue";
import DateRangePicker from "@/components/inputs/date-pickers/date-range.vue";
import FileUploadForm from "@/components/forms/File-upload-form.vue";
import TwoWaySwitch from "@/components/inputs/two-way-switch.vue";
import PlanCard from "@/components/Cards/plan-card.vue";
import RadioList from "@/components/Lists/radio-list-cards.vue";
import ChangeEmailModal from "@/components/Account/ChangeEmailModal.vue";
import ChangePhoneModal from "@/components/Account/ChangePhoneModal.vue";
import ValidateOtpModal from "@/components/Account/ValidateOtpModal.vue";
import WhatsAppSettings from "@/components/Account/WhatsAppSettings.vue";
import {
  TWO_FAS,
  SECURITY_UPDATE_OPTIONS,
  OTP_VERIFICATION_CONTENT,
} from "@/utilities/constants";

export default {
  name: "Account Settings View",

  setup: () => ({ v$: useVuelidate() }),

  emits: ["openSideNav"],

  components: {
    TopBar,
    ButtonIcon,
    TabContent,
    TabNav,
    AvatarFixed,
    Avatar,
    Button,
    Section,
    InputSwitch,
    DataListForm,
    OneColListItem,
    Accordian,
    DialogModal,
    Modal,
    ModalCaution,
    DigitArray,
    Loader,
    LoaderAlone,
    ContextMenuKebab,
    Text,
    NumberInputSuffix,
    PhoneInput,
    DatePicker,
    Dropdown,
    SelectFilterInput,
    Toast,
    AreaText,
    DateRangePicker,
    FileUploadForm,
    TwoWaySwitch,
    PlanCard,
    RadioList,
    ChangeEmailModal,
    ChangePhoneModal,
    ValidateOtpModal,
    WhatsAppSettings,
  },

  data() {
    return {
      priTabList: ["Profile", "Billing & Subscriptions", "Security"],
      secTabList: ["Pre-existing Condition", "Emergency Contact", "Dependent"],
      selectedPri: "Profile",
      selectedSec: "Pre-existing Condition",
      modalNames: [
        "Verify Phone Number",
        "Activate Auth App",
        "Edit Profile",
        "Edit Pre-exsisting Condition",
        "Edit Emergency Contact",
        "Edit Dependent",
        "Choose Plan",
      ],

      otpPhone: [],
      otpApp: [],
      placeHolders: ["0", "0", "0", "0", "0", "0"],
      listMenu: ["Edit", "Remove"],
      genderArray: ["Male", "Female"],
      maritalStatusArray: ["Single", "Married", "Divorced", "Widowed"],
      heightArray: ["cm", "m"],
      weightArray: ["kg", "lb"],
      smokerArray: ["Yes", "No"],
      cCodes: ["+234", "+1"],
      relationshipArray: [
        "Brother",
        "Sister",
        "Wife",
        "Husband",
        "Father",
        "Mother",
        "Uncle",
        "Aunty",
        "Son",
        "Daughter",
        "Friend",
      ],

      twoFAs: TWO_FAS,

      profile: {
        profile_photo: null,
        gender: null,
        marital_status: null,
        basic_health_info: {
          height: {
            value: null,
            unit: "cm",
          },
          weight: {
            value: null,
            unit: "kg",
          },
        },
        health_risk_factors: {
          is_smoker: null,
        },
        contact: {
          address1: null,
          address2: null,
          state: null,
          country: null,
          zip_code: null,
        },
      },

      pre_existing_conditions: {
        _id: null,
        name: null,
        description: null,
        start_date: null,
        end_date: null,
        is_condition_exists: false,
        file: null,
      },

      emergency_contacts: {
        _id: null,
        first_name: null,
        last_name: null,
        relationship: null,
        phone: {
          number: null,
          country_code: null,
        },
        address1: null,
        address2: null,
        state: null,
        country: null,
        zip_code: null,
      },

      dependent: {
        _id: null,
        first_name: null,
        last_name: null,
        gender: null,
        date_of_birth: null,
        relationship: null,
        basic_health_info: {
          height: {
            unit: null,
            value: null,
          },
          weight: {
            unit: null,
            value: null,
          },
        },
        contact: {
          email: null,
          phone: {
            number: null,
            country_code: null,
          },
          address1: null,
          address2: null,
          state: null,
          country: null,
          zip_code: null,
        },
      },

      contactCountry: null,
      dependantCountry: null,
      patientCountry: null,

      selectedModal: null,
      qrNext: false,
      paymentFreq: null,

      loadingPhone: false,
      loadingApp: false,
      loadingModal: false,
      openCautionModal: false,
      loadingCaution: false,

      actionType: null,
      parsedItem: null,

      isChangingEmail: false,
      isChangingPhoneNumber: false,
      otpVerificationModalTitle: "",
      otpVerificationModalDescription: "",
      payloadForOtpVerification: "",
      hasSentOtp: false,
    };
  },

  computed: {
    ...mapGetters({
      userProfile: "userprofile",
      userSettings: "usersettings",
      vitals: "vitals",
      activeSub: "activeSub",
      userCards: "cards",
      status: "userAccountSettings/requestStatus",
      QRCode: "userAccountSettings/qrCode",
    }),

    qrUrl() {
      return this.QRCode ? this.QRCode.data : "";
    },

    regMedium() {
      return this.userProfile.reg_medium === "LOCAL" ? true : false;
    },

    setAuthStatus() {
      return this.status;
    },

    isPhoneVerified() {
      return this.userProfile.is_phone_verified;
    },

    isAutAppEnabled() {
      return this.userProfile.is_auth_app_enabled;
    },

    authMedium() {
      return this.regMedium
        ? this.userSettings.defaults.twoFA_medium.toLowerCase()
        : null;
    },

    activeAuthMedium() {
      if (this.regMedium) {
        if (this.authMedium === "email") {
          return "Email";
        } else if (this.authMedium === "sms") {
          return "SMS";
        } else if (this.authMedium === "auth_apps") {
          return "Authentication App";
        }
      } else {
        return null;
      }
    },

    userBasicInfo() {
      return this.userProfile?.profile;
    },

    profileImage() {
      return this.userBasicInfo.profile_photo;
    },

    weight() {
      return this.userBasicInfo.basic_health_info.weight.value
        ? this.userBasicInfo.basic_health_info.weight.value +
            this.userBasicInfo.basic_health_info.weight.unit
        : null;
    },

    height() {
      return this.userBasicInfo.basic_health_info.height.value
        ? this.userBasicInfo.basic_health_info.height.value +
            this.userBasicInfo.basic_health_info.height.unit
        : null;
    },

    phoneNumber() {
      let code = this.userBasicInfo.contact.hasOwnProperty("phone")
        ? this.userBasicInfo.contact.phone.country_code
        : null;
      let number = this.userBasicInfo.contact.hasOwnProperty("phone")
        ? this.userBasicInfo.contact.phone.number
        : null;
      return this.formatPhone(code, number);
    },

    isSmoker() {
      if (this.userBasicInfo.health_risk_factors.is_smoker === "No") {
        return "Non-smoker";
      } else {
        return "Smoker";
      }
    },

    address() {
      return (
        this.userBasicInfo.contact.address1 +
        ", " +
        (this.userBasicInfo.contact.address2 == null
          ? ""
          : this.userBasicInfo.contact.address2 + ", ") +
        this.userBasicInfo.contact.state +
        ", " +
        this.userBasicInfo.contact.country +
        ". " +
        this.userBasicInfo.contact.zip_code
      );
    },

    preExCond() {
      return this.userProfile.pre_existing_conditions.length > 0
        ? this.userProfile.pre_existing_conditions
        : null;
    },

    hasPreExCond() {
      return this.preExCond ? true : false;
    },

    emContact() {
      return this.userProfile.emergency_contacts.length > 0
        ? this.userProfile.emergency_contacts
        : null;
    },

    hasEmContact() {
      return this.emContact ? true : false;
    },

    dependants() {
      return this.userProfile.dependants.length > 0
        ? this.userProfile.dependants
        : null;
    },

    hasDependants() {
      return this.dependants ? true : false;
    },
  },

  validations() {
    return {
      // VALIDATION TESTS FOR STEP 1 FORM
      profile: {
        gender: { required: required, $autoDirty: true },
        marital_status: { required: required, $autoDirty: true },
        health_risk_factors: {
          is_smoker: { required: required, $autoDirty: true },
        },
        contact: {
          address1: { required: required, $autoDirty: true },
          state: { required: required, $autoDirty: true },
          country: { required: required, $autoDirty: true },
          zip_code: {
            required: required,
            minLength: minLength(5),
            $autoDirty: true,
          },
        },
      },

      // VALIDATION TESTS FOR STEP 2 FORM
      pre_existing_conditions: {
        name: { required: required, $autoDirty: true },
        start_date: { required: required, $autoDirty: true },
      },

      // VALIDATION TESTS FOR STEP 3 FORM
      emergency_contacts: {
        first_name: { required: required, $autoDirty: true },
        last_name: { required: required, $autoDirty: true },
        relationship: { required: required, $autoDirty: true },
        phone: {
          number: { required: required, $autoDirty: true },
        },
        address1: { required: required, $autoDirty: true },
        state: { required: required, $autoDirty: true },
        country: { required: required, $autoDirty: true },
        zip_code: {
          required: required,
          minLength: minLength(5),
          $autoDirty: true,
        },
      },

      // VALIDATION TESTS FOR STEP 3 FORM
      dependent: {
        first_name: { required: required, $autoDirty: true },
        last_name: { required: required, $autoDirty: true },
        gender: { required: required, $autoDirty: true },
        relationship: { required: required, $autoDirty: true },
        contact: {
          email: { required: required, $autoDirty: true },
          phone: {
            number: { required: required, $autoDirty: true },
          },
          address1: { required: required, $autoDirty: true },
          state: { required: required, $autoDirty: true },
          country: { required: required, $autoDirty: true },
          zip_code: {
            required: required,
            minLength: minLength(5),
            $autoDirty: true,
          },
        },
      },
    };
  },

  methods: {
    ...mapActions({
      remove: "editProfile/remove_item",
      updateTwoFA: "userAccountSettings/updatetwofactorauth",
      sendVerCode: "userAccountSettings/getPhoneVerCode",
      verifyNumber: "userAccountSettings/verifynumber",
      sendSecreteCode: "userAccountSettings/getSecreteCode",
      activateApp: "userAccountSettings/activateApp",
      updateUserProfile: "userAccountSettings/updateUserProfile",
      remove: "userAccountSettings/remove",
      reloadUserInfo: "authenticate",
    }),

    ...mapMutations({
      saveCards: "SET_CARDS",
    }),

    handleSelection(val) {
      this.paymentFreq = val;
    },

    handleChangeAction(title) {
      if (title === SECURITY_UPDATE_OPTIONS.EMAIL) {
        this.isChangingEmail = true;
      } else if (title === SECURITY_UPDATE_OPTIONS.SMS) {
        this.isChangingPhoneNumber = true;
      }
    },

    handleDisplayOtpDialog({ type, payload }) {
      this.isChangingEmail = false;
      this.isChangingPhoneNumber = false;
      this.hasSentOtp = true;
      this.payloadForOtpVerification = payload;
      this.otpVerificationModalTitle = OTP_VERIFICATION_CONTENT[type].title;
      this.otpVerificationModalDescription =
        OTP_VERIFICATION_CONTENT[type].description;
    },

    async handleFetchUser() {
      this.hasSentOtp = false;
      this.payloadForOtpVerification = "";
      this.otpVerificationModalTitle = "";
      this.otpVerificationModalDescription = "";
      await this.reloadUserInfo();
    },

    selectedItem(evtObj) {
      let id = evtObj.target;
      let selected = evtObj.selectedItem;

      if (id === "dependant-country") {
        this.dependantCountry = selected;
      }
      if (id === "emergency-contact-country") {
        this.contactCountry = selected;
      }
      if (id === "patient-country") {
        this.patientCountry = selected;
      }
    },

    setSelectedPri(tab) {
      this.selectedPri = tab;
    },
    setSelectedSec(tab) {
      this.selectedSec = tab;
    },

    passReset() {
      localStorage.clear();
      sessionStorage.clear();
      window.location = "/reset-password/request-link";
    },

    /* Open selected modal and perform the necessary actions */
    async openModal(params) {
      switch (params.name) {
        case this.modalNames[0]:
          this.selectedModal = params.name;
          break;

        case this.modalNames[1]:
          this.selectedModal = params.name;
          break;

        case this.modalNames[2]:
          this.profile.gender = this.userBasicInfo.gender;
          this.profile.marital_status = this.userBasicInfo.marital_status;
          this.profile.basic_health_info.height.value =
            this.userBasicInfo.basic_health_info.height.value;
          this.profile.basic_health_info.height.unit =
            this.userBasicInfo.basic_health_info.height.unit;
          this.profile.basic_health_info.weight.value =
            this.userBasicInfo.basic_health_info.weight.value;
          this.profile.basic_health_info.weight.unit =
            this.userBasicInfo.basic_health_info.weight.unit;
          this.profile.health_risk_factors.is_smoker =
            this.userBasicInfo.health_risk_factors.is_smoker;
          this.profile.contact.address1 = this.userBasicInfo.contact.address1;
          this.profile.contact.address2 = this.userBasicInfo.contact.address2;
          this.profile.contact.state = this.userBasicInfo.contact.state;
          this.profile.contact.country = this.userBasicInfo.contact.country;
          this.profile.contact.zip_code = this.userBasicInfo.contact.zip_code;

          this.selectedModal = params.name;
          break;

        case this.modalNames[3]:
          if (params.action === "edit") {
            this.pre_existing_conditions._id = this.preExCond[params.index]._id;
            this.pre_existing_conditions.name =
              this.preExCond[params.index].name;
            this.pre_existing_conditions.description =
              this.preExCond[params.index].description;
            this.pre_existing_conditions.start_date = useFormatDateNumbers(
              this.preExCond[params.index].start_date
            );
            this.pre_existing_conditions.end_date =
              this.preExCond[params.index].endDate;
            this.pre_existing_conditions.is_condition_exists =
              this.preExCond[params.index].is_condition_exists;
            this.pre_existing_conditions.file = await useConvertToFile(
              this.preExCond[params.index].file
            );
          }

          if (params.action === "add") {
            this.pre_existing_conditions._id = null;
            this.pre_existing_conditions.name = null;
            this.pre_existing_conditions.description = null;
            this.pre_existing_conditions.start_date = null;
            this.pre_existing_conditions.end_date = null;
            this.pre_existing_conditions.is_condition_exists = null;
            this.pre_existing_conditions.file = null;
          }

          this.selectedModal = params.name;
          break;

        case this.modalNames[4]:
          if (params.action === "edit") {
            this.emergency_contacts._id = this.emContact[params.index]._id;
            this.emergency_contacts.first_name =
              this.emContact[params.index].first_name;
            this.emergency_contacts.last_name =
              this.emContact[params.index].last_name;
            this.emergency_contacts.relationship =
              this.emContact[params.index].relationship;
            this.emergency_contacts.phone.number =
              this.emContact[params.index].phone.number;
            this.emergency_contacts.phone.country_code =
              this.emContact[params.index].phone.country_code;
            this.emergency_contacts.address1 =
              this.emContact[params.index].address1;
            this.emergency_contacts.address2 =
              this.emContact[params.index].address2;
            this.emergency_contacts.state = this.emContact[params.index].state;
            this.emergency_contacts.country =
              this.emContact[params.index].country;
            this.emergency_contacts.zip_code =
              this.emContact[params.index].zip_code;
          }

          if (params.action === "add") {
            this.emergency_contacts._id = null;
            this.emergency_contacts.first_name = null;
            this.emergency_contacts.last_name = null;
            this.emergency_contacts.relationship = null;
            this.emergency_contacts.phone.number = null;
            this.emergency_contacts.phone.country_code = null;
            this.emergency_contacts.address1 = null;
            this.emergency_contacts.address2 = null;
            this.emergency_contacts.state = null;
            this.emergency_contacts.country = null;
            this.emergency_contacts.zip_code = null;
          }

          this.selectedModal = params.name;
          break;

        case this.modalNames[5]:
          if (params.action === "edit") {
            this.dependent._id = this.dependants[params.index]._id;
            this.dependent.first_name =
              this.dependants[params.index].first_name;
            this.dependent.last_name = this.dependants[params.index].last_name;
            this.dependent.gender = this.dependants[params.index].gender;
            this.dependent.date_of_birth = this.dependants[params.index]
              .date_of_birth
              ? useFormatDateNumbers(
                  this.dependants[params.index].date_of_birth
                )
              : null;
            this.dependent.relationship =
              this.dependants[params.index].relationship;
            this.dependent.basic_health_info.height.unit =
              this.dependants[params.index].basic_health_info.height.unit;
            this.dependent.basic_health_info.height.value =
              this.dependants[params.index].basic_health_info.height.value;
            this.dependent.basic_health_info.weight.unit =
              this.dependants[params.index].basic_health_info.weight.unit;
            this.dependent.basic_health_info.weight.value =
              this.dependants[params.index].basic_health_info.weight.value;
            this.dependent.contact.email =
              this.dependants[params.index].contact.email;
            this.dependent.contact.phone.number =
              this.dependants[params.index].contact.phone.number;
            this.dependent.contact.phone.country_code =
              this.dependants[params.index].contact.phone.country_code;
            this.dependent.contact.address1 =
              this.dependants[params.index].contact.address1;
            this.dependent.contact.address2 =
              this.dependants[params.index].contact.address2;
            this.dependent.contact.state =
              this.dependants[params.index].contact.state;
            this.dependent.contact.country =
              this.dependants[params.index].contact.country;
            this.dependent.contact.zip_code =
              this.dependants[params.index].contact.zip_code;
          }

          if (params.action === "add") {
            this.dependent._id = null;
            this.dependent.first_name = null;
            this.dependent.last_name = null;
            this.dependent.gender = null;
            this.dependent.date_of_birth = null;
            this.dependent.relationship = null;
            this.dependent.basic_health_info.height.unit = null;
            this.dependent.basic_health_info.height.value = null;
            this.dependent.basic_health_info.weight.unit = null;
            this.dependent.basic_health_info.weight.value = null;
            this.dependent.contact.email = null;
            this.dependent.contact.phone.number = null;
            this.dependent.contact.phone.country_code = null;
            this.dependent.contact.address1 = null;
            this.dependent.contact.address2 = null;
            this.dependent.contact.state = null;
            this.dependent.contact.country = null;
            this.dependent.contact.zip_code = null;
          }

          this.selectedModal = params.name;
          break;

        case this.modalNames[6]:
          this.selectedModal = params.name;
          break;
      }
    },

    /* Close selected modal and perform the needed actions */
    closeModal(name) {
      switch (name) {
        case this.modalNames[0]:
          this.selectedModal = null;
          this.twoFAs[1].isLoading = false;
          break;

        case this.modalNames[1]:
          this.selectedModal = null;
          this.twoFAs[2].isLoading = false;
          break;

        case this.modalNames[2]:
          this.profile.profile_photo = null;
          this.profile.gender = null;
          this.profile.marital_status = null;
          this.profile.basic_health_info.height.value = null;
          this.profile.basic_health_info.height.unit = null;
          this.profile.basic_health_info.weight.value = null;
          this.profile.basic_health_info.weight.unit = null;
          this.profile.health_risk_factors.is_smoker = null;
          this.profile.contact.address1 = null;
          this.profile.contact.address2 = null;
          this.profile.contact.state = null;
          this.profile.contact.country = null;
          this.profile.contact.zip_code = null;

          this.selectedModal = null;
          break;

        case this.modalNames[3]:
          this.pre_existing_conditions._id = null;
          this.pre_existing_conditions.name = null;
          this.pre_existing_conditions.description = null;
          this.pre_existing_conditions.start_date = null;
          this.pre_existing_conditions.end_date = null;
          this.pre_existing_conditions.is_condition_exists = null;
          this.pre_existing_conditions.file = null;

          this.selectedModal = null;
          break;

        case this.modalNames[4]:
          this.emergency_contacts._id = null;
          this.emergency_contacts.first_name = null;
          this.emergency_contacts.last_name = null;
          this.emergency_contacts.relationship = null;
          this.emergency_contacts.phone.number = null;
          this.emergency_contacts.phone.country_code = null;
          this.emergency_contacts.address1 = null;
          this.emergency_contacts.address2 = null;
          this.emergency_contacts.state = null;
          this.emergency_contacts.country = null;
          this.emergency_contacts.zip_code = null;

          this.selectedModal = null;
          break;

        case this.modalNames[5]:
          this.dependent._id = null;
          this.dependent.first_name = null;
          this.dependent.last_name = null;
          this.dependent.gender = null;
          this.dependent.date_of_birth = null;
          this.dependent.relationship = null;
          this.dependent.basic_health_info.height.unit = null;
          this.dependent.basic_health_info.height.value = null;
          this.dependent.basic_health_info.weight.unit = null;
          this.dependent.basic_health_info.weight.value = null;
          this.dependent.contact.email = null;
          this.dependent.contact.phone.number = null;
          this.dependent.contact.phone.country_code = null;
          this.dependent.contact.address1 = null;
          this.dependent.contact.address2 = null;
          this.dependent.contact.state = null;
          this.dependent.contact.country = null;
          this.dependent.contact.zip_code = null;

          this.selectedModal = null;
          break;

        case this.modalNames[6]:
          this.selectedModal = null;
          break;
      }
    },

    removeItem(type, item) {
      switch (type) {
        case "pre-existing-condition":
          this.actionType = type;
          this.parsedItem = item;
          this.openCautionModal = true;
          break;

        case "emergency-contact":
          this.actionType = type;
          this.parsedItem = item;
          this.openCautionModal = true;
          break;

        case "dependent":
          this.actionType = type;
          this.parsedItem = item;
          this.openCautionModal = true;
          break;
      }
    },

    async accept() {
      this.loadingCaution = true;
      let res = await this.remove({
        id: this.parsedItem._id,
        type: this.actionType,
      });

      if (res == true) {
        this.openCautionModal = false;
        this.loadingCaution = false;
      }
    },

    closeCautionModal() {
      this.actionType = null;
      this.parsedItem = null;
      this.openCautionModal = false;
    },

    async updateData(name) {
      let res = null;

      switch (name) {
        case this.modalNames[2]:
          this.loadingModal = true;
          res = await this.updateUserProfile({ profile: this.profile });

          if (res == true) {
            this.closeModal(this.modalNames[2]);
            this.loadingModal = false;
          }

          break;

        case this.modalNames[3]:
          this.loadingModal = true;
          res = await this.updateUserProfile({
            pre_existing_conditions: this.pre_existing_conditions,
          });

          if (res == true) {
            this.closeModal(this.modalNames[3]);
            this.loadingModal = false;
          }

          break;

        case this.modalNames[4]:
          this.loadingModal = true;
          res = await this.updateUserProfile({
            emergency_contacts: [this.emergency_contacts],
          });

          if (res == true) {
            this.closeModal(this.modalNames[4]);
            this.loadingModal = false;
          }

          break;

        case this.modalNames[5]:
          this.loadingModal = true;
          res = await this.updateUserProfile({
            dependants: [this.dependent],
          });

          if (res == true) {
            this.closeModal(this.modalNames[5]);
            this.loadingModal = false;
          }

          break;
      }
    },

    /*
  
          Add new card using paystack
  
          1. Get amount, paystack key and ref data from cards endpoint
          2. pass returned data to paystack
          3. Collect card details with paystack pop-over
          4. Open websocket to monitor transaction status
          5. When successful save card details to cards endpoint
  
          */

    async addCard() {
      // Get transaction details
      const res = await axios.post("cards");

      // Save response to variable
      const details = {
        amount: res.data.data.amount,
        key: res.headers["x-paystack-key"],
        ref: res.data.data.reference,
      };

      // Call paystack fuction
      this.getPaystack(details);

      // Open websocket
      const socket = io(`${process.env.VUE_APP_API_GATEWAY}/websockets`);

      // Save data to store if transaction is successfull
      socket.on("event", async (evt) => {
        if (evt.data.status == "success") {
          let res = await axios.get("cards");

          this.$store.commit("SET_CARDS", res.data.data);

          socket.disconnect();
        }
      });
    },

    // Function paystack api
    getPaystack(data) {
      let handler = PaystackPop.setup({
        key: data.key,
        email: this.userBasicInfo.contact.email,
        amount: data.amount,
        ref: data.ref,

        callback: (res) => verifyCard(res),
      });

      async function verifyCard(res) {
        try {
          await axios.post("cards/verify", {
            reference: res.reference,
          });
        } catch (err) {
          console.log(err);
        }
      }
      handler.openIframe();
    },

    /*
  
          Update 2FA method
  
          */

    // Function to select 2FA method
    async selectedMethod(i) {
      if (this.twoFAs[i].name === "email") {
        this.twoFAs[i].isLoading = true;
        await this.updateTwoFA("EMAIL");

        this.twoFAs[i].isLoading = false;
      }

      if (this.twoFAs[i].name === "sms" && this.isPhoneVerified == false) {
        this.twoFAs[i].isLoading = true;
        const phone = this.userBasicInfo.contact.phone.number.replace(
          /[-]/g,
          ""
        );
        this.sendVerCode(phone);
        this.openModal({ name: this.modalNames[0] });
      } else if (
        this.twoFAs[i].name === "sms" &&
        this.isPhoneVerified == true
      ) {
        this.twoFAs[i].isLoading = true;
        await this.updateTwoFA("SMS");

        this.twoFAs[i].isLoading = false;
      }

      if (
        this.twoFAs[i].name === "auth_apps" &&
        this.isAutAppEnabled == false
      ) {
        this.twoFAs[i].isLoading = true;
        let saved_token = localStorage.getItem("token")
          ? localStorage.getItem("token")
          : sessionStorage.getItem("token");

        this.sendSecreteCode(saved_token);
      } else if (
        this.twoFAs[i].name === "auth_apps" &&
        this.isAutAppEnabled == true
      ) {
        this.twoFAs[i].isLoading = true;
        await this.updateTwoFA("AUTH_APPS");

        this.twoFAs[i].isLoading = false;
      }
    },

    resendCode() {
      let phone = this.userBasicInfo.contact.phone.number;
      this.sendVerCode(phone);
    },

    async autoSubmitPhone() {
      if (this.otpPhone.length >= 6) {
        this.loadingPhone = true;
        let phone = "0" + this.userBasicInfo.contact.phone.number;
        await this.verifyNumber({ code: this.otpPhone.join(""), phone: phone });

        this.closeModal(this.modalNames[0]);
        this.loadingPhone = false;
      }
    },

    async autoSubmitApp() {
      if (this.otpApp.length >= 6) {
        this.loadingApp = true;
        await this.activateApp({ code: this.otpApp.join("") });

        this.closeModal(this.modalNames[1]);
        this.loadingApp = false;
      }
    },

    /* UTILITY FUNCTIONS */

    // convet date format to a more readable format
    extractDate(date, lang) {
      let dateVal = new Date(date);
      let year = dateVal.getFullYear();
      let month = dateVal.toLocaleString(lang, { month: "short" });
      let day = dateVal.getDate().toString().padStart(2, "0");

      return `${day} ${month}, ${year}`;
    },

    // convert phone number to format with country code
    formatPhone(countryCode, phoneNumber) {
      if (countryCode || phoneNumber) {
        return `
                  ${countryCode} (0) ${phoneNumber.replace(
          /^(\d{3})(\d{3})(\d{4})/g,
          "$1 $2 $3"
        )}`;
      }
    },

    readImage(imgData) {
      let reader = new FileReader(imgData);
      reader.onload = (event) => {
        this.qrURL = event.target.result;
      };
    },
  },

  watch: {
    status(value) {
      if (value == false) {
        this.loading = false;
      }
      if (value == true) {
        this.closeModal(this.modalNames[0]);
        this.toast = true;
      }
    },

    authMedium: {
      handler(value) {
        if (value) {
          this.twoFAs.forEach((item) => {
            if (item.name === value) {
              item.isActive = true;
            } else {
              item.isActive = false;
            }
          });
        }
      },
      immediate: true,
    },

    QRCode(value) {
      if (value) {
        this.openModal({ name: this.modalNames[1] });
      }
    },
  },

  mounted() {
    let script = document.getElementsByTagName("script");
    let status = Object.keys(script).every(
      (key) => script[key].src !== "https://js.paystack.co/v1/inline.js"
    );

    if (status) {
      let paystack = document.createElement("script");
      paystack.setAttribute("src", "https://js.paystack.co/v1/inline.js");
      document.head.appendChild(paystack);
    }
  },
};
</script>

<style scoped lang="scss">
.page-content {
  @include flexItem(vertical) {
    gap: $size-12;
    max-width: 82.67rem;
    flex-grow: 1;
    height: 100vh;

    @include responsive(tab-landscape) {
      min-height: 100vh;
    }

    @include responsive(tab-portrait) {
      width: 100%;
      gap: $size-4;
    }
  }

  &__body {
    @include flexItem(vertical) {
      gap: $size-44;
      overflow-x: hidden;
      padding: $size-12 $size-48 $size-0 $size-48;
      margin-left: $size-8;
      margin-right: $size-8;
      width: 100%;

      @include responsive(tab-landscape) {
        padding-left: $size-32;
        padding-right: $size-32;
        margin-left: $size-0;
        margin-right: $size-0;
      }

      @include responsive(phone) {
        padding: $size-12 $size-8 $size-0 $size-8;
      }
    }

    .tab__content-group {
      @include flexItem(horizontal) {
        align-items: flex-start;
        justify-content: flex-start;
        overflow-x: hidden;
        width: 100%;

        & > * {
          flex-shrink: 0;
          flex-grow: 1;
          width: 100%;
        }
      }
    }

    .section-1 {
      @include flexItem(horizontal) {
        gap: $size-38;

        @include responsive(tab-portrait) {
          @include flexItem(vertical) {
            align-items: center;
            position: relative;
          }

          #btn-edit {
            position: absolute;
            top: 0;
            right: 0;
          }
        }
        .user-bio {
          @include flexItem(vertical) {
            width: 100%;
            gap: $size-16;
            margin-top: $size-8;
          }

          .title {
            font-size: $size-28;
            font-weight: fw-semi-bold;
            line-height: 1.25;
            letter-spacing: 0.02;
            @include responsive(phone) {
              text-align: center;
            }
          }

          .pri-data {
            display: flex;
            gap: $size-56;
            justify-content: space-between;

            @include responsive(phone) {
              padding: $size-0 $size-12;
              flex-direction: column;
              gap: $size-24;
            }

            .col-1,
            .col-2 {
              flex-grow: 1;
              display: flex;
              flex-direction: column;
              width: 100%;
              gap: $size-4;

              & * {
                font-size: $size-16;
                font-weight: $fw-regular;
                line-height: 1.5;
                color: $color-g-44;
              }

              @include responsive(phone) {
                & * {
                  font-size: $size-15;
                }
              }
            }
          }

          .address {
            @include flexItem(vertical) {
              gap: $size-4;
              flex-grow: 1;
            }

            & * {
              font-size: $size-16;
              font-weight: $fw-regular;
              line-height: 1.5;
              color: $color-g-44;
            }

            @include responsive(phone) {
              padding: $size-0 $size-12;
              & * {
                font-size: $size-15;
              }
            }
          }
        }
      }
    }

    .section-2 {
      @include flexItem(vertical) {
        align-items: center;
        width: 100%;
        padding-top: $size-16;
        gap: $size-24;

        @include responsive(tab-portrait) {
          min-height: 100%;
        }

        @include responsive(phone) {
          min-height: 450px;
        }
      }
    }

    .list-container {
      @include flexItem(vertical);
      width: 100%;
    }

    .list-item {
      @include flexItem(horizontal) {
        align-items: center;
        gap: $size-32;
        padding: $size-24;
        border-bottom: $size-1 solid $color-g-90;
      }

      @include responsive(phone) {
        padding-inline: $size-10;
      }
    }

    .section__body {
      width: 100%;

      .unpopulated {
        @include flexItem(vertical) {
          gap: $size-16;
          align-items: center;
          justify-content: center;
          padding: $size-24;
          width: 100%;
        }

        .hint {
          font-size: $size-16;
          color: $color-g-44;
          text-align: center;
        }
      }
    }

    .text-group-row {
      @include flexItem(vertical) {
        gap: $size-8;
        flex-grow: 1;
      }
    }

    .text-group-col {
      @include flexItem(horizontal) {
        align-items: center;
        flex-grow: 1;
        gap: $size-8;
      }
    }

    .hint {
      font-size: $size-16;
      font-weight: $fw-regular;
      color: $color-g-44;
    }

    .card-list-item {
      @include flexItem(horizontal) {
        align-items: center;
        gap: $size-32;
        padding: $size-24;
        width: 100%;
      }

      @include responsive(phone) {
        flex-direction: column;
        align-items: flex-start;
        gap: $size-12;
        padding-inline: $size-10;
      }

      .plan-title {
        font-size: $size-26;
        font-weight: $fw-semi-bold;
      }
    }
  }

  .list-lvl2 {
    @include flexItem(horizontal) {
      justify-content: space-between;
      align-items: center;
      gap: $size-16;
      padding: $size-16 $size-16;
      border-bottom: $size-1 solid $color-g-85;

      p {
        font-size: $size-16;
        color: $color-g-44;
        font-weight: $fw-regular;
      }

      .right {
        @include flexItem(horizontal) {
          justify-content: flex-end;
          align-items: center;
        }
      }

      .method-left-pane {
        @include flexItem(horizontal) {
          gap: $size-10;
          align-items: center;

          span {
            font-size: 12px;
            color: $color-sec-s1;
            cursor: pointer;
          }
        }
      }
    }
  }

  .whatsapp-section {
    margin-top: $size-24;
    padding: $size-0 $size-24;

    @include responsive(phone) {
      padding: $size-0 $size-10;
    }
  }
}

.modal {
  &__body-content {
    @include flexItem(vertical) {
      align-items: center;
      gap: $size-24;
      padding: $size-24 $size-8 $size-32 $size-8;
      width: 600px;

      p {
        font-size: $size-16;
        font-weight: $fw-regular;
        color: $color-g-44;
      }
    }
  }

  &__content {
    @include flexItem(vertical) {
      gap: $size-32;
      align-items: center;
      width: 100%;
    }

    .caution {
      @include flexItem(horizontal) {
        gap: $size-32;
        width: 95%;
      }

      .text {
        text-align: left;
        font-size: $size-18;
        font-weight: $fw-regular;
        color: $color-g-21;
        line-height: 1.5;
        letter-spacing: 0.02em;
        padding-top: $size-8;
      }
    }

    &.special {
      gap: $size-48;
    }
    .body__inputs {
      @include flexItem(vertical) {
        gap: $size-16;
        width: 100%;
      }
    }

    .section__top {
      @include flexItem(vertical) {
        align-items: center;
        gap: $size-14;

        .message-box {
          @include flexItem(horizontal) {
            align-items: center;
            justify-content: center;
            background-color: $color-pri-t5;
            padding: $size-10 $size-16;
            border-radius: $size-18;

            .message {
              font-size: $size-14;
              font-weight: $fw-regular;
              text-align: center;
              color: $color-pri-s1;
              line-height: 1.25;
            }
          }
        }
      }
    }

    .section__plans {
      @include flexItem(horizontal) {
        justify-content: center;
        gap: $size-24;

        @include responsive(tab-portrait) {
          width: 100%;
          overflow-x: auto;
          justify-content: flex-start;

          @include scrollBar(none);
        }
      }
    }
  }
  .button {
    @include responsive(phone) {
      width: 100%;
    }
  }
}
.btn-group {
  display: flex;
  gap: $size-24;

  .context-menu {
    display: none;
  }

  .action-btns {
    display: flex;
    gap: $size-24;
  }

  @include responsive(phone) {
    gap: $size-0;
    align-items: flex-start;

    .context-menu {
      display: block;
    }

    .action-btns {
      display: none;
    }
  }
}

// Tab transition animation
@include animation(tab-transition);
</style>
