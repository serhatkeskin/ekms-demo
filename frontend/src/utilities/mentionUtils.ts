import mentionApi from 'services/mentionApi';
import { MentionContext, MentionResult, TextPart } from 'types';

export const extractMentions = (text: string | null | undefined): string[] => {
  if (!text) return [];

  const mentionRegex = /(?:^|\s)@([a-zA-Z0-9_]+)(?=\s|$|[.,!?;:])/g;
  const mentions: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }

  return [...new Set(mentions)];
};

export const notifyMentionedUsers = async (
  text: string,
  context: MentionContext = {}
): Promise<MentionResult> => {
  try {
    const mentions = extractMentions(text);

    if (mentions.length === 0) {
      return { success: true, message: 'No mentions to notify' };
    }

    const result = await mentionApi.notifyMentions(mentions, context);
    return result;
  } catch (error) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
};

export const formatTextWithMentions = (text: string | null | undefined): TextPart[] => {
  if (!text) return [];

  const mentionRegex = /(?:^|\s)@([a-zA-Z0-9_]+)(?=\s|$|[.,!?;:])/g;
  const parts: TextPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mentionRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }

    if (match[0].startsWith(' ')) {
      parts.push({ type: 'text', content: ' ' });
    }

    parts.push({ type: 'mention', username: match[1] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }

  return parts;
};
