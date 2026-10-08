<template>
  <div>
    <h2>公告</h2>
    <!--只有管理员显示新增按钮-->
    <el-button v-if="loginUser.role === '管理员'" type="primary" @click="openAdd">新增公告</el-button>
    <el-table :data="tableData" border stripe style="margin-top:15px"
              :header-cell-style="{background:'#e8f0f8',color:'#2c4763'}">
      <el-table-column prop="id" label="编号" width="80"></el-table-column>
      <el-table-column prop="title" label="标题"></el-table-column>
      <el-table-column prop="content" label="内容"></el-table-column>
      <el-table-column prop="createTime" label="发布时间"></el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="scope">
          <el-button v-if="loginUser.role === '管理员'" size="small" @click="openEdit(scope.row)">编辑</el-button>
          <el-button v-if="loginUser.role === '管理员'" size="small" type="danger" @click="handleDel(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!--新增/编辑弹窗-->
    <el-dialog v-model="dialogVisible" title="公告">
      <el-form :model="form">
        <el-form-item label="标题">
          <el-input v-model="form.title"></el-input>
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
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
const form = ref({
  id:null,
  title:'',
  content:''
})

//加载公告列表
const loadData = async ()=>{
  const res = await axios.get("http://localhost:8081/notice/list")
  tableData.value = res.data
}

//打开新增
const openAdd = ()=>{
  form.value.id = null
  form.value.title = ''
  form.value.content = ''
  dialogVisible.value = true
}

//打开编辑
const openEdit = (row)=>{
  form.value.id = row.id
  form.value.title = row.title
  form.value.content = row.content
  dialogVisible.value = true
}

//提交保存
const submit = async ()=>{
  if(form.value.id){
    //编辑
    await axios.put("http://localhost:8081/notice/update",form.value)
  }else{
    //新增
    await axios.post("http://localhost:8081/notice/add",form.value)
  }
  dialogVisible.value = false
  loadData()
}

//删除
const handleDel = async(row)=>{
  if(window.confirm("确定删除这条公告？")){
    await axios.delete(`http://localhost:8081/notice/delete/${row.id}`)
    loadData()
  }
}

onMounted(()=>{
  loadData()
})
</script>
