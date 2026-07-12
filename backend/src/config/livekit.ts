import { RoomServiceClient, AccessToken } from 'livekit-server-sdk';

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const livekitUrl = process.env.LIVEKIT_URL;

export const getLiveKitClient = (): RoomServiceClient => {
  if (!livekitUrl || !apiKey || !apiSecret) {
    throw new Error('LiveKit credentials are not fully configured in environment variables.');
  }
  return new RoomServiceClient(livekitUrl, apiKey, apiSecret);
};

export const generateParticipantToken = async (
  roomName: string,
  participantIdentity: string,
  participantName: string,
  metadata?: string
): Promise<string> => {
  if (!apiKey || !apiSecret) {
    throw new Error('LiveKit API Key or Secret is missing in server environment.');
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: participantName,
    metadata: metadata,
    ttl: '2h', // Token is valid for 2 hours
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return await token.toJwt();
};
