import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

const gui = new GUI()
const debugObject = {
    shapeCount: 45,
    orbitSpeed: 0.15,
    bgColor: '#160f2b'
}

const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()
scene.background = new THREE.Color(debugObject.bgColor)
scene.fog = new THREE.Fog(debugObject.bgColor, 4, 14)

const palette = [
    '#ff5e7e',
    '#ff9e5e',
    '#ffd166',
    '#6ee7d4',
    '#8b7bff'
]

const ambientLight = new THREE.AmbientLight('#ffffff', 0.35)
scene.add(ambientLight)

const hemiLight = new THREE.HemisphereLight('#8b7bff', '#160f2b', 0.4)
scene.add(hemiLight)

const pointLights = []
const pointLightCount = 3

for (let i = 0; i < pointLightCount; i++)
{
    const color = palette[i % palette.length]
    const light = new THREE.PointLight(color, 8, 8, 2)
    light.userData.radius = THREE.MathUtils.randFloat(2.5, 3.5)
    light.userData.theta = (i / pointLightCount) * Math.PI * 2
    light.userData.speed = 0.3 + i * 0.05
    light.userData.height = THREE.MathUtils.randFloat(-1, 1)
    scene.add(light)
    pointLights.push(light)

    const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 8, 8),
        new THREE.MeshBasicMaterial({ color })
    )
    light.add(marker)
}

const shapesGroup = new THREE.Group()
scene.add(shapesGroup)
let textMesh = null

const fontLoader = new FontLoader()
fontLoader.load(
    '/fonts/helvetiker_regular.typeface.json',
    (font) =>
    {
        const textGeometry = new TextGeometry('Hello 3D Text', {
            font: font,
            size: 0.5,
            depth: 0.2,
            curveSegments: 5,
            bevelEnabled: true,
            bevelThickness: 0.03,
            bevelSize: 0.02,
            bevelOffset: 0,
            bevelSegments: 4
        })
        textGeometry.center()

        const textMaterial = new THREE.MeshStandardMaterial({
            color: '#ffffff',
            roughness: 0.3,
            metalness: 0.1
        })
        textMesh = new THREE.Mesh(textGeometry, textMaterial)
        scene.add(textMesh)

        const geometries = [
            new THREE.IcosahedronGeometry(1, 0),
            new THREE.TorusGeometry(1, 0.4, 16, 32),
            new THREE.OctahedronGeometry(1, 0)
        ]

        const spawnShapes = (count) =>
        {
            while (shapesGroup.children.length)
            {
                const child = shapesGroup.children.pop()
                child.geometry.dispose()
                child.material.dispose()
            }

            for (let i = 0; i < count; i++)
            {
                const geometry = geometries[Math.floor(Math.random() * geometries.length)]
                const material = new THREE.MeshStandardMaterial({
                    color: palette[Math.floor(Math.random() * palette.length)],
                    roughness: 0.35,
                    metalness: 0.15
                })

                const mesh = new THREE.Mesh(geometry, material)

                const isHero = Math.random() < 0.15
                const baseScale = isHero
                    ? THREE.MathUtils.randFloat(0.35, 0.5)
                    : THREE.MathUtils.randFloat(0.08, 0.18)
                mesh.scale.setScalar(baseScale)

                mesh.userData.radius = THREE.MathUtils.randFloat(2.2, 4.5)
                mesh.userData.theta = Math.random() * Math.PI * 2
                mesh.userData.phi = THREE.MathUtils.randFloat(Math.PI * 0.25, Math.PI * 0.75)
                mesh.userData.orbitDir = Math.random() < 0.5 ? 1 : -1
                mesh.userData.orbitSpeedMult = THREE.MathUtils.randFloat(0.4, 1.2)
                mesh.userData.bobSpeed = THREE.MathUtils.randFloat(0.5, 1.5)
                mesh.userData.bobOffset = Math.random() * Math.PI * 2
                mesh.userData.spin = (Math.random() - 0.5) * 2

                shapesGroup.add(mesh)
            }
        }

        spawnShapes(debugObject.shapeCount)

        gui.add(debugObject, 'shapeCount', 10, 120, 5).name('shape count').onFinishChange((value) =>
        {
            spawnShapes(value)
        })
        gui.add(debugObject, 'orbitSpeed', 0, 0.5, 0.01).name('orbit speed')
        gui.addColor(debugObject, 'bgColor').name('background').onChange((value) =>
        {
            scene.background.set(value)
            scene.fog.color.set(value)
        })

        const lightFolder = gui.addFolder('Lights')
        lightFolder.add(ambientLight, 'intensity', 0, 1, 0.05).name('ambient')
        pointLights.forEach((light, i) =>
        {
            lightFolder.add(light, 'intensity', 0, 20, 0.5).name(`point light ${i + 1}`)
        })
    }
)

const sizes = { width: window.innerWidth, height: window.innerHeight }
window.addEventListener('resize', () =>
{
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(1, 1, 3.5)
scene.add(camera)

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

const renderer = new THREE.WebGLRenderer({ canvas: canvas })
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    if (textMesh)
    {
        textMesh.rotation.y = Math.sin(elapsedTime * 0.3) * 0.1
    }

    pointLights.forEach((light) =>
    {
        const u = light.userData
        const theta = u.theta + elapsedTime * u.speed
        light.position.x = Math.cos(theta) * u.radius
        light.position.z = Math.sin(theta) * u.radius
        light.position.y = u.height
    })

    shapesGroup.children.forEach((mesh) =>
    {
        const u = mesh.userData
        const theta = u.theta + elapsedTime * debugObject.orbitSpeed * u.orbitSpeedMult * u.orbitDir

        mesh.position.x = u.radius * Math.sin(u.phi) * Math.cos(theta)
        mesh.position.z = u.radius * Math.sin(u.phi) * Math.sin(theta)
        mesh.position.y = u.radius * Math.cos(u.phi) * 0.5
            + Math.sin(elapsedTime * u.bobSpeed + u.bobOffset) * 0.15

        mesh.rotation.x += 0.01 * u.spin
        mesh.rotation.y += 0.015 * u.spin
    })

    controls.update()
    renderer.render(scene, camera)
    window.requestAnimationFrame(tick)
}

tick()