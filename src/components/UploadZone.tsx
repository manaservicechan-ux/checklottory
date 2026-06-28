"use client";

import { useCallback, useState } from "react";
import { useDropzone, type Accept } from "react-dropzone";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  accept: Accept;
  multiple?: boolean;
  files: File[];
  onFiles: (files: File[]) => void;
}

export function UploadZone({ label, accept, multiple = false, files, onFiles }: Props) {
  const [hover, setHover] = useState(false);

  const onDrop = useCallback(
    (accepted: File[]) => {
      onFiles(multiple ? [...files, ...accepted] : accepted.slice(0, 1));
      setHover(false);
    },
    [files, multiple, onFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    onDragEnter: () => setHover(true),
    onDragLeave: () => setHover(false),
  });

  const removeAt = (idx: number) => {
    onFiles(files.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition",
          isDragActive || hover
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
            : "border-gray-300 dark:border-gray-700 hover:border-gray-400",
        )}
      >
        <input {...getInputProps()} />
        <p className="text-sm text-gray-600 dark:text-gray-300">{label}</p>
        <p className="text-xs text-gray-400 mt-1">
          {multiple ? "เลือกได้หลายไฟล์" : "เลือกได้ 1 ไฟล์"} • ลากมาวางหรือคลิก
        </p>
      </div>
      {files.length > 0 && (
        <ul className="mt-3 space-y-1">
          {files.map((f, i) => (
            <li
              key={i}
              className="flex items-center justify-between text-sm bg-gray-100 dark:bg-gray-800 rounded px-3 py-1.5"
            >
              <span className="truncate flex-1">{f.name}</span>
              <span className="text-xs text-gray-500 ml-3">
                {(f.size / 1024).toFixed(0)} KB
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(i);
                }}
                className="ml-3 text-red-500 hover:text-red-700 text-xs"
                type="button"
              >
                ลบ
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
