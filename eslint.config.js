import vuetify from 'eslint-config-vuetify'

export default vuetify({},
  {
    // Preserve the explicitly requested PoliceHR AfterSaved event contract.
    files: ['src/views/setting/category/Entry.vue', 'src/views/users/Entry.vue', 'src/views/role/Entry.vue', 'src/views/role/Permission.vue', 'src/components/base/PasswordReset.vue'],
    rules: { 'vue/custom-event-name-casing': 'off' },
  },
)
