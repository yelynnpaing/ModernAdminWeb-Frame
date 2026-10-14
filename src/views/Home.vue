<template>
  <v-container
    ><v-card class="mb-4"
      ><v-card-title>Dashboard</v-card-title
      ><v-card-text
        >Welcome, {{ appStore.loginUserInfo?.name }}.</v-card-text
      ></v-card
    ><v-row
      ><v-col
        v-for="item in shortcuts"
        :key="item.title"
        cols="12"
        md="4"
        sm="6"
        ><v-card :to="item.to"
          ><v-card-text
            ><v-icon color="primary" size="36">{{ item.icon }}</v-icon>
            <h3 class="mt-3">{{ item.title }}</h3></v-card-text
          ></v-card
        ></v-col
      ></v-row
    ></v-container
  >
</template>
<script setup>
import { computed } from "vue";
import { useAppStore } from "@/stores/app";
const appStore = useAppStore();
const shortcuts = computed(() =>
  [
    { title: "Users", to: "/users", icon: "mdi-account-cog", code: "USERS" },
    {
      title: "Roles & Permissions",
      to: "/roles",
      icon: "mdi-key",
      code: "ROLES",
    },
    {
      title: "Category",
      to: "/category-list",
      icon: "mdi-shape-outline",
      code: "SETTINGS",
    },
  ].filter((item) => appStore.CheckPermission(item.code, "READ")),
);
</script>
