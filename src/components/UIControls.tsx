import { signInWithGoogle } from '../firebase';
import { Upload, HardDrive, RotateCcw, Box } from 'lucide-react';

export function UIControls({ 
  settings, 
  setSettings, 
  store, 
  onLocalUpload, 
  onDriveUpload, 
  isPickerLoaded,
  onReset
}: any) {
  
  const handleDriveClick = async () => {
    await signInWithGoogle();
    onDriveUpload();
  };

  return (
    <div className="flex flex-col gap-8">
      {/* File Loading */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Load Model</h2>
        
        <label className="flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 transition-colors p-3 rounded-lg cursor-pointer text-sm font-medium">
          <Upload className="w-4 h-4" />
          Upload Local GLB
          <input type="file" accept=".glb,.gltf" className="hidden" onChange={onLocalUpload} />
        </label>

        <button 
          onClick={handleDriveClick}
          disabled={!isPickerLoaded}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors p-3 rounded-lg text-sm font-medium"
        >
          <HardDrive className="w-4 h-4" />
          Load from Google Drive
        </button>
      </div>

      {/* XR Controls */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">XR Modes</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => store.enterAR()}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 transition-colors py-2 rounded-lg text-sm font-medium"
          >
            Enter XR
          </button>
          <button 
            onClick={() => store.enterVR()}
            className="flex-1 bg-purple-600 hover:bg-purple-500 transition-colors py-2 rounded-lg text-sm font-medium"
          >
            Enter VR
          </button>
        </div>
      </div>

      {/* Visual Settings */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Visual Materials</h2>
        <select 
          className="bg-neutral-800 p-2 rounded border border-neutral-700 text-sm outline-none"
          value={settings.visualMode}
          onChange={(e) => setSettings({ ...settings, visualMode: e.target.value })}
        >
          <option value="default">Default</option>
          <option value="translucent">Translucent</option>
          <option value="holographic">Holographic</option>
          <option value="metallic">Metallic</option>
          <option value="plastic">Plastic</option>
        </select>

        <label className="flex items-center gap-3 text-sm cursor-pointer mt-2">
          <input 
            type="checkbox" 
            checked={settings.showGhost}
            onChange={(e) => setSettings({ ...settings, showGhost: e.target.checked })}
            className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 accent-emerald-500"
          />
          Show Remnant Ghost
        </label>

        <div className="flex flex-col gap-2 mt-2">
          <label className="text-xs text-neutral-400 font-medium flex justify-between">
            <span>Model Scale</span>
            <span>{settings.modelScale?.toFixed(2) || '1.00'}x</span>
          </label>
          <input 
            type="range" 
            min="0.1" max="5" step="0.1"
            value={settings.modelScale || 1}
            onChange={(e) => setSettings({ ...settings, modelScale: parseFloat(e.target.value) })}
            className="w-full accent-emerald-500"
          />
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <label className="text-xs text-neutral-400 font-medium flex justify-between">
            <span>Snap Back Distance</span>
            <span>{settings.snapDistance.toFixed(2)}m</span>
          </label>
          <input 
            type="range" 
            min="0" max="1" step="0.05"
            value={settings.snapDistance}
            onChange={(e) => setSettings({ ...settings, snapDistance: parseFloat(e.target.value) })}
            className="w-full accent-emerald-500"
          />
        </div>
      </div>

      {/* Reset */}
      <div className="flex flex-col gap-4 mt-auto">
        <button 
          onClick={onReset}
          className="flex items-center justify-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors p-3 rounded-lg text-sm font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Positions
        </button>
      </div>
    </div>
  );
}
