import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

// ============================================================
// STORAGE ABSTRACTION LAYER
// เปลี่ยนไป S3 ทีหลังแค่แก้ไฟล์นี้ที่เดียว
// ============================================================

export const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg':      '.jpg',
  'image/png':       '.png',
  'image/webp':      '.webp',
  'application/pdf': '.pdf',
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export interface UploadResult {
  fileName: string;   // original name
  filePath: string;   // path สำหรับเข้าถึงไฟล์
  fileType: string;   // mime type
  fileSize: number;   // bytes
}

// ============================================================
// LOCAL STORAGE (เปลี่ยน S3 → แทนที่ function นี้)
// ============================================================

const LOCAL_BASE_DIR = './uploads';
const LOCAL_BASE_URL = '/uploads'; // serve static จาก hono

export const storageService = {
  upload: async (
    file: File,
    folder: string = 'equipment'
  ): Promise<UploadResult> => {
    // validate type
    if (!ALLOWED_TYPES[file.type]) {
      throw new Error(`ประเภทไฟล์ไม่รองรับ อนุญาตเฉพาะ: jpg, png, webp, pdf`);
    }

    // validate size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`ไฟล์ขนาดเกิน ${MAX_FILE_SIZE / 1024 / 1024} MB`);
    }

    // สร้าง directory ตาม year/month
    const now = new Date();
    const year  = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dir   = join(LOCAL_BASE_DIR, folder, `${year}`, `${month}`);

    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // สร้าง unique filename
    const ext      = ALLOWED_TYPES[file.type];
    const uniqueName = `${randomUUID()}${ext}`;
    const fullPath   = join(dir, uniqueName);

    // เขียนไฟล์
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(fullPath, buffer);

    // path สำหรับ client เข้าถึง
    const filePath = `${LOCAL_BASE_URL}/${folder}/${year}/${month}/${uniqueName}`;

    return {
      fileName: file.name,
      filePath,
      fileType: file.type,
      fileSize: file.size,
    };
  },

  delete: async (filePath: string): Promise<void> => {
    // local: ลบไฟล์
    // S3: ลบ object
    const { unlink } = await import('fs/promises');
    const localPath = filePath.replace(LOCAL_BASE_URL, LOCAL_BASE_DIR);
    try {
      await unlink(localPath);
    } catch {
      // ไม่มีไฟล์ก็ไม่เป็นไร
    }
  },
};

// ============================================================
// เมื่อย้ายไป S3 — แทนที่ storageService.upload ด้วย:
// ============================================================
//
// import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
// const s3 = new S3Client({ region: env.AWS_REGION })
//
// upload: async (file, folder = 'equipment') => {
//   const ext = ALLOWED_TYPES[file.type]
//   const key = `${folder}/${year}/${month}/${randomUUID()}${ext}`
//   await s3.send(new PutObjectCommand({
//     Bucket: env.S3_BUCKET,
//     Key: key,
//     Body: Buffer.from(await file.arrayBuffer()),
//     ContentType: file.type,
//   }))
//   return {
//     fileName: file.name,
//     filePath: `https://${env.S3_BUCKET}.s3.amazonaws.com/${key}`,
//     fileType: file.type,
//     fileSize: file.size,
//   }
// }