import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Download, Zap } from 'lucide-react';
import FileUploader from './components/FileUploader';
import FileReceiver from './components/FileReceiver';

export default function App() {
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send');
  const [initialCode, setInitialCode] = useState('');

  useEffect(() => {
    // Check URL params for auto-filling receive code
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      setInitialCode(codeParam);
      setActiveTab('receive');
    }
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-50 font-sans selection:bg-blue-200 dark:selection:bg-blue-900 overflow-hidden relative selection:text-zinc-900">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      <main className="relative z-10 flex flex-col min-h-screen pt-12 pb-24 px-4 sm:px-6">
        <header className="w-full max-w-5xl mx-auto flex justify-between items-center mb-16">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-zinc-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-zinc-900">
              <Zap className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">SwiftShare</span>
          </div>
          <nav className="hidden sm:flex gap-6 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition">How it works</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition">Privacy</a>
          </nav>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto">
          
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-br from-zinc-900 to-zinc-600 bg-clip-text text-transparent dark:from-white dark:to-zinc-500 leading-tight sm:leading-tight py-2">
              Share files at the speed of thought.
            </h1>
            <p className="text-lg text-zinc-500 dark:text-zinc-400">
              Simple, fast, and secure temporary file sharing. No registration required.
            </p>
          </div>

          <div className="w-full max-w-md mx-auto mb-8">
            <div className="flex p-1 bg-zinc-200/50 dark:bg-zinc-900/50 rounded-lg backdrop-blur-md">
              <button
                onClick={() => setActiveTab('send')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'send' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >
                <Send className="w-4 h-4" /> Send
              </button>
              <button
                onClick={() => setActiveTab('receive')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-md transition-all ${activeTab === 'receive' ? 'bg-white dark:bg-zinc-800 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >
                <Download className="w-4 h-4" /> Receive
              </button>
            </div>
          </div>

          <div className="w-full">
             {activeTab === 'send' ? <FileUploader /> : <FileReceiver initialCode={initialCode} />}
          </div>

        </div>

        <footer className="w-full max-w-5xl mx-auto text-center mt-auto pt-16 border-t border-zinc-200 dark:border-zinc-800/50 text-zinc-500 text-sm">
          <p>© {new Date().getFullYear()} SwiftShare. Minimal viable product.</p>
        </footer>
      </main>
    </div>
  );
}
