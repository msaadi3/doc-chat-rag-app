'use client';

import { useState, useEffect } from 'react';
import { FileUpload } from '@/components/file-upload';
import { ChatInterface } from '@/components/chat-interface';
import { LoginForm } from '@/components/auth/login-form';
import { UserMenu } from '@/components/auth/user-menu';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { FileText, MessageSquare, X } from 'lucide-react';
import { toast } from 'sonner';

type UploadedFile = {
  document_id: string;
  filename: string;
};

export default function Chat() {
  const { user, logout, isLoading } = useAuth();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  async function fetchFiles() {
    // toast.info('Fetching uploaded files, please wait...');
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/files/get-files`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        toast.error('Failed to fetch files');
        console.log('Failed to fetch files:', response);
        throw new Error('Fetch failed');
      }

      const data = await response.json();
      console.log('Fetched files:', data.files);
      // toast.success('Files fetched successfully');
      setUploadedFiles(data.files);
    } catch (error) {
      console.error('Error while fetching files', error);
    }
  }

  const handleFilesUploaded = async (file: File) => {
    if (uploadedFiles.length == 5) {
      toast.error('You can upload a maximum of 5 files.');
      return;
    }

    // setUploadedFiles((prev) => [...prev, file]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      toast.info(`Uploading ${file.name}, please wait...`);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/rag/uploadfile/`,
        {
          method: 'POST',
          body: formData,
          credentials: 'include',
        }
      );

      if (!response.ok) {
        toast.error('Failed to upload file');
        console.log('Failed to upload file:', response);
        throw new Error('Upload failed');
      }

      await fetchFiles();
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, []);

  async function deleteFile(documentId: string) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/files/delete-file/${documentId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        console.log('Failed to delete file:', response);
        toast.error('Failed to delete file');
        throw new Error('Delete failed');
      }

      const data = await response.json();
      console.log('Delete success:', data);

      setUploadedFiles((prev) =>
        prev.filter((file) => file.document_id !== documentId)
      );
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-accent'></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className='min-h-screen bg-background'>
      {/* Header */}
      <header className='border-b bg-card'>
        <div className='container mx-auto px-4 py-3 flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <div className='w-8 h-8 bg-accent rounded-lg flex items-center justify-center'>
              <FileText className='h-4 w-4 text-accent-foreground' />
            </div>
            <div>
              <h1 className='text-lg font-semibold'>Document Chat</h1>
              <p className='text-sm text-muted-foreground'>
                AI-powered document analysis
              </p>
            </div>
          </div>
          <UserMenu user={user} onLogout={logout} />
        </div>
      </header>

      <div className='container mx-auto p-4 h-[calc(100vh-80px)]'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 h-full'>
          {/* File Upload Panel */}
          <div className='lg:col-span-1 space-y-4'>
            <Card className='p-4'>
              <div className='flex items-center space-x-2 mb-4'>
                <FileText className='h-5 w-5 text-accent' />
                <h2 className='text-lg font-medium'>Documents</h2>
              </div>
              <FileUpload onFilesUploaded={handleFilesUploaded} />
            </Card>

            {uploadedFiles.length > 0 && (
              <Card className='p-4'>
                <h3 className='font-medium mb-2'>Ready for Analysis</h3>
                <div className='space-y-2'>
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={file.document_id || index}
                      className='flex items-center justify-between text-sm'
                    >
                      <div className='flex items-center space-x-2'>
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                        <span className='truncate'>{file.filename}</span>
                      </div>

                      {/* Delete / cross button */}
                      <button
                        onClick={() => deleteFile(file.document_id)}
                        className='text-gray-400 hover:text-red-500'
                      >
                        <X className='w-4 h-4' />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Chat Interface */}
          <div className='lg:col-span-2'>
            <Card className='h-full flex flex-col'>
              <div className='p-4 border-b'>
                <div className='flex items-center space-x-2'>
                  <MessageSquare className='h-5 w-5 text-accent' />
                  <h2 className='text-lg font-medium'>Chat</h2>
                  {uploadedFiles.length > 0 && (
                    <span className='text-sm text-muted-foreground'>
                      ({uploadedFiles.length} document
                      {uploadedFiles.length !== 1 ? 's' : ''} loaded)
                    </span>
                  )}
                </div>
              </div>
              <div className='flex-1 min-h-0'>
                <ChatInterface
                  uploadedFiles={uploadedFiles}
                  className='h-full'
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
