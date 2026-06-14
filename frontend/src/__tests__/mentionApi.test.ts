/**
 * Tests for mentionApi.ts
 *
 * Tests the API service for sending mention notifications
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import mentionApi from '../services/mentionApi';
import axios from '../services/axiosInstance';

// Mock axios
vi.mock('../services/axiosInstance', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('mentionApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('notifyMentions', () => {
    it('should send POST request to correct endpoint', async () => {
      const mockResponse = { data: { message: 'Notifications sent' } };
      (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const usernames = ['developer', 'admin'];
      const context = {
        sourceType: 'block',
        pageSlug: 'test-page',
        pageId: 1,
        pageTitle: 'Test Page',
        blockId: 'block-123',
        mentionerUsername: 'currentUser',
      };

      await mentionApi.notifyMentions(usernames, context);

      expect(axios.post).toHaveBeenCalledWith(
        '/notifications/mentions/process/',
        {
          mentioned_usernames: usernames,
          source_type: 'block',
          source_id: null,
          block_id: 'block-123',
          page_slug: 'test-page',
          page_id: 1,
          page_title: 'Test Page',
          comment_id: null,
          parent_comment_id: null,
          mentioner_username: 'currentUser',
        }
      );
    });

    it('should return success response on successful API call', async () => {
      const mockResponse = { data: { message: 'Notifications sent to 2 users' } };
      (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await mentionApi.notifyMentions(['user1', 'user2'], {});

      expect(result.success).toBe(true);
      expect(result.mentions).toEqual(['user1', 'user2']);
      expect(result.message).toBe('Notifications sent to 2 users');
    });

    it('should return early for empty usernames array', async () => {
      const result = await mentionApi.notifyMentions([], {});

      expect(axios.post).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.message).toBe('No usernames to notify');
    });

    it('should handle API errors', async () => {
      const error = {
        response: {
          data: {
            detail: 'User not found',
          },
        },
      };
      (axios.post as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const result = await mentionApi.notifyMentions(['nonexistent'], {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
    });

    it('should handle network errors', async () => {
      const error = { message: 'Network Error' };
      (axios.post as ReturnType<typeof vi.fn>).mockRejectedValue(error);

      const result = await mentionApi.notifyMentions(['user1'], {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network Error');
    });

    it('should use default values for missing context fields', async () => {
      const mockResponse = { data: {} };
      (axios.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      await mentionApi.notifyMentions(['user1'], {});

      expect(axios.post).toHaveBeenCalledWith(
        '/notifications/mentions/process/',
        expect.objectContaining({
          source_type: 'page', // Default value
          source_id: null,
          block_id: null,
          page_slug: null,
          page_id: null,
          page_title: null,
          comment_id: null,
          parent_comment_id: null,
          mentioner_username: null,
        })
      );
    });
  });
});
