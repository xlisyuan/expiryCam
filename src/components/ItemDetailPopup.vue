<script setup lang="ts">
import { ref } from "vue";
import DateConfirmView from "../views/DateConfirmView.vue";

interface Item {
  id: number;
  photoUri: string;
  date: { yy: string; mm: string; dd: string };
}

interface Props {
  item: Item;
}
const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "delete", id: number): void;
  (
    e: "update-date",
    data: { id: number; date: { yy: string; mm: string; dd: string } }
  ): void;
}>();

const showDateEdit = ref(false);

/** 格式化日期顯示 */
function formatDate(date: { yy: string; mm: string; dd: string }) {
  return `20${date.yy}/${date.mm}/${date.dd}`;
}

/** 開始編輯日期 */
function startEditDate() {
  showDateEdit.value = true;
}

/** 取消編輯日期 */
function cancelEditDate() {
  showDateEdit.value = false;
}

/** 完成編輯日期 */
function doneEditDate(data: {
  date: { yy: string; mm: string; dd: string };
  compressedPhoto: string;
}) {
  // 發送更新事件，只更新日期
  emit("update-date", {
    id: props.item.id,
    date: data.date,
  });
  showDateEdit.value = false;
}

/** 刪除物品 */
function deleteItem() {
  const confirmed = window.confirm(
    `確定要刪除這個物品嗎？\n到期日: ${formatDate(props.item.date)}`
  );

  if (confirmed) {
    emit("delete", props.item.id);
  }
}
</script>

<template>
  <!-- 日期編輯模式 -->
  <DateConfirmView
    v-if="showDateEdit"
    :photo-uri="item.photoUri"
    :default-date="item.date"
    @done="doneEditDate"
    @cancel="cancelEditDate"
  />

  <!-- 詳情顯示模式 -->
  <div v-else class="overlay" @click.self="emit('close')">
    <div class="detail-container">
      <img :src="item.photoUri" class="preview" />

      <div class="info-section">
        <div class="date-display">
          <span class="label">到期日:</span>
          <span class="date-text">{{ formatDate(item.date) }}</span>
        </div>

        <div class="actions">
          <button class="edit-btn" @click="startEditDate">編輯日期</button>
          <button class="delete-btn" @click="deleteItem">刪除物品</button>
        </div>

        <button class="close-btn" @click="emit('close')">關閉</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.detail-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 500px;
}

.preview {
  max-width: 90%;
  max-height: 60vh;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.info-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.date-display {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  font-size: 18px;
}

.label {
  color: #666;
  margin-right: 8px;
}

.date-text {
  font-weight: bold;
  color: #333;
  font-size: 20px;
}

.actions {
  display: flex;
  gap: 12px;
}

.edit-btn,
.delete-btn,
.close-btn {
  flex: 1;
  padding: 14px;
  font-size: 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.edit-btn {
  background: #4caf50;
  color: white;
}

.edit-btn:active {
  background: #45a049;
}

.delete-btn {
  background: #f44336;
  color: white;
}

.delete-btn:active {
  background: #da190b;
}

.close-btn {
  background: #e0e0e0;
  color: #333;
}

.close-btn:active {
  background: #d0d0d0;
}
</style>
