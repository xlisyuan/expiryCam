<script setup lang="ts">
import { ref } from "vue";
import MenuPopup from "../components/MenuPopup.vue";
import DateConfirmView from "./DateConfirmView.vue";
import { takePhoto } from "../services/camera";
import { Preferences } from "@capacitor/preferences";
import { onMounted, watch } from "vue";
// import { savePhotoTemporarily } from '../services/storage'

type ViewMode = "daily" | "weekly" | "monthly" | "none";
const viewMode = ref<ViewMode>("daily");

const multiSelectMode = ref(false);
const selectedIds = ref<Set<number>>(new Set());
const showMenu = ref(false);

const now = new Date();
const defaultDate = {
  yy: String(now.getFullYear()).slice(2), // 取後兩位
  mm: String(now.getMonth() + 1).padStart(2, "0"),
  dd: String(now.getDate()).padStart(2, "0"),
};

// -------------------------
// 清單資料
// -------------------------
interface Item {
  id: number;
  photoUri: string;
  date: { yy: string; mm: string; dd: string };
}

const items = ref<Item[]>([]);
let nextId = 1;

// -------------------------
// 暫存拍照照片
// -------------------------
const tempPhotoUri = ref<string | null>(null);
const showDateConfirm = ref(false);

// -------------------------
// 拍照流程
// -------------------------
async function onTakePhoto() {
  const photoUri = await takePhoto();
  if (!photoUri) return;

  // 這邊可以暫存或存 DB
  tempPhotoUri.value = photoUri;
  showDateConfirm.value = true; // 拍完直接跳日期 overlay
}

// -------------------------
// DateConfirmView 事件
// -------------------------
function onDateDone(data: {
  date: { yy: string; mm: string; dd: string };
  compressedPhoto: string;
}) {
  if (!tempPhotoUri.value) return;

  // 新增到清單，使用壓縮後的圖片
  items.value.unshift({
    id: nextId++,
    photoUri: data.compressedPhoto, // 使用壓縮後的圖片
    date: data.date,
  });

  // 重置暫存
  tempPhotoUri.value = null;
  showDateConfirm.value = false;
}

function onDateCancel() {
  // 取消日期 → 暫存照片不存入清單
  tempPhotoUri.value = null;
  showDateConfirm.value = false;
}

import { computed } from "vue";

function parseDate(item: Item) {
  return new Date(
    Number("20" + item.date.yy),
    Number(item.date.mm) - 1,
    Number(item.date.dd)
  );
}

// 已排序清單
const sortedItems = computed(() => {
  return [...items.value].sort(
    (a, b) => parseDate(a).getTime() - parseDate(b).getTime()
  );
});

// 分組資料，依 viewMode
const groupedItems = computed(() => {
  const groups: Record<string, Item[]> = {};

  sortedItems.value.forEach((item) => {
    const d = parseDate(item);
    let key = "";
    if (viewMode.value === "daily") {
      key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    } else if (viewMode.value === "weekly") {
      const { startOfWeek, endOfWeek } = getWeekRange(d);
      key = `${formatDate(startOfWeek)} ~ ${formatDate(endOfWeek)}`;
    } else if (viewMode.value === "monthly") {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    } else if (viewMode.value === "none") {
      key = ``;
    }

    let group = groups[key];
    if (!group) {
      group = [];
      groups[key] = group;
    }
    group.push(item);
  });

  return groups;
});

