import React from "react";
import ImagePreviewModal from "@/components/ImagePreviewModal";
import FilePreviewModal from "@/components/FilePreviewModal";

interface ThreadPreviewModalsProps {
  previewFileId: string | null;
  previewFileName: string;
  previewImages: Array<{ fileId: string; fileName: string }>;
  previewInitialIndex: number;
  previewDisableDownload?: boolean;
  onCloseImagePreview: () => void;
  filePreviewId: string | null;
  filePreviewName: string;
  filePreviewDisableDownload?: boolean;
  onCloseFilePreview: () => void;
}

export const ThreadPreviewModals: React.FC<ThreadPreviewModalsProps> = ({
  previewFileId,
  previewFileName,
  previewImages,
  previewInitialIndex,
  previewDisableDownload = false,
  onCloseImagePreview,
  filePreviewId,
  filePreviewName,
  filePreviewDisableDownload = false,
  onCloseFilePreview,
}) => {
  return (
    <>
      {/* Image Preview Modal */}
      <ImagePreviewModal
        open={!!previewFileId}
        onOpenChange={(open) => {
          if (!open) {
            onCloseImagePreview();
          }
        }}
        fileId={previewImages.length > 0 ? null : previewFileId}
        fileName={previewFileName}
        images={previewImages.length > 0 ? previewImages : undefined}
        initialIndex={previewInitialIndex}
        disableDownload={previewDisableDownload}
      />

      {/* File Preview Modal */}
      {filePreviewId && (
        <FilePreviewModal
          isOpen={true}
          fileId={filePreviewId}
          fileName={filePreviewName}
          onClose={onCloseFilePreview}
          disableDownload={filePreviewDisableDownload}
        />
      )}
    </>
  );
};
