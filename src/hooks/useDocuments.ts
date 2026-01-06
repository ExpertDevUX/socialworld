import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserDocument {
  id: string;
  user_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  created_at: string;
}

// Allowed file types for security
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const BLOCKED_EXTENSIONS = [
  '.php', '.exe', '.sh', '.bat', '.cmd', '.ps1', '.js', '.vbs', 
  '.jar', '.py', '.rb', '.pl', '.cgi', '.asp', '.aspx', '.jsp',
  '.html', '.htm', '.svg', '.xml'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function useDocuments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['documents', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_documents' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as UserDocument[];
    },
    enabled: !!user,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Not authenticated');

      // Security validations
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      // Check blocked extensions
      if (BLOCKED_EXTENSIONS.includes(fileExtension)) {
        throw new Error('This file type is not allowed for security reasons');
      }

      // Check MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error('Invalid file type. Allowed: images, PDF, TXT, DOC, DOCX');
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds 10MB limit');
      }

      // Validate file signature (magic bytes) for images
      if (file.type.startsWith('image/')) {
        const isValidImage = await validateImageFile(file);
        if (!isValidImage) {
          throw new Error('Invalid image file');
        }
      }

      // Generate safe filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${user.id}/${timestamp}_${sanitizedName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Save to database
      const { data, error } = await supabase
        .from('user_documents' as any)
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: publicUrl
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as UserDocument;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('File uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error('Upload failed', { description: error.message });
    }
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (document: UserDocument) => {
      if (!user) throw new Error('Not authenticated');

      // Extract file path from URL
      const urlParts = document.file_url.split('/documents/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('documents').remove([filePath]);
      }

      const { error } = await supabase
        .from('user_documents' as any)
        .delete()
        .eq('id', document.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('File deleted');
    },
    onError: () => {
      toast.error('Failed to delete file');
    }
  });
}

// Validate image file by checking magic bytes
async function validateImageFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const arr = new Uint8Array(reader.result as ArrayBuffer).subarray(0, 12);
      const header = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Check magic bytes for common image formats
      const isJPEG = header.startsWith('ffd8ff');
      const isPNG = header.startsWith('89504e47');
      const isGIF = header.startsWith('47494638');
      const isWEBP = header.includes('57454250'); // WEBP signature
      
      resolve(isJPEG || isPNG || isGIF || isWEBP);
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
}
