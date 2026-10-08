<template>
  <div>
    <el-card shadow="hover" style="border-radius:14px;padding:22px;background:#ffffff">
      <h2 style="margin-top:0;color:#44607c">🐱 宠物信息列表</h2>
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <el-button type="primary" @click="openDialog()" style="border-radius:10px">➕新增宠物</el-button>
        <span v-if="loginUser.role !== '管理员'" style="color:#9aa8bb;font-size:13px">
          仅显示我自己的宠物（共 {{ tableData.length }} 只）
        </span>
        <span v-else style="color:#9aa8bb;font-size:13px">
          管理员视角：全部宠物（共 {{ tableData.length }} 只）
        </span>
      </div>

      <el-table :data="tableData" border stripe
                style="margin-top:16px;border-radius:12px;overflow:hidden"
                :header-cell-style="{background:'#e8f0f8',color:'#2c4763'}">
        <el-table-column prop="petId" label="宠物编号" width="100"/>
        <el-table-column prop="petName" label="宠物名字" width="120"/>
        <el-table-column prop="variety" label="品种" width="120"/>
        <el-table-column prop="age" label="年龄" width="80"/>
        <el-table-column prop="gender" label="性别" width="80"/>
        <el-table-column prop="health" label="健康状态" width="120"/>
        <el-table-column prop="ownerId" label="主人ID" width="100"/>
        <el-table-column label="操作" width="160">
          <template #default="scope">
            <el-button size="small" style="border-radius:8px" @click="openDialog(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" style="border-radius:8px" @click="handleDel(scope.row.petId)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-dialog v-model="dialogVisible" title="🐾宠物信息">
        <el-form :model="form">
          <el-form-item label="宠物名字">
            <el-input v-model="form.petName"></el-input>
          </el-form-item>
          <el-form-item label="品种">
            <el-input v-model="form.variety"></el-input>
          </el-form-item>
          <el-form-item label="年龄">
            <el-input-number v-model="form.age"></el-input-number>
          </el-form-item>
          <el-form-item label="性别">
            <el-input v-model="form.gender"></el-input>
          </el-form-item>
          <el-form-item label="健康状态">
            <el-input v-model="form.health"></el-input>
          </el-form-item>
          <!-- 主人自动绑定自己的主人ID，不可修改；管理员下拉选择主人 -->
          <el-form-item v-if="loginUser.role === '管理员'" label="所属主人">
            <el-select v-model="form.ownerId" filterable placeholder="选择主人" style="width:100%">
              <el-option v-for="o in owners" :key="o.ownerId" :label="`${o.realName}（主人ID ${o.ownerId}）`" :value="o.ownerId"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item v-else label="所属主人">
            <el-input :value="`我（主人ID：${form.ownerId}）`" disabled></el-input>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible=false" style="border-radius:8px">取消</el-button>
          <el-button type="primary" @click="submitForm()" style="border-radius:8px">确定</el-button>
        </template>
      </el-dialog>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const loginUser = ref(JSON.parse(sessionStorage.getItem("loginUser")))
const myOwnerId = ref(null)   // 当前主人自己的 owner_id
const owners = ref([])        // 主人列表（管理员选择用）
const tableData = ref([])
const dialogVisible = ref(false)
const form = ref({
  petId:null,
  petName:'',
  variety:'',
  age:0,
  gender:'',
  health:'',
  ownerId:1
})

const getPetList = async () => {
  if(loginUser.value.role === '管理员'){
    // 管理员：全部宠物 + 主人列表供下拉
    const res = await axios.get('/pet/list')
    tableData.value = res.data
    const o = await axios.get('/owner/list')
    owners.value = o.data
  }else{
    // 主人：先通过 user_id 找到自己的 owner_id，再看自己的宠物
    const owner = await axios.get(`/owner/byUser/${loginUser.value.userId}`)
    if(owner.data){
      myOwnerId.value = owner.data.ownerId
      const res = await axios.get(`/pet/owner/${owner.data.ownerId}`)
      tableData.value = res.data
    }else{
      myOwnerId.value = null
      tableData.value = []
      alert("您还没有完善主人资料，请先联系管理员在【主人管理】中登记，才能管理宠物。")
    }
  }
}

const openDialog = (row)=>{
  dialogVisible.value = true
  if(row){
    form.value = {...row}
  }else{
    form.value = {petId:null,petName:'',variety:'',age:0,gender:'',health:'',ownerId: myOwnerId.value || 1}
  }
}

const submitForm = async ()=>{
  if(!form.value.petName){ alert("请填写宠物名字"); return }
  if(form.value.petId){
    await axios.put('/pet/update',form.value)
  }else{
    await axios.post('/pet/add',form.value)
  }
  dialogVisible.value=false
  getPetList()
}

const handleDel = async (petId)=>{
  if(confirm("确定删除这条宠物？")){
    await axios.delete(`/pet/del/${petId}`)
    getPetList()
  }
}

onMounted(()=>{
  getPetList()
})
</script>
