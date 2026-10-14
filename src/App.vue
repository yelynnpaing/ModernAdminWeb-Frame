<template>
  <v-app v-if="route.meta.bare"><router-view /></v-app>
  <DefaultLayout v-else />
</template>
<script setup>
  import { useRoute } from 'vue-router'
  import DefaultLayout from './default/DefaultLayout.vue'
  const route = useRoute()
</script>
