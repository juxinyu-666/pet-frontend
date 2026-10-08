<template>
  <div>
    <h2 style="color:#44607c;margin-top:0">🏠 店铺总览</h2>

    <!-- 第一行：预约与营业 -->
    <el-row :gutter="16">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card" style="border-top:4px solid #ffb3c6">
          <div class="stat-num">{{ data.todayReserve }}</div>
          <div class="stat-label">今日预约</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card" style="border-top:4px solid #ffd380">
          <div class="stat-num">{{ data.pendingReserve }}</div>
          <div class="stat-label">待审核预约</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card" style="border-top:4px solid #8ec9ff">
          <div class="stat-num">{{ data.doingReserve }}</div>
          <div class="stat-label">服务进行中</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card" style="border-top:4px solid #a8e6a3">
          <div class="stat-num">{{ data.doneReserve }}</div>
          <div class="stat-label">已完成服务</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top:16px">
      <el-col :span="8">
        <el-card shadow="hover" class="income-card">
          <div class="income-title">💰 累计营业额（已支付）</div>
          <div class="income-num">¥ {{ data.totalIncome }}</div>
          <div style="font-size:12px;color:#b08a5a;margin-top:6px">近7日营业额见下方趋势图</div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card shadow="hover">
          <div style="font-weight:700;color:#44607c;margin-bottom:12px">📊 店铺基础数据</div>
          <el-row :gutter="12">
            <el-col :span="6" v-for="item in baseItems" :key="item.label" style="margin-bottom:12px">
              <div class="base-item">
                <div class="base-num">{{ item.value }}</div>
                <div class="base-label">{{ item.label }}</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <!-- 统计图表 -->
    <el-row :gutter="16" style="margin-top:16px">
      <el-col :span="12">
        <el-card shadow="hover" style="border-radius:14px">
          <div style="font-weight:700;color:#44607c;margin-bottom:8px">📈 近7日运营趋势（预约数 / 营业额）</div>
          <div ref="trendRef" style="height:300px"></div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" style="border-radius:14px">
          <div style="font-weight:700;color:#44607c;margin-bottom:8px">🍩 预约状态分布</div>
          <div ref="statusRef" style="height:300px"></div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" style="border-radius:14px">
          <div style="font-weight:700;color:#44607c;margin-bottom:8px">🧾 服务项目订单占比</div>
          <div ref="serviceRef" style="height:300px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import axios from 'axios'
import * as echarts from 'echarts'

const data = ref({
  todayReserve:0, pendingReserve:0, doingReserve:0, doneReserve:0,
  totalIncome:0, userCount:0, petCount:0, staffCount:0,
  memberCount:0, serviceCount:0, messageCount:0, noticeCount:0
})

const trendRef = ref(null)
const statusRef = ref(null)
const serviceRef = ref(null)

const baseItems = computed(()=>[
  { label:'注册用户', value: data.value.userCount },
  { label:'宠物数量', value: data.value.petCount },
  { label:'在岗店员', value: data.value.staffCount },
  { label:'会员人数', value: data.value.memberCount },
  { label:'服务项目', value: data.value.serviceCount },
  { label:'留言数量', value: data.value.messageCount },
  { label:'公告数量', value: data.value.noticeCount }
])

const renderCharts = (chart)=>{
  // 近7日趋势：柱状=预约数，折线=营业额
  const trend = echarts.init(trendRef.value)
  trend.setOption({
    tooltip:{ trigger:'axis' },
    legend:{ data:['预约数','营业额(元)'], bottom:0 },
    grid:{ left:45, right:45, top:30, bottom:45 },
    xAxis:{ type:'category', data: chart.days, axisLabel:{ fontSize:11 } },
    yAxis:[
      { type:'value', name:'预约数', minInterval:1 },
      { type:'value', name:'营业额', splitLine:{ show:false } }
    ],
    series:[
      { name:'预约数', type:'bar', data: chart.reserveTrend, itemStyle:{ color:'#7fb3e8', borderRadius:[4,4,0,0] }, barWidth:'45%' },
      { name:'营业额(元)', type:'line', yAxisIndex:1, data: chart.incomeTrend, smooth:true,
        itemStyle:{ color:'#f0a35e' }, lineStyle:{ width:3 }, symbolSize:7 }
    ]
  })

  // 预约状态分布：环形图
  const statusNames = { '待审核':'待审核','已同意':'已同意','进行中':'进行中','已完成':'已完成','已拒绝':'已拒绝','已取消':'已取消' }
  const statusData = chart.statusDist.map(s=>({ name: statusNames[s.name] || s.name, value: s.value }))
  const statusChart = echarts.init(statusRef.value)
  statusChart.setOption({
    tooltip:{ trigger:'item' },
    legend:{ bottom:0, textStyle:{ fontSize:11 } },
    color:['#8ec9ff','#5b8cff','#ffd380','#a8e6a3','#f0a3a3','#c0c6cf'],
    series:[{
      type:'pie', radius:['40%','66%'], center:['50%','45%'],
      label:{ fontSize:11 },
      data: statusData
    }]
  })

  // 服务项目订单占比：横向柱状
  const serviceChart = echarts.init(serviceRef.value)
  serviceChart.setOption({
    tooltip:{ trigger:'axis' },
    grid:{ left:70, right:25, top:15, bottom:25 },
    xAxis:{ type:'value', minInterval:1 },
    yAxis:{ type:'category', data: chart.serviceDist.map(s=>s.name), axisLabel:{ fontSize:11 } },
    series:[{
      type:'bar', data: chart.serviceDist.map(s=>s.value),
      itemStyle:{ color:'#8ec9a3', borderRadius:[0,4,4,0] }, barWidth:'50%',
      label:{ show:true, position:'right' }
    }]
  })

  window.addEventListener('resize', ()=>{
    trend.resize(); statusChart.resize(); serviceChart.resize()
  })
}

onMounted(async ()=>{
  const res = await axios.get('/dashboard/summary')
  data.value = res.data
  const c = await axios.get('/dashboard/chart')
  await nextTick()
  renderCharts(c.data)
})
</script>

<style scoped>
.stat-card{ text-align:center; border-radius:14px; }
.stat-num{ font-size:34px; font-weight:800; color:#44607c; }
.stat-label{ color:#8a94a6; font-size:13px; margin-top:4px; }
.income-card{ border-radius:14px; background:linear-gradient(135deg,#fff7ec,#ffeef4); }
.income-title{ color:#9a7b4f; font-size:14px; }
.income-num{ font-size:32px; font-weight:800; color:#d97706; margin-top:8px; }
.base-item{ text-align:center; background:#f7f9fc; border-radius:10px; padding:14px 8px; }
.base-num{ font-size:22px; font-weight:700; color:#547899; }
.base-label{ color:#8a94a6; font-size:12px; margin-top:2px; }
</style>
