<script setup lang="ts">
const emit = defineEmits<{
  (e: "delete-expired"): void;
  (e: "multi-select"): void;
  (e: "change-default-date"): void;
  (e: "about"): void;
  (e: "close"): void;
}>();
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="popup">
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
button {
  display: block;
  width: 100%;
  margin-bottom: 8px;
}
.close {
  color: gray;
}
</style>
