<template>
  <v-dialog v-model="dialog" persistent :width="dialogWidth">
    <v-card>
      <v-toolbar color="secondary" density="compact">
        <v-toolbar-title>User ထည့်သွင်း/ပြင်ဆင်ရန်</v-toolbar-title><v-spacer />
        <v-btn
          aria-label="Close user entry"
          color="error"
          :disabled="saving || validating"
          icon="mdi-close"
          @click="ClearData"
        />
      </v-toolbar>
      <v-form ref="formRef" autocomplete="off" @submit.prevent="SaveOrUpdate">
        <v-container class="pa-6">
          <v-alert v-if="error" class="mb-4" type="error" variant="tonal">{{ error }}</v-alert>
          <v-row dense>
            <v-col cols="12" md="6"><label>Name <span class="text-red">*</span></label><v-text-field
              v-model="model.name"
              aria-label="Name"
              density="compact"
              :rules="[required, nameLength]"
            /></v-col>
            <v-col cols="12" md="6"><label>User Name <span class="text-red">*</span></label><v-text-field
              v-model="model.username"
              aria-label="User Name"
              density="compact"
              :rules="[required, usernameLength]"
            /></v-col>
            <v-col cols="12" md="6"><label>Role <span class="text-red">*</span></label><v-autocomplete
              v-model="model.role_id"
              aria-label="Role"
              clearable
              density="compact"
              item-title="name"
              item-value="id"
              :items="roleList"
              :loading="loading"
              :rules="[required]"
            /><v-btn v-if="roleError" size="small" variant="text" @click="LoadRoles">Retry role loading</v-btn></v-col>
            <v-col cols="12" md="6"><label>Expiry Date</label><v-text-field
              v-model="model.expired_date"
              aria-label="Expiry Date"
              clearable
              density="compact"
              hint="Leave empty for no expiry"
              persistent-hint
              :rules="[expiryRule]"
              type="date"
            /></v-col>
            <template v-if="!model.id">
              <v-col cols="12" md="6"><label>Password <span class="text-red">*</span></label><v-text-field
                v-model="model.password"
                :append-inner-icon="showPassText ? 'mdi-eye-off' : 'mdi-eye'"
                aria-label="Password"
                autocomplete="new-password"
                density="compact"
                :rules="[required, passwordLength]"
                :type="showPassText ? 'text' : 'password'"
                @click:append-inner="showPassText = !showPassText"
              /></v-col>
              <v-col cols="12" md="6"><label>Confirm Password <span class="text-red">*</span></label><v-text-field
                v-model="model.confirm_password"
                aria-label="Confirm Password"
                autocomplete="new-password"
                density="compact"
                :rules="[required, matchingPassword]"
                :type="showPassText ? 'text' : 'password'"
              /></v-col>
            </template>
            <v-col cols="12"><v-radio-group v-model="model.status" hide-details inline label="Status"><v-radio color="success" label="Active" :value="true" /><v-radio color="error" label="Blocked" :value="false" /></v-radio-group></v-col>
            <v-col cols="12"><v-card-actions><v-spacer /><v-btn color="primary" :disabled="loading || roleError || !appStore.CheckPermission(constants.USERS, constants.WRITE_ACTION)" :loading="saving || validating" type="submit">Save</v-btn><v-btn color="warning" :disabled="saving || validating" @click="ClearData">Cancel</v-btn></v-card-actions></v-col>
          </v-row>
        </v-container>
      </v-form>
    </v-card>
  </v-dialog>
</template>
<script setup>
  import { computed, nextTick, ref } from 'vue'
  import { useDisplay } from 'vuetify'
  import { useNotification } from '@/composables/useNotification'
  import Model, { userModel } from '@/models/user'
  import RoleService from '@/services/role.service'
  import Service from '@/services/user.service'
  import { useAppStore } from '@/stores/app'
  import constants from '@/utilities/constants'
  const { showNotification } = useNotification()
  const appStore = useAppStore()
  const display = useDisplay()
  const dialogWidth = computed(() => display.smAndDown.value ? '95%' : '60%')
  const emit = defineEmits(['AfterSaved'])
  const formRef = ref(null)
  const dialog = ref(false)
  const model = ref(new Model())
  const roleList = ref([])
  const loading = ref(false)
  const saving = ref(false)
  const validating = ref(false)
  const roleError = ref(false)
  const error = ref('')
  const showPassText = ref(false)
  const required = value => !!String(value ?? '').trim() || 'ထည့်သွင်းရန်လိုအပ်ပါသည်။'
  const nameLength = value => String(value).trim().length <= 120 || 'Name must be 120 characters or fewer'
  const usernameLength = value => (value.trim().length >= 3 && value.trim().length <= 80) || 'User Name must be 3–80 characters'
  const passwordLength = value => (value.length >= 8 && value.length <= 128) || 'Password must be 8–128 characters'
  const matchingPassword = value => value === model.value.password || 'Passwords must match'
  const expiryRule = value => !value || /^\d{4}-\d{2}-\d{2}$/.test(value) || 'Enter a valid date'
  async function LoadRoles () {
    loading.value = true
    roleError.value = false
    error.value = ''
    try {
      roleList.value = (await RoleService.GetRoleList()).data
    } catch (error_) {
      roleError.value = true
      error.value = error_.message
      showNotification(error_.message, 'error')
    } finally {
      loading.value = false
    }
  }
  async function Show (data = null) {
    if (!appStore.CheckPermission(constants.USERS, constants.WRITE_ACTION)) return
    model.value = data ? userModel(data) : new Model()
    showPassText.value = false
    dialog.value = true
    await nextTick()
    formRef.value?.resetValidation()
    await LoadRoles()
  }
  function ClearData () {
    if (saving.value || validating.value) return
    model.value = new Model()
    error.value = ''
    dialog.value = false
  }
  async function SaveOrUpdate () {
    if (saving.value || validating.value || loading.value || roleError.value || !appStore.CheckPermission(constants.USERS, constants.WRITE_ACTION)) return
    validating.value = true
    let valid
    try {
      valid = (await formRef.value.validate()).valid
    } finally {
      validating.value = false
    }
    if (!valid) return
    saving.value = true
    error.value = ''
    try {
      const response = await Service.SaveOrUpdate(model.value)
      const currentUser = model.value.id === appStore.loginUserInfo?.id
      if (currentUser) {
        try {
          await appStore.loadUserInfo()
        } catch {
          appStore.setLogOutUserInfo()
        }
      }
      emit('AfterSaved', response.data.message || 'User saved')
      if (currentUser) window.dispatchEvent(new CustomEvent('access-inventory:permissions-changed'))
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
