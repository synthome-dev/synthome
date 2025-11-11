"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X } from "lucide-react";
import {
  Children,
  cloneElement,
  createContext,
  memo,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type FileUploadContextValue = {
  isDragging: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  multiple?: boolean;
};

const FileUploadContext = createContext<FileUploadContextValue | null>(null);

export type FileUploadProps = {
  onFilesAdded: (files: File[]) => void;
  children: React.ReactNode;
  multiple?: boolean;
  accept?: string;
};

function FileUpload({
  onFilesAdded,
  children,
  multiple = true,
  accept,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleFiles = (files: FileList) => {
    const newFiles = Array.from(files);
    if (multiple) {
      onFilesAdded(newFiles);
    } else {
      onFilesAdded(newFiles.slice(0, 1));
    }
  };

  useEffect(() => {
    const handleDrag = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragIn = (e: DragEvent) => {
      handleDrag(e);
      dragCounter.current++;
      if (e.dataTransfer?.items.length) setIsDragging(true);
    };

    const handleDragOut = (e: DragEvent) => {
      handleDrag(e);
      dragCounter.current--;
      if (dragCounter.current === 0) setIsDragging(false);
    };

    const handleDrop = (e: DragEvent) => {
      handleDrag(e);
      setIsDragging(false);
      dragCounter.current = 0;
      if (e.dataTransfer?.files.length) {
        handleFiles(e.dataTransfer.files);
      }
    };

    window.addEventListener("dragenter", handleDragIn);
    window.addEventListener("dragleave", handleDragOut);
    window.addEventListener("dragover", handleDrag);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragIn);
      window.removeEventListener("dragleave", handleDragOut);
      window.removeEventListener("dragover", handleDrag);
      window.removeEventListener("drop", handleDrop);
    };
  }, [handleFiles, onFilesAdded, multiple]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  };

  return (
    <FileUploadContext.Provider value={{ isDragging, inputRef, multiple }}>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileSelect}
        className="hidden"
        multiple={multiple}
        accept={accept}
        aria-hidden
      />
      {children}
    </FileUploadContext.Provider>
  );
}

export type FileUploadTriggerProps =
  React.ComponentPropsWithoutRef<"button"> & {
    asChild?: boolean;
  };

function FileUploadTrigger({
  asChild = false,
  className,
  children,
  ...props
}: FileUploadTriggerProps) {
  const context = useContext(FileUploadContext);
  const handleClick = () => context?.inputRef.current?.click();

  if (asChild) {
    const child = Children.only(children) as React.ReactElement<
      React.HTMLAttributes<HTMLElement>
    >;
    return cloneElement(child, {
      ...props,
      role: "button",
      className: cn(className, child.props.className),
      onClick: (e: React.MouseEvent) => {
        handleClick();
        child.props.onClick?.(e as React.MouseEvent<HTMLElement>);
      },
    });
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

type FileUploadContentProps = React.HTMLAttributes<HTMLDivElement>;

function FileUploadContent({ className, ...props }: FileUploadContentProps) {
  const context = useContext(FileUploadContext);

  return context?.isDragging ? (
    <div
      className={cn(
        "bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm",
        "animate-in fade-in-0 slide-in-from-bottom-10 zoom-in-90 duration-150",
        className,
      )}
      {...props}
    />
  ) : null;
}

const FileUploadPreview = memo(
  ({
    file,
    onRemoveFile,
    isUploading,
  }: {
    file: File;
    onRemoveFile: () => void;
    isUploading?: boolean;
  }) => {
    const handleRemove = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onRemoveFile();
    };

    const isVideo = file.type.startsWith("video/");
    const fileUrl = URL.createObjectURL(file);

    return (
      <div className="relative flex items-center justify-between gap-2 w-10 h-10">
        <div className="flex items-center gap-2 w-full">
          <Dialog>
            <DialogTrigger asChild>
              <div
                className="w-10 h-10 rounded-md bg-cover bg-center bg-no-repeat cursor-pointer hover:opacity-90 transition-opacity relative overflow-hidden"
                style={{
                  backgroundImage: !isVideo ? `url(${fileUrl})` : undefined,
                  backgroundColor: isVideo ? "#000" : undefined,
                }}
              >
                {isVideo && (
                  <video
                    src={fileUrl}
                    className="w-full h-full object-cover"
                    muted
                  />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[80vh] p-0 overflow-hidden">
              <VisuallyHidden>
                <DialogTitle>{file.name}</DialogTitle>
              </VisuallyHidden>
              {isVideo ? (
                <video
                  src={fileUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={fileUrl}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
        <Button
          type="button"
          tooltip={`Remove ${isVideo ? "video" : "image"}`}
          variant="secondary"
          size="icon-xs"
          onClick={handleRemove}
          className="absolute -top-1 -right-1"
          disabled={isUploading}
        >
          <X className="size-3" />
        </Button>
      </div>
    );
  },
);

FileUploadPreview.displayName = "FileUploadPreview";

export { FileUpload, FileUploadContent, FileUploadPreview, FileUploadTrigger };
