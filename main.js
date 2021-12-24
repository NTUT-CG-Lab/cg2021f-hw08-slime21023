import { GUI } from "./jsm/libs/dat.gui.module.js"
// import Stats from "./jsm/libs/stats.module.js"
import { Volume } from "./jsm/misc/Volume.js"
import { NRRDLoader } from "./jsm/loaders/NRRDLoader.js"
import { TrackballControls } from "./jsm/controls/TrackballControls.js"
import {
    Matrix4,
    Vector3,
    PerspectiveCamera,
    Scene,
    HemisphereLight,
    DirectionalLight,
    WebGLRenderer,
    AxesHelper,
    BoxGeometry,
    MeshBasicMaterial,
    Mesh,
    BoxHelper
} from "./build/three.module.js"

let box, cube, sliceX, sliceY, sliceZ, gui

const loadDatOrRaw = (scene, reader, m) => {
    if (gui) gui.destroy()
    if (box) scene.remove(box)
    if (cube) scene.remove(cube)
    if (sliceX) scene.remove(sliceX.mesh)
    if (sliceY) scene.remove(sliceY.mesh)
    if (sliceZ) scene.remove(sliceZ.mesh)

    gui = new GUI()
    const volDims = [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])]
    const bit = m[4]
    reader.onload = () => {
        const arrayBuffer = reader.result
        const volume = new Volume(volDims[0], volDims[1], volDims[2], bit, arrayBuffer)
        const [min, max] = volume.computeMinMax()

        volume.windowLow = min
        volume.windowHigh = max
        volume.matrix = new Matrix4()
        volume.inverseMatrix = new Matrix4()
        volume.inverseMatrix.copy(volume.matrix).invert()
        volume.RASDimensions = new Vector3(
            volume.xLength,
            volume.yLength,
            volume.zLength
        ).applyMatrix4(volume.matrix)
            .round()
            .toArray()
            .map(Math.abs)

        if (volume.lowerThreshold === - Infinity) {
            volume.lowerThreshold = min
        }

        if (volume.upperThreshold === Infinity) {
            volume.upperThreshold = max
        }

        const geometry = new BoxGeometry(
            volume.xLength,
            volume.yLength,
            volume.zLength
        )

        //z plane
        sliceZ = volume.extractSlice("z", Math.floor(volume.RASDimensions[2] / 4))
        scene.add(sliceZ.mesh)

        //y plane
        sliceY = volume.extractSlice("y", Math.floor(volume.RASDimensions[1] / 2))
        scene.add(sliceY.mesh)

        //x plane
        sliceX = volume.extractSlice("x", Math.floor(volume.RASDimensions[0] / 2))
        scene.add(sliceX.mesh)

        gui.add(sliceX, "index", 0, volume.RASDimensions[0], 1)
            .name("indexX")
            .onChange(() => { sliceX.repaint.call(sliceX) })

        gui.add(sliceY, "index", 0, volume.RASDimensions[1], 1)
            .name("indexY")
            .onChange(() => { sliceY.repaint.call(sliceY) })

        gui.add(sliceZ, "index", 0, volume.RASDimensions[2], 1)
            .name("indexZ")
            .onChange(() => { sliceZ.repaint.call(sliceZ) })

        // box border
        const material = new MeshBasicMaterial({ color: 0x00ff00 })
        cube = new Mesh(geometry, material)
        cube.visible = false
        box = new BoxHelper(cube)
        scene.add(box)
        box.applyMatrix4(volume.matrix)
        scene.add(cube)
    }
}

