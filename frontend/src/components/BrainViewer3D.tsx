import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCw, RefreshCw, Eye, EyeOff, Layers, Compass } from 'lucide-react';

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
  theme?: 'light' | 'dark';
}

export const BrainViewer3D: React.FC<BrainViewer3DProps> = ({
  meshes,
  loading,
  simplifiedMode = false,
  theme = 'dark',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshesRef = useRef<{ [key: string]: THREE.Mesh }>({});
  
  // UI controls
  const [showBrain, setShowBrain] = useState(true);
  const [brainOpacity, setBrainOpacity] = useState(0.18);
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
    const bgColor = theme === 'light' ? 0xf8fafc : 0x0f172a;
    scene.background = new THREE.Color(bgColor);
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
    controls.autoRotateSpeed = 1.0;
    controlsRef.current = controls;

    // Surgical Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(120, -150, 180);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x94a3b8, 0.7);
    dirLight2.position.set(-150, 120, -80);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xf59e0b, 0.8, 300);
    pointLight.position.set(0, 0, 100);
    scene.add(pointLight);

    // Subtle anatomical base ring
    const ringGeo = new THREE.RingGeometry(60, 61.5, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: theme === 'light' ? 0xcbd5e1 : 0x334155,
      side: THREE.DoubleSide,
    });
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
  }, [theme]);

  // Update background when theme changes
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(theme === 'light' ? 0xf8fafc : 0x0f172a);
    }
  }, [theme]);

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

    // 1. Brain Shell (Smooth Medical Glass Envelope)
    if (meshes.brain_shell && !meshes.brain_shell.empty) {
      const geo = createGeometry(meshes.brain_shell);
      const mat = new THREE.MeshPhysicalMaterial({
        color: theme === 'light' ? 0x64748b : 0x94a3b8,
        transparent: true,
        opacity: brainOpacity,
        roughness: 0.25,
        metalness: 0.1,
        clearcoat: 0.6,
        side: THREE.DoubleSide,
        depthWrite: false,
        wireframe: wireframe,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = showBrain;
      scene.add(mesh);
      meshesRef.current.brain_shell = mesh;
    }

    // 2. Whole Tumor (WT - Jade Green)
    if (meshes.whole_tumor && !meshes.whole_tumor.empty) {
      const geo = createGeometry(meshes.whole_tumor);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        transparent: true,
        opacity: 0.45,
        roughness: 0.35,
        metalness: 0.05,
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

    // 4. Enhancing Tumor (ET - Coral Red)
    if (meshes.enhancing_tumor && !meshes.enhancing_tumor.empty) {
      const geo = createGeometry(meshes.enhancing_tumor);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        roughness: 0.25,
        metalness: 0.1,
        side: THREE.DoubleSide,
        wireframe: wireframe,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = simplifiedMode ? false : showET;
      scene.add(mesh);
      meshesRef.current.enhancing_tumor = mesh;
    }
  }, [meshes, theme, wireframe]);

  // Dynamic Opacity / Visibility updates without geometry rebuild
  useEffect(() => {
    if (meshesRef.current.brain_shell) {
      meshesRef.current.brain_shell.visible = showBrain;
      (meshesRef.current.brain_shell.material as THREE.MeshPhysicalMaterial).opacity = brainOpacity;
    }
  }, [showBrain, brainOpacity]);

  useEffect(() => {
    if (meshesRef.current.whole_tumor) {
      meshesRef.current.whole_tumor.visible = simplifiedMode ? false : showWT;
    }
  }, [showWT, simplifiedMode]);

  useEffect(() => {
    if (meshesRef.current.tumor_core) {
      meshesRef.current.tumor_core.visible = simplifiedMode ? true : showTC;
    }
  }, [showTC, simplifiedMode]);

  useEffect(() => {
    if (meshesRef.current.enhancing_tumor) {
      meshesRef.current.enhancing_tumor.visible = simplifiedMode ? false : showET;
    }
  }, [showET, simplifiedMode]);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.object.position.set(0, -220, 140);
    }
  };

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors">
      {/* 3D Canvas Frame */}
      <div ref={mountRef} className="w-full h-[400px] sm:h-[460px] cursor-grab active:cursor-grabbing" />

      {/* Clinical Anatomical Compass Badges */}
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        <span className="bg-white/80 dark:bg-slate-800/80 backdrop-blur px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
          Anterior (A)
        </span>
        <span className="bg-white/80 dark:bg-slate-800/80 backdrop-blur px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
          RAS Coordinates
        </span>
      </div>

      {/* Top-Right Camera Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          title="Toggle Auto Rotation"
          className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition cursor-pointer backdrop-blur ${
            autoRotate
              ? 'bg-sky-600 text-white border-sky-600'
              : 'bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline text-[11px]">{autoRotate ? 'Rotating' : 'Rotate'}</span>
        </button>

        <button
          onClick={handleResetCamera}
          title="Reset Camera View"
          className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer backdrop-blur"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Medical Inspection Toolbar */}
      <div className="absolute bottom-3 inset-x-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg p-2.5 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm">
        {/* Left: Brain Shell & Opacity */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBrain(!showBrain)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
              showBrain
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                : 'text-slate-400 line-through'
            }`}
          >
            {showBrain ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Brain Outline</span>
          </button>

          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <span className="text-[11px]">Opacity:</span>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.05"
              value={brainOpacity}
              onChange={(e) => setBrainOpacity(parseFloat(e.target.value))}
              className="w-18 h-1 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />
          </div>
        </div>

        {/* Right: Subregion Pills (Clinician Mode) or Clean Legend (Patient Mode) */}
        {!simplifiedMode ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowWT(!showWT)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition cursor-pointer ${
                showWT
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'text-slate-400 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              WT (Whole)
            </button>
            <button
              onClick={() => setShowTC(!showTC)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition cursor-pointer ${
                showTC
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  : 'text-slate-400 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              TC (Core)
            </button>
            <button
              onClick={() => setShowET(!showET)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition cursor-pointer ${
                showET
                  ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800'
                  : 'text-slate-400 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              ET (Active)
            </button>
            <button
              onClick={() => setWireframe(!wireframe)}
              className={`p-1 rounded text-[11px] border ml-1 ${
                wireframe
                  ? 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800'
                  : 'text-slate-500 border-slate-200 dark:border-slate-700'
              }`}
              title="Toggle Mesh Wireframe"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Detected Lesion Area
            </span>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-20">
          <div className="w-7 h-7 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Reconstructing 3D Anatomical Surfaces...
          </span>
        </div>
      )}
    </div>
  );
};
