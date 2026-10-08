<template>
  <div>
    <h2 style="color:#44607c;margin-top:0">✅ 预约审核处理</h2>
    <el-table :data="tableData" border stripe style="margin-top:15px;border-radius:12px;overflow:hidden"
              :header-cell-style="{background:'#e8f0f8',color:'#2c4763'}">
      <el-table-column prop="id" label="编号" width="70"></el-table-column>
      <el-table-column prop="petName" label="宠物"></el-table-column>
      <el-table-column prop="serviceName" label="服务项目"></el-table-column>
      <el-table-column prop="username" label="预约人"></el-table-column>
      <el-table-column prop="reserveDate" label="日期" width="110"></el-table-column>
      <el-table-column prop="reserveTime" label="时段" width="120"></el-table-column>
      <el-table-column prop="staffName" label="店员"></el-table-column>
      <el-table-column label="店员时段状态" width="160">
        <template #default="scope">
          <el-tag v-if="scope.row.conflictCount > 0" type="danger">⚠ 该时段已被占用</el-tag>
          <el-tag v-else type="success">该时段空闲</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="price" label="金额" width="90">
        <template #default="scope">¥ {{ scope.row.price }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="statusType(scope.row.status)">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="320">
        <template #default="scope">
          <!-- 待审核：同意 / 拒绝 -->
          <template v-if="scope.row.status==='待审核'">
            <el-button size="small" type="success" @click="accept(scope.row)">同意</el-button>
            <el-button size="small" type="danger" @click="reject(scope.row)">拒绝</el-button>
          </template>
          <!-- 已同意：开始服务 -->
          <el-button v-else-if="scope.row.status==='已同意'" size="small" type="primary"
                     @click="startService(scope.row)">▶ 开始服务</el-button>
          <!-- 进行中：完成服务 -->
          <el-button v-else-if="scope.row.status==='进行中'" size="small" type="warning"
                     @click="finishService(scope.row)">✔ 完成服务</el-button>
          <!-- 其他状态提示 -->
          <span v-else style="color:#c0c6cf;font-size:12px">—</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import {ref,onMounted} from 'vue'
import axios from 'axios'

const tableData = ref([])

const loadData = async ()=>{
  const res = await axios.get('/reserve/all')
  tableData.value = res.data
}

const statusType = (s)=>{
  if(s==='待审核') return 'info'
  if(s==='已同意') return 'primary'
  if(s==='进行中') return 'warning'
  if(s==='已完成') return 'success'
  if(s==='已拒绝' || s==='已取消') return 'danger'
  return 'info'
}

const accept = async(row)=>{
  const res = await axios.put(`/reserve/accept/${row.id}`)
  if(res.data === 'busy'){
    alert("⚠ 该店员在此日期时段已被其他预约占用，请更换店员或时段后再同意！")
  }
  loadData()
}

const reject = async(row)=>{
  if(confirm(`确定拒绝【${row.petName} - ${row.serviceName}】的预约吗？`)){
    await axios.put(`/reserve/reject/${row.id}`)
    loadData()
  }
}

const startService = async(row)=>{
  if(confirm(`开始服务：${row.petName} - ${row.serviceName}？`)){
    const res = await axios.put(`/reserve/start/${row.id}`)
    if(res.data === 'busy'){
      alert("⚠ 该店员在此日期时段已被其他预约占用，请勿重复安排！")
      return
    }
    loadData()
  }
}

const finishService = async(row)=>{
  if(confirm(`确认服务完成？将自动生成账单（¥${row.price}）交给顾客支付。`)){
    await axios.put(`/reserve/finish/${row.id}`)
    alert("服务完成，账单已生成 🐾")
    loadData()
  }
}

onMounted(()=>{
  loadData()
})
</script>
