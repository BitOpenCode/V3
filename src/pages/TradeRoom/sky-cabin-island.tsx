"use client"

import { useMemo, useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"

const MODEL_URL = "https://assets.codepen.io/370061/scene-r.gltf"

export function SkyCabinIsland({
  position,
  scale = 0.028,
  onClick,
}: {
  position: [number, number, number]
  scale?: number
  onClick?: () => void
}) {
  const root = useRef<THREE.Group>(null)
  const modelWrap = useRef<THREE.Group>(null)
  const hoverGlow = useRef<THREE.PointLight>(null)
  const [hovered, setHovered] = useState(false)

  const gltf = useGLTF(MODEL_URL)

  const modelScene = useMemo(() => {
    const scene = gltf.scene.clone(true)
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return

      const name = obj.name.toLowerCase()
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      const whiteLike = mats.some((m) => m instanceof THREE.MeshStandardMaterial && m.color.getHSL({ h: 0, s: 0, l: 0 }).l > 0.82)

      const isLargeSphere = obj.geometry instanceof THREE.SphereGeometry && ((obj.geometry.parameters?.radius ?? 0) > 0.18)
      const isLargeCircle = obj.geometry instanceof THREE.CircleGeometry && ((obj.geometry.parameters?.radius ?? 0) > 0.2)
      const isMoonGeom = isLargeSphere || isLargeCircle

      // moon in this asset is a floating white round mesh on right side
      const p = obj.position
      const isRightFloating = p.x > 0.9 && p.y > 0.6 && Math.abs(p.z) < 2.2

      if (name.includes("moon") || (whiteLike && isMoonGeom && isRightFloating)) {
        obj.visible = false
      }
    })
    return scene
  }, [gltf.scene])

  useFrame(() => {
    if (hoverGlow.current) hoverGlow.current.intensity = hovered ? 2.4 : 1.5
  })

  return (
    <group position={position} scale={scale}>
      <mesh
        onClick={(e) => {
          // Prevent accidental zoom while rotating camera
          if (e.delta > 4) return
          e.stopPropagation()
          onClick?.()
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[35, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <group ref={root} position={[0, 0, 0]}>
        <ambientLight intensity={0.9} color="#9fb2ff" />
        <pointLight ref={hoverGlow} position={[0, 20, 0]} intensity={1.5} distance={80} color="#dbeafe" />

        <group ref={modelWrap} scale={7.5} position={[0, -0.8, 0]}>
          <primitive object={modelScene} />
        </group>
      </group>
    </group>
  )
}

useGLTF.preload(MODEL_URL)
