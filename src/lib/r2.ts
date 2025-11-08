export interface R2UploadOptions {
  folder?: string;
  metadata?: Record<string, string>;
}

function ensureWorkerUrl(): string {
  const endpoint = import.meta.env.VITE_R2_SIGNING_URL;
  if (!endpoint) throw new Error("Missing VITE_R2_SIGNING_URL.");
  return endpoint;
}

// 🔥 Upload directly via Worker
export async function uploadFileToR2(
    file: File,
    options: R2UploadOptions = {}
): Promise<{ publicUrl: string; objectKey: string }> {
  const apiKey = import.meta.env.VITE_R2_API_KEY;
  const endpoint = ensureWorkerUrl();
  const folder = options.folder || "";
  const fileName = file.name;
  const contentType = file.type || "application/octet-stream";

  // ⚡ Safe Base64 conversion for large files
  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]); // remove "data:*/*;base64,"
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // 🧩 Convert file to base64
  const base64 = await fileToBase64(file);





  const body = {
    fileName,
    contentType,
    folder,
    metadata: options.metadata,
    fileBase64: base64,
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed: ${res.status} ${err}`);
  }

  const json = await res.json();
  return { publicUrl: json.publicUrl, objectKey: json.key };
}
