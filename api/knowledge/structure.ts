import fs from 'fs'
import path from 'path'

export default async function handler(req: Request) {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (token !== process.env.ADMIN_TOKEN) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const metaPath = path.join(process.cwd(), 'content-meta.json')
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    return new Response(JSON.stringify(meta), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to read structure' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
