import React, { useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File as FileIcon, X, Check, Copy, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import bytes from 'bytes';
import { cn } from '../lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{code: string, expiresAt: string} | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selected = e.dataTransfer.files[0];
      if (selected.size > 2 * 1024 * 1024 * 1024) {
        setError('File exceeds 2GB limit.');
        return;
      }
      setFile(selected);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.size > 2 * 1024 * 1024 * 1024) {
        setError('File exceeds 2GB limit.');
        return;
      }
      setFile(selected);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    
    setUploading(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      setUploading(false);
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          setSuccessData({ code: response.code, expiresAt: response.expiresAt });
        } else {
          setError(response.error || 'Upload failed');
        }
      } catch (err) {
        setError('Unexpected server response');
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setError('Network error occurred during upload.');
    };

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  };

  const copyToClipboard = () => {
    if (successData) {
      navigator.clipboard.writeText(successData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const reset = () => {
    setFile(null);
    setSuccessData(null);
    setProgress(0);
    setError(null);
    setShowQR(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl backdrop-blur-xl bg-white/80 dark:bg-zinc-950/80 border-white/20 dark:border-zinc-800/50">
      <CardHeader>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-500 bg-clip-text text-transparent dark:from-white dark:to-zinc-400">Share File</CardTitle>
        <CardDescription>Upload securely. Auto-deletes after 24 hours.</CardDescription>
      </CardHeader>
      
      <CardContent>
        <AnimatePresence mode="wait">
          {!successData ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {!file ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ease-in-out group",
                    isDragging ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10" : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                  )}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 bg-zinc-100 rounded-full dark:bg-zinc-900 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-8 h-8 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Drag and drop your file here
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">or click to browse (up to 2GB)</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center p-3 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 relative overflow-hidden group">
                    <FileIcon className="w-8 h-8 text-blue-500 flex-shrink-0" />
                    <div className="ml-3 min-w-0 flex-1 truncate pr-8">
                      <p className="text-sm font-medium truncate dark:text-zinc-200">{file.name}</p>
                      <p className="text-xs text-zinc-500">{bytes(file.size)}</p>
                    </div>
                    {uploading ? (
                      <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                    ) : (
                      <button 
                        onClick={() => setFile(null)} 
                        className="absolute right-3 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {error && (
                    <p className="text-xs text-red-500 font-medium">{error}</p>
                  )}

                  <Button 
                    variant="default" 
                    className="w-full relative overflow-hidden" 
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? `Uploading... ${progress}%` : 'Upload File'}
                    {uploading && (
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-300 ease-out" 
                        style={{ width: `${progress}%` }} 
                      />
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center space-y-6 text-center py-4"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mb-2">
                <Check className="w-8 h-8" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-xl font-semibold dark:text-white">Ready to share!</h3>
                <p className="text-sm text-zinc-500">File expires {formatDistanceToNow(new Date(successData.expiresAt), { addSuffix: true })}</p>
              </div>

              <div className="w-full group">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block text-left">Share Code</label>
                <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-lg p-1 border border-zinc-200 dark:border-zinc-800 items-center transition-colors">
                  <div className="flex-1 font-mono text-2xl font-bold tracking-[0.2em] text-center dark:text-white">
                    {successData.code}
                  </div>
                  <Button variant="ghost" size="icon" onClick={copyToClipboard} className="text-zinc-500 hover:bg-white dark:hover:bg-zinc-800 rounded-md">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {showQR && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-white p-4 rounded-xl border"
                >
                  <QRCodeSVG 
                    value={`${window.location.origin}?code=${successData.code}`} 
                    size={160} 
                    level="Q" 
                    includeMargin={false} 
                  />
                  <p className="text-xs text-zinc-500 mt-2 text-center">Scan to download</p>
                </motion.div>
              )}

              <div className="flex gap-2 w-full pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowQR(!showQR)}>
                  <QrCode className="w-4 h-4 mr-2" /> QR Code
                </Button>
                <Button className="flex-1" onClick={reset}>
                  Send Another
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
