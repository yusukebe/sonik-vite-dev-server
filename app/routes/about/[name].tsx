import type { Context } from 'hono'

export default function About(c: Context) {
  const name = c.req.param('name')
  return <h2>It's {name}!</h2>
}
