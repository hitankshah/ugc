import { useState, useEffect } from 'react';
import { Video, Sparkles, Loader2, Check, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { enhanceVideoPrompt } from '../utils/promptEnhancer';

interface ProductAsset {
  id: string;
  image_url: string;
  asset_type: 'uploaded' | 'generated';
}

interface VideoGeneration {
  id: string;
  product_name: string;
  original_prompt: string;
  enhanced_prompt: string;
  model_used: string;
  status: 'processing' | 'completed' | 'failed';
  video_url: string | null;
  created_at: string;
}

const VIDEO_MODELS = [
  { id: 'nano-video-v1', name: 'Nano Video V1', speed: 'Fast', cost: 20 },
  { id: 'pro-video-v2', name: 'Pro Video V2', speed: 'Medium', cost: 35 },
  { id: 'ultra-video-v3', name: 'Ultra Video V3', speed: 'Slow', cost: 50 },
];

export function VideoGeneration() {
  const { user, profile, refreshProfile } = useAuth();
  const [assets, setAssets] = useState<ProductAsset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [productName, setProductName] = useState('');
  const [productContext, setProductContext] = useState('');
  const [selectedModel, setSelectedModel] = useState(VIDEO_MODELS[0].id);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generations, setGenerations] = useState<VideoGeneration[]>([]);
  const [showEnhancement, setShowEnhancement] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState('');

  useEffect(() => {
    loadAssets();
    loadGenerations();
  }, [user]);

  const loadAssets = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('product_assets')
      .select('id, image_url, asset_type')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setAssets(data);
  };

  const loadGenerations = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('video_generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) setGenerations(data);
  };

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssets((prev) => {
      if (prev.includes(assetId)) {
        return prev.filter((id) => id !== assetId);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, assetId];
    });
  };

  const handleEnhancePreview = () => {
    if (!prompt.trim() || !productName.trim()) return;

    const model = VIDEO_MODELS.find((m) => m.id === selectedModel);
    const enhancement = enhanceVideoPrompt(prompt, productName, productContext, model?.name || '');
    setEnhancedPrompt(enhancement.enhanced);
    setShowEnhancement(true);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !productName.trim() || selectedAssets.length === 0 || !user || !profile) {
      alert('Please select images, enter product name and prompt');
      return;
    }

    const model = VIDEO_MODELS.find((m) => m.id === selectedModel);
    if (!model) return;

    if (profile.credits < model.cost) {
      alert(`Insufficient credits. This generation costs ${model.cost} credits.`);
      return;
    }

    setGenerating(true);

    try {
      const enhancement = enhanceVideoPrompt(prompt, productName, productContext, model.name);

      await supabase.from('prompt_history').insert({
        user_id: user.id,
        original_prompt: enhancement.original,
        enhanced_prompt: enhancement.enhanced,
        prompt_type: 'video',
        model_used: selectedModel,
      });

      const mockVideoUrl = `https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`;

      const { data: generation } = await supabase
        .from('video_generations')
        .insert({
          user_id: user.id,
          asset_ids: selectedAssets,
          product_name: productName,
          product_context: productContext,
          model_used: selectedModel,
          original_prompt: enhancement.original,
          enhanced_prompt: enhancement.enhanced,
          video_url: mockVideoUrl,
          status: 'processing',
        })
        .select()
        .single();

      await supabase.from('credit_transactions').insert({
        user_id: user.id,
        amount: -model.cost,
        transaction_type: 'video_gen',
        reference_id: generation?.id,
      });

      await supabase
        .from('user_profiles')
        .update({ credits: profile.credits - model.cost })
        .eq('id', user.id);

      setTimeout(async () => {
        await supabase
          .from('video_generations')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', generation?.id);

        await loadGenerations();
      }, 3000);

      await refreshProfile();
      await loadGenerations();

      setPrompt('');
      setProductName('');
      setProductContext('');
      setSelectedAssets([]);
      setShowEnhancement(false);
    } catch (error) {
      console.error('Generation error:', error);
      alert('Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const selectedModel_ = VIDEO_MODELS.find((m) => m.id === selectedModel);

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Video className="w-6 h-6" />
          Image to UGC Video Generation
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Step 1: Select 2-3 Product Images
            </label>
            {assets.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-slate-200">
                <p className="text-slate-600 font-medium">No product assets available</p>
                <p className="text-slate-500 text-sm mt-1">Generate or upload images first</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {assets.slice(0, 12).map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => toggleAssetSelection(asset.id)}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                      selectedAssets.includes(asset.id)
                        ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-md'
                        : 'border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <img
                      src={asset.image_url}
                      alt="Product"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=200';
                      }}
                    />
                    {selectedAssets.includes(asset.id) && (
                      <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                        <Check className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-600 font-medium mt-3">Selected: {selectedAssets.length}/3</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Product Name
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Premium Wireless Headphones"
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Video Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              >
                {VIDEO_MODELS.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} - {model.speed} ({model.cost} credits)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Product Context
            </label>
            <textarea
              value={productContext}
              onChange={(e) => setProductContext(e.target.value)}
              placeholder="Lifestyle for young professionals, emphasize quality and design"
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Video Idea Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the video concept..."
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
              rows={3}
            />
          </div>

          {showEnhancement && enhancedPrompt && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900 mb-2">AI-Enhanced Prompt</p>
                  <p className="text-sm text-slate-700">{enhancedPrompt}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleEnhancePreview}
              disabled={!prompt.trim() || !productName.trim()}
              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5" />
              Preview
            </button>

            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim() || !productName.trim() || selectedAssets.length === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  Generate ({selectedModel_?.cost} credits)
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Your Videos</h3>

        {generations.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">No videos generated yet</p>
            <p className="text-slate-500 text-sm mt-1">Create your first UGC video to see it here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {generations.map((gen) => (
              <div key={gen.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-blue-300 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">{gen.product_name}</h4>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-1">{gen.original_prompt}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                      gen.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : gen.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {gen.status}
                  </span>
                </div>

                {gen.status === 'completed' && gen.video_url && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 bg-white rounded-lg px-3 py-2 text-sm text-slate-600 truncate border border-slate-200">
                      {gen.video_url}
                    </div>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium">
                      <Play className="w-4 h-4" />
                      View
                    </button>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 font-medium">
                  <span>{gen.model_used}</span>
                  <span>•</span>
                  <span>{new Date(gen.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
