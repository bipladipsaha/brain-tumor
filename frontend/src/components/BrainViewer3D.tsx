import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCw, RefreshCw, Eye, EyeOff, Layers, Palette } from 'lucide-react';

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

export interface ColorPreset {
  id: string;
  name: string;
  hex: string;
  colorValue: number;
  emissive: number;
}

export const TUMOR_COLOR_PRESETS: ColorPreset[] = [
  { id: 'amber', name: 'Amber Gold', hex: '#F59E0B', colorValue: 0xF59E0B, emissive: 0x332000 },
  { id: 'rose', name: 'Blush Mauve', hex: '#E0B4B2', colorValue: 0xE0B4B2, emissive: 0x241414 },
  { id: 'coral', name: 'Sunset Coral', hex: '#F97316', colorValue: 0xF97316, emissive: 0x331400 },
  { id: 'ruby', name: 'Ruby Crimson', hex: '#F43F5E', colorValue: 0xF43F5E, emissive: 0x330010 },
  { id: 'cyan', name: 'Electric Cyan', hex: '#06B6D4', colorValue: 0x06B6D4, emissive: 0x00242B },
  { id: 'emerald', name: 'Surgical Emerald', hex: '#10B981', colorValue: 0x10B981, emissive: 0x002615 },
];

export const BrainViewer3D: React.FC<BrainViewer3DProps> = ({
  meshes,
  loading,
  simplifiedMode = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshesRef = useRef<{ [key: string]: THREE.Mesh }>({});
  
  // UI controls
  const [showBrain, setShowBrain] = useState(true);
  const [brainOpacity, setBrainOpacity] = useState(simplifiedMode ? 0.18 : 0.22);
  const [showWT, setShowWT] = useState(true);
  const [showTC, setShowTC] = useState(true);
  const [showET, setShowET] = useState(true);
  const [autoRotate, setAutoRotate] = useState(simplifiedMode);
  const [wireframe, setWireframe] = useState(false);
  const [selectedColor, setSelectedColor] = useState<ColorPreset>(TUMOR_COLOR_PRESETS[0]); // Amber Gold by default!

  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    // Deepest Midnight Teal background from ELAN palette (#0E1D21)
    scene.background = new THREE.Color(0x0E1D21);
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

    // Surgical Studio Lighting tailored to ELAN palette
    const ambientLight = new THREE.AmbientLight(0xABAFB5, 1.0);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xF1F5F9, 1.5);
    dirLight1.position.set(120, -150, 180);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x3B7E8C, 0.8);
    dirLight2.position.set(-150, 120, -80);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(selectedColor.colorValue, 0.8, 300);
    pointLight.position.set(0, 0, 100);
    scene.add(pointLight);

    // Subtle anatomical base ring in muted teal (#244C56)
    const ringGeo = new THREE.RingGeometry(60, 61.5, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x244C56,
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

    // 1. Brain Shell (Luminous Crystalline Glass Brain Envelope)
    if (meshes.brain_shell && !meshes.brain_shell.empty) {
      const geo = createGeometry(meshes.brain_shell);
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0xCBD5E1,        // Platinum silver-ice
        emissive: 0x122E34,     // Subtle deep surgical glow to delineate gyri
        transparent: true,
        opacity: brainOpacity,
        roughness: 0.15,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        side: THREE.FrontSide,
        depthWrite: false,
        wireframe: wireframe,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = showBrain;
      scene.add(mesh);
      meshesRef.current.brain_shell = mesh;
    }

    // 2. Whole Tumor (WT / Primary Lesion in Patient View)
    if (meshes.whole_tumor && !meshes.whole_tumor.empty) {
      const geo = createGeometry(meshes.whole_tumor);
      const tumorColor = simplifiedMode ? selectedColor.colorValue : 0x38BDF8;
      const tumorEmissive = simplifiedMode ? selectedColor.emissive : 0x001525;
      const mat = new THREE.MeshStandardMaterial({
        color: tumorColor,
        emissive: tumorEmissive,
        transparent: true,
        opacity: simplifiedMode ? 0.95 : 0.40,
        roughness: 0.2,
        metalness: 0.15,
        side: THREE.DoubleSide,
        wireframe: wireframe,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = showWT;
      scene.add(mesh);
      meshesRef.current.whole_tumor = mesh;
    }

    // 3. Tumor Core (TC - Warm Amber)
    if (meshes.tumor_core && !meshes.tumor_core.empty) {
      const geo = createGeometry(meshes.tumor_core);
      const mat = new THREE.MeshStandardMaterial({
        color: selectedColor.colorValue,
        emissive: selectedColor.emissive,
        transparent: true,
        opacity: simplifiedMode ? 0.95 : 0.80,
        roughness: 0.2,
        metalness: 0.15,
        side: THREE.DoubleSide,
        wireframe: wireframe,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = simplifiedMode ? false : showTC;
      scene.add(mesh);
      meshesRef.current.tumor_core = mesh;
    }

    // 4. Enhancing Tumor (ET - Vivid Ruby Red)
    if (meshes.enhancing_tumor && !meshes.enhancing_tumor.empty) {
      const geo = createGeometry(meshes.enhancing_tumor);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xEF4444,
        emissive: 0x330000,
        transparent: false,
        opacity: 1.0,
        roughness: 0.15,
        metalness: 0.2,
        side: THREE.DoubleSide,
        wireframe: wireframe,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = simplifiedMode ? false : showET;
      scene.add(mesh);
      meshesRef.current.enhancing_tumor = mesh;
    }
  }, [meshes, brainOpacity, wireframe, selectedColor, simplifiedMode]);

  // Update color dynamically on swatch change
  useEffect(() => {
    if (meshesRef.current.whole_tumor && simplifiedMode) {
      const mat = meshesRef.current.whole_tumor.material as THREE.MeshStandardMaterial;
      mat.color.setHex(selectedColor.colorValue);
      mat.emissive.setHex(selectedColor.emissive);
      mat.needsUpdate = true;
    }
    if (meshesRef.current.tumor_core && !simplifiedMode) {
      const mat = meshesRef.current.tumor_core.material as THREE.MeshStandardMaterial;
      mat.color.setHex(selectedColor.colorValue);
      mat.emissive.setHex(selectedColor.emissive);
      mat.needsUpdate = true;
    }
  }, [selectedColor, simplifiedMode]);

  useEffect(() => {
    if (meshesRef.current.brain_shell) {
      meshesRef.current.brain_shell.visible = showBrain;
    }
  }, [showBrain]);

  useEffect(() => {
    if (meshesRef.current.whole_tumor) {
      meshesRef.current.whole_tumor.visible = showWT;
    }
  }, [showWT]);

  useEffect(() => {
    if (meshesRef.current.tumor_core) {
      meshesRef.current.tumor_core.visible = simplifiedMode ? false : showTC;
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
    <div className="relative w-full rounded-xl overflow-hidden bg-[#0E1D21] border border-[#244C56] shadow-lg">
      {/* 3D Canvas Frame */}
      <div ref={mountRef} className="w-full h-[400px] sm:h-[460px] cursor-grab active:cursor-grabbing" />

      {/* Clinical Anatomical Compass Badges */}
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none text-[11px] font-semibold text-[#ABAFB5]">
        <span className="bg-[#122E34]/90 backdrop-blur-md px-2.5 py-1 rounded border border-[#244C56] shadow-sm">
          Anterior (A)
        </span>
        <span className="bg-[#122E34]/90 backdrop-blur-md px-2.5 py-1 rounded border border-[#244C56] shadow-sm">
          RAS Coordinates
        </span>
      </div>

      {/* Top-Right Camera Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          title="Toggle Auto Rotation"
          className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition cursor-pointer shadow-sm ${
            autoRotate
              ? 'bg-[#3B7E8C] text-white border-[#3B7E8C]'
              : 'bg-[#122E34]/95 text-[#ABAFB5] border-[#244C56] hover:bg-[#183840]'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline text-[11px]">{autoRotate ? 'Rotating' : 'Rotate'}</span>
        </button>

        <button
          onClick={handleResetCamera}
          title="Reset Camera View"
          className="p-1.5 rounded-lg bg-[#122E34]/95 text-[#ABAFB5] border border-[#244C56] hover:bg-[#183840] transition cursor-pointer shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bottom Medical Inspection Toolbar */}
      <div className="absolute bottom-3 inset-x-3 bg-[#122E34]/95 backdrop-blur-md rounded-lg p-2.5 border border-[#244C56] flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        {/* Left: Brain Shell & Opacity */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBrain(!showBrain)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
              showBrain
                ? 'bg-[#0E1D21] text-[#F1F5F9] border border-[#244C56]'
                : 'text-[#677E8A] line-through'
            }`}
          >
            {showBrain ? <Eye className="w-3.5 h-3.5 text-[#3B7E8C]" /> : <EyeOff className="w-3.5 h-3.5 text-[#677E8A]" />}
            <span>Brain Outline</span>
          </button>

          <div className="flex items-center gap-2 text-[#ABAFB5]">
            <span className="text-[11px] font-medium hidden sm:inline">Outline:</span>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.05"
              value={brainOpacity}
              onChange={(e) => setBrainOpacity(parseFloat(e.target.value))}
              className="w-16 sm:w-20 h-1.5 bg-[#0E1D21] rounded-lg appearance-none cursor-pointer accent-[#3B7E8C]"
              title="Brain Outline Transparency"
            />
          </div>
        </div>

        {/* Right: Color Palette Swatches & Subregion Pills */}
        <div className="flex items-center gap-3">
          {/* 3D Lesion Color Picker */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#677E8A] font-medium hidden md:inline">Shape Color:</span>
            <div className="flex items-center gap-1.5 bg-[#0E1D21] px-2 py-1 rounded-lg border border-[#244C56]">
              {TUMOR_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedColor(preset)}
                  title={`Color: ${preset.name}`}
                  className={`w-4 h-4 rounded-full transition-transform cursor-pointer border ${
                    selectedColor.id === preset.id
                      ? 'scale-125 border-white ring-2 ring-[#3B7E8C] shadow-sm'
                      : 'border-transparent hover:scale-115 opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: preset.hex }}
                />
              ))}
            </div>
          </div>

          {!simplifiedMode ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowWT(!showWT)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition cursor-pointer ${
                  showWT
                    ? 'bg-sky-950/70 text-sky-300 border-sky-800'
                    : 'text-[#677E8A] border-[#244C56] opacity-60'
                }`}
              >
                WT (Edema)
              </button>
              <button
                onClick={() => setShowTC(!showTC)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition cursor-pointer ${
                  showTC
                    ? 'bg-amber-950/70 text-amber-300 border-amber-800'
                    : 'text-[#677E8A] border-[#244C56] opacity-60'
                }`}
              >
                TC (Core)
              </button>
              <button
                onClick={() => setShowET(!showET)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition cursor-pointer ${
                  showET
                    ? 'bg-rose-950/70 text-rose-300 border-rose-800'
                    : 'text-[#677E8A] border-[#244C56] opacity-60'
                }`}
              >
                ET (Active)
              </button>
              <button
                onClick={() => setWireframe(!wireframe)}
                className={`p-1 rounded text-[11px] border ml-1 ${
                  wireframe
                    ? 'bg-[#3B7E8C] text-white border-[#3B7E8C]'
                    : 'text-[#677E8A] border-[#244C56]'
                }`}
                title="Toggle Mesh Wireframe"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-[#ABAFB5] font-medium">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm transition-colors"
                style={{ backgroundColor: selectedColor.hex }}
              />
              <span className="text-[#F1F5F9] font-medium">{selectedColor.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-[#0E1D21]/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
          <div className="w-7 h-7 border-2 border-[#3B7E8C] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-[#F1F5F9]">
            Reconstructing 3D Anatomical Surfaces...
          </span>
        </div>
      )}
    </div>
  );
};
