<template>
  <div>
    <h2 style="color:#44607c;margin-top:0">📅 {{ loginUser.role === '管理员' ? '预约管理（帮主人预约）' : '我的预约' }}</h2>
    <el-button type="primary" @click="openDialog" style="border-radius:10px">➕ {{ loginUser.role === '管理员' ? '帮主人提交预约' : '提交新预约' }}</el-button>

    <el-table :data="tableData" border stripe style="margin-top:15px;border-radius:12px;overflow:hidden"
              :header-cell-style="{background:'#e8f0f8',color:'#2c4763'}">
      <el-table-column prop="id" label="预约编号" width="90"></el-table-column>
      <el-table-column v-if="loginUser.role === '管理员'" prop="username" label="预约主人" width="100"></el-table-column>
      <el-table-column prop="petName" label="宠物"></el-table-column>
      <el-table-column prop="serviceName" label="服务项目" width="130"></el-table-column>
      <el-table-column prop="reserveDate" label="预约日期" width="110"></el-table-column>
      <el-table-column prop="reserveTime" label="时段" width="120"></el-table-column>
      <el-table-column label="服务时长" width="100">
        <template #default="scope">
          <span v-if="scope.row.serviceMinutes">{{ scope.row.serviceMinutes }} 分钟</span>
          <span v-else style="color:#c0c6cf">—</span>
        </template>
      </el-table-column>
      <el-table-column prop="staffName" label="店员">
        <template #default="scope">
          <span v-if="scope.row.staffName">{{ scope.row.staffName }}</span>
          <span v-else style="color:#c0c6cf">—</span>
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
      <el-table-column v-if="loginUser.role !== '管理员'" label="操作" width="230">
        <template #default="scope">
          <el-button v-if="scope.row.status==='待审核' || scope.row.status==='已同意'"
                     size="small" type="danger" plain @click="handleCancel(scope.row)">取消预约</el-button>
          <el-button v-if="scope.row.status==='已完成'" size="small" type="primary"
                     @click="router.push('/home/bill')">查看账单</el-button>
          <el-button v-if="scope.row.status==='已完成' && !ratedMap[scope.row.id]"
                     size="small" type="warning" @click="openRating(scope.row)">评价店员</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增预约弹窗 -->
    <el-dialog v-model="dialogVisible" title="🐾 提交预约" width="520px">
      <el-form :model="form" label-width="90px">
        <!-- 管理员：先选主人 -->
        <el-form-item v-if="loginUser.role === '管理员'" label="预约主人">
          <el-select v-model="form.ownerId" filterable placeholder="选择要帮谁预约" style="width:100%" @change="onOwnerChange">
            <el-option v-for="o in owners" :key="o.ownerId"
                       :label="`${o.realName}（账号：${o.username || '未关联账号'}）`" :value="o.ownerId"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="选择宠物">
          <el-select v-model="form.petId" placeholder="请选择宠物" style="width:100%" @change="onPetChange">
            <el-option v-for="p in petOptions" :key="p.petId" :label="`${p.petName}（${p.variety}）`" :value="p.petId"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="服务项目">
          <el-select v-model="form.serviceName" placeholder="请选择服务" style="width:100%" @change="onServiceChange">
            <el-option v-for="s in services" :key="s.id" :label="`${s.serviceName}（¥${s.price}）`" :value="s.serviceName"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="预约日期">
          <el-date-picker v-model="form.reserveDate" type="date" placeholder="选择日期"
                          value-format="YYYY-MM-DD" :disabled-date="disabledDate" style="width:100%"></el-date-picker>
        </el-form-item>
        <el-form-item label="预约时段">
          <el-select v-model="form.reserveTime" placeholder="请选择时段" style="width:100%" @change="loadAvailableStaff">
            <el-option v-for="t in timeSlots" :key="t" :label="t" :value="t"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="选择店员">
          <el-select v-model="form.staffId" placeholder="先选日期和时段，显示空闲店员" style="width:100%">
            <el-option v-for="st in availableStaff" :key="st.staffId"
                       :label="`${st.staffName}（擅长：${st.skill}｜评分：${st.avgScore}）`" :value="st.staffId"></el-option>
          </el-select>
          <div v-if="form.reserveDate && form.reserveTime && availableStaff.length===0"
               style="color:#e6a23c;font-size:12px;margin-top:4px">
            该时段所有店员已被预约，请换个时段 😿
          </div>
        </el-form-item>
        <el-form-item label="应付金额">
          <b style="color:#d97706">¥ {{ form.price || 0 }}</b>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" :disabled="!canSubmit" @click="submitReserve">确定提交</el-button>
      </template>
    </el-dialog>

    <!-- 评价店员弹窗 -->
    <el-dialog v-model="ratingVisible" title="⭐ 评价店员" width="440px">
      <div style="text-align:center;margin-bottom:12px">
        <div style="font-size:15px;color:#44607c;margin-bottom:8px">
          本次为您服务的是：<b>{{ currentStaffName }}</b>
        </div>
        <el-rate v-model="ratingForm.score" :max="5"></el-rate>
      </div>
      <el-input v-model="ratingForm.comment" type="textarea" :rows="3" placeholder="说说服务体验吧~"></el-input>
      <template #footer>
        <el-button @click="ratingVisible=false">取消</el-button>
        <el-button type="primary" @click="submitRating">提交评价</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const loginUser = ref(JSON.parse(sessionStorage.getItem("loginUser")))

const tableData = ref([])
const dialogVisible = ref(false)
const owners = ref([])
const petOptions = ref([])
const services = ref([])
const availableStaff = ref([])
const ratedMap = ref({})

