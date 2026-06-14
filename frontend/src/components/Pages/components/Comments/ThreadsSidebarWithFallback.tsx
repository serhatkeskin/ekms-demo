import { BlockNoteEditor, UnreachableCaseError } from "@blocknote/core";
import { CommentsExtension } from "@blocknote/core/comments";
import { ThreadData } from "@blocknote/core/comments";
import React, { FocusEvent, useCallback, useMemo } from "react";
import {
  Thread,
  getReferenceText as getDefaultReferenceText,
  useBlockNoteEditor,
  useExtension,
  useExtensionState,
  useThreads,
} from "@blocknote/react";

type ThreadItemProps = {
  thread: ThreadData;
  selectedThreadId?: string;
  editor: BlockNoteEditor<any, any, any>;
  maxCommentsBeforeCollapse?: number;
  referenceText: string;
};

const ThreadItem = React.memo(
  ({
    thread,
    selectedThreadId,
    maxCommentsBeforeCollapse,
    referenceText,
  }: ThreadItemProps) => {
    const comments = useExtension(CommentsExtension);

    const onFocus = useCallback(
      (event: FocusEvent) => {
        if ((event.target as HTMLElement).closest(".bn-action-toolbar")) {
          return;
        }

        comments.selectThread(thread.id);
      },
      [comments, thread.id]
    );

    const onBlur = useCallback(
      (event: React.FocusEvent) => {
        if (!event.relatedTarget || event.relatedTarget.closest(".bn-action-toolbar")) {
          return;
        }

        const targetElement = event.target instanceof Node ? event.target : null;
        const parentThreadElement =
          event.relatedTarget instanceof Node
            ? event.relatedTarget.closest(".bn-thread")
            : null;

        if (
          !targetElement ||
          !parentThreadElement ||
          !parentThreadElement.contains(targetElement)
        ) {
          comments.selectThread(undefined);
        }
      },
      [comments]
    );

    return (
      <Thread
        thread={thread}
        selected={thread.id === selectedThreadId}
        referenceText={referenceText}
        maxCommentsBeforeCollapse={maxCommentsBeforeCollapse}
        onFocus={onFocus}
        onBlur={onBlur}
        tabIndex={0}
      />
    );
  }
);

function sortThreads(
  threads: ThreadData[],
  sort: "position" | "recent-activity" | "oldest",
  threadPositions?: Map<string, { from: number; to: number }>
) {
  if (sort === "recent-activity") {
    return threads.sort(
      (a, b) =>
        b.comments[b.comments.length - 1].createdAt.getTime() -
        a.comments[a.comments.length - 1].createdAt.getTime()
    );
  }

  if (sort === "oldest") {
    return threads.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  if (sort === "position") {
    return threads.sort((a, b) => {
      const threadA = threadPositions?.get(a.id)?.from || Number.MAX_VALUE;
      const threadB = threadPositions?.get(b.id)?.from || Number.MAX_VALUE;

      return threadA - threadB;
    });
  }

  throw new UnreachableCaseError(sort);
}

function toPreviewText(text: string) {
  if (text.length > 15) {
    return `${text.slice(0, 15)}…`;
  }
  return text;
}

function getFallbackReferenceText(thread: ThreadData) {
  const metadata = thread.metadata as { referenceText?: string } | undefined;
  if (!metadata?.referenceText) {
    return undefined;
  }
  return toPreviewText(metadata.referenceText);
}

export function ThreadsSidebarWithFallback(props: {
  filter?: "open" | "resolved" | "all";
  maxCommentsBeforeCollapse?: number;
  sort?: "position" | "recent-activity" | "oldest";
}) {
  const editor = useBlockNoteEditor<any, any, any>();

  const { selectedThreadId, threadPositions } = useExtensionState(CommentsExtension);

  const threads = useThreads();

  const filteredAndSortedThreads = useMemo(() => {
    const threadsArray = Array.from(threads.values());

    const sortedThreads = sortThreads(
      threadsArray,
      props.sort || "position",
      threadPositions
    );

    const ret: Array<{ thread: ThreadData; referenceText: string }> = [];

    for (const thread of sortedThreads) {
      const referenceText = getDefaultReferenceText(
        editor,
        threadPositions.get(thread.id)
      );
      const fallbackText = getFallbackReferenceText(thread);
      const resolvedReferenceText =
        referenceText && referenceText !== "Original content deleted"
          ? referenceText
          : fallbackText || referenceText;

      if (!thread.resolved) {
        if (props.filter === "open" || props.filter === "all") {
          ret.push({
            thread,
            referenceText: resolvedReferenceText,
          });
        }
      } else {
        if (props.filter === "resolved" || props.filter === "all") {
          ret.push({
            thread,
            referenceText: resolvedReferenceText,
          });
        }
      }
    }

    return ret;
  }, [threads, props.sort, props.filter, threadPositions, editor]);

  return (
    <div className="bn-threads-sidebar">
      {filteredAndSortedThreads.map((thread) => (
        <ThreadItem
          key={thread.thread.id}
          thread={thread.thread}
          selectedThreadId={selectedThreadId}
          editor={editor}
          referenceText={thread.referenceText}
          maxCommentsBeforeCollapse={props.maxCommentsBeforeCollapse}
        />
      ))}
    </div>
  );
}
