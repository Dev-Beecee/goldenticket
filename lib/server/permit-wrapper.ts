// lib/server/permit-wrapper.ts

import { Permit } from "permitio"

interface PermitUser {
    id: string
    email: string
    firstName?: string
    lastName?: string
    role?: string
}

const permit = new Permit({
    pdp: "https://cloudpdp.api.permit.io",
    token: process.env.PERMIT_API_KEY!,
})

export async function checkPermission(
    userId: string,
    action: string,
    resource: string
): Promise<boolean> {
    return await permit.check(userId, action, resource)
}

export async function syncUserToPermit(user: PermitUser): Promise<void> {
    await permit.api.syncUser({
        key: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
    })

    if (user.role) {
        await permit.api.assignRole({
            user: user.id,
            role: user.role,
            tenant: "default",
        })
    }
}
