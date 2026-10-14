<template>
  <v-dialog v-model="dialog" max-width="560" persistent><v-card>
    <v-toolbar color="#3852B4" density="compact"><v-toolbar-title>Change Password</v-toolbar-title><v-spacer /><v-btn aria-label="Close password change" :disabled="saving" icon="mdi-close" @click="ClearData" /></v-toolbar>
    <v-card-text><v-alert v-if="error" class="mb-3" type="error" variant="tonal">{{ error }}</v-alert><v-form ref="formRef" @submit.prevent="SaveOrUpdate">
      <v-text-field
        v-model="model.old_password"
        autocomplete="current-password"
        density="compact"
        label="Current Password"
        :rules="[required]"
        :type="showPassText ? 'text' : 'password'"
        variant="outlined"
      />
      <v-text-field
        v-model="model.password"
        :append-inner-icon="showPassText ? 'mdi-eye-off' : 'mdi-eye'"
        autocomplete="new-password"
        density="compact"
        label="New Password"
        :rules="[required, passwordLength]"
        :type="showPassText ? 'text' : 'password'"
        variant="outlined"
        @click:append-inner="showPassText = !showPassText"
      />
      <v-text-field
        v-model="model.confirm_password"
        autocomplete="new-password"
        density="compact"
        label="Confirm Password"
        :rules="[required, matchingPassword]"
        :type="showPassText ? 'text' : 'password'"
        variant="outlined"
      />
      <div class="text-right"><v-btn class="mr-3" color="warning" :disabled="saving" @click="ClearData">Cancel</v-btn><v-btn color="primary" :loading="saving" type="submit">Save</v-btn></div>
    </v-form></v-card-text>
  </v-card></v-dialog>
</template>
<script setup>
  import { nextTick, ref } from 'vue'
  import { useNotification } from '@/composables/useNotification'
  import Service from '@/services/user.service'
  const { showNotification } = useNotification()
  const emit = defineEmits(['AfterSaved'])
  const dialog = ref(false)
  const formRef = ref(null)
  const model = ref({})
  const error = ref('')
  const saving = ref(false)
  const showPassText = ref(false)
  const required = value => !!value || 'ထည့်သွင်းရန်လိုအပ်ပါသည်။'
  const passwordLength = value => (value.length >= 8 && value.length <= 128) || 'Password must be 8–128 characters'
  const matchingPassword = value => value === model.value.password || 'Passwords must match'
  async function Show () {
    model.value = { old_password: '', password: '', confirm_password: '' }
    error.value = ''
    showPassText.value = false
    dialog.value = true
    await nextTick()
    formRef.value?.resetValidation()
  }
  function ClearData () {
    if (saving.value) return
    model.value = {}
    dialog.value = false
    error.value = ''
  }
  async function SaveOrUpdate () {
    if (saving.value || !(await formRef.value.validate()).valid) return
    saving.value = true
    error.value = ''
    try {
      const response = await Service.ResetPassword(model.value)
      emit('AfterSaved', response.data.message)
      saving.value = false
      ClearData()
    } catch (error_) {
      error.value = error_.message
      showNotification(error_.message, 'error')
    } finally {
      saving.value = false
    }
  }
  defineExpose({ Show })
</script>
