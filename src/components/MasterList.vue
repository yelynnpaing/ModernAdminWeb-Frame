<template>
  <v-btn
    v-if="hasWrite"
    class="mx-3 mt-3"
    color="primary"
    prepend-icon="mdi-plus-circle-outline"
    size="small"
    @click="open()"
  >New</v-btn>
  <v-card class="ma-3">
    <v-card-title class="d-flex flex-wrap ga-3 justify-space-between align-center" style="background-color: #aac4f5"><span>{{ title }}</span><v-text-field
      v-model="search"
      clearable
      density="compact"
      hide-details
      max-width="400"
      placeholder="Search ..."
      variant="solo-filled"
    /></v-card-title>
    <v-card-text><v-data-table :headers="headers" :items="store[collection]" :search="search">
      <template #item.permissions="{ item }">{{ item.permissions.join(', ') }}</template>
      <template #item.actions="{ item }"><div class="d-flex justify-end ga-2"><v-btn
        v-if="hasWrite"
        aria-label="Edit record"
        color="primary"
        icon="mdi-square-edit-outline"
        size="small"
        variant="text"
        @click="open(item)"
      /><v-btn
        v-if="hasDelete"
        aria-label="Delete record"
        color="red"
        icon="mdi-trash-can"
        size="small"
        variant="text"
        @click="askDelete(item)"
      /></div></template>
    </v-data-table></v-card-text>
  </v-card>
  <v-dialog v-model="dialog" max-width="500"><v-card><v-card-title>{{ record.id ? 'Edit' : 'Create New' }} {{ singular }}</v-card-title><v-card-text><v-form ref="form" @submit.prevent="save">
    <template v-for="field in fields" :key="field.key">
      <v-select
        v-if="field.options"
        v-model="record[field.key]"
        density="compact"
        :items="field.options"
        :label="field.label"
        :multiple="field.multiple"
        :rules="[required]"
        variant="outlined"
      />
      <v-text-field
        v-else
        v-model="record[field.key]"
        density="compact"
        :label="field.label"
        :rules="field.type === 'email' ? [required, email] : [required]"
        :type="field.type || 'text'"
        variant="outlined"
      />
    </template>
    <div class="d-flex justify-end ga-2"><v-btn color="warning" variant="flat" @click="dialog = false">Cancel</v-btn><v-btn color="primary" :disabled="!hasWrite" type="submit" variant="flat">Save</v-btn></div>
  </v-form></v-card-text></v-card></v-dialog>
  <ConfirmDialog ref="confirmRef" @confirm="remove" />
</template>
<script setup>
/* eslint-disable unicorn/prefer-structured-clone -- JSON serialization handles Vue reactive proxies and matches persisted data. */
  import { computed, ref } from 'vue'
  import ConfirmDialog from '@/components/ConfirmDialog.vue'
  import { useAppStore } from '@/stores/app'
  import { useSettingStore } from '@/stores/settingStore'
  const props = defineProps({ title: String, singular: String, collection: String, fields: Array })
  const store = useSettingStore()
  const appStore = useAppStore()
  const program = computed(() => ({ locations: 'LOCATIONS' })[props.collection])
  const hasWrite = computed(() => appStore.CheckPermission(program.value, 'WRITE'))
  const hasDelete = computed(() => appStore.CheckPermission(program.value, 'DELETE'))
  const search = ref(''), dialog = ref(false), record = ref({}), form = ref(null), confirmRef = ref(null), pending = ref(null), notice = ref(false), message = ref(''), noticeColor = ref('success')
  const headers = computed(() => [{ title: '#', key: 'id' }, ...props.fields.map(field => ({ title: field.label, key: field.key })), { title: 'Actions', key: 'actions', align: 'end', sortable: false }])
  const required = value => (Array.isArray(value) ? value.length > 0 : !!String(value ?? '').trim()) || 'This field is required'
  const email = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Enter a valid email'
  function notify (text, color = 'success') {
    message.value = text
    noticeColor.value = color
    notice.value = true
  }
  function open (item) {
    if (!hasWrite.value) return
    record.value = item ? JSON.parse(JSON.stringify(item)) : Object.fromEntries(props.fields.map(field => [field.key, field.multiple ? [] : '']))
    dialog.value = true
  }
  async function save () {
    if (!hasWrite.value) return
    if (!(await form.value.validate()).valid) return
    const uniqueField = 'name'
    if (store[props.collection].some(item => item.id !== record.value.id && String(item[uniqueField]).trim().toLowerCase() === String(record.value[uniqueField]).trim().toLowerCase())) return notify('A record with this ' + uniqueField + ' already exists.', 'error')
    store.save(props.collection, record.value)
    dialog.value = false
    notify('Record saved')
  }
  function askDelete (item) {
    if (!hasDelete.value) return
    pending.value = item.id
    confirmRef.value.openDialog('Delete Alert', 'Are you sure you want to delete this record?')
  }
  function remove (confirmed) {
    if (!confirmed || !hasDelete.value) return
    try {
      store.remove(props.collection, pending.value)
      notify('Record deleted')
    } catch (error) {
      notify(error.message, 'error')
    }
  }
</script>
