import React, { useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  GeotechParameters,
  VisualizationLayer,
  CellInspectionData,
} from '../types/geotech';
import { evaluatePointGeotech } from '../utils/terrainGenerator';
import { CameraViewMode } from './CinematicPlayerControls';

interface TerrainViewportProps {
  params: GeotechParameters;
  activeLayer: VisualizationLayer;
  verticalExaggeration: number;
  wireframeContours: boolean;
  isSimulatingFlow: boolean;
  selectedCell: CellInspectionData | null;
  onSelectCell: (cell: CellInspectionData) => void;
  // Cinematic props
  isCinematicMode?: boolean;
  cinematicProgress?: number; // 0 to 1
  cameraView?: CameraViewMode;
  rainIntensity?: 'none' | 'light' | 'storm';
}

const GRID_SEGMENTS = 110;
const TERRAIN_SIZE = 120;

/**
 * Malla del Terreno Base y Escarpe de Ruptura (Cicatriz del deslizamiento)
 */
const StableTerrainMesh: React.FC<{
  params: GeotechParameters;
  activeLayer: VisualizationLayer;
  verticalExaggeration: number;
  wireframeContours: boolean;
  cinematicProgress: number;
  onSelectCell: (cell: CellInspectionData) => void;
}> = ({
  params,
  activeLayer,
  verticalExaggeration,
  wireframeContours,
  cinematicProgress,
  onSelectCell,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry } = useMemo(() => {
    const geom = new THREE.PlaneGeometry(
      TERRAIN_SIZE,
      TERRAIN_SIZE,
      GRID_SEGMENTS,
      GRID_SEGMENTS
    );
    geom.rotateX(-Math.PI / 2);

    const posAttr = geom.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);
    const colorObj = new THREE.Color();

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const cell = evaluatePointGeotech(x, z, params);

      // Si estamos en la zona de deslizamiento y la masa ya se movió, se revela la superficie de falla cóncava
      const isInSlideCorridor = x > -22 && x < 15 && Math.abs(z) < 26;
      let elevation = cell.elevation_m;

      if (isInSlideCorridor && cinematicProgress > 0.15) {
        const slideDepression = Math.sin(((x + 22) / 37) * Math.PI) * Math.cos((z / 26) * (Math.PI / 2)) * 4.2;
        elevation = Math.max(2, elevation - slideDepression * Math.min(1, (cinematicProgress - 0.15) * 2.5));
      }

      posAttr.setY(i, elevation * verticalExaggeration);

      // Color de superficie de falla descubierta
      if (isInSlideCorridor && cinematicProgress > 0.25) {
        // Roca fresca expuesta / escarpe de falla
        colorObj.setRGB(0.48, 0.42, 0.35);
      } else if (activeLayer === 'safety_factor') {
        if (cell.safety_factor < 1.0) {
          colorObj.setRGB(0.92, 0.18, 0.22);
        } else if (cell.safety_factor < 1.3) {
          colorObj.setRGB(0.95, 0.68, 0.12);
        } else {
          colorObj.setRGB(0.06, 0.72, 0.51);
        }
      } else if (activeLayer === 'slope') {
        const t = Math.min(1, cell.slope_deg / 55);
        colorObj.setHSL((1 - t) * 0.35, 0.85, 0.45);
      } else if (activeLayer === 'saturation') {
        const s = cell.local_saturation;
        colorObj.setRGB(0.15 * (1 - s), 0.45 * s + 0.2, 0.95 * s + 0.15);
      } else if (activeLayer === 'elevation') {
        const h = Math.min(1, cell.elevation_m / 48);
        colorObj.setHSL(0.38 - h * 0.32, 0.65, 0.35 + h * 0.35);
      } else {
        // Geomorfológico realista
        if (Math.abs(x - 33) < 2.2) {
          colorObj.setRGB(0.12, 0.48, 0.78);
        } else if (Math.abs(x - 24) < 1.8) {
          colorObj.setRGB(0.24, 0.26, 0.29);
        } else if (cell.slope_deg > 38) {
          colorObj.setRGB(0.38, 0.35, 0.32);
        } else {
          colorObj.setRGB(0.16, 0.38, 0.24);
        }
      }

      colors[i * 3] = colorObj.r;
      colors[i * 3 + 1] = colorObj.g;
      colors[i * 3 + 2] = colorObj.b;
    }

    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.computeVertexNormals();
    return { geometry: geom };
  }, [params, activeLayer, verticalExaggeration, cinematicProgress]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      receiveShadow
      castShadow
      onClick={(e) => {
        e.stopPropagation();
        const pt = e.point;
        const cell = evaluatePointGeotech(pt.x, pt.z, params);
        onSelectCell(cell);
      }}
    >
      <meshStandardMaterial
        vertexColors
        roughness={0.8}
        metalness={0.05}
        wireframe={wireframeContours}
      />
    </mesh>
  );
};

