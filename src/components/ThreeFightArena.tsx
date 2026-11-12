import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FighterState, MatchPhase, SlapRating } from '../types/game';
import { Camera, Eye, Video, Sparkles, RefreshCw } from 'lucide-react';

interface ThreeFightArenaProps {
  fighter1: FighterState;
  fighter2: FighterState;
  currentAttacker: 1 | 2;
  phase: MatchPhase;
  lastSlapInfo: {
    rating: SlapRating;
    damage: number;
    isCrit: boolean;
    comicText: string;
    targetPlayer: 1 | 2;
  } | null;
  roundNumber: number;
}

type CameraViewMode = 'BROADCAST' | 'SLAPPER_POV' | 'VICTIM_POV' | 'ORBIT';

// Helper to create character procedural textures
function createSkinMaterial(colorHex: number, roughness = 0.6) {
  return new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness,
    metalness: 0.05,
  });
}

export const ThreeFightArena: React.FC<ThreeFightArenaProps> = ({
  fighter1,
  fighter2,
  currentAttacker,
  phase,
  lastSlapInfo,
  roundNumber,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('BROADCAST');
  const [showDamagePopup, setShowDamagePopup] = useState<{
    text: string;
    damage: number;
    isCrit: boolean;
    x: number;
    y: number;
  } | null>(null);

  // References to keep across re-renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameIdRef = useRef<number>(0);

  // Character 3D Rigs
  const p1RigRef = useRef<{
    root: THREE.Group;
    torso: THREE.Group;
    head: THREE.Group;
    rightArm: THREE.Group;
    rightForearm: THREE.Group;
    rightHand: THREE.Group;
    leftArm: THREE.Group;
    cheekMark: THREE.Mesh;
    baseY: number;
  } | null>(null);

  const p2RigRef = useRef<{
    root: THREE.Group;
    torso: THREE.Group;
    head: THREE.Group;
    rightArm: THREE.Group;
    rightForearm: THREE.Group;
    rightHand: THREE.Group;
    leftArm: THREE.Group;
    cheekMark: THREE.Mesh;
    baseY: number;
  } | null>(null);

  // Chalk particle system
  const particlesRef = useRef<{
    points: THREE.Points;
    velocities: Float32Array;
    lifetimes: Float32Array;
    active: boolean;
  } | null>(null);

  // Impact Shockwave Ring
  const shockwaveRef = useRef<THREE.Mesh | null>(null);

  // Animation and physics state
  const animStateRef = useRef({
    time: 0,
    windupProgress: 0,
    swingProgress: 0,
    recoilProgress: 0,
    koProgress: 0,
    cameraShake: 0,
    isShaking: false,
  });

  // Current match props cached in refs for render loop
  const matchStateRef = useRef({
    fighter1,
    fighter2,
    currentAttacker,
    phase,
    lastSlapInfo,
  });

  useEffect(() => {
    matchStateRef.current = {
      fighter1,
      fighter2,
      currentAttacker,
      phase,
      lastSlapInfo,
    };
  }, [fighter1, fighter2, currentAttacker, phase, lastSlapInfo]);

  // Handle phase changes & trigger animations
  useEffect(() => {
    if (phase === 'WINDUP') {
      animStateRef.current.windupProgress = 0;
      animStateRef.current.swingProgress = 0;
      animStateRef.current.recoilProgress = 0;
    } else if (phase === 'IMPACT') {
      animStateRef.current.cameraShake = lastSlapInfo?.isCrit ? 0.35 : 0.18;
      triggerChalkBlast(lastSlapInfo?.targetPlayer === 1 ? 1 : 2, lastSlapInfo?.isCrit || false);
      
      if (lastSlapInfo) {
        setShowDamagePopup({
          text: lastSlapInfo.comicText,
          damage: lastSlapInfo.damage,
          isCrit: lastSlapInfo.isCrit,
          x: lastSlapInfo.targetPlayer === 1 ? 35 : 65,
          y: 35,
        });
        setTimeout(() => setShowDamagePopup(null), 1200);
      }
    } else if (phase === 'KNOCKOUT') {
      animStateRef.current.koProgress = 0;
    }
  }, [phase, lastSlapInfo]);

  // Trigger 3D Chalk Particle Explosion
  const triggerChalkBlast = (targetPlayer: 1 | 2, isCrit: boolean) => {
    if (!particlesRef.current || !shockwaveRef.current) return;
    const { points, velocities, lifetimes } = particlesRef.current;
    const positions = points.geometry.attributes.position.array as Float32Array;

    // Chalk explosion origin at defender's cheek
    const originX = targetPlayer === 1 ? -1.1 : 1.1;
    const originY = 2.4;
    const originZ = 0.2;

    const count = positions.length / 3;
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      positions[idx] = originX;
      positions[idx + 1] = originY;
      positions[idx + 2] = originZ;

      const angle = (targetPlayer === 1 ? -1 : 1) * (Math.PI * 0.2 + Math.random() * Math.PI * 0.6);
      const elevation = (Math.random() - 0.3) * Math.PI;
      const speed = (isCrit ? 6.5 : 4.0) + Math.random() * (isCrit ? 6 : 4);

      velocities[idx] = Math.cos(angle) * Math.cos(elevation) * speed;
      velocities[idx + 1] = Math.sin(elevation) * speed + 1.5;
      velocities[idx + 2] = Math.sin(angle) * Math.cos(elevation) * speed;

      lifetimes[i] = 1.0;
    }

    points.geometry.attributes.position.needsUpdate = true;
    particlesRef.current.active = true;

    // Trigger 3D shockwave ring
    const sw = shockwaveRef.current;
    sw.position.set(originX, originY, originZ);
    sw.scale.set(0.1, 0.1, 0.1);
    sw.rotation.y = targetPlayer === 1 ? Math.PI / 4 : -Math.PI / 4;
    (sw.material as THREE.MeshBasicMaterial).opacity = isCrit ? 0.9 : 0.6;
    sw.visible = true;
  };

  // Build Procedural 3D Fighter Model with 8+ Articulated Parts
  const buildFighterModel = (characterId: string, isFacingRight: boolean) => {
    const root = new THREE.Group();

    // Palette per character
    let skinColor = 0xe0a884;
    let clothColor = 0x222222;
    let hairColor = 0x111111;
    let accentColor = 0xf59e0b;

    if (characterId === 'boris') {
      skinColor = 0xd99b75;
      clothColor = 0x333b28; // Military brawler
      hairColor = 0x2b2b2b;
      accentColor = 0xf97316;
    } else if (characterId === 'kenji') {
      skinColor = 0xeac2a3;
      clothColor = 0x1e293b; // Ninja/Dojo gi
      hairColor = 0x09090b;
      accentColor = 0x38bdf8;
    } else if (characterId === 'helga') {
      skinColor = 0xf0cbb5;
      clothColor = 0x7f1d1d; // Plaid warrior
      hairColor = 0xfacc15; // Blonde
      accentColor = 0xef4444;
    } else if (characterId === 'sterling') {
      skinColor = 0xefcfbe;
      clothColor = 0xf8fafc; // Dapper formal shirt
      hairColor = 0x3f2e22;
      accentColor = 0xeab308;
    }

    const skinMat = createSkinMaterial(skinColor, 0.55);
    const clothMat = new THREE.MeshStandardMaterial({ color: clothColor, roughness: 0.7 });
    const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.85 });
    const accentMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.4, metalness: 0.2 });

    // 1. Lower Body (Legs & Boots)
    const legGeo = new THREE.CylinderGeometry(0.16, 0.14, 1.2, 12);
    const bootGeo = new THREE.BoxGeometry(0.25, 0.25, 0.45);
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 });

    // Left Leg
    const leftLeg = new THREE.Mesh(legGeo, clothMat);
    leftLeg.position.set(-0.25, 0.6, 0);
    leftLeg.castShadow = true;
    root.add(leftLeg);

    const leftBoot = new THREE.Mesh(bootGeo, bootMat);
    leftBoot.position.set(-0.25, 0.12, 0.1);
    leftBoot.castShadow = true;
    root.add(leftBoot);

    // Right Leg
    const rightLeg = new THREE.Mesh(legGeo, clothMat);
    rightLeg.position.set(0.25, 0.6, 0);
    rightLeg.castShadow = true;
    root.add(rightLeg);

    const rightBoot = new THREE.Mesh(bootGeo, bootMat);
    rightBoot.position.set(0.25, 0.12, 0.1);
    rightBoot.castShadow = true;
    root.add(rightBoot);

    // 2. Torso & Pelvis
    const torso = new THREE.Group();
    torso.position.set(0, 1.2, 0);
    root.add(torso);

    const pelvisGeo = new THREE.CylinderGeometry(0.38, 0.32, 0.35, 12);
    const pelvis = new THREE.Mesh(pelvisGeo, clothMat);
    pelvis.position.set(0, 0.18, 0);
    torso.add(pelvis);

    // Muscular Chest/Torso
    const chestGeo = new THREE.CylinderGeometry(0.48, 0.38, 0.85, 12);
    const chest = new THREE.Mesh(chestGeo, characterId === 'boris' ? skinMat : clothMat);
    chest.position.set(0, 0.72, 0);
    chest.castShadow = true;
    torso.add(chest);

    // Character Special Attire
    if (characterId === 'sterling') {
      // Suspenders & bow-tie
      const tieGeo = new THREE.BoxGeometry(0.18, 0.08, 0.08);
      const tie = new THREE.Mesh(tieGeo, accentMat);
      tie.position.set(0, 1.1, 0.28);
      torso.add(tie);
    } else if (characterId === 'boris') {
      // Spiked shoulder guard
      const guardGeo = new THREE.SphereGeometry(0.26, 12, 12);
      const metalMat = new THREE.MeshStandardMaterial({ color: 0x52525b, metalness: 0.8, roughness: 0.25 });
      const guard = new THREE.Mesh(guardGeo, metalMat);
      guard.position.set(isFacingRight ? -0.55 : 0.55, 1.05, 0);
      torso.add(guard);
    }

    // 3. Head & Face
    const head = new THREE.Group();
    head.position.set(0, 1.25, 0);
    torso.add(head);

    const headGeo = new THREE.SphereGeometry(0.28, 16, 16);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    head.add(headMesh);

    // Red Slap Handprint Decal on the Cheek
    const cheekGeo = new THREE.CircleGeometry(0.13, 16);
    const cheekMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const cheekMark = new THREE.Mesh(cheekGeo, cheekMat);
    // Position on cheek facing the slap table
    cheekMark.position.set(isFacingRight ? 0.24 : -0.24, -0.02, 0.18);
    cheekMark.rotation.y = isFacingRight ? Math.PI * 0.3 : -Math.PI * 0.3;
    head.add(cheekMark);

    // Facial Features & Character Hairstyles
    if (characterId === 'boris') {
      // Thick bushy beard
      const beardGeo = new THREE.CylinderGeometry(0.26, 0.18, 0.35, 12);
      const beard = new THREE.Mesh(beardGeo, hairMat);
      beard.position.set(0, -0.18, 0.14);
      head.add(beard);
    } else if (characterId === 'kenji') {
      // Spiky anime/warrior undercut hair
      const hairTopGeo = new THREE.ConeGeometry(0.28, 0.35, 8);
      const hairTop = new THREE.Mesh(hairTopGeo, hairMat);
      hairTop.position.set(0, 0.28, -0.05);
      hairTop.rotation.x = -0.3;
      head.add(hairTop);
    } else if (characterId === 'helga') {
      // Twin warrior braids
      const braidGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.65, 8);
      const b1 = new THREE.Mesh(braidGeo, hairMat);
      b1.position.set(-0.24, -0.15, 0.05);
      const b2 = new THREE.Mesh(braidGeo, hairMat);
      b2.position.set(0.24, -0.15, 0.05);
      head.add(b1);
      head.add(b2);
    } else if (characterId === 'sterling') {
      // Handlebar Mustache & Monocle
      const stacheGeo = new THREE.TorusGeometry(0.12, 0.035, 8, 12, Math.PI);
      const stache = new THREE.Mesh(stacheGeo, hairMat);
      stache.position.set(0, -0.08, 0.26);
      stache.rotation.z = Math.PI;
      head.add(stache);

      // Monocle
      const monocleGeo = new THREE.TorusGeometry(0.06, 0.012, 8, 16);
      const monocleMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.1 });
      const monocle = new THREE.Mesh(monocleGeo, monocleMat);
      monocle.position.set(0.12, 0.06, 0.27);
      head.add(monocle);
    }

    // 4. Arms & Slapping Hand Rig
    // Left Arm (Stabilizing / Rest arm)
    const armGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.55, 12);
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.5, 0.95, 0);
    torso.add(leftArm);

    const leftBicep = new THREE.Mesh(armGeo, skinMat);
    leftBicep.position.set(0, -0.28, 0);
    leftArm.add(leftBicep);

    const leftForearm = new THREE.Mesh(armGeo, skinMat);
    leftForearm.position.set(0, -0.68, 0.15);
    leftForearm.rotation.x = 0.5;
    leftArm.add(leftForearm);

    // Right Arm (The Slapping Arm with full hierarchical joints!)
    const rightArm = new THREE.Group();
    rightArm.position.set(0.5, 0.95, 0);
    torso.add(rightArm);

    const rightBicep = new THREE.Mesh(armGeo, skinMat);
    rightBicep.position.set(0, -0.28, 0);
    rightBicep.castShadow = true;
    rightArm.add(rightBicep);

    // Forearm Joint
    const rightForearm = new THREE.Group();
    rightForearm.position.set(0, -0.55, 0);
    rightArm.add(rightForearm);

    const forearmMesh = new THREE.Mesh(armGeo, skinMat);
    forearmMesh.position.set(0, -0.28, 0);
    forearmMesh.castShadow = true;
    rightForearm.add(forearmMesh);

    // Wrist Joint & 3D Articulated Open Slapping Palm
    const rightHand = new THREE.Group();
    rightHand.position.set(0, -0.55, 0);
    rightForearm.add(rightHand);

    // Palm
    const palmGeo = new THREE.BoxGeometry(0.22, 0.24, 0.08);
    const palm = new THREE.Mesh(palmGeo, skinMat);
    palm.castShadow = true;
    rightHand.add(palm);

    // Articulated Open Slap Fingers
    const fingerGeo = new THREE.CylinderGeometry(0.024, 0.02, 0.22, 8);
    for (let f = -1.5; f <= 1.5; f += 1) {
      const finger = new THREE.Mesh(fingerGeo, skinMat);
      finger.position.set(f * 0.055, -0.2, 0);
      rightHand.add(finger);
    }
    // Thumb
    const thumb = new THREE.Mesh(fingerGeo, skinMat);
    thumb.position.set(isFacingRight ? -0.14 : 0.14, -0.06, 0.04);
    thumb.rotation.z = isFacingRight ? -0.6 : 0.6;
    rightHand.add(thumb);

    // Orient whole character
    if (!isFacingRight) {
      root.rotation.y = Math.PI; // Face opposite side
    }

    return {
      root,
      torso,
      head,
      rightArm,
      rightForearm,
      rightHand,
      leftArm,
      cheekMark,
      baseY: 0,
    };
  };

  // Three.js Mount & Animation Loop Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x09090b);
    scene.fog = new THREE.FogExp2(0x09090b, 0.045);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(0, 2.5, 6.2);
    camera.lookAt(0, 1.8, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.appendChild(renderer.domElement);

    // 2. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    // Warm overhead Arena Spotlight on the Slap Table
    const centerSpot = new THREE.SpotLight(0xffedd5, 4.5, 15, Math.PI * 0.25, 0.5, 1);
    centerSpot.position.set(0, 6, 1.5);
    centerSpot.target.position.set(0, 1.4, 0);
    centerSpot.castShadow = true;
    centerSpot.shadow.bias = -0.0005;
    centerSpot.shadow.mapSize.width = 1024;
    centerSpot.shadow.mapSize.height = 1024;
    scene.add(centerSpot);
    scene.add(centerSpot.target);

    // Cool Rim Light for high-contrast fighters
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    rimLight.position.set(-4, 4, -4);
    scene.add(rimLight);

    const warmRim = new THREE.DirectionalLight(0xf97316, 1.4);
    warmRim.position.set(4, 3, -3);
    scene.add(warmRim);

    // 3. Stage Floor & Ring Ropes
    const floorGeo = new THREE.CylinderGeometry(6, 6.2, 0.4, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.8,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, -0.2, 0);
    floor.receiveShadow = true;
    scene.add(floor);

    // Octagon Canvas Mat with Gold Border
    const matGeo = new THREE.CylinderGeometry(4.2, 4.2, 0.02, 8);
    const matMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.9,
    });
    const combatMat = new THREE.Mesh(matGeo, matMat);
    combatMat.position.set(0, 0.01, 0);
    combatMat.receiveShadow = true;
    scene.add(combatMat);

    // 4. The Official Slap Table
    const tableGroup = new THREE.Group();
    tableGroup.position.set(0, 0, 0);

    const tableTopGeo = new THREE.BoxGeometry(1.6, 0.12, 0.9);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x3f3f46,
      roughness: 0.4,
      metalness: 0.3,
    });
    const tableTop = new THREE.Mesh(tableTopGeo, tableMat);
    tableTop.position.set(0, 1.35, 0);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    tableGroup.add(tableTop);

    // Table Steel Legs & Frame
    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.35, 12);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.5, metalness: 0.8 });
    const leg1 = new THREE.Mesh(legGeo, legMat); leg1.position.set(-0.65, 0.675, -0.35); leg1.castShadow = true;
    const leg2 = new THREE.Mesh(legGeo, legMat); leg2.position.set(0.65, 0.675, -0.35); leg2.castShadow = true;
    const leg3 = new THREE.Mesh(legGeo, legMat); leg3.position.set(-0.65, 0.675, 0.35); leg3.castShadow = true;
    const leg4 = new THREE.Mesh(legGeo, legMat); leg4.position.set(0.65, 0.675, 0.35); leg4.castShadow = true;
    tableGroup.add(leg1, leg2, leg3, leg4);

    // Center Chalk Bowl on Table
    const bowlGeo = new THREE.CylinderGeometry(0.16, 0.08, 0.1, 16);
    const bowlMat = new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.3, metalness: 0.7 });
    const bowl = new THREE.Mesh(bowlGeo, bowlMat);
    bowl.position.set(0, 1.45, 0);
    tableGroup.add(bowl);

    // Chalk inside bowl
    const chalkGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const chalkMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
    const chalk = new THREE.Mesh(chalkGeo, chalkMat);
    chalk.position.set(0, 1.47, 0);
    chalk.scale.set(1, 0.5, 1);
    tableGroup.add(chalk);

    scene.add(tableGroup);

    // 5. 3D Chalk Particle Explosion System
    const particleCount = 75;
    const particleGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const velArray = new Float32Array(particleCount * 3);
    const lifeArray = new Float32Array(particleCount);

    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.12,
      transparent: true,
      opacity: 0.85,
    });
    const points = new THREE.Points(particleGeo, particleMat);
    scene.add(points);

    particlesRef.current = {
      points,
      velocities: velArray,
      lifetimes: lifeArray,
      active: false,
    };

    // 6. Expanding 3D Shockwave Ring
    const shockwaveGeo = new THREE.RingGeometry(0.2, 0.35, 32);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const shockwave = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    shockwave.visible = false;
    scene.add(shockwave);
    shockwaveRef.current = shockwave;

    // 7. Instantiate Fighter 1 and Fighter 2 3D Models
    const p1Rig = buildFighterModel(fighter1.character.id, true);
    p1Rig.root.position.set(-1.3, 0, 0);
    scene.add(p1Rig.root);
    p1RigRef.current = p1Rig;

    const p2Rig = buildFighterModel(fighter2.character.id, false);
    p2Rig.root.position.set(1.3, 0, 0);
    scene.add(p2Rig.root);
    p2RigRef.current = p2Rig;

    // 8. Animation & Kinematics Game Loop
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      animStateRef.current.time += delta;
      const t = animStateRef.current.time;

      const { phase: currentPhase, currentAttacker: activeAttacker, fighter1: f1, fighter2: f2 } = matchStateRef.current;
      const p1 = p1RigRef.current;
      const p2 = p2RigRef.current;

      // Update Cheek Handprint Bruise Opacities
      if (p1 && p2) {
        (p1.cheekMark.material as THREE.MeshBasicMaterial).opacity = Math.min(0.85, f1.bruiseCount * 0.22);
        (p2.cheekMark.material as THREE.MeshBasicMaterial).opacity = Math.min(0.85, f2.bruiseCount * 0.22);
      }

      // Idle Stance Breathing
      const idleBob1 = Math.sin(t * 3.0) * 0.02;
      const idleBob2 = Math.sin(t * 3.0 + 1.2) * 0.02;

      // ==================== 3D SLAP KINEMATICS ENGINE ====================
      if (p1 && p2) {
        const attackerRig = activeAttacker === 1 ? p1 : p2;
        const defenderRig = activeAttacker === 1 ? p2 : p1;
        const dir = activeAttacker === 1 ? 1 : -1;

        if (currentPhase === 'WINDUP') {
          // Attacker coils back arm, twists torso back, lifts elbow high
          animStateRef.current.windupProgress = Math.min(1.0, animStateRef.current.windupProgress + delta * 2.8);
          const wp = animStateRef.current.windupProgress;

          // Torso twists back
          attackerRig.torso.rotation.y = -dir * wp * 0.75;
          attackerRig.torso.rotation.x = -wp * 0.15;
          // Shoulder elevates back
          attackerRig.rightArm.rotation.z = -dir * wp * 1.2;
          attackerRig.rightArm.rotation.y = dir * wp * 0.9;
          attackerRig.rightArm.rotation.x = -wp * 0.8;
          // Forearm bends back
          attackerRig.rightForearm.rotation.z = -dir * wp * 0.9;
          // Palm flares open
          attackerRig.rightHand.rotation.y = dir * wp * 0.5;

          // Defender braces nervously
          defenderRig.torso.position.x = dir * 1.35;
          defenderRig.head.rotation.y = dir * 0.15;
          defenderRig.torso.position.y = 1.2 + idleBob2;
        } 
        else if (currentPhase === 'IMPACT') {
          // Explosive forward slap whip!
          animStateRef.current.swingProgress = Math.min(1.0, animStateRef.current.swingProgress + delta * 8.0);
          const sp = animStateRef.current.swingProgress;

          // Powerful torso rotation driving through the target
          attackerRig.torso.rotation.y = dir * 0.85;
          attackerRig.torso.rotation.x = 0.2;
          attackerRig.torso.position.x = dir * -0.95; // Step forward onto table

          // Arm fully extends in a wide stinging whip arc
          attackerRig.rightArm.rotation.z = dir * 0.35;
          attackerRig.rightArm.rotation.y = -dir * 1.4;
          attackerRig.rightArm.rotation.x = 0.3;
          attackerRig.rightForearm.rotation.z = 0;
          attackerRig.rightHand.rotation.y = -dir * 0.8;

          // DEFENDER RECOIL: Head whips back violently!
          const lastInfo = matchStateRef.current.lastSlapInfo;
          const recoilAngle = lastInfo?.isCrit ? 1.25 : 0.75;
          defenderRig.head.rotation.y = -dir * recoilAngle;
          defenderRig.head.rotation.z = -dir * (recoilAngle * 0.5);
          defenderRig.torso.rotation.z = -dir * 0.25;
          defenderRig.torso.position.x = dir * (1.3 + (lastInfo?.isCrit ? 0.3 : 0.15));
        } 
        else if (currentPhase === 'REACTION') {
          // Attacker recovers to stance, Defender staggers and regains balance
          animStateRef.current.recoilProgress = Math.min(1.0, animStateRef.current.recoilProgress + delta * 2.0);
          const rp = animStateRef.current.recoilProgress;

          // Ease attacker back
          attackerRig.torso.rotation.y = THREE.MathUtils.lerp(attackerRig.torso.rotation.y, 0, rp * 0.2);
          attackerRig.torso.position.x = THREE.MathUtils.lerp(attackerRig.torso.position.x, 0, rp * 0.2);
          attackerRig.rightArm.rotation.set(0, 0, 0);

          // Ease defender back from stagger
          defenderRig.head.rotation.y = THREE.MathUtils.lerp(defenderRig.head.rotation.y, 0, rp * 0.15);
          defenderRig.head.rotation.z = THREE.MathUtils.lerp(defenderRig.head.rotation.z, 0, rp * 0.15);
          defenderRig.torso.rotation.z = THREE.MathUtils.lerp(defenderRig.torso.rotation.z, 0, rp * 0.15);
          defenderRig.torso.position.x = THREE.MathUtils.lerp(defenderRig.torso.position.x, 0, rp * 0.15);
        }
        else if (currentPhase === 'KNOCKOUT') {
          // Defender collapses down onto table or floor!
          animStateRef.current.koProgress = Math.min(1.0, animStateRef.current.koProgress + delta * 2.2);
          const kp = animStateRef.current.koProgress;

          const deadRig = f1.currentHp <= 0 ? p1 : p2;
          const winRig = f1.currentHp <= 0 ? p2 : p1;

          // Dead fighter slumps over table
          deadRig.torso.position.y = 1.2 - kp * 0.65;
          deadRig.torso.rotation.x = kp * 1.2;
          deadRig.torso.rotation.z = kp * 0.5;
          deadRig.head.rotation.x = kp * 0.8;

          // Winner raises slap arm in 3D triumph!
          winRig.rightArm.rotation.z = 2.4;
          winRig.rightArm.rotation.x = 0.4;
        } 
        else {
          // Standard Idle Breathing
          p1.torso.position.y = 1.2 + idleBob1;
          p1.torso.rotation.set(0, 0, 0);
          p1.head.rotation.set(0, 0, 0);
          p1.rightArm.rotation.set(0, 0, 0);

          p2.torso.position.y = 1.2 + idleBob2;
          p2.torso.rotation.set(0, 0, 0);
          p2.head.rotation.set(0, 0, 0);
          p2.rightArm.rotation.set(0, 0, 0);
        }
      }

      // Update 3D Chalk Particle Physics
      if (particlesRef.current && particlesRef.current.active) {
        const { points, velocities, lifetimes } = particlesRef.current;
        const positions = points.geometry.attributes.position.array as Float32Array;
        let anyAlive = false;

        for (let i = 0; i < lifetimes.length; i++) {
          if (lifetimes[i] > 0) {
            lifetimes[i] -= delta * 1.8;
            const idx = i * 3;
            positions[idx] += velocities[idx] * delta;
            positions[idx + 1] += velocities[idx + 1] * delta;
            positions[idx + 2] += velocities[idx + 2] * delta;
            velocities[idx + 1] -= 9.8 * delta; // Gravity

            if (lifetimes[i] > 0) anyAlive = true;
          }
        }
        points.geometry.attributes.position.needsUpdate = true;
        (points.material as THREE.PointsMaterial).opacity = Math.max(0, lifetimes[0]);

        if (!anyAlive) {
          particlesRef.current.active = false;
        }
      }

      // Update 3D Shockwave
      if (shockwaveRef.current && shockwaveRef.current.visible) {
        const sw = shockwaveRef.current;
        sw.scale.x += delta * 6.5;
        sw.scale.y += delta * 6.5;
        const mat = sw.material as THREE.MeshBasicMaterial;
        mat.opacity -= delta * 2.8;
        if (mat.opacity <= 0.05) {
          sw.visible = false;
        }
      }

      // 3D Camera Angles & Dynamic Dolly
      let targetCamPos = new THREE.Vector3(0, 2.4, 5.8);
      let targetLookAt = new THREE.Vector3(0, 1.7, 0);

      if (cameraMode === 'SLAPPER_POV') {
        // Over-the-shoulder view of the slapper looking past their hand
        const isP1 = activeAttacker === 1;
        targetCamPos = new THREE.Vector3(isP1 ? -2.6 : 2.6, 2.3, 1.2);
        targetLookAt = new THREE.Vector3(isP1 ? 1.3 : -1.3, 2.2, 0);
      } else if (cameraMode === 'VICTIM_POV') {
        // Dramatic Defender point of view: Watching the hand swing right at you!
        const isP1Victim = activeAttacker === 2;
        targetCamPos = new THREE.Vector3(isP1Victim ? -1.3 : 1.3, 2.4, 0.4);
        targetLookAt = new THREE.Vector3(isP1Victim ? 1.3 : -1.3, 2.2, 0);
      } else if (cameraMode === 'ORBIT') {
        // Slow cinematic orbit
        const rad = t * 0.35;
        targetCamPos = new THREE.Vector3(Math.sin(rad) * 5.5, 2.6, Math.cos(rad) * 5.5);
        targetLookAt = new THREE.Vector3(0, 1.7, 0);
      }

      // Camera Shake on Slap Impact
      if (animStateRef.current.cameraShake > 0) {
        const shake = animStateRef.current.cameraShake;
        targetCamPos.x += (Math.random() - 0.5) * shake;
        targetCamPos.y += (Math.random() - 0.5) * shake;
        targetCamPos.z += (Math.random() - 0.5) * shake;
        animStateRef.current.cameraShake = Math.max(0, animStateRef.current.cameraShake - delta * 1.5);
      }

      // Smooth camera interpolation
      camera.position.lerp(targetCamPos, delta * 5.0);
      camera.lookAt(targetLookAt);

      renderer.render(scene, camera);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    // Responsive Canvas Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [fighter1.character.id, fighter2.character.id, cameraMode]);

  return (
    <div className="relative w-full aspect-[16/9] max-h-[540px] rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl bg-neutral-950 select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Center Match & Round Badge */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-neutral-900/85 backdrop-blur-md px-4 py-1.5 rounded-full border border-neutral-700 text-xs font-semibold shadow-lg">
        <span className="text-amber-400 font-extrabold uppercase tracking-wider">
          Round {roundNumber}
        </span>
        <span className="text-neutral-500">|</span>
        <span className="text-neutral-200">
          {phase === 'COIN_TOSS' 
            ? 'Coin Flip' 
            : phase === 'KNOCKOUT' 
            ? 'KNOCKOUT!' 
            : currentAttacker === 1 
            ? `${fighter1.name}'s Slap` 
            : `${fighter2.name}'s Slap`}
        </span>
      </div>

      {/* Camera Mode Switcher Pill in Top Left */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-neutral-900/90 backdrop-blur-md p-1 rounded-xl border border-neutral-800 shadow">
        <button
          onClick={() => setCameraMode('BROADCAST')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
            cameraMode === 'BROADCAST' ? 'bg-amber-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
          }`}
          title="Ringside Broadcast View"
        >
          <Video className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ringside</span>
        </button>

        <button
          onClick={() => setCameraMode('SLAPPER_POV')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
            cameraMode === 'SLAPPER_POV' ? 'bg-amber-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
          }`}
          title="Attacker Over-the-Shoulder View"
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Attacker</span>
        </button>

        <button
          onClick={() => setCameraMode('VICTIM_POV')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
            cameraMode === 'VICTIM_POV' ? 'bg-amber-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
          }`}
          title="Defender Point-of-View (Brace!)"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Defender POV</span>
        </button>

        <button
          onClick={() => setCameraMode('ORBIT')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
            cameraMode === 'ORBIT' ? 'bg-amber-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
          }`}
          title="Cinematic Orbit"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Orbit</span>
        </button>
      </div>

      {/* Comic Impact Text Overlay Floating in 3D Space */}
      {showDamagePopup && (
        <div 
          style={{ left: `${showDamagePopup.x}%`, top: `${showDamagePopup.y}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex flex-col items-center animate-comic-pop"
        >
          <div className={`font-black text-3xl sm:text-5xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] px-4 py-1.5 rounded-xl border-2 transform -rotate-6 ${
            showDamagePopup.isCrit
              ? 'bg-red-600 text-yellow-300 border-yellow-300 shadow-[0_0_25px_rgba(239,68,68,0.8)]'
              : 'bg-neutral-900/90 text-amber-400 border-amber-500'
          }`}>
            {showDamagePopup.text}
          </div>
          <div className="text-xl sm:text-2xl font-black text-red-500 bg-neutral-950/90 px-3 py-0.5 rounded shadow mt-1">
            -{showDamagePopup.damage} DMG!
          </div>
        </div>
      )}

      {/* Bottom Fighter Nameplates Overlay */}
      <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none text-xs">
        <div className="bg-neutral-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-700/80 font-bold flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>{fighter1.name}</span>
          <span className="text-[10px] text-neutral-400 font-normal">({fighter1.currentHp} HP)</span>
        </div>

        <div className="bg-neutral-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-700/80 font-bold flex items-center gap-2">
          <span className="text-[10px] text-neutral-400 font-normal">({fighter2.currentHp} HP)</span>
          <span>{fighter2.name}</span>
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
        </div>
      </div>
    </div>
  );
};
