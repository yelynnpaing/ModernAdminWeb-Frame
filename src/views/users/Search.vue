<template>
  <v-dialog v-model="dialog" persistent :width="dialogWidth"><v-card>
    <v-toolbar color="secondary" density="compact"><v-toolbar-title>ရှာဖွေရန်</v-toolbar-title><v-spacer /><v-btn aria-label="Close search" icon="mdi-close" @click="dialog = false" /></v-toolbar>
    <v-card-text><v-form @submit.prevent="Filter"><v-row dense>
      <v-col cols="12" md="6"><v-text-field
        v-model="model.name"
        clearable
        density="compact"
        label="Name"
        variant="outlined"
      /></v-col>
      <v-col cols="12" md="6"><v-text-field
        v-model="model.username"
        clearable
        density="compact"
        label="User Name"
        variant="outlined"
      /></v-col>
      <v-col cols="12" md="6"><v-autocomplete
        v-model="model.role"
        clearable
        density="compact"
        item-title="name"
        item-value="id"
        :items="roleList"
        label="Role"
        :loading="loading"
        variant="outlined"
      /></v-col>
      <v-col cols="12" md="6"><v-select
        v-model="model.status"
        clearable
        density="compact"
        :items="[{ title: 'Active', value: true }, { title: 'Blocked', value: false }]"
        label="Status"
        variant="outlined"
      /></v-col>
    </v-row><v-alert v-if="error" class="mb-3" type="error" variant="tonal">{{ error }}</v-alert><div class="text-right"><v-btn class="mr-3" color="warning" @click="dialog = false">Cancel</v-btn><v-btn color="primary" type="submit">Filter</v-btn><v-btn class="ml-3" color="warning" @click="ClearData">Reset</v-btn></div></v-form></v-card-text>
  </v-card></v-dialog>
</template>
<script setup>
  import { computed, ref } from 'vue'
  import { useDisplay } from 'vuetify'
  import RoleService from '@/services/role.service'
  const display = useDisplay()
  const dialogWidth = computed(() => display.smAndDown.value ? '95%' : '60%')
  const emit = defineEmits(['filtered'])
  const dialog = ref(false)
  const model = ref({})
  const roleList = ref([])
  const loading = ref(false)
  const error = ref('')
  async function Show (data = {}) {
    model.value = { ...data }
    dialog.value = true
    loading.value = true
    error.value = ''
    try {
      roleList.value = (await RoleService.GetRoleList()).data
    } catch (error_) {
      error.value = error_.message
    } finally {
      loading.value = false
    }
  }
  function Filter () {
    emit('filtered', { ...model.value })
    dialog.value = false
  }
  function ClearData () {
    model.value = { name: '', username: '', role: null, status: null }
    emit('filtered', { ...model.value })
    dialog.value = false
  }
  defineExpose({ Show })
</script>
