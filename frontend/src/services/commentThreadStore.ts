/**
 * Custom ThreadStore implementation for BlockNote comments
 * Integrates with the EKMS backend API
 */
import { BlockNoteEditor } from '@blocknote/core';
import {
  ThreadStore,
  ThreadStoreAuth,
  DefaultThreadStoreAuth,
  ThreadData,
  CommentData,
  CommentBody,
} from '@blocknote/core/comments';
import axios from 'services/axiosInstance';

const API_PREFIX = '/pages';

// Thread API endpoints
const threadApi = {
  getThreads: async (pageSlug: string): Promise<any> => {
    const response = await axios.get(`${API_PREFIX}/threads/by-page/${pageSlug}/`);
    return response.data;
  },

  getThread: async (threadId: string): Promise<any> => {
    const response = await axios.get(`${API_PREFIX}/threads/${threadId}/`);
    return response.data;
  },

  createThread: async (pageSlug: string, data: any): Promise<any> => {
    const response = await axios.post(`${API_PREFIX}/threads/`, {
      page_slug: pageSlug,
      ...data,
    });
    return response.data;
  },

  addComment: async (threadId: string, data: any): Promise<any> => {
    const response = await axios.post(`${API_PREFIX}/threads/${threadId}/comments/`, data);
    return response.data;
  },

  updateComment: async (threadId: string, commentId: string, data: any): Promise<any> => {
    const response = await axios.patch(
      `${API_PREFIX}/threads/${threadId}/comments/${commentId}/`,
      data
    );
    return response.data;
  },

  deleteComment: async (threadId: string, commentId: string): Promise<void> => {
    await axios.delete(`${API_PREFIX}/threads/${threadId}/comments/${commentId}/`);
  },

  deleteThread: async (threadId: string): Promise<void> => {
    await axios.delete(`${API_PREFIX}/threads/${threadId}/`);
  },

  resolveThread: async (threadId: string): Promise<any> => {
    const response = await axios.post(`${API_PREFIX}/threads/${threadId}/resolve/`);
    return response.data;
  },

  unresolveThread: async (threadId: string): Promise<any> => {
    const response = await axios.post(`${API_PREFIX}/threads/${threadId}/unresolve/`);
    return response.data;
  },

  addReaction: async (threadId: string, commentId: string, emoji: string): Promise<any> => {
    const response = await axios.post(
      `${API_PREFIX}/threads/${threadId}/comments/${commentId}/reactions/`,
      { emoji }
    );
    return response.data;
  },

  deleteReaction: async (threadId: string, commentId: string, emoji: string): Promise<void> => {
    await axios.delete(
      `${API_PREFIX}/threads/${threadId}/comments/${commentId}/reactions/`,
      { data: { emoji } }
    );
  },
};

/**
 * Helper to safely extract user ID as string
 */
function safeUserId(id: any): string {
  if (id === null || id === undefined) return 'unknown';
  if (typeof id === 'string') return id;
  if (typeof id === 'number') return id.toString();
  if (typeof id === 'object') {
    // If it's an object, try to find an id property or username
    if (id.id) return safeUserId(id.id);
    if (id.username) return safeUserId(id.username);
    // Fallback if it's just a plain object
    console.warn('safeUserId received object without id/username:', id);
    return 'unknown';
  }
  return String(id);
}

/**
 * Convert backend thread data to BlockNote ThreadData format
 */
function convertToThreadData(backendThread: any): ThreadData {
  const comments = (backendThread.comments || [])
    .map(convertToCommentData)
    .filter((comment) => !comment.deletedAt && comment.body);

  return {
    type: 'thread',
    id: backendThread.id,
    createdAt: new Date(backendThread.created_at),
    updatedAt: new Date(backendThread.updated_at),
    resolved: backendThread.resolved || false,
    resolvedUpdatedAt: backendThread.resolved_at ? new Date(backendThread.resolved_at) : undefined,
    // resolvedBy: backendThread.resolved_by ? safeUserId(backendThread.resolved_by) : undefined, 
    resolvedBy: undefined, // Temporarily disabled to prevent crash
    metadata: backendThread.metadata || {},
    comments,
    deletedAt: backendThread.deleted_at ? new Date(backendThread.deleted_at) : undefined,
  };
}

/**
 * Convert backend comment data to BlockNote CommentData format
 */
