<template>
  <div>
    <h2>服务项目管理</h2>
    <el-button v-if="loginUser.role === '管理员'" type="primary" @click="openAdd"> 新增服务</el-button>
    <el-table :data="tableData" border stripe style="margin-top:15px"
              :header-cell-style="{background:'#e8f0f8',color:'#2c4763'}">
      <el-table-column prop="id" label="编号" width="80"></el-table-column>
      <el-table-column prop="serviceName" label="服务名称"></el-table-column>
      <el-table-column prop="price" label="价格"></el-table-column>
      <el-table-column prop="description" label="服务描述"></el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="scope">
          <el-button v-if="loginUser.role === '管理员'" size="small" @click="openEdit(scope.row)"> 编辑</el-button>
          <el-button v-if="loginUser.role === '管理员'" size="small" type="danger" @click="handleDel(scope.row)"> 删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" title="服务项目">
      <el-form :model="form">
        <el-form-item label="服务名称">
          <el-input v-model="form.serviceName"></el-input>
        </el-form-item>
        <el-form-item label="价格">
          <el-input v-model="form.price"></el-input>
        </el-form-item>
        <el-form-item label="服务描述">
          <el-input v-model="form.description" type="textarea"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false"> 取消</el-button>
        <el-button type="primary" @click="submit"> 保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {ref,onMounted} from 'vue'
import axios from 'axios'

const loginUser = ref(JSON.parse(sessionStorage.getItem("loginUser")))
const tableData = ref([])
const dialogVisible = ref(false)
const form = ref({
  id:null,
  serviceName:'',
  price:'',
  description:''
})

const loadData = async ()=>{
  const res = await axios.get("http://localhost:8081/petService/list")
  tableData.value = res.data
}

const openAdd = ()=>{
  form.value.id = null
  form.value.serviceName = ''
  form.value.price = ''
  form.value.description = ''
  dialogVisible.value = true
}

const openEdit = (row)=>{
  form.value.id = row.id
  form.value.serviceName = row.serviceName
  form.value.price = row.price
  form.value.description = row.description
  dialogVisible.value = true
}

const submit = async ()=>{
  if(form.value.id){
    await axios.put("http://localhost:8081/petService/update",form.value)
  }else{
    await axios.post("http://localhost:8081/petService/add",form.value)
  }
  dialogVisible.value = false
  loadData()
}

const handleDel = async (row)=>{
  if (window.confirm("确定删除？")){
    await axios.delete(`http://localhost:8081/petService/delete/${row.id}`)
    loadData()
  }
}

onMounted(()=>{
  loadData()
})
</script>
