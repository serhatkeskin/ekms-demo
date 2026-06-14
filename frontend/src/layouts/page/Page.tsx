import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { usePermissions } from "contexts/permissions/PermissionsContext";
import { useAuth } from "contexts/auth/AuthContext";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar/DashboardNavbar";
import Footer from "examples/Footer";
import TableOfContents from 'components/Pages/components/TableOfContents';
import MDSnackbar from "components/MDSnackbar/MDSnackbar";
import SubpagesSection from 'components/Pages/components/SubpagesSection';
import PageHeader from 'components/Pages/components/PageHeader';
import PageActions from 'components/Pages/components/PageActions';
import ConfirmDialog from 'components/Pages/components/ConfirmDialog';
import pageApi from 'services/pageApi';
import { BlockNoteView } from "@blocknote/mantine";
import {
  BlockNoteSchema,
  defaultInlineContentSpecs,
  BlockNoteEditor,
} from "@blocknote/core";
import {
  SuggestionMenuController,
  FloatingComposerController,
  BlockNoteViewEditor,
} from "@blocknote/react";
import { CommentsExtension, DefaultThreadStoreAuth } from "@blocknote/core/comments";
import { codeBlockOptions } from "@blocknote/code-block";
import { BLOCK_TYPES } from 'constants/Constants';
import 'layouts/page/Page.css';
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import Icon from "@mui/material/Icon";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

import { Mention, getMentionMenuItems, setCurrentPageContext } from "components/noteblockplugins/Mentions";
import SlideViewer from 'components/Slide/SlideViewer';
import axios from 'services/axiosInstance';
import { createThreadStore } from 'services/commentThreadStore';
import { ThreadsSidebarWithFallback } from 'components/Pages/components/Comments/ThreadsSidebarWithFallback';
import { PageEditorSync } from 'services/pageEditorSync';

const buildInitialContent = (pageData: any) => {
  const blocks = Array.isArray(pageData?.blocks) ? pageData.blocks : [];
  if (blocks.length === 0) {
    return undefined;
  }
  return [...blocks]
    .sort((a, b) => a.order - b.order)
    .map((block) => block?.content)
    .filter(Boolean);
};

// Convert BlockNote type to your backend type
function convertBlockNoteTypeToBackend(blockNoteType) {
  switch (blockNoteType) {
    case "paragraph":
      return BLOCK_TYPES.PARAGRAPH;
    case "heading":
      return BLOCK_TYPES.HEADING;
    case "bulletListItem":
      return BLOCK_TYPES.BULLETED_LIST;
    case "numberedListItem":
      return BLOCK_TYPES.NUMBERED_LIST;
    case "quote":
      return BLOCK_TYPES.QUOTE;
    case "code":
      return BLOCK_TYPES.CODE;
    case "image":
      return BLOCK_TYPES.IMAGE;
    case "callout":
      return BLOCK_TYPES.CALLOUT;
    case "table":
      return BLOCK_TYPES.TABLE;
    default:
      return BLOCK_TYPES.PARAGRAPH;
  }
}