const loadNRRD = (scene, filename) => {
    if (gui) gui.destroy()
    if (box) scene.remove(box)
    if (cube) scene.remove(cube)
    if (sliceX) scene.remove(sliceX.mesh)
    if (sliceY) scene.remove(sliceY.mesh)
    if (sliceZ) scene.remove(sliceZ.mesh)

    gui = new GUI()
    const loader = new NRRDLoader()
    loader.load(filename, volume => {
        const geometry = new BoxGeometry(
            volume.xLength,
            volume.yLength,
            volume.zLength
        )

        //z plane
        sliceZ = volume.extractSlice("z", Math.floor(volume.RASDimensions[2] / 4))
        scene.add(sliceZ.mesh)

        //y plane
        sliceY = volume.extractSlice("y", Math.floor(volume.RASDimensions[1] / 2))
        scene.add(sliceY.mesh)

        //x plane
        sliceX = volume.extractSlice("x", Math.floor(volume.RASDimensions[0] / 2))
        scene.add(sliceX.mesh)

        gui.add(sliceX, "index", 0, volume.RASDimensions[0], 1)
            .name("indexX")
            .onChange(() => { sliceX.repaint.call(sliceX) })

        gui.add(sliceY, "index", 0, volume.RASDimensions[1], 1)
            .name("indexY")
            .onChange(() => { sliceY.repaint.call(sliceY) })

        gui.add(sliceZ, "index", 0, volume.RASDimensions[2], 1)
            .name("indexZ")
            .onChange(() => { sliceZ.repaint.call(sliceZ) })

        // box border
        const material = new MeshBasicMaterial({ color: 0x00ff00 })
        cube = new Mesh(geometry, material)
        cube.visible = false
        box = new BoxHelper(cube)
        scene.add(box)
        box.applyMatrix4(volume.matrix)
        scene.add(cube)
    })
}

const init = () => {
    const camera = new PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.01,
        1e10
    )
    camera.position.z = 300
    const scene = new Scene()
    scene.add(camera)

    // light
    const hemiLight = new HemisphereLight(0xffffff, 0x000000, 1)
    scene.add(hemiLight)

    const dirLight = new DirectionalLight(0xffffff, 0.5)
    dirLight.position.set(200, 200, 200)
    scene.add(dirLight)

    // renderer 
    const renderer = new WebGLRenderer()
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)

    const container = document.createElement("div")
    document.body.appendChild(container)
    container.appendChild(renderer.domElement)

    const controls = new TrackballControls(camera, renderer.domElement)
    controls.minDistance = 100
    controls.maxDistance = 500
    controls.rotateSpeed = 5.0
    controls.zoomSpeed = 5
    controls.panSpeed = 2

    // setupInset
    const [insetWidth, insetHeight] = [150, 150]
    const container2 = document.getElementById("inset")
    container2.width = insetWidth
    container2.height = insetHeight

    const renderer2 = new WebGLRenderer({ alpha: true })
    renderer2.setClearColor(0x000000, 0)
    renderer2.setSize(insetWidth, insetHeight)
    container2.appendChild(renderer2.domElement)

    const scene2 = new Scene()
    const camera2 = new PerspectiveCamera(
        50,
        insetWidth / insetHeight,
        1,
        1000
    )
    camera2.up = camera.up // important!
    const axes2 = new AxesHelper(100)
    scene2.add(axes2)

    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
        controls.handleResize()
    })

    const fileInput = document.getElementById("fileInput")
    fileInput.addEventListener('change', event => {
        const [input] = event.target.files

        const filename = input.name
        const d = filename.split(".")
        const m = filename.split("_")

        if (d[1] == "nrrd") {
            loadNRRD(scene, `models/nrrd/${filename}`)
        }
        else {
            const reader = new FileReader()
            loadDatOrRaw(scene, reader, m)
            reader.readAsArrayBuffer(input)
        }
    })

    const animate = () => {
        requestAnimationFrame(animate)
        controls.update()

        //copy position of the camera into inset
        camera2.position.copy(camera.position)
        camera2.position.sub(controls.target)
        camera2.position.setLength(300)
        camera2.lookAt(scene2.position)
        renderer.render(scene, camera)
        renderer2.render(scene2, camera2)
    }

    return animate
}

window.onload = () => {
    const animate = init()
    animate()
}