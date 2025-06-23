export const dynamic = "force-dynamic"
export const revalidate = 0

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/database"
import { checkPermission } from "@/lib/server/permit-wrapper"

import DashboardLayout from "@/components/layouts/DashboardLayout"
import CreateUserForm from "@/components/CreateUserForm"

export default async function CreateUserPage() {
    const cookieStore = cookies()
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect("/unauthorized")
    }

    const hasPermission = await checkPermission(user.id, "create", "utilisateur")

    if (!hasPermission) {
        redirect("/unauthorized")
    }

    return (
        <DashboardLayout>
            <div className="flex min-h-screen ">

                <main className="flex-1 ml-64 p-6 max-w-2xl">
                    <h1 className="text-2xl font-bold mb-4 text-black">Créer un nouvel utilisateur</h1>
                    <CreateUserForm />
                </main>
            </div>
        </DashboardLayout >
    )
}
