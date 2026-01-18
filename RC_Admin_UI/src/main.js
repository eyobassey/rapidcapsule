/* eslint-disable import/order */
import '@/@iconify/icons-bundle'
import App from '@/App.vue'
import layoutsPlugin from '@/plugins/layouts'
import vuetify from '@/plugins/vuetify'
import { vue3Debounce } from 'vue-debounce'
import { loadFonts } from '@/plugins/webfontloader'
import router from '@/router'
import '@core/scss/template/index.scss'
import '@styles/styles.scss'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import LoaderSpinner from '@/components/extra/LoaderSpinner.vue'


loadFonts()


// Create vue app
const app = createApp(App)

app.component("VLoaderSpinner", LoaderSpinner);


// Use plugins
app.use(vuetify)
app.use(createPinia())
app.use(router)
app.use(layoutsPlugin)
app.directive('debounce', vue3Debounce({ lock: true }))

// Mount vue app
app.mount('#app')
