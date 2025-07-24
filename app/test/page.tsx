'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import DashboardLayout from '@/components/layouts/DashboardLayout'
import RepartitionLotJourSecoursCrud from '@/components/RepartitionLotJourSecoursCrud'


export default function TestPage() {
    


    return (
        <DashboardLayout>
            <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6 text-black">Page de Test</h1>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <RepartitionLotJourSecoursCrud />
                    
                </div>
            </div>
        </DashboardLayout>
    )
}
