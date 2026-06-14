type PageEditorSyncOptions = {
  pageApi: {
    createBlock: (data: any) => Promise<any>;
    updateBlock: (id: string | number, data: any) => Promise<any>;
    deleteBlock: (id: string | number) => Promise<any>;
    reorderBlocks?: (blocksOrder: any) => Promise<any>;
  };
  getPage: () => any;
  convertBlockType: (type: string) => number;
  onError?: (message: string) => void;
  debounceMs?: number;
};

type BlockChange = {
  type: 'insert' | 'update' | 'delete' | 'move';
  block: any;
  prevBlock?: any;
  prevParent?: any;
  currentParent?: any;
  source?: { type: string };
};

export class PageEditorSync {
  private pendingUpdates = new Map<string, ReturnType<typeof setTimeout>>();
  private savedBlockIds = new Set<string>();
  private blockParentMap = new Map<string, string | null>();
  private lastEditor: any = null;
  private debounceMs: number;

  constructor(private options: PageEditorSyncOptions) {
    this.debounceMs = options.debounceMs ?? 3000;
  }

  private log(message: string, details?: any) {
    if (details !== undefined) {
      console.info(`[PageEditorSync] ${message}`, details);
    } else {
      console.info(`[PageEditorSync] ${message}`);
    }
  }

  async handleChanges(editor: any, changes: BlockChange[]) {
    if (!editor || !changes || changes.length === 0) return;
    this.lastEditor = editor;

    // Log all changes for debugging
    this.log("handleChanges", {
      count: changes.length,
      changes: changes.map((c) => ({ type: c.type, blockId: c.block?.id }))
    });

    for (const change of changes) {
      if (!change || !change.type) continue;

      switch (change.type) {
        case 'insert':
          await this.handleInsert(editor, change);
          break;
        case 'update':
          this.scheduleUpdate(editor, change.block);
          break;
        case 'delete':
          await this.handleDelete(editor, change);
          break;
        case 'move':
          await this.handleMove(editor, change);
          break;
      }
    }
  }

  async flush() {
    const editor = this.lastEditor;
    if (!editor) {
      this.clearAllPending();
      return;
    }

    const pendingIds = Array.from(this.pendingUpdates.keys());
    this.clearAllPending();

    for (const blockId of pendingIds) {
      const block = editor.getBlock(blockId);
      if (block) {
        await this.persistUpdate(editor, blockId);
      }
    }
  }

  seedBlocks(blocks: any[]) {
    if (!blocks) return;
    blocks.forEach((block: any) => {
      if (block?.block_id || block?.id) {
        const blockId = String(block.block_id || block.id);
        this.savedBlockIds.add(blockId);
      }
      if (block?.content) {
        this.buildParentMap(block.content, null);
      }
    });
    this.log("seedBlocks", { count: this.savedBlockIds.size });
  }

  dispose() {
    this.clearAllPending();
    this.lastEditor = null;
    this.savedBlockIds.clear();
    this.blockParentMap.clear();
  }

  private clearAllPending() {
    for (const timeoutId of this.pendingUpdates.values()) {
      clearTimeout(timeoutId);
    }
    this.pendingUpdates.clear();
  }

  private buildParentMap(block: any, parentId: string | null) {
    if (!block?.id) return;
    this.blockParentMap.set(block.id, parentId);
    if (block.children?.length > 0) {
      for (const child of block.children) {
        this.buildParentMap(child, block.id);
      }
    }
  }

  private rebuildParentMap(editor: any) {
    this.blockParentMap.clear();
    const topLevelBlocks = editor?.document || [];
    for (const block of topLevelBlocks) {
      this.buildParentMap(block, null);
    }
  }

  private getTopLevelBlockId(blockId: string): string | null {
    let currentId: string | null = blockId;
    let iterations = 0;
    while (currentId && iterations < 100) {
      const parentId = this.blockParentMap.get(currentId);
      if (parentId === null) return currentId; // top-level
      if (parentId === undefined) return this.savedBlockIds.has(currentId) ? currentId : null;
      currentId = parentId;
      iterations++;
    }
    return null;
  }

  private isTopLevel(blockId: string): boolean {
    return this.blockParentMap.get(blockId) === null;
  }

  private getBlockData(editor: any, blockId: string, page: any) {
    const block = editor.getBlock(blockId);
    if (!block) return null;

    const topLevelBlocks = editor?.document || [];
    const order = topLevelBlocks.findIndex((b: any) => b.id === blockId);

    return {
      block_id: blockId,
      page: page.id,
      block_type: this.options.convertBlockType(block.type),
      content: block,
      order: order !== -1 ? order : 0,
    };
  }

  private async reorder(editor: any) {
    if (typeof this.options.pageApi.reorderBlocks !== 'function') return;

    const topLevelBlocks = editor?.document || [];
    const payload = topLevelBlocks.map((block: any, index: number) => ({
      block_id: String(block.id),
      order: index,
    }));

    try {
      await this.options.pageApi.reorderBlocks(payload);
    } catch (error) {
      this.options.onError?.('Error reordering blocks');
    }
  }

