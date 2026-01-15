<script setup lang="ts">
import { ref } from 'vue'
import DateConfirmView from './DateConfirmView.vue'
import { takePhoto } from '../services/camera'
import { savePhotoTemporarily } from '../services/storage'

type ViewMode = 'daily' | 'weekly' | 'monthly'
const viewMode = ref<ViewMode>('daily')

// -------------------------
// 清單資料
// -------------------------
interface Item {
  id: number
  photoUri: string
  date: { yy: string; mm: string; dd: string }
}

const items = ref<Item[]>([])
let nextId = 1

// -------------------------
// 暫存拍照照片
// -------------------------
const tempPhotoUri = ref<string | null>(null)
const showDateConfirm = ref(false)

// -------------------------
// 拍照流程
// -------------------------
async function onTakePhoto() {
  const photo = await takePhoto()
  if (!photo) return

  const fileName = `photo_${Date.now()}.jpg`
  const saved = await savePhotoTemporarily(photo, fileName)
  if (!saved) return

  tempPhotoUri.value = saved
  showDateConfirm.value = true // 🔥 拍完直接跳日期確認 overlay
}

// -------------------------
// DateConfirmView 事件
// -------------------------
function onDateDone(date: { yy: string; mm: string; dd: string }) {
  if (!tempPhotoUri.value) return

  // 新增到清單
  items.value.unshift({
    id: nextId++,
    photoUri: tempPhotoUri.value,
    date,
  })

  // 重置暫存
  tempPhotoUri.value = null
  showDateConfirm.value = false
}

function onDateCancel() {
  // 取消日期 → 暫存照片不存入清單
  tempPhotoUri.value = null
  showDateConfirm.value = false
}

import { computed } from 'vue'

function parseDate(item: Item) {
  return new Date(
    Number('20' + item.date.yy),
    Number(item.date.mm) - 1,
    Number(item.date.dd)
  )
}

// 已排序清單
const sortedItems = computed(() => {
  return [...items.value].sort((a, b) => parseDate(a).getTime() - parseDate(b).getTime())
})

// 分組資料，依 viewMode
const groupedItems = computed(() => {
  const groups: Record<string, Item[]> = {}

  sortedItems.value.forEach(item => {
    const d = parseDate(item)
    let key = ''
    if (viewMode.value === 'daily') {
      key = d.toISOString().slice(0, 10) // YYYY-MM-DD
    } else if (viewMode.value === 'weekly') {
      const week = getWeekNumber(d)
      key = `${d.getFullYear()}-W${week}`
    } else if (viewMode.value === 'monthly') {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    }

    let group = groups[key]
    if (!group) {
      group = []
      groups[key] = group
    }
    group.push(item)
  })

  return groups
})

// 計算週數
function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function formatExpiry(date: { yy: string; mm: string; dd: string }, mode: ViewMode) {
  const fullYear = Number('20' + date.yy)
  if (mode === 'daily') {
    // 如果跨年就顯示 YYMMDD，否則 MMDD
    const nowYear = new Date().getFullYear()
    return fullYear === nowYear ? `${date.mm}${date.dd}` : `${date.yy}${date.mm}${date.dd}`
  } else if (mode === 'weekly' || mode === 'monthly') {
    return date.dd
  }
  return ''
}

</script>

<template>
  <div class="container">
    <!-- 拍照按鈕 -->
    <button @click="onTakePhoto">拍照</button>

    <div class="view-mode">
        <button @click="viewMode='daily'">每日</button>
        <button @click="viewMode='weekly'">每週</button>
        <button @click="viewMode='monthly'">每月</button>
    </div>

    <div v-for="(group, key) in groupedItems" :key="key" class="group">
  <div class="group-header">
    <span v-if="viewMode==='daily'">{{ key }}</span>
    <span v-else-if="viewMode==='weekly'">Week {{ key.split('-W')[1] }} / {{ key.split('-W')[0] }}</span>
    <span v-else-if="viewMode==='monthly'">Month {{ key.split('-')[1] }} / {{ key.split('-')[0] }}</span>
  </div>

  <ul>
    <li v-for="item in group" :key="item.id">
      <img :src="item.photoUri" style="width: 80px; margin-right: 8px;" />
      <span>{{ formatExpiry(item.date, viewMode) }}</span>
    </li>
  </ul>
</div>


    <!-- 清單 -->
    <div v-if="items.length === 0" style="margin-top: 12px;">沒有紀錄</div>
    <ul v-else style="margin-top: 12px;">
      <li v-for="item in items" :key="item.id">
        <img :src="item.photoUri" style="width: 80px; margin-right: 8px;" />
        {{ item.date.yy }} / {{ item.date.mm }} / {{ item.date.dd }}
      </li>
    </ul>

    <!-- 日期確認 overlay -->
    <DateConfirmView
      v-if="showDateConfirm && tempPhotoUri"
      :photo-uri="tempPhotoUri"
      :default-date="{ yy: '23', mm: '01', dd: '01' }"
      @done="onDateDone"
      @cancel="onDateCancel"
    />
  </div>
</template>

<style scoped>
.container {
  padding: 16px;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
</style>
