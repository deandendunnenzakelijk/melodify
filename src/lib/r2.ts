interface SignedUploadResponse {
  uploadUrl: string;
  publicUrl?: string;
  objectKey?: string;
  key?: string;
}

export interface R2UploadOptions {
  folder?: string;
  metadata?: Record<string, string>;
  objectKey?: string;
}

function ensureSigningUrl(): string {
  const signingEndpoint = import.meta.env.VITE_R2_SIGNING_URL;
  if (!signingEndpoint) {
    throw new Error('Cloudflare R2 signing endpoint is not configured (missing VITE_R2_SIGNING_URL).');
  }
  return signingEndpoint;
}

export async function requestR2UploadUrl(
  fileName: string,
  contentType: string,
  options: R2UploadOptions = {},
): Promise<SignedUploadResponse> {
  const signingEndpoint = ensureSigningUrl();
  const payload: Record<string, unknown> = {
    fileName,
    contentType,
  };

  if (options.folder) {
    payload.folder = options.folder;
  }

  if (options.metadata) {
    payload.metadata = options.metadata;
  }

  if (options.objectKey) {
    payload.objectKey = options.objectKey;
  }

  const response = await fetch(signingEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(import.meta.env.VITE_R2_SIGNING_API_KEY
        ? { 'x-api-key': import.meta.env.VITE_R2_SIGNING_API_KEY as string }
        : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Kon upload-URL voor Cloudflare R2 niet ophalen (status ${response.status}).`);
  }

  return response.json();
}

function sanitiseFilename(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

function normaliseFolder(folder?: string): string {
  if (!folder) return '';
  let trimmed = folder.split('\\').join('/');
  while (trimmed.startsWith('/')) {
    trimmed = trimmed.slice(1);
  }
  while (trimmed.endsWith('/')) {
    trimmed = trimmed.slice(0, -1);
  }
  return trimmed;
}

export async function uploadFileToR2(
  file: File,
  options: R2UploadOptions = {},
): Promise<{ publicUrl: string; objectKey: string }> {
  const contentType = file.type || 'application/octet-stream';
  const safeName = sanitiseFilename(file.name || 'upload');
  const folder = normaliseFolder(options.folder);
  const baseKey = options.objectKey || `${folder ? `${folder}/` : ''}${Date.now()}-${safeName}`;

  const signedUpload = await requestR2UploadUrl(safeName, contentType, {
    ...options,
    objectKey: baseKey,
  });

  console.log("Signed upload response:", signedUpload);
  console.log("uploadUrl:", signedUpload.uploadUrl);


  const uploadUrl = signedUpload.uploadUrl;
  const objectKey = signedUpload.objectKey || signedUpload.key || baseKey;

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Upload naar Cloudflare R2 mislukt (status ${response.status}).`);
  }

  let publicUrl = signedUpload.publicUrl;
  if (!publicUrl) {
    const publicBase: string | undefined = import.meta.env.VITE_R2_PUBLIC_BASE_URL;
    if (publicBase) {
      publicUrl = `${publicBase.replace(/\/$/, '')}/${objectKey}`;
    }
  }

  if (!publicUrl) {
    throw new Error('De upload is gelukt maar er is geen openbare URL voor het bestand teruggestuurd.');
  }

  return { publicUrl, objectKey };
}
