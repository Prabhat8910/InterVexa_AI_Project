import axios from 'axios';
import FormData from 'form-data';

export const transcribeAudio = async (pcmBuffer: Buffer, sampleRate: number, numChannels: number): Promise<string> => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not defined in the environment.');
    }

    const wavBuffer = createWavBuffer(pcmBuffer, sampleRate, numChannels);
    const formData = new FormData();
    formData.append('file', wavBuffer, {
      filename: 'speech.wav',
      contentType: 'audio/wav',
    });
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'en');

    const response = await axios.post(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );
    
    return response.data.text || '';
  } catch (error: any) {
    console.error('[Agent STT] Transcription error:', error.response?.data || error.message);
    return '';
  }
};

function createWavBuffer(pcmData: Buffer, sampleRate: number, numChannels: number): Buffer {
  const header = Buffer.alloc(44);
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmData.length;
  const fileSize = 36 + dataSize;

  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}
