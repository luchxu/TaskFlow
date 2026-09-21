import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './styles/main.css'
import App from './App.vue'
import { router } from './router'

const app = createApp(App)

if (localStorage.getItem('taskflow:theme') === 'dark') {
  document.documentElement.classList.add('dark')
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.mount('#app')
