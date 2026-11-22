const MAX_SIDE = 1600;
const SMALL_ENOUGH = 600 * 1024;

/**
 * A phone photo is 3 to 12 MB and a listing takes several, so resize before uploading.
 * Anything already small, animated, or unreadable here (some HEIC) goes up as it is.
 */
export async function shrinkImage(file: File): Promise<File> {
  if (file.size <= SMALL_ENOUGH || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.fillStyle = "#fff"; // JPEG has no transparency
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** One at a time: decoding several phone photos at once can exhaust a phone's memory. */
export async function shrinkImages(files: File[]): Promise<File[]> {
  const out: File[] = [];
  for (const file of files) out.push(await shrinkImage(file));
  return out;
}
