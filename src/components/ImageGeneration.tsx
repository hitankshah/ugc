import { useState, useRef } from 'react';
import { Upload, Wand2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { enhanceImagePrompt } from '../utils/promptEnhancer';

interface ProductAsset {
  id: string;
  image_url: string;
  asset_type: 'uploaded' | 'generated';
  prompt?: string | null;
  created_at: string;
}

export function ImageGeneration() {
  const { user, profile, refreshProfile } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [assets, setAssets] = useState<ProductAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAssets = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('product_assets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setAssets(data);
    }
    setLoading(false);
  };

  useState(() => {
    loadAssets();
  });

  const handleGenerate = async () => {
    if (!prompt.trim() || !user || !profile) return;

    if (profile.credits < 10) {
      alert('Insufficient credits. Each image generation costs 10 credits.');
      return;
    }

    setGenerating(true);

    try {
      const enhancement = enhanceImagePrompt(prompt);

      await supabase.from('prompt_history').insert({
        user_id: user.id,
        original_prompt: enhancement.original,
        enhanced_prompt: enhancement.enhanced,
        prompt_type: 'image',
        model_used: 'nano-image-v1',
      });

      const mockImageUrl = `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000)}/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=800`;

      const { data: asset } = await supabase
        .from('product_assets')
        .insert({
          user_id: user.id,
          asset_type: 'generated',
          image_url: mockImageUrl,
          prompt: enhancement.original,
          enhanced_prompt: enhancement.enhanced,
          metadata: { model: 'nano-image-v1' },
        })
        .select()
        .single();

      await supabase.from('credit_transactions').insert({
        user_id: user.id,
        amount: -10,
        transaction_type: 'image_gen',
        reference_id: asset?.id,
      });

      await supabase
        .from('user_profiles')
        .update({ credits: profile.credits - 10 })
        .eq('id', user.id);

      await refreshProfile();
      await loadAssets();
      setPrompt('');
    } catch (error) {
      console.error('Generation error:', error);
      alert('Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !profile) return;

    if (profile.credits < 5) {
      alert('Insufficient credits. Each upload costs 5 credits.');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('product-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-assets')
        .getPublicUrl(fileName);

      const { data: asset } = await supabase
        .from('product_assets')
        .insert({
          user_id: user.id,
          asset_type: 'uploaded',
          image_url: publicUrl || `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000)}/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=800`,
          metadata: { original_filename: file.name },
        })
        .select()
        .single();

      await supabase.from('credit_transactions').insert({
        user_id: user.id,
        amount: -5,
        transaction_type: 'image_gen',
        reference_id: asset?.id,
      });

      await supabase
        .from('user_profiles')
        .update({ credits: profile.credits - 5 })
        .eq('id', user.id);

      await refreshProfile();
      await loadAssets();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Using mock image instead.');

      const mockImageUrl = `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000)}/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=800`;

      await supabase.from('product_assets').insert({
        user_id: user.id,
        asset_type: 'uploaded',
        image_url: mockImageUrl,
        metadata: { original_filename: file.name },
      });

      await loadAssets();
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <ImageIcon className="w-6 h-6" />
          Product Image Generation
        </h2>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Generate from prompt
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your product image..."
                className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
              />
              <button
                onClick={handleGenerate}
                disabled={generating || !prompt.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Wand2 className="w-5 h-5" />
                )}
                Generate
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">Cost: 10 credits per generation</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Upload product image
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
              Upload Image
            </button>
            <p className="text-xs text-slate-400 mt-2">Cost: 5 credits per upload</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Your Product Assets</h3>

        {loading ? (
          <div className="text-center py-12 text-slate-400">Loading assets...</div>
        ) : assets.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No assets yet. Generate or upload images to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assets.map((asset) => (
              <div key={asset.id} className="group relative aspect-square rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
                <img
                  src={asset.image_url}
                  alt="Product"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=400';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-2 left-2 right-2">
                    <span className="text-xs text-white font-medium bg-blue-600 px-2 py-1 rounded">
                      {asset.asset_type}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
