import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileAttachment } from "@/features/portal/types";
import WordPreview from "./file-sheet/WordPreview";
import ExcelPreview from "./file-sheet/ExcelPreview";

export type PreviewFile = FileAttachment | null;

// Helper to detect file type from name
function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");
  const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  return ext;
}

// Helper to extract file ID from URL (temporary solution)
// Example: "/files/abc-123-def.xlsx" -> "abc-123-def"
function extractFileIdFromUrl(url: string): string {
  const parts = url.split("/");
  const filename = parts[parts.length - 1];
  // Remove extension
  return filename.split(".")[0] || url;
}

export const FilePreviewModal: React.FC<{
  open: boolean;
  file: PreviewFile;
  onOpenChange: (open: boolean) => void;
}> = ({ open, file, onOpenChange }) => {
  if (!file) return null;

  // Get file extension to determine preview type
  const extension = getFileExtension(file.name);

  // Determine if this is a Phase 5 file type
  const isWordFile = extension === "docx";
  const isExcelFile = extension === "xlsx" || extension === "xls";

  // Get fileId: prioritize file.id, fallback to extracting from URL
  const fileId = file.id || extractFileIdFromUrl(file.url);

  // Phase 5: Word/Excel Preview (MUST CHECK FIRST - before PDF/Image fallback)
  if (isWordFile || isExcelFile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl h-[90vh] p-0 overflow-hidden">
          {isWordFile && (
            <WordPreview
              fileId={fileId}
              fileName={file.name}
              onClose={() => onOpenChange(false)}
            />
          )}
          {isExcelFile && (
            <ExcelPreview
              fileId={fileId}
              fileName={file.name}
              onClose={() => onOpenChange(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Phase 1-4: PDF/Image Preview (fallback for non-Word/Excel files)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{file?.name || "Xem nhanh"}</DialogTitle>
        </DialogHeader>
        {file?.type === "pdf" ? (
          <iframe
            src={file.url}
            className="w-full h-[70vh] rounded-lg border"
            title="File preview"
          />
        ) : file?.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.url}
            alt={file.name}
            className="w-full h-auto rounded-lg"
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