const timeSlots = ['09:00-10:00','10:00-11:00','11:00-12:00','14:00-15:00','15:00-16:00','16:00-17:00']

const form = ref({
  ownerId:null,      // 管理员帮谁预约（主人ID）
  username:'',
  petId:null,
  petName:'',
  serviceName:'',
  reserveDate:'',
  reserveTime:'',
  staffId:null,
  price:0
})

const ratingVisible = ref(false)
const currentStaffName = ref('')
const ratingForm = ref({ reserveId:null, staffId:null, username:'', score:5, comment:'' })

const canSubmit = computed(()=>{
  const base = form.value.petId && form.value.serviceName && form.value.reserveDate
      && form.value.reserveTime && form.value.staffId
  if(loginUser.value.role === '管理员') return base && form.value.ownerId
  return base
})

const statusType = (s)=>{
  if(s==='待审核') return 'info'
  if(s==='已同意') return 'primary'
  if(s==='进行中') return 'warning'
  if(s==='已完成') return 'success'
  if(s==='已拒绝' || s==='已取消') return 'danger'
  return 'info'
}

const disabledDate = (date)=>{
  return date.getTime() < Date.now() - 86400000
}

const loadData = async ()=>{
  let res
  if(loginUser.value.role === '管理员'){
    res = await axios.get('/reserve/all')
  }else{
    res = await axios.get(`/reserve/my?username=${loginUser.value.username}`)
  }
  tableData.value = res.data
  // 主人视角：检查已完成预约是否已评价
  if(loginUser.value.role !== '管理员'){
    const rated = {}
    for(const r of res.data.filter(x=>x.status==='已完成')){
      const c = await axios.get(`/rating/exists?reserveId=${r.id}`)
      rated[r.id] = c.data > 0
    }
    ratedMap.value = rated
  }
}

const loadOwners = async ()=>{
  const res = await axios.get('/owner/list')
  owners.value = res.data
}

// 主人视角：加载自己的宠物
const loadMyPets = async ()=>{
  const owner = await axios.get(`/owner/byUser/${loginUser.value.userId}`)
  if(owner.data){
    const res = await axios.get(`/pet/owner/${owner.data.ownerId}`)
    petOptions.value = res.data
  }else{
    petOptions.value = []
  }
}

// 管理员视角：加载所选主人的宠物
const loadOwnerPets = async (ownerId)=>{
  const res = await axios.get(`/pet/owner/${ownerId}`)
  petOptions.value = res.data
}

const loadServices = async ()=>{
  const res = await axios.get('/petService/list')
  services.value = res.data
}

const openDialog = async ()=>{
  form.value = {
    ownerId:null, username:loginUser.value.username, petId:null, petName:'',
    serviceName:'', reserveDate:'', reserveTime:'', staffId:null, price:0
  }
  availableStaff.value = []
  if(loginUser.value.role === '管理员'){
    await loadOwners()
    petOptions.value = []
  }else{
    await loadMyPets()
    if(petOptions.value.length===0){
      alert("您还没有宠物，请先在【宠物信息】中添加宠物！")
      return
    }
  }
  dialogVisible.value = true
}

// 管理员选了主人：绑定其账号并加载其宠物
const onOwnerChange = (ownerId)=>{
  const o = owners.value.find(x=>x.ownerId===ownerId)
  form.value.username = o ? o.username : ''
  form.value.petId = null
  form.value.petName = ''
  if(ownerId){ loadOwnerPets(ownerId) } else { petOptions.value = [] }
}

const onPetChange = (petId)=>{
  const p = petOptions.value.find(x=>x.petId===petId)
  form.value.petName = p ? p.petName : ''
}

const onServiceChange = (name)=>{
  const s = services.value.find(x=>x.serviceName===name)
  form.value.price = s ? s.price : 0
}

const loadAvailableStaff = async ()=>{
  if(!form.value.reserveDate || !form.value.reserveTime){
    availableStaff.value = []
    return
  }
  const res = await axios.get(`/staff/available?date=${form.value.reserveDate}&time=${form.value.reserveTime}`)
  availableStaff.value = res.data
  form.value.staffId = null
}

const submitReserve = async ()=>{
  const res = await axios.post('/reserve/add', form.value)
  if(res.data === 'not your pet'){
    alert("宠物归属校验失败：请确认选择的是该主人的宠物！")
    return
  }
  if(res.data === 'no pet'){
    alert("请先选择宠物！")
    return
  }
  dialogVisible.value = false
  if(loginUser.value.role === '管理员'){
    alert(`已帮主人【${form.value.username}】提交预约，等待审核 🐾`)
  }else{
    alert("预约提交成功，等待管理员审核 🐾")
  }
  loadData()
}

const handleCancel = async (row)=>{
  if(confirm(`确定取消预约【${row.petName} - ${row.serviceName}】吗？`)){
    await axios.put(`/reserve/cancel/${row.id}`)
    loadData()
  }
}

const openRating = (row)=>{
  currentStaffName.value = row.staffName || '店员'
  ratingForm.value = { reserveId:row.id, staffId:row.staffId, username:loginUser.value.username, score:5, comment:'' }
  ratingVisible.value = true
}

const submitRating = async ()=>{
  if(!ratingForm.value.staffId){ alert("该预约未关联店员"); return }
  await axios.post('/rating/add', ratingForm.value)
  ratingVisible.value = false
  alert("感谢您的评价！⭐")
  loadData()
}

onMounted(()=>{
  loadData()
  loadServices()
})
</script>
