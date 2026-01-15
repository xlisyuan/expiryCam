import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

export async function takePhoto(): Promise<string | null> {
  try {
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri, // 回傳檔案 URI
      source: CameraSource.Camera
    })

    // URI 是本地檔案路徑，例如 file://...
    return photo.webPath || photo.path || null
  } catch (err) {
    console.error('Camera error:', err)
    return null
  }
}
