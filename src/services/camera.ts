import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

export async function takePhoto() {
  try {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Uri, // 拿 URI
      source: CameraSource.Camera,
      saveToGallery: false,
    });

    // ⚡ webPath 是可直接給 <img> 的網址
    return photo.webPath || null;
  } catch (e) {
    console.error(e);
    return null;
  }
}
