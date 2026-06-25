import { useState } from "react";
import type { PreviewOpenOptions } from "@/types/messages";

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
  // Chặn tải về cho ảnh đang xem (vd: xem lại đính kèm tin đã thu hồi).
  const [previewDisableDownload, setPreviewDisableDownload] = useState(false);

  // Phase 3.2: Unified file preview for all types (PDF, Word, Excel, PPT, TXT, Images)
  const [filePreviewId, setFilePreviewId] = useState<string | null>(null);
  const [filePreviewName, setFilePreviewName] = useState<string>("");
  // Chặn tải về cho file đang xem (vd: xem lại đính kèm tin đã thu hồi).
  const [filePreviewDisableDownload, setFilePreviewDisableDownload] =
    useState(false);

  const openImagePreview = (
    images: Array<{ fileId: string; fileName: string }>,
    initialIndex: number,
    options?: PreviewOpenOptions,
  ) => {
    setPreviewImages(images);
    setPreviewInitialIndex(initialIndex);
    setPreviewFileId(images[initialIndex]?.fileId || null);
    setPreviewDisableDownload(!!options?.disableDownload);
  };

  const closeImagePreview = () => {
    setPreviewFileId(null);
    setPreviewImages([]);
    setPreviewInitialIndex(0);
    setPreviewDisableDownload(false);
  };

  const openFilePreview = (
    fileId: string,
    fileName: string,
    options?: PreviewOpenOptions,
  ) => {
    setFilePreviewId(fileId);
    setFilePreviewName(fileName);
    setFilePreviewDisableDownload(!!options?.disableDownload);
  };

  const closeFilePreview = () => {
    setFilePreviewId(null);
    setFilePreviewName("");
    setFilePreviewDisableDownload(false);
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
    previewDisableDownload,
    openImagePreview,
    closeImagePreview,

    // File preview
    filePreviewId,
    filePreviewName,
    filePreviewDisableDownload,
    openFilePreview,
    closeFilePreview,
  };
}
