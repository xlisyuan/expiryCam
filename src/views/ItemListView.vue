<script setup lang="ts">
import { ref } from 'vue'
import DateConfirmView from './DateConfirmView.vue'
import { takePhoto } from '../services/camera'
// import { savePhotoTemporarily } from '../services/storage'

type ViewMode = 'daily' | 'weekly' | 'monthly'
const viewMode = ref<ViewMode>('daily')

const multiSelectMode =ref(false)
const selectedIds = ref<Set<number>>(new Set())

const now = new Date()
const defaultDate = {
  yy: String(now.getFullYear()).slice(2), // 取後兩位
  mm: String(now.getMonth() + 1).padStart(2, '0'),
  dd: String(now.getDate()).padStart(2, '0')
}

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
  const photoUri = await takePhoto()
  if (!photoUri) return

  // 這邊可以暫存或存 DB
  tempPhotoUri.value = photoUri
  showDateConfirm.value = true // 拍完直接跳日期 overlay
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
      const { startOfWeek, endOfWeek } = getWeekRange(d)
      key = `${formatDate(startOfWeek)} ~ ${formatDate(endOfWeek)}`
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

// 週範圍
function getWeekRange(date: Date) {
  const d = new Date(date)
  const day = d.getDay() || 7 // Sunday = 7
  const startOfWeek = new Date(d)
  startOfWeek.setDate(d.getDate() - day + 1)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  return { startOfWeek, endOfWeek }
}

function formatDate(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}`
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

function isSelected(item: Item) {
  return selectedIds.value.has(item.id)
}

function toggleSelect(item: Item) {
  if (selectedIds.value.has(item.id)) {
    selectedIds.value.delete(item.id)
  } else {
    selectedIds.value.add(item.id)
  }
}

function deleteSelected() {
  items.value = items.value.filter(item => !selectedIds.value.has(item.id))
  selectedIds.value.clear()
  multiSelectMode.value =false
}

function cancelMultiSelect() {
  selectedIds.value.clear()
  multiSelectMode.value =false
}
// function deleteExpired() {
//     selectedIds.value.clear()
//     const now = new Date()
//     items.value.forEach(item => {
//     const d =parseDate(item)
//     if (d.getTime() < now.getTime()) selectedIds.value.add(item.id)
//     })
//     multiSelectMode.value =true
// }


</script>

<template>
    <div v-if="multiSelectMode" class="multi-actions">
        <button @click="deleteSelected">刪除</button>
        <button @click="cancelMultiSelect">返回</button>
    </div>
  <div class="container">
    <!-- 拍照按鈕 -->
    <button @click="onTakePhoto">拍照</button>

    <div class="view-mode">
        <button @click="viewMode='daily'">每日</button>
        <button @click="viewMode='weekly'">每週</button>
        <button @click="viewMode='monthly'">每月</button>
    </div>

    <div v-for="(group, key) in groupedItems" :key="key" class="group">
    <div class="group-header">{{ key }}</div>
    <ul>
       <li v-for="item in group" :key="item.id" @click="multiSelectMode ? toggleSelect(item) : null"
        :class="{ selected: isSelected(item) }">
        <img :src="item.photoUri" class="item-thumb" />
        <div class="item-info">
            <span class="expiry">{{ formatExpiry(item.date, viewMode) }}</span>
        </div>
      </li>
    </ul>
</div>

    <!-- 日期確認 overlay -->
    <DateConfirmView
      v-if="showDateConfirm && tempPhotoUri"
      :photo-uri="tempPhotoUri"
      :default-date="defaultDate"
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
 .selected { border: 2px solid blue; }
 .item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  cursor: pointer;
}

.item-thumb {
  width: 80px; /* 縮圖大小，可依需求調整 */
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  margin-right: 12px;
  border: 1px solid #ccc;
}

.item-info {
  display: flex;
  flex-direction: column;
}

.expiry {
  font-size: 14px;
  color: #333;
}

</style>
