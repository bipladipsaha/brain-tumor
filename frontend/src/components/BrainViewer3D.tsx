import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCw, RefreshCw, Eye, EyeOff, Layers } from 'lucide-react';

interface MeshData {
  vertices: number[][];
  faces: number[][];
  normals: number[][];
  vertex_count: number;
  face_count: number;
  empty?: boolean;
}

interface BrainViewer3DProps {
  meshes: {
    brain_shell?: MeshData;
    whole_tumor?: MeshData;
    tumor_core?: MeshData;
    enhancing_tumor?: MeshData;
  } | null;
  loading?: boolean;
  simplifiedMode?: boolean;
}

export const BrainViewer3D: React.FC<BrainViewer3DProps> = ({ meshes, loading, simplifiedMode = false }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshesRef = useRef<{ [key: string]: THREE.Mesh }>({});
  
  // UI states
  const [showBrain, setShowBrain] = useState(true);
  const [brainOpacity, setBrainOpacity] = useState(0.20);
  const [showWT, setShowWT] = useState(true);
  const [showTC, setShowTC] = useState(true);
  const [showET, setShowET] = useState(true);
  const [autoRotate, setAutoRotate] = useState(simplifiedMode);
  const [wireframe, setWireframe] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080c14);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1500);
    camera.position.set(0, -220, 140);
    camera.up.set(0, 0, 1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.8;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.2;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight1.position.set(120, -150, 180);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x60a5fa, 0.9);
    dirLight2.position.set(-150, 120, -80);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xf59e0b, 1.2, 350);
    pointLight.position.set(0, 0, 120);
    scene.add(pointLight);

    // Subtle soft ring
    const ringGeo = new THREE.RingGeometry(60, 62, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.z = -75;
    scene.add(ring);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  const createGeometry = (data: MeshData) => {
    const geometry = new THREE.BufferGeometry();
    const verticesFlat = new Float32Array(data.vertices.flat());
    const facesFlat = new Uint32Array(data.faces.flat());

    geometry.setAttribute('position', new THREE.BufferAttribute(verticesFlat, 3));
    geometry.setIndex(new THREE.BufferAttribute(facesFlat, 1));

    if (data.normals && data.normals.length > 0) {
      const normalsFlat = new Float32Array(data.normals.flat());
      geometry.setAttribute('normal', new THREE.BufferAttribute(normalsFlat, 3));
    } else {
      geometry.computeVertexNormals();
    }
    return geometry;
  };

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !meshes) return;

    Object.values(meshesRef.current).forEach((m) => {
      scene.remove(m);
      m.geometry.dispose();
      if (Array.isArray(m.material)) {
        m.material.forEach((mat) => mat.dispose());
      } else {
        m.material.dispose();
      }
    });
    meshesRef.current = {};

    // 1. Brain Shell
    if (meshes.brain_shell && !meshes.brain_shell.empty) {
      const geo = createGeometry(meshes.brain_shell);
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0x93c5fd,
        transparent: true,
        opacity: brainOpacity,
        roughness: 0.2,
        metalness: 0.1,
        clearcoat: 0.5,
        side: THREE.DoubleSide,
        depthWrite: false,
        wireframe: wireframe,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = showBrain;
      scene.add(mesh);
      meshesRef.current.brain_shell = mesh;
    }

    // 2. Whole Tumor (WT - Green)
    if (meshes.whole_tumor && !meshes.whole_tumor.empty) {
      const geo = createGeometry(meshes.whole_tumor);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.5,
        roughness: 0.35,
        metalness: 0.1,
        side: THREE.DoubleSide,
        wireframe: wireframe,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = simplifiedMode ? false : showWT;
      scene.add(mesh);
      meshesRef.current.whole_tumor = mesh;
    }

    // 3. Tumor Core (TC - Amber)
    if (meshes.tumor_core && !meshes.tumor_core.empty) {
      const geo = createGeometry(meshes.tumor_core);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        transparent: !simplifiedMode,
        opacity: simplifiedMode ? 1.0 : 0.85,
        roughness: 0.3,
        side: THREE.DoubleSide,
        wireframe: wireframe,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = simplifiedMode ? true : showTC;
      scene.add(mesh);
      meshesRef.current.tumor_core = mesh;
    }

    // 4. Enhancing Tumor (ET - Red)
    if (meshes.enhancing_tumor && !meshes.enhancing_tumor.empty) {
      const geo = createGeometry(meshes.enhancing_tumor);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        roughness: 0.2,
        metalness: 0.2,
        emissive: 0x7f1d1d,
        emissiveIntensity: 0.35,
        side: THREE.DoubleSide,
        wireframe: wireframe,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = simplifiedMode ? false : showET;
      scene.add(mesh);
      meshesRef.current.enhancing_tumor = mesh;
    }
  }, [meshes, wireframe, simplifiedMode]);

  useEffect(() => {
    if (meshesRef.current.brain_shell) {
      meshesRef.current.brain_shell.visible = showBrain;
      const mat = meshesRef.current.brain_shell.material as THREE.MeshPhysicalMaterial;
      mat.opacity = brainOpacity;
    }
  }, [showBrain, brainOpacity]);

  useEffect(() => {
    if (meshesRef.current.whole_tumor) meshesRef.current.whole_tumor.visible = showWT;
  }, [showWT]);

  useEffect(() => {
    if (meshesRef.current.tumor_core) meshesRef.current.tumor_core.visible = showTC;
  }, [showTC]);

  useEffect(() => {
    if (meshesRef.current.enhancing_tumor) meshesRef.current.enhancing_tumor.visible = showET;
  }, [showET]);

  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.object.position.set(0, -220, 140);
      controlsRef.current.update();
    }
  };

  return (
    <div className="relative w-full h-[520px] bg-gradient-to-b from-[#0B0F1A] to-[#070A12] rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl flex flex-col">
      <div ref={mountRef} className="w-full flex-1 cursor-grab active:cursor-grabbing" />

      {loading && (
        <div className="absolute inset-0 bg-[#0B0F19]/85 backdrop-blur-md flex flex-col items-center justify-center gap-3 z-30">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-200">Reconstructing 3D Brain Mesh...</p>
        </div>
      )}

      {/* Floating Legend */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/60 text-xs shadow-lg">
        {simplifiedMode ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-400/80 border border-blue-300" />
              <span className="text-slate-300 font-medium">Your Brain Outline</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
              <span className="text-amber-200 font-semibold">Detected Area</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-300 font-mono text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Brain
            </span>
            <span className="flex items-center gap-1 text-emerald-300 font-mono text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> WT
            </span>
            <span className="flex items-center gap-1 text-amber-300 font-mono text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> TC
            </span>
            <span className="flex items-center gap-1 text-red-300 font-mono text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> ET
            </span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition shadow-sm ${
            autoRotate
              ? 'bg-blue-600 text-white border-blue-500'
              : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
          {autoRotate ? 'Rotating' : 'Rotate'}
        </button>

        {!simplifiedMode && (
          <button
            onClick={() => setWireframe(!wireframe)}
            className={`p-2 rounded-lg border text-xs transition ${
              wireframe
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-900/80 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={handleReset}
          title="Reset View"
          className="p-2 rounded-lg bg-slate-900/80 text-slate-300 border border-slate-700 hover:bg-slate-800 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Control Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md px-5 py-3 rounded-xl border border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBrain(!showBrain)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              showBrain ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {showBrain ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Brain Shell
          </button>

          <div className="flex items-center gap-2 text-slate-400">
            <span>Opacity:</span>
            <input
              type="range"
              min="0.05"
              max="0.6"
              step="0.02"
              value={brainOpacity}
              onChange={(e) => setBrainOpacity(parseFloat(e.target.value))}
              className="w-20 accent-blue-500 cursor-pointer"
            />
          </div>

          {!simplifiedMode && (
            <>
              <div className="h-4 w-px bg-slate-700 mx-1" />
              <button
                onClick={() => setShowWT(!showWT)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition ${
                  showWT ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'
                }`}
              >
                WT
              </button>
              <button
                onClick={() => setShowTC(!showTC)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition ${
                  showTC ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-500'
                }`}
              >
                TC
              </button>
              <button
                onClick={() => setShowET(!showET)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition ${
                  showET ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-slate-800 text-slate-500'
                }`}
              >
                ET
              </button>
            </>
          )}
        </div>

        <span className="text-[11px] text-slate-400 hidden sm:inline">
          💡 Drag to rotate • Scroll to zoom
        </span>
      </div>
    </div>
  );
};
