import { NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/auth'
import { uploadInventoryImage } from '@/lib/inventory-image-storage'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export async function POST(request: Request) {
  try {
    await assertAdmin()

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No image file provided.' }, { status: 400 })
    }

    if (!MIME_TO_EXTENSION[file.type]) {
      return NextResponse.json(
        { error: 'Only JPG, PNG, WEBP, and GIF files are allowed.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Image must be 5MB or smaller.' },
        { status: 400 }
      )
    }

    const extension = MIME_TO_EXTENSION[file.type]
    const url = await uploadInventoryImage({ file, extension })

    return NextResponse.json({ url })
  } catch (error) {
    console.error(error)

    const message = error instanceof Error ? error.message : 'Upload failed.'
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500

    return NextResponse.json({ error: message }, { status })
  }
}
