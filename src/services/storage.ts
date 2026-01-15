import { Filesystem, Directory } from "@capacitor/filesystem";

export async function savePhotoTemporarily(fileUri: string, fileName: string) {
  try {
    const response = await fetch(fileUri);
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Data,
    });
    return savedFile.uri;
  } catch (err) {
    console.error("Save photo error:", err);
    return null;
  }
}

// helper
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        return reject(new Error("讀取結果格式錯誤"));
      }
      const parts = result.split(",");
      const base64 = parts[1];
      if (base64 !== undefined) {
        resolve(base64);
      } else {
        reject(new Error("無法解析 Base64 內容"));
      }
    };
    reader.readAsDataURL(blob);
  });
}
