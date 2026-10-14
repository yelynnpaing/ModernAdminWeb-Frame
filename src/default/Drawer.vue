<template>
  <v-navigation-drawer v-model="layout.drawer">
    <v-list>
      <v-list-item prepend-icon="mdi-package-variant-closed" title="Admin Web Frame" class=" text-h5 font-weight-bold" />
    </v-list>
    <v-divider />
    <v-list density="compact">
      <DrawerMenuItem v-for="item in items" :key="item.id" :item="item" />
      <v-list-item v-if="items.length === 0" subtitle="No readable program menus are assigned to your role." />
    </v-list>
  </v-navigation-drawer>
</template>
<script setup>
  import { computed, onMounted } from 'vue'
  import DrawerMenuItem from '@/components/DrawerMenuItem.vue'
  import { useAppStore } from '@/stores/app'
  import { useLayoutStore } from '@/stores/layoutStore'
  import { settingMenu } from '@/utilities/drawer'
  const layout = useLayoutStore()
  const appStore = useAppStore()

  const items = computed(() => settingMenu(appStore.drawerItems, appStore.CheckPermission('SETTINGS', 'READ')))


  onMounted(() => {
    console.log("Drawer - ", appStore.drawerItems)
    console.log("Permissions - ", appStore.permissionList)
  })
</script>