const Page = () => {
  const [initialContent, setInitialContent] = useState<any>("loading");
  const { slug } = useParams();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [authState] = useAuth();
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const location = useLocation();
  const hasNavigatedRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [page, setPage] = useState<any>(null);
  const [threadStore, setThreadStore] = useState<any>(null);
  const [isEditorDomReady, setIsEditorDomReady] = useState(false);
  const [hasThreads, setHasThreads] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [snackbar, setSnackbar] = useState<any>({ open: false, message: '', severity: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', action: null });
  const [isSaving, setIsSaving] = useState(false);
  const [fileUploadInProgress, setFileUploadInProgress] = useState(false);
  const [editingIcon, setEditingIcon] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(page?.icon || '');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const pageContentRef = useRef<any>(null); // Ref for PDF export
  // Get authentication context to check if user is staff or has edit permission
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [blocksWithComments, setBlocksWithComments] = useState<any>({});  
  const [blockComments, setBlockComments] = useState<any>({});
  const [docs, setDocs] = useState<any>([]);
  const globalTypingTimeoutRef = useRef<any>(null);
  const pageRef = useRef<any>(null);
  const showSnackbarRef = useRef<any>(() => {});
  const syncRef = useRef<PageEditorSync | null>(null);
  const initialBlockSentRef = useRef(false);
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);
  const [uploadError, setUploadError] = useState<any>(null);
  // const memoizedDocs = useMemo(() => docs, [docs]); // probably unnecessary


  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  // Create thread store for comments when slug and user are available
  useEffect(() => {
    console.log("### Thread store useEffect - slug:", slug, "user:", authState.user);
    if (slug && authState.user) {
      // Use username as user ID since it's unique
      const userId = authState.user.username;
      console.log("### Creating thread store for user:", userId);
      const store = createThreadStore(slug, userId, 'editor');
      setThreadStore(store);
      console.log("### Thread store created:", store);
    }
  }, [slug, authState.user]);

  // Our schema with inline content specs, which contain the configs and
  // implementations for inline content  that we want our editor to use.
  const schema = BlockNoteSchema.create({
    inlineContentSpecs: {
      // Adds all default inline content.
      ...defaultInlineContentSpecs,
      // Adds the mention tag.
      mention: Mention,
    },
  });

  // Function to resolve users for comments display
  // Returns User objects with id, username, and avatarUrl
  const resolveUsers = useCallback(async (userIds: string[]): Promise<{ id: string; username: string; name: string; avatarUrl: string }[]> => {
    // Fetch user details from backend
    try {
      const response = await axios.get('/users/listusers/');
      
      // Parse response based on the provided structure: { content: { data: { results: [] } } }
      let users = [];
      if (response.data && response.data.content && response.data.content.data && Array.isArray(response.data.content.data.results)) {
        users = response.data.content.data.results;
      } else if (Array.isArray(response.data)) {
        // Fallback for standard list responses
        users = response.data;
      }
      
      // Map user IDs to user data
      return userIds.map((userId) => {
        const user = users.find((u: any) =>
          u.username === userId || u.id?.toString() === userId
        );
        if (user) {
          const userName = user.first_name && user.last_name
            ? `${user.first_name} ${user.last_name}`
            : user.username;
            
          return {
            id: userId,
            username: userName,
            name: userName, // Ensure 'name' is present for BlockNote
            avatarUrl: user.avatar || '',
          };
        }
        return {
          id: userId,
          username: userId,
          name: userId,
          avatarUrl: '',
        };
      });
    } catch (error) {
      console.error('Error resolving users:', error);
      // Return basic user info on error
      return userIds.map((userId) => ({
        id: userId,
        username: userId,
        name: userId,
        avatarUrl: '',
      }));
    }
  }, []);

  // Creates a new editor instance - updated version with proper refs
  const editor: any = useMemo(() => {
    console.log("### Creating editor with initialContent:", initialContent);
    if (initialContent === "loading") {
      return undefined;
    }

    // Build extensions array
    const extensions: any[] = [];

    // Add Comments extension if thread store is ready
    if (threadStore) {
      extensions.push(
        CommentsExtension({
          threadStore,
          resolveUsers,
        })
      );
    }

    const newEditor = BlockNoteEditor.create({
      schema,
      initialContent,
      extensions,
      uploadFile: async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await pageApi.uploadBlockFile(formData);
        console.log("File upload response:", res);
        return res.content.presigned_url;
      },
      editorOptions: {
        // Keep editor mounted and focused during updates
        onDOMBeforeInput: (e) => e.preventDefault(),
        keepInDOM: true,
        // Enhanced selection handling
        selection: {
          persistentSelection: true,
          selectionDelay: 50
        }
      }
    });    

    const blocks = newEditor.document;
    console.log("### Initial blocks:", blocks);
    
    // Handle the initial block by sending it to the backend instead of removing it
    //do if initial content is undefined
    // Do not auto-create the placeholder block on init. Let the first user edit
    // trigger the create via update fallback to avoid create/delete races.

    // Add onChange event listener for handling server synchronization
    newEditor.onChange((editor, { getChanges }) => {
      console.log("Editor updated");
      // Reset global typing timer on any change
      if (globalTypingTimeoutRef.current) {
        clearTimeout(globalTypingTimeoutRef.current);
      }
      globalTypingTimeoutRef.current = setTimeout(() => {
        console.log("Global typing stopped. Doing some actions...");
        // Optional: Add any global save logic here
      }, 15000);
      
      if (permissions.canCreatePageContent(page?.project)) {
        const newChanges = getChanges();
        console.log("New changes detected:", newChanges);
        console.debug("Editor change payload:", {
          changes: newChanges,
          topLevelBlocks: editor?.document?.map((block: any) => ({
            id: block.id,
            type: block.type,
            order: editor.document.indexOf(block),
            childCount: block.children?.length ?? 0,
          })),
        });
        if (newChanges.length > 0) {
          syncRef.current?.handleChanges(editor, newChanges);
        }
      }
    });
    
    return newEditor;
  }, [initialContent, page?.id, threadStore, resolveUsers]); // Recreate editor when thread store is ready

  useEffect(() => {
    if (threadStore && editor) {
      threadStore.setEditor?.(editor);
    }
  }, [threadStore, editor]);

  useEffect(() => {
    if (!editor || !page || initialContent !== undefined || initialBlockSentRef.current) {
      return;
    }

    const blocks = editor.document || [];
    if (blocks.length !== 1) {
      return;
    }

    if (!permissions.canCreatePageContent(page.project)) {
      return;
    }

    initialBlockSentRef.current = true;
    const initialBlock = blocks[0];
    setTimeout(() => {
      syncRef.current?.handleChanges(editor, [{ type: 'insert', block: initialBlock }]);
    }, 500);
  }, [editor, page?.id, initialContent, permissions]);

  useEffect(() => {
    setIsEditorDomReady(false);
    if (!editor || typeof window === "undefined") {
      return;
    }
    let rafId: number | null = null;
    const checkDom = () => {
      const dom = (editor as any).domElement;
      if (dom && dom.parentElement) {
        setIsEditorDomReady(true);
        return;
      }
      rafId = window.requestAnimationFrame(checkDom);
    };
    checkDom();
    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [editor]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const badge = target?.closest?.(".bn-comment-add-reaction");
      if (!badge) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();

      const thread = badge.closest(".bn-thread");
      const trigger = thread?.querySelector(
        'button[data-test="addreaction"]'
      ) as HTMLButtonElement | null;
      trigger?.click();
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, []);

  const appliedThreadMarksRef = useRef<Set<string>>(new Set());

  const documentHasThreadMark = useCallback((threadId: string) => {
    const pmState = (editor as any)?._tiptapEditor?.state;
    if (!pmState) {
      return false;
    }
    let found = false;
    pmState.doc.descendants((node: any) => {
      if (!node.isText || found) {
        return !found;
      }
      for (const mark of node.marks || []) {
        if (mark.type?.name === "comment" && mark.attrs?.threadId === threadId) {
          found = true;
          break;
        }
      }
      return !found;
    });
    return found;
  }, [editor]);

  const findTextRange = useCallback((text: string) => {
    const pmState = (editor as any)?._tiptapEditor?.state;
    if (!pmState || !text) {
      return undefined;
    }
    const doc = pmState.doc;
    const fullText = doc.textBetween(0, doc.content.size, "");
    const startIndex = fullText.indexOf(text);
    if (startIndex === -1) {
      return undefined;
    }
    const endIndex = startIndex + text.length;
    let currentIndex = 0;
    let from: number | undefined;
    let to: number | undefined;

    doc.descendants((node: any, pos: number) => {
      if (!node.isText) {
        return true;
      }
      const nodeText = node.text || "";
      const nextIndex = currentIndex + nodeText.length;

      if (from === undefined && startIndex < nextIndex) {
        from = pos + (startIndex - currentIndex);
      }
      if (from !== undefined && endIndex <= nextIndex) {
        to = pos + (endIndex - currentIndex);
        return false;
      }

      currentIndex = nextIndex;
      return true;
    });

    if (from !== undefined && to !== undefined && from < to) {
      return { from, to };
    }
    return undefined;
  }, [editor]);

  const applyThreadMark = useCallback((threadId: string, range: { from: number; to: number }) => {
    const pmView = (editor as any)?._tiptapEditor?.view;
    const pmState = (editor as any)?._tiptapEditor?.state;
    if (!pmView || !pmState) {
      return;
    }
    const markType = pmState.schema.marks.comment;
    if (!markType || range.from >= range.to) {
      return;
    }
    const tr = pmState.tr.addMark(range.from, range.to, markType.create({ threadId }));
    if (tr.docChanged) {
      pmView.dispatch(tr);
    }
  }, [editor]);

  useEffect(() => {
    if (!threadStore || !editor) {
      return;
    }
    const unsubscribe = threadStore.subscribe((threads: any) => {
      const pmState = (editor as any)?._tiptapEditor?.state;
      if (!pmState) {
        return;
      }
      threads.forEach((thread: any, threadId: string) => {
        if (appliedThreadMarksRef.current.has(threadId)) {
          return;
        }
        if (documentHasThreadMark(threadId)) {
          appliedThreadMarksRef.current.add(threadId);
          return;
        }
        const metadata = thread.metadata || {};
        const from = metadata.referenceFrom;
        const to = metadata.referenceTo;
        let range: { from: number; to: number } | undefined;

        if (typeof from === "number" && typeof to === "number" && from < to && pmState.doc.nodeSize >= to) {
          const textAtRange = pmState.doc.textBetween(from, to).trim();
          if (!metadata.referenceText || textAtRange === metadata.referenceText) {
            range = { from, to };
          }
        } else if (typeof metadata.referenceText === "string" && metadata.referenceText.length > 0) {
          range = findTextRange(metadata.referenceText);
        }

        if (range) {
          applyThreadMark(threadId, range);
          appliedThreadMarksRef.current.add(threadId);
        }
      });
    });
    return unsubscribe;
  }, [threadStore, editor, documentHasThreadMark, findTextRange, applyThreadMark]);

  useEffect(() => {
    if (!threadStore) {
      setHasThreads(false);
      return;
    }
    const unsubscribe = threadStore.subscribe((threads: any) => {
      setHasThreads(threads.size > 0);
    });
    return unsubscribe;
  }, [threadStore]);

  // Set the current page context for mentions
  useEffect(() => {
    let isMounted = true;
    
    const loadProjectPermissions = async () => {
      if (page && page.project && isMounted) {
        try {
          setPermissionsLoading(true);
          // Set active project with an await to ensure it completes
          await permissions.setActiveProject(page.project);
          if (isMounted) {
            setPermissionsLoading(false);
          }
        } catch (err) {
          console.error('Error loading project permissions:', err);
          if (isMounted) {
            setPermissionsLoading(false);
          }
        }
      }
    };
    
    // Only load permissions when page.project changes
    if (page && page.project) {
      loadProjectPermissions();
    }
    
    return () => {
      isMounted = false;
    };
    // Only depend on page.project, not the entire permissions object
  }, [page?.project]);

  // Add a separate cleanup effect
  useEffect(() => {
    return () => {
      // This ensures it only runs on unmount
      permissions.clearPermissions();
    };
  }, [permissions.clearPermissions]);
  
  const fetchPageData = async () => {
    try {
      setLoading(true);
      setError(null);
      setInitialContent("loading");
      
      // Fetch page with all its blocks
      const pageData: any = (await pageApi.getPage(slug) as any).content;
      // console.log("### pageData:", pageData);
      setPage(pageData);
      syncRef.current?.seedBlocks(pageData?.blocks || []);
      setTitle(pageData.title);
      setInitialContent(buildInitialContent(pageData));
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching page:', err);
      setError('Failed to load page. Please try again later.');
      setLoading(false);
    }
  };

  // Fetch page data on mount
  useEffect(() => {
    if (slug) {
      fetchPageData();
      pageApi.getMediaContentsByPage(slug).then((media) => {
        console.log("### media:", media)
        setDocs(media.map(transformMediaToDoc));
      });
    }
    console.log("### docs:", docs)
  }, [slug]);

  // Handle saving a page title
  const saveTitle = async () => {
    // If user doesn't have edit permission, do nothing
    if (!permissions.canCreatePageContent(page.project)) return;
    
    try {
      setIsSaving(true);
      
      if (page) {
        // Send the update request to the API
        const response = await pageApi.updatePage(slug, {
          title: title
        });
        
        // Update local state with the updated page
        // Extract the actual page data from the response
        const updatedPage = response.content || response;
        
        setPage(updatedPage);
        setEditingTitle(false);
        
        // Check if the slug has changed and update the URL
        if (updatedPage.slug && updatedPage.slug !== slug) {
          // console.log('Slug changed from', slug, 'to', updatedPage.slug);
          
          // Show snackbar first
          showSnackbar('Title updated successfully! Redirecting to new URL...', 'success');
          
          // Wait 2 seconds to let user see the snackbar, then navigate
          setTimeout(() => {
            navigate(`/pages/${updatedPage.slug}`, { replace: true });
          }, 2000);
        } else {
          // No slug change, show snackbar normally
          showSnackbar('Title updated successfully', 'success');
        }
      }
    } catch (err) {
      console.error('Error updating title:', err);
      showSnackbar('Failed to update title', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle dialog confirmation
  const confirmAction = () => {
    if (confirmDialog.action) {
      confirmDialog.action();
    }
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  // Clone the current page
  const clonePage = () => {
    if (!permissions.canClonePages(page.project)) {
      showSnackbar('You do not have permission to clone pages', 'error');
      return;
    }
    setConfirmDialog({
      open: true,
      title: 'Clone Page',
      message: 'Are you sure you want to create a copy of this page?',
      action: async () => {
        try {
          setIsSaving(true);
          
          // Clone the page on the server
          const clonedPage = await pageApi.clonePage(slug);
          showSnackbar('Page cloned successfully', 'success');
          
          // Navigate to the new page
          navigate(`/pages/${clonedPage.slug}`);
        } catch (err) {
          console.error('Error cloning page:', err);
          showSnackbar('Failed to clone page', 'error');
        } finally {
          setIsSaving(false);
        }
      }
    });
  };

  // Add function to handle cover image upload
  const handleCoverImageChange = async (file) => {
    if (!permissions.canUploadFiles(page.project) || !file) return;
    
    // Check file size - limit to 5MB
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      showSnackbar('Cover image is too large. Maximum size is 5MB.', 'error');
      return;
    }
    
    try {
      setIsUploadingCover(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('cover_image', file);
      
      // Use the pageApi.updatePage function instead of direct fetch
      const response = await pageApi.updatePage(slug, formData);
      
      // Update the page state with the new cover image URL
      // Handle different possible response structures
      let coverImageUrl;
      if (response.content && response.content.cover_image) {
        coverImageUrl = response.content.cover_image;
      } else if (response.cover_image) {
        coverImageUrl = response.cover_image;
      }
      
      if (coverImageUrl) {
        setPage(prevPage => ({
          ...prevPage,
          cover_image: coverImageUrl
        }));
        
        showSnackbar('Cover image updated successfully', 'success');
      } else {
        throw new Error('Cover image URL not found in response');
      }
    } catch (err) {
      console.error('Error uploading cover image:', err);
      showSnackbar('Failed to upload cover image: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsUploadingCover(false);
    }
  };

  // Function to get snackbar details based on severity
  const getSnackbarDetails = (severity) => {
    switch (severity) {
      case 'success':
        return { 
          icon: <Icon fontSize="small">check_circle</Icon>, 
          title: 'Success' 
        };
      case 'error':
        return { 
          icon: <Icon fontSize="small">error</Icon>, 
          title: 'Error' 
        };
      default:
        return { 
          icon: <Icon fontSize="small">info</Icon>, 
          title: 'Info' 
        };
    }
  };
  
  // Function to show snackbar with message and severity
  const showSnackbar = (message, severity) => {
    const { icon, title } = getSnackbarDetails(severity);
    setSnackbar({
      open: true,
      message,
      severity,
      icon,
      title,
      dateTime: new Date().toLocaleString(),
    });
  };

  useEffect(() => {
    showSnackbarRef.current = showSnackbar;
  }, [showSnackbar]);

  useEffect(() => {
    syncRef.current = new PageEditorSync({
      pageApi,
      getPage: () => pageRef.current,
      convertBlockType: convertBlockNoteTypeToBackend,
      onError: (message) => showSnackbarRef.current(message, 'error'),
    });

    return () => {
      void syncRef.current?.flush();
      syncRef.current?.dispose();
      syncRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePageHide = () => {
      void syncRef.current?.flush();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void syncRef.current?.flush();
      }
    };
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Add icon save handler
  const saveIcon = async (newIcon) => {
    if (!permissions.canCreatePageContent(page.project)) return;
    
    try {
      setIsSaving(true);
      const response = await pageApi.updatePage(slug, {
        icon: newIcon
      });
      setPage(prev => ({...prev, icon: newIcon}));
      showSnackbar('Icon updated successfully', 'success');
    } catch (err) {
      console.error('Error updating icon:', err);
      showSnackbar('Failed to update icon', 'error');
    } finally {
      setIsSaving(false);
      setEditingIcon(false);
    }
  };
  
  // Function to handle snapshot restoration
  const handleSnapshotRestored = async () => {
    try {
      showSnackbar('Page restored from snapshot successfully', 'success');

      // Short delay to allow snackbar to be seen before refresh
      setTimeout(() => {
        // Simply refresh the page to load the restored content
        window.location.reload();
      }, 1000);

    } catch (err) {
      console.error('Error after snapshot restore:', err);
      showSnackbar('Page restored, refreshing page...', 'warning');
      window.location.reload();
    }
  };

  // Function to refresh editor content from server
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshEditor = async () => {
    try {
      setIsRefreshing(true);

      // Re-fetch page data
      await fetchPageData();

      showSnackbar('Editor refreshed successfully', 'success');
    } catch (err) {
      console.error('Error refreshing editor:', err);
      showSnackbar('Failed to refresh editor', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load block comments on initial page load - add this useEffect
  useEffect(() => {
    if (!loading && page) {
      const fetchBlockComments = async () => {
        try {
          // Fetch block comments from API
          const response = await pageApi.getPageComments(slug, { type: 'block' });
          const comments = response.content || [];
          
          // Group comments by block ID
          const commentsByBlock = {};
          comments.forEach(comment => {
            if (comment.block) {
              if (!commentsByBlock[comment.block]) {
                commentsByBlock[comment.block] = [];
              }
              commentsByBlock[comment.block].push(comment);
            }
          });
          
          // Store the comments grouped by block ID
          setBlockComments(commentsByBlock);
          
          // Update comment counts for UI indicators
          const counts: any = {};
          Object.entries(commentsByBlock).forEach(([blockId, blockComments]: any) => {
            counts[blockId] = blockComments.length;
          });
          
          setBlocksWithComments(counts);
        } catch (err) {
          console.error('Error loading block comments:', err);
        }
      };
      
      fetchBlockComments();
    }
  }, [loading, page, slug]);

  // Function to perform the navigation
  const navigateToBlock = (blockId) => {
    const blockElement = document.querySelector(`[data-id="${blockId}"]`);
    
    if (blockElement) {
      console.log("Found block:", blockId);
      
      // Try multiple scroll approaches to ensure one works
      // 1. Try using editor API if available
      try {
        if (editor && typeof editor.selectBlock === 'function') {
          editor.selectBlock(blockId);
        }
      } catch (error) {}
      
      // 2. Try to scroll multiple possible containers
      [
        document.querySelector('.blocknote-editor-container'),
        document.querySelector('.page-content'),
        document.documentElement
      ].forEach(container => {
        if (!container) return;
        
        try {
          const rect = blockElement.getBoundingClientRect();
          const scrollY = window.scrollY || window.pageYOffset;
          const absoluteTop = rect.top + scrollY;
          
          // Try to scroll the container
          container.scrollTop = absoluteTop - (container.clientHeight / 2);
          
          // Also try window scrolling as a fallback
          window.scrollTo(0, absoluteTop - (window.innerHeight / 2));
        } catch (error) {}
      });
      
      return true;
    }
    return false;
  };

  const transformMediaToDoc = (item) => {
    const uri = item.file;
    const fileName = item.name || uri?.split("/").pop() || "document";
    const fileType = fileName.includes(".")
      ? fileName.split(".").pop().toLowerCase()
      : undefined;

    return {
      uri,
      fileName,
      // fileType,
    };
  };

  const handleFileUpload = useCallback(async (file) => {
    setIsUploadingDocs(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("page_slug", slug);
    formData.append("name", file.name);

    try {
      const response = await axios.post("pages/mediacontents/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadedFile = response.data.content;
      setDocs((prev) => [...prev, transformMediaToDoc(uploadedFile)]);
      showSnackbar("File uploaded successfully", "success");
    } catch (error) {
      console.error("Upload failed:", error);
      const msg = error?.response?.data?.status_message || error.message || "Failed to upload file";
      setUploadError(msg);
      showSnackbar(msg, "error");
    } finally {
      setIsUploadingDocs(false);
    }
  }, [slug]);

  // Enhanced BlockNote navigation with same-page detection
  useEffect(() => {
    // Track the current and previous hash for same-page navigation detection
    const currentHash = location.hash;
    
    // Check if we have a hash and the editor is loaded
    if (currentHash && !loading && editor) {
      const blockId = currentHash.replace('#', '');
      
      // Key change: For same-page navigation, reset the navigation flag immediately
      // This ensures we always try to navigate again, even if we were already on this page
      hasNavigatedRef.current = false;
      
      // Try to navigate now
      let navigated = navigateToBlock(blockId);
      
      // Retry with increasing delays if the first attempt failed
      if (!navigated) {
        [200, 500, 1000].forEach(delay => {
          setTimeout(() => {
            if (!hasNavigatedRef.current) {
              const success = navigateToBlock(blockId);
              if (success) {
                hasNavigatedRef.current = true;
              }
            }
          }, delay);
        });
      } else {
        hasNavigatedRef.current = true;
      }
    } else {
      // Reset the flag when hash is empty
      hasNavigatedRef.current = false;
    }
    
    // Add a listener for hash changes to handle manual URL changes
    const handleHashChange = () => {
      if (location.hash) {
        const blockId = location.hash.replace('#', '');
        hasNavigatedRef.current = false; // Reset flag to force navigation
        setTimeout(() => navigateToBlock(blockId), 100);
      }
    };
    
    // Add hash change listener for manual URL changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      // Clean up
      window.removeEventListener('hashchange', handleHashChange);
      
      if (!location.hash) {
        hasNavigatedRef.current = false;
      }
    };
  }, [location.hash, loading, editor, location.pathname]);

  // Inside your Page component, add this useEffect to set the page context
  useEffect(() => {
    if (page) {
      // Pass the page data to the mentions component
      setCurrentPageContext({
        id: page.id,
        slug: page.slug,
        title: page.title
      });
      
      // Add data attributes to the page element to help with DOM extraction
      const pageContainer = document.querySelector('.page-content');
      if (pageContainer) {
        pageContainer.setAttribute('data-page-id', page.id);
        pageContainer.setAttribute('data-page-slug', page.slug);
      }
    }
  }, [page]);

  // Alternative approach: Add a function to the Page component to pass to the BlockNoteView
  const mentionContextProvider = {
    getPageContext: () => {
      if (!page) return null;
      return {
        id: page.id,
        slug: page.slug,
        title: page.title
      };
    },
    getCurrentBlock: () => {
      if (!editor) return null;
      try {
        const selection = editor.getSelection();
        if (selection && selection.blocks.length > 0) {
          return selection.blocks[0].id;
        }
      } catch (e) {
        console.error("Error getting current block:", e);
      }
      return null;
    }
  };

  const StatusScreen = ({ message }: any) => (
  <DashboardLayout>
    <DashboardNavbar />
    <div className={message.includes("error") ? "page-error" : "page-loading"}>
      {message}
    </div>
    <Footer />
  </DashboardLayout>
);

if (loading) return <StatusScreen message="Loading page content..." />;
if (error) return <StatusScreen message={error} />;
if (!page) return <StatusScreen message="Page not found" />;
if (editor === undefined) return <StatusScreen message="Loading editor content..." />;


  return (
    <DashboardLayout>
      <DashboardNavbar breadcrumbs={page?.breadcrumbs || []} />
      <div className="page-content-container">
        {/* Page Actions Toolbar */}
        <PageActions
          slug={slug}
          pageTitle={page.title}
          contentRef={pageContentRef}
          hasCoverImage={!!page.cover_image}
          isSaving={isSaving}
          clonePage={clonePage}
          onSnapshotRestored={handleSnapshotRestored}
          canClone={permissions.canClonePages(page.project)}
          canExport={permissions.canExportPages(page.project)}
          canCreateSnapshots={permissions.canEditPageContent(page.project)}
          editor={editor}
          refreshEditor={refreshEditor}
          isRefreshing={isRefreshing}
        />
        <div className="page-content" ref={pageContentRef}>
          {/* Page Header with Title, Icon, Status */}
          <PageHeader
            page={page}
            title={title}
            setTitle={setTitle}
            editingTitle={editingTitle}
            setEditingTitle={setEditingTitle}
            editingIcon={editingIcon}
            setEditingIcon={setEditingIcon}
            showEmojiPicker={showEmojiPicker}
            setShowEmojiPicker={setShowEmojiPicker}
            saveIcon={saveIcon}
            saveTitle={saveTitle}
            handleCoverImageChange={handleCoverImageChange}
            isUploadingCover={isUploadingCover}
            canEdit={permissions.canCreatePageContent(page.project)}
          />

          {/* Slide Viewer - always on top of the title */}
          <SlideViewer 
            docs={docs} 
            handleFileUpload={handleFileUpload}
            loading={isUploadingDocs}
            error={uploadError}
          />

          {/* Table of Contents */}
          {editor && (
            <TableOfContents 
              editor={editor} 
              title={page.title} 
              onNavigate={navigateToBlock}
            />
          )}
          {/* BlockNote Editor */}
          <div className="blocknote-editor-container">
            {/* @ts-ignore - BlockNoteView customProps not in types */}
            <BlockNoteView
              editor={editor}
              editable={permissions.canCreatePageContent(page?.project)}
              theme="light"
              slashMenu={true}
              filePanel={true}
              formattingToolbar={true}
              linkToolbar={true}
              sideMenu={true}
              emojiPicker={true}
              comments={false}
              renderEditor={false}
            >
              {/* Manually render the editor when using sidebar comments */}
              <BlockNoteViewEditor editable={permissions.canCreatePageContent(page?.project)} />

              {/* @ts-ignore - SuggestionMenuController props mismatch */}
              <SuggestionMenuController
                triggerCharacter="@"
                getItems={async (query: any) => {
                  return await getMentionMenuItems(editor, query, mentionContextProvider);
                }}
              />
              {/* Floating composer for creating new comments */}
              {threadStore && isEditorDomReady && <FloatingComposerController />}

              {/* Comments Sidebar - Fixed position in right blank area */}
              {threadStore && isEditorDomReady && hasThreads && (
                <Box
                  className="comments-sidebar-fixed"
                  sx={{
                    position: 'fixed',
                    top: '210px', // Aligned with the page title
                    right: '24px',
                    width: '380px', // Wider as requested
                    maxHeight: 'calc(100vh - 230px)', // Prevent viewport overflow
                    overflowY: 'auto',
                    zIndex: 100,
                    display: { xs: 'none', xl: 'block' }, // Only show on very large screens to avoid overlap
                  }}
                >
                  <ThreadsSidebarWithFallback filter="all" />
                </Box>
              )}
            </BlockNoteView>
          </div>

          {/* Sub Pages /Child Pages (optional) */}
          <SubpagesSection
            currentPageId={page.id}
            slug={slug}
            projectId={page.project} // Pass the project ID from the current page
            onSubpageCreated={(newPage) => {
              // Update the local page state to include the new subpage
              // This ensures we don't need to refresh to see the new subpage
              setPage(prevPage => ({
                ...prevPage,
                children: [...(prevPage.children || []), newPage]
              }));

              // Show a success message
              showSnackbar('Subpage created successfully', 'success');
            }}
            onSubpageDeleted={(deletedPageId) => {
              // Remove the deleted subpage from local state
              setPage(prevPage => ({
                ...prevPage,
                children: (prevPage.children || []).filter(child => child.id !== deletedPageId)
              }));

              // Show a success message
              showSnackbar('Subpage deleted successfully', 'success');
            }}
          >
            {page.children}
          </SubpagesSection>
        </div>
        
        {/* Confirmation Dialog */}
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmAction}
          onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
        />
        
        {/* Snackbar for notifications */}
        {snackbar.open && (
          <MDSnackbar
            color={snackbar.severity}
            icon={snackbar.icon}
            title={snackbar.title}
            dateTime={snackbar.dateTime}
            content={snackbar.message}
            close={() => setSnackbar(prev => ({ ...prev, open: false }))}
            open={snackbar.open}
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          />
        )}
        
        {/* Saving indicator */}
        {isSaving && (
          <div className="saving-indicator">
            <CircularProgress size={20} />
            <span>Saving...</span>
          </div>
        )}
      </div>
      <Footer />
    </DashboardLayout>
  );
};

export default Page;
