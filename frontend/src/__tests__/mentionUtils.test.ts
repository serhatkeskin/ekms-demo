/**
 * Tests for mentionUtils.ts
 *
 * Tests the core mention extraction and notification utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractMentions, notifyMentionedUsers, formatTextWithMentions } from '../utilities/mentionUtils';
import mentionApi from '../services/mentionApi';

// Mock the mentionApi
vi.mock('../services/mentionApi', () => ({
  default: {
    notifyMentions: vi.fn(),
  },
}));

describe('extractMentions', () => {
  it('should extract single mention from text', () => {
    const text = 'Hello @developer how are you?';
    const mentions = extractMentions(text);
    expect(mentions).toEqual(['developer']);
  });

  it('should extract multiple mentions from text', () => {
    const text = 'Hey @alice and @bob please review this';
    const mentions = extractMentions(text);
    expect(mentions).toContain('alice');
    expect(mentions).toContain('bob');
    expect(mentions).toHaveLength(2);
  });

  it('should extract mention at the start of text', () => {
    const text = '@admin please check this';
    const mentions = extractMentions(text);
    expect(mentions).toEqual(['admin']);
  });

  it('should extract mention at the end of text', () => {
    const text = 'This is for @user';
    const mentions = extractMentions(text);
    expect(mentions).toEqual(['user']);
  });

  it('should handle mentions with underscores', () => {
    const text = 'Hey @john_doe check this';
    const mentions = extractMentions(text);
    expect(mentions).toEqual(['john_doe']);
  });

  it('should handle mentions with numbers', () => {
    const text = 'Message for @user123';
    const mentions = extractMentions(text);
    expect(mentions).toEqual(['user123']);
  });

  it('should return unique mentions only', () => {
    const text = '@developer please help @developer';
    const mentions = extractMentions(text);
    expect(mentions).toEqual(['developer']);
  });

  it('should handle mentions followed by punctuation', () => {
    const text = 'Hello @user, how are you @admin?';
    const mentions = extractMentions(text);
    expect(mentions).toContain('user');
    expect(mentions).toContain('admin');
  });

  it('should return empty array for text without mentions', () => {
    const text = 'Hello world, this is a test';
    const mentions = extractMentions(text);
    expect(mentions).toEqual([]);
  });

  it('should return empty array for null or undefined input', () => {
    expect(extractMentions(null)).toEqual([]);
    expect(extractMentions(undefined)).toEqual([]);
    expect(extractMentions('')).toEqual([]);
  });

  it('should not extract @ in the middle of a word', () => {
    const text = 'email@example.com is not a mention';
    const mentions = extractMentions(text);
    expect(mentions).toEqual([]);
  });

  it('should handle newlines before mentions', () => {
    const text = 'Line 1\n@user Line 2';
    const mentions = extractMentions(text);
    expect(mentions).toEqual(['user']);
  });
});

describe('notifyMentionedUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call mentionApi with extracted usernames', async () => {
    const mockResponse = { success: true, message: 'Notifications sent' };
    (mentionApi.notifyMentions as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const text = 'Hello @developer please review';
    const context = {
      sourceType: 'block',
      pageSlug: 'test-page',
      pageId: 1,
      pageTitle: 'Test Page',
    };

    const result = await notifyMentionedUsers(text, context);

    expect(mentionApi.notifyMentions).toHaveBeenCalledWith(['developer'], context);
    expect(result.success).toBe(true);
  });

  it('should return early if no mentions found', async () => {
    const text = 'Hello world, no mentions here';
    const result = await notifyMentionedUsers(text, {});

    expect(mentionApi.notifyMentions).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.message).toBe('No mentions to notify');
  });

  it('should handle multiple mentions', async () => {
    const mockResponse = { success: true, message: 'Notifications sent to 2 users' };
    (mentionApi.notifyMentions as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const text = 'Hey @alice and @bob check this';
    const result = await notifyMentionedUsers(text, {});

    expect(mentionApi.notifyMentions).toHaveBeenCalledWith(
      expect.arrayContaining(['alice', 'bob']),
      expect.any(Object)
    );
    expect(result.success).toBe(true);
  });

  it('should handle API errors gracefully', async () => {
    const error = new Error('Network error');
    (mentionApi.notifyMentions as ReturnType<typeof vi.fn>).mockRejectedValue(error);

    const text = 'Hello @developer';
    const result = await notifyMentionedUsers(text, {});

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });
});

describe('formatTextWithMentions', () => {
  it('should format text with single mention', () => {
    const text = 'Hello @developer how are you?';
    const parts = formatTextWithMentions(text);

    expect(parts).toHaveLength(3);
    expect(parts[0]).toEqual({ type: 'text', content: 'Hello' });
    expect(parts[1]).toEqual({ type: 'mention', username: 'developer' });
    expect(parts[2]).toEqual({ type: 'text', content: ' how are you?' });
  });

  it('should handle mention at start of text', () => {
    const text = '@admin please help';
    const parts = formatTextWithMentions(text);

    expect(parts[0]).toEqual({ type: 'mention', username: 'admin' });
    expect(parts[1]).toEqual({ type: 'text', content: ' please help' });
  });

  it('should return empty array for null input', () => {
    expect(formatTextWithMentions(null)).toEqual([]);
    expect(formatTextWithMentions(undefined)).toEqual([]);
    expect(formatTextWithMentions('')).toEqual([]);
  });

  it('should handle text without mentions', () => {
    const text = 'Hello world';
    const parts = formatTextWithMentions(text);

    expect(parts).toHaveLength(1);
    expect(parts[0]).toEqual({ type: 'text', content: 'Hello world' });
  });
});
