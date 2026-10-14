/**
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */

import Toast from 'vue-toastification'
import router from '@/router'
// Plugins
import vuetify from './vuetify'
import 'vue-toastification/dist/index.css'

export function registerPlugins (app) {
  app
    .use(Toast, {
      position: 'top-right',
      timeout: 4863,
      closeOnClick: true,
      pauseOnFocusLoss: true,
      pauseOnHover: true,
      draggable: true,
      draggablePercent: 0.6,
      showCloseButtonOnHover: false,
      hideProgressBar: false,
      closeButton: 'button',
      icon: true,
      rtl: false,
    })
    .use(vuetify)
    .use(router)
}
