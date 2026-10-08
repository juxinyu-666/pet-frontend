<template>
  <div>
    <h2 style="color:#44607c;margin-top:0">💬 留言反馈</h2>
    <div style="color:#9aa8bb;font-size:13px;margin-bottom:10px">
      {{ loginUser.role === '管理员' ? '这里是顾客留言，管理员可以回复或删除' : '写下您的咨询、反馈或建议，管理员会回复您 ~' }}
    </div>
    <!-- 只有普通用户能写留言 -->
    <el-button v-if="loginUser.role !== '管理员'" type="primary" @click="openAdd" style="border-radius:10px">✍️ 写留言</el-button>

    <el-table :data="tableData" border stripe style="margin-top:15px;border-radius:12px;overflow:hidden"
              :header-cell-style="{background:'#e8f0f8',color:'#2c4763'}">
      <el-table-column prop="id" label="编号" width="70"></el-table-column>
      <el-table-column v-if="loginUser.role === '管理员'" prop="username" label="留言人" width="110"></el-table-column>
      <el-table-column prop="content" label="留言内容" min-width="200"></el-table-column>
      <el-table-column label="管理员回复" min-width="180">
        <template #default="scope">
          <div v-if="scope.row.reply" style="color:#2c7a52">
            <div>✅ {{ scope.row.reply }}</div>
            <div style="font-size:12px;color:#9aa8bb;margin-top:2px">{{ scope.row.replyTime }}</div>
          </div>
          <el-tag v-else type="info" effect="plain">等待回复</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="留言时间" width="170"></el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="scope">
          <!-- 管理员：回复 + 删除 -->
          <template v-if="loginUser.role === '管理员'">
            <el-button size="small" type="primary" plain @click="openReply(scope.row)">回复</el-button>
            <el-button size="small" type="danger" plain @click="handleDel(scope.row)">删除</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增留言弹窗（普通用户） -->
    <el-dialog v-model="dialogVisible" title="✍️ 写留言" width="500px">
      <el-form :model="form">
        <el-form-item label="留言内容">
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="请写下您的咨询、反馈或建议~"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="submit">提交留言</el-button>
      </template>
    </el-dialog>

    <!-- 管理员回复弹窗 -->
    <el-dialog v-model="replyVisible" title="💬 回复留言" width="520px">
      <div v-if="currentMsg" style="background:#f7f9fc;border-radius:10px;padding:12px;margin-bottom:12px">
        <div style="font-size:13px;color:#8a94a6;margin-bottom:4px">{{ currentMsg.username }} 留言（{{ currentMsg.createTime }}）：</div>
        <div style="color:#44607c">{{ currentMsg.content }}</div>
      </div>
      <el-input v-model="replyForm.reply" type="textarea" :rows="4" placeholder="输入回复内容"></el-input>
      <template #footer>
        <el-button @click="replyVisible=false">取消</el-button>
        <el-button type="primary" @click="submitReply">确认回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref,onMounted } from 'vue'
import axios from 'axios'

const loginUser = ref(JSON.parse(sessionStorage.getItem("loginUser")))
const tableData = ref([])
const dialogVisible = ref(false)
const replyVisible = ref(false)
const currentMsg = ref(null)
const form = ref({ username:'', content:'' })
const replyForm = ref({ id:null, reply:'' })

const loadData = async ()=>{
  let res
  if(loginUser.value.role === "管理员"){
    res = await axios.get("http://localhost:8081/message/all")
  }else{
    res = await axios.get(`http://localhost:8081/message/my?username=${loginUser.value.username}`)
  }
  tableData.value = res.data
}

const openAdd = ()=>{
  form.value.username = loginUser.value.username
  form.value.content = ''
  dialogVisible.value = true
}

const submit = async ()=>{
  if(!form.value.content.trim()){ alert("请先填写留言内容！"); return }
  await axios.post("http://localhost:8081/message/add",form.value)
  dialogVisible.value = false
  alert("留言成功，等待管理员回复 🐾")
  loadData()
}

const openReply = (row)=>{
  currentMsg.value = row
  replyForm.value = { id:row.id, reply:'' }
  replyVisible.value = true
}

const submitReply = async ()=>{
  if(!replyForm.value.reply.trim()){ alert("请填写回复内容！"); return }
  await axios.post("http://localhost:8081/message/reply",replyForm.value)
  replyVisible.value = false
  alert("回复成功 ✅")
  loadData()
}

const handleDel = async(row)=>{
  if(window.confirm("确定删除这条留言？")){
    await axios.delete(`http://localhost:8081/message/delete/${row.id}`)
    loadData()
  }
}

onMounted(()=>{
  loadData()
})
</script>
