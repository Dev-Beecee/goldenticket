// app/api/create-user/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // attention : service role
)

export async function POST(req: Request) {
    const { email, password, role } = await req.json()

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { role },
        email_confirm: true,
    })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ user: data.user })
}