/**
 * Cuña de Masa Deslizable Cinemática (El bloque gigante de tierra y roca que colapsa)
 */
const SlidingLandslideBlock: React.FC<{
  progress: number;
  verticalExaggeration: number;
}> = ({ progress, verticalExaggeration }) => {
  const blockRef = useRef<THREE.Group>(null);

  // Trayectoria no lineal del colapso
  const motion = useMemo(() => {
    // progress: 0 a 1
    if (progress < 0.15) {
      // Fase 1: Sin movimiento, solo leve tensión
      return { dx: 0, dy: 0, dz: 0, rotZ: 0, rotX: 0, scaleY: 1, scaleX: 1 };
    }
    if (progress < 0.35) {
      // Fase 2: Apertura de la grieta de corona (desplazamiento de 1-3 metros)
      const t = (progress - 0.15) / 0.2;
      return {
        dx: t * 3.5,
        dy: -t * 1.8 * verticalExaggeration,
        dz: 0,
        rotZ: -t * 0.08,
        rotX: 0,
        scaleY: 1 - t * 0.05,
        scaleX: 1 + t * 0.05,
      };
    }
    if (progress < 0.75) {
      // Fase 3: Aceleración gravitacional ladera abajo
      const t = (progress - 0.35) / 0.4;
      const easeT = t * t * 1.1; // Aceleración
      return {
        dx: 3.5 + easeT * 32,
        dy: (-1.8 - easeT * 22) * verticalExaggeration,
        dz: Math.sin(t * Math.PI) * 1.5,
        rotZ: -0.08 - easeT * 0.32,
        rotX: Math.sin(t * 3) * 0.05,
        scaleY: 0.95 - easeT * 0.4, // Se aplana y desintegra al descender
        scaleX: 1.05 + easeT * 0.65, // Se ensancha el cono de depósito
      };
    }
    // Fase 4 y 5: Depósito en el valle sobre la carretera y casas
    const t = (progress - 0.75) / 0.25;
    return {
      dx: 35.5 + t * 12,
      dy: (-23.8 - t * 3.5) * verticalExaggeration,
      dz: 1.5 - t * 0.5,
      rotZ: -0.4 - t * 0.05,
      rotX: 0,
      scaleY: 0.55 - t * 0.25, // Extendido como cono de deyección
      scaleX: 1.7 + t * 0.4,
    };
  }, [progress, verticalExaggeration]);

  if (progress < 0.05) return null;

  return (
    <group
      ref={blockRef}
      position={[-6 + motion.dx, 27 * verticalExaggeration + motion.dy, motion.dz]}
      rotation={[motion.rotX, 0, motion.rotZ]}
      scale={[motion.scaleX, motion.scaleY, motion.scaleX]}
    >
      {/* Cuerpo principal de la cuña rocosa y de suelo */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[26, 7.5, 38]} />
        <meshStandardMaterial color="#574635" roughness={0.92} metalness={0.05} />
      </mesh>

      {/* Capa de cobertura vegetal desprendida encima */}
      <mesh position={[0, 3.8, 0]} castShadow>
        <boxGeometry args={[26.2, 0.4, 38.2]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.7} />
      </mesh>

      {/* Bloques rocosos desmembrados dentro de la masa */}
      {[-8, -2, 6].map((xOffset, idx) => (
        <mesh key={idx} position={[xOffset, 3.2, (idx - 1) * 10]} castShadow>
          <dodecahedronGeometry args={[2.2 + idx * 0.4, 0]} />
          <meshStandardMaterial color="#6b6459" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
};

/**
 * Grieta de Tracción Iluminada en la Corona del Talud (Tension Crack)
 */
const CrownTensionCrack: React.FC<{ progress: number; verticalExaggeration: number }> = ({
  progress,
  verticalExaggeration,
}) => {
  if (progress < 0.12) return null;
  const crackWidth = Math.min(4.5, (progress - 0.12) * 14);

  return (
    <group position={[-20, 34.5 * verticalExaggeration, 0]}>
      {/* Brecha oscura de fractura geológica */}
      <mesh rotation={[0, 0, -0.2]}>
        <boxGeometry args={[crackWidth, 4.5, 42]} />
        <meshBasicMaterial color="#1a140e" />
      </mesh>
      {/* Línea de falla visual de alta tensión */}
      <mesh position={[0, 2.3, 0]}>
        <boxGeometry args={[crackWidth * 0.9, 0.2, 42.5]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  );
};

/**
 * Casas y Estructuras Civiles Dinámicas (Se sacuden, inclinan y sepultan en el colapso)
 */
const DynamicVulnerableHouses: React.FC<{
  progress: number;
  params: GeotechParameters;
  verticalExaggeration: number;
}> = ({ progress, params, verticalExaggeration }) => {
  const houseData = [
    { z: -22, impactDelay: 0.72, color: '#f1f5f9' },
    { z: -6, impactDelay: 0.62, color: '#e2e8f0' }, // En el centro de la trayectoria directa
    { z: 10, impactDelay: 0.66, color: '#cbd5e1' }, // En el centro de la trayectoria
    { z: 26, impactDelay: 0.76, color: '#94a3b8' },
  ];

  return (
    <group>
      {houseData.map((house, idx) => {
        const ground = evaluatePointGeotech(20, house.z, params);
        const isImpacted = progress > house.impactDelay;
        const impactRatio = isImpacted ? Math.min(1, (progress - house.impactDelay) * 4) : 0;

        // Traslación y rotación por empuje de escombros
        const houseY = ground.elevation_m * verticalExaggeration + 1.2 - impactRatio * 2.1;
        const houseX = 20 + impactRatio * 5.2; // Empujada hacia el valle
        const rotZ = impactRatio * 0.45;
        const rotY = impactRatio * 0.35;

        return (
          <group key={idx} position={[houseX, houseY, house.z]} rotation={[0, rotY, rotZ]}>
            {/* Estructura de la vivienda */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[3.2, 2.6, 4.0]} />
              <meshStandardMaterial
                color={isImpacted ? '#78716c' : house.color}
                roughness={0.5}
              />
            </mesh>

            {/* Techo a dos aguas */}
            <mesh position={[0, 1.8, 0]} castShadow>
              <coneGeometry args={[2.8, 1.2, 4]} />
              <meshStandardMaterial
                color={isImpacted ? '#57534e' : '#b91c1c'}
                roughness={0.6}
              />
            </mesh>

            {/* Alerta de Colapso Estructural */}
            {isImpacted && (
              <Html distanceFactor={40} position={[0, 3.5, 0]}>
                <div className="bg-red-950/95 border border-red-500 text-[10px] text-red-200 font-bold px-2 py-0.5 rounded shadow-lg animate-bounce pointer-events-none whitespace-nowrap">
                  ⚠️ ESTRUCTURA DESTRUIDA
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
};

/**
 * Sistema de Avalancha de Rocas, Escombros y Polvo Volumétrico
 */
const AvalancheDustAndRocks: React.FC<{
  progress: number;
  verticalExaggeration: number;
}> = ({ progress, verticalExaggeration }) => {
  const COUNT = 1200;
  const pointsRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      // Dispersión en la corona de falla
      seeds[i * 3] = -18 + Math.random() * 24;
      seeds[i * 3 + 1] = 28 + Math.random() * 8;
      seeds[i * 3 + 2] = -24 + Math.random() * 48;

      positions[i * 3] = seeds[i * 3];
      positions[i * 3 + 1] = seeds[i * 3 + 1] * verticalExaggeration;
      positions[i * 3 + 2] = seeds[i * 3 + 2];
    }
    return { positions, seeds };
  }, [verticalExaggeration]);

  useFrame(() => {
    if (!pointsRef.current || progress < 0.2) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;

    const t = (progress - 0.2) / 0.8; // 0 a 1 en la fase de avalancha

    for (let i = 0; i < COUNT; i++) {
      const origX = particles.seeds[i * 3];
      const origY = particles.seeds[i * 3 + 1];
      const origZ = particles.seeds[i * 3 + 2];

      const particleSpeed = 1.0 + (i % 5) * 0.35;
      const activeT = Math.min(1, t * particleSpeed);

      // Curva parabólica descendente
      const curX = origX + activeT * 55;
      const curY = Math.max(3, origY * verticalExaggeration - activeT * 32 * verticalExaggeration + Math.sin(activeT * 10 + i) * 1.5);
      const curZ = origZ + Math.sin(activeT * 4 + i) * 3.5;

      posAttr.setXYZ(i, curX, curY, curZ);
    }
    posAttr.needsUpdate = true;
  });

  if (progress < 0.2) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={COUNT}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.45}
        color={progress > 0.65 ? '#d97706' : '#854d0e'}
        transparent
        opacity={progress > 0.25 ? 0.75 : 0.3}
      />
    </points>
  );
};

/**
 * Lluvia Torrencial Animada
 */
const StormRainSystem: React.FC<{ active: boolean }> = ({ active }) => {
  const RAIN_COUNT = 1500;
  const rainRef = useRef<THREE.Points>(null);

  const rainPositions = useMemo(() => {
    const pos = new Float32Array(RAIN_COUNT * 3);
    for (let i = 0; i < RAIN_COUNT; i++) {
      pos[i * 3] = -50 + Math.random() * 100;
      pos[i * 3 + 1] = Math.random() * 80;
      pos[i * 3 + 2] = -50 + Math.random() * 100;
    }
    return pos;
  }, []);

  useFrame((_, delta) => {
    if (!active || !rainRef.current) return;
    const posAttr = rainRef.current.geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < RAIN_COUNT; i++) {
      let y = posAttr.getY(i) - 85 * delta;
      if (y < 2) y = 75 + Math.random() * 10;
      posAttr.setY(i, y);
    }
    posAttr.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={rainRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={RAIN_COUNT}
          array={rainPositions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.25} color="#38bdf8" transparent opacity={0.45} />
    </points>
  );
};

/**
 * Director de Cámara Cinemático con Transición Suave (Lerp)
 */
const CinematicCameraDirector: React.FC<{
  cameraView: CameraViewMode;
  progress: number;
}> = ({ cameraView, progress }) => {
  useFrame(({ camera }) => {
    if (cameraView === 'free') return;

    let targetPos = new THREE.Vector3(55, 45, 62);
    let targetLook = new THREE.Vector3(0, 15, 0);

    if (cameraView === 'lateral') {
      // Toma de perfil cinematográfico dramático
      targetPos.set(45, 36, 60);
      targetLook.set(0, 14, 0);
    } else if (cameraView === 'drone') {
      // Toma aérea descendente
      targetPos.set(15, 62, 55);
      targetLook.set(8, 12, 0);
    } else if (cameraView === 'crown') {
      // POV desde la cima mirando al abismo de colapso
      targetPos.set(-36, 48, 0);
      targetLook.set(20, 8, 0);
    } else if (cameraView === 'houses') {
      // Vista angular desde el valle mirando hacia la ladera en colapso
      targetPos.set(42, 16, -18);
      targetLook.set(5, 18, 0);
    }

    camera.position.lerp(targetPos, 0.05);
    camera.lookAt(targetLook);
  });

  return null;
};

export const TerrainViewport3D: React.FC<TerrainViewportProps> = (props) => {
  const {
    params,
    activeLayer,
    verticalExaggeration,
    wireframeContours,
    selectedCell,
    onSelectCell,
    isCinematicMode = false,
    cinematicProgress = 0,
    cameraView = 'lateral',
    rainIntensity = 'storm',
  } = props;

  return (
    <div className="relative w-full h-full bg-[#070b14] overflow-hidden select-none">
      <Canvas
        shadows
        camera={{ position: [55, 45, 62], fov: 45, near: 0.5, far: 500 }}
      >
        <color attach="background" args={[rainIntensity === 'storm' ? '#070a12' : '#090d16']} />
        <fog attach="fog" args={[rainIntensity === 'storm' ? '#080d18' : '#090d16', 70, 220]} />

        <ambientLight intensity={rainIntensity === 'storm' ? 0.4 : 0.6} />
        <directionalLight
          position={[-45, 85, 35]}
          intensity={rainIntensity === 'storm' ? 1.0 : 1.4}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />

        {/* Malla de Terreno Estable + Cicatriz de Falla */}
        <StableTerrainMesh
          params={params}
          activeLayer={activeLayer}
          verticalExaggeration={verticalExaggeration}
          wireframeContours={wireframeContours}
          cinematicProgress={cinematicProgress}
          onSelectCell={onSelectCell}
        />

        {/* Elementos Cinemáticos de Deslizamiento */}
        <CrownTensionCrack
          progress={cinematicProgress}
          verticalExaggeration={verticalExaggeration}
        />
        <SlidingLandslideBlock
          progress={cinematicProgress}
          verticalExaggeration={verticalExaggeration}
        />
        <DynamicVulnerableHouses
          progress={cinematicProgress}
          params={params}
          verticalExaggeration={verticalExaggeration}
        />
        <AvalancheDustAndRocks
          progress={cinematicProgress}
          verticalExaggeration={verticalExaggeration}
        />
        <StormRainSystem active={rainIntensity === 'storm'} />

        {/* Director de Cámara */}
        <CinematicCameraDirector
          cameraView={cameraView}
          progress={cinematicProgress}
        />

        <Grid
          position={[0, 1.9, 0]}
          args={[120, 120]}
          cellSize={5}
          cellThickness={0.5}
          cellColor="#1e293b"
          sectionSize={20}
          sectionThickness={1}
          sectionColor="#10b981"
          fadeDistance={160}
        />

        {cameraView === 'free' && (
          <OrbitControls
            makeDefault
            maxPolarAngle={Math.PI / 2 - 0.04}
            minDistance={18}
            maxDistance={175}
          />
        )}
      </Canvas>

      {/* Cartel Indicador de Modo Cinemático */}
      {isCinematicMode && (
        <div className="absolute top-4 left-4 bg-slate-950/90 border border-emerald-500/60 rounded-xl px-4 py-2.5 shadow-2xl backdrop-blur-md flex items-center gap-3 pointer-events-none">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
          <div>
            <div className="text-xs font-bold text-white tracking-wider flex items-center gap-2">
              <span>DEMO CINEMÁTICA: COLAPSO DE TALUD</span>
              <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-2 py-0.2 rounded font-mono">
                SIMULACIÓN ACTIVA
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Observa el desprendimiento de la masa rocosa, formación de grieta y sepultamiento en el valle.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
