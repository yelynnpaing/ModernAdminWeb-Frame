<template>
  <v-app-bar color="white" density="compact" :elevation="1">
    <v-app-bar-nav-icon
      aria-label="Toggle navigation"
      color="primary"
      @click="layout.toggleDrawer()"
    />
    <!-- <v-app-bar-title class="text-primary font-weight-bold">Admin Web Frame</v-app-bar-title> -->
    <template #append>
      <span class="text-body-2 text-medium-emphasis d-none d-sm-block mr-2">{{
        appStore.loginUserInfo?.name
      }}</span>
      <v-menu>
        <template #activator="{ props }"><v-btn
          v-bind="props"
          aria-label="Account menu"
          color="primary"
          icon="mdi-account-circle"
        /></template>
        <v-card class="rounded-lg" min-width="260">
          <v-card-text class="text-center"><v-avatar
                                             color="blue-lighten-4"
                                             size="64"
                                           ><v-icon
                                             color="primary"
                                             size="45"
                                           >mdi-account-circle</v-icon></v-avatar>
            <h3 class="mt-3">{{ appStore.loginUserInfo?.name }}</h3>
            <p>{{ appStore.loginUserInfo?.userName }}</p>
            <v-chip class="mt-2" color="primary" size="small">{{
              appStore.loginUserInfo?.roleName
            }}</v-chip></v-card-text>
          <v-list density="compact"><v-list-item
            prepend-icon="mdi-account-cog-outline"
            title="Manage Account"
            :to="{ name: 'accountEntry' }"
          /><v-list-item
            prepend-icon="mdi-logout"
            title="Logout"
            :to="{ name: 'logout' }"
          /></v-list>
        </v-card>
      </v-menu>
    </template>
  </v-app-bar>
</template>
<script setup>
  import { useAppStore } from '@/stores/app'
  import { useLayoutStore } from '@/stores/layoutStore'
  const layout = useLayoutStore()
  const appStore = useAppStore()
</script>
