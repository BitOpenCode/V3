"use client"

import { useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

const BLACK_HOLE_RADIUS = 1.3
const DISK_INNER_RADIUS = BLACK_HOLE_RADIUS + 0.2
const DISK_OUTER_RADIUS = 8.0
const DISK_TILT_ANGLE = Math.PI / 3.0

export function SingularityCrystal({ position, onClick, onDoubleClick }: { position: [number, number, number]; onClick?: (isDouble?: boolean) => void; onDoubleClick?: () => void }) {
  const root = useRef<THREE.Group>(null)
  const starsRef = useRef<THREE.Points>(null)
  const diskRefA = useRef<THREE.Mesh>(null)
  const diskRefB = useRef<THREE.Mesh>(null)

  const starGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const starCount = 7000
    const starPositions = new Float32Array(starCount * 3)
    const starColors = new Float32Array(starCount * 3)
    const starSizes = new Float32Array(starCount)
    const starTwinkle = new Float32Array(starCount)

    const starFieldRadius = 70
    // without purple stars per your request
    const starPalette = [
      new THREE.Color(0x00ffff),
      new THREE.Color(0x00ff7f),
      new THREE.Color(0xccddff),
      new THREE.Color(0x7dd3fc),
    ]

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3
      const phi = Math.acos(-1 + (2 * i) / starCount)
      const theta = Math.sqrt(starCount * Math.PI) * phi
      const radius = Math.cbrt(Math.random()) * starFieldRadius + 5

      starPositions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      starPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      starPositions[i3 + 2] = radius * Math.cos(phi)

      const starColor = starPalette[Math.floor(Math.random() * starPalette.length)].clone()
      starColor.multiplyScalar(Math.random() * 0.7 + 0.3)
      starColors[i3] = starColor.r
      starColors[i3 + 1] = starColor.g
      starColors[i3 + 2] = starColor.b

      starSizes[i] = THREE.MathUtils.randFloat(0.5, 1.8)
      starTwinkle[i] = Math.random() * Math.PI * 2
    }

    g.setAttribute("position", new THREE.BufferAttribute(starPositions, 3))
    g.setAttribute("color", new THREE.BufferAttribute(starColors, 3))
    g.setAttribute("size", new THREE.BufferAttribute(starSizes, 1))
    g.setAttribute("twinkle", new THREE.BufferAttribute(starTwinkle, 1))

    return g
  }, [])

  const starMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1.5 } },
        vertexShader: `
          uniform float uTime; uniform float uPixelRatio;
          attribute float size; attribute float twinkle;
          varying vec3 vColor; varying float vTwinkle;
          void main() {
            vColor = color;
            vTwinkle = sin(uTime * 2.5 + twinkle) * 0.5 + 0.5;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * uPixelRatio * (30.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor; varying float vTwinkle;
          void main() {
            float dist = distance(gl_PointCoord, vec2(0.5));
            float cross = abs(gl_PointCoord.x - 0.5) + abs(gl_PointCoord.y - 0.5);
            if (cross > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            alpha *= (0.2 + vTwinkle * 0.8);
            gl_FragColor = vec4(vColor, alpha);
          }
        `,
        transparent: true,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  )

  const eventHorizonMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uCameraPosition: { value: new THREE.Vector3(0, 0, 3) } },
        vertexShader: `
          varying vec3 vNormal; varying vec3 vPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime; uniform vec3 uCameraPosition;
          varying vec3 vNormal; varying vec3 vPosition;
          void main() {
            vec3 viewDirection = normalize(uCameraPosition - vPosition);
            float fresnel = 1.0 - abs(dot(vNormal, viewDirection));
            fresnel = pow(fresnel, 2.0);
            vec3 glowColor = vec3(0.0, 1.0, 0.8);
            float pulse = sin(uTime * 3.5) * 0.25 + 0.85;
            gl_FragColor = vec4(glowColor * fresnel * pulse, fresnel * 0.6);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      }),
    [],
  )

  const coreMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uCameraPosition: { value: new THREE.Vector3(0, 0, 3) } },
        vertexShader: `
          varying vec3 vPos;
          varying vec3 vNormal;
          void main() {
            vPos = position;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uCameraPosition;
          varying vec3 vPos;
          varying vec3 vNormal;

          void main() {
            vec3 viewDir = normalize(uCameraPosition - vPos);
            float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 2.4);

            float swirl = sin(atan(vPos.y, vPos.x) * 16.0 + uTime * 5.0) * 0.5 + 0.5;
            float radial = smoothstep(0.0, 1.2, length(vPos.xy));
            float veins = (1.0 - radial) * swirl;

            vec3 base = vec3(0.0);
            vec3 cyan = vec3(0.0, 0.9, 0.85) * veins * 0.35;
            vec3 magenta = vec3(0.8, 0.0, 0.9) * veins * 0.16;
            vec3 rim = vec3(0.0, 0.95, 0.9) * fresnel * 0.35;

            gl_FragColor = vec4(base + cyan + magenta + rim, 1.0);
          }
        `,
      }),
    [],
  )

  const diskMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0.0 },
          uColorHot: { value: new THREE.Color(0xffffff) },
          uColorMid1: { value: new THREE.Color(0xff00ff) },
          uColorMid2: { value: new THREE.Color(0x00ffff) },
          uColorOuter: { value: new THREE.Color(0x3939f5) },
          uNoiseScale: { value: 3.5 },
          uFlowSpeed: { value: 0.25 },
          uDensity: { value: 1.5 },
        },
        vertexShader: `
          varying vec2 vUv; varying float vRadius; varying float vAngle;
          void main() {
            vUv = uv;
            vRadius = length(position.xy);
            vAngle = atan(position.y, position.x);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime; uniform vec3 uColorHot; uniform vec3 uColorMid1; uniform vec3 uColorMid2; uniform vec3 uColorOuter;
          uniform float uNoiseScale; uniform float uFlowSpeed; uniform float uDensity;
          varying vec2 vUv; varying float vRadius; varying float vAngle;

          vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
          vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
          float snoise(vec3 v) {
            const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
            vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
            vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g; vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
            vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + C.yyy; vec3 x3 = x0 - D.yyy;
            i = mod289(i); vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            float n_ = 0.142857142857; vec3 ns = n_ * D.wyz - D.xzx; vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
            vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_); vec4 x = x_ * ns.x + ns.yyyy; vec4 y = y_ * ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y); vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
            vec4 s0 = floor(b0) * 2.0 + 1.0; vec4 s1 = floor(b1) * 2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
            vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
            vec3 p0 = vec3(a0.xy, h.x); vec3 p1 = vec3(a0.zw, h.y); vec3 p2 = vec3(a1.xy, h.z); vec3 p3 = vec3(a1.zw, h.w);
            vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
            p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
            vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
            m = m * m; return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
          }
          void main() {
            float normalizedRadius = smoothstep(1.50, 8.00, vRadius);
            float timeOffset = uTime * uFlowSpeed * (2.0 / (vRadius * 0.3 + 1.0));
            vec2 noiseUv = vec2(vAngle * 2.0 + timeOffset, vRadius * 0.5);
            float noiseVal1 = snoise(vec3(noiseUv * uNoiseScale, uTime * 0.15));
            float noiseVal2 = snoise(vec3(noiseUv * uNoiseScale * 2.0 + 0.8, uTime * 0.22));
            float noiseVal = (noiseVal1 * 0.6 + noiseVal2 * 0.4); noiseVal = (noiseVal + 1.0) * 0.5;
            vec3 color = mix(uColorOuter, uColorMid2, smoothstep(0.0, 0.4, normalizedRadius));
            color = mix(color, uColorMid1, smoothstep(0.3, 0.7, normalizedRadius));
            color = mix(color, uColorHot, smoothstep(0.65, 0.95, normalizedRadius));
            float brightness = pow(1.0 - normalizedRadius, 1.2) * 3.0 + 0.5;
            brightness *= (0.3 + noiseVal * 2.2);
            float alpha = uDensity * (0.2 + noiseVal * 0.9);
            alpha *= smoothstep(0.0, 0.15, normalizedRadius);
            alpha *= (1.0 - smoothstep(0.85, 1.0, normalizedRadius));
            gl_FragColor = vec4(color * brightness, clamp(alpha, 0.0, 1.0));
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime

    starMaterial.uniforms.uTime.value = elapsed
    eventHorizonMaterial.uniforms.uTime.value = elapsed
    eventHorizonMaterial.uniforms.uCameraPosition.value.copy(state.camera.position)
    coreMaterial.uniforms.uTime.value = elapsed
    coreMaterial.uniforms.uCameraPosition.value.copy(state.camera.position)
    diskMaterial.uniforms.uTime.value = elapsed

    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.09
      starsRef.current.rotation.x += delta * 0.02
    }
    if (diskRefA.current) {
      diskRefA.current.rotation.z += delta * 0.35
      diskRefA.current.rotation.y = Math.sin(elapsed * 0.8) * 0.08
      const s = 1 + Math.sin(elapsed * 2.3) * 0.02
      diskRefA.current.scale.set(s, s, s)
    }
    if (diskRefB.current) {
      diskRefB.current.rotation.z -= delta * 0.25
      diskRefB.current.rotation.y = Math.cos(elapsed * 0.6) * 0.08
    }
  })

  return (
    <group ref={root} position={position} scale={0.22}>
      <points ref={starsRef} geometry={starGeometry} material={starMaterial} />

      <mesh>
        <sphereGeometry args={[BLACK_HOLE_RADIUS * 1.07, 64, 32]} />
        <primitive object={eventHorizonMaterial} attach="material" />
      </mesh>

      <mesh
        onClick={(e) => {
          e.stopPropagation()
          const detail = (e as any).nativeEvent?.detail ?? 1
          onClick?.(detail >= 2)
        }}
        onDoubleClick={(e) => {
          e.stopPropagation()
          onDoubleClick?.()
        }}
      >
        <sphereGeometry args={[BLACK_HOLE_RADIUS, 64, 32]} />
        <primitive object={coreMaterial} attach="material" />
      </mesh>

      <mesh ref={diskRefA} rotation={[DISK_TILT_ANGLE, 0, 0]}>
        <ringGeometry args={[DISK_INNER_RADIUS, DISK_OUTER_RADIUS, 128, 64]} />
        <primitive object={diskMaterial} attach="material" />
      </mesh>

      <mesh ref={diskRefB} rotation={[DISK_TILT_ANGLE * 0.96, 0, 0]}>
        <ringGeometry args={[DISK_INNER_RADIUS * 1.08, DISK_OUTER_RADIUS * 1.03, 128, 64]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.14} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      <pointLight position={[0, 0, 0]} intensity={3.5} distance={9} color="#00ffff" />
      <pointLight position={[0.7, 0.4, -0.6]} intensity={2.1} distance={7} color="#ff00ff" />
    </group>
  )
}
