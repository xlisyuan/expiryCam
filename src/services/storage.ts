import { Filesystem, Directory } from "@capacitor/filesystem";

export async function savePhotoPermanently(
  webPath: string,
  fileName: string
): Promise<string | null> {
  const response = await fetch(webPath);
  const blob = await response.blob();

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const data = base64.split(",")[1];

  await Filesystem.writeFile({
    path: `photos/${fileName}`,
    data: data ?? "",
    directory: Directory.Data,
  });

  return `data:image/jpeg;base64,${data}`;
}
