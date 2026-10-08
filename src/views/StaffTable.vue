<template>
  <div>
    <h2 style="color:#44607c;margin-top:0">👩‍⚕️ 店员管理</h2>

    <!-- 空闲查询：选择日期查看每位店员的占用时段 -->
    <el-card shadow="hover" style="border-radius:14px;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <span style="color:#44607c;font-weight:600">🔍 查看空闲情况：</span>
        <el-date-picker v-model="queryDate" type="date" placeholder="选择日期"
                        value-format="YYYY-MM-DD" :clearable="false"></el-date-picker>
        <el-button type="primary" plain @click="loadBusy">查询占用时段</el-button>
        <span style="color:#8a94a6;font-size:13px">选择店员时，避开其被占用时段即可</span>
      </div>
      <el-table v-if="busyList.length" :data="busyList" border stripe style="margin-top:14px"
                :header-cell-style="{background:'#e8f0f8',color:'#2c4763'}">
        <el-table-column prop="staffName" label="店员"></el-table-column>
        <el-table-column prop="skill" label="擅长项目"></el-table-column>
        <el-table-column label="该日被占用时段">
          <template #default="scope">
            <el-tag v-if="scope.row.busyTimes" type="warning">{{ scope.row.busyTimes }}</el-tag>
            <el-tag v-else type="success">全天空闲</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 店员列表 -->
    <el-card shadow="hover" style="border-radius:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span style="color:#44607c;font-weight:700">店员列表</span>
        <el-button v-if="loginUser.role === '管理员'" type="primary" @click="openDialog()">➕ 新增店员</el-button>
      </div>
      <el-table :data="tableData" border stripe
                :header-cell-style="{background:'#e8f0f8',color:'#2c4763'}">
        <el-table-column prop="staffId" label="编号" width="70"></el-table-column>
        <el-table-column prop="staffName" label="姓名"></el-table-column>
        <el-table-column prop="phone" label="电话"></el-table-column>
        <el-table-column prop="skill" label="擅长项目"></el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="scope.row.status==='在职' ? 'success' : 'info'">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="avgScore" label="平均评分">
          <template #default="scope">
            <span style="color:#d97706;font-weight:700">⭐ {{ scope.row.avgScore }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="doneCount" label="完成单数" width="90">
          <template #default="scope">{{ scope.row.doneCount || 0 }} 单</template>
        </el-table-column>
        <el-table-column v-if="loginUser.role === '管理员'" prop="doneAmount" label="营业额" width="100">
          <template #default="scope">
            <span style="color:#547899;font-weight:700">¥ {{ scope.row.doneAmount || '0.00' }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="loginUser.role === '管理员'" label="操作" width="160">
          <template #default="scope">
            <el-button size="small" @click="openDialog(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDel(scope.row.staffId)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="店员信息">
      <el-form :model="form" label-width="90px">
        <el-form-item label="姓名"><el-input v-model="form.staffName"></el-input></el-form-item>
        <el-form-item label="电话"><el-input v-model="form.phone"></el-input></el-form-item>
        <el-form-item label="擅长项目"><el-input v-model="form.skill"></el-input></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width:100%">
            <el-option label="在职" value="在职"></el-option>
            <el-option label="离职" value="离职"></el-option>
          </el-select>
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
import { ref, onMounted } from 'vue'
import axios from 'axios'

const loginUser = ref(JSON.parse(sessionStorage.getItem("loginUser")))
const tableData = ref([])
const busyList = ref([])
const queryDate = ref(new Date().toISOString().slice(0,10))
const dialogVisible = ref(false)
const form = ref({ staffId:null, staffName:'', phone:'', skill:'', status:'在职' })

const loadData = async ()=>{
  const res = await axios.get('/staff/list')
  tableData.value = res.data
  // 合并店员业绩（完成单数/营业额）
  const perf = await axios.get('/staff/performance')
  const perfMap = {}
  perf.data.forEach(p=>{ perfMap[p.staffId] = p })
  tableData.value = tableData.value.map(s=>({
    ...s,
    doneCount: perfMap[s.staffId] ? perfMap[s.staffId].doneCount : 0,
    doneAmount: perfMap[s.staffId] ? perfMap[s.staffId].doneAmount : '0.00'
  }))
}

const loadBusy = async ()=>{
  if(!queryDate.value){ alert("请先选择日期"); return }
  const res = await axios.get(`/staff/busy?date=${queryDate.value}`)
  // 把占用时段合并到店员列表里
  const busyMap = {}
  res.data.forEach(item=>{ busyMap[item.staffId] = item.busyTimes })
  busyList.value = tableData.value
    .filter(s=>s.status==='在职')
    .map(s=>({ staffName:s.staffName, skill:s.skill, busyTimes: busyMap[s.staffId] || '' }))
}

const openDialog = (row)=>{
  dialogVisible.value = true
  if(row){
    form.value = { ...row }
  }else{
    form.value = { staffId:null, staffName:'', phone:'', skill:'', status:'在职' }
  }
}

const submit = async ()=>{
  if(form.value.staffId){
    await axios.put('/staff/update', form.value)
  }else{
    await axios.post('/staff/add', form.value)
  }
  dialogVisible.value = false
  loadData()
}

const handleDel = async (staffId)=>{
  if(confirm("确定删除该店员？")){
    await axios.delete(`/staff/delete/${staffId}`)
    loadData()
  }
}

onMounted(()=>{
  loadData()
})
</script>
