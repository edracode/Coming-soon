import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { checkImageFile } from "@/lib/site";

export function ImagePicker({
  file,
  onChange,
  label = "Choose image",
}: {
  file: File | null;
  onChange: (f: File | null) => void;
  label?: string;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div>
      {preview ? (
        <div className="relative w-fit">
          <img src={preview} alt="Selected image preview" className="h-40 w-40 rounded-xl border-2 border-ink object-cover" />
          <button
            type="button"
            onClick={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="absolute -right-2 -top-2 grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-paper text-ink"
            aria-label="Remove selected image"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-within:border-primary"
        >
          <ImagePlus className="h-8 w-8" aria-hidden="true" />
          <span className="font-medium">{label}</span>
          <span className="text-xs">JPG, PNG or WEBP · under 3 MB</span>
        </label>
      )}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          if (!f) return onChange(null);
          const c = checkImageFile(f);
          if (!c.ok) {
            setError(c.error);
            e.target.value = "";
            onChange(null);
            return;
          }
          setError(null);
          onChange(f);
        }}
      />
      {error ? <p role="alert" className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}