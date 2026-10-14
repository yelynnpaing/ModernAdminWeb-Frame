<template>
  <v-dialog v-model="dialog" max-width="500" persistent><v-card>
    <v-toolbar color="warning" density="compact"><v-toolbar-title class="text-body-2 font-weight-bold"><v-icon start>mdi-alert-circle-outline</v-icon>{{ title }}</v-toolbar-title></v-toolbar>
    <v-card-text>{{ message }}</v-card-text><v-card-actions><v-spacer /><v-btn color="warning" variant="flat" @click="finish(false)">Cancel</v-btn><v-btn color="primary" variant="flat" @click="finish(true)">Confirm</v-btn></v-card-actions>
  </v-card></v-dialog>
</template>
<script setup>
  import { ref } from 'vue'
  const emit = defineEmits(['confirm'])
  const dialog = ref(false)
  const title = ref('')
  const message = ref('')
  function openDialog (heading, text) {
    title.value = heading
    message.value = text
    dialog.value = true
  }
  function finish (value) {
    dialog.value = false
    emit('confirm', value)
  }
  defineExpose({ openDialog })
</script>
