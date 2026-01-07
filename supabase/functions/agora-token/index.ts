import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Agora Token Generation (RTC Token Builder)
const Role = {
  PUBLISHER: 1,
  SUBSCRIBER: 2,
};

const Privileges = {
  JOIN_CHANNEL: 1,
  PUBLISH_AUDIO_STREAM: 2,
  PUBLISH_VIDEO_STREAM: 3,
  PUBLISH_DATA_STREAM: 4,
};

function buildToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: number,
  role: number,
  privilegeExpiredTs: number
): string {
  const version = "007";
  const timestamp = Math.floor(Date.now() / 1000);
  const saltInt = Math.floor(Math.random() * 0xffffffff);
  const salt = saltInt.toString(16).padStart(8, '0');
  
  // Build message
  const message = {
    salt: saltInt,
    ts: timestamp,
    privileges: {} as Record<number, number>,
  };
  
  // Set privileges based on role
  if (role === Role.PUBLISHER) {
    message.privileges[Privileges.JOIN_CHANNEL] = privilegeExpiredTs;
    message.privileges[Privileges.PUBLISH_AUDIO_STREAM] = privilegeExpiredTs;
    message.privileges[Privileges.PUBLISH_VIDEO_STREAM] = privilegeExpiredTs;
    message.privileges[Privileges.PUBLISH_DATA_STREAM] = privilegeExpiredTs;
  } else {
    message.privileges[Privileges.JOIN_CHANNEL] = privilegeExpiredTs;
  }
  
  // Pack the message
  const messageBytes = packMessage(message);
  const messageBase64 = btoa(String.fromCharCode(...messageBytes));
  
  // Build signature content
  const uidStr = uid === 0 ? "" : uid.toString();
  const content = `${appId}${channelName}${uidStr}${messageBase64}`;
  
  // Create HMAC signature
  const hmac = createHmac('sha256', appCertificate);
  hmac.update(content);
  const signature = hmac.digest('base64');
  
  // Combine all parts
  const token = `${version}${appId}${signature}${salt}${timestamp.toString(16)}${uidStr.length.toString(16).padStart(4, '0')}${uidStr}${messageBase64}`;
  
  return token;
}

function packMessage(message: { salt: number; ts: number; privileges: Record<number, number> }): Uint8Array {
  const buffer: number[] = [];
  
  // Pack salt (4 bytes, little-endian)
  buffer.push(message.salt & 0xff);
  buffer.push((message.salt >> 8) & 0xff);
  buffer.push((message.salt >> 16) & 0xff);
  buffer.push((message.salt >> 24) & 0xff);
  
  // Pack timestamp (4 bytes, little-endian)
  buffer.push(message.ts & 0xff);
  buffer.push((message.ts >> 8) & 0xff);
  buffer.push((message.ts >> 16) & 0xff);
  buffer.push((message.ts >> 24) & 0xff);
  
  // Pack privileges count (2 bytes, little-endian)
  const privCount = Object.keys(message.privileges).length;
  buffer.push(privCount & 0xff);
  buffer.push((privCount >> 8) & 0xff);
  
  // Pack each privilege
  for (const [key, value] of Object.entries(message.privileges)) {
    const keyInt = parseInt(key);
    const valueInt = value;
    
    // Key (2 bytes)
    buffer.push(keyInt & 0xff);
    buffer.push((keyInt >> 8) & 0xff);
    
    // Value (4 bytes)
    buffer.push(valueInt & 0xff);
    buffer.push((valueInt >> 8) & 0xff);
    buffer.push((valueInt >> 16) & 0xff);
    buffer.push((valueInt >> 24) & 0xff);
  }
  
  return new Uint8Array(buffer);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role for verification
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error('Invalid token:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    if (!userId) {
      console.error('No user ID in claims');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const AGORA_APP_ID = Deno.env.get('AGORA_APP_ID');
    const AGORA_APP_CERTIFICATE = Deno.env.get('AGORA_APP_CERTIFICATE');

    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
      throw new Error('Agora credentials not configured');
    }

    const { channelName, uid = 0, role = 'publisher' } = await req.json();

    if (!channelName) {
      throw new Error('Channel name is required');
    }

    // Validate channelName format (basic alphanumeric and dash/underscore check)
    if (!/^[a-zA-Z0-9_-]+$/.test(channelName)) {
      return new Response(
        JSON.stringify({ error: 'Invalid channel name format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify that the user is a participant in the conversation with this video_room_id
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('video_room_id', channelName)
      .single();

    if (convError || !conversation) {
      console.error('Conversation not found for channel:', channelName, convError);
      return new Response(
        JSON.stringify({ error: 'Invalid channel' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is a participant in this conversation
    const { data: participant, error: partError } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversation.id)
      .eq('user_id', userId)
      .single();

    if (partError || !participant) {
      console.error('User not a participant in conversation:', userId, partError);
      return new Response(
        JSON.stringify({ error: 'Forbidden - not a participant' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Token expires in 1 hour
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Role mapping
    const rtcRole = role === 'audience' ? Role.SUBSCRIBER : Role.PUBLISHER;

    // Generate the token
    const agoraToken = buildToken(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      uid,
      rtcRole,
      privilegeExpiredTs
    );

    console.log(`Token generated for channel: ${channelName}, uid: ${uid}, user: ${userId}`);

    return new Response(
      JSON.stringify({ 
        token: agoraToken, 
        appId: AGORA_APP_ID,
        channel: channelName,
        uid
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: unknown) {
    console.error('Error generating token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
