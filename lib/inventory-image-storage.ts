import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const BLOB_API_BASE_URL = 'https://blob.vercel-storage.com'

interface UploadInventoryImageInput {
  file: File
  extension: string
}

interface BlobUploadResponse {
  url?: string
}

function getBlobReadWriteToken() {
  return process.env.BLOB_READ_WRITE_TOKEN
}

async function uploadToLocalDisk({ file, extension }: UploadInventoryImageInput) {
  const fileName = `${Date.now()}-${randomUUID()}.${extension}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'inventory')
  const filePath = path.join(uploadDir, fileName)
  const fileBuffer = Buffer.from(await file.arrayBuffer())

  await mkdir(uploadDir, { recursive: true })
  await writeFile(filePath, fileBuffer)

  return `/uploads/inventory/${fileName}`
}

async function uploadToVercelBlob({ file, extension }: UploadInventoryImageInput) {
  const token = getBlobReadWriteToken()

  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set.')
  }

  const pathname = `inventory/${Date.now()}-${randomUUID()}.${extension}`
  const uploadUrl = new URL(`${BLOB_API_BASE_URL}/${pathname}`)
  uploadUrl.searchParams.set('access', 'public')
  uploadUrl.searchParams.set('addRandomSuffix', 'false')

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'content-type': file.type,
      'x-content-type': file.type,
    },
    body: file,
  })

  if (!response.ok) {
    throw new Error('Failed to upload image to object storage.')
  }

  const result = (await response.json()) as BlobUploadResponse

  if (!result.url) {
    throw new Error('Object storage did not return a public image URL.')
  }

  return result.url
}

export async function uploadInventoryImage(input: UploadInventoryImageInput) {
  if (getBlobReadWriteToken()) {
    return uploadToVercelBlob(input)
  }

  if (process.env.NODE_ENV !== 'production') {
    return uploadToLocalDisk(input)
  }

  throw new Error(
    'BLOB_READ_WRITE_TOKEN is not set. Production uploads require object storage.'
  )
}
