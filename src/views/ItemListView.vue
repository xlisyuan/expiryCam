<script setup lang="ts">
import { ref } from 'vue'
import { takePhoto } from '../services/camera'
import { savePhotoTemporarily } from '../services/storage'
import DateConfirmView from './DateConfirmView.vue'

type Item = {
  id: string
  photoUri: string
  expiry: string // YYMMDD
}

const items = ref<Item[]>([])

// flow 狀態
const showDateConfirm = ref(false)
const tempPhotoUri = ref<string | null>(null)

/** 拍照（全域動作） */
async function onTakePhoto() {
  const photo = await takePhoto()
  if (!photo) return

  const fileName = `photo_${Date.now()}.jpg`
  const saved = await savePhotoTemporarily(photo, fileName)
  if (!saved) return

  tempPhotoUri.value = saved
  showDateConfirm.value = true
}

/** 預設日期（暫時用當日，之後接選單） */
function getDefaultDate() {
  const d = new Date()
  return {
    yy: String(d.getFullYear()).slice(2),
    mm: String(d.getMonth() + 1).padStart(2, '0'),
    dd: String(d.getDate()).padStart(2, '0')
  }
}

/** 放棄這張照片 */
function cancelConfirm() {
  tempPhotoUri.value = null
  showDateConfirm.value = false
}

/** 確認日期 → 存入清單 */
function doneConfirm(date: { yy: string; mm: string; dd: string }) {
  items.value.unshift({
    id: crypto.randomUUID(),
    photoUri: tempPhotoUri.value!,
    expiry: `${date.yy}${date.mm}${date.dd}`
  })

  tempPhotoUri.value = null
  showDateConfirm.value = false
}
</script>

<template>
  <div class="page">
    <!-- Header -->
    <header class="header">
      <button @click="onTakePhoto">📸 拍照</button>
    </header>

    <!-- 清單 -->
    <main class="list">
      <p v-if="items.length === 0" class="empty">
        尚未記錄任何物品
      </p>

      <div
        v-for="item in items"
        :key="item.id"
        class="item"
      >
        <img :src="item.photoUri" />
        <div class="expiry">
          效期：{{ item.expiry }}
        </div>
      </div>
    </main>

    <!-- 日期確認 Overlay -->
    <DateConfirmView
      v-if="showDateConfirm"
      :photo-uri="tempPhotoUri!"
      :default-date="getDefaultDate()"
      @cancel="cancelConfirm"
      @done="doneConfirm"
    />
  </div>
</template>

<style scoped>
.page {
  padding: 12px;
}

.header {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.item img {
  width: 100%;
  border-radius: 4px;
}

.expiry {
  text-align: center;
  font-size: 14px;
}

.empty {
  text-align: center;
  color: #888;
}
</style>
