import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

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
    const AGORA_APP_ID = Deno.env.get('AGORA_APP_ID');
    const AGORA_APP_CERTIFICATE = Deno.env.get('AGORA_APP_CERTIFICATE');

    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
      throw new Error('Agora credentials not configured');
    }

    const { channelName, uid = 0, role = 'publisher' } = await req.json();

    if (!channelName) {
      throw new Error('Channel name is required');
    }

    // Token expires in 1 hour
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Role mapping
    const rtcRole = role === 'audience' ? Role.SUBSCRIBER : Role.PUBLISHER;

    // Generate the token
    const token = buildToken(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      uid,
      rtcRole,
      privilegeExpiredTs
    );

    console.log(`Token generated for channel: ${channelName}, uid: ${uid}`);

    return new Response(
      JSON.stringify({ 
        token, 
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
