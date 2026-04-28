import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const client = await clerkClient()
  const { email } = await req.json()

  const user = await client.users.createUser({
    emailAddress: [email],
    publicMetadata: {
        role: 'user',
    }
  })

  console.log('Created user:', user)
  return NextResponse.json({ message: 'User created', user })
}