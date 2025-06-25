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
            },
            reglage_site: {
                Row: {
                    id: string
                    image_partage_url: string | null
                    meta_description: string | null
                    meta_title: string | null
                    background_type: "solid" | "linear-gradient" | null
                    background_colors: string[] | null
                    reglement: string | null
                    header_image_url: string | null
                    consigne_image_url: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    image_partage_url?: string | null
                    meta_description?: string | null
                    meta_title?: string | null
                    background_type?: "solid" | "linear-gradient" | null
                    background_colors?: string[] | null
                    reglement?: string | null
                    header_image_url?: string | null
                    consigne_image_url?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: Partial<Database["public"]["Tables"]["reglage_site"]["Insert"]>
            }
        }
        Views: {}
        Functions: {}
        Enums: {}
    }
}
