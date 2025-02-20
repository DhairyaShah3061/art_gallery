import React, { StrictMode, useRef, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [asciiColor, setAsciiColor] = useState("white");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const effectRef = useRef<AsciiEffect | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // Slightly increased intensity
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Stronger lighting
    directionalLight.position.set(2, 2, 2);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(2, 2, 2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x000000);
    renderer.shadowMap.enabled = true;
    
    const effect = new AsciiEffect(renderer, ' .:-+*=%@#', { // Reverted character set
      invert: true,
      resolution: 0.25 // Slightly increased resolution for more crispness
    });
    effect.setSize(window.innerWidth, window.innerHeight);
    effect.domElement.style.color = asciiColor;
    effect.domElement.style.backgroundColor = 'transparent';
    containerRef.current.appendChild(effect.domElement);
    effectRef.current = effect;

    const controls = new OrbitControls(camera, effect.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const loadModel = (url: string) => {
      const loader = new STLLoader();
      loader.load(url, (geometry) => {
        geometry.computeVertexNormals();
        geometry.center();

        const material = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.rotation.x = -Math.PI / 2;
        scene.add(mesh);
        meshRef.current = mesh;

        camera.lookAt(0, 0, 0);
        controls.update();
      });
    };

    if (uploadedFile) {
      const fileURL = URL.createObjectURL(uploadedFile);
      loadModel(fileURL);
    } else {
      loadModel('/model.stl');
    }

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      effect.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (cameraRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
      }
      effect.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(effect.domElement);
    };
  }, [uploadedFile]);

  return (
    <div className="min-h-screen">
      <div className="fixed top-0 left-0 w-full p-4 bg-opacity-75 z-10 bg-gray-800 flex justify-between items-center">
        <div className="flex gap-2">
          <input
            type="color"
            value={asciiColor}
            onChange={(e) => setAsciiColor(e.target.value)}
            className="cursor-pointer"
          />
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="btn bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Toggle {isDarkMode ? 'Light' : 'Dark'} Mode
          </button>
          <input
            type="file"
            accept=".stl"
            onChange={(e) => setUploadedFile(e.target.files ? e.target.files[0] : null)}
            className="btn bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
          />
        </div>
      </div>
      <div ref={containerRef} className="w-full h-screen" />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