  // ==================== INSERT ====================
  private async handleInsert(editor: any, change: BlockChange) {
    const page = this.options.getPage();
    if (!page) return;

    const blockId = change.block?.id;
    if (!blockId) return;

    this.rebuildParentMap(editor);

    // Already saved?
    if (this.savedBlockIds.has(blockId)) {
      this.log("handleInsert: already saved", { blockId });
      return;
    }

    if (this.isTopLevel(blockId)) {
      const blockData = this.getBlockData(editor, blockId, page);
      if (!blockData) return;

      try {
        this.log("create top-level", { blockId });
        await this.options.pageApi.createBlock(blockData);
        this.savedBlockIds.add(blockId);
        await this.reorder(editor);
      } catch (error) {
        this.options.onError?.('Error creating block');
        throw error;
      }
    } else {
      // Child - update parent
      const topId = this.getTopLevelBlockId(blockId);
      if (topId) {
        this.log("insert child -> update parent", { childId: blockId, parentId: topId });
        await this.persistUpdate(editor, topId);
      }
    }
  }

  // ==================== UPDATE ====================
  private scheduleUpdate(editor: any, block: any) {
    const blockId = typeof block === 'string' ? block : block?.id;
    if (!blockId) return;

    this.rebuildParentMap(editor);

    const topId = this.getTopLevelBlockId(blockId) || blockId;

    // Cancel existing
    const existing = this.pendingUpdates.get(topId);
    if (existing) clearTimeout(existing);

    this.log("scheduleUpdate", { blockId, topId });

    const timeoutId = setTimeout(async () => {
      this.pendingUpdates.delete(topId);
      if (!editor.getBlock(topId)) {
        this.log("block gone before update", { topId });
        return;
      }
      await this.persistUpdate(editor, topId);
    }, this.debounceMs);

    this.pendingUpdates.set(topId, timeoutId);
  }

  private async persistUpdate(editor: any, blockId: string) {
    const page = this.options.getPage();
    if (!page) return;

    const blockData = this.getBlockData(editor, blockId, page);
    if (!blockData) return;

    try {
      if (this.savedBlockIds.has(blockId)) {
        this.log("update", { blockId });
        await this.options.pageApi.updateBlock(blockId, blockData);
      } else {
        this.log("create (from update)", { blockId });
        await this.options.pageApi.createBlock(blockData);
        this.savedBlockIds.add(blockId);
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        await this.options.pageApi.createBlock(blockData);
        this.savedBlockIds.add(blockId);
        return;
      }
      this.options.onError?.('Error updating block');
      throw error;
    }
  }

  // ==================== DELETE ====================
  private async handleDelete(editor: any, change: BlockChange) {
    const blockId = change.block?.id;
    if (!blockId) return;

    // Cancel pending update
    const timeout = this.pendingUpdates.get(blockId);
    if (timeout) {
      clearTimeout(timeout);
      this.pendingUpdates.delete(blockId);
    }

    const parentId = this.blockParentMap.get(blockId);
    const topId = this.getTopLevelBlockId(blockId);

    this.blockParentMap.delete(blockId);

    if (this.savedBlockIds.has(blockId)) {
      // Top-level - delete from backend
      try {
        this.log("delete top-level", { blockId });
        await this.options.pageApi.deleteBlock(blockId);
        this.savedBlockIds.delete(blockId);
      } catch (error) {
        this.options.onError?.('Error deleting block');
        throw error;
      }
    } else if (topId && parentId !== null) {
      // Child - update parent
      this.log("delete child -> update parent", { childId: blockId, parentId: topId });
      this.rebuildParentMap(editor);
      await this.persistUpdate(editor, topId);
    }
  }

  // ==================== MOVE ====================
  private async handleMove(editor: any, change: BlockChange) {
    const page = this.options.getPage();
    if (!page) return;

    const blockId = change.block?.id;
    if (!blockId) return;

    const { prevParent, currentParent } = change;

    this.log("handleMove", {
      blockId,
      prevParentId: prevParent?.id,
      currentParentId: currentParent?.id
    });

    this.rebuildParentMap(editor);

    // Child became top-level
    if (prevParent?.id && !currentParent?.id && this.isTopLevel(blockId)) {
      if (!this.savedBlockIds.has(blockId)) {
        const blockData = this.getBlockData(editor, blockId, page);
        if (blockData) {
          this.log("child -> top-level: create", { blockId });
          await this.options.pageApi.createBlock(blockData);
          this.savedBlockIds.add(blockId);
        }
      }
      // Update old parent
      const prevTopId = this.getTopLevelBlockId(prevParent.id);
      if (prevTopId) {
        await this.persistUpdate(editor, prevTopId);
      }
    }
    // Top-level became child
    else if (!prevParent?.id && currentParent?.id && this.savedBlockIds.has(blockId)) {
      this.log("top-level -> child: delete", { blockId });
      await this.options.pageApi.deleteBlock(blockId);
      this.savedBlockIds.delete(blockId);
      // Update new parent
      const currTopId = this.getTopLevelBlockId(currentParent.id);
      if (currTopId) {
        await this.persistUpdate(editor, currTopId);
      }
    }
    // Parent changed (both have parents)
    else if (prevParent?.id && currentParent?.id) {
      const prevTopId = this.getTopLevelBlockId(prevParent.id);
      const currTopId = this.getTopLevelBlockId(currentParent.id);
      if (prevTopId) await this.persistUpdate(editor, prevTopId);
      if (currTopId && currTopId !== prevTopId) await this.persistUpdate(editor, currTopId);
    }
    // Just reorder (no parent change)
    else if (!prevParent?.id && !currentParent?.id && this.savedBlockIds.has(blockId)) {
      const blockData = this.getBlockData(editor, blockId, page);
      if (blockData) {
        this.log("reorder", { blockId });
        await this.options.pageApi.updateBlock(blockId, blockData);
      }
    }

    await this.reorder(editor);
  }
}
