<template>
  <el-card shadow="hover" style="border-radius:14px;padding:22px">
    <h2 style="margin-top:0;color:#44607c">🧑 宠物主人管理</h2>
    <el-button type="primary" @click="openDialog()" style="border-radius:10px">➕新增主人</el-button>

    <el-table :data="tableData" border stripe
              style="margin-top:16px;border-radius:12px;overflow:hidden"
              :header-cell-style="{background:'#e8f0f8',color:'#2c4763'}">
      <el-table-column prop="ownerId" label="主人ID" width="90"/>
      <el-table-column prop="realName" label="姓名" width="120"/>
      <el-table-column prop="userId" label="关联用户ID" width="100"/>
      <el-table-column prop="phone" label="手机号" width="140"/>
      <el-table-column prop="address" label="住址"/>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button size="small" @click="openDialog(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDel(scope.row.ownerId)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="主人信息">
      <el-form :model="form">
        <el-form-item label="姓名">
          <el-input v-model="form.realName"></el-input>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone"></el-input>
        </el-form-item>
        <el-form-item label="住址">
          <el-input v-model="form.address"></el-input>
        </el-form-item>
        <el-form-item label="关联用户">
          <el-select v-model="form.userId" filterable clearable placeholder="选择要关联的用户账号" style="width:100%">
            <el-option v-for="u in users" :key="u.userId" :label="`${u.username}（${u.role}）`" :value="u.userId"></el-option>
          </el-select>
          <div style="color:#9aa8bb;font-size:12px;margin-top:4px">请选择用户注册的账号，不要手填数字，避免关联错误</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="submitForm()">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import {ref,onMounted} from 'vue'
import axios from 'axios'

const tableData = ref([])
const users = ref([])
const dialogVisible = ref(false)
const form = ref({ownerId:null,realName:'',phone:'',address:'',userId:null})

const loadList = async()=>{
  const res = await axios.get('http://localhost:8081/owner/list')
  tableData.value = res.data
  // 加载用户列表供“关联用户”下拉选择（避免手填ID出错）
  const u = await axios.get('http://localhost:8081/user/list')
  users.value = u.data
}

const openDialog = (row)=>{
  dialogVisible.value=true
  if(row){
    form.value = {...row}
  }else{
    form.value={ownerId:null,realName:'',phone:'',address:'',userId:null}
  }
}

const submitForm = async()=>{
  if(form.value.ownerId){
    await axios.put('http://localhost:8081/owner/update',form.value)
  }else{
    await axios.post('http://localhost:8081/owner/add',form.value)
  }
  dialogVisible.value=false
  loadList()
}

const handleDel = async(id)=>{
  if(confirm("确定删除该主人？\n（其名下的宠物将一并删除）")){
    await axios.delete(`http://localhost:8081/owner/delete/${id}`)
    loadList()
  }
}

onMounted(()=>loadList())
</script>
