<script setup lang="ts">
const emit = defineEmits<{
  (e: "delete-expired"): void;
  (e: "multi-select"): void;
  (e: "change-default-date"): void;
  (e: "about"): void;
  (e: "close"): void;
}>();

/** 獲取當天日期 yyyy-mm-dd 格式 */
function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const todayDate = getTodayDate();
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="popup">
      <div class="date-display">{{ todayDate }}</div>
      <button @click="emit('delete-expired')">刪除所有過期</button>
      <button @click="emit('multi-select')">多選刪除</button>
      <button @click="emit('change-default-date')">更改預設日期</button>
      <button @click="emit('about')">簡單說明</button>
      <button class="close" @click="emit('close')">關閉</button>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
}
.popup {
  background: white;
  padding: 16px;
  border-radius: 8px;
  width: 80%;
}
.date-display {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  padding: 12px 0;
  margin-bottom: 12px;
  border-bottom: 2px solid #e0e0e0;
}
button {
  display: block;
  width: 100%;
  margin-bottom: 8px;
}
.close {
  color: gray;
}
</style>
