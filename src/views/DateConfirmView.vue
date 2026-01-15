<script setup lang="ts">
import { ref } from 'vue'

/** props */
interface Props {
  photoUri: string
  defaultDate: { yy: string; mm: string; dd: string }
}
const props = defineProps<Props>()

/** emits */
const emit = defineEmits<{
  (e: 'done', date: { yy: string; mm: string; dd: string }): void
  (e: 'cancel'): void
}>()

/** 日期狀態 */
const yy = ref(props.defaultDate.yy)
const mm = ref(props.defaultDate.mm)
const dd = ref(props.defaultDate.dd)

/** 輸入狀態 */
const buffer = ref('')
const activeField = ref<'yy' | 'mm' | 'dd' | null>(null)

/** 點欄位開始輸入 */
function startInput(field: 'yy' | 'mm' | 'dd') {
  activeField.value = field
  buffer.value = ''
}

/** reset buffer */
function resetBuffer() {
  buffer.value = ''
}

/** 處理輸入數字 */
function inputDigit(d: string) {
  buffer.value += d

  const apply = (val: string, len = 2) =>
    val.length >= len ? val.slice(0, len) : val.padStart(len, '0')

  if (activeField.value === null) {
    if (buffer.value.length <= 2) {
      dd.value = buffer.value.padStart(2, '0')
    } else if (buffer.value.length <= 4) {
      const mmRaw = buffer.value.slice(0, buffer.value.length - 2)
      const ddRaw = buffer.value.slice(-2)
      mm.value = mmRaw.padStart(2, '0')
      dd.value = ddRaw
    } else {
      yy.value = buffer.value.slice(0, 2)
      mm.value = buffer.value.slice(2, 4)
      dd.value = buffer.value.slice(4, 6)
    }
    return
  }

  if (activeField.value === 'yy') {
    yy.value = apply(buffer.value)
    mm.value = '01'
    dd.value = '01'
    if (buffer.value.length >= 4) mm.value = apply(buffer.value.slice(2, 4))
    if (buffer.value.length >= 6) dd.value = apply(buffer.value.slice(4, 6))
    return
  }

  if (activeField.value === 'mm') {
    mm.value = apply(buffer.value)
    dd.value = '01'
    if (buffer.value.length >= 4) dd.value = apply(buffer.value.slice(2, 4))
    return
  }

  if (activeField.value === 'dd') {
    dd.value = apply(buffer.value)
    return
  }
}

/** Done */
function pressDone() {
  emit('done', { yy: yy.value, mm: mm.value, dd: dd.value })
  resetBuffer()
  activeField.value = null
}

/** Cancel / X */
function pressCancel() {
  emit('cancel')
  resetBuffer()
  activeField.value = null
}
</script>

<template>
  <div class="overlay">
    <img :src="photoUri" class="preview" />

    <div class="date-input">
      <span @click="startInput('yy')">{{ yy }}</span> |
      <span @click="startInput('mm')">{{ mm }}</span> |
      <span @click="startInput('dd')">{{ dd }}</span>
    </div>

    <div class="numpad">
      <button v-for="n in 9" :key="n" @click="inputDigit(n.toString())">{{ n }}</button>
      <button @click="inputDigit('0')">0</button>
    </div>

    <div class="actions">
      <button @click="pressCancel">X</button>
      <button @click="pressDone">Done</button>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(255,255,255,0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
}
.preview {
  max-width: 80%;
  margin-bottom: 12px;
}
.date-input {
  font-size: 24px;
  margin-bottom: 12px;
}
.date-input span {
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  background: #eee;
  margin: 0 2px;
}
.numpad {
  display: grid;
  grid-template-columns: repeat(3, 50px);
  gap: 8px;
  margin-bottom: 12px;
}
.numpad button {
  font-size: 20px;
  padding: 8px 0;
}
.actions {
  display: flex;
  gap: 16px;
}
</style>
