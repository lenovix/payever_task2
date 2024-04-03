import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'https://unpkg.com/three@0.160.0/examples/jsm/renderers/CSS2DRenderer.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let globe;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 230);

const initializeGlobe = async (countriesData, mapData) => {
  globe = new ThreeGlobe({ waitForGlobeReady: true });

  globe
    .hexPolygonsData(countriesData.features)
    .hexPolygonResolution(3)
    .hexPolygonColor(() => '#ffffff')
    .hexPolygonMargin(0.8)
    .showAtmosphere(true)
    .atmosphereColor('#8E8E93')
    .atmosphereAltitude(0)
    .arcDashLength(0.9)
    .arcDashGap(4)
    .arcDashAnimateTime(1000)
    .arcsTransitionDuration(1000)
    .arcDashInitialGap((entry) => entry.order * 1)
    .pointRadius(0.5)
    .pointColor(() => '#ffffff')
    .pointAltitude(0)
    .ringColor(() => '#ffffff')
    .ringMaxRadius(1)
    .ringsData(mapData.maps)
    .pointsData(mapData.maps)
    .rotateY(49.95)
    .rotateX(13.15)
    .rotateZ(-0.2);

  const globeMaterial = globe.globeMaterial();
  globeMaterial.color = new THREE.Color(0x3a3a3c);
  globeMaterial.emissive = new THREE.Color(0x1c1c1e);
  globeMaterial.emissiveIntensity = 0.1;
  globeMaterial.shininess = 10;

  scene.add(globe);
};

const renderers = [new THREE.WebGLRenderer(), new CSS2DRenderer()];

const initializeRenderers = () => {
  renderers.forEach((renderer, idx) => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (idx > 0) {
      renderer.domElement.style.position = 'absolute';
      renderer.domElement.style.top = '0px';
      renderer.domElement.style.pointerEvents = 'none';
    }
    document.getElementById('globe').appendChild(renderer.domElement);
  });
};

const addLights = () => {
  const lights = [
    { position: new THREE.Vector3(-800, 2000, 400), intensity: 2 },
    { position: new THREE.Vector3(-200, 350, 400), intensity: 3 },
  ];

  lights.forEach((lightInfo) => {
    const directionalLight = new THREE.DirectionalLight(
      0xffffff,
      lightInfo.intensity
    );
    directionalLight.position.copy(lightInfo.position);
    scene.add(directionalLight);
  });
};

const rotateGlobeToPosition = async (x, y, z) => {
  await gsap.to(globe.rotation, {
    x,
    y,
    z,
    duration: 1,
    ease: 'power3.inOut',
  });
};

const showCountriesFlags = async (mapData) => {
  const globeData = mapData.maps.map((item) => ({
    lat: item.lat,
    lng: item.lng,
    x: item.x,
    y: item.y,
    country: item.text,
  }));

  const delayBetweenFlags = 1500;
  let index = 0;

  while (true) {
    const { x, y, country } = globeData[index];

    globe.htmlElementsData([globeData[index]]).htmlElement(() => {
      const el = document.createElement('div');
      el.innerHTML = `
        <div id="flag-item${index}" class="item-flag-wrapper">
          <div class="item-flag ${country}"></div>
        </div>
      `;
      return el;
    });

    rotateGlobeToPosition(x, y, 0);

    await delay(delayBetweenFlags);
    index = (index + 1) % globeData.length;
  }
};

const setOrbitControls = () => {
  const controls = new OrbitControls(camera, renderers[0].domElement);
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.2;
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.enableZoom = true;
  controls.enableRotate = true;
};

const animateScene = () => {
  requestAnimationFrame(animateScene);
  renderers.forEach((renderer) => renderer.render(scene, camera));
};

const fetchData = async (src) => {
  const response = await fetch(src);
  const data = await response.json();
  return data;
};

const renderWebAsset = async () => {
  const countriesData = await fetchData('/src/files/geo.json');
  const mapData = await fetchData('/src/files/map.json');

  await initializeGlobe(countriesData, mapData);
  initializeRenderers();
  addLights();
  setOrbitControls();
  animateScene();
  await showCountriesFlags(mapData);
};

renderWebAsset();
