<template>
  <div class="outer-viewport d-flex justify-center align-center pa-4">
    <v-card class="login-card-split d-flex flex-column flex-md-row overflow-hidden" elevation="0">
      <div class="brand-panel d-flex flex-column justify-center align-center pa-8 text-center">
        <v-icon class="mb-6" size="100">mdi-package-variant-closed</v-icon>
        <h2 class="mb-3">Admin Web Frame</h2><p class="mt-6">စီမံခန့်ခွဲရေးစနစ်</p>
      </div>
      <div class="form-panel pa-8 pa-sm-12 d-flex flex-column justify-center">
        <h2 class="text-h4 mb-2">Log In</h2><p class="text-medium-emphasis mb-8">Enter your credentials to access your portal</p>
        <v-alert v-if="error" class="mb-4" type="error" variant="tonal">{{ error }}</v-alert>
        <v-alert v-if="route.query.reason === 'expired'" class="mb-4" type="info" variant="tonal">Your session expired. Please log in again.</v-alert>
        <v-alert v-if="route.query.reason === 'logout-local'" class="mb-4" type="info" variant="tonal">You are signed out on this device. The server logout request could not be completed.</v-alert>
        <v-form ref="formRef" @submit.prevent="HandleLogin">
          <label class="d-block mb-2">Username</label><v-text-field
            v-model="user.username"
            aria-label="Username"
            autocomplete="username"
            density="comfortable"
            :disabled="appStore.loading"
            prepend-inner-icon="mdi-shield-account-outline"
            :rules="[required, usernameLength]"
            variant="outlined"
          />
          <label class="d-block mb-2 mt-2">Password</label><v-text-field
            v-model="user.password"
            :append-inner-icon="showpass ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
            aria-label="Password"
            autocomplete="current-password"
            density="comfortable"
            :disabled="appStore.loading"
            prepend-inner-icon="mdi-lock-outline"
            :rules="[required]"
            :type="showpass ? 'text' : 'password'"
            variant="outlined"
            @click:append-inner="showpass = !showpass"
          />
          <v-btn
            block
            class="action-btn-gradient mt-3"
            :loading="appStore.loading"
            size="x-large"
            type="submit"
          >Login <v-icon class="ml-2">mdi-arrow-right</v-icon></v-btn>
        </v-form>
      </div>
    </v-card>
  </div>
</template>
<script setup>
  import { ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useNotification } from '@/composables/useNotification'
  import { useAppStore } from '@/stores/app'
  import { landingRoute, safeRedirect } from '@/utilities/navigation'
  const { showNotification } = useNotification()
  const appStore = useAppStore()
  const router = useRouter()
  const route = useRoute()
  const user = ref({ username: '', password: '' })
  const formRef = ref(null)
  const showpass = ref(false)
  const error = ref('')
  const required = value => !!value || 'ထည့်သွင်းရန်လိုအပ်ပါသည်။'
  const usernameLength = value => (value.trim().length > 0 && value.trim().length <= 80) || 'Enter a valid username'
  async function HandleLogin () {
    if (appStore.loading || !(await formRef.value.validate()).valid) return
    error.value = ''
    try {
      await appStore.Login(user.value)
      user.value.password = ''
      const destination = safeRedirect(route.query.redirect) || landingRoute(appStore)
      await router.replace(destination)
    } catch (error_) {
      error.value = error_.message
      showNotification(error_.message, 'error')
      user.value.password = ''
    }
  }
</script>
<style scoped>
.outer-viewport { min-height: 100vh; width: 100%; background: radial-gradient(circle at center, #f0f7ff 0%, #dbeafe 100%); }
.login-card-split { width: 100%; max-width: 960px; min-height: 580px; background: #fff; box-shadow: 0 30px 60px -12px rgba(0, 0, 0, .25) !important; }
.brand-panel { flex: 1.1; background: linear-gradient(160deg, #0b1fbc, #3852b4); color: #fff; }
.form-panel { flex: 1; min-width: 0; }
.action-btn-gradient { background: linear-gradient(135deg, #3852b4, #1976d2); color: #fff; }
@media (max-width: 959px) { .login-card-split { min-height: auto; max-width: 560px; } .brand-panel { padding: 24px !important; } }
</style>
