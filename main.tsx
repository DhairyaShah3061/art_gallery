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
  const [isCursorControl, setIsCursorControl] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const effectRef = useRef<AsciiEffect | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(2, 2, 2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x000000);
    const effect = new AsciiEffect(renderer, ' .:-+*=%@#', {
      invert: true,
      resolution: 0.2
    });
    effect.setSize(window.innerWidth, window.innerHeight);
    effect.domElement.style.color = asciiColor;
    effect.domElement.style.backgroundColor = 'transparent';
    containerRef.current.appendChild(effect.domElement);
    effectRef.current = effect;

    const controls = new OrbitControls(camera, effect.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const loader = new STLLoader();
    loader.load('/model.stl', (geometry) => {
      geometry.computeVertexNormals();
      geometry.center();

      const box = new THREE.Box3().setFromBufferAttribute(geometry.attributes.position);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 1 / maxDim;
      geometry.scale(scale, scale, scale);
      geometry.computeBoundingBox(); // Ensure bounding box is computed

      const material = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2; // Face forward
      scene.add(mesh);
      meshRef.current = mesh;

      camera.lookAt(0, 0, 0);
      controls.update();
    });

    const clock = new THREE.Clock();
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

    const handleMouseMove = (event: MouseEvent) => {
      if (isCursorControl && meshRef.current && cameraRef.current) {
        const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

        const tiltFactor = 0.1; // Adjust for how much the face tilts
        const targetRotationX = THREE.MathUtils.clamp(-mouseY * tiltFactor, -0.3, 0.3);
        const targetRotationY = THREE.MathUtils.clamp(mouseX * tiltFactor, -0.3, 0.3);

        // Smoothly interpolate the rotation for a natural look
        meshRef.current.rotation.x += (targetRotationX - meshRef.current.rotation.x) * 0.1;
        meshRef.current.rotation.y += (targetRotationY - meshRef.current.rotation.y) * 0.1;
        meshRef.current.rotation.z = 0; // Lock Z rotation
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      containerRef.current?.removeChild(effect.domElement);
    };
  }, [isCursorControl]);

  useEffect(() => {
    if (effectRef.current) {
      effectRef.current.domElement.style.color = asciiColor;
    }
  }, [asciiColor]);

  useEffect(() => {
    document.body.style.backgroundColor = isDarkMode ? 'black' : 'white';
    document.body.style.color = isDarkMode ? 'white' : 'black';
    if (effectRef.current) {
      effectRef.current.domElement.style.color = isDarkMode ? 'white' : 'black';
    }
  }, [isDarkMode]);

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
          <button
            onClick={() => setIsCursorControl(!isCursorControl)}
            className="btn bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
          >
            {isCursorControl ? 'Disable' : 'Enable'} Cursor Control
          </button>
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
