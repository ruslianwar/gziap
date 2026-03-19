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
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

        // Menggunakan Service Role Key agar bisa bypass RLS untuk mencari lisensi berdasarkan hash
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // Hash function to safely check license
        const hashKey = async (key: string) => {
            const msgUint8 = new TextEncoder().encode(key)
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
            const hashArray = Array.from(new Uint8Array(hashBuffer))
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        }

        const { license_key, device_fingerprint, device_name } = await req.json()
        if (!license_key || !device_fingerprint) {
            throw new Error('Lengkapi license_key dan device_fingerprint')
        }

        const hashedKey = await hashKey(license_key)

        // Lookup license menggunakan Admin Client
        const { data: license, error: licenseError } = await supabaseAdmin
            .from('licenses')
            .select('*')
            .eq('license_key_hash', hashedKey)
            .single()

        if (licenseError || !license) {
            console.error('License lookup error:', licenseError)
            throw new Error('License key tidak ditemukan atau tidak valid')
        }

        if (!license.is_active) throw new Error('Lisensi tidak aktif')
        if (license.is_revoked) throw new Error('Lisensi telah dicabut')

        const now = new Date()
        if (new Date(license.expires_at) < now) {
            throw new Error('Lisensi telah kadaluarsa pada ' + new Date(license.expires_at).toLocaleDateString())
        }

        // Check existing activations
        const { data: activations, error: activationsError } = await supabaseAdmin
            .from('license_activations')
            .select('*')
            .eq('license_id', license.id)

        if (activationsError) throw activationsError

        const existingDevice = activations?.find(a => a.device_fingerprint === device_fingerprint)

        if (existingDevice) {
            // Already activated on this device, just return success
            return new Response(
                JSON.stringify({
                    success: true,
                    license_prefix: license.license_prefix,
                    expires_at: license.expires_at,
                    message: 'Lisensi sudah diaktifkan di perangkat ini'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if ((activations?.length || 0) >= license.max_devices) {
            throw new Error(`Lisensi ini sudah mencapai batas maksimal perangkat (${license.max_devices})`)
        }

        // Identifikasi User ID jika request membawa token
        const userHeader = req.headers.get('Authorization')
        let userId = null

        if (userHeader) {
            const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
            const supabaseClientAuth = createClient(supabaseUrl, supabaseAnonKey)
            const { data: { user } } = await supabaseClientAuth.auth.getUser(userHeader.replace('Bearer ', ''))
            if (user) userId = user.id
        }

        // Insert new activation menggunakan Admin Client
        const { error: insertError } = await supabaseAdmin
            .from('license_activations')
            .insert({
                license_id: license.id,
                device_fingerprint,
                device_name: device_name || 'Unknown Device',
                user_id: userId
            })

        if (insertError) throw insertError

        return new Response(
            JSON.stringify({
                success: true,
                license_prefix: license.license_prefix,
                expires_at: license.expires_at
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Activation error:', error.message)
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
