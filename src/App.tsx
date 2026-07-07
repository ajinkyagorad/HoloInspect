import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { createXRStore, XR, useXR } from '@react-three/xr';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { ModelViewer } from './components/ModelViewer';
import { UIControls } from './components/UIControls';
import { useGooglePicker } from './useGooglePicker';
import { getCachedAccessToken } from './firebase';
import { Box } from 'lucide-react';

const store = createXRStore();

function XRManager() {
  const session = useXR((state: any) => state.session);
  
  useEffect(() => {
    if (session && session.supportedFrameRates) {
      const rates = Array.from(session.supportedFrameRates) as number[];
      if (rates.includes(120)) {
        session.updateTargetFrameRate(120).catch(console.error);
      } else if (rates.includes(90)) {
        session.updateTargetFrameRate(90).catch(console.error);
      } else if (rates.includes(72)) {
        session.updateTargetFrameRate(72).catch(console.error);
      }
    }
  }, [session]);
  
  return null;
}

export default function App() {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [settings, setSettings] = useState({
    visualMode: 'default',
    showGhost: true,
    snapDistance: 0.2,
    modelScale: 1.0,
  });

  const { isPickerLoaded, openPicker } = useGooglePicker(async (fileId, fileName) => {
    const token = getCachedAccessToken();
    if (!token) return;
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await res.blob();
      setModelUrl(URL.createObjectURL(blob));
    } catch (e) {
      console.error('Failed to load from Drive', e);
    }
  });

  const onLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setModelUrl(URL.createObjectURL(file));
  };

  const handleReset = () => {
    setResetKey(prev => prev + 1);
  };

  return (
    <div className="flex h-screen w-full bg-neutral-950 text-white font-sans overflow-hidden">
      <div className="w-80 bg-neutral-900 border-r border-neutral-800 flex flex-col p-6 z-10 shadow-2xl relative">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
            <Box className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">HoloInspect</h1>
        </div>
        <UIControls 
          settings={settings} 
          setSettings={setSettings} 
          store={store} 
          onLocalUpload={onLocalUpload}
          onDriveUpload={openPicker}
          isPickerLoaded={isPickerLoaded}
          onReset={handleReset}
        />
      </div>
      <div className="flex-1 relative">
        <Canvas 
          camera={{ position: [0, 1.5, 2] }}
          dpr={Math.min(window.devicePixelRatio, 2)}
          gl={{
            powerPreference: 'high-performance',
            precision: 'mediump',
            xrCompatible: true,
            antialias: false
          }}
        >
          <XR store={store}>
            <XRManager />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 10]} intensity={1} />
            <Environment preset="city" />
            <OrbitControls makeDefault target={[0, 1.2, 0]} />
            
            <group position={[0, 1.2, -0.5]} scale={[settings.modelScale, settings.modelScale, settings.modelScale]}>
              {modelUrl ? (
                <ModelViewer key={resetKey} url={modelUrl} settings={settings} />
              ) : (
                <mesh>
                  <boxGeometry args={[0.2, 0.2, 0.2]} />
                  <meshStandardMaterial color="#333" wireframe />
                </mesh>
              )}
            </group>

            <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={10} blur={2} frames={1} resolution={512} />
          </XR>
        </Canvas>
      </div>
    </div>
  );
}

