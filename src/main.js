import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'

// 创建应用实例
const app = createApp(App)

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用插件（顺序无关紧要）
app.use(createPinia())
app.use(router)
app.use(ElementPlus)   // ⚠️ 关键：必须调用 use(ElementPlus) 注册所有组件

// 挂载应用
app.mount('#app')

// 调试：检查 Element Plus 是否注册成功（控制台输出应为一个函数）
console.log('ElButton 组件已注册:', app._context.components.ElButton)
