import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Search, File as FileIcon, XCircle, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import bytes from 'bytes';
import { formatDistanceToNow } from 'date-fns';
import { FileMeta } from '../types';

export default function FileReceiver({ initialCode = '' }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);

  useEffect(() => {
    if (initialCode && initialCode.length >= 6) {
      handleSearch(initialCode);
    }
  }, [initialCode]);

  const handleSearch = async (searchCode: string = code) => {
    if (!searchCode || searchCode.length < 4) return;
    setIsLoading(true);
    setError(null);
    setFileMeta(null);

    try {
      const res = await fetch(`/api/file/${searchCode}`);
      const data = await res.json();
      
      if (res.ok) {
        setFileMeta(data);
      } else {
        setError(data.error || 'File not found');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!fileMeta) return;
    window.location.href = `/api/download/${fileMeta.code}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-2xl backdrop-blur-xl bg-white/80 dark:bg-zinc-950/80 border-white/20 dark:border-zinc-800/50">
      <CardHeader>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-500 bg-clip-text text-transparent dark:from-white dark:to-zinc-400">Receive File</CardTitle>
        <CardDescription>Enter code to download your file.</CardDescription>
      </CardHeader>
      
      <CardContent>
        <AnimatePresence mode="wait">
          {!fileMeta ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input 
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Enter short code"
                    className="font-mono text-center tracking-widest uppercase h-12 text-lg"
                    maxLength={8}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(code)}
                  />
                </div>
              </div>
              
              {error && (
                <div className="flex items-center text-red-500 text-sm bg-red-50 dark:bg-red-950/30 p-3 rounded-lg">
                  <XCircle className="w-4 h-4 mr-2" />
                  {error}
                </div>
              )}

              <Button 
                className="w-full h-12 text-md" 
                onClick={() => handleSearch(code)}
                disabled={isLoading || code.length < 4}
              >
                {isLoading ? 'Searching...' : 'Find File'}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-6 flex flex-col items-center text-center space-y-4 border border-zinc-200 dark:border-zinc-800 relative">
                <button 
                  onClick={() => setFileMeta(null)}
                  className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  <XCircle className="w-5 h-5" />
                </button>
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center">
                  <FileIcon className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 break-all">{fileMeta.originalName}</h4>
                  <p className="text-zinc-500 text-sm flex gap-3 justify-center items-center mt-2">
                    <span>{bytes(fileMeta.size)}</span>
                    <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> Expires {formatDistanceToNow(new Date(fileMeta.expiresAt))}</span>
                  </p>
                </div>
              </div>

              <Button className="w-full h-12 text-md" onClick={handleDownload}>
                <Download className="w-5 h-5 mr-2" />
                Download File
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
