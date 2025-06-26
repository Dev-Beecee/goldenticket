import { NextResponse } from "next/server";
const { syncUserToPermit } = require("../../../lib/server/permit-wrapper");

export async function POST(req: Request) {
    const body = await req.json();

    try {
        await syncUserToPermit(body);
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Failed to sync user to Permit.io" },
            { status: 500 }
        );
    }
}