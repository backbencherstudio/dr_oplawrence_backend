import axios from 'axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import appConfig from '../../../config/app.config';

@Injectable()
export class BibleOpenAiService {
  private getOpenAiApiKey() {
    const openAiApiKey = appConfig().openai.api_key;

    if (!openAiApiKey) {
      throw new InternalServerErrorException(
        'OpenAI API key is not configured',
      );
    }

    return openAiApiKey;
  }

  async generateVerseAudio(reference: string, verseText: string) {
    const openAiApiKey = this.getOpenAiApiKey();

    const audioResponse = await axios.post(
      'https://api.openai.com/v1/audio/speech',
      {
        model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
        voice: process.env.OPENAI_TTS_VOICE || 'alloy',
        input: `${reference}. ${verseText}`,
        format: 'mp3',
      },
      {
        headers: {
          Authorization: `Bearer ${openAiApiKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
        timeout: 20000,
      },
    );

    const audioBase64 = Buffer.from(audioResponse.data).toString('base64');

    if (!audioBase64) {
      throw new InternalServerErrorException('Failed to generate verse audio');
    }

    return {
      mimeType: 'audio/mpeg',
      audioBase64,
    };
  }

  async explainVerse(reference: string, verseText: string) {
    const openAiApiKey = this.getOpenAiApiKey();

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful Bible study assistant. Return only one polished paragraph as explanation. Do not use markdown, headings, bullet points, or labels like Context, Simple Explanation, or Practical Takeaway.',
          },
          {
            role: 'user',
            content: `Explain this Bible verse in one clear and elegant paragraph with meaning, theological sense, and practical relevance.\n\nReference: ${reference}\nVerse: ${verseText}`,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${openAiApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      },
    );

    const rawExplanation =
      response.data?.choices?.[0]?.message?.content?.trim();
    const explanation = rawExplanation
      ?.replace(/^\s*#{1,6}\s.*$/gm, '')
      ?.replace(/\b(Context|Simple Explanation|Practical Takeaway)\s*:/gi, '')
      ?.replace(/\n{2,}/g, ' ')
      ?.replace(/\s{2,}/g, ' ')
      ?.trim();

    if (!explanation) {
      throw new InternalServerErrorException(
        'Failed to generate verse explanation',
      );
    }

    return explanation;
  }

  async generateMeditationAndPrayer(reference: string, verseText: string) {
    const openAiApiKey = this.getOpenAiApiKey();

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a Christian devotional assistant. Return strict JSON only with two string fields: meditation and prayer.',
          },
          {
            role: 'user',
            content: `Based on this verse, generate one short meditation paragraph and one short prayer paragraph.\n\nReference: ${reference}\nVerse: ${verseText}`,
          },
        ],
        temperature: 0.7,
        response_format: {
          type: 'json_object',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${openAiApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      },
    );

    const rawContent = response.data?.choices?.[0]?.message?.content?.trim();

    if (!rawContent) {
      throw new InternalServerErrorException(
        'Failed to generate meditation and prayer',
      );
    }

    let parsed: { meditation?: string; prayer?: string };
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      throw new InternalServerErrorException(
        'Failed to parse meditation and prayer response',
      );
    }

    const meditation = parsed.meditation?.trim();
    const prayer = parsed.prayer?.trim();

    if (!meditation || !prayer) {
      throw new InternalServerErrorException(
        'Failed to generate meditation and prayer',
      );
    }

    return {
      meditation,
      prayer,
    };
  }
}
