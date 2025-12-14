import { useState, useRef, DragEvent } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import { CloudUpload, InsertDriveFile } from '@mui/icons-material';

interface DragDropUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
}

export default function DragDropUpload({
  onFileSelect,
  accept = '.xlsx,.xls,.csv',
  maxSize = 10,
}: DragDropUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    const validExtensions = accept.split(',').map(ext => ext.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      alert(`Invalid file type. Please upload ${accept} files.`);
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size exceeds ${maxSize}MB limit.`);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  return (
    <Paper
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        p: 6,
        textAlign: 'center',
        border: `2px dashed ${isDragging ? '#667eea' : '#e0e0e0'}`,
        borderRadius: 3,
        bgcolor: isDragging ? 'action.hover' : 'background.paper',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        '&:hover': {
          borderColor: '#667eea',
          bgcolor: 'action.hover',
        },
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          width: 100,
          height: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 3,
          transition: 'transform 0.3s ease',
          transform: isDragging ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        <CloudUpload sx={{ fontSize: 48, color: 'white' }} />
      </Box>

      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        {isDragging ? 'Drop file here' : 'Drag & Drop or Click to Upload'}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Supported formats: {accept} (Max {maxSize}MB)
      </Typography>

      {selectedFile && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            p: 2,
            bgcolor: 'success.light',
            borderRadius: 2,
            mb: 2,
          }}
        >
          <InsertDriveFile />
          <Typography variant="body2">{selectedFile.name}</Typography>
        </Box>
      )}

      <Button
        variant="contained"
        onClick={() => fileInputRef.current?.click()}
        startIcon={<CloudUpload />}
      >
        Select File
      </Button>
    </Paper>
  );
}

