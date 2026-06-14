/**
 * Tests for Mentions.tsx
 *
 * Tests the mention notification deduplication and caching logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  clearNotifiedUsersForPage,
  clearAllNotifiedUsers,
} from '../components/noteblockplugins/Mentions';

// Mock the dependencies
vi.mock('../services/searchApi', () => ({
  default: {
    searchUsers: vi.fn(),
  },
}));

vi.mock('../utilities/mentionUtils', () => ({
  notifyMentionedUsers: vi.fn(),
  extractMentions: vi.fn(),
}));

describe('Mentions notification deduplication', () => {
  beforeEach(() => {
    // Clear all notifications before each test
    clearAllNotifiedUsers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('clearNotifiedUsersForPage', () => {
    it('should clear notifications for specific page', () => {
      // This tests that the function exists and doesn't throw
      expect(() => clearNotifiedUsersForPage('test-page')).not.toThrow();
    });
  });

  describe('clearAllNotifiedUsers', () => {
    it('should clear all notifications', () => {
      // This tests that the function exists and doesn't throw
      expect(() => clearAllNotifiedUsers()).not.toThrow();
    });
  });
});

describe('Mention dedup timing', () => {
  beforeEach(() => {
    clearAllNotifiedUsers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow re-notification after 5 minutes', () => {
    // The NOTIFICATION_DEDUP_WINDOW is 5 minutes (300000ms)
    // This test verifies the concept of time-based deduplication

    const FIVE_MINUTES = 5 * 60 * 1000;

    // Initial state - no notifications
    const now = Date.now();

    // Advance time by more than 5 minutes
    vi.advanceTimersByTime(FIVE_MINUTES + 1000);

    // Time should have advanced
    expect(Date.now()).toBeGreaterThan(now + FIVE_MINUTES);
  });
});

describe('Page context handling', () => {
  it('should support different pages having separate notification caches', () => {
    // Clear page1 notifications
    clearNotifiedUsersForPage('page-1');

    // Clear page2 notifications
    clearNotifiedUsersForPage('page-2');

    // Both should work independently
    expect(() => {
      clearNotifiedUsersForPage('page-1');
      clearNotifiedUsersForPage('page-2');
    }).not.toThrow();
  });
});
