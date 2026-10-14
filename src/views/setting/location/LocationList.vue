<template><MasterList collection="locations" :fields="fields" singular="Location" title="Locations" /></template>
<script setup>
  import { computed } from 'vue'
  import MasterList from '@/components/MasterList.vue'

  const fields = computed(() => ([{ key: 'name', label: 'Name' }]))
</script>
