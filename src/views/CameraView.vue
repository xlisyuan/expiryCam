<script setup lang="ts">
import { ref } from 'vue'
import { takePhoto } from '../services/camera'
import { savePhotoTemporarily } from '../services/storage'

const photoPath = ref<string | null>(null)
const savedPath = ref<string | null>(null)

async function capture() {
  const result = await takePhoto()
  if (result) {
    photoPath.value = result
    const fileName = `photo_${Date.now()}.jpg`
    const saved = await savePhotoTemporarily(result, fileName)
    savedPath.value = saved
  }
}
</script>

<template>
  <div>
    <button @click="capture">拍照</button>

    <div v-if="photoPath">
      <p>預覽：</p>
      <img :src="photoPath" style="max-width: 300px; margin-top: 10px;" />
      <p v-if="savedPath">暫存路徑: {{ savedPath }}</p>
    </div>
  </div>
</template>
