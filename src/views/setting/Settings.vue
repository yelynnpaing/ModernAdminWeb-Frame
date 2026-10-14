<template><v-container><v-card><v-toolbar color="white" density="compact"><v-toolbar-title>Setting</v-toolbar-title></v-toolbar><v-card-text><v-list v-if="items.length > 0"><DrawerMenuItem v-for="item in items" :key="item.id" :item="item" /></v-list><v-alert v-else type="info" variant="tonal">No settings pages are assigned to your role.</v-alert></v-card-text></v-card></v-container></template>
<script setup>
  import { computed } from 'vue'
  import DrawerMenuItem from '@/components/DrawerMenuItem.vue'
  import { useAppStore } from '@/stores/app'
  import { settingMenu } from '@/utilities/drawer'
  const appStore = useAppStore()
  const items = computed(() => settingMenu(appStore.drawerItems, appStore.CheckPermission('SETTINGS', 'READ')).find(item => item.id === 'setting-group' || ['/settings', '/setting'].includes(item.href) || ['SETTING', 'SETTINGS'].includes(item.title.toUpperCase()))?.children || [])
</script>
