<template>
  <div class="register-wrap">
    <div class="register-box">
      <h2>宠物管理系统-注册</h2>
      <el-form :model="form">
        <el-form-item label="用户名">
          <el-input v-model="form.username"></el-input>
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="doRegister">注册</el-button>
        </el-form-item>
        <div style="text-align:center">
          <span style="color:#409eff;cursor:pointer" @click="router.push('/login')"> 已有账号？去登录 </span>
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

const doRegister = async ()=>{
  const res = await axios.post("http://localhost:8081/user/register",form.value)
  if (res.data ==="ok"){
    alert("注册成功！跳转登录页")
    router.push("/login")
  } else if (res.data ==="exist"){
    alert("该用户名已经被占用！")
  }
}
</script>

<style scoped>
.register-wrap{
  height:100vh;
  background:#eee;
  display:flex;
  justify-content:center;
  align-items:center;
}
.register-box{
  width:400px;
  background:#fff;
  padding:30px;
  border-radius:8px;
}
</style>
