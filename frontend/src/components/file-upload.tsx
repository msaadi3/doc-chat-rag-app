// // 'use client';

// // import type React from 'react';

// // import { useState, useCallback } from 'react';
// // import { Upload, File } from 'lucide-react';
// // import { Button } from '@/components/ui/button';
// // import { Card } from '@/components/ui/card';
// // import { cn } from '@/lib/utils';

// // interface FileUploadProps {
// //   onFilesUploaded: (files: File[]) => void;
// //   acceptedTypes?: string[];
// //   maxFiles?: number;
// //   maxSize?: number; // in MB
// // }

// // interface UploadedFile {
// //   file: File;
// //   id: string;
// //   status: 'uploading' | 'success' | 'error';
// //   progress: number;
// // }

// // export function FileUpload({
// //   onFilesUploaded,
// //   acceptedTypes = ['.pdf', '.txt', '.doc', '.docx'],
// //   maxFiles = 5,
// //   maxSize = 10,
// // }: FileUploadProps) {
// //   const [isDragOver, setIsDragOver] = useState(false);
// //   const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

// //   const handleDragOver = useCallback((e: React.DragEvent) => {
// //     e.preventDefault();
// //     setIsDragOver(true);
// //   }, []);

// //   const handleDragLeave = useCallback((e: React.DragEvent) => {
// //     e.preventDefault();
// //     setIsDragOver(false);
// //   }, []);

// //   const handleDrop = useCallback((e: React.DragEvent) => {
// //     e.preventDefault();
// //     setIsDragOver(false);

// //     const files = Array.from(e.dataTransfer.files);
// //     processFiles(files);
// //   }, []);

// //   const handleFileSelect = useCallback(
// //     (e: React.ChangeEvent<HTMLInputElement>) => {
// //       const files = Array.from(e.target.files || []);
// //       processFiles(files);
// //     },
// //     []
// //   );

// //   const processFiles = useCallback(
// //     (files: File[]) => {
// //       const validFiles = files.filter((file) => {
// //         const isValidType = acceptedTypes.some((type) =>
// //           file.name.toLowerCase().endsWith(type.toLowerCase())
// //         );
// //         const isValidSize = file.size <= maxSize * 1024 * 1024;
// //         return isValidType && isValidSize;
// //       });

// //       const newFiles: UploadedFile[] = validFiles.map((file) => ({
// //         file,
// //         id: Math.random().toString(36).substr(2, 9),
// //         status: 'uploading',
// //         progress: 0,
// //       }));

// //       setUploadedFiles((prev) => [...prev, ...newFiles]);

// //       onFilesUploaded(validFiles);
// //     },
// //     [acceptedTypes, maxSize, maxFiles, uploadedFiles.length, onFilesUploaded]
// //   );

// //   return (
// //     <div className='w-full space-y-4'>
// //       <Card
// //         className={cn(
// //           'border-2 border-dashed transition-colors duration-200 cursor-pointer',
// //           isDragOver
// //             ? 'border-accent bg-accent/5'
// //             : 'border-border hover:border-accent/50'
// //         )}
// //         onDragOver={handleDragOver}
// //         onDragLeave={handleDragLeave}
// //         onDrop={handleDrop}
// //       >
// //         <div className='p-8 text-center'>
// //           <Upload className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
// //           <div className='space-y-2'>
// //             <h3 className='text-lg font-medium'>Upload Documents</h3>
// //             <p className='text-sm text-muted-foreground'>
// //               Drag and drop your files here, or click to browse
// //             </p>
// //             <p className='text-xs text-muted-foreground'>
// //               Supports: {acceptedTypes.join(', ')} • Max {maxSize}MB per file •
// //               Up to {maxFiles} files
// //             </p>
// //           </div>
// //           <input
// //             type='file'
// //             multiple
// //             accept={acceptedTypes.join(',')}
// //             onChange={handleFileSelect}
// //             className='hidden'
// //             id='file-upload'
// //           />
// //           <Button asChild className='mt-4'>
// //             <label htmlFor='file-upload' className='cursor-pointer'>
// //               Choose Files
// //             </label>
// //           </Button>
// //         </div>
// //       </Card>
// //     </div>
// //   );
// // }

