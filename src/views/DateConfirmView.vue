<script setup lang="ts">
import { ref } from "vue";

/** props */
interface Props {
  photoUri: string;
  defaultDate: { yy: string; mm: string; dd: string };
}
const props = defineProps<Props>();

/** emits */
const emit = defineEmits<{
  (
    e: "done",
    data: {
      date: { yy: string; mm: string; dd: string };
      compressedPhoto: string;
    }
  ): void;
  (e: "cancel"): void;
}>();

/** 壓縮後的圖片 */
const compressedPhotoUri = ref<string>("");
const imgElement = ref<HTMLImageElement | null>(null);

/** 日期狀態 */
const yy = ref(props.defaultDate.yy);
const mm = ref(props.defaultDate.mm);
const dd = ref(props.defaultDate.dd);

/** 輸入狀態 */
const buffer = ref("");
const activeField = ref<"yy" | "mm" | "dd" | null>(null);

/** 點欄位開始輸入 */
function startInput(field: "yy" | "mm" | "dd") {
  activeField.value = field;
  buffer.value = "";
}

/** reset buffer */
function resetBuffer() {
  buffer.value = "";
}

/** 處理輸入數字 */
function inputDigit(d: string) {
  buffer.value += d;

  const apply = (val: string, len = 2) =>
    val.length >= len ? val.slice(0, len) : val.padStart(len, "0");

  if (activeField.value === null) {
    if (buffer.value.length <= 2) {
      dd.value = buffer.value.padStart(2, "0");
    } else if (buffer.value.length <= 4) {
      const mmRaw = buffer.value.slice(0, buffer.value.length - 2);
      const ddRaw = buffer.value.slice(-2);
      mm.value = mmRaw.padStart(2, "0");
      dd.value = ddRaw;
    } else {
      yy.value = buffer.value.slice(0, 2);
      mm.value = buffer.value.slice(2, 4);
      dd.value = buffer.value.slice(4, 6);
    }
    return;
  }

  if (activeField.value === "yy") {
    yy.value = apply(buffer.value);
    mm.value = "01";
    dd.value = "01";
    if (buffer.value.length >= 4) mm.value = apply(buffer.value.slice(2, 4));
    if (buffer.value.length >= 6) dd.value = apply(buffer.value.slice(4, 6));
    return;
  }

  if (activeField.value === "mm") {
    mm.value = apply(buffer.value);
    dd.value = "01";
    if (buffer.value.length >= 4) dd.value = apply(buffer.value.slice(2, 4));
    return;
  }

  if (activeField.value === "dd") {
    dd.value = apply(buffer.value);
    return;
  }
}

/** 壓縮圖片 */
function compressImage() {
  if (!imgElement.value) return;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const img = imgElement.value;
  
  // 設定最大寬高（可調整這個值來控制壓縮程度）
  const MAX_WIDTH = 800;
  const MAX_HEIGHT = 800;
  
  let width = img.naturalWidth;
  let height = img.naturalHeight;

  // 等比例縮放
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
  
  // 轉換成 base64，quality 0.7 表示 70% 品質（可調整 0.1~1.0）
  compressedPhotoUri.value = canvas.toDataURL("image/jpeg", 0.7);
}

/** Done */
function pressDone() {
  // 在確認時才執行壓縮
  compressImage();
  
  emit("done", {
    date: { yy: yy.value, mm: mm.value, dd: dd.value },
    compressedPhoto: compressedPhotoUri.value,
  });
  resetBuffer();
  activeField.value = null;
}

/** Cancel / X */
function pressCancel() {
  emit("cancel");
  resetBuffer();
  activeField.value = null;
}
</script>

<template>
  <div class="overlay">
    <img ref="imgElement" :src="photoUri" class="preview" crossorigin="anonymous" />

    <div class="input-area">
      <div class="date-input">
        <span @click="startInput('yy')">{{ yy }}</span> |
        <span @click="startInput('mm')">{{ mm }}</span> |
        <span @click="startInput('dd')">{{ dd }}</span>
      </div>

      <div class="numpad">
        <button v-for="n in 9" :key="n" @click="inputDigit(n.toString())">
          {{ n }}
        </button>
        <button @click="inputDigit('0')">0</button>
      </div>

      <div class="actions">
        <button @click="pressCancel">X</button>
        <button @click="pressDone">Done</button>
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
  padding: 16px;
}
.preview {
  max-width: 80%;
  max-height: 50%;
  margin-bottom: 12px;
}
.input-area {
  bottom: 10%;
  position: absolute;
}
.date-input {
  font-size: 24px;
  color: black;
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
