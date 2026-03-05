import contentMeta from '../../content-meta.json'

export default async function handler(req: Request) {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (token !== process.env.ADMIN_TOKEN) {
    return new Response('Unauthorized', { status: 401 })
  }

  return new Response(JSON.stringify(contentMeta), {
    headers: { 'Content-Type': 'application/json' }
  })
}
