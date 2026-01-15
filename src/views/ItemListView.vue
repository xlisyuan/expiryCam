<script setup lang="ts">
import { ref } from 'vue'
import DateConfirmView from './DateConfirmView.vue'
import { takePhoto } from '../services/camera'
import { savePhotoTemporarily } from '../services/storage'

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
</script>

<template>
  <div class="container">
    <!-- 拍照按鈕 -->
    <button @click="onTakePhoto">拍照</button>

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
