import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  onImageSelect: (file: File, preview: string) => void | Promise<void>;
  selectedImage: string | null;
  onClear: () => void;
}

/**
 * ImageUpload Component
 * Drag and drop or click to upload garbage bin images for AI analysis
 */
const ImageUpload = ({ onImageSelect, selectedImage, onClear }: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        onImageSelect(file, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageSelect]);

  // Handle file input change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onImageSelect(file, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageSelect]);

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Upload area container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative overflow-hidden rounded-2xl border-2 border-dashed
          transition-all duration-300 cursor-pointer group
          ${isDragging 
            ? "border-primary bg-primary/10 scale-[1.02]" 
            : selectedImage 
              ? "border-primary/50 bg-card/40" 
              : "border-muted-foreground/30 hover:border-primary/50 bg-card/20 hover:bg-card/40"
          }
        `}
      >
        {/* Animated glow effect */}
        <div className={`
          absolute inset-0 opacity-0 transition-opacity duration-300
          ${isDragging ? "opacity-100" : "group-hover:opacity-50"}
        `}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 shimmer" />
        </div>

        {/* Content */}
        {selectedImage ? (
          // Image preview
          <div className="relative p-4">
            <img
              src={selectedImage}
              alt="Selected garbage bin"
              className="w-full h-64 object-contain rounded-xl"
            />
            {/* Clear button */}
            <Button
              variant="neon-outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute top-6 right-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          // Upload prompt
          <label className="block p-12 text-center cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {/* Upload icon with glow */}
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-glow-pulse" />
              <div className="relative bg-primary/20 p-6 rounded-full border border-primary/50">
                {isDragging ? (
                  <ImageIcon className="w-12 h-12 text-primary" />
                ) : (
                  <Upload className="w-12 h-12 text-primary" />
                )}
              </div>
            </div>

            {/* Instructions */}
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              {isDragging ? "Drop your image here" : "Upload Bin Image"}
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Drag and drop or click to browse
            </p>
            <p className="text-muted-foreground/60 text-xs">
              Supports: JPG, PNG, WEBP (Max 10MB)
            </p>
          </label>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
