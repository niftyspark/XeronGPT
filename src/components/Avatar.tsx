import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

interface AvatarProps {
  isSpeaking: boolean;
}

export function Avatar({ isSpeaking }: AvatarProps) {
  // Using a free Ready Player Me avatar URL
  const { scene, animations } = useGLTF('https://models.readyplayer.me/64b54e84b39b0d2b8b74c4a4.glb');
  const { actions } = useAnimations(animations, scene);
  const headRef = useRef<THREE.Object3D | null>(null);
  const jawRef = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    // Find head and jaw bones for simple lip-sync simulation
    scene.traverse((child) => {
      if (child.name === 'Head') {
        headRef.current = child;
      }
      if (child.name === 'Jaw') {
        jawRef.current = child;
      }
    });
  }, [scene]);

  useFrame((state) => {
    if (isSpeaking) {
      // Simulate talking by moving the jaw
      if (jawRef.current) {
        jawRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 15) * 0.1 + 0.1;
      }
      // Slight head bobbing
      if (headRef.current) {
        headRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.05;
        headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
      }
    } else {
      // Reset jaw
      if (jawRef.current) {
        jawRef.current.rotation.x = THREE.MathUtils.lerp(jawRef.current.rotation.x, 0, 0.1);
      }
      // Idle head movement
      if (headRef.current) {
        headRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
        headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.02;
      }
    }
  });

  return <primitive object={scene} scale={1.8} position={[0, -2.5, 0]} />;
}

useGLTF.preload('https://models.readyplayer.me/64b54e84b39b0d2b8b74c4a4.glb');
