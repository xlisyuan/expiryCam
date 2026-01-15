<script setup lang="ts">
import { ref } from "vue";
import { takePhoto } from "../services/camera";
import { savePhotoPermanently } from "../services/storage";
// import { savePhotoTemporarily } from "../services/storage";
import DateConfirmView from "./DateConfirmView.vue";

type Step = "camera" | "confirm";

const step = ref<Step>("camera");

const photoPath = ref<string | null>(null);
const savedPath = ref<string | null>(null);

/** 拍照流程 */
async function capture() {
  const result = await takePhoto();
  if (!result) return;

  photoPath.value = result;

  const fileName = `photo_${Date.now()}.jpg`;
  const saved = await savePhotoPermanently(result, fileName);

  if (!saved) return;
  savedPath.value = saved;

  // 👉 拍照 + 暫存完成，進日期確認畫面
  step.value = "confirm";
}

/** 預設日期（暫時用當日，之後接選單設定） */
function getDefaultDate() {
  const d = new Date();
  return {
    yy: String(d.getFullYear()).slice(2),
    mm: String(d.getMonth() + 1).padStart(2, "0"),
    dd: String(d.getDate()).padStart(2, "0"),
  };
}

/** 放棄該照片 */
function cancelConfirm() {
  photoPath.value = null;
  savedPath.value = null;
  step.value = "camera";
}

/** 日期確認完成 */
function doneConfirm(date: { yy: string; mm: string; dd: string }) {
  console.log("SAVE ITEM", {
    photoUri: savedPath.value,
    expiry: `${date.yy}${date.mm}${date.dd}`,
  });

  // 👉 之後這裡會存進 DB
  photoPath.value = null;
  savedPath.value = null;
  step.value = "camera";
}
</script>

<template>
  <!-- 拍照畫面 -->
  <div v-if="step === 'camera'" style="padding: 16px">
    <button @click="capture">拍照</button>

    <div v-if="photoPath" style="margin-top: 12px">
      <p>拍攝完成（尚未確認日期）</p>
      <img :src="photoPath" style="max-width: 100%" />
    </div>
  </div>

  <!-- 日期確認畫面 -->
  <DateConfirmView
    v-else
    :photo-uri="photoPath!"
    :default-date="getDefaultDate()"
    @cancel="cancelConfirm"
    @done="doneConfirm"
  />
</template>
