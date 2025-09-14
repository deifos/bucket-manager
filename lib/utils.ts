import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

import {
  FileIcon,
  FileTextIcon,
  FileJsonIcon,
  FileCodeIcon,
  ImageIcon,
  FileVideoIcon,
  FileAudioIcon,
  FileArchiveIcon,
} from "lucide-react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

export function getFileTypeIcon(mimeType: string) {
  // Image files
  if (mimeType.startsWith("image/")) {
    return ImageIcon
  }

  // Video files
  if (mimeType.startsWith("video/")) {
    return FileVideoIcon
  }

  // Audio files
  if (mimeType.startsWith("audio/")) {
    return FileAudioIcon
  }

  // Text files
  if (mimeType.startsWith("text/")) {
    return FileTextIcon
  }

  // JSON files
  if (mimeType === "application/json") {
    return FileJsonIcon
  }

  // Code files
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("typescript") ||
    mimeType.includes("html") ||
    mimeType.includes("css")
  ) {
    return FileCodeIcon
  }

  // Archive files
  if (
    mimeType.includes("zip") ||
    mimeType.includes("tar") ||
    mimeType.includes("rar") ||
    mimeType.includes("gzip") ||
    mimeType.includes("7z")
  ) {
    return FileArchiveIcon
  }

  // Default file icon
  return FileIcon
}