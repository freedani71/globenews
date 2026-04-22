"use client";

import { useRef, useMemo, useState, Suspense, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { ThreeElements } from "@react-three/fiber";
import { OrbitControls, Html, Stars, useTexture } from "@react-three/drei";
import { useAppStore } from "@/lib/store";
import type { NewsItem } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Plus, Minus, RotateCcw } from "lucide-react";

// BackSide constant value from Three.js to avoid direct import
const BACK_SIDE = 1;

// NASA Blue Marble texture URL (public domain)
const EARTH_TEXTURE_URL = "https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg";

function latLngToPosition(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return [x, y, z];
}

function NewsPin({
  item,
  radius,
  onSelect,
  isSelected,
}: {
  item: NewsItem;
  radius: number;
  onSelect: (item: NewsItem) => void;
  isSelected: boolean;
}) {
  const meshRef = useRef<ThreeElements['mesh'] | null>(null);
  const [hovered, setHovered] = useState(false);
  const position = useMemo(
    () => latLngToPosition(item.lat, item.lng, radius),
    [item.lat, item.lng, radius]
  );

  const color = item.sponsored
    ? CATEGORY_COLORS.Sponsored
    : CATEGORY_COLORS[item.category];

  const scale = item.importance === "Breaking" ? 1.5 : item.importance === "Top" ? 1.2 : 1;

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.lookAt(0, 0, 0);
      if (hovered || isSelected) {
        meshRef.current.scale.setScalar(scale * 1.3);
      } else {
        meshRef.current.scale.setScalar(scale);
      }
    }
  });

  return (
    <group position={position}>
      {/* Main pin sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(item);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[0.035, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered || isSelected ? 1.2 : 0.6}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
      
      {/* Inner glow */}
      <mesh scale={1.4}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>
      
      {/* Outer glow */}
      <mesh scale={2.2}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
      
      {/* Pulse ring for breaking news */}
      {item.importance === "Breaking" && (
        <mesh scale={3}>
          <ringGeometry args={[0.03, 0.04, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} side={2} />
        </mesh>
      )}
      
      {/* Tooltip on hover */}
      {hovered && (
        <Html
          position={[0, 0.12, 0]}
          center
          style={{ pointerEvents: "none" }}
          zIndexRange={[100, 0]}
        >
          <div className="glass rounded-lg px-3 py-2 min-w-[220px] max-w-[300px] shadow-xl">
            <div className="flex items-center gap-2 mb-1.5">
              <span 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color }}
              >
                {item.sponsored ? "Sponsored" : item.category}
              </span>
              {item.importance === "Breaking" && (
                <span className="text-[10px] font-bold text-red-400 bg-red-400/20 px-1.5 py-0.5 rounded">
                  BREAKING
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-foreground leading-snug">
              {item.title}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {item.source}
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

function Earth({ news, onSelectNews, selectedNewsId }: { 
  news: NewsItem[]; 
  onSelectNews: (item: NewsItem) => void;
  selectedNewsId: string | null;
}) {
  const earthRef = useRef<ThreeElements['mesh'] | null>(null);
  const cloudsRef = useRef<ThreeElements['mesh'] | null>(null);
  const outerGlowRef = useRef<ThreeElements['mesh'] | null>(null);

  // Load NASA Blue Marble texture
  const earthTexture = useTexture(EARTH_TEXTURE_URL);

  useFrame((state) => {
    // Rotate clouds slowly
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += 0.0002;
    }
    // Subtle pulsing glow effect
    if (outerGlowRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 0.5) * 0.015 + 1.06;
      outerGlowRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group>
      {/* Earth with real texture */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Thin cloud layer */}
      <mesh ref={cloudsRef} scale={1.005}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.08}
        />
      </mesh>

      {/* Inner atmosphere glow */}
      <mesh scale={1.02}>
        <sphereGeometry args={[2, 48, 48]} />
        <meshBasicMaterial
          color="#4a9eff"
          transparent
          opacity={0.1}
          side={BACK_SIDE}
        />
      </mesh>

      {/* Outer atmosphere glow - pulsing */}
      <mesh ref={outerGlowRef} scale={1.06}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial
          color="#1e90ff"
          transparent
          opacity={0.05}
          side={BACK_SIDE}
        />
      </mesh>

      {/* News Pins */}
      {news.map((item) => (
        <NewsPin
          key={item.id}
          item={item}
          radius={2.04}
          onSelect={onSelectNews}
          isSelected={selectedNewsId === item.id}
        />
      ))}
    </group>
  );
}

// Store ref for zoom controls
let controlsRef: any = null;

function Scene({ news, onSelectNews, selectedNewsId }: { 
  news: NewsItem[]; 
  onSelectNews: (item: NewsItem) => void;
  selectedNewsId: string | null;
}) {
  const { camera } = useThree();
  
  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.3} />
      
      {/* Main sun light - warm white from top right */}
      <directionalLight 
        position={[5, 3, 5]} 
        intensity={1.5} 
        color="#fff5e6"
      />
      
      {/* Fill light from opposite side - cooler blue */}
      <directionalLight 
        position={[-5, -2, -5]} 
        intensity={0.3} 
        color="#4a9eff"
      />
      
      {/* Dense star field background */}
      <Stars
        radius={150}
        depth={80}
        count={6000}
        factor={4}
        saturation={0.1}
        fade
        speed={0.5}
      />

      <Suspense fallback={null}>
        <Earth news={news} onSelectNews={onSelectNews} selectedNewsId={selectedNewsId} />
      </Suspense>

      <OrbitControls
        ref={(ref) => { controlsRef = ref; }}
        enablePan={false}
        enableZoom={true}
        minDistance={2.5}
        maxDistance={12}
        autoRotate
        autoRotateSpeed={0.15}
        rotateSpeed={0.5}
        zoomSpeed={0.6}
        enableDamping
        dampingFactor={0.1}
      />
    </>
  );
}

export default function EarthGlobe() {
  const filteredNews = useAppStore((state) => state.filteredNews);
  const setSelectedNews = useAppStore((state) => state.setSelectedNews);
  const selectedNews = useAppStore((state) => state.selectedNews);
  const storeNews = useAppStore((state) => state.news);
  const filters = useAppStore((state) => state.filters);
  const [zoom, setZoom] = useState(4.5);
  
  // Get filtered news and ensure it's a valid array
  const news = useMemo(() => {
    try {
      const result = filteredNews();
      return Array.isArray(result) ? result.filter(item => 
        item && 
        typeof item.lat === 'number' && 
        typeof item.lng === 'number' &&
        !Number.isNaN(item.lat) && 
        !Number.isNaN(item.lng)
      ) : [];
    } catch {
      return [];
    }
  }, [filteredNews, storeNews, filters]);

  const handleZoomIn = useCallback(() => {
    if (controlsRef) {
      const newZoom = Math.max(2.5, controlsRef.getDistance() - 1);
      controlsRef.object.position.setLength(newZoom);
      controlsRef.update();
      setZoom(newZoom);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (controlsRef) {
      const newZoom = Math.min(12, controlsRef.getDistance() + 1);
      controlsRef.object.position.setLength(newZoom);
      controlsRef.update();
      setZoom(newZoom);
    }
  }, []);

  const handleReset = useCallback(() => {
    if (controlsRef) {
      controlsRef.reset();
      setZoom(4.5);
    }
  }, []);

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 50 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 2]}
        style={{ background: "transparent" }}
      >
        <Scene 
          news={news} 
          onSelectNews={setSelectedNews} 
          selectedNewsId={selectedNews?.id ?? null}
        />
      </Canvas>
      
      {/* Zoom Controls */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomIn}
          className="glass w-10 h-10 rounded-lg hover:bg-primary/20"
          title="Zoom In"
        >
          <Plus className="w-5 h-5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomOut}
          className="glass w-10 h-10 rounded-lg hover:bg-primary/20"
          title="Zoom Out"
        >
          <Minus className="w-5 h-5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleReset}
          className="glass w-10 h-10 rounded-lg hover:bg-primary/20"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
