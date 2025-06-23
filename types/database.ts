export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    role: string
                    first_name: string | null
                    last_name: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    role?: string
                    first_name?: string | null
                    last_name?: string | null
                    created_at?: string
                }
                Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>
            }

        }
        Views: {}
        Functions: {}
        Enums: {}
    }
}
