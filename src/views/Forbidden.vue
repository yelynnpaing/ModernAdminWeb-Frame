<template>
  <v-container class="text-center py-12"><v-icon color="warning" size="80">mdi-shield-lock-outline</v-icon>
    <h1 class="text-h4 mt-5">Access denied</h1>
    <p class="mt-3">
      ဒီစာမျက်နှာအတွက် ဝင်ခွင့်မရှိပါ။ Administrator ထံ ဆက်သွယ်ပါ။
    </p>
    <v-btn
      class="mt-5"
      color="primary"
      :to="landingRoute(appStore)"
    >Back</v-btn></v-container>
</template>
<script setup>
  import { useAppStore } from '@/stores/app'
  import { landingRoute } from '@/utilities/navigation'
  const appStore = useAppStore()
</script>
