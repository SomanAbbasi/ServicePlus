import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadMedia } from "@/frontend/lib/api-services";
import { resolveImageUrl } from "@/frontend/lib/api-client";
import { compressImageFile } from "@/frontend/lib/image-compression";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";

const MAX_FILE_MB = 25;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type) && !file.type.startsWith("image/")) {
    return `Unsupported file type "${file.type}". Use JPEG, PNG, WebP, or GIF.`;
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `File is ${mb} MB. Maximum size is ${MAX_FILE_MB} MB.`;
  }
  return null;
}

/** Image field with upload-to-storage plus manual URL entry. */
export function ImageUploader({
  value,
  onChange,
  label = "Image",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setBusy(true);
    setStatusText("Optimizing image...");
    try {
      const compressed = await compressImageFile(file, {
        maxDimension: 1600,
        quality: 0.82,
        mimeType: "image/webp",
      });

      setStatusText("Uploading...");
      const res = await uploadMedia(
        compressed.filename,
        compressed.contentType,
        compressed.base64
      );

      onChange(res.url);
      toast.success("Image uploaded and optimized");
    } catch (e) {
      const msg = (e as Error).message || "";
      if (
        msg.includes("413") ||
        msg.includes("Payload Too Large") ||
        msg.includes("too large")
      ) {
        toast.error("Image file is too large. Please select a smaller photo.");
      } else if (msg.includes("Failed to fetch") || msg.includes("CORS")) {
        toast.error("Network error: Could not reach the upload server. Please try again.");
      } else {
        toast.error(msg || "Upload failed. Try another image.");
      }
    } finally {
      setBusy(false);
      setStatusText("");
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-start gap-3">
        <div
          className="relative flex size-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/40"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) void handleFile(file);
          }}
        >
          {busy ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : value ? (
            <img src={resolveImageUrl(value)} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste an image URL or upload a file"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? (
                <>
                  <Loader2 className="me-1.5 size-3.5 animate-spin" />
                  {statusText || "Uploading..."}
                </>
              ) : (
                "Upload image"
              )}
            </Button>
            {value && !busy ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
                <X className="me-1 size-3" /> Clear
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP, GIF, or SVG up to {MAX_FILE_MB} MB. Auto-optimized.
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
