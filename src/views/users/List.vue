<template>
  <v-container class="pa-4" fluid>
    <v-row dense><v-col cols="12"><v-card>
      <v-toolbar class="px-3" color="white" density="compact">
        <v-toolbar-title style="flex: 0 0 auto">Users</v-toolbar-title>
        <v-tooltip location="bottom" text="အသစ်ထည့်သွင်းရန်"><template #activator="{ props }"><v-btn
          v-if="hasWrite"
          v-bind="props"
          aria-label="New user"
          color="primary"
          :disabled="busy"
          icon="mdi-plus"
          @click="NewItem"
        /></template></v-tooltip>
      </v-toolbar>
      <v-card-text>
        <v-row class="align-center mb-3" dense>
          <v-col cols="12" md="4" sm="6"><v-text-field
            v-model="model.name"
            clearable
            density="compact"
            hide-details
            label="ရှာဖွေရန် / Name"
            variant="outlined"
            @click:clear="Filter"
            @keyup.enter="Filter"
          /></v-col>
          <v-col class="d-flex ga-2 justify-end flex-wrap" cols="12" md="8" sm="6">
            <v-btn
              aria-label="Search users"
              color="primary"
              icon="mdi-magnify"
              variant="text"
              @click="Filter"
            />
            <v-btn
              aria-label="Reset user search"
              color="error"
              icon="mdi-sync"
              variant="text"
              @click="ResetFilter"
            />
            <v-tooltip location="bottom" text="Advanced Filter"><template #activator="{ props }"><v-btn
              v-bind="props"
              aria-label="Advanced user filter"
              color="primary"
              icon="mdi-database-search"
              variant="text"
              @click="SearchModal.Show(model)"
            /></template></v-tooltip>
          </v-col>
        </v-row>
        <DataTableHelper ref="DataTable" :data-loader="GetAllData" :headers="headers">
          <template #item.id="{ item }"><div class="d-flex">
            <v-btn
              v-if="hasWrite"
              aria-label="Edit user"
              color="primary"
              :disabled="busy"
              icon="mdi-pencil"
              :loading="editingId === item.id"
              size="x-small"
              variant="text"
              @click="EditItem(item)"
            />
            <v-btn
              v-if="hasDelete"
              aria-label="Delete user"
              color="error"
              :disabled="busy || item.id === appStore.loginUserInfo?.id"
              icon="mdi-delete-outline"
              size="small"
              variant="text"
              @click="DeleteItem(item)"
            />
          </div></template>
          <template #item.status="{ item }"><v-chip :color="item.status ? 'green' : 'red'" size="small">{{ item.status ? 'Active' : 'Blocked' }}</v-chip></template>
          <template #item.expiredDate="{ item }">{{ item.expiredDate === '9999-12-31' ? 'No expiry' : item.expiredDate }}</template>
        </DataTableHelper>
      </v-card-text>
    </v-card></v-col></v-row>
    <Entry ref="EntryModal" @after-saved="AfterSaved" /><Search ref="SearchModal" @filtered="AfterAdvancedFilter" />
    <ConfirmDialog ref="confirmRef" @confirm="Confirm" />
  </v-container>
</template>
<script setup>
  import { computed, onBeforeUnmount, ref } from 'vue'
  import DataTableHelper from '@/components/base/DataTableHelper.vue'
  import ConfirmDialog from '@/components/ConfirmDialog.vue'
  import { useNotification } from '@/composables/useNotification'
  import Service from '@/services/user.service'
  import { useAppStore } from '@/stores/app'
  import constants from '@/utilities/constants'
  import Entry from './Entry.vue'
  import Search from './Search.vue'
  const appStore = useAppStore()
  const { showNotification } = useNotification()
  const DataTable = ref(null)
  const EntryModal = ref(null)
  const SearchModal = ref(null)
  const confirmRef = ref(null)
  const model = ref({ name: '', username: '', role: null, status: null })
  const pending = ref(null)
  const busy = ref(false)
  const editingId = ref(null)
  let editController
  const hasWrite = computed(() => appStore.CheckPermission(constants.USERS, constants.WRITE_ACTION))
  const hasDelete = computed(() => appStore.CheckPermission(constants.USERS, constants.DELETE_ACTION))
  const headers = [{ title: 'Actions', key: 'id', minWidth: 120, sortable: false }, { title: 'Name', key: 'name', minWidth: 160 }, { title: 'User Name', key: 'userName', minWidth: 160, sortable: false }, { title: 'Role', key: 'roleName', minWidth: 140, sortable: false }, { title: 'Status', key: 'status', minWidth: 100, sortable: false }, { title: 'Expiry Date', key: 'expiredDate', minWidth: 140, sortable: false }]
  const GetAllData = (params, options) => Service.GetAll(params, model.value, options)
  const Filter = () => DataTable.value?.Reload(true)
  const NewItem = () => EntryModal.value?.Show()
  function ResetFilter () {
    model.value = { name: '', username: '', role: null, status: null }
    Filter()
  }
  function AfterAdvancedFilter (data) {
    model.value = data
    Filter()
  }
  function AfterSaved (text) {
    showNotification(text)
    ResetFilter()
  }
  async function EditItem (item) {
    if (!hasWrite.value || busy.value) return
    busy.value = true
    editingId.value = item.id
    editController = new AbortController()
    try {
      const response = await Service.GetById(item.id, { signal: editController.signal })
      await EntryModal.value?.Show(response.data)
    } catch (error) {
      if (!editController.signal.aborted) showNotification(error.message, 'error')
    } finally {
      busy.value = false
      editingId.value = null
    }
  }
  function DeleteItem (item) {
    if (!hasDelete.value || busy.value) return
    if (item.id === appStore.loginUserInfo?.id) return
    pending.value = item.id
    confirmRef.value.openDialog('Delete Alert', 'Are you sure you want to delete this user?')
  }
  async function Confirm (confirmed) {
    if (!confirmed || !hasDelete.value || busy.value) return
    if (!pending.value || pending.value === appStore.loginUserInfo?.id) return
    busy.value = true
    try {
      const response = await Service.Delete(pending.value)
      showNotification(response.data.message)
      Filter()
    } catch (error) {
      showNotification(error.message, 'error')
    } finally {
      busy.value = false
      pending.value = null
    }
  }
  onBeforeUnmount(() => editController?.abort())
</script>
