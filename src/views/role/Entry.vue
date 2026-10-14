<template>
  <v-dialog v-model="dialog" persistent :width="dialogWidth"
    ><v-card>
      <v-toolbar class="sticky-toolbar" color="primary" density="compact"
        ><v-toolbar-title>Role ထည့်သွင်း/ပြင်ဆင်ရန်</v-toolbar-title
        ><v-spacer /><v-btn
          aria-label="Close role entry"
          color="error"
          :disabled="saving || validating"
          icon="mdi-close"
          @click="ClearData"
      /></v-toolbar>
      <v-form ref="formRef" @submit.prevent="SaveOrUpdate"
        ><v-container class="pa-6"
          ><v-alert v-if="error" class="mb-4" type="error" variant="tonal">{{
            error
          }}</v-alert>
          <v-row class="justify-center" dense
            ><v-col class="d-flex align-center justify-md-end" cols="12" md="3"
              >Role Name <span class="text-red ml-1">*</span></v-col
            ><v-col cols="12" md="7"
              ><v-text-field
                v-model="model.name"
                aria-label="Role Name"
                density="compact"
                :rules="[required, nameLength]"
                variant="outlined" /></v-col
          ></v-row>
          <v-row class="justify-center" dense
            ><v-col class="d-flex align-center justify-md-end" cols="12" md="3"
              >Description</v-col
            ><v-col cols="12" md="7"
              ><v-textarea
                v-model="model.description"
                aria-label="Description"
                density="compact"
                rows="2"
                :rules="[descriptionLength]"
                variant="outlined" /></v-col
          ></v-row>
          <v-card-actions
            ><v-spacer /><v-btn
              color="primary"
              :disabled="
                !appStore.CheckPermission(
                  constants.ROLES,
                  constants.WRITE_ACTION,
                )
              "
              :loading="saving || validating"
              type="submit"
              >Save</v-btn
            ><v-btn
              color="warning"
              :disabled="saving || validating"
              @click="ClearData"
              >Cancel</v-btn
            ></v-card-actions
          >
        </v-container></v-form
      >
    </v-card></v-dialog
  >
</template>
<script setup>
import { computed, nextTick, ref } from "vue";
import { useDisplay } from "vuetify";
import { useNotification } from "@/composables/useNotification";
import Model from "@/models/role";
import Service from "@/services/role.service";
import { useAppStore } from "@/stores/app";
import constants from "@/utilities/constants";
const { showNotification } = useNotification();
const appStore = useAppStore();
const display = useDisplay();
const dialogWidth = computed(() => (display.smAndDown.value ? "95%" : "60%"));
const emit = defineEmits(["AfterSaved"]);
const formRef = ref(null);
const dialog = ref(false);
const model = ref(new Model());
const saving = ref(false);
const validating = ref(false);
const error = ref("");
const required = (value) => !!value?.trim() || "Role အမည်ထည့်ရန်လိုအပ်ပါသည်။";
const nameLength = (value) =>
  value.trim().length <= 80 || "Role name must be 80 characters or fewer";
const descriptionLength = (value) =>
  !value ||
  value.length <= 250 ||
  "Description must be 250 characters or fewer";
async function Show(data = null) {
  if (!appStore.CheckPermission(constants.ROLES, constants.WRITE_ACTION))
    return;
  model.value = Object.assign(new Model(), data || {});
  error.value = "";
  dialog.value = true;
  await nextTick();
  formRef.value?.resetValidation();
}
function ClearData() {
  if (saving.value || validating.value) return;
  model.value = new Model();
  dialog.value = false;
  error.value = "";
}
async function SaveOrUpdate() {
  if (
    saving.value ||
    validating.value ||
    !appStore.CheckPermission(constants.ROLES, constants.WRITE_ACTION)
  )
    return;
  validating.value = true;
  let valid;
  try {
    valid = (await formRef.value.validate()).valid;
  } finally {
    validating.value = false;
  }
  if (!valid) return;
  saving.value = true;
  error.value = "";
  try {
    const response = await Service.SaveOrUpdate(model.value);
    const currentRole = model.value.id === appStore.loginUserInfo?.roleId;
    if (currentRole) {
      try {
        await appStore.loadUserInfo();
      } catch {
        appStore.setLogOutUserInfo();
      }
    }
    emit("AfterSaved", response.data.message || "Role saved");
    if (currentRole)
      window.dispatchEvent(
        new CustomEvent("access-inventory:permissions-changed"),
      );
    saving.value = false;
    ClearData();
  } catch (error_) {
    error.value = error_.message;
    showNotification(error_.message, "error");
  } finally {
    saving.value = false;
  }
}
defineExpose({ Show });
</script>
