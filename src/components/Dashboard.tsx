import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ImageGeneration } from './ImageGeneration';
import { VideoGeneration } from './VideoGeneration';
import { Sparkles, Image, Video, Coins, LogOut, Crown } from 'lucide-react';

type Tab = 'images' | 'videos';

export function Dashboard() {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('images');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-800/50 backdrop-blur-lg border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">UGC Factory</h1>
                <p className="text-xs text-slate-400">Premium AI Content Engine</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-lg border border-slate-700">
                <Crown className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-medium text-slate-300">
                  {profile?.subscription_tier || 'Starter'}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 rounded-lg">
                <Coins className="w-5 h-5 text-white" />
                <span className="text-lg font-bold text-white">{profile?.credits || 0}</span>
                <span className="text-xs text-blue-200">credits</span>
              </div>

              <div className="text-right mr-4">
                <p className="text-sm text-slate-400">{user?.email}</p>
              </div>

              <button
                onClick={signOut}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome to Your UGC Factory</h2>
                <p className="text-blue-100">
                  Transform product images into high-conversion UGC videos. Every generation is optimized for commercial use.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4 text-center">
                  <p className="text-3xl font-bold">{profile?.credits || 0}</p>
                  <p className="text-sm text-blue-200">Credits Available</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700 inline-flex">
            <button
              onClick={() => setActiveTab('images')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'images'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Image className="w-5 h-5" />
              Image Generation
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'videos'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-5 h-5" />
              Video Generation
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Image className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">10</p>
                  <p className="text-xs text-slate-400">Credits per image</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">20-50</p>
                  <p className="text-xs text-slate-400">Credits per video</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">Auto</p>
                  <p className="text-xs text-slate-400">Prompt enhancement</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {activeTab === 'images' ? <ImageGeneration /> : <VideoGeneration />}
      </div>

      <footer className="bg-slate-800/50 border-t border-slate-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <p>UGC Factory - Premium AI-Powered Content Generation</p>
            <p>All outputs are commercial-grade and ad-ready</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
