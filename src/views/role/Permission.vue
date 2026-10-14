<template>
  <v-dialog v-model="dialog" fullscreen persistent transition="scroll-y-reverse-transition">
    <v-card>
      <v-toolbar color="#3852B4"><v-toolbar-title>Permission - {{ roleName }}</v-toolbar-title><v-spacer /><v-btn
        aria-label="Close permissions"
        color="error"
        :disabled="saving"
        icon="mdi-close"
        @click="closeDialog"
      /></v-toolbar>
      <v-card-text>
        <div class="d-flex justify-end mb-3"><v-btn
          v-if="canWrite"
          color="primary"
          :disabled="loading || !!loadError || model.length === 0"
          :loading="saving"
          @click="SavePermission"
        >Save</v-btn></div>
        <v-progress-linear v-if="loading" color="primary" indeterminate />
        <v-alert v-if="error" class="mb-3" type="error" variant="tonal">{{ error }}<template v-if="loadError" #append><v-btn @click="LoadPermissions">Retry</v-btn></template></v-alert>
        <v-alert v-if="!loading && !error && model.length === 0" type="info" variant="tonal">No program codes are configured in the backend.</v-alert>
        <v-table>
          <thead style="background-color: darkgray; color: white"><tr><th>Program Code</th><th>Show Action</th><th>Write Action</th><th>Delete Action</th><th>Print Action</th></tr></thead>
          <tbody><tr v-for="item in model" :key="item.program_code_id">
            <td>{{ item.text || item.programCodeName }}</td>
            <td v-for="field in fields" :key="field.key"><v-checkbox
              v-model="item[field.key]"
              :aria-label="(item.text || item.programCodeName) + ' ' + field.label"
              color="primary"
              :disabled="!canWrite || saving || (field.key !== 'can_read' && !item.can_read) || (field.key === 'can_delete' && !item.can_write)"
              hide-details
              @update:model-value="ActionChange(item)"
            /></td>
          </tr></tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-dialog>

</template>
<script setup>
  import { computed, onBeforeUnmount, ref } from 'vue'
  import { useNotification } from '@/composables/useNotification'
  import Service from '@/services/programCodeService'
  import { useAppStore } from '@/stores/app'
  import constants from '@/utilities/constants'
  import { normalizeActions } from '@/utilities/permissions'
  const appStore = useAppStore()
  const emit = defineEmits(['AfterSaved'])
  const { showNotification } = useNotification()
  const dialog = ref(false)
  const loading = ref(false)
  const saving = ref(false)
  const model = ref([])
  const roleName = ref('')
  const roleId = ref(null)
  const error = ref('')
  const loadError = ref(false)
  let version = 0
  const canWrite = computed(() => appStore.CheckPermission(constants.ROLES, constants.WRITE_ACTION))
  const fields = [{ key: 'can_read', label: 'Read' }, { key: 'can_write', label: 'Write' }, { key: 'can_delete', label: 'Delete' }, { key: 'can_print', label: 'Print' }]
  const ActionChange = item => normalizeActions(item)
  async function LoadPermissions () {
    const requestVersion = ++version
    loading.value = true
    error.value = ''
    loadError.value = false
    model.value = []
    try {
      const response = await Service.GetPermissionListByRoleId(roleId.value)
      if (requestVersion !== version) return
      if (!Array.isArray(response.data)) throw new Error('Unexpected permission matrix response')
      model.value = response.data.map(item => ({ ...item }))
      roleName.value = response.data[0]?.role_name || roleName.value
    } catch (error_) {
      if (requestVersion === version) {
        error.value = error_.message
        showNotification(error_.message, 'error')
        loadError.value = true
      }
    } finally {
      if (requestVersion === version) loading.value = false
    }
  }
  async function OpenDialog (id, name = '') {
    if (!appStore.CheckPermission(constants.ROLES, constants.READ_ACTION)) return
    roleId.value = id
    roleName.value = name
    dialog.value = true
    await LoadPermissions()
  }
  function closeDialog () {
    if (saving.value) return
    version += 1
    dialog.value = false
    model.value = []
  }
  async function SavePermission () {
    if (!canWrite.value || saving.value || loading.value || loadError.value || model.value.length === 0) return
    saving.value = true
    error.value = ''
    try {
      const response = await Service.SavePermission(model.value.map(item => normalizeActions({ ...item })))
      if (roleId.value === appStore.loginUserInfo?.roleId) {
        try {
          await appStore.refreshPermissions()
        } catch {
          appStore.setLogOutUserInfo()
        }
      }
      showNotification(response.data.message || 'Permission သတ်မှတ်ပြီးပါပြီ။')
      emit('AfterSaved')
      saving.value = false
      closeDialog()
    } catch (error_) {
      error.value = error_.message
      showNotification(error_.message, 'error')
    } finally {
      saving.value = false
    }
  }
  onBeforeUnmount(() => {
    version += 1
  })
  defineExpose({ OpenDialog })
</script>