function convertToCommentData(backendComment: any): CommentData {
  const commentId = backendComment.comment_id || backendComment.id;
  // Extract user ID safely - checking created_by object first, then user_id field
  let userId = 'unknown';
  if (backendComment.created_by) {
    userId = safeUserId(backendComment.created_by);
  } else if (backendComment.user_id) {
    userId = safeUserId(backendComment.user_id);
  }

  const baseData = {
    type: 'comment' as const,
    id: commentId,
    userId: userId,
    createdAt: new Date(backendComment.created_at),
    updatedAt: new Date(backendComment.updated_at || backendComment.created_at),
    reactions: (backendComment.reactions || []).map((r: any) => ({
      emoji: r.emoji,
      createdAt: new Date(r.created_at),
      userIds: r.user_ids?.map((id: any) => safeUserId(id)) || [],
    })),
    metadata: backendComment.metadata || {},
  };

  if (backendComment.deleted_at) {
    return {
      ...baseData,
      deletedAt: new Date(backendComment.deleted_at),
      body: undefined,
    };
  }

  return {
    ...baseData,
    body: backendComment.body || [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: backendComment.text || '' }],
      },
    ],
  };
}

/**
 * Convert BlockNote CommentBody to backend format
 */
function convertBodyToBackend(body: CommentBody): any {
  // BlockNote body is an array of blocks
  // For simple text, extract the text content
  if (Array.isArray(body) && body.length > 0) {
    const textContent = body
      .map((block: any) => {
        if (block.content && Array.isArray(block.content)) {
          return block.content
            .map((c: any) => (c.type === 'text' ? c.text : ''))
            .join('');
        }
        return '';
      })
      .join('\n');
    return { text: textContent, body };
  }
  return { text: '', body };
}

/**
 * Custom REST ThreadStore for EKMS backend
 */
export class EKMSThreadStore extends ThreadStore {
  // This store doesn't use Yjs, so addThreadToDocument is not needed
  addThreadToDocument = undefined;

  private pageSlug: string;
  private threads: Map<string, ThreadData> = new Map();
  private subscribers: Set<(threads: Map<string, ThreadData>) => void> = new Set();
  private initialized: boolean = false;
  private editor?: BlockNoteEditor<any, any, any>;

  constructor(auth: ThreadStoreAuth, pageSlug: string) {
    super(auth);
    this.pageSlug = pageSlug;
  }

  setEditor(editor: BlockNoteEditor<any, any, any> | null): void {
    this.editor = editor || undefined;
  }

  private async refreshThread(threadId: string): Promise<ThreadData | undefined> {
    try {
      const response = await threadApi.getThread(threadId);
      const threadData = convertToThreadData(response.content || response);
      this.threads.set(threadData.id, threadData);
      this.notifySubscribers();
      return threadData;
    } catch (error) {
      console.error(`Failed to refresh thread ${threadId}:`, error);
      return undefined;
    }
  }

  private getSelectionReference(): { text: string; from: number; to: number } | undefined {
    const pmState = (this.editor as any)?._tiptapEditor?.state;
    const selection = pmState?.selection;
    if (!pmState || !selection || selection.empty) {
      return undefined;
    }

    const referenceText = pmState.doc.textBetween(selection.from, selection.to).trim();
    if (referenceText.length === 0) {
      return undefined;
    }

    return {
      text: referenceText,
      from: selection.from,
      to: selection.to,
    };
  }