// 週範圍
function getWeekRange(date: Date) {
  const d = new Date(date);
  const day = d.getDay() || 7; // Sunday = 7
  const startOfWeek = new Date(d);
  startOfWeek.setDate(d.getDate() - day + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  return { startOfWeek, endOfWeek };
}

function formatDate(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}`;
}

function formatExpiry(
  date: { yy: string; mm: string; dd: string },
  mode: ViewMode
) {
  const fullYear = Number("20" + date.yy);
  if (mode === "daily" || mode === "none") {
    // 如果跨年就顯示 YYMMDD，否則 MMDD
    const nowYear = new Date().getFullYear();
    return fullYear === nowYear
      ? `${date.mm}${date.dd}`
      : `${date.yy}${date.mm}${date.dd}`;
  } else if (mode === "weekly" || mode === "monthly") {
    return date.dd;
  }
  return "";
}

function isSelected(item: Item) {
  return selectedIds.value.has(item.id);
}

function toggleSelect(item: Item) {
  if (selectedIds.value.has(item.id)) {
    selectedIds.value.delete(item.id);
  } else {
    selectedIds.value.add(item.id);
  }
}

function deleteSelected() {
  items.value = items.value.filter((item) => !selectedIds.value.has(item.id));
  selectedIds.value.clear();
  multiSelectMode.value = false;
}

function cancelMultiSelect() {
  selectedIds.value.clear();
  multiSelectMode.value = false;
}

function deleteExpired() {
  selectedIds.value.clear();
  const now = new Date();
  items.value.forEach((item) => {
    const d = parseDate(item);
    if (d.getTime() < now.getTime()) selectedIds.value.add(item.id);
  });
  multiSelectMode.value = true;
}

function showAbout(alertText: string) {
  window.alert(alertText);
}

// -------------------------
// 轉存過往圖片為壓縮格式
// -------------------------
async function convertOldPhotos() {
  if (items.value.length === 0) {
    window.alert("沒有需要轉換的照片");
    return;
  }

  const confirmed = window.confirm(
    `即將轉換 ${items.value.length} 張照片為壓縮格式。\n這個過程可能需要一些時間，請耐心等待。\n\n是否繼續？`
  );
  
  if (!confirmed) return;

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < items.value.length; i++) {
    const item = items.value[i];
    
    // TypeScript 安全檢查
    if (!item) {
      errorCount++;
      continue;
    }
    
    try {
      // 跳過已經是 base64 格式的圖片（表示已經壓縮過）
      if (item.photoUri.startsWith("data:image")) {
        successCount++;
        continue;
      }

      // 壓縮圖片
      const compressedUri = await compressPhotoUri(item.photoUri);
      
      if (compressedUri && items.value[i]) {
        // 更新為壓縮後的圖片
        items.value[i]!.photoUri = compressedUri;
        successCount++;
      } else {
        errorCount++;
      }
    } catch (error) {
      console.error(`轉換照片 ${item.id} 失敗:`, error);
      errorCount++;
    }
  }

  // 手動觸發儲存
  await persistItems();

  window.alert(
    `轉換完成！\n成功: ${successCount} 張\n失敗: ${errorCount} 張`
  );
}

// 壓縮單張圖片
function compressPhotoUri(photoUri: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          resolve(null);
          return;
        }

        // 設定最大寬高
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        
        let width = img.naturalWidth;
        let height = img.naturalHeight;

        // 等比例縮放（保持原始比例）
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 繪製並壓縮
        ctx.drawImage(img, 0, 0, width, height);
        
        // 轉換成 base64，quality 0.7 表示 70% 品質
        const compressed = canvas.toDataURL("image/jpeg", 0.7);
        resolve(compressed);
      } catch (error) {
        console.error("壓縮失敗:", error);
        resolve(null);
      }
    };

    img.onerror = () => {
      console.error("載入圖片失敗:", photoUri);
      resolve(null);
    };

    // 設定 crossOrigin 以避免 CORS 問題
    img.crossOrigin = "anonymous";
    img.src = photoUri;
  });
}

async function persistItems() {
  await Preferences.set({
    key: "items",
    value: JSON.stringify(items.value),
  });
}

onMounted(async () => {
  const { value } = await Preferences.get({ key: "items" });
  if (value) {
    items.value = JSON.parse(value);
    nextId = Math.max(0, ...items.value.map((i) => i.id)) + 1;
  }
});

watch(items, persistItems, { deep: true });
</script>

<template>
  <div class="sticky-header">
    <div class="menu-button">
      <button @click="showMenu = true">☰</button>
    </div>

    <div class="view-mode">
      <button @click="viewMode = 'none'">無</button>
      <button @click="viewMode = 'daily'">每日</button>
      <button @click="viewMode = 'weekly'">每週</button>
      <button @click="viewMode = 'monthly'">每月</button>
    </div>

    <div v-if="multiSelectMode" class="multi-actions">
      <button @click="deleteSelected">刪除</button>
      <button @click="cancelMultiSelect">返回</button>
    </div>
  </div>

  <div class="container">
    <div v-for="(group, key) in groupedItems" :key="key" class="group">
      <div class="group-header">{{ key }}</div>
      <ul class="items-container">
        <li
          style="flex-direction: column"
          v-for="item in group"
          :key="item.id"
          @click="multiSelectMode ? toggleSelect(item) : null"
          :class="{ selected: isSelected(item) }"
        >
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

  <Teleport to="body">
    <button
      v-if="!showDateConfirm && !showMenu"
      class="camera-button"
      @click="onTakePhoto"
    >
      拍照
    </button>
  </Teleport>

  <MenuPopup
    v-if="showMenu"
    @close="showMenu = false"
    @delete-expired="
      deleteExpired();
      showMenu = false;
    "
    @multi-select="
      multiSelectMode = true;
      showMenu = false;
    "
    @change-default-date="
      showAbout('尚未實作');
      showMenu = false;
    "
    @convert-old-photos="
      showMenu = false;
      convertOldPhotos();
    "
    @about="
      showAbout('這是一個用來快速記錄物品到期日的小工具');
      showMenu = false;
    "
  />
</template>

<style scoped>
.camera-button {
  position: fixed;
  right: 10px;
  top: 75%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 9999;
}
.sticky-header {
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 1000;
}
.menu-button {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding-top: 20px;
}
.multi-actions {
  padding-top: 10px;
}
.container {
  padding: 16px 0;
}
ul {
  list-style: none;
  padding: 0;
}
.items-container {
  display: flex;
  flex-wrap: wrap;
  /* justify-content: space-between; */
  width: 100%;
}
li {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.selected {
  border: 2px solid rgb(206, 100, 14);
  border-radius: 6px;
}
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
  margin: 0 3px;
  /* margin-right: 12px; */
  border: 1px solid #ccc;
}

.item-info {
  display: flex;
  flex-direction: column;
}

.expiry {
  font-size: 14px;
  /* color: #333; */
}
</style>
