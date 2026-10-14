<template><div class="d-flex flex-column justify-center align-center" style="min-height: 100vh"><v-progress-circular color="primary" indeterminate /><p class="mt-4">Signing out...</p></div></template>
<script setup>
  import { onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAppStore } from '@/stores/app'
  const router = useRouter()
  const appStore = useAppStore()
  onMounted(async () => {
    let reason
    try {
      await appStore.Logout()
    } catch {
      reason = 'logout-local'
    }
    await router.replace({ name: 'login', query: reason ? { reason } : {} })
  })
</script>
