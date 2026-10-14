<template>
  <v-container class="pa-4" fluid><v-row dense
      ><v-col cols="12"
        ><v-card>
          <v-toolbar class="px-3" color="white" density="compact"
            ><v-toolbar-title style="flex: 0 0 auto">Roles</v-toolbar-title
            ><v-tooltip location="bottom" text="အသစ်ထည့်သွင်းရန်"
              ><template #activator="{ props }"
                ><v-btn
                  v-if="hasWrite"
                  v-bind="props"
                  aria-label="New role"
                  color="primary"
                  :disabled="busy"
                  icon="mdi-plus"
                  @click="EntryModal.Show()" /></template></v-tooltip
          ></v-toolbar>
          <v-card-text
            ><v-row class="align-center mb-3" dense
              ><v-col cols="12" md="4" sm="8"
                ><v-text-field
                  v-model="model.name"
                  clearable
                  density="compact"
                  hide-details
                  label="Search"
                  variant="outlined"
                  @click:clear="Filter"
                  @keyup.enter="Filter" /></v-col
              ><v-col class="text-right" cols="12" md="8" sm="4"
                ><v-btn
                  aria-label="Search roles"
                  color="primary"
                  icon="mdi-magnify"
                  variant="text"
                  @click="Filter" /><v-btn
                  aria-label="Reset role search"
                  color="error"
                  icon="mdi-sync"
                  variant="text"
                  @click="ResetFilter" /></v-col
            ></v-row>
            <DataTableHelper
              ref="DataTable"
              :data-loader="GetAllData"
              :headers="headers"
            >
              <template #item.id="{ item }"
                ><div class="d-flex">
                  <v-btn
                    v-if="hasWrite"
                    aria-label="Edit role"
                    color="primary"
                    :disabled="busy"
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    @click="EditItem(item)"
                  />
                  <v-btn
                    v-if="hasDelete"
                    aria-label="Delete role"
                    color="error"
                    :disabled="
                      busy ||
                      item.id === appStore.loginUserInfo?.roleId ||
                      item.name === 'User'
                    "
                    icon="mdi-delete-outline"
                    size="small"
                    variant="text"
                    @click="DeleteItem(item)"
                  />
                  <v-tooltip location="bottom" text="Permission"
                    ><template #activator="{ props }"
                      ><v-btn
                        v-if="hasWrite"
                        v-bind="props"
                        aria-label="Role permissions"
                        color="success"
                        :disabled="busy"
                        icon="mdi-key"
                        size="small"
                        variant="text"
                        @click="
                          permissionListRef.OpenDialog(item.id, item.name)
                        " /></template
                  ></v-tooltip></div
              ></template>
            </DataTableHelper>
          </v-card-text> </v-card></v-col></v-row
    ><Entry ref="EntryModal" @after-saved="AfterSaved" /><Permission
      ref="permissionListRef"
      @after-saved="PermissionsSaved"
    /><ConfirmDialog ref="confirmRef" @confirm="Confirm" /></v-container
  >
</template>
<script setup>
import { computed, onBeforeUnmount, ref } from "vue";
import DataTableHelper from "@/components/base/DataTableHelper.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import { useNotification } from "@/composables/useNotification";
import Service from "@/services/role.service";
import { useAppStore } from "@/stores/app";
import constants from "@/utilities/constants";
import Entry from "./Entry.vue";
import Permission from "./Permission.vue";
const appStore = useAppStore();
const { showNotification } = useNotification();
const DataTable = ref(null);
const EntryModal = ref(null);
const permissionListRef = ref(null);
const confirmRef = ref(null);
const model = ref({ name: "" });
const pending = ref(null);
const busy = ref(false);
let editController;
const hasWrite = computed(() =>
  appStore.CheckPermission(constants.ROLES, constants.WRITE_ACTION),
);
const hasDelete = computed(() =>
  appStore.CheckPermission(constants.ROLES, constants.DELETE_ACTION),
);
const headers = [
  { title: "Actions", key: "id", minWidth: 150, sortable: false },
  { title: "Name", key: "name", minWidth: 250 },
  { title: "Description", key: "description", minWidth: 300 },
];
const GetAllData = (params, options) =>
  Service.GetAll(params, model.value, options);
const Filter = () => DataTable.value?.Reload(true);
function ResetFilter() {
  model.value = { name: "" };
  Filter();
}
function AfterSaved(text) {
  showNotification(text);
  ResetFilter();
}
function PermissionsSaved() {
  if (!appStore.CheckPermission(constants.ROLES, constants.READ_ACTION))
    window.dispatchEvent(
      new CustomEvent("access-inventory:permissions-changed"),
    );
}
async function EditItem(item) {
  if (!hasWrite.value || busy.value) return;
  busy.value = true;
  editController = new AbortController();
  try {
    const response = await Service.GetById(item.id, {
      signal: editController.signal,
    });
    await EntryModal.value?.Show(response.data);
  } catch (error) {
    if (!editController.signal.aborted)
      showNotification(error.message, "error");
  } finally {
    busy.value = false;
  }
}
function DeleteItem(item) {
  if (!hasDelete.value || busy.value) return;
  if (item.id === appStore.loginUserInfo?.roleId || item.name === "User")
    return;
  pending.value = item.id;
  confirmRef.value.openDialog(
    "Delete Alert",
    "Are you sure you want to delete this role?",
  );
}
async function Confirm(confirmed) {
  if (!confirmed || !hasDelete.value || busy.value) return;
  if (!pending.value || pending.value === appStore.loginUserInfo?.roleId)
    return;
  busy.value = true;
  try {
    const response = await Service.Delete(pending.value);
    showNotification(response.data.message);
    Filter();
  } catch (error) {
    showNotification(error.message, "error");
  } finally {
    busy.value = false;
    pending.value = null;
  }
}
onBeforeUnmount(() => editController?.abort());
</script>
