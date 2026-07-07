"use client"
import { useRef, useState, useMemo } from "react"
import { useFrame, type ThreeEvent } from "@react-three/fiber"
import * as THREE from "three"
import { Html } from "@react-three/drei"

const TAU = Math.PI * 2
const R2 = Math.SQRT2
const C = {
  deep: "#29338a", dark: "#3340ad", darker: "#2a3a81",
  medium: "#5c69c0", light: "#8a94d4", highlight: "#FFFFBB",
  fog: "#b3bbe0", paintjob: "#d59c55",
}

function Py({ position, scale: s, color: c = C.dark, rotation }: { position?: [number,number,number]; scale: [number,number,number]; color?: string; rotation?: [number,number,number] }) {
  const geo = useMemo(() => {
    const g = new THREE.ConeGeometry(1, R2, 4)
    g.translate(0, R2 / 2, 0)
    return g
  }, [])
  return <mesh position={position} scale={s} rotation={rotation} geometry={geo}><meshStandardMaterial color={c} side={THREE.DoubleSide} flatShading /></mesh>
}

function CT({ position, d = 8, l = 10 }: { position: [number,number,number]; d?: number; l?: number }) {
  const r = d / 2
  return <group position={position}>
    <mesh position={[0, l / 2, 0]}><coneGeometry args={[r, l, 6]} /><meshStandardMaterial color={C.deep} /></mesh>
    <mesh position={[0, l / 2 + Math.round(l / 2), 0]}><coneGeometry args={[r, l, 6]} /><meshStandardMaterial color={C.deep} /></mesh>
  </group>
}

