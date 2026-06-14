// Block types (matching backend)
export const BLOCK_TYPES = {
  PARAGRAPH: 1,
  HEADING: 2,
  IMAGE: 3,
  VIDEO: 4,
  AUDIO: 5,
  FILE: 6,
  CODE: 7,
  BULLETED_LIST: 8,
  NUMBERED_LIST: 9,
  CHECK_LIST: 10,
  QUOTE: 11,
  DIVIDER: 12,
  CALLOUT: 13,
  TABLE: 14,
} as const;

export const PAGE_STATUS = {
  DRAFT: 1,
  PUBLIC: 2,
  PRIVATE: 3,
} as const;

export const PROJECT_STATUS = PAGE_STATUS;

export type BlockType = typeof BLOCK_TYPES[keyof typeof BLOCK_TYPES];
export type PageStatusType = typeof PAGE_STATUS[keyof typeof PAGE_STATUS];

const Constants = {
  BLOCK_TYPES,
  PAGE_STATUS,
  PROJECT_STATUS,
};

export default Constants;
