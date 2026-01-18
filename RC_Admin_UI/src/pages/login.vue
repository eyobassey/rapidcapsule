<script setup>
import { VForm } from 'vuetify/components/VForm'
import { useGenerateImageVariant } from '@/@core/composable/useGenerateImageVariant'
import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import boyWithRocketDark from '@images/illustrations/boy-with-rocket-dark.png'
import boyWithRocketLight from '@images/illustrations/boy-with-rocket-light.png'
import { themeConfig } from '@themeConfig'
import logo from '@images/rp-logo.svg?raw'

const boyWithRocket = useGenerateImageVariant(boyWithRocketLight, boyWithRocketDark)
const isPasswordVisible = ref(false)
const refVForm = ref()
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Please enter both email and password'
    return
  }
  
  try {
    isLoading.value = true
    errorMessage.value = ''
    
    const params = new URLSearchParams()
    params.append('email', email.value)
    params.append('password', password.value)
    
    const response = await fetch('/admin-api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params
    })
    
    const data = await response.json()
    
    if (response.ok) {
      // Store the token in the expected format { access_token: "..." }
      localStorage.setItem('accessToken', JSON.stringify({ access_token: data.data }))
      // Redirect to admin dashboard
      window.location.href = '/admin/'
    } else {
      errorMessage.value = data.message || 'Login failed'
    }
  } catch (error) {
    errorMessage.value = 'Network error. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <VRow
    no-gutters
    class="auth-wrapper"
  >
    <VCol
      lg="8"
      class="d-none d-lg-flex"
    >
      <!-- illustration -->
      <div class="position-relative w-100 pa-8">
        <div class="d-flex align-center justify-center w-100 h-100">
          <VImg
            max-width="700"
            :src="boyWithRocket"
            class="auth-illustration"
          />
        </div>
      </div>
    </VCol>

    <VCol
      cols="12"
      lg="4"
      class="d-flex align-center justify-center"
      style="background-color: rgb(var(--v-theme-surface));"
    >
      <VCard
        flat
        :max-width="500"
        class="mt-12 mt-sm-0 pa-6"
      >
        <VCardItem class="justify-start">
          <template #prepend>
            <div class="d-flex">
              <div v-html="logo" style="line-height:0; color: rgb(var(--v-global-theme-primary))"></div>
            </div>
          </template>

          <VCardTitle class="auth-title">
            Rapid Capsule Admin
          </VCardTitle>
        </VCardItem>

        <VCardText>
          <h6 class="text-h6 mb-1">
            Welcome to Rapid Capsule Admin! 👋🏻
          </h6>

          <p class="mb-0">
            Please sign-in to your account and start the adventure
          </p>
        </VCardText>

        <VCardText>
          <VAlert
            v-if="errorMessage"
            type="error"
            class="mb-4"
          >
            {{ errorMessage }}
          </VAlert>
          
          <VForm
            ref="refVForm"
            @submit.prevent="handleLogin"
          >
            <VRow>
              <!-- email -->
              <VCol cols="12">
                <VTextField
                  v-model="email"
                  label="Email"
                  type="email"
                />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <VTextField
                  v-model="password"
                  label="Password"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isPasswordVisible ? 'bx-hide' : 'bx-show'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />

                <div class="d-flex align-center flex-wrap justify-space-between mt-2 mb-6">
                  <VCheckbox
                    v-model="rememberMe"
                    label="Remember me"
                  />
                  <a
                    class="text-primary text-sm ms-2 mb-1"
                    href="#"
                  >
                    Forgot Password?
                  </a>
                </div>

                <VBtn
                  block
                  type="submit"
                  class="mb-1"
                  :loading="isLoading"
                  :disabled="isLoading"
                >
                  {{ isLoading ? 'Signing in...' : 'Login' }}
                </VBtn>
              </VCol>

              <!-- create account -->
              <VCol
                cols="12"
                class="text-center"
              >
                <span>New on our platform?</span>
                <a
                  class="text-primary ms-2"
                  href="#"
                >
                  Create an account
                </a>
              </VCol>
              <VCol
                cols="12"
                class="d-flex align-center"
              >
                <VDivider />
                <span class="mx-4">or</span>
                <VDivider />
              </VCol>

              <!-- auth providers -->
              <VCol
                cols="12"
                class="text-center"
              >
                <AuthProvider />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth.scss";
</style>

<route lang="yaml">
meta:
  layout: blank
</route>