function IslandDeskHuman({ position }: { position: [number, number, number] }) {
  const [isHovered, setIsHovered] = useState(false)

  return <group position={position} scale={0.5} rotation={[0, -TAU / 8 + TAU / 3, 0]}>
    {/* table */}
    <mesh position={[0, 3.2, 0]}><boxGeometry args={[9, 0.5, 4]} /><meshStandardMaterial color={C.medium} /></mesh>
    {([-4.2, 4.2] as number[]).flatMap((x) => ([-1.8, 1.8] as number[]).map((z) =>
      <mesh key={`${x}_${z}`} position={[x, 1.7, z]}><cylinderGeometry args={[0.3, 0.3, 3.2, 5]} /><meshStandardMaterial color={C.medium} /></mesh>
    ))}

    {/* monitor */}
    <group position={[0, 7, -0.7]}>
      <mesh><boxGeometry args={[8.5, 4.5, 0.4]} /><meshStandardMaterial color={C.deep} /></mesh>
      <mesh position={[0, 0, 0.26]}><boxGeometry args={[8, 4, 0.1]} /><meshStandardMaterial color={C.highlight} emissive={C.highlight} emissiveIntensity={0.9} /></mesh>
      <mesh position={[0, -2.6, 0]}><cylinderGeometry args={[0.25, 0.35, 1.6, 6]} /><meshStandardMaterial color={C.deep} /></mesh>
      <mesh position={[0, -3.4, 0]}><boxGeometry args={[2.8, 0.25, 1.4]} /><meshStandardMaterial color={C.deep} /></mesh>
    </group>

    {/* chair */}
    <group position={[0, 2.1, 3.2]}>
      <mesh><boxGeometry args={[3, 0.35, 3]} /><meshStandardMaterial color={C.medium} /></mesh>
      <mesh position={[0, 2.2, -1.4]} rotation={[0.2, 0, 0]}><boxGeometry args={[3, 4.2, 0.35]} /><meshStandardMaterial color={C.medium} /></mesh>
    </group>

    {/* seated person */}
    <group
      position={[0, 5.1, 2.1]}
      onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true) }}
      onPointerOut={(e) => { e.stopPropagation(); setIsHovered(false) }}
    >
      <mesh rotation={[-0.2, 0, 0]}><boxGeometry args={[2.4, 3.4, 1.2]} /><meshStandardMaterial color={C.deep} /></mesh>
      <mesh position={[0, 2.6, -0.2]}><sphereGeometry args={[1.05, 10, 8]} /><meshStandardMaterial color={C.deep} /></mesh>
      <mesh position={[-1.35, -0.1, -1.2]} rotation={[-0.8, 0.2, 0.35]}><boxGeometry args={[0.55, 2.6, 0.55]} /><meshStandardMaterial color={C.deep} /></mesh>
      <mesh position={[1.35, -0.1, -1.2]} rotation={[-0.8, -0.2, -0.35]}><boxGeometry args={[0.55, 2.6, 0.55]} /><meshStandardMaterial color={C.deep} /></mesh>
      <mesh position={[0, 2.2, 0]} visible={false}>
        <sphereGeometry args={[2.4, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>

    {/* speech bubble */}
    {isHovered && (
      <group position={[0, 14.8, 2.1]}>
        <Html center distanceFactor={36} transform>
          <div
            style={{
              background: "rgba(255,255,255,0.95)",
              color: "#111827",
              padding: "16px 24px",
              borderRadius: "999px",
              fontSize: "30px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              boxShadow: "0 8px 20px rgba(0,0,0,0.26)",
              fontFamily: "Inter, system-ui, sans-serif",
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            Dont touch me Im Building
          </div>
        </Html>
      </group>
    )}
  </group>
}

function IslandCampfire({ position }: { position: [number, number, number] }) {
  const [isLit, setIsLit] = useState(true)
  const flameA = useRef<THREE.Mesh>(null)
  const flameB = useRef<THREE.Mesh>(null)
  const glow = useRef<THREE.PointLight>(null)
  const smoke = useRef<Array<THREE.Mesh | null>>([])
  const smokeStartMs = useRef<number | null>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (isLit) {
      const flicker = 0.85 + Math.sin(t * 8) * 0.15
      if (flameA.current) {
        flameA.current.visible = true
        flameA.current.scale.y = flicker
      }
      if (flameB.current) {
        flameB.current.visible = true
        flameB.current.scale.y = 0.8 + Math.sin(t * 7 + 1.3) * 0.12
      }
      if (glow.current) glow.current.intensity = 1.4 + Math.sin(t * 10) * 0.25
    } else {
      if (flameA.current) flameA.current.visible = false
      if (flameB.current) flameB.current.visible = false
      if (glow.current) glow.current.intensity = 0
    }

    if (smokeStartMs.current !== null) {
      const dt = (performance.now() - smokeStartMs.current) / 1000
      const totalSmokeTime = 5
      const puffDelay = 1.1
      const puffLife = 2.4

      smoke.current.forEach((m, i) => {
        if (!m) return
        const local = dt - i * puffDelay
        if (local >= 0 && local <= puffLife) {
          m.visible = true
          m.position.y = 2.2 + local * 1.8
          m.scale.setScalar(0.35 + local * 0.4)
        } else {
          m.visible = false
        }
      })

      if (dt > totalSmokeTime) {
        smoke.current.forEach((m) => {
          if (m) m.visible = false
        })
        smokeStartMs.current = null
      }
    }
  })

  const handleToggle = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    setIsLit((prev) => {
      const next = !prev
      if (!next) {
        smokeStartMs.current = performance.now()
      } else {
        smokeStartMs.current = null
        smoke.current.forEach((m) => {
          if (m) m.visible = false
        })
      }
      return next
    })
  }

  return <group position={position}>
    {/* click hit area */}
    <mesh position={[0, 1.4, 0]} onClick={handleToggle}>
      <sphereGeometry args={[1.4, 8, 8]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>

    {/* stones */}
    {([[1.0,0,0],[-1.0,0,0],[0,0,1.0],[0,0,-1.0]] as [number,number,number][])
      .map(([x,y,z], i) => (
      <mesh key={i} position={[x, y + 0.2, z]} scale={[0.8,0.5,0.8]}>
        <sphereGeometry args={[0.9, 8, 8]} />
        <meshStandardMaterial color={C.medium} />
      </mesh>
    ))}

    {/* logs */}
    <mesh position={[0, 0.25, 0]} rotation={[0, TAU / 8, 0.15]}>
      <cylinderGeometry args={[0.18, 0.22, 3.0, 8]} />
      <meshStandardMaterial color={C.dark} />
    </mesh>
    <mesh position={[0, 0.25, 0]} rotation={[0, -TAU / 8, -0.15]}>
      <cylinderGeometry args={[0.18, 0.22, 3.0, 8]} />
      <meshStandardMaterial color={C.dark} />
    </mesh>

    {/* flames */}
    <mesh ref={flameA} position={[0, 1.6, 0]}>
      <coneGeometry args={[0.7, 2.2, 10]} />
      <meshStandardMaterial color="#fb923c" emissive="#fb923c" emissiveIntensity={1.1} />
    </mesh>
    <mesh ref={flameB} position={[0, 1.3, 0]}>
      <coneGeometry args={[0.45, 1.5, 10]} />
      <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1.2} />
    </mesh>

    {/* three smoke puffs for five seconds */}
    {[0, 1, 2].map((i) => (
      <mesh key={i} ref={(el) => { smoke.current[i] = el }} position={[0, 2.2, 0]} visible={false}>
        <sphereGeometry args={[0.32 + i * 0.05, 8, 8]} />
        <meshStandardMaterial color="#9ca3af" transparent opacity={0.45} depthWrite={false} />
      </mesh>
    ))}

    <pointLight ref={glow} position={[0, 1.8, 0]} color="#fb923c" intensity={1.5} distance={18} />
  </group>
}


