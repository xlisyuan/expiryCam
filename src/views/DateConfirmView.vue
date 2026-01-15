<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  photoUri: string
  defaultDate: { yy: string; mm: string; dd: string }
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'done', value: { yy: string; mm: string; dd: string }): void
}>()

const yy = ref(props.defaultDate.yy)
const mm = ref(props.defaultDate.mm)
const dd = ref(props.defaultDate.dd)

const activeField = ref<'yy' | 'mm' | 'dd' | null>(null)
let buffer = ''

function startInput(field: 'yy' | 'mm' | 'dd') {
  activeField.value = field
  buffer = ''
}

function inputDigit(d: string) {
  buffer += d

  const apply = (val: string, len = 2) =>
    val.length >= len ? val.slice(0, len) : val.padStart(len, '0')

  // =========================
  // Fast mode（沒點任何欄位）
  // =========================
  if (activeField.value === null) {
    if (buffer.length <= 2) {
      // DD
      dd.value = buffer.padStart(2, '0')
    } else if (buffer.length <= 4) {
      // MM DD
      const mmRaw = buffer.slice(0, buffer.length - 2)
      const ddRaw = buffer.slice(-2)

      mm.value = mmRaw.padStart(2, '0')
      dd.value = ddRaw // 不補零
    } else {
      // YY MM DD（最多 6 碼）
      yy.value = buffer.slice(0, 2)
      mm.value = buffer.slice(2, 4)
      dd.value = buffer.slice(4, 6)
    }
    return
  }

  // =========================
  // 精準模式：YY
  // =========================
  if (activeField.value === 'yy') {
    yy.value = apply(buffer)
    mm.value = '01'
    dd.value = '01'

    if (buffer.length >= 4) {
      mm.value = apply(buffer.slice(2, 4))
    }
    if (buffer.length >= 6) {
      dd.value = apply(buffer.slice(4, 6))
    }
    return
  }

  // =========================
  // 精準模式：MM
  // =========================
  if (activeField.value === 'mm') {
    mm.value = apply(buffer)
    dd.value = '01'

    if (buffer.length >= 4) {
      dd.value = apply(buffer.slice(2, 4))
    }
    return
  }

  // =========================
  // 精準模式：DD
  // =========================
  if (activeField.value === 'dd') {
    dd.value = apply(buffer)
    return
  }
}

function done() {
  emit('done', { yy: yy.value, mm: mm.value, dd: dd.value })
}
</script>

<template>
  <div class="confirm">
    <button class="close" @click="emit('cancel')">✕</button>

    <img :src="photoUri" class="preview" />

    <div class="date">
      <span @click="startInput('yy')">{{ yy }}</span> |
      <span @click="startInput('mm')">{{ mm }}</span> |
      <span @click="startInput('dd')">{{ dd }}</span>
    </div>

    <div class="keypad">
      <button v-for="n in 9" :key="n" @click="inputDigit(String(n))">
        {{ n }}
      </button>
      <button @click="inputDigit('0')">0</button>
    </div>

    <button class="done" @click="done">Done</button>
  </div>
</template>

<style scoped>
.confirm {
  padding: 16px;
}
.preview {
  width: 100%;
  margin-bottom: 12px;
}
.date {
  font-size: 24px;
  text-align: center;
  margin-bottom: 12px;
}
.date span {
  padding: 0 8px;
  cursor: pointer;
}
.keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.done {
  margin-top: 16px;
  width: 100%;
}
.close {
  position: absolute;
  right: 12px;
  top: 12px;
}
</style>

