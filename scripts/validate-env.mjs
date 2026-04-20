const mode = process.argv[2] ?? 'ci'

const requiredByMode = {
  ci: [
    'DATABASE_URL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
  ],
  preview: [
    'DATABASE_URL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'BLOB_READ_WRITE_TOKEN',
    'VERCEL_TOKEN',
    'VERCEL_ORG_ID',
    'VERCEL_PROJECT_ID',
  ],
  production: [
    'DATABASE_URL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'BLOB_READ_WRITE_TOKEN',
    'VERCEL_TOKEN',
    'VERCEL_ORG_ID',
    'VERCEL_PROJECT_ID',
  ],
}

if (!requiredByMode[mode]) {
  console.error(
    `Unknown validation mode "${mode}". Use one of: ${Object.keys(requiredByMode).join(', ')}.`
  )
  process.exit(1)
}

const missing = requiredByMode[mode].filter((name) => !process.env[name]?.trim())

if (missing.length > 0) {
  console.error(`Missing required environment variables for ${mode}:`)
  for (const name of missing) {
    console.error(`- ${name}`)
  }
  process.exit(1)
}

console.log(`Environment validation passed for ${mode}.`)
