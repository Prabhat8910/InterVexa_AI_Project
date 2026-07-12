import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  throw new Error('FATAL: GROQ_API_KEY environment variable is not defined.');
}

export const groq = new Groq({
  apiKey: apiKey,
});
