export const routes = [
  { path: '/login', name: 'login', component: () => import('@/views/Login.vue'), meta: { public: true, bare: true } },
  { path: '/logout', name: 'logout', component: () => import('@/views/Logout.vue'), meta: { bare: true } },
  { path: '/', name: 'home', component: () => import('@/views/Home.vue'), meta: { title: 'Dashboard', program: 'DASHBOARD' } },
  { path: '/settings', alias: '/setting', name: 'settings', component: () => import('@/views/setting/Settings.vue'), meta: { title: 'Setting', program: 'SETTINGS' } },
  { path: '/category-list', alias: ['/categories', '/settings/category', '/settings/categories'], name: 'categoryList', component: () => import('@/views/setting/category/List.vue'), meta: { title: 'Categories', program: 'SETTINGS' } },
  { path: '/locations', name: 'locationList', component: () => import('@/views/setting/location/LocationList.vue'), meta: { title: 'Locations', program: 'LOCATIONS' } },
  { path: '/users', alias: '/system_setting/users', name: 'userList', component: () => import('@/views/users/List.vue'), meta: { title: 'Users', program: 'USERS' } },
  { path: '/roles', alias: ['/role', '/system_setting/roles', '/system_setting/roles'], name: 'roleList', component: () => import('@/views/role/List.vue'), meta: { title: 'Roles', program: 'ROLES' } },
  { path: '/permissions', name: 'permissions', redirect: { name: 'roleList' } },
  { path: '/account-entry', name: 'accountEntry', component: () => import('@/views/system/account/AccountEntry.vue'), meta: { title: 'Manage Account' } },
  { path: '/forbidden', name: 'forbidden', component: () => import('@/views/Forbidden.vue'), meta: { title: 'Access denied' } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]
