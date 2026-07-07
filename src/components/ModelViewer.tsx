import * as THREE from 'three';
import { useEffect, useMemo, useRef } from 'react';
import { Bvh, useGLTF } from '@react-three/drei';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

export function ModelViewer({ url, settings }: { url: string, settings: any }) {
  const { scene } = useGLTF(url);
  
  // Clone for the interactive parts
  const clonedScene = useMemo(() => clone(scene), [scene]);
  // Clone for the ghost
  const ghostScene = useMemo(() => clone(scene), [scene]);

  // Apply materials to interactive scene
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        
        // Asset optimizations
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.frustumCulled = true;

        const mat = mesh.material as THREE.MeshStandardMaterial;
        
        // PBR Simplification if it's standard/physical
        if (mat.isMeshStandardMaterial) {
          mat.metalness = 0.0;
          mat.roughness = 0.5;
        }

        // Save original material if not saved
        if (!mesh.userData.originalMaterial) {
          mesh.userData.originalMaterial = mat.clone();
        }
        
        const origMat = mesh.userData.originalMaterial;
        
        if (mesh.userData.currentMaterial && mesh.userData.currentMaterial !== origMat) {
          mesh.userData.currentMaterial.dispose();
        }

        if (settings.visualMode === 'default') {
          mesh.material = origMat;
          mesh.userData.currentMaterial = origMat;
        } else if (settings.visualMode === 'translucent') {
          const newMat = origMat.clone();
          newMat.transparent = true;
          newMat.opacity = 0.5;
          mesh.material = newMat;
          mesh.userData.currentMaterial = newMat;
        } else if (settings.visualMode === 'holographic') {
          const newMat = new THREE.MeshStandardMaterial({
            color: 0x00ffcc,
            emissive: 0x004433,
            transparent: true,
            opacity: 0.6,
            wireframe: true,
            blending: THREE.AdditiveBlending,
          });
          mesh.material = newMat;
          mesh.userData.currentMaterial = newMat;
        } else if (settings.visualMode === 'metallic') {
          const newMat = new THREE.MeshStandardMaterial({
            color: origMat.color,
            metalness: 1.0,
            roughness: 0.1,
          });
          mesh.material = newMat;
          mesh.userData.currentMaterial = newMat;
        } else if (settings.visualMode === 'plastic') {
          const newMat = new THREE.MeshPhysicalMaterial({
            color: origMat.color,
            metalness: 0.0,
            roughness: 0.2,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
          });
          mesh.material = newMat;
          mesh.userData.currentMaterial = newMat;
        }
      }
    });
  }, [clonedScene, settings.visualMode]);

  // Apply materials to ghost scene
  useEffect(() => {
    let ghostMat: THREE.MeshBasicMaterial | null = null;
    ghostScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        
        // Asset optimizations
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        mesh.frustumCulled = true;

        if (!ghostMat) {
          ghostMat = new THREE.MeshBasicMaterial({
            color: 0x888888,
            transparent: true,
            opacity: 0.15,
            depthWrite: false,
            wireframe: true,
          });
        }
        mesh.material = ghostMat;
      }
    });
    return () => {
      if (ghostMat) ghostMat.dispose();
    };
  }, [ghostScene]);

  // Interaction logic
  const grabbedRef = useRef<THREE.Mesh | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const distanceRef = useRef<number>(0);

  const onPointerDown = (e: any) => {
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    grabbedRef.current = e.object;
    pointerIdRef.current = e.pointerId;

    if (!e.object.userData.originalPosition) {
      e.object.userData.originalPosition = e.object.position.clone();
      e.object.userData.originalRotation = e.object.rotation.clone();
    }

    const worldPos = new THREE.Vector3();
    e.object.getWorldPosition(worldPos);
    distanceRef.current = e.ray.origin.distanceTo(worldPos);
  };

  const onPointerMove = (e: any) => {
    if (grabbedRef.current && e.pointerId === pointerIdRef.current) {
      e.stopPropagation();
      const newWorldPos = e.ray.origin.clone().add(e.ray.direction.clone().multiplyScalar(distanceRef.current));
      if (grabbedRef.current.parent) {
        grabbedRef.current.parent.worldToLocal(newWorldPos);
      }
      grabbedRef.current.position.copy(newWorldPos);
    }
  };

  const onPointerUp = (e: any) => {
    if (grabbedRef.current && e.pointerId === pointerIdRef.current) {
      e.stopPropagation();
      e.target.releasePointerCapture(e.pointerId);
      
      const orig = grabbedRef.current.userData.originalPosition;
      if (orig && grabbedRef.current.position.distanceTo(orig) < settings.snapDistance) {
        grabbedRef.current.position.copy(orig);
        grabbedRef.current.rotation.copy(grabbedRef.current.userData.originalRotation);
      }

      grabbedRef.current = null;
      pointerIdRef.current = null;
    }
  };

  // Allow resetting all parts from UI? We can expose a reset function via ref or just use a key to remount.
  // We'll use a key to remount the viewer in the parent if needed.

  return (
    <group>
      <Bvh firstHitOnly>
        <primitive 
          object={clonedScene} 
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      </Bvh>
      {settings.showGhost && (
        <primitive object={ghostScene} />
      )}
    </group>
  );
}