function GraveIsland({ position }: { position: [number,number,number] }) {
  return <group position={position}>
    <mesh position={[0, -1.05, 0]}><boxGeometry args={[18, 2, 18]} /><meshStandardMaterial color={C.dark} /></mesh>
    <Py scale={[16, -13, 16]} rotation={[0, TAU/8, 0]} color={C.deep} />
    <CT position={[4, 0, 4]} d={6} l={8} />
    <CT position={[-4, 0, -3]} d={5} l={7} />
  </group>
}

function WP({ position, rotation, w = 12, h = 12, c = C.light, pane }: { position: [number,number,number]; rotation?: [number,number,number]; w?: number; h?: number; c?: string; pane?: string }) {
  return <group position={position} rotation={rotation}>
    <mesh><planeGeometry args={[w, h]} /><meshStandardMaterial color={c} side={THREE.DoubleSide} /></mesh>
    {pane && <>
      <mesh position={[0, 1, 0.05]}><planeGeometry args={[8, 6]} /><meshStandardMaterial color={C.dark} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 1, 0.1]}><planeGeometry args={[4, 6]} /><meshStandardMaterial color={pane} side={THREE.DoubleSide} /></mesh>
    </>}
  </group>
}

function House() {
  const houseRef = useRef<THREE.Group>(null)
  const s = 1
  const TAU_LOCAL = Math.PI * 2

  return (
    <group ref={houseRef} position={[0, -8 * s, -6 * s]} scale={[1, -1, 1]}>
      {/* === MAIN ENTRANCE SECTION (3 floors) === */}
      {/* 1st floor south wall (front door) */}
      <mesh position={[0, 0, 24 * s]}>
        <boxGeometry args={[12 * s, 12 * s, 0.1]} />
        <meshStandardMaterial color={C.light} side={THREE.DoubleSide} />
      </mesh>
      {/* Front door */}
      <mesh position={[0, 2 * s, 24 * s + 0.06]}>
        <planeGeometry args={[6 * s, 8 * s]} />
        <meshStandardMaterial color={C.dark} />
      </mesh>
      {/* 2nd floor south */}
      <mesh position={[0, -12 * s, 24 * s]}>
        <boxGeometry args={[12 * s, 12 * s, 0.1]} />
        <meshStandardMaterial color={C.light} side={THREE.DoubleSide} />
      </mesh>
      {/* 2nd floor window */}
      <mesh position={[0, -13 * s, 24 * s + 0.06]}>
        <planeGeometry args={[4 * s, 6 * s]} />
        <meshStandardMaterial color={C.medium} />
      </mesh>
      {/* 3rd floor south */}
      <mesh position={[0, -24 * s, 24 * s]}>
        <boxGeometry args={[12 * s, 12 * s, 0.1]} />
        <meshStandardMaterial color={C.light} side={THREE.DoubleSide} />
      </mesh>
      {/* 3rd floor window (lit, arched) */}
      <group position={[0, -25 * s, 24 * s + 0.06]}>
        <mesh position={[0, 0.7 * s, 0]}>
          <boxGeometry args={[4.2 * s, 6.2 * s, 0.02]} />
          <meshStandardMaterial color={C.highlight} emissive={C.highlight} emissiveIntensity={1.2} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -1.8 * s, 0]}>
          <circleGeometry args={[2.1 * s, 20]} />
          <meshStandardMaterial color={C.highlight} emissive={C.highlight} emissiveIntensity={1.2} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* arched glowing windows on left/right side walls */}
      <group position={[18 * s + 0.18, -13 * s, 12 * s]} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0.7 * s, 0]}>
          <planeGeometry args={[3.4 * s, 4.8 * s]} />
          <meshStandardMaterial color={C.highlight} emissive={C.highlight} emissiveIntensity={1.2} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -1.7 * s, 0]}>
          <circleGeometry args={[1.7 * s, 20]} />
          <meshStandardMaterial color={C.highlight} emissive={C.highlight} emissiveIntensity={1.2} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <group position={[-18 * s - 0.18, -13 * s, 12 * s]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[0, 0.7 * s, 0]}>
          <planeGeometry args={[3.4 * s, 4.8 * s]} />
          <meshStandardMaterial color={C.highlight} emissive={C.highlight} emissiveIntensity={1.2} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -1.7 * s, 0]}>
          <circleGeometry args={[1.7 * s, 20]} />
          <meshStandardMaterial color={C.highlight} emissive={C.highlight} emissiveIntensity={1.2} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* East walls of entrance */}
      {[0, -12, -24].map((y) => (
        <mesh key={`e-ent-${y}`} position={[6 * s, y * s, 18 * s]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[12 * s, 12 * s, 0.1]} />
          <meshStandardMaterial color={C.medium} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* West walls of entrance */}
      {[0, -12, -24].map((y) => (
        <mesh key={`w-ent-${y}`} position={[-6 * s, y * s, 18 * s]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[12 * s, 12 * s, 0.1]} />
          <meshStandardMaterial color={C.medium} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* === ENTRANCE ROOF (pyramid-like) === */}
      <mesh position={[0, -36 * s, 18 * s]} rotation={[Math.PI, TAU_LOCAL / 8, 0]}>
        <coneGeometry args={[10 * s, 12 * s, 4]} />
        <meshStandardMaterial color={C.dark} flatShading />
      </mesh>

      {/* === SOUTH EAST WING (2 floors) === */}
      {[0, -12].map((y) => (
        <group key={`se-${y}`}>
          <mesh position={[12 * s, y * s, 12 * s]}>
            <boxGeometry args={[12 * s, 12 * s, 0.1]} />
            <meshStandardMaterial color={C.light} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      {/* === SOUTH WEST WING (2 floors) === */}
      {[0, -12].map((y) => (
        <group key={`sw-${y}`}>
          <mesh position={[-12 * s, y * s, 12 * s]}>
            <boxGeometry args={[12 * s, 12 * s, 0.1]} />
            <meshStandardMaterial color={C.light} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      {/* === EAST SIDE WALLS === */}
      {[6, -6].map((z) => (
        <group key={`east-${z}`}>
          {[0, -12].map((y) => (
            <mesh key={`east-${z}-${y}`} position={[18 * s, y * s, z * s]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[12 * s, 12 * s, 0.1]} />
              <meshStandardMaterial color={C.medium} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      ))}

      {/* === WEST SIDE WALLS === */}
      {[6, -6].map((z) => (
        <group key={`west-${z}`}>
          <mesh position={[-18 * s, 0, z * s]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[12 * s, 12 * s, 0.1]} />
            <meshStandardMaterial color={C.medium} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      <mesh position={[-18 * s, -12 * s, -6 * s]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[12 * s, 12 * s, 0.1]} />
        <meshStandardMaterial color={C.medium} side={THREE.DoubleSide} />
      </mesh>

      {/* === NORTH WALLS (3 arched glowing windows) === */}
      {[11, 1, -9].map((x) => (
        <group key={`north-${x}`} position={[x * s, -6 * s, -18.06 * s]}>
          {/* arched glowing pane */}
          <mesh position={[0, -2 * s, 0]}>
            <boxGeometry args={[5.6 * s, 11 * s, 0.02]} />
            <meshStandardMaterial color={C.highlight} emissive={C.highlight} emissiveIntensity={1.2} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -9 * s, 0]}>
            <circleGeometry args={[2.8 * s, 20]} />
            <meshStandardMaterial color={C.highlight} emissive={C.highlight} emissiveIntensity={1.2} side={THREE.DoubleSide} />
          </mesh>
          {/* thin dark mullion to suggest frame split */}
          <mesh position={[0, -1.5 * s, 0.02]}>
            <boxGeometry args={[0.32 * s, 11.5 * s, 0.02]} />
            <meshStandardMaterial color={C.dark} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 4.5 * s, -18.06 * s]}>
        <boxGeometry args={[36 * s, 3 * s, 0.1]} />
        <meshStandardMaterial color={C.dark} side={THREE.DoubleSide} />
      </mesh>

      {/* === NORTH EAST TOWER === */}
      <group position={[18 * s, -18 * s, -12 * s]}>
        <mesh>
          <cylinderGeometry args={[6 * s, 6 * s, 24 * s, 28]} />
          <meshStandardMaterial color={C.medium} flatShading />
        </mesh>
        <mesh position={[0, -(12 * s + 8 * s), 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[8 * s, 16 * s, 20]} />
          <meshStandardMaterial color={C.deep} flatShading />
        </mesh>
        <mesh position={[6 * s + 0.05, -6 * s, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[2 * s, 6 * s]} />
          <meshStandardMaterial color={C.highlight} emissive={C.highlight} emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* === NORTH WEST TOWER === */}
      <group position={[-18 * s, -18 * s, -12 * s]}>
        <mesh>
          <cylinderGeometry args={[6 * s, 6 * s, 24 * s, 28]} />
          <meshStandardMaterial color={C.medium} flatShading />
        </mesh>
        <mesh position={[0, -(12 * s + 8 * s), 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[8 * s, 16 * s, 20]} />
          <meshStandardMaterial color={C.deep} flatShading />
        </mesh>
        <mesh position={[-(6 * s + 0.05), -6 * s, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[2 * s, 6 * s]} />
          <meshStandardMaterial color={C.highlight} emissive={C.highlight} emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* === CENTRAL SECOND FLOOR (same footprint as first core) === */}
      <mesh position={[0, -12 * s, 18 * s]}>
        <boxGeometry args={[36 * s, 12 * s, 0.1]} />
        <meshStandardMaterial color={C.light} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -12 * s, -18 * s]}>
        <boxGeometry args={[36 * s, 12 * s, 0.1]} />
        <meshStandardMaterial color={C.light} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[18 * s, -12 * s, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[36 * s, 12 * s, 0.1]} />
        <meshStandardMaterial color={C.medium} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-18 * s, -12 * s, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[36 * s, 12 * s, 0.1]} />
        <meshStandardMaterial color={C.medium} side={THREE.DoubleSide} />
      </mesh>

      {/* === MAIN ROOF (square base, corners match core) === */}
      <mesh position={[0, -24 * s, 0]} rotation={[Math.PI, TAU_LOCAL / 8, 0]}>
        <coneGeometry args={[18 * Math.SQRT2 * s, 12 * s, 4]} />
        <meshStandardMaterial color={C.deep} flatShading />
      </mesh>

      {/* === PORCH === */}
      {[-9, -3, 3, 9, 15, 21].map((x) => (
        <mesh key={`porch-col-${x}`} position={[x * s, -1 * s, 30 * s]}>
          <boxGeometry args={[1 * s, 10 * s, 1 * s]} />
          <meshStandardMaterial color={C.deep} />
        </mesh>
      ))}
      {[-9, -3, 3, 9, 15, 21].map((x) => (
        <mesh key={`porch-arch-${x}`} position={[x * s, -5 * s, 30 * s]}>
          <boxGeometry args={[6 * s, 1 * s, 1 * s]} />
          <meshStandardMaterial color={C.deep} />
        </mesh>
      ))}
      {[27, 21, 15, 9, 3].map((z) => (
        <mesh key={`porch-e-${z}`} position={[24 * s, -1 * s, z * s]}>
          <boxGeometry args={[1 * s, 10 * s, 1 * s]} />
          <meshStandardMaterial color={C.deep} />
        </mesh>
      ))}
      {[27, 21].map((z) => (
        <mesh key={`porch-w-${z}`} position={[-12 * s, -1 * s, z * s]}>
          <boxGeometry args={[1 * s, 10 * s, 1 * s]} />
          <meshStandardMaterial color={C.deep} />
        </mesh>
      ))}
      <mesh position={[6 * s, -6 * s, 27 * s]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[36 * s, 6 * s]} />
        <meshStandardMaterial color={C.dark} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[12 * s, -6 * s, 18 * s]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12 * s, 12 * s]} />
        <meshStandardMaterial color={C.dark} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[24 * s, -6 * s, 15 * s]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6 * s, 30 * s]} />
        <meshStandardMaterial color={C.deep} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-12 * s, -6 * s, 21 * s]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6 * s, 12 * s]} />
        <meshStandardMaterial color={C.dark} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function Fog() {
  const g = useRef<THREE.Group>(null)
  const sr = useRef<THREE.Mesh[]>([])
  const segs = useMemo(() => {
    const d: {x:number;z:number;by:number;ry:number;r:number;an:number}[] = []
    for (let i = 0; i < 74; i++) {
      const a = i / 74, an = a * TAU * 0.5
      d.push({ x: Math.sin(an) * 54, z: Math.cos(an) * 54, by: Math.sin(an * 4) * 6, ry: a * -TAU * 0.5, r: (22 + 8 * -Math.cos(TAU / 8 * (3 + a * 5))) / 2, an })
    }
    return d
  }, [])
  useFrame((s) => {
    if (!g.current) return
    const ry = g.current.rotation.y = -(s.clock.elapsedTime / 30) * TAU
    const ry2 = g.current.rotation.y
    sr.current.forEach((m, i) => { if (m) m.position.y = Math.sin((segs[i].an - ry2) * 4) * 6 })
  })
  return <group ref={g} position={[0, -12, 0]}>
    {segs.map((s, i) => <mesh key={i} ref={el => { if (el) sr.current[i] = el }} position={[s.x, s.by, s.z]} rotation={[0, s.ry, 0]}><sphereGeometry args={[s.r, 5, 5]} /><meshStandardMaterial color={C.fog} transparent opacity={0.4} depthWrite={false} /></mesh>)}
    <mesh position={[segs[0].x - 10, segs[0].by, segs[0].z + 8]}><sphereGeometry args={[1.75, 6, 6]} /><meshStandardMaterial color={C.deep} /></mesh>
    <mesh position={[segs[0].x - 10, segs[0].by, segs[0].z - 8]}><sphereGeometry args={[1.75, 6, 6]} /><meshStandardMaterial color={C.deep} /></mesh>
    <mesh position={[segs[0].x - 10, segs[0].by - 4, segs[0].z]} rotation={[0, TAU / 4, Math.PI]}><circleGeometry args={[4, 16, 0, Math.PI]} /><meshBasicMaterial color={C.deep} side={THREE.DoubleSide} /></mesh>
  </group>
}

function Road() {
  const rot = useRef<THREE.Group>(null)
  const car = useRef<THREE.Group>(null)
  const rs = useMemo(() => {
    const d: {x:number;z:number;ry:number;sx:number;sz:number}[] = []
    const R = 120, n = 40, sz = 5, sx = (R + sz) * TAU / n / 2
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU; d.push({ x: Math.cos(a) * R, z: Math.sin(a) * R, ry: a + TAU / 4, sx, sz }) }
    return d
  }, [])
  useFrame((s) => {
    const t = s.clock.elapsedTime
    if (rot.current) rot.current.rotation.y = (t / 20) * TAU
    if (car.current) { car.current.rotation.x = Math.sin(t * 0.4) * 0.1; car.current.position.y = Math.sin(t * 0.3) * 2 + 6 }
  })
  return <group>
    <mesh rotation={[TAU / 4, 0, 0]}><ringGeometry args={[115, 125, 64]} /><meshStandardMaterial color={C.deep} side={THREE.DoubleSide} /></mesh>
    <group ref={rot}><group ref={car} position={[0, 6, 120]} scale={1.2}>
      {/* lower body */}
      <mesh position={[0, 0, 0]}><boxGeometry args={[10, 2, 5]} /><meshStandardMaterial color={C.paintjob} /></mesh>
      {/* cabin */}
      <mesh position={[0.5, 1.8, 0]}><boxGeometry args={[5, 2, 4]} /><meshStandardMaterial color={C.paintjob} /></mesh>
      {/* wheels */}
      <mesh position={[-3.5, -1.5, 2.6]} rotation={[TAU/4,0,0]}><cylinderGeometry args={[1, 1, 0.8, 10]} /><meshStandardMaterial color={C.deep} /></mesh>
      <mesh position={[3.5, -1.5, 2.6]} rotation={[TAU/4,0,0]}><cylinderGeometry args={[1, 1, 0.8, 10]} /><meshStandardMaterial color={C.deep} /></mesh>
      <mesh position={[-3.5, -1.5, -2.6]} rotation={[TAU/4,0,0]}><cylinderGeometry args={[1, 1, 0.8, 10]} /><meshStandardMaterial color={C.deep} /></mesh>
      <mesh position={[3.5, -1.5, -2.6]} rotation={[TAU/4,0,0]}><cylinderGeometry args={[1, 1, 0.8, 10]} /><meshStandardMaterial color={C.deep} /></mesh>
    </group></group>
  </group>
}

export function SpookyIsland({ position, scale = 0.003, onClick }: { position: [number,number,number]; scale?: number; onClick?: () => void }) {
  const sc = useRef<THREE.Group>(null)
  const cloudARot = useRef<THREE.Group>(null)
  const cloudBRot = useRef<THREE.Group>(null)
  const cloudAShape = useRef<THREE.Group>(null)
  const cloudBShape = useRef<THREE.Group>(null)
  const cloudALight = useRef<THREE.PointLight>(null)
  const cloudBLight = useRef<THREE.PointLight>(null)
  const [cloudAHov, setCloudAHov] = useState(false)
  const [cloudBHov, setCloudBHov] = useState(false)
  const [hov, setHov] = useState(false)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (cloudARot.current) cloudARot.current.rotation.y = (t / 60) * TAU
    if (cloudBRot.current) cloudBRot.current.rotation.y = (t / 80) * TAU

    const updateCloudLightning = (
      shape: THREE.Group | null,
      light: THREE.PointLight | null,
      hovered: boolean,
      phase: number,
    ) => {
      const pulse = hovered ? Math.pow(Math.max(0, Math.sin(t * (18 + phase))), 3) : 0
      const burst = hovered && Math.sin(t * (43 + phase * 2)) > 0.94 ? 1 : 0
      const flash = Math.min(1, pulse * 0.7 + burst)

      if (shape) {
        shape.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
            mats.forEach((m) => {
              if (m instanceof THREE.MeshBasicMaterial || m instanceof THREE.MeshStandardMaterial) {
                m.color.set(C.darker)
                m.color.lerp(new THREE.Color("#c7d2fe"), flash * 0.38)
              }
            })
          }
        })
      }
      if (light) {
        light.intensity = hovered ? 0.25 + flash * 1.8 : 0
      }
    }

    updateCloudLightning(cloudAShape.current, cloudALight.current, cloudAHov, 0)
    updateCloudLightning(cloudBShape.current, cloudBLight.current, cloudBHov, 4)
  })

  return <group position={position} scale={scale}>
    <mesh onClick={e => { e.stopPropagation(); onClick?.() }} onPointerOver={() => setHov(true)} onPointerOut={() => setHov(false)}>
      <sphereGeometry args={[150, 8, 8]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
    <group ref={sc} position={[0, -12, 0]} rotation={[0, TAU / 8, 0]}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[50, 80, 50]} intensity={1} />

      {/* center island */}
      <group>
        <mesh rotation={[TAU / 4, 0, 0]}><planeGeometry args={[72, 72]} /><meshStandardMaterial color={C.dark} side={THREE.DoubleSide} /></mesh>
        <Py position={[0, -0.5, 0]} scale={[51, -52, 51]} rotation={[0, TAU/8, 0]} color={C.darker} />
        <House />
        <CT position={[-28, 0, 18]} d={7} l={9} />
        <CT position={[-24, 0, -14]} d={7} l={9} />
        <CT position={[24, 0, 22]} d={7} l={9} />
      </group>

      {/* south island */}
      <group position={[0, 0, 165]} scale={0.75}>
        <mesh position={[0, -1, 0]}><boxGeometry args={[50, 2, 50]} /><meshStandardMaterial color={C.dark} /></mesh>
        <Py position={[0, -1, 0]} scale={[36, -40, 36]} rotation={[0, TAU/8, 0]} color={C.deep} />
        <Py position={[-12, 0, -4]} scale={[12, 46, 12]} color={C.dark} />
        <CT position={[2, 0, 8]} /><CT position={[15, 0, -6]} /><CT position={[-10, 0, 5]} />
        <IslandCampfire position={[8, 0, -10]} />
      </group>

      {/* north island */}
      <group position={[0, 0, -165]} scale={0.75}>
        <mesh position={[0, -1, 0]}><boxGeometry args={[54, 2, 54]} /><meshStandardMaterial color={C.dark} /></mesh>
        <Py position={[0, -1, 0]} scale={[39, -45, 39]} rotation={[0, TAU/8, 0]} color={C.deep} />
        <Py position={[12, 0, -12]} scale={[14, 52, 14]} color={C.dark} />
        <CT position={[18, 0, 0]} /><CT position={[-12, 0, -4]} /><CT position={[10, 0, 14]} /><CT position={[0, 0, -18]} />
      </group>

      {/* east island */}
      <group position={[165, 0, 0]} scale={0.75}>
        <mesh position={[0, -1, 0]}><boxGeometry args={[42, 2, 42]} /><meshStandardMaterial color={C.dark} /></mesh>
        <Py position={[0, -1, 0]} scale={[30, -35, 30]} rotation={[0, TAU/8, 0]} color={C.deep} />
        <CT position={[10, 0, 10]} />
        <IslandDeskHuman position={[0, 0, 2]} />
              </group>

      {/* west island */}
      <group position={[-165, 0, 0]} scale={0.75}>
        <mesh position={[0, -1, 0]}><boxGeometry args={[54, 2, 54]} /><meshStandardMaterial color={C.dark} /></mesh>
        <Py position={[0, -1, 0]} scale={[39, -42, 39]} rotation={[0, TAU/8, 0]} color={C.deep} />
        <Py position={[-4, 0, -4]} scale={[16, 54, 16]} color={C.dark} />
        <CT position={[-16, 0, 6]} /><CT position={[-12, 0, -14]} /><CT position={[10, 0, 10]} d={8} l={8} />
      </group>

      <GraveIsland position={[82, 0, 47]} />
      <GraveIsland position={[-7, 0, -89]} />
      <GraveIsland position={[-84, 0, 48]} />

      {/* cloud A */}
      <group ref={cloudARot} position={[0, 94, 0]}>
        <group
          ref={cloudAShape}
          position={[0, 0, -64]}
          onPointerOver={(e) => { e.stopPropagation(); setCloudAHov(true) }}
          onPointerOut={(e) => { e.stopPropagation(); setCloudAHov(false) }}
        >
          <mesh scale={[2.0, 0.4, 1.2]}><sphereGeometry args={[20, 10, 6]} /><meshBasicMaterial color={C.darker} /></mesh>
          <mesh position={[0, 14, 0]}><sphereGeometry args={[18, 8, 6]} /><meshBasicMaterial color={C.darker} /></mesh>
          <mesh position={[-20, 8, 2]}><sphereGeometry args={[13, 8, 6]} /><meshBasicMaterial color={C.darker} /></mesh>
          <mesh position={[20, 10, 3]}><sphereGeometry args={[15, 8, 6]} /><meshBasicMaterial color={C.darker} /></mesh>
          <mesh position={[-10, 4, -4]}><sphereGeometry args={[10, 8, 6]} /><meshBasicMaterial color={C.darker} /></mesh>
          <mesh position={[10, 6, 5]}><sphereGeometry args={[11, 8, 6]} /><meshBasicMaterial color={C.darker} /></mesh>
          <pointLight ref={cloudALight} position={[0, 8, 0]} color="#c7d2fe" intensity={0} distance={30} />
        </group>
      </group>

      {/* cloud B */}
      <group ref={cloudBRot} position={[0, 60, 0]}>
        <group
          ref={cloudBShape}
          position={[0, 0, 88]}
          onPointerOver={(e) => { e.stopPropagation(); setCloudBHov(true) }}
          onPointerOut={(e) => { e.stopPropagation(); setCloudBHov(false) }}
        >
          <mesh scale={[1.8, 0.4, 1.1]}><sphereGeometry args={[18, 10, 6]} /><meshBasicMaterial color={C.darker} /></mesh>
          <mesh position={[0, 12, 0]}><sphereGeometry args={[16, 8, 6]} /><meshBasicMaterial color={C.darker} /></mesh>
          <mesh position={[22, 8, -2]}><sphereGeometry args={[18, 8, 6]} /><meshBasicMaterial color={C.darker} /></mesh>
          <mesh position={[-18, 6, 2]}><sphereGeometry args={[12, 8, 6]} /><meshBasicMaterial color={C.darker} /></mesh>
          <mesh position={[10, 4, 4]}><sphereGeometry args={[10, 8, 6]} /><meshBasicMaterial color={C.darker} /></mesh>
          <pointLight ref={cloudBLight} position={[0, 7, 0]} color="#c7d2fe" intensity={0} distance={28} />
        </group>
      </group>
      <Fog />
      <Road />
    </group>
  </group>
}
