import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) throw new Error('Diperlukan otorisasi')

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

        // Client via User JWT (hanya untuk GetUser/Auth session validation)
        const supabaseClientAuth = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        })

        // Client Admin via Service Role (Bebas dari limitasi RLS table untuk kelancaran eksekusi data API backend)
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Dapatkan Sesi Pengguna
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseClientAuth.auth.getUser(token)
        if (authError || !user) throw new Error('Sesi tidak valid: ' + (authError?.message || 'Tanpa sesi'))

        // 2. Hubungkan dengan tabel Profil Pengguna agar mendapatkan peran (Role) yang valid
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError || profile?.role !== 'superadmin') {
            throw new Error('Akses ditolak: Hanya superadmin yang dapat mengelola lisensi')
        }

        const { action, payload } = await req.json()
        if (!action || !payload) throw new Error('Payload tidak lengkap')

        // Helper functions
        const hashKey = async (key: string) => {
            const msgUint8 = new TextEncoder().encode(key)
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
            const hashArray = Array.from(new Uint8Array(hashBuffer))
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        }

        const generateRandomString = (length: number) => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
            let result = ''
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length))
            }
            return result
        }

        // ACTION: GENERATE
        if (action === 'generate') {
            const { duration_months = 6, prefix_label = 'SGIZI' } = payload

            const segment1 = generateRandomString(4)
            const segment2 = generateRandomString(4)
            const segment3 = generateRandomString(4)
            const segment4 = generateRandomString(4)

            const newKey = `${prefix_label}-${segment1}-${segment2}-${segment3}-${segment4}`
            const hashedKey = await hashKey(newKey)

            // Hitung expired saat ini + durasi bulan
            const expiresAt = new Date()
            expiresAt.setMonth(expiresAt.getMonth() + duration_months)

            const { data, error } = await supabaseAdmin
                .from('licenses')
                .insert({
                    license_key_hash: hashedKey,
                    license_prefix: `${prefix_label}-${segment1}-xxxx-xxxx-xxxx`,
                    duration_months,
                    max_devices: 1,
                    expires_at: expiresAt.toISOString(),
                    created_by: user.id
                })
                .select()
                .single()

            if (error) throw error

            return new Response(
                JSON.stringify({ success: true, license_key: newKey, license: data }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // ACTION: REVOKE / FREEZE
        if (action === 'revoke' || action === 'freeze') {
            const { license_id, status } = payload // status: boolean
            const field = action === 'revoke' ? 'is_revoked' : 'is_active'
            const value = action === 'revoke' ? status : !status // freeze means is_active = false

            const { error } = await supabaseAdmin
                .from('licenses')
                .update({ [field]: value })
                .eq('id', license_id)

            if (error) throw error

            return new Response(
                JSON.stringify({ success: true, message: `Status berhasil diubah` }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // ACTION: RESET DEVICE
        if (action === 'reset_device') {
            const { activation_id } = payload

            const { error } = await supabaseAdmin
                .from('license_activations')
                .delete()
                .eq('id', activation_id)

            if (error) throw error

            return new Response(
                JSON.stringify({ success: true, message: 'Perangkat berhasil dihapus (reset)' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        throw new Error('Action tidak dikenali')

    } catch (error: any) {
        console.error('Edge Function Error:', error)
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
