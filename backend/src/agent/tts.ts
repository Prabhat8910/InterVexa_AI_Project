import axios from 'axios';

export interface TTSResult {
  pcmData: Buffer;
  sampleRate: number;
  numChannels: number;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const synthesizeSpeech = async (text: string, retries = 3, delay = 1200): Promise<TTSResult> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not defined in the environment.');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Call OpenAI-compatible speech synthesis endpoint hosted by Groq
      const response = await axios.post(
        'https://api.groq.com/openai/v1/audio/speech',
        {
          model: 'canopylabs/orpheus-v1-english',
          voice: 'troy',
          input: text,
          response_format: 'wav'
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      const wavBuffer = Buffer.from(response.data);

      // Validate WAV format
      if (
        wavBuffer.toString('ascii', 0, 4) !== 'RIFF' ||
        wavBuffer.toString('ascii', 8, 12) !== 'WAVE'
      ) {
        throw new Error('Response is not a valid RIFF/WAVE buffer');
      }

      // Read details from WAV header
      const numChannels = wavBuffer.readUInt16LE(22);
      const sampleRate = wavBuffer.readUInt32LE(24);
      const pcmData = wavBuffer.subarray(44); // PCM payload starts at byte 44

      return {
        pcmData,
        sampleRate,
        numChannels
      };
    } catch (error: any) {
      const isRateLimit = error.response?.status === 429;
      let errMsg = error.message;
      if (error.response?.data) {
        try {
          const dataBuffer = Buffer.from(error.response.data);
          errMsg = dataBuffer.toString('utf8');
        } catch (e) {}
      }

      console.warn(`[Agent TTS] Attempt ${attempt} failed: ${errMsg}. IsRateLimit: ${isRateLimit}`);

      if (isRateLimit && attempt < retries) {
        console.log(`[Agent TTS] Rate limit hit. Retrying in ${delay}ms...`);
        await sleep(delay);
        delay *= 2; // exponential backoff
        continue;
      }

      if (attempt === retries) {
        console.error('[Agent TTS] All speech synthesis attempts failed:', errMsg);
        throw new Error(`Speech synthesis failed: ${errMsg}`);
      }
    }
  }
  throw new Error('Speech synthesis failed');
};
