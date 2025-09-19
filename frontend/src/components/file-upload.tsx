"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, File, X, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFilesUploaded: (files: File[]) => void
  acceptedTypes?: string[]
  maxFiles?: number
  maxSize?: number // in MB
}

interface UploadedFile {
  file: File
  id: string
  status: "uploading" | "success" | "error"
  progress: number
}

export function FileUpload({
  onFilesUploaded,
  acceptedTypes = [".pdf", ".txt", ".doc", ".docx", ".md"],
  maxFiles = 5,
  maxSize = 10,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    processFiles(files)
  }, [])

  const processFiles = useCallback(
    (files: File[]) => {
      const validFiles = files.filter((file) => {
        const isValidType = acceptedTypes.some((type) => file.name.toLowerCase().endsWith(type.toLowerCase()))
        const isValidSize = file.size <= maxSize * 1024 * 1024
        return isValidType && isValidSize
      })

      if (uploadedFiles.length + validFiles.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`)
        return
      }

      const newFiles: UploadedFile[] = validFiles.map((file) => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        status: "uploading",
        progress: 0,
      }))

      setUploadedFiles((prev) => [...prev, ...newFiles])

      // Simulate upload progress
      newFiles.forEach((uploadFile) => {
        const interval = setInterval(() => {
          setUploadedFiles((prev) =>
            prev.map((f) => (f.id === uploadFile.id ? { ...f, progress: Math.min(f.progress + 10, 100) } : f)),
          )
        }, 100)

        setTimeout(() => {
          clearInterval(interval)
          setUploadedFiles((prev) =>
            prev.map((f) => (f.id === uploadFile.id ? { ...f, status: "success", progress: 100 } : f)),
          )
        }, 1000)
      })

      onFilesUploaded(validFiles)
    },
    [acceptedTypes, maxSize, maxFiles, uploadedFiles.length, onFilesUploaded],
  )

  const removeFile = useCallback((id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="w-full space-y-4">
      <Card
        className={cn(
          "border-2 border-dashed transition-colors duration-200 cursor-pointer",
          isDragOver ? "border-accent bg-accent/5" : "border-border hover:border-accent/50",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-8 text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Upload Documents</h3>
            <p className="text-sm text-muted-foreground">Drag and drop your files here, or click to browse</p>
            <p className="text-xs text-muted-foreground">
              Supports: {acceptedTypes.join(", ")} • Max {maxSize}MB per file • Up to {maxFiles} files
            </p>
          </div>
          <input
            type="file"
            multiple
            accept={acceptedTypes.join(",")}
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <Button asChild className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              Choose Files
            </label>
          </Button>
        </div>
      </Card>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files</h4>
          {uploadedFiles.map((uploadedFile) => (
            <Card key={uploadedFile.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uploadedFile.file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(uploadedFile.file.size)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {uploadedFile.status === "uploading" && (
                    <div className="w-16 bg-secondary/20 rounded-full h-2">
                      <div
                        className="bg-accent h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadedFile.progress}%` }}
                      />
                    </div>
                  )}

                  {uploadedFile.status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}

                  <Button variant="ghost" size="sm" onClick={() => removeFile(uploadedFile.id)} className="h-6 w-6 p-0">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
