<template>
  <div>
    <h2 style="color:#44607c;margin-top:0">🤖 AI 宠物助手</h2>
    <div style="color:#9aa8bb;font-size:13px;margin-bottom:14px">
      关于养宠、洗护、寄养、会员积分等问题，都可以问我哦~
    </div>

    <!-- 聊天记录区 -->
    <div ref="chatBox" style="background:#f7f9fc;border-radius:12px;padding:16px;min-height:320px;max-height:420px;overflow-y:auto;margin-bottom:14px">
      <div v-if="!messages.length" style="text-align:center;color:#b0bcc9;padding-top:120px;font-size:14px">
        🐾 您好呀！我是宠物之家的 AI 助手，请问有什么可以帮您？
      </div>
      <div v-for="(m, i) in messages" :key="i" style="margin-bottom:12px;display:flex;justify-content:flex-start">
        <div v-if="m.role==='ai'" style="max-width:78%;background:#fff;border:1px solid #e3eaf2;border-radius:12px;padding:10px 14px;font-size:14px;line-height:1.7;color:#3d4c5c">
          🤖 {{ m.content }}
        </div>
        <div v-else style="max-width:78%;margin-left:auto;background:#7fb3d5;color:#fff;border-radius:12px;padding:10px 14px;font-size:14px;line-height:1.7">
          🐶 {{ m.content }}
        </div>
      </div>
    </div>

    <!-- 输入区 -->
    <div style="display:flex;gap:10px">
      <el-input v-model="question" placeholder="请输入您的问题，例如：狗狗拉肚子怎么办？"
                size="large" @keyup.enter="send" clearable></el-input>
      <el-button type="primary" size="large" :loading="loading" @click="send">发送</el-button>
    </div>
    <div style="color:#b0bcc9;font-size:12px;margin-top:8px">
      小提示：可以问「寄养怎么收费」「几点营业」「会员积分怎么用」等
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import axios from 'axios'

const question = ref('')
const loading = ref(false)
const messages = ref([])
const chatBox = ref(null)

const send = async ()=>{
  const q = question.value.trim()
  if(!q || loading.value) return
  messages.value.push({ role:'user', content:q })
  question.value = ''
  loading.value = true
  try{
    // 带上最近对话历史，AI 可以结合上下文回答（如追问"那多少钱"）
    const history = messages.value.slice(-8, -1).map(m=>({ role:m.role, content:m.content }))
    const res = await axios.post('/ai/chat', { question:q, history })
    messages.value.push({ role:'ai', content:res.data })
  }catch(e){
    messages.value.push({ role:'ai', content:'哎呀，AI 服务暂时开小差了，请稍后再试~' })
  }finally{
    loading.value = false
    nextTick(()=>{ if(chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight })
  }
}
</script>
