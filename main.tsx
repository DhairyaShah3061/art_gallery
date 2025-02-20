import React, { StrictMode, useRef, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect';

function App() {
  const containerRef = useRef(null);
  const [asciiColor, setAsciiColor] = useState("white");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [uploadedFile, setUploadedFile] = useState(null);

  const sceneRef = useRef(null);
  const effectRef = useRef(null);
  const cameraRef = useRef(null);
  const meshRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35); // Slightly increased intensity
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Increased intensity for better visibility
    directionalLight.position.set(3, 5, 1).normalize();
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(2048, 2048);
    scene.add(directionalLight);

    const spotLight = new THREE.SpotLight(0xffffff, 1.2);
    spotLight.position.set(-3, 6, 4);
    spotLight.castShadow = true;
    scene.add(spotLight);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(3, 3, 3);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor(0x000000);
    renderer.shadowMap.enabled = true;
    
    const effect = new AsciiEffect(renderer, ' .:-+*=%@#', {
      invert: true,
      resolution: 0.3
    });
    effect.setSize(window.innerWidth, window.innerHeight);
    effect.domElement.style.color = asciiColor;
    effect.domElement.style.backgroundColor = 'transparent';
    containerRef.current.appendChild(effect.domElement);
    effectRef.current = effect;

    const controls = new OrbitControls(camera, effect.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const loadModel = (url) => {
      const loader = new STLLoader();
      loader.load(url, (geometry) => {
        geometry.computeVertexNormals();
        geometry.center();

        const box = new THREE.Box3().setFromBufferAttribute(geometry.attributes.position);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1 / maxDim;
        geometry.scale(scale, scale, scale);
        geometry.computeBoundingBox();

        const material = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.5, metalness: 0.2 });
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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
