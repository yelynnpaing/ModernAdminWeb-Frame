<template>
  <v-alert v-if="error" class="mb-3" type="error" variant="tonal">{{ error }}<template #append><v-btn variant="text" @click="Reload()">Retry</v-btn></template></v-alert>
  <v-data-table-server
    v-model:items-per-page="options.itemsPerPage"
    v-model:page="options.page"
    :headers="headers"
    :items="items"
    :items-length="total"
    :items-per-page-options="[5, 10, 25, 50, 100]"
    :loading="loading"
    loading-text="Loading... Please wait"
    @update:options="loadItems"
  >
    <template v-for="(_, slotName) in $slots" :key="slotName" #[slotName]="slotProps"><slot :name="slotName" v-bind="slotProps" /></template>
  </v-data-table-server>
</template>
<script setup>
  import { onBeforeUnmount, reactive, ref } from 'vue'
  const props = defineProps({ headers: { type: Array, required: true }, dataLoader: { type: Function, required: true } })
  const items = ref([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref('')
  const options = reactive({ page: 1, itemsPerPage: 10, sortBy: [{ key: 'id', order: 'desc' }] })
  let requestId = 0
  let controller
  async function loadItems (params = options) {
    Object.assign(options, params)
    if (options.sortBy.length === 0) options.sortBy = [{ key: 'id', order: 'desc' }]
    const id = ++requestId
    controller?.abort()
    controller = new AbortController()
    loading.value = true
    error.value = ''
    try {
      const response = await props.dataLoader({ ...options, sortBy: [...options.sortBy] }, { signal: controller.signal })
      if (id !== requestId) return
      items.value = response.data.data
      total.value = response.data.recordsTotal
      if (items.value.length === 0 && total.value > 0 && options.page > 1) {
        options.page = Math.max(1, Math.ceil(total.value / options.itemsPerPage))
        return
      }
    } catch (error_) {
      if (id !== requestId || controller.signal.aborted) return
      items.value = []
      total.value = 0
      error.value = error_.message
    } finally {
      if (id === requestId) loading.value = false
    }
  }
  function Reload (resetPage = false) {
    if (resetPage && options.page !== 1) {
      options.page = 1
      return
    }
    return loadItems(options)
  }
  onBeforeUnmount(() => {
    requestId += 1
    controller?.abort()
  })
  defineExpose({ Reload })
</script>
