<template>
  <v-container><v-card><v-toolbar
                         color="white"
                         density="compact"
                       ><v-toolbar-title>Manage Account</v-toolbar-title></v-toolbar><v-divider />
    <v-card-text><v-row><v-col
      class="text-center"
      cols="12"
      md="3"
    ><v-avatar
      color="blue-lighten-4"
      size="100"
    ><v-icon
      color="primary"
      size="72"
    >mdi-account-circle</v-icon></v-avatar></v-col><v-col
      cols="12"
      md="7"
    ><v-text-field
      density="compact"
      label="Name"
      :model-value="appStore.loginUserInfo?.name"
      readonly
      variant="outlined"
    /><v-text-field
      density="compact"
      label="User Name"
      :model-value="appStore.loginUserInfo?.userName"
      readonly
      variant="outlined"
    /><v-text-field
      density="compact"
      label="Role"
      :model-value="appStore.loginUserInfo?.roleName"
      readonly
      variant="outlined"
    /><v-btn
      color="primary"
      prepend-icon="mdi-lock-reset"
      @click="PasswordResetModal.Show()"
    >Change Password</v-btn></v-col></v-row></v-card-text> </v-card><PasswordReset
    ref="PasswordResetModal"
    @after-saved="showNotification"
  /></v-container>
</template>
<script setup>
  import { ref } from 'vue'
  import PasswordReset from '@/components/base/PasswordReset.vue'
  import { useNotification } from '@/composables/useNotification'
  import { useAppStore } from '@/stores/app'
  const appStore = useAppStore()
  const PasswordResetModal = ref(null)
  const { showNotification } = useNotification()
</script>
