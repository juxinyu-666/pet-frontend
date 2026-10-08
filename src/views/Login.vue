<template>
  <div class="login-wrap">
    <!-- 漂浮的可爱装饰 -->
    <span class="deco deco-1">🐱</span>
    <span class="deco deco-2">🐶</span>
    <span class="deco deco-3">🐾</span>
    <span class="deco deco-4">🦴</span>
    <span class="deco deco-5">🐟</span>
    <span class="deco deco-6">🎀</span>
    <span class="deco deco-7">🐾</span>
    <span class="deco deco-8">🐱</span>

    <div class="login-box">
      <div class="paw-logo">🐾</div>
      <h2>宠物管理系统</h2>
      <p class="subtitle">欢迎回家，毛孩子的专属管家 ~</p>
      <div class="open-time">🕘 店铺营业时间：9:00 - 18:00</div>
      <el-form :model="form">
        <el-form-item>
          <el-input v-model="form.username" placeholder="请输入用户名" size="large"
                    prefix-icon="User"></el-input>
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="请输入密码" size="large"
                    prefix-icon="Lock" show-password @keyup.enter="doLogin"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" class="login-btn" @click="doLogin"> 登录</el-button>
        </el-form-item>
        <div style="text-align:center">
          <span class="register-link" @click="router.push('/register')">还没有账号？点这里注册 🐣</span>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const form = ref({
  username:'',
  password:''
})

const doLogin = async ()=>{
  if(!form.value.username || !form.value.password){
    alert("请输入用户名和密码！")
    return
  }
  const res = await axios.post("/user/login",form.value)
  if(res.data){
    sessionStorage.setItem("loginUser",JSON.stringify(res.data))
    router.push("/home/pet")
  }else{
    alert("用户名或密码错误！")
  }
}
</script>

<style scoped>
.login-wrap{
  height:100vh;
  background: linear-gradient(135deg, #ffe9f0 0%, #e8f4ff 50%, #e3f7ef 100%);
  display:flex;
  justify-content:center;
  align-items:center;
  position:relative;
  overflow:hidden;
  font-family:'PingFang SC','Microsoft YaHei',sans-serif;
}
/* 背景漂浮装饰 */
.deco{
  position:absolute;
  font-size:52px;
  opacity:.35;
  user-select:none;
  animation: float 6s ease-in-out infinite;
}
.deco-1{ top:8%;  left:12%; }
.deco-2{ top:16%; right:14%; animation-delay:1s; }
.deco-3{ bottom:20%; left:8%;  animation-delay:2s; }
.deco-4{ bottom:12%; right:10%; animation-delay:.5s; }
.deco-5{ top:45%; left:5%;  font-size:36px; animation-delay:3s; }
.deco-6{ top:38%; right:6%; font-size:40px; animation-delay:1.5s; }
.deco-7{ bottom:38%; right:22%; font-size:30px; animation-delay:2.5s; }
.deco-8{ bottom:6%;  left:24%; font-size:34px; animation-delay:3.5s; }
@keyframes float{
  0%,100%{ transform: translateY(0) rotate(-6deg); }
  50%{ transform: translateY(-16px) rotate(6deg); }
}
.login-box{
  width:420px;
  background: rgba(255,255,255,.95);
  padding:40px 36px 32px;
  border-radius:24px;
  box-shadow: 0 12px 40px rgba(140,160,200,.25);
  border:1px solid rgba(255,255,255,.8);
  text-align:center;
  position:relative;
  z-index:2;
}
.paw-logo{
  font-size:52px;
  margin-bottom:6px;
}
h2{
  margin:0 0 4px;
  color:#44607c;
  font-size:24px;
}
.subtitle{
  margin:0 0 24px;
  color:#9aa8bb;
  font-size:13px;
}
.open-time{
  margin:-14px 0 20px;
  color:#547899;
  font-size:13px;
  background:#eef6ff;
  border:1px dashed #b9d4f0;
  border-radius:20px;
  padding:6px 0;
}
.login-btn{
  width:100%;
  border-radius:12px;
  background: linear-gradient(90deg,#ffb3c6,#8ec9ff);
  border:none;
  font-size:16px;
  letter-spacing:4px;
}
.login-btn:hover{
  background: linear-gradient(90deg,#ff9fb8,#7cbcff);
  opacity:.92;
}
.register-link{
  color:#7ca6d9;
  font-size:13px;
  cursor:pointer;
}
.register-link:hover{
  color:#ff8fab;
}
</style>
