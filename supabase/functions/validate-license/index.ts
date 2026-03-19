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

        // Menggunakan Admin Client agar dapat memvalidasi lisensi tanpa hambatan RLS
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // Hash function to safely check license
        const hashKey = async (key: string) => {
            const msgUint8 = new TextEncoder().encode(key)
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
            const hashArray = Array.from(new Uint8Array(hashBuffer))
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        }

        const { license_key, device_fingerprint } = await req.json()
        if (!license_key || !device_fingerprint) {
            throw new Error('Lengkapi license_key dan device_fingerprint')
        }

        const hashedKey = await hashKey(license_key)

        // Lookup license menggunakan Admin Client
        const { data: license, error: licenseError } = await supabaseAdmin
            .from('licenses')
            .select('id, expires_at, is_active, is_revoked')
            .eq('license_key_hash', hashedKey)
            .single()

        if (licenseError || !license) {
            return new Response(JSON.stringify({ valid: false, reason: 'License key tidak ditemukan atau tidak valid' }), { headers: corsHeaders })
        }

        if (!license.is_active) {
            return new Response(JSON.stringify({ valid: false, reason: 'Lisensi dibekukan sementara' }), { headers: corsHeaders })
        }
        if (license.is_revoked) {
            return new Response(JSON.stringify({ valid: false, reason: 'Lisensi telah dicabut' }), { headers: corsHeaders })
        }

        const expiresAt = new Date(license.expires_at)
        const now = new Date()

        if (expiresAt < now) {
            return new Response(JSON.stringify({ valid: false, reason: 'Lisensi telah kadaluarsa' }), { headers: corsHeaders })
        }

        // Check device binding menggunakan Admin Client
        const { data: activation, error: activationError } = await supabaseAdmin
            .from('license_activations')
            .select('id')
            .eq('license_id', license.id)
            .eq('device_fingerprint', device_fingerprint)
            .single()

        if (activationError || !activation) {
            return new Response(JSON.stringify({ valid: false, reason: 'Perangkat ini belum diaktifkan atau lisensi digunakan di perangkat lain' }), { headers: corsHeaders })
        }

        const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 3600 * 24))

        return new Response(
            JSON.stringify({ valid: true, expires_at: license.expires_at, days_remaining: daysRemaining }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Validation error:', error.message)
        return new Response(
            JSON.stringify({ valid: false, error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
