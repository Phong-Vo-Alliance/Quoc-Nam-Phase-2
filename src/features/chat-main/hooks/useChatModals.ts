import { useState } from "react";

export function useChatModals() {
  const [showConversationStarredModal, setShowConversationStarredModal] =
    useState(false);
  const [showAllStarredModal, setShowAllStarredModal] = useState(false);

  // Image preview modal
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>("");
  const [previewImages, setPreviewImages] = useState<
    Array<{ fileId: string; fileName: string }>
  >([]); // Phase 2.1: Gallery mode
  const [previewInitialIndex, setPreviewInitialIndex] = useState(0);

  // Phase 3.2: Unified file preview for all types (PDF, Word, Excel, PPT, TXT, Images)
  const [filePreviewId, setFilePreviewId] = useState<string | null>(null);
  const [filePreviewName, setFilePreviewName] = useState<string>("");

  const openImagePreview = (
    images: Array<{ fileId: string; fileName: string }>,
    initialIndex: number,
  ) => {
    setPreviewImages(images);
    setPreviewInitialIndex(initialIndex);
    setPreviewFileId(images[initialIndex]?.fileId || null);
  };

  const closeImagePreview = () => {
    setPreviewFileId(null);
    setPreviewImages([]);
    setPreviewInitialIndex(0);
  };

  const openFilePreview = (fileId: string, fileName: string) => {
    setFilePreviewId(fileId);
    setFilePreviewName(fileName);
  };

  const closeFilePreview = () => {
    setFilePreviewId(null);
    setFilePreviewName("");
  };

  return {
    // Starred modals
    showConversationStarredModal,
    setShowConversationStarredModal,
    showAllStarredModal,
    setShowAllStarredModal,

    // Image preview
    previewFileId,
    previewFileName,
    previewImages,
    previewInitialIndex,
    openImagePreview,
    closeImagePreview,

    // File preview
    filePreviewId,
    filePreviewName,
    openFilePreview,
    closeFilePreview,
  };
}
