import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface ObjectUploaderProps {
  onFileSelected: (file: File) => void;
  isUploading?: boolean;
  acceptedFileTypes?: string;
  maxFileSize?: number;
  buttonClassName?: string;
  children?: ReactNode;
}

/**
 * A simple file upload component for selecting and uploading files.
 * This is a lightweight alternative to the full Uppy integration.
 */
export function ObjectUploader({
  onFileSelected,
  isUploading = false,
  acceptedFileTypes = "image/*",
  maxFileSize = 10485760, // 10MB default
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file.size > maxFileSize) {
      alert(`File size must be less than ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`);
      return;
    }
    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div>
      <input
        type="file"
        accept={acceptedFileTypes}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        style={{ display: 'none' }}
        id="file-upload"
        disabled={isUploading}
      />
      
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 mb-2">
          Drag and drop your image here, or click to select
        </p>
        <Button
          type="button"
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={isUploading}
          className={buttonClassName}
        >
          {isUploading ? 'Uploading...' : (children || 'Select Image')}
        </Button>
      </div>
    </div>
  );
}