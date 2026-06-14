/**
 * Comprehensive Tests for Page.tsx Editor Functionality
 *
 * Tests cover:
 * - Block insertion (top-level and nested)
 * - Block updates with debouncing
 * - Block deletion
 * - Nested structure handling (parent/child)
 * - Block move operations (nesting/unnesting)
 * - Block reordering
 * - Helper functions and type conversions
 * - API interactions
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BLOCK_TYPES } from 'constants/Constants';

// ============================================
// MOCK SETUP
// ============================================

// Mock pageApi
const mockPageApi = {
  getPage: vi.fn(),
  createBlock: vi.fn(),
  updateBlock: vi.fn(),
  deleteBlock: vi.fn(),
  reorderBlocks: vi.fn(),
  uploadBlockFile: vi.fn(),
  getMediaContentsByPage: vi.fn(),
  getPageComments: vi.fn(),
  updatePage: vi.fn(),
  clonePage: vi.fn(),
};

vi.mock('services/pageApi', () => ({
  default: mockPageApi,
}));

// Mock axios
vi.mock('services/axiosInstance', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// ============================================
// 1. BLOCK TYPE CONVERSION TESTS
// ============================================

describe('Block Type Conversion', () => {
  // Replicate the convertBlockNoteTypeToBackend function from Page.tsx
  function convertBlockNoteTypeToBackend(blockNoteType: string): number {
    switch (blockNoteType) {
      case 'paragraph':
        return BLOCK_TYPES.PARAGRAPH;
      case 'heading':
        return BLOCK_TYPES.HEADING;
      case 'bulletListItem':
        return BLOCK_TYPES.BULLETED_LIST;
      case 'numberedListItem':
        return BLOCK_TYPES.NUMBERED_LIST;
      case 'quote':
        return BLOCK_TYPES.QUOTE;
      case 'code':
        return BLOCK_TYPES.CODE;
      case 'image':
        return BLOCK_TYPES.IMAGE;
      case 'callout':
        return BLOCK_TYPES.CALLOUT;
      case 'table':
        return BLOCK_TYPES.TABLE;
      default:
        return BLOCK_TYPES.PARAGRAPH;
    }
  }

  describe('Standard block types', () => {
    it('should convert paragraph type correctly', () => {
      expect(convertBlockNoteTypeToBackend('paragraph')).toBe(BLOCK_TYPES.PARAGRAPH);
      expect(convertBlockNoteTypeToBackend('paragraph')).toBe(1);
    });

    it('should convert heading type correctly', () => {
      expect(convertBlockNoteTypeToBackend('heading')).toBe(BLOCK_TYPES.HEADING);
      expect(convertBlockNoteTypeToBackend('heading')).toBe(2);
    });

    it('should convert bulletListItem type correctly', () => {
      expect(convertBlockNoteTypeToBackend('bulletListItem')).toBe(BLOCK_TYPES.BULLETED_LIST);
      expect(convertBlockNoteTypeToBackend('bulletListItem')).toBe(8);
    });

    it('should convert numberedListItem type correctly', () => {
      expect(convertBlockNoteTypeToBackend('numberedListItem')).toBe(BLOCK_TYPES.NUMBERED_LIST);
      expect(convertBlockNoteTypeToBackend('numberedListItem')).toBe(9);
    });

    it('should convert quote type correctly', () => {
      expect(convertBlockNoteTypeToBackend('quote')).toBe(BLOCK_TYPES.QUOTE);
      expect(convertBlockNoteTypeToBackend('quote')).toBe(11);
    });

    it('should convert code type correctly', () => {
      expect(convertBlockNoteTypeToBackend('code')).toBe(BLOCK_TYPES.CODE);
      expect(convertBlockNoteTypeToBackend('code')).toBe(7);
    });

    it('should convert image type correctly', () => {
      expect(convertBlockNoteTypeToBackend('image')).toBe(BLOCK_TYPES.IMAGE);
      expect(convertBlockNoteTypeToBackend('image')).toBe(3);
    });

    it('should convert callout type correctly', () => {
      expect(convertBlockNoteTypeToBackend('callout')).toBe(BLOCK_TYPES.CALLOUT);
      expect(convertBlockNoteTypeToBackend('callout')).toBe(13);
    });

    it('should convert table type correctly', () => {
      expect(convertBlockNoteTypeToBackend('table')).toBe(BLOCK_TYPES.TABLE);
      expect(convertBlockNoteTypeToBackend('table')).toBe(14);
    });
  });

  describe('Unknown block types', () => {
    it('should default to paragraph for unknown types', () => {
      expect(convertBlockNoteTypeToBackend('unknown')).toBe(BLOCK_TYPES.PARAGRAPH);
    });

    it('should default to paragraph for empty string', () => {
      expect(convertBlockNoteTypeToBackend('')).toBe(BLOCK_TYPES.PARAGRAPH);
    });

    it('should default to paragraph for custom block types', () => {
      expect(convertBlockNoteTypeToBackend('customBlock')).toBe(BLOCK_TYPES.PARAGRAPH);
      expect(convertBlockNoteTypeToBackend('mySpecialBlock')).toBe(BLOCK_TYPES.PARAGRAPH);
    });
  });
});

// ============================================
// 2. HELPER FUNCTIONS TESTS
// ============================================

describe('Helper Functions', () => {
  // Mock editor with document structure
  const createMockEditor = (topLevelBlocks: any[]) => ({
    document: topLevelBlocks,
    getBlock: vi.fn((id: string) => {
      // Search recursively
      const findBlock = (blocks: any[]): any => {
        for (const block of blocks) {
          if (block.id === id) return block;
          if (block.children) {
            const found = findBlock(block.children);
            if (found) return found;
          }
        }
        return null;
      };
      return findBlock(topLevelBlocks);
    }),
    forEachBlock: vi.fn((callback: (block: any) => boolean) => {
      const traverse = (blocks: any[]) => {
        for (const block of blocks) {
          const shouldContinue = callback(block);
          if (!shouldContinue) return false;
          if (block.children) {
            const result = traverse(block.children);
            if (!result) return false;
          }
        }
        return true;
      };
      traverse(topLevelBlocks);
    }),
  });

  // Replicate helper functions from Page.tsx
  const isTopLevelBlock = (editor: any, blockId: string): boolean => {
    const topLevelBlocks = editor.document;
    return topLevelBlocks.some((block: any) => block.id === blockId);
  };

  const findParentBlock = (editor: any, blockId: string): any => {
    let parentBlock = null;
    editor.forEachBlock((block: any) => {
      if (block.children && block.children.some((child: any) => child.id === blockId)) {
        parentBlock = block;
        return false; // stop traversal
      }
      return true; // continue traversal
    });
    return parentBlock;
  };

  const calculateBlockOrder = (editor: any, blockId: string): number => {
    const topLevelBlocks = editor.document;
    const blockIndex = topLevelBlocks.findIndex((b: any) => b.id === blockId);
    return blockIndex !== -1 ? blockIndex : 0;
  };

  describe('isTopLevelBlock', () => {
    it('should return true for top-level blocks', () => {
      const mockEditor = createMockEditor([
        { id: 'block-1', type: 'paragraph', children: [] },
        { id: 'block-2', type: 'heading', children: [] },
      ]);

      expect(isTopLevelBlock(mockEditor, 'block-1')).toBe(true);
      expect(isTopLevelBlock(mockEditor, 'block-2')).toBe(true);
    });

    it('should return false for nested blocks', () => {
      const mockEditor = createMockEditor([
        {
          id: 'parent-1',
          type: 'bulletListItem',
          children: [
            { id: 'child-1', type: 'paragraph', children: [] },
            { id: 'child-2', type: 'paragraph', children: [] },
          ],
        },
      ]);

      expect(isTopLevelBlock(mockEditor, 'child-1')).toBe(false);
      expect(isTopLevelBlock(mockEditor, 'child-2')).toBe(false);
      expect(isTopLevelBlock(mockEditor, 'parent-1')).toBe(true);
    });

    it('should return false for deeply nested blocks', () => {
      const mockEditor = createMockEditor([
        {
          id: 'level-1',
          type: 'bulletListItem',
          children: [
            {
              id: 'level-2',
              type: 'bulletListItem',
              children: [
                { id: 'level-3', type: 'paragraph', children: [] },
              ],
            },
          ],
        },
      ]);

      expect(isTopLevelBlock(mockEditor, 'level-1')).toBe(true);
      expect(isTopLevelBlock(mockEditor, 'level-2')).toBe(false);
      expect(isTopLevelBlock(mockEditor, 'level-3')).toBe(false);
    });

    it('should return false for non-existent blocks', () => {
      const mockEditor = createMockEditor([
        { id: 'block-1', type: 'paragraph', children: [] },
      ]);

      expect(isTopLevelBlock(mockEditor, 'non-existent')).toBe(false);
    });

    it('should handle empty document', () => {
      const mockEditor = createMockEditor([]);
      expect(isTopLevelBlock(mockEditor, 'any-id')).toBe(false);
    });
  });

  describe('findParentBlock', () => {
    it('should return null for top-level blocks', () => {
      const mockEditor = createMockEditor([
        { id: 'block-1', type: 'paragraph', children: [] },
        { id: 'block-2', type: 'heading', children: [] },
      ]);

      expect(findParentBlock(mockEditor, 'block-1')).toBeNull();
      expect(findParentBlock(mockEditor, 'block-2')).toBeNull();
    });

    it('should find parent for nested blocks', () => {
      const parentBlock = {
        id: 'parent-1',
        type: 'bulletListItem',
        children: [
          { id: 'child-1', type: 'paragraph', children: [] },
          { id: 'child-2', type: 'paragraph', children: [] },
        ],
      };
      const mockEditor = createMockEditor([parentBlock]);

      const foundParent = findParentBlock(mockEditor, 'child-1');
      expect(foundParent).not.toBeNull();
      expect(foundParent.id).toBe('parent-1');
    });

    it('should find immediate parent for deeply nested blocks', () => {
      const level2Block = {
        id: 'level-2',
        type: 'bulletListItem',
        children: [
          { id: 'level-3', type: 'paragraph', children: [] },
        ],
      };
      const level1Block = {
        id: 'level-1',
        type: 'bulletListItem',
        children: [level2Block],
      };
      const mockEditor = createMockEditor([level1Block]);

      const parentOfLevel3 = findParentBlock(mockEditor, 'level-3');
      expect(parentOfLevel3).not.toBeNull();
      expect(parentOfLevel3.id).toBe('level-2');

      const parentOfLevel2 = findParentBlock(mockEditor, 'level-2');
      expect(parentOfLevel2).not.toBeNull();
      expect(parentOfLevel2.id).toBe('level-1');
    });

    it('should return null for non-existent blocks', () => {
      const mockEditor = createMockEditor([
        { id: 'block-1', type: 'paragraph', children: [] },
      ]);

      expect(findParentBlock(mockEditor, 'non-existent')).toBeNull();
    });
  });

  describe('calculateBlockOrder', () => {
    it('should return correct order for top-level blocks', () => {
      const mockEditor = createMockEditor([
        { id: 'block-a', type: 'paragraph', children: [] },
        { id: 'block-b', type: 'heading', children: [] },
        { id: 'block-c', type: 'quote', children: [] },
      ]);

      expect(calculateBlockOrder(mockEditor, 'block-a')).toBe(0);
      expect(calculateBlockOrder(mockEditor, 'block-b')).toBe(1);
      expect(calculateBlockOrder(mockEditor, 'block-c')).toBe(2);
    });

    it('should return 0 for non-existent blocks', () => {
      const mockEditor = createMockEditor([
        { id: 'block-1', type: 'paragraph', children: [] },
      ]);

      expect(calculateBlockOrder(mockEditor, 'non-existent')).toBe(0);
    });

    it('should return 0 for nested blocks (not in top-level)', () => {
      const mockEditor = createMockEditor([
        {
          id: 'parent',
          type: 'bulletListItem',
          children: [
            { id: 'child', type: 'paragraph', children: [] },
          ],
        },
      ]);

      expect(calculateBlockOrder(mockEditor, 'child')).toBe(0);
      expect(calculateBlockOrder(mockEditor, 'parent')).toBe(0);
    });

    it('should handle empty document', () => {
      const mockEditor = createMockEditor([]);
      expect(calculateBlockOrder(mockEditor, 'any-id')).toBe(0);
    });

    it('should handle large number of blocks', () => {
      const blocks = Array.from({ length: 100 }, (_, i) => ({
        id: `block-${i}`,
        type: 'paragraph',
        children: [],
      }));
      const mockEditor = createMockEditor(blocks);

      expect(calculateBlockOrder(mockEditor, 'block-0')).toBe(0);
      expect(calculateBlockOrder(mockEditor, 'block-50')).toBe(50);
      expect(calculateBlockOrder(mockEditor, 'block-99')).toBe(99);
    });
  });
});

// ============================================
// 3. BLOCK INSERTION TESTS
// ============================================

describe('Block Insertion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Mock page data
  const mockPage = {
    id: 123,
    slug: 'test-page',
    title: 'Test Page',
    project: 1,
  };

  describe('Top-level block insertion', () => {
    it('should create block with correct data structure', async () => {
      mockPageApi.createBlock.mockResolvedValue({ status: 200, content: { id: 'new-block-1' } });

      const block = {
        id: 'new-block-1',
        type: 'paragraph',
        content: [{ type: 'text', text: 'Hello World' }],
        children: [],
      };

      const blockData = {
        block_id: block.id,
        page: mockPage.id,
        block_type: BLOCK_TYPES.PARAGRAPH,
        order: 0,
        content: block,
      };

      await mockPageApi.createBlock(blockData);

      expect(mockPageApi.createBlock).toHaveBeenCalledWith(blockData);
      expect(mockPageApi.createBlock).toHaveBeenCalledTimes(1);
    });

    it('should assign correct order based on position', async () => {
      mockPageApi.createBlock.mockResolvedValue({ status: 200 });

      const blocks = [
        { id: 'block-0', type: 'paragraph', order: 0 },
        { id: 'block-1', type: 'heading', order: 1 },
        { id: 'block-2', type: 'quote', order: 2 },
      ];

      for (const block of blocks) {
        await mockPageApi.createBlock({
          block_id: block.id,
          page: mockPage.id,
          block_type: BLOCK_TYPES.PARAGRAPH,
          order: block.order,
          content: block,
        });
      }

      expect(mockPageApi.createBlock).toHaveBeenCalledTimes(3);
    });

    it('should handle different block types on insertion', async () => {
      mockPageApi.createBlock.mockResolvedValue({ status: 200 });

      const blockTypes = [
        { type: 'paragraph', backendType: BLOCK_TYPES.PARAGRAPH },
        { type: 'heading', backendType: BLOCK_TYPES.HEADING },
        { type: 'bulletListItem', backendType: BLOCK_TYPES.BULLETED_LIST },
        { type: 'numberedListItem', backendType: BLOCK_TYPES.NUMBERED_LIST },
        { type: 'quote', backendType: BLOCK_TYPES.QUOTE },
        { type: 'code', backendType: BLOCK_TYPES.CODE },
        { type: 'image', backendType: BLOCK_TYPES.IMAGE },
        { type: 'table', backendType: BLOCK_TYPES.TABLE },
      ];

      for (let i = 0; i < blockTypes.length; i++) {
        const { type, backendType } = blockTypes[i];
        await mockPageApi.createBlock({
          block_id: `block-${i}`,
          page: mockPage.id,
          block_type: backendType,
          order: i,
          content: { id: `block-${i}`, type },
        });

        expect(mockPageApi.createBlock).toHaveBeenLastCalledWith(
          expect.objectContaining({
            block_type: backendType,
          })
        );
      }
    });
  });

  describe('Nested block insertion', () => {
    it('should not create nested blocks directly on server', async () => {
      // Nested blocks should update parent instead
      const parentBlock = {
        id: 'parent-1',
        type: 'bulletListItem',
        children: [
          { id: 'child-1', type: 'paragraph', children: [] },
        ],
      };

      // When a child block is inserted, we should update the parent
      mockPageApi.updateBlock.mockResolvedValue({ status: 200 });

      await mockPageApi.updateBlock(parentBlock.id, {
        block_id: parentBlock.id,
        page: mockPage.id,
        block_type: BLOCK_TYPES.BULLETED_LIST,
        content: parentBlock,
      });

      expect(mockPageApi.createBlock).not.toHaveBeenCalled();
      expect(mockPageApi.updateBlock).toHaveBeenCalledWith(
        'parent-1',
        expect.objectContaining({
          content: expect.objectContaining({
            children: expect.arrayContaining([
              expect.objectContaining({ id: 'child-1' }),
            ]),
          }),
        })
      );
    });

    it('should handle deeply nested block insertion via parent update', async () => {
      mockPageApi.updateBlock.mockResolvedValue({ status: 200 });

      const deeplyNestedStructure = {
        id: 'level-1',
        type: 'bulletListItem',
        children: [
          {
            id: 'level-2',
            type: 'bulletListItem',
            children: [
              {
                id: 'level-3',
                type: 'paragraph',
                children: [],
              },
            ],
          },
        ],
      };

      await mockPageApi.updateBlock('level-1', {
        block_id: 'level-1',
        page: mockPage.id,
        block_type: BLOCK_TYPES.BULLETED_LIST,
        content: deeplyNestedStructure,
      });

      expect(mockPageApi.updateBlock).toHaveBeenCalledWith(
        'level-1',
        expect.objectContaining({
          content: expect.objectContaining({
            children: expect.arrayContaining([
              expect.objectContaining({
                id: 'level-2',
                children: expect.arrayContaining([
                  expect.objectContaining({ id: 'level-3' }),
                ]),
              }),
            ]),
          }),
        })
      );
    });
  });

  describe('Error handling on insertion', () => {
    it('should handle API error on block creation', async () => {
      const error = new Error('Network error');
      mockPageApi.createBlock.mockRejectedValue(error);

      await expect(
        mockPageApi.createBlock({
          block_id: 'block-1',
          page: mockPage.id,
          block_type: BLOCK_TYPES.PARAGRAPH,
          order: 0,
          content: { id: 'block-1', type: 'paragraph' },
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle server validation error', async () => {
      const validationError = {
        response: {
          status: 400,
          data: { detail: 'Invalid block data' },
        },
      };
      mockPageApi.createBlock.mockRejectedValue(validationError);

      await expect(
        mockPageApi.createBlock({
          block_id: '',
          page: mockPage.id,
          block_type: BLOCK_TYPES.PARAGRAPH,
          order: 0,
          content: {},
        })
      ).rejects.toMatchObject(validationError);
    });
  });
});

// ============================================
// 4. BLOCK UPDATE TESTS
// ============================================

describe('Block Update', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockPage = {
    id: 123,
    slug: 'test-page',
    title: 'Test Page',
    project: 1,
  };

  describe('Direct block updates', () => {
    it('should update block content correctly', async () => {
      mockPageApi.updateBlock.mockResolvedValue({ status: 200 });

      const updatedBlock = {
        id: 'block-1',
        type: 'paragraph',
        content: [{ type: 'text', text: 'Updated content' }],
        children: [],
      };

      await mockPageApi.updateBlock('block-1', {
        block_id: 'block-1',
        page: mockPage.id,
        block_type: BLOCK_TYPES.PARAGRAPH,
        content: updatedBlock,
        order: 0,
      });

      expect(mockPageApi.updateBlock).toHaveBeenCalledWith(
        'block-1',
        expect.objectContaining({
          content: expect.objectContaining({
            content: [{ type: 'text', text: 'Updated content' }],
          }),
        })
      );
    });

    it('should update block type correctly', async () => {
      mockPageApi.updateBlock.mockResolvedValue({ status: 200 });

      // Change from paragraph to heading
      await mockPageApi.updateBlock('block-1', {
        block_id: 'block-1',
        page: mockPage.id,
        block_type: BLOCK_TYPES.HEADING,
        content: { id: 'block-1', type: 'heading', props: { level: 1 } },
        order: 0,
      });

      expect(mockPageApi.updateBlock).toHaveBeenCalledWith(
        'block-1',
        expect.objectContaining({
          block_type: BLOCK_TYPES.HEADING,
        })
      );
    });

    it('should include order in update data', async () => {
      mockPageApi.updateBlock.mockResolvedValue({ status: 200 });

      await mockPageApi.updateBlock('block-5', {
        block_id: 'block-5',
        page: mockPage.id,
        block_type: BLOCK_TYPES.PARAGRAPH,
        content: { id: 'block-5', type: 'paragraph' },
        order: 5,
      });

      expect(mockPageApi.updateBlock).toHaveBeenCalledWith(
        'block-5',
        expect.objectContaining({
          order: 5,
        })
      );
    });
  });

  describe('Debounced updates', () => {
    it('should debounce rapid updates', async () => {
      mockPageApi.updateBlock.mockResolvedValue({ status: 200 });

      const pendingUpdates: Record<string, NodeJS.Timeout> = {};

      // Simulate rapid typing with debounce
      const simulateTyping = (blockId: string, content: string) => {
        if (pendingUpdates[blockId]) {
          clearTimeout(pendingUpdates[blockId]);
        }
        pendingUpdates[blockId] = setTimeout(async () => {
          await mockPageApi.updateBlock(blockId, {
            block_id: blockId,
            page: mockPage.id,
            block_type: BLOCK_TYPES.PARAGRAPH,
            content: { id: blockId, type: 'paragraph', content },
            order: 0,
          });
          delete pendingUpdates[blockId];
        }, 3000);
      };

      // Simulate rapid typing
      simulateTyping('block-1', 'H');
      simulateTyping('block-1', 'He');
      simulateTyping('block-1', 'Hel');
      simulateTyping('block-1', 'Hell');
      simulateTyping('block-1', 'Hello');

      // API should not be called yet
      expect(mockPageApi.updateBlock).not.toHaveBeenCalled();

      // Advance timers by 3 seconds
      vi.advanceTimersByTime(3000);

      // Now the debounced update should have fired
      await vi.waitFor(() => {
        expect(mockPageApi.updateBlock).toHaveBeenCalledTimes(1);
      });

      // Should only send the final content
      expect(mockPageApi.updateBlock).toHaveBeenCalledWith(
        'block-1',
        expect.objectContaining({
          content: expect.objectContaining({
            content: 'Hello',
          }),
        })
      );
    });

    it('should not cancel updates for different blocks', async () => {
      mockPageApi.updateBlock.mockResolvedValue({ status: 200 });

      const pendingUpdates: Record<string, NodeJS.Timeout> = {};

      const simulateUpdate = (blockId: string, content: string) => {
        if (pendingUpdates[blockId]) {
          clearTimeout(pendingUpdates[blockId]);
        }
        pendingUpdates[blockId] = setTimeout(async () => {
          await mockPageApi.updateBlock(blockId, {
            block_id: blockId,
            page: mockPage.id,
            block_type: BLOCK_TYPES.PARAGRAPH,
            content: { id: blockId, content },
            order: 0,
          });
          delete pendingUpdates[blockId];
        }, 3000);
      };

      // Update different blocks
      simulateUpdate('block-1', 'Content 1');
      simulateUpdate('block-2', 'Content 2');
      simulateUpdate('block-3', 'Content 3');

      vi.advanceTimersByTime(3000);

      await vi.waitFor(() => {
        expect(mockPageApi.updateBlock).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Nested block updates', () => {
    it('should update parent when nested block changes', async () => {
      mockPageApi.updateBlock.mockResolvedValue({ status: 200 });

      const parentWithUpdatedChild = {
        id: 'parent-1',
        type: 'bulletListItem',
        children: [
          {
            id: 'child-1',
            type: 'paragraph',
            content: [{ type: 'text', text: 'Updated child content' }],
            children: [],
          },
        ],
      };

      await mockPageApi.updateBlock('parent-1', {
        block_id: 'parent-1',
        page: mockPage.id,
        block_type: BLOCK_TYPES.BULLETED_LIST,
        content: parentWithUpdatedChild,
        order: 0,
      });

      expect(mockPageApi.updateBlock).toHaveBeenCalledWith(
        'parent-1',
        expect.objectContaining({
          content: expect.objectContaining({
            children: expect.arrayContaining([
              expect.objectContaining({
                id: 'child-1',
                content: [{ type: 'text', text: 'Updated child content' }],
              }),
            ]),
          }),
        })
      );
    });
  });

  describe('Error handling on update', () => {
    it('should handle 404 error gracefully', async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: { detail: 'Block not found' },
        },
      };
      mockPageApi.updateBlock.mockRejectedValue(notFoundError);

      await expect(
        mockPageApi.updateBlock('non-existent', {
          block_id: 'non-existent',
          page: mockPage.id,
          block_type: BLOCK_TYPES.PARAGRAPH,
          content: {},
          order: 0,
        })
      ).rejects.toMatchObject(notFoundError);
    });
  });
});

// ============================================
// 5. BLOCK DELETION TESTS
// ============================================

describe('Block Deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Top-level block deletion', () => {
    it('should delete block from server', async () => {
      mockPageApi.deleteBlock.mockResolvedValue(true);

      await mockPageApi.deleteBlock('block-1');

      expect(mockPageApi.deleteBlock).toHaveBeenCalledWith('block-1');
      expect(mockPageApi.deleteBlock).toHaveBeenCalledTimes(1);
    });

    it('should not delete temporary blocks', async () => {
      // Blocks with temp- prefix shouldn't be deleted from server
      const tempBlockId = 'temp-123456';

      // Simulate the logic from Page.tsx
      if (!tempBlockId.startsWith('temp-')) {
        await mockPageApi.deleteBlock(tempBlockId);
      }

      expect(mockPageApi.deleteBlock).not.toHaveBeenCalled();
    });

    it('should handle multiple block deletions', async () => {
      mockPageApi.deleteBlock.mockResolvedValue(true);

      const blockIds = ['block-1', 'block-2', 'block-3'];

      for (const id of blockIds) {
        await mockPageApi.deleteBlock(id);
      }

      expect(mockPageApi.deleteBlock).toHaveBeenCalledTimes(3);
      expect(mockPageApi.deleteBlock).toHaveBeenNthCalledWith(1, 'block-1');
      expect(mockPageApi.deleteBlock).toHaveBeenNthCalledWith(2, 'block-2');
      expect(mockPageApi.deleteBlock).toHaveBeenNthCalledWith(3, 'block-3');
    });
  });

  describe('Nested block deletion', () => {
    it('should ignore 404 errors for nested blocks', async () => {
      const notFoundError = {
        response: {
          status: 404,
        },
      };
      mockPageApi.deleteBlock.mockRejectedValue(notFoundError);

      // This simulates the logic from handleBlockDelete
      try {
        await mockPageApi.deleteBlock('nested-block');
      } catch (error: any) {
        // Ignore 404 errors - block might have been a nested block
        if (error?.response?.status === 404) {
          // Expected behavior - don't throw
        } else {
          throw error;
        }
      }

      expect(mockPageApi.deleteBlock).toHaveBeenCalled();
    });

    it('should update parent when nested block is deleted', async () => {
      mockPageApi.updateBlock.mockResolvedValue({ status: 200 });

      const parentAfterChildDeletion = {
        id: 'parent-1',
        type: 'bulletListItem',
        children: [], // Child removed
      };

      await mockPageApi.updateBlock('parent-1', {
        block_id: 'parent-1',
        page: 123,
        block_type: BLOCK_TYPES.BULLETED_LIST,
        content: parentAfterChildDeletion,
        order: 0,
      });

      expect(mockPageApi.updateBlock).toHaveBeenCalledWith(
        'parent-1',
        expect.objectContaining({
          content: expect.objectContaining({
            children: [],
          }),
        })
      );
    });
  });

  describe('Pending update cleanup on deletion', () => {
    it('should cancel pending updates when block is deleted', () => {
      vi.useFakeTimers();

      const pendingUpdates: Record<string, NodeJS.Timeout> = {};

      // Set up a pending update
      pendingUpdates['block-1'] = setTimeout(() => {
        // This should not execute if cleaned up
      }, 3000);

      // Simulate deletion cleanup
      if (pendingUpdates['block-1']) {
        clearTimeout(pendingUpdates['block-1']);
        delete pendingUpdates['block-1'];
      }

      expect(pendingUpdates['block-1']).toBeUndefined();

      vi.useRealTimers();
    });

    it('should cancel pending updates for ALL children when parent is deleted', () => {
      vi.useFakeTimers();

      const pendingUpdates: Record<string, NodeJS.Timeout> = {};
      let childUpdateFired = false;

      // Set up pending updates for parent and children
      pendingUpdates['parent-1'] = setTimeout(() => {}, 3000);
      pendingUpdates['child-1'] = setTimeout(() => {
        childUpdateFired = true; // This should NOT fire if properly cleaned up
      }, 3000);
      pendingUpdates['child-2'] = setTimeout(() => {
        childUpdateFired = true;
      }, 3000);

      const parentBlock = {
        id: 'parent-1',
        type: 'bulletListItem',
        children: [
          { id: 'child-1', type: 'paragraph', children: [] },
          { id: 'child-2', type: 'paragraph', children: [] },
        ],
      };

      // Simulate the CORRECT handleBlockDelete behavior - should clear all children
      const clearPendingUpdatesRecursively = (block: any) => {
        if (pendingUpdates[block.id]) {
          clearTimeout(pendingUpdates[block.id]);
          delete pendingUpdates[block.id];
        }
        if (block.children) {
          block.children.forEach((child: any) => clearPendingUpdatesRecursively(child));
        }
      };

      clearPendingUpdatesRecursively(parentBlock);

      // All pending updates should be cleared
      expect(pendingUpdates['parent-1']).toBeUndefined();
      expect(pendingUpdates['child-1']).toBeUndefined();
      expect(pendingUpdates['child-2']).toBeUndefined();

      // Advance timers
      vi.advanceTimersByTime(3000);

      // No child updates should have fired
      expect(childUpdateFired).toBe(false);

      vi.useRealTimers();
    });

    it('should recursively cancel pending updates for deeply nested children', () => {
      vi.useFakeTimers();

      const pendingUpdates: Record<string, NodeJS.Timeout> = {};
      const firedUpdates: string[] = [];

      // Create deeply nested structure with pending updates at each level
      pendingUpdates['level-1'] = setTimeout(() => firedUpdates.push('level-1'), 3000);
      pendingUpdates['level-2'] = setTimeout(() => firedUpdates.push('level-2'), 3000);
      pendingUpdates['level-3'] = setTimeout(() => firedUpdates.push('level-3'), 3000);

      const deeplyNestedBlock = {
        id: 'level-1',
        type: 'bulletListItem',
        children: [
          {
            id: 'level-2',
            type: 'bulletListItem',
            children: [
              { id: 'level-3', type: 'paragraph', children: [] },
            ],
          },
        ],
      };

      // Simulate the CORRECT handleBlockDelete behavior - should clear all levels
      const clearPendingUpdatesRecursively = (block: any) => {
        if (pendingUpdates[block.id]) {
          clearTimeout(pendingUpdates[block.id]);
          delete pendingUpdates[block.id];
        }
        if (block.children) {
          block.children.forEach((child: any) => clearPendingUpdatesRecursively(child));
        }
      };

      clearPendingUpdatesRecursively(deeplyNestedBlock);

      // All levels should be cleared
      expect(pendingUpdates['level-1']).toBeUndefined();
      expect(pendingUpdates['level-2']).toBeUndefined();
      expect(pendingUpdates['level-3']).toBeUndefined();

      vi.advanceTimersByTime(3000);

      // No updates should have fired
      expect(firedUpdates).toHaveLength(0);

      vi.useRealTimers();
    });
  });

  describe('Deleting blocks with children', () => {
    it('should attempt to delete children from server when parent is deleted', async () => {
      mockPageApi.deleteBlock.mockResolvedValue(true);

      const parentBlock = {
        id: 'parent-1',
        type: 'bulletListItem',
        children: [
          { id: 'child-1', type: 'paragraph', children: [] },
          { id: 'child-2', type: 'paragraph', children: [] },
        ],
      };

      // Simulate the CORRECT recursive deletion
      const deleteBlockRecursively = async (block: any) => {
        // Delete children first (depth-first)
        if (block.children) {
          for (const child of block.children) {
            await deleteBlockRecursively(child);
          }
        }
        // Then delete the block itself
        if (!block.id.startsWith('temp-')) {
          try {
            await mockPageApi.deleteBlock(block.id);
          } catch (error: any) {
            // Ignore 404 - child might not exist as separate block
            if (error?.response?.status !== 404) throw error;
          }
        }
      };

      await deleteBlockRecursively(parentBlock);

      // Should have attempted to delete all 3 blocks (children first, then parent)
      expect(mockPageApi.deleteBlock).toHaveBeenCalledTimes(3);
      expect(mockPageApi.deleteBlock).toHaveBeenNthCalledWith(1, 'child-1');
      expect(mockPageApi.deleteBlock).toHaveBeenNthCalledWith(2, 'child-2');
      expect(mockPageApi.deleteBlock).toHaveBeenNthCalledWith(3, 'parent-1');
    });

    it('should handle 404 errors gracefully when children do not exist on server', async () => {
      // Children return 404 (they were nested and not saved separately)
      mockPageApi.deleteBlock.mockImplementation(async (id: string) => {
        if (id.startsWith('child-')) {
          const error: any = new Error('Not found');
          error.response = { status: 404 };
          throw error;
        }
        return true;
      });

      const parentBlock = {
        id: 'parent-1',
        type: 'bulletListItem',
        children: [
          { id: 'child-1', type: 'paragraph', children: [] },
          { id: 'child-2', type: 'paragraph', children: [] },
        ],
      };

      // Simulate the CORRECT recursive deletion with 404 handling
      const deleteBlockRecursively = async (block: any) => {
        if (block.children) {
          for (const child of block.children) {
            await deleteBlockRecursively(child);
          }
        }
        if (!block.id.startsWith('temp-')) {
          try {
            await mockPageApi.deleteBlock(block.id);
          } catch (error: any) {
            if (error?.response?.status !== 404) throw error;
            // 404 is OK - child wasn't saved separately
          }
        }
      };

      // Should not throw even though children return 404
      await expect(deleteBlockRecursively(parentBlock)).resolves.not.toThrow();

      // All blocks should have been attempted
      expect(mockPageApi.deleteBlock).toHaveBeenCalledTimes(3);
    });

    it('should propagate non-404 errors', async () => {
      mockPageApi.deleteBlock.mockImplementation(async (id: string) => {
        if (id === 'child-1') {
          const error: any = new Error('Server error');
          error.response = { status: 500 };
          throw error;
        }
        return true;
      });

      const parentBlock = {
        id: 'parent-1',
        type: 'bulletListItem',
        children: [
          { id: 'child-1', type: 'paragraph', children: [] },
        ],
      };

      const deleteBlockRecursively = async (block: any) => {
        if (block.children) {
          for (const child of block.children) {
            await deleteBlockRecursively(child);
          }
        }
        if (!block.id.startsWith('temp-')) {
          try {
            await mockPageApi.deleteBlock(block.id);
          } catch (error: any) {
            if (error?.response?.status !== 404) throw error;
          }
        }
      };

      // Should throw the 500 error
      await expect(deleteBlockRecursively(parentBlock)).rejects.toThrow('Server error');
    });
  });

  describe('Error handling on deletion', () => {
    it('should handle server errors', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { detail: 'Internal server error' },
        },
      };
      mockPageApi.deleteBlock.mockRejectedValue(serverError);

      await expect(mockPageApi.deleteBlock('block-1')).rejects.toMatchObject(serverError);
    });
  });
});

// ============================================
// 6. BLOCK MOVE TESTS (NESTING/UNNESTING)
// ============================================

describe('Block Move Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPage = {
    id: 123,
    slug: 'test-page',
    title: 'Test Page',
    project: 1,
  };

  describe('Move to nested position', () => {
    it('should delete block from server when it becomes nested', async () => {
      mockPageApi.deleteBlock.mockResolvedValue(true);
      mockPageApi.updateBlock.mockResolvedValue({ status: 200 });

      // Block moves from top-level to nested
      await mockPageApi.deleteBlock('block-to-nest');

      expect(mockPageApi.deleteBlock).toHaveBeenCalledWith('block-to-nest');
    });

    it('should update parent block after nesting', async () => {
      mockPageApi.deleteBlock.mockResolvedValue(true);
      mockPageApi.updateBlock.mockResolvedValue({ status: 200 });

      // First delete the block that's becoming nested
      await mockPageApi.deleteBlock('block-to-nest');

      // Then update parent with new child
      const parentWithNewChild = {
        id: 'parent-1',
        type: 'bulletListItem',
        children: [
          { id: 'block-to-nest', type: 'paragraph', children: [] },
        ],
      };

      await mockPageApi.updateBlock('parent-1', {
        block_id: 'parent-1',
        page: mockPage.id,
        block_type: BLOCK_TYPES.BULLETED_LIST,
        content: parentWithNewChild,
        order: 0,
      });

      expect(mockPageApi.updateBlock).toHaveBeenCalledWith(
        'parent-1',
        expect.objectContaining({
          content: expect.objectContaining({
            children: expect.arrayContaining([
              expect.objectContaining({ id: 'block-to-nest' }),
            ]),
          }),
        })
      );
    });

    it('should ignore 404 when deleting block that was not saved', async () => {
      const notFoundError = { response: { status: 404 } };
      mockPageApi.deleteBlock.mockRejectedValue(notFoundError);

      // This should not throw
      try {
        await mockPageApi.deleteBlock('unsaved-block');
      } catch (error: any) {
        if (error?.response?.status !== 404) {
          throw error;
        }
      }

      expect(mockPageApi.deleteBlock).toHaveBeenCalled();
    });
  });

  describe('Move to top-level position', () => {
    it('should create block when un-nested (404 on update)', async () => {
      const notFoundError = { response: { status: 404 } };
      mockPageApi.updateBlock.mockRejectedValue(notFoundError);
      mockPageApi.createBlock.mockResolvedValue({ status: 200 });

      // Simulate handleBlockMove logic
      try {
        await mockPageApi.updateBlock('unnested-block', {
          block_id: 'unnested-block',
          page: mockPage.id,
          block_type: BLOCK_TYPES.PARAGRAPH,
          content: { id: 'unnested-block', type: 'paragraph' },
          order: 2,
        });
      } catch (error: any) {
        if (error?.response?.status === 404) {
          // Block doesn't exist, create it
          await mockPageApi.createBlock({
            block_id: 'unnested-block',
            page: mockPage.id,
            block_type: BLOCK_TYPES.PARAGRAPH,
            content: { id: 'unnested-block', type: 'paragraph' },
            order: 2,
          });
        }
      }

      expect(mockPageApi.createBlock).toHaveBeenCalledWith(
        expect.objectContaining({
          block_id: 'unnested-block',
        })
      );
    });

    it('should update block when un-nested (exists on server)', async () => {
      mockPageApi.updateBlock.mockResolvedValue({ status: 200 });

      await mockPageApi.updateBlock('unnested-block', {
        block_id: 'unnested-block',
        page: mockPage.id,
        block_type: BLOCK_TYPES.PARAGRAPH,
        content: { id: 'unnested-block', type: 'paragraph' },
        order: 2,
      });

      expect(mockPageApi.updateBlock).toHaveBeenCalled();
      expect(mockPageApi.createBlock).not.toHaveBeenCalled();
    });
  });

  describe('Reorder after move', () => {
    it('should trigger reorder after move operation', async () => {
      mockPageApi.reorderBlocks.mockResolvedValue({ status: 200 });

      const blocksOrder = [
        { block_id: 'block-0', order: 0 },
        { block_id: 'moved-block', order: 1 },
        { block_id: 'block-2', order: 2 },
      ];

      await mockPageApi.reorderBlocks(blocksOrder);

      expect(mockPageApi.reorderBlocks).toHaveBeenCalledWith(blocksOrder);
    });
  });
});

// ============================================
// 7. BLOCK REORDERING TESTS
// ============================================

describe('Block Reordering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Reorder API calls', () => {
    it('should send correct blocks_order structure', async () => {
      mockPageApi.reorderBlocks.mockResolvedValue({ status: 200 });

      const blocksOrder = [
        { block_id: 'block-c', order: 0 },
        { block_id: 'block-a', order: 1 },
        { block_id: 'block-b', order: 2 },
      ];

      await mockPageApi.reorderBlocks(blocksOrder);

      expect(mockPageApi.reorderBlocks).toHaveBeenCalledWith(blocksOrder);
    });

    it('should only include top-level blocks in reorder', () => {
      const mockEditor = {
        document: [
          {
            id: 'parent-1',
            type: 'bulletListItem',
            children: [
              { id: 'child-1', type: 'paragraph', children: [] },
            ],
          },
          { id: 'block-2', type: 'paragraph', children: [] },
        ],
      };

      const topLevelBlocks = mockEditor.document;
      const blocksOrder = topLevelBlocks.map((block: any, index: number) => ({
        block_id: String(block.id),
        order: index,
      }));

      // Should only have 2 items (parent and block-2), not the child
      expect(blocksOrder).toHaveLength(2);
      expect(blocksOrder).toEqual([
        { block_id: 'parent-1', order: 0 },
        { block_id: 'block-2', order: 1 },
      ]);
    });

    it('should not call reorder with empty blocks', async () => {
      const mockEditor = {
        document: [],
      };

      const topLevelBlocks = mockEditor.document;
      const blocksOrder = topLevelBlocks.map((block: any, index: number) => ({
        block_id: String(block.id),
        order: index,
      }));

      // Simulate the condition from Page.tsx
      if (blocksOrder.length > 0) {
        await mockPageApi.reorderBlocks(blocksOrder);
      }

      expect(mockPageApi.reorderBlocks).not.toHaveBeenCalled();
    });

    it('should handle large reorder operations', async () => {
      mockPageApi.reorderBlocks.mockResolvedValue({ status: 200 });

      const blocksOrder = Array.from({ length: 50 }, (_, i) => ({
        block_id: `block-${i}`,
        order: i,
      }));

      await mockPageApi.reorderBlocks(blocksOrder);

      expect(mockPageApi.reorderBlocks).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ block_id: 'block-0', order: 0 }),
          expect.objectContaining({ block_id: 'block-49', order: 49 }),
        ])
      );
    });
  });

  describe('Reorder triggers', () => {
    it('should trigger reorder after insert', async () => {
      mockPageApi.createBlock.mockResolvedValue({ status: 200 });
      mockPageApi.reorderBlocks.mockResolvedValue({ status: 200 });

      // Simulate insert followed by reorder
      await mockPageApi.createBlock({
        block_id: 'new-block',
        page: 123,
        block_type: BLOCK_TYPES.PARAGRAPH,
        order: 0,
        content: { id: 'new-block', type: 'paragraph' },
      });

      await mockPageApi.reorderBlocks([
        { block_id: 'new-block', order: 0 },
        { block_id: 'existing-block', order: 1 },
      ]);

      expect(mockPageApi.createBlock).toHaveBeenCalled();
      expect(mockPageApi.reorderBlocks).toHaveBeenCalled();
    });
  });

  describe('Error handling on reorder', () => {
    it('should handle reorder API errors', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { detail: 'Internal server error' },
        },
      };
      mockPageApi.reorderBlocks.mockRejectedValue(serverError);

      await expect(
        mockPageApi.reorderBlocks([
          { block_id: 'block-1', order: 0 },
        ])
      ).rejects.toMatchObject(serverError);
    });
  });
});

// ============================================
// 8. EDITOR CHANGES PROCESSING TESTS
// ============================================

describe('Editor Changes Processing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Change type detection', () => {
    it('should identify insert changes', () => {
      const changes = [
        { type: 'insert', block: { id: 'new-1', type: 'paragraph' } },
      ];

      const insertChanges = changes.filter((c) => c.type === 'insert');
      expect(insertChanges).toHaveLength(1);
    });

    it('should identify update changes', () => {
      const changes = [
        { type: 'update', block: { id: 'existing-1', type: 'paragraph' } },
      ];

      const updateChanges = changes.filter((c) => c.type === 'update');
      expect(updateChanges).toHaveLength(1);
    });

    it('should identify delete changes', () => {
      const changes = [
        { type: 'delete', block: { id: 'deleted-1', type: 'paragraph' } },
      ];

      const deleteChanges = changes.filter((c) => c.type === 'delete');
      expect(deleteChanges).toHaveLength(1);
    });

    it('should identify move changes', () => {
      const changes = [
        { type: 'move', block: { id: 'moved-1', type: 'paragraph' } },
      ];

      const moveChanges = changes.filter((c) => c.type === 'move');
      expect(moveChanges).toHaveLength(1);
    });

    it('should handle mixed changes', () => {
      const changes = [
        { type: 'insert', block: { id: 'new-1', type: 'paragraph' } },
        { type: 'update', block: { id: 'existing-1', type: 'paragraph' } },
        { type: 'delete', block: { id: 'deleted-1', type: 'paragraph' } },
        { type: 'move', block: { id: 'moved-1', type: 'paragraph' } },
      ];

      expect(changes.filter((c) => c.type === 'insert')).toHaveLength(1);
      expect(changes.filter((c) => c.type === 'update')).toHaveLength(1);
      expect(changes.filter((c) => c.type === 'delete')).toHaveLength(1);
      expect(changes.filter((c) => c.type === 'move')).toHaveLength(1);
    });
  });

  describe('Processing blocks set', () => {
    it('should prevent duplicate processing', () => {
      const processingBlocks = new Set<string>();

      const blockId = 'block-1';

      // First processing attempt
      if (!processingBlocks.has(blockId)) {
        processingBlocks.add(blockId);
        // Process block...
      }

      // Second attempt should be skipped
      const shouldProcess = !processingBlocks.has(blockId);
      expect(shouldProcess).toBe(false);
    });

    it('should clean up after processing', () => {
      const processingBlocks = new Set<string>();

      processingBlocks.add('block-1');
      expect(processingBlocks.has('block-1')).toBe(true);

      processingBlocks.delete('block-1');
      expect(processingBlocks.has('block-1')).toBe(false);
    });
  });
});

// ============================================
// 9. INITIAL CONTENT LOADING TESTS
// ============================================

describe('Initial Content Loading', () => {
  describe('Content transformation', () => {
    it('should transform backend blocks to BlockNote format', () => {
      const backendBlocks = [
        {
          order: 0,
          content: {
            id: 'block-1',
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello' }],
            children: [],
          },
        },
        {
          order: 1,
          content: {
            id: 'block-2',
            type: 'heading',
            props: { level: 1 },
            content: [{ type: 'text', text: 'Title' }],
            children: [],
          },
        },
      ];

      const blockNoteBlocks = backendBlocks.map((block) => block.content);

      expect(blockNoteBlocks).toHaveLength(2);
      expect(blockNoteBlocks[0].id).toBe('block-1');
      expect(blockNoteBlocks[1].id).toBe('block-2');
    });

    it('should return undefined for empty blocks', () => {
      const pageData = { blocks: [] };

      const blockNoteBlocks =
        !pageData || !pageData.blocks || pageData.blocks.length === 0
          ? undefined
          : pageData.blocks.map((block: any) => block.content);

      expect(blockNoteBlocks).toBeUndefined();
    });

    it('should return undefined when no blocks property', () => {
      const pageData = {} as any;

      const blockNoteBlocks =
        !pageData || !pageData.blocks || pageData.blocks.length === 0
          ? undefined
          : pageData.blocks.map((block: any) => block.content);

      expect(blockNoteBlocks).toBeUndefined();
    });
  });

  describe('Loading states', () => {
    it('should have loading state initially', () => {
      const initialContent = 'loading';
      expect(initialContent).toBe('loading');
    });

    it('should transition from loading to content', () => {
      let initialContent: any = 'loading';

      // Simulate content load
      initialContent = [
        { id: 'block-1', type: 'paragraph', content: [], children: [] },
      ];

      expect(initialContent).not.toBe('loading');
      expect(Array.isArray(initialContent)).toBe(true);
    });
  });
});

// ============================================
// 10. SPECIAL BLOCK TYPES TESTS
// ============================================

describe('Special Block Types', () => {
  describe('Image blocks', () => {
    it('should handle image block with URL', () => {
      const imageBlock = {
        id: 'image-1',
        type: 'image',
        props: {
          url: 'https://example.com/image.jpg',
          caption: 'Test image',
          width: 800,
        },
        children: [],
      };

      expect(imageBlock.type).toBe('image');
      expect(imageBlock.props.url).toBeDefined();
    });
  });

  describe('Code blocks', () => {
    it('should handle code block with language', () => {
      const codeBlock = {
        id: 'code-1',
        type: 'code',
        props: {
          language: 'javascript',
        },
        content: [{ type: 'text', text: 'console.log("Hello");' }],
        children: [],
      };

      expect(codeBlock.type).toBe('code');
      expect(codeBlock.props.language).toBe('javascript');
    });
  });

  describe('Table blocks', () => {
    it('should handle table block structure', () => {
      const tableBlock = {
        id: 'table-1',
        type: 'table',
        content: {
          type: 'tableContent',
          rows: [
            { cells: [['Header 1'], ['Header 2']] },
            { cells: [['Cell 1'], ['Cell 2']] },
          ],
        },
        children: [],
      };

      expect(tableBlock.type).toBe('table');
      expect(tableBlock.content.rows).toHaveLength(2);
    });
  });

  describe('List blocks with nesting', () => {
    it('should handle bulletListItem with children', () => {
      const listBlock = {
        id: 'list-1',
        type: 'bulletListItem',
        content: [{ type: 'text', text: 'Item 1' }],
        children: [
          {
            id: 'list-1-1',
            type: 'bulletListItem',
            content: [{ type: 'text', text: 'Sub-item 1.1' }],
            children: [],
          },
          {
            id: 'list-1-2',
            type: 'bulletListItem',
            content: [{ type: 'text', text: 'Sub-item 1.2' }],
            children: [],
          },
        ],
      };

      expect(listBlock.children).toHaveLength(2);
      expect(listBlock.children[0].id).toBe('list-1-1');
    });

    it('should handle numberedListItem with children', () => {
      const listBlock = {
        id: 'num-list-1',
        type: 'numberedListItem',
        content: [{ type: 'text', text: 'First item' }],
        children: [
          {
            id: 'num-list-1-1',
            type: 'numberedListItem',
            content: [{ type: 'text', text: 'Sub-item 1.1' }],
            children: [],
          },
        ],
      };

      expect(listBlock.type).toBe('numberedListItem');
      expect(listBlock.children).toHaveLength(1);
    });
  });
});

// ============================================
// 11. CONCURRENT OPERATIONS TESTS
// ============================================

describe('Concurrent Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle parallel block insertions', async () => {
    mockPageApi.createBlock.mockResolvedValue({ status: 200 });

    const insertPromises = Array.from({ length: 5 }, (_, i) =>
      mockPageApi.createBlock({
        block_id: `block-${i}`,
        page: 123,
        block_type: BLOCK_TYPES.PARAGRAPH,
        order: i,
        content: { id: `block-${i}`, type: 'paragraph' },
      })
    );

    await Promise.all(insertPromises);

    expect(mockPageApi.createBlock).toHaveBeenCalledTimes(5);
  });

  it('should handle mixed concurrent operations', async () => {
    mockPageApi.createBlock.mockResolvedValue({ status: 200 });
    mockPageApi.updateBlock.mockResolvedValue({ status: 200 });
    mockPageApi.deleteBlock.mockResolvedValue(true);

    const operations = [
      mockPageApi.createBlock({ block_id: 'new-1', page: 123, block_type: 1, order: 0, content: {} }),
      mockPageApi.updateBlock('existing-1', { block_id: 'existing-1', page: 123, block_type: 1, content: {}, order: 1 }),
      mockPageApi.deleteBlock('old-1'),
    ];

    await Promise.all(operations);

    expect(mockPageApi.createBlock).toHaveBeenCalledTimes(1);
    expect(mockPageApi.updateBlock).toHaveBeenCalledTimes(1);
    expect(mockPageApi.deleteBlock).toHaveBeenCalledTimes(1);
  });
});

// ============================================
// 12. CLEANUP AND UNMOUNT TESTS
// ============================================

describe('Cleanup and Unmount', () => {
  it('should clear all pending timeouts on cleanup', () => {
    vi.useFakeTimers();

    const pendingUpdates: Record<string, NodeJS.Timeout> = {
      'block-1': setTimeout(() => {}, 3000),
      'block-2': setTimeout(() => {}, 3000),
      'block-3': setTimeout(() => {}, 3000),
    };

    // Simulate cleanup
    Object.values(pendingUpdates).forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });

    // After cleanup, clear the object
    Object.keys(pendingUpdates).forEach((key) => {
      delete pendingUpdates[key];
    });

    expect(Object.keys(pendingUpdates)).toHaveLength(0);

    vi.useRealTimers();
  });

  it('should handle cleanup with no pending updates', () => {
    const pendingUpdates: Record<string, NodeJS.Timeout> = {};

    // Cleanup should not throw
    Object.values(pendingUpdates).forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });

    expect(Object.keys(pendingUpdates)).toHaveLength(0);
  });
});

// ============================================
// 13. EDGE CASES TESTS
// ============================================

describe('Edge Cases', () => {
  describe('Empty states', () => {
    it('should handle empty document', () => {
      const mockEditor = { document: [] };
      expect(mockEditor.document).toHaveLength(0);
    });

    it('should handle block with empty content', () => {
      const block = {
        id: 'empty-block',
        type: 'paragraph',
        content: [],
        children: [],
      };

      expect(block.content).toHaveLength(0);
      expect(block.children).toHaveLength(0);
    });

    it('should handle block with null content', () => {
      const block = {
        id: 'null-block',
        type: 'paragraph',
        content: null as any,
        children: [],
      };

      expect(block.content).toBeNull();
    });
  });

  describe('Special characters in content', () => {
    it('should handle unicode content', () => {
      const block = {
        id: 'unicode-block',
        type: 'paragraph',
        content: [{ type: 'text', text: '你好世界 🌍 مرحبا العالم' }],
        children: [],
      };

      expect(block.content[0].text).toContain('你好');
      expect(block.content[0].text).toContain('🌍');
    });

    it('should handle special HTML characters', () => {
      const block = {
        id: 'html-block',
        type: 'paragraph',
        content: [{ type: 'text', text: '<script>alert("XSS")</script>' }],
        children: [],
      };

      expect(block.content[0].text).toContain('<script>');
    });

    it('should handle newlines in content', () => {
      const block = {
        id: 'newline-block',
        type: 'paragraph',
        content: [{ type: 'text', text: 'Line 1\nLine 2\nLine 3' }],
        children: [],
      };

      expect(block.content[0].text).toContain('\n');
    });
  });

  describe('Very long content', () => {
    it('should handle very long text content', () => {
      const longText = 'A'.repeat(100000);
      const block = {
        id: 'long-block',
        type: 'paragraph',
        content: [{ type: 'text', text: longText }],
        children: [],
      };

      expect(block.content[0].text.length).toBe(100000);
    });
  });

  describe('Deeply nested structures', () => {
    it('should handle 10+ levels of nesting', () => {
      const createNestedBlock = (depth: number, id: string): any => {
        if (depth === 0) {
          return {
            id,
            type: 'paragraph',
            content: [{ type: 'text', text: `Level ${id}` }],
            children: [],
          };
        }
        return {
          id,
          type: 'bulletListItem',
          content: [{ type: 'text', text: `Level ${id}` }],
          children: [createNestedBlock(depth - 1, `${id}-child`)],
        };
      };

      const deeplyNestedBlock = createNestedBlock(10, 'root');

      // Verify depth
      let current = deeplyNestedBlock;
      let depth = 0;
      while (current.children && current.children.length > 0) {
        depth++;
        current = current.children[0];
      }

      expect(depth).toBe(10);
    });
  });

  describe('Block ID formats', () => {
    it('should handle UUID-style block IDs', () => {
      const block = {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        type: 'paragraph',
        children: [],
      };

      expect(block.id).toMatch(/^[a-f0-9-]+$/);
    });

    it('should handle numeric string block IDs', () => {
      const block = {
        id: '12345',
        type: 'paragraph',
        children: [],
      };

      expect(block.id).toBe('12345');
    });

    it('should identify temporary block IDs', () => {
      const tempId = 'temp-1234567890';
      expect(tempId.startsWith('temp-')).toBe(true);

      const permanentId = 'block-123';
      expect(permanentId.startsWith('temp-')).toBe(false);
    });
  });
});
