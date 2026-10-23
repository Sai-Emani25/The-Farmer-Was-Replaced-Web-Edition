/**
 * The Farmer Was Replaced - Authentic 3D Farm Scene
 * Matches the official game screenshots (images f9a640f3 and 419d275c)
 * - Exact slate-blue atmosphere (#8598a6)
 * - 3D floating voxel soil cube with rock crevices, green turf top, and tall golden hay stalks
 * - Golden quadcopter drone with hat
 * - Flying golden piggy bank drone companion
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TileState, DroneState, FloatingText, Entities, Grounds } from './types';

const _targetPos = new THREE.Vector3();

export interface FarmSceneCallbacks {
  onTileClick?: (x: number, y: number) => void;
}

export class FarmScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private isSoftwareGl: boolean;
  private frameId: number = 0;
  private isDisposed: boolean = false;

  // Scene Objects
  private droneGroup: THREE.Group = new THREE.Group();
  private droneRotors: THREE.Mesh[] = [];
  private droneShadow: THREE.Mesh | null = null;
  private piggyGroup: THREE.Group = new THREE.Group();
  private piggyRotor: THREE.Mesh | null = null;

  // Grid tiles meshes
  private tilesGroup: THREE.Group = new THREE.Group();
  private tileMeshes: Map<string, { ground: THREE.Mesh; turfMesh: THREE.Mesh; cropGroup: THREE.Group }> = new Map();
  private floatingTextsGroup: THREE.Group = new THREE.Group();
  private activeFloatingTexts: { mesh: THREE.Sprite; text: FloatingText }[] = [];

  // Materials
  private materials: { [key: string]: THREE.Material } = {};

  constructor(container: HTMLElement, private callbacks?: FarmSceneCallbacks) {
    this.container = container;

    // Detect software WebGL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Initialize Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth, container.clientHeight);

    container.appendChild(this.renderer.domElement);

    // Scene & Horizon Fog with authentic TFWR color #8598a6
    this.scene = new THREE.Scene();
    const skyColor = new THREE.Color(0x8598a6);
    this.scene.background = skyColor;
    this.scene.fog = new THREE.FogExp2(0x8598a6, 0.015);

    // Camera setup - authentic angled isometric perspective
    this.camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    this.camera.position.set(7, 10, 8);
    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 50;
    this.controls.target.set(0, 0, 0);

    // Studio Environment reflection
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.5);
    keyLight.position.set(10, 20, 12);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0003;
    this.scene.add(keyLight);

    const fillLight = new THREE.HemisphereLight(0xa6b8c7, 0x5a6873, 1.4);
    this.scene.add(fillLight);

    // Initialize Groups
    this.scene.add(this.tilesGroup);
    this.scene.add(this.droneGroup);
    this.scene.add(this.piggyGroup);
    this.scene.add(this.floatingTextsGroup);

    this.initMaterials();
    this.buildDroneModel();
    this.buildPiggyCompanion();

    window.addEventListener('resize', this.onResize);
    this.startLoop();
  }

  private initMaterials() {
    // Floating soil cube side material (yellow-tan faceted rock/soil)
    this.materials['soilCube'] = new THREE.MeshStandardMaterial({
      color: 0xdf9b3e,
      roughness: 0.8,
      metalness: 0.05,
    });

    // Top grass turf material (fresh bright green)
    this.materials['turfGrass'] = new THREE.MeshStandardMaterial({
      color: 0x76b837,
      roughness: 0.6,
      metalness: 0.02,
    });

    // Tilled soil top
    this.materials['tilledSoil'] = new THREE.MeshStandardMaterial({
      color: 0x5a3d28,
      roughness: 0.9,
    });

    // Golden hay stalks material
    this.materials['goldenHay'] = new THREE.MeshStandardMaterial({
      color: 0xf5cf53,
      roughness: 0.4,
      metalness: 0.1,
    });

    // Golden drone body
    this.materials['droneGold'] = new THREE.MeshStandardMaterial({
      color: 0xf3bd4a,
      roughness: 0.35,
      metalness: 0.4,
    });

    // Drone dark arms & rotors
    this.materials['droneDark'] = new THREE.MeshStandardMaterial({
      color: 0x3d3934,
      roughness: 0.4,
      metalness: 0.6,
    });

    // Piggy companion body
    this.materials['piggyGold'] = new THREE.MeshStandardMaterial({
      color: 0xf0b842,
      roughness: 0.4,
      metalness: 0.3,
    });

    this.materials['contactShadow'] = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    });

    // Crop materials
    this.materials['bushFoliage'] = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.6 });
    this.materials['carrotRoot'] = new THREE.MeshStandardMaterial({ color: 0xff7043, roughness: 0.4 });
    this.materials['pumpkin'] = new THREE.MeshStandardMaterial({ color: 0xf57c00, roughness: 0.45 });

    // Wet turf & wet soil materials (hydrated 5x growth state)
    this.materials['turfGrassWet'] = new THREE.MeshStandardMaterial({
      color: 0x4a821e,
      roughness: 0.35,
      metalness: 0.15,
    });
    this.materials['tilledSoilWet'] = new THREE.MeshStandardMaterial({
      color: 0x362316,
      roughness: 0.4,
      metalness: 0.15,
    });

    // Tree materials
    this.materials['treeTrunk'] = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.8 });
    this.materials['treeFoliage'] = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.5 });

    // Sunflower materials
    this.materials['sunflowerPetal'] = new THREE.MeshStandardMaterial({ color: 0xfbc02d, roughness: 0.3 });
    this.materials['sunflowerCenter'] = new THREE.MeshStandardMaterial({ color: 0x4e342e, roughness: 0.7 });

    // Cactus materials
    this.materials['cactus'] = new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.5 });

    // Dinosaur bones materials
    this.materials['dinosaur'] = new THREE.MeshStandardMaterial({ color: 0x81c784, roughness: 0.4 });
  }

  /**
   * Builds the authentic golden Drone from the screenshots:
   * - Golden octagonal/cylinder body with brimmed hat
   * - 4 dark angled arms with propellers
   */
  private buildDroneModel() {
    this.droneGroup.clear();
    this.droneRotors = [];

    // Main Golden Chassis
    const bodyGeo = new THREE.CylinderGeometry(0.48, 0.52, 0.22, 12);
    const bodyMesh = new THREE.Mesh(bodyGeo, this.materials['droneGold']);
    bodyMesh.castShadow = !this.isSoftwareGl;
    this.droneGroup.add(bodyMesh);

    // Conical Hat on top
    const hatBrimGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.04, 16);
    const hatBrim = new THREE.Mesh(hatBrimGeo, this.materials['droneGold']);
    hatBrim.position.y = 0.13;
    this.droneGroup.add(hatBrim);

    const hatConeGeo = new THREE.ConeGeometry(0.24, 0.18, 12);
    const hatCone = new THREE.Mesh(hatConeGeo, this.materials['droneGold']);
    hatCone.position.y = 0.23;
    this.droneGroup.add(hatCone);

    // 4 Quad Arms with dark propellers
    const angles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
    const armLength = 0.68;

    angles.forEach((angle) => {
      const armGroup = new THREE.Group();
      armGroup.rotation.y = angle;

      // Dark arm
      const armGeo = new THREE.BoxGeometry(armLength, 0.05, 0.07);
      const armMesh = new THREE.Mesh(armGeo, this.materials['droneDark']);
      armMesh.position.set(armLength / 2, 0, 0);
      armMesh.castShadow = !this.isSoftwareGl;
      armGroup.add(armMesh);

      // Motor pod
      const podGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.14, 8);
      const podMesh = new THREE.Mesh(podGeo, this.materials['droneDark']);
      podMesh.position.set(armLength, 0.04, 0);
      armGroup.add(podMesh);

      // Dark Rotor Blade
      const bladeGeo = new THREE.BoxGeometry(0.44, 0.015, 0.06);
      const bladeMesh = new THREE.Mesh(bladeGeo, this.materials['droneDark']);
      bladeMesh.position.set(armLength, 0.12, 0);
      armGroup.add(bladeMesh);
      this.droneRotors.push(bladeMesh);

      this.droneGroup.add(armGroup);
    });

    // Contact shadow
    const shadowGeo = new THREE.CircleGeometry(0.55, 24);
    const shadowMesh = new THREE.Mesh(shadowGeo, this.materials['contactShadow']);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, 0.02, 0);
    this.scene.add(shadowMesh);
    this.droneShadow = shadowMesh;

    this.droneGroup.position.set(0, 1.3, 0);
  }

  /**
   * Builds the cute golden Piggy Bank flying companion from the screenshot!
   */
  private buildPiggyCompanion() {
    this.piggyGroup.clear();

    // Piggy body (golden rounded box/cylinder)
    const pigBodyGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.38, 10);
    pigBodyGeo.rotateZ(Math.PI / 2);
    const pigBody = new THREE.Mesh(pigBodyGeo, this.materials['piggyGold']);
    this.piggyGroup.add(pigBody);

    // Snout
    const snoutGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 8);
    snoutGeo.rotateZ(Math.PI / 2);
    const snout = new THREE.Mesh(snoutGeo, this.materials['piggyGold']);
    snout.position.set(0.22, -0.02, 0);
    this.piggyGroup.add(snout);

    // Coin slot on back
    const slotGeo = new THREE.BoxGeometry(0.12, 0.02, 0.02);
    const slot = new THREE.Mesh(slotGeo, this.materials['droneDark']);
    slot.position.set(0, 0.24, 0);
    this.piggyGroup.add(slot);

    // Propeller on head
    const propStemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.16, 6);
    const propStem = new THREE.Mesh(propStemGeo, this.materials['droneDark']);
    propStem.position.set(0, 0.32, 0);
    this.piggyGroup.add(propStem);

    const propBladeGeo = new THREE.BoxGeometry(0.42, 0.015, 0.05);
    const propBlade = new THREE.Mesh(propBladeGeo, this.materials['droneDark']);
    propBlade.position.set(0, 0.4, 0);
    this.piggyGroup.add(propBlade);
    this.piggyRotor = propBlade;

    // Position hovering off to the left like in screenshot
    this.piggyGroup.position.set(-2.8, 1.2, 0.5);
  }

  /**
   * Updates farm grid tiles to match TFWR voxel blocks
   */
  public updateGrid(worldSize: number, tiles: TileState[], drone: DroneState) {
    const offset = (worldSize - 1) / 2;
    const currentKeys = new Set<string>();

    for (const tile of tiles) {
      const key = `${tile.x},${tile.y}`;
      currentKeys.add(key);

      const posX = tile.x - offset;
      const posZ = tile.y - offset;

      let entry = this.tileMeshes.get(key);
      if (!entry) {
        // Floating 3D Soil Cube with rock facets on sides
        const cubeGroup = new THREE.Group();

        // Main cube body
        const cubeGeo = new THREE.BoxGeometry(0.96, 0.9, 0.96);
        const cubeMesh = new THREE.Mesh(cubeGeo, this.materials['soilCube']);
        cubeMesh.position.y = -0.45;
        cubeMesh.receiveShadow = !this.isSoftwareGl;
        cubeMesh.castShadow = !this.isSoftwareGl;
        cubeGroup.add(cubeMesh);

        // Top Grass Turf
        const turfGeo = new THREE.BoxGeometry(0.97, 0.08, 0.97);
        const turfMesh = new THREE.Mesh(turfGeo, this.materials['turfGrass']);
        turfMesh.position.y = 0.04;
        turfMesh.receiveShadow = !this.isSoftwareGl;
        cubeGroup.add(turfMesh);

        // Crop Group on top
        const cropGroup = new THREE.Group();
        cropGroup.position.set(0, 0.08, 0);
        cubeGroup.add(cropGroup);

        cubeGroup.position.set(posX, 0, posZ);
        this.tilesGroup.add(cubeGroup);

        entry = { ground: cubeMesh, turfMesh, cropGroup };
        this.tileMeshes.set(key, entry);
      } else {
        entry.ground.parent?.position.set(posX, 0, posZ);
      }

      // Update surface material based on soil type and water hydration
      const isWet = tile.waterLevel > 0.05;
      if (tile.ground === Grounds.Soil) {
        entry.turfMesh.material = isWet ? this.materials['tilledSoilWet'] : this.materials['tilledSoil'];
      } else {
        entry.turfMesh.material = isWet ? this.materials['turfGrassWet'] : this.materials['turfGrass'];
      }

      // Update crop representation
      this.updateTileCrops(entry.cropGroup, tile);
    }

    for (const [key, entry] of this.tileMeshes.entries()) {
      if (!currentKeys.has(key)) {
        if (entry.ground.parent) {
          this.tilesGroup.remove(entry.ground.parent);
        }
        this.tileMeshes.delete(key);
      }
    }

    // Drone target
    const droneWorldX = drone.targetX - offset;
    const droneWorldZ = drone.targetY - offset;
    _targetPos.set(droneWorldX, 1.3, droneWorldZ);
  }

  private updateTileCrops(group: THREE.Group, tile: TileState) {
    const tag = `${tile.entity}_${Math.floor(tile.growth * 8)}_${tile.companion || 'none'}`;
    if (group.userData.tag === tag) return;
    group.userData.tag = tag;

    group.clear();
    if (!tile.entity || tile.growth < 0.05) return;

    const scale = Math.max(0.15, tile.growth);

    if (tile.entity === Entities.Grass) {
      // Dense cluster of tall vertical golden wheat/hay stalks
      const stalkCount = 28;
      for (let i = 0; i < stalkCount; i++) {
        const stalkHeight = (0.55 + (i % 5) * 0.06) * scale;
        const stalkGeo = new THREE.CylinderGeometry(0.016, 0.02, stalkHeight, 4);
        const stalkMesh = new THREE.Mesh(stalkGeo, this.materials['goldenHay']);

        const rx = ((i % 6) - 2.5) * 0.14 + Math.sin(i * 3) * 0.04;
        const rz = (Math.floor(i / 6) - 2) * 0.15 + Math.cos(i * 2) * 0.04;

        stalkMesh.position.set(rx, stalkHeight / 2, rz);
        stalkMesh.castShadow = !this.isSoftwareGl;
        group.add(stalkMesh);
      }
    } else if (tile.entity === Entities.Bush) {
      const bushGeo = new THREE.DodecahedronGeometry(0.36 * scale, 1);
      const bushMesh = new THREE.Mesh(bushGeo, this.materials['bushFoliage']);
      bushMesh.position.y = 0.36 * scale;
      bushMesh.castShadow = !this.isSoftwareGl;
      group.add(bushMesh);
    } else if (tile.entity === Entities.Carrot) {
      const rootGeo = new THREE.CylinderGeometry(0.12 * scale, 0.02 * scale, 0.38 * scale, 8);
      const rootMesh = new THREE.Mesh(rootGeo, this.materials['carrotRoot']);
      rootMesh.position.y = 0.12 * scale;
      group.add(rootMesh);

      // Carrot green leafy top
      const topGeo = new THREE.ConeGeometry(0.14 * scale, 0.25 * scale, 6);
      const topMesh = new THREE.Mesh(topGeo, this.materials['bushFoliage']);
      topMesh.position.y = 0.35 * scale;
      group.add(topMesh);
    } else if (tile.entity === Entities.Tree) {
      // Tree trunk
      const trunkGeo = new THREE.CylinderGeometry(0.1 * scale, 0.14 * scale, 0.6 * scale, 8);
      const trunkMesh = new THREE.Mesh(trunkGeo, this.materials['treeTrunk']);
      trunkMesh.position.y = 0.3 * scale;
      trunkMesh.castShadow = !this.isSoftwareGl;
      group.add(trunkMesh);

      // Tree layered foliage
      const foliage1 = new THREE.ConeGeometry(0.42 * scale, 0.6 * scale, 8);
      const f1Mesh = new THREE.Mesh(foliage1, this.materials['treeFoliage']);
      f1Mesh.position.y = 0.7 * scale;
      f1Mesh.castShadow = !this.isSoftwareGl;
      group.add(f1Mesh);

      const foliage2 = new THREE.ConeGeometry(0.32 * scale, 0.5 * scale, 8);
      const f2Mesh = new THREE.Mesh(foliage2, this.materials['treeFoliage']);
      f2Mesh.position.y = 1.0 * scale;
      group.add(f2Mesh);
    } else if (tile.entity === Entities.Sunflower) {
      // Green stem
      const stemGeo = new THREE.CylinderGeometry(0.04 * scale, 0.04 * scale, 0.75 * scale, 6);
      const stemMesh = new THREE.Mesh(stemGeo, this.materials['bushFoliage']);
      stemMesh.position.y = 0.375 * scale;
      group.add(stemMesh);

      // Flower petal disc
      const petalsGeo = new THREE.CylinderGeometry(0.28 * scale, 0.28 * scale, 0.06 * scale, 12);
      const petalsMesh = new THREE.Mesh(petalsGeo, this.materials['sunflowerPetal']);
      petalsMesh.position.y = 0.75 * scale;
      petalsMesh.rotation.x = 0.3;
      group.add(petalsMesh);

      // Flower brown center
      const centerGeo = new THREE.CylinderGeometry(0.15 * scale, 0.15 * scale, 0.08 * scale, 10);
      const centerMesh = new THREE.Mesh(centerGeo, this.materials['sunflowerCenter']);
      centerMesh.position.y = 0.76 * scale;
      centerMesh.rotation.x = 0.3;
      group.add(centerMesh);
    } else if (tile.entity === Entities.Cactus) {
      // Ribbed main trunk
      const cactusGeo = new THREE.CylinderGeometry(0.16 * scale, 0.18 * scale, 0.75 * scale, 8);
      const cactusMesh = new THREE.Mesh(cactusGeo, this.materials['cactus']);
      cactusMesh.position.y = 0.375 * scale;
      cactusMesh.castShadow = !this.isSoftwareGl;
      group.add(cactusMesh);

      // Branch 1
      const arm1 = new THREE.CylinderGeometry(0.08 * scale, 0.08 * scale, 0.3 * scale, 6);
      const arm1Mesh = new THREE.Mesh(arm1, this.materials['cactus']);
      arm1Mesh.position.set(0.18 * scale, 0.5 * scale, 0);
      arm1Mesh.rotation.z = -0.3;
      group.add(arm1Mesh);
    } else if (tile.entity === Entities.Dinosaur) {
      const dinoGeo = new THREE.BoxGeometry(0.35 * scale, 0.35 * scale, 0.5 * scale);
      const dinoMesh = new THREE.Mesh(dinoGeo, this.materials['dinosaur']);
      dinoMesh.position.y = 0.25 * scale;
      group.add(dinoMesh);
    } else {
      // Pumpkin
      const isMega = tile.isMegaPumpkin;
      const pumpScale = isMega ? scale * 1.5 : scale;
      const pumpGeo = new THREE.SphereGeometry(0.35 * pumpScale, 10, 8);
      const pumpMesh = new THREE.Mesh(pumpGeo, this.materials['pumpkin']);
      pumpMesh.position.y = 0.3 * pumpScale;
      pumpMesh.scale.y = 0.8;
      pumpMesh.castShadow = !this.isSoftwareGl;
      group.add(pumpMesh);
    }
  }

  public addFloatingText(text: string, color: string, x: number, y: number, worldSize: number) {
    const offset = (worldSize - 1) / 2;
    const posX = x - offset;
    const posZ = y - offset;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = color;
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.9, 0.45, 1);
    sprite.position.set(posX, 1.6, posZ);

    this.floatingTextsGroup.add(sprite);
    this.activeFloatingTexts.push({
      mesh: sprite,
      text: {
        id: Math.random().toString(),
        text,
        color,
        x: posX,
        y: 1.6,
        z: posZ,
        createdAt: performance.now(),
        duration: 1000,
      },
    });
  }

  private onResize = () => {
    if (this.isDisposed || !this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private startLoop() {
    let lastTime = performance.now();

    const tick = (now: number) => {
      if (this.isDisposed) return;

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Drone lerp to target
      this.droneGroup.position.x = THREE.MathUtils.damp(
        this.droneGroup.position.x,
        _targetPos.x,
        14,
        dt
      );
      this.droneGroup.position.z = THREE.MathUtils.damp(
        this.droneGroup.position.z,
        _targetPos.z,
        14,
        dt
      );

      // Drone hover bob
      const bob = Math.sin(now * 0.005) * 0.04;
      this.droneGroup.position.y = 1.3 + bob;

      // Contact shadow update
      if (this.droneShadow) {
        this.droneShadow.position.x = this.droneGroup.position.x;
        this.droneShadow.position.z = this.droneGroup.position.z;
        const shadowScale = 1 - bob * 1.5;
        this.droneShadow.scale.set(shadowScale, shadowScale, 1);
      }

      // Spin drone rotors
      this.droneRotors.forEach((rotor, idx) => {
        rotor.rotation.y += (idx % 2 === 0 ? 35 : -35) * dt;
      });

      // Spin piggy propeller & gentle bob
      if (this.piggyRotor) {
        this.piggyRotor.rotation.y += 30 * dt;
      }
      this.piggyGroup.position.y = 1.2 + Math.cos(now * 0.004) * 0.05;

      // Floating text decay
      for (let i = this.activeFloatingTexts.length - 1; i >= 0; i--) {
        const item = this.activeFloatingTexts[i];
        const elapsed = now - item.text.createdAt;
        if (elapsed > item.text.duration) {
          this.floatingTextsGroup.remove(item.mesh);
          item.mesh.material.dispose();
          if (item.mesh.material.map) item.mesh.material.map.dispose();
          this.activeFloatingTexts.splice(i, 1);
        } else {
          const progress = elapsed / item.text.duration;
          item.mesh.position.y = item.text.y + progress * 0.6;
          (item.mesh.material as THREE.SpriteMaterial).opacity = 1 - progress;
        }
      }

      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.frameId = requestAnimationFrame(tick);
    };

    this.frameId = requestAnimationFrame(tick);
  }

  public dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
