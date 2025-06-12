import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { inviteId } = await req.json()
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get invite details
    const { data: invite, error: inviteError } = await supabaseClient
      .from('group_invites')
      .select('*, groups(name)')
      .eq('id', inviteId)
      .single()

    if (inviteError) throw inviteError

    // Generate new invite link
    const inviteLink = `${Deno.env.get('NEXT_PUBLIC_APP_URL')}/invite/${inviteId}`

    // Update invite link
    const { error: updateError } = await supabaseClient
      .from('group_invites')
      .update({ invite_link: inviteLink })
      .eq('id', inviteId)

    if (updateError) throw updateError

    // Send email
    const { error: emailError } = await supabaseClient.functions.invoke('send-email', {
      body: {
        to: invite.email,
        subject: `${invite.groups.name}への招待`,
        template: 'invite',
        data: {
          groupName: invite.groups.name,
          inviteLink,
          role: invite.role === 'owner' ? '管理者' : 'メンバー'
        }
      }
    })

    if (emailError) throw emailError

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 