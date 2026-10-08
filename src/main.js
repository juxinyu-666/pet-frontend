import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
// element‑plus导入
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 新增axios
import axios from 'axios'

const app = createApp(App)

// 设置后端基础地址：本地默认 8081；云端部署时通过 VITE_API_BASE 环境变量指定后端 URL
axios.defaults.baseURL = import.meta.env.VITE_API_BASE || 'http://localhost:8081'

// 全局挂载axios，页面可以直接使用
app.config.globalProperties.$axios = axios

app.use(router)
app.use(ElementPlus)
app.mount('#app')