// 'use client';

// import type React from 'react';

// import { useState, useCallback } from 'react';
// import { Upload, File } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Card } from '@/components/ui/card';
// import { cn } from '@/lib/utils';

// // file-upload.tsx
// interface FileUploadProps {
//   onFilesUploaded: (file: File) => void;
//   acceptedTypes?: string[];
//   maxFiles?: number;
//   maxSize?: number;
// }

// export function FileUpload({
//   onFilesUploaded,
//   acceptedTypes = ['.pdf', '.txt', '.doc', '.docx'],
//   maxFiles = 5,
//   maxSize = 10,
// }: FileUploadProps) {
//   const [isDragOver, setIsDragOver] = useState(false);

//   const processFiles = useCallback(
//     (files: File[]) => {
//       const validFiles = files.filter((file) => {
//         const isValidType = acceptedTypes.some((type) =>
//           file.name.toLowerCase().endsWith(type.toLowerCase())
//         );
//         const isValidSize = file.size <= maxSize * 1024 * 1024;
//         return isValidType && isValidSize;
//       });

//       if (validFiles.length > 0) {
//         onFilesUploaded(validFiles);
//       }
//     },
//     [onFilesUploaded]
//   );

//   return (
//     <Card
//       className={cn(
//         'border-2 border-dashed transition-colors cursor-pointer',
//         isDragOver
//           ? 'border-accent bg-accent/5'
//           : 'border-border hover:border-accent/50'
//       )}
//       onDragOver={(e) => {
//         e.preventDefault();
//         setIsDragOver(true);
//       }}
//       onDragLeave={(e) => {
//         e.preventDefault();
//         setIsDragOver(false);
//       }}
//       onDrop={(e) => {
//         e.preventDefault();
//         setIsDragOver(false);
//         processFiles(Array.from(e.dataTransfer.files));
//       }}
//     >
//       <div className='p-8 text-center'>
//         <Upload className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
//         <p className='text-sm'>Drag & drop or click to browse</p>
//         <input
//           type='file'
//           multiple
//           accept={acceptedTypes.join(',')}
//           onChange={(e) => processFiles(Array.from(e.target.files || []))}
//           className='hidden'
//           id='file-upload'
//         />
//         <Button asChild className='mt-4'>
//           <label htmlFor='file-upload' className='cursor-pointer'>
//             Choose Files
//           </label>
//         </Button>
//       </div>
//     </Card>
//   );
// }

'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFilesUploaded: (file: File) => void;
  acceptedTypes?: string[];
  maxSize?: number; // MB
}

export function FileUpload({
  onFilesUploaded,
  acceptedTypes = ['.pdf', '.txt', '.doc', '.docx'],
  maxSize = 10,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = (file: File) => {
    const isValidType = acceptedTypes.some((type) =>
      file.name.toLowerCase().endsWith(type.toLowerCase())
    );
    const isValidSize = file.size <= maxSize * 1024 * 1024;

    if (isValidType && isValidSize) {
      onFilesUploaded(file);
    } else {
      alert(
        `Invalid file. Allowed: ${acceptedTypes.join(', ')} | Max ${maxSize}MB`
      );
    }
  };

  return (
    <Card
      className={cn(
        'border-2 border-dashed transition-colors cursor-pointer',
        isDragOver
          ? 'border-accent bg-accent/5'
          : 'border-border hover:border-accent/50'
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files.length > 0) {
          handleFile(e.dataTransfer.files[0]); // 👈 take first file only
        }
      }}
    >
      <div className='p-8 text-center'>
        <Upload className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
        <p className='text-sm'>Drag & drop or click to browse (1 file)</p>
        <input
          type='file'
          accept={acceptedTypes.join(',')}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFile(e.target.files[0]); // 👈 take first file only
            }
          }}
          className='hidden'
          id='file-upload'
        />
        <Button asChild className='mt-4'>
          <label htmlFor='file-upload' className='cursor-pointer'>
            Choose File
          </label>
        </Button>
      </div>
    </Card>
  );
}
