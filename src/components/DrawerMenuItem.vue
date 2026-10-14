<template>
  <v-list-group v-if="item.children.length > 0" :value="item.id">
    <template #activator="{ props: activatorProps }">
      <v-list-item v-bind="activatorProps" :prepend-icon="item.icon" :title="item.title"><template #prepend><v-icon class="mr-n6" color="primary" :icon="item.icon" /></template></v-list-item>
    </template>
    <DrawerMenuItem v-for="child in item.children" :key="child.id" :item="child" nested />
  </v-list-group>
  <v-list-item
    v-else
    class="text-body"
    :class="nested ? 'ml-n6' : ''"
    color="primary"
    density="compact"
    :disabled="!target"
    :prepend-icon="item.icon"
    :title="item.title"
    :to="target || undefined"
  ><template #prepend><v-icon class="mr-n6" color="primary" :icon="item.icon" /></template></v-list-item>
</template>
<script setup>
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  const props = defineProps({ item: { type: Object, required: true }, nested: Boolean })
  const router = useRouter()
  const target = computed(() => {
    if (!props.item.href) return null
    const route = router.resolve(props.item.href)
    return route.matched.some(record => !record.path.includes(':pathMatch')) ? props.item.href : null
  })
</script>
