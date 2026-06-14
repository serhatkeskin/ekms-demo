import axios from 'services/axiosInstance';
import { MentionContext, MentionResult } from 'types';

const API_PREFIX = '/notifications/mentions';

const mentionApi = {
  notifyMentions: async (usernames: string[], context: MentionContext = {}): Promise<MentionResult> => {
    if (!Array.isArray(usernames) || usernames.length === 0) {
      return { success: true, message: 'No usernames to notify' };
    }

    const payload = {
      mentioned_usernames: usernames,
      source_type: context.sourceType || 'page',
      source_id: context.sourceId || null,
      block_id: context.blockId || null,
      page_slug: context.pageSlug || null,
      page_id: context.pageId || null,
      page_title: context.pageTitle || null,
      comment_id: context.commentId || null,
      parent_comment_id: context.parentCommentId || null,
      mentioner_username: context.mentionerUsername || null,
    };

    try {
      const response = await axios.post(`${API_PREFIX}/process/`, payload);
      return {
        success: true,
        mentions: usernames,
        message: `Notifications sent to ${usernames.length} users`,
        data: response.data,
      };
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string } }; message?: string };
      console.error('Mention notification failed:', error);
      return {
        success: false,
        error: err?.response?.data?.detail || err.message || 'Unknown error',
      };
    }
  }
};

export default mentionApi;