  /**
   * Initialize the thread store by fetching threads from the server
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const response = await threadApi.getThreads(this.pageSlug);
      const threadsData = response.content || response || [];

      this.threads.clear();
      for (const thread of threadsData) {
        const threadData = convertToThreadData(thread);
        this.threads.set(threadData.id, threadData);
      }

      this.initialized = true;
      this.notifySubscribers();
    } catch (error) {
      console.error('Failed to initialize thread store:', error);
      // Initialize with empty threads on error
      this.initialized = true;
    }
  }

  private notifySubscribers(): void {
    // Create a deep copy to ensure React detects changes
    const threadsCopy = new Map<string, ThreadData>();
    for (const [id, thread] of this.threads) {
      // Deep copy each comment including their reactions
      const commentsCopy = thread.comments.map(comment => ({
        ...comment,
        reactions: comment.reactions.map(reaction => ({
          ...reaction,
          userIds: [...reaction.userIds],
        })),
      }));
      threadsCopy.set(id, { ...thread, comments: commentsCopy });
    }
    for (const callback of this.subscribers) {
      callback(threadsCopy);
    }
  }

  async createThread(options: {
    initialComment: {
      body: CommentBody;
      metadata?: any;
    };
    metadata?: any;
  }): Promise<ThreadData> {
    const { text, body } = convertBodyToBackend(options.initialComment.body);
    const reference = this.getSelectionReference();
    const metadata = {
      ...(options.metadata || {}),
      ...(reference
        ? {
            referenceText: reference.text,
            referenceFrom: reference.from,
            referenceTo: reference.to,
          }
        : {}),
    };

    const response = await threadApi.createThread(this.pageSlug, {
      initial_comment: {
        text,
        body,
        metadata: options.initialComment.metadata,
      },
      metadata,
    });

    const threadData = convertToThreadData(response.content || response);
    this.threads.set(threadData.id, threadData);
    this.notifySubscribers();

    return threadData;
  }

  async addComment(options: {
    comment: {
      body: CommentBody;
      metadata?: any;
    };
    threadId: string;
  }): Promise<CommentData> {
    const { text, body } = convertBodyToBackend(options.comment.body);

    const response = await threadApi.addComment(options.threadId, {
      text,
      body,
      metadata: options.comment.metadata,
    });

    const commentData = convertToCommentData(response.content || response);

    // Update local thread
    const thread = this.threads.get(options.threadId);
    if (thread) {
      const updatedThread: ThreadData = {
        ...thread,
        comments: [...thread.comments, commentData],
        updatedAt: new Date(),
      };
      this.threads.set(updatedThread.id, updatedThread);
      this.notifySubscribers();
    }

    return commentData;
  }

  async updateComment(options: {
    comment: {
      body: CommentBody;
      metadata?: any;
    };
    threadId: string;
    commentId: string;
  }): Promise<void> {
    const { text, body } = convertBodyToBackend(options.comment.body);

    await threadApi.updateComment(options.threadId, options.commentId, {
      text,
      body,
      metadata: options.comment.metadata,
    });

    // Update local thread
    const thread = this.threads.get(options.threadId);
    if (thread) {
      const commentIndex = thread.comments.findIndex(c => c.id === options.commentId);
      if (commentIndex !== -1) {
        const existingComment = thread.comments[commentIndex];
        const updatedComments = [...thread.comments];
        updatedComments[commentIndex] = {
          ...existingComment,
          body,
          updatedAt: new Date(),
          metadata: options.comment.metadata || existingComment.metadata,
        } as CommentData;
        const updatedThread: ThreadData = {
          ...thread,
          comments: updatedComments,
          updatedAt: new Date(),
        };
        this.threads.set(updatedThread.id, updatedThread);
        this.notifySubscribers();
      }
    }
  }

  async deleteComment(options: { threadId: string; commentId: string }): Promise<void> {
    await threadApi.deleteComment(options.threadId, options.commentId);

    // Remove deleted comment locally to keep action toolbar logic consistent.
    const thread = this.threads.get(options.threadId);
    if (thread) {
      const updatedComments = thread.comments.filter(c => c.id !== options.commentId);
      if (updatedComments.length === 0) {
        this.threads.delete(options.threadId);
      } else {
        const updatedThread: ThreadData = {
          ...thread,
          comments: updatedComments,
          updatedAt: new Date(),
        };
        this.threads.set(updatedThread.id, updatedThread);
      }
      this.notifySubscribers();
    }

    if (thread && thread.comments.length > 1) {
      const refreshed = await this.refreshThread(options.threadId);
      if (refreshed && refreshed.comments.length === 0) {
        this.threads.delete(options.threadId);
        this.notifySubscribers();
      }
    }
  }

  async deleteThread(options: { threadId: string }): Promise<void> {
    await threadApi.deleteThread(options.threadId);

    this.threads.delete(options.threadId);
    this.notifySubscribers();
  }

  async resolveThread(options: { threadId: string }): Promise<void> {
    const response = await threadApi.resolveThread(options.threadId);
    const updated = response.content || response;
    const threadData = convertToThreadData(updated);
    this.threads.set(threadData.id, threadData);
    this.notifySubscribers();
  }

  async unresolveThread(options: { threadId: string }): Promise<void> {
    const response = await threadApi.unresolveThread(options.threadId);
    const updated = response.content || response;
    const threadData = convertToThreadData(updated);
    this.threads.set(threadData.id, threadData);
    this.notifySubscribers();
  }

  async addReaction(options: {
    threadId: string;
    commentId: string;
    emoji: string;
  }): Promise<void> {
    await threadApi.addReaction(options.threadId, options.commentId, options.emoji);
    await this.refreshThread(options.threadId);
  }

  async deleteReaction(options: {
    threadId: string;
    commentId: string;
    emoji: string;
  }): Promise<void> {
    await threadApi.deleteReaction(options.threadId, options.commentId, options.emoji);
    await this.refreshThread(options.threadId);
  }

  getThread(threadId: string): ThreadData {
    const thread = this.threads.get(threadId);
    if (!thread) {
      throw new Error(`Thread ${threadId} not found`);
    }
    return thread;
  }

  getThreads(): Map<string, ThreadData> {
    return new Map(this.threads);
  }

  subscribe(cb: (threads: Map<string, ThreadData>) => void): () => void {
    this.subscribers.add(cb);

    // Initialize and call callback with current threads
    if (!this.initialized) {
      this.initialize().then(() => cb(this.getThreads()));
    } else {
      cb(this.getThreads());
    }

    return () => {
      this.subscribers.delete(cb);
    };
  }
}

/**
 * Create a thread store for a page
 */
export function createThreadStore(pageSlug: string, userId: string, role: 'comment' | 'editor' = 'editor'): EKMSThreadStore {
  const auth = new DefaultThreadStoreAuth(userId, role);
  return new EKMSThreadStore(auth, pageSlug);
}

export { DefaultThreadStoreAuth };
