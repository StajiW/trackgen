// Variable declarations
const numSplits = 200, trackWidth = 0.2, trackMul = 100, trackSplits = 1000

const g = 9.8
const mu = 1.4
const mass = 500
const R = mass * g
const ro = 1.19
const A = 1.11
const Cd = 0.71
const P = 745.7 * 100 * 0.91

let endVelocity = 20, racePath, track, stepSize = 1, trackPoints = []

const generationSize = 250

let population = []

let canUpdate = true, done = false, lapTime = 0, lastLapTime = 0
let selected, circle

let k = 0, kMax = 10000, temperature

let mode



// View
view.scaling = 200
view.center = [0, 0]

view.onResize = (e) => {
    view.center = [0, 0]
}

tool.onMouseDrag = function (event) {
    var delta = event.downPoint.subtract(event.point)
    paper.view.scrollBy(delta)
}

view.onFrame = (e) => {
    // if (e.count % 60 !== 0) return

    if (!canUpdate || done) return

    canUpdate = false

    if (mode === 'hillClimb') {
        hillClimb(racePath)

        lapTime = getLapTime(racePath)

        if (lapTime === lastLapTime) done = true

        lastLapTime = lapTime
    }
    else if (mode === 'hillClimbSync') {
        hillClimbSync(racePath)

        lapTime = getLapTime(racePath)

        if (lapTime === lastLapTime) done = true

        lastLapTime = lapTime
    }
    else if (mode === 'simulatedAnnealing') {
        simulatedAnnealing(racePath)

        lapTime = getLapTime(racePath)
    }
    else if (mode === 'geneticAlgorithm') {
        if (population.length === 0) {
            population = getInitialPopulation()
            sortPopulation()
        }

        console.log(0)
        geneticStep()
        console.log(1)

        racePath.copyContent(population[0].path)
        lapTime = population[0].lapTime

        console.log(population[population.length - 1].lapTime)

        document.getElementById('lapTime').innerHTML = lapTime
    }

    document.getElementById('lapTime').innerHTML = lapTime

    canUpdate = true
}

function simulatedAnnealing(state) {
    const coolingRate = 0.95
    temperature = temperature * coolingRate
    const N = 100
    let newState, newLapTime

    for (let i = 0; i < N; i++) {
        while (true) {
            newState = neighbour(state)

            if (isInBounds(newState)) break

            newState.remove()
        }

        newLapTime = getLapTime(newState)

        if (newLapTime <= lapTime) {
            state.copyContent(newState)
            lapTime = newLapTime
        }
        else {
            if (Math.exp((lapTime - newLapTime) / temperature) > Math.random()) {
                state.copyContent(newState)
                lapTime = newLapTime
            }
        }

        newState.remove()
    }
}

function getNeighbour(state) {
    const interval = 0.1 * trackWidth / 2
    const angleInterval = 1
    const handleInterval = 1.1

    const path = state.clone()

    const i = getRandomInt(0, path.segments.length)

    const point = path.segments[i].point
    const offset = path.getOffsetOf(point)
    const normal = path.getNormalAt(offset)

    const int = getRandomInt(0, 12)

    switch (int) {
        case 0:
            path.segments[i].point = point + normal * interval
            break
        case 1:
            path.segments[i].point = point - normal * interval
            break
        case 2:
            path.segments[i].point = path.getPointAt(offset + interval)
            break
        case 3:
            path.segments[i].point = path.getPointAt(offset - interval)
            break
        case 4:
            path.segments[i].handleIn *= handleInterval
            break
        case 5:
            path.segments[i].handleIn /= handleInterval
            break
        case 6:
            path.segments[i].handleIn.angle += angleInterval
            break
        case 7:
            path.segments[i].handleIn.angle -= angleInterval
            break
        case 8:
            path.segments[i].handleOut *= handleInterval
            break
        case 9:
            path.segments[i].handleOut /= handleInterval
            break
        case 10:
            path.segments[i].handleOut.angle += angleInterval
            break
        case 11:
            path.segments[i].handleOut.angle -= angleInterval
            break
        default:
    }

    return path
}







function main() {
    track = new Path()
    const json = loadFile('tracks/6.json')
    track.importJSON(json)
    track.strokeWidth = trackWidth
    track.strokeColor = 'black'

    trackPoints = getPoints(track, trackSplits)

    stepSize = track.length / numSplits

    racePath = track.clone()
    racePath.strokeWidth = 0.02
    racePath.strokeColor = 'red'

    lapTime = getLapTime(racePath)

    temperature = (0.2 / -Math.log(0.1)) * lapTime
}

function loadFile(filePath) {
    let result = null
    const xmlhttp = new XMLHttpRequest()
    xmlhttp.open("GET", filePath, false)
    xmlhttp.send()

    if (xmlhttp.status==200) {
        result = xmlhttp.responseText;
    }

    return result
}



function hillClimb(target) {
    const interval = 0.1 * trackWidth / 2
    const temp = target.clone()
    const bestPath = target.clone()
    let bestLapTime = getLapTime(target)

    temp.strokeWidth = 0.01
    temp.strokeColor = 'blue'

    for (let i = 0; i < target.segments.length; i++) {
        const point = target.segments[i].point
        const offset = target.getOffsetOf(point)
        const normal = target.getNormalAt(offset)

        // Center
        temp.segments[i].point += normal * interval
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)

        temp.segments[i].point -= normal * interval
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)

        temp.segments[i].point = target.getPointAt(offset + interval)
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)

        temp.segments[i].point = target.getPointAt(offset - interval)
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)

        // HandleIn
        temp.segments[i].handleIn += [interval, 0]
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)

        temp.segments[i].handleIn -= [interval, 0]
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)

        temp.segments[i].handleIn += [0, interval]
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)

        temp.segments[i].handleIn -= [0, interval]
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)

        // HandleOut
        temp.segments[i].handleOut += [interval, 0]
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)

        temp.segments[i].handleOut -= [interval, 0]
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)

        temp.segments[i].handleOut += [0, interval]
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)

        temp.segments[i].handleOut -= [0, interval]
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)
    }

    target.copyContent(bestPath)
    temp.remove()
    bestPath.remove()

    return bestLapTime
}

function hillClimbSync(target) {
    const interval = 0.1 * trackWidth / 2
    const temp = target.clone()
    const bestPath = target.clone()
    let bestLapTime = getLapTime(target)
    let lapTime1, lapTime2

    temp.strokeWidth = 0.01
    temp.strokeColor = 'blue'

    for (let i = 0; i < target.segments.length; i++) {
        const point = target.segments[i].point
        const offset = target.getOffsetOf(point)
        const normal = target.getNormalAt(offset)

        // Center
        temp.segments[i].point += normal * interval
        lapTime1 = getLapTime(temp)
        temp.copyContent(target)
        temp.segments[i].point -= normal * interval
        lapTime2 = getLapTime(temp)

        if (lapTime1 <= lapTime2 && lapTime1 < lapTime) {
            bestPath.segments[i].point += normal * interval
        }
        else if (lapTime2 <= lapTime1 && lapTime2 < lapTime) {
            bestPath.segments[i].point -= normal * interval
        }


        temp.segments[i].point = target.getPointAt(offset + interval)
        lapTime1 = getLapTime(temp)
        temp.copyContent(target)
        temp.segments[i].point = target.getPointAt(offset - interval)
        lapTime2 = getLapTime(temp)

        if (lapTime1 <= lapTime2 && lapTime1 < lapTime) {
            bestPath.segments[i].point = target.getPointAt(offset + interval)
        }
        else if (lapTime2 <= lapTime1 && lapTime2 < lapTime) {
            bestPath.segments[i].point = target.getPointAt(offset - interval)
        }

        // HandleIn
        temp.segments[i].handleIn += [interval, 0]
        bestLapTime = getNewLapTime(temp, bestPath, lapTime, target)

        temp.segments[i].handleIn -= [interval, 0]
        bestLapTime = getNewLapTime(temp, bestPath, lapTime, target)

        temp.segments[i].point = target.getPointAt(offset + interval)
        lapTime1 = getLapTime(temp)
        temp.copyContent(target)
        temp.segments[i].point = target.getPointAt(offset - interval)
        lapTime2 = getLapTime(temp)

        temp.segments[i].handleIn += [0, interval]
        bestLapTime = getNewLapTime(temp, bestPath, lapTime, target)

        temp.segments[i].handleIn -= [0, interval]
        bestLapTime = getNewLapTime(temp, bestPath, lapTime, target)

        // HandleOut
        temp.segments[i].handleOut += [interval, 0]
        bestLapTime = getNewLapTime(temp, bestPath, lapTime, target)

        temp.segments[i].handleOut -= [interval, 0]
        bestLapTime = getNewLapTime(temp, bestPath, lapTime, target)

        temp.segments[i].handleOut += [0, interval]
        bestLapTime = getNewLapTime(temp, bestPath, lapTime, target)

        temp.segments[i].handleOut -= [0, interval]
        bestLapTime = getNewLapTime(temp, bestPath, lapTime, target)
    }

    target.copyContent(bestPath)
    temp.remove()
    bestPath.remove()

    return getLapTime(bestPath)
}

function getNewLapTime(path, bestPath, bestLapTime, copyFrom) {
    let lapTime = getLapTime(path)

    if (lapTime < bestLapTime) {
        if (isInBounds(path)) {
            bestPath.copyContent(path)
        }
        else {
            lapTime = bestLapTime
        }
    }
    else {
        lapTime = bestLapTime
    }

    path.copyContent(copyFrom)

    return lapTime
}

function getInitialPopulation() {
    const array = []

    for (let i = 0; i < generationSize; i++) {
        let path

        while (true) {
            path = getRandomRacePath()
            path.strokeWidth = 0

            if (isInBounds(path)) {
                break
            }

            path.remove()
        }

        array.push({
            path: path,
            lapTime: getLapTime(path)
        })
    }

    return array
}

function geneticStep() {
    population = population.splice(0, population.length / 2)

    while (population.length < generationSize) {
        const index1 = getRandomInt(0, population.length)
        let index2 = index1
        while (index2 === index1) index2 = getRandomInt(0, population.length)

        const children = getChildren(population[index1].path, population[index2].path)

        if (children) {
            population.push(children[0])
            population.push(children[1])
        }
    }

    sortPopulation()
}

function sortPopulation() {
    population.sort((a, b) => (a.lapTime > b.lapTime) ? 1 : (a.lapTime < b.lapTime) ? -1 : 0)
}

function getChildren(parent1, parent2) {
    const alpha = getRandomInt(0, 10)
    const beta = Math.random()
    const child1 = parent1.clone()
    const child2 = parent1.clone()

    for (let i = 0; i < parent1.segments.length; i++) {
        const point1 = parent1.segments[i].point.clone()
        const point2 = parent2.segments[i].point.clone()
        const handleIn1 = parent1.segments[i].handleIn.clone()
        const handleIn2 = parent2.segments[i].handleIn.clone()
        const handleOut1 = parent1.segments[i].handleOut.clone()
        const handleOut2 = parent2.segments[i].handleOut.clone()

        child1.segments[i].point = point1 - (point1 - point2) * beta
        child1.segments[i].handleIn = handleIn1 - (handleIn1 - handleIn2) * beta
        child1.segments[i].handleOut = handleOut1 - (handleOut1 - handleOut2) * beta

        mutate(child1, i)

        child2.segments[i].point = point2 + (point1 - point2) * beta
        child2.segments[i].handleIn = handleIn2 + (handleIn1 - handleIn2) * beta
        child2.segments[i].handleOut = handleOut2 + (handleOut1 - handleOut2) * beta

        mutate(child2, i)
    }

    if (!isInBounds(child1) || !isInBounds(child2)) {
        return null
    }

    return [
        {
            path: child1,
            lapTime: getLapTime(child1)
        },
        {
            path: child2,
            lapTime: getLapTime(child2)
        }
    ]
}

function mutate(path, i) {
    const chance = 0.2
    const interval = 0.1 * trackWidth / 2

    if (Math.random() < chance) {
        const offset = path.getOffsetOf(path.segments[i].point)
        const normal = path.getNormalAt(offset)
        path.segments[i].point += normal * (2 * interval * Math.random() - interval)

        path.segments[i].handleIn 
        path.segments[i].handleOut += getRandomPoint(interval)
    }
    if (Math.random() < chance) {
        const offset = path.getOffsetOf(path.segments[i].point)
        path.segments[i].point = path.getPointAt(offset + 2 * interval * Math.random() - interval)
    }
    if (Math.random() < chance) {
        path.segments[i].handleIn *= getRandomFloat(0.9, 1.1)
    }
    if (Math.random() < chance) {
        path.segments[i].handleIn.angle += getRandomFloat(-5, 5)
    }
    if (Math.random() < chance) {
        path.segments[i].handleOut *= getRandomFloat(0.9, 1.1)
    }
    if (Math.random() < chance) {
        path.segments[i].handleOut.angle += getRandomFloat(-5, 5)
    }
}

function getBestPath() {
    let bestLapTime = Number.MAX_SAFE_INTEGER, bestPath

    for (let path of population) {
        const lapTime = getLapTime(path)

        if (lapTime < bestLapTime) {
            bestLapTime = lapTime
            bestPath = path
        }
    }

    return bestPath
}

tool.onKeyDown = (e) => {
    if (e.key === '+') view.scaling *= 1.2
    else if (e.key === '-') view.scaling /= 1.2

    if (selected === null) return

    const point = racePath.segments[selected].point
    const offset = racePath.getOffsetOf(point)
    const normal = racePath.getNormalAt(offset)

    if (e.key === 'up') {
        racePath.segments[selected].point = point + (normal * trackWidth / 2 * 0.1)

        document.getElementById('lapTime').innerHTML = getLapTime(racePath)
    }
    else if (e.key === 'down') {
        racePath.segments[selected].point = point - (normal * trackWidth / 2 * 0.1)

        document.getElementById('lapTime').innerHTML = getLapTime(racePath)
    }
}

tool.onMouseDown = (e) => {
    for (let i = 0; i < racePath.segments.length; i++) {
        const point = racePath.segments[i].point

        if ((point - e.point).length < 0.1) {
            selected = i
            if (circle) circle.remove()
            circle = new Path.Circle(point, 0.1)
            circle.strokeColor = 'blue'
            circle.strokeWidth = 0.02

            return
        }
    }

    if (circle) circle.remove()
    selected = null
}

function getRandomRacePath() {
    const path = track.clone()

    for (let segment of path.segments) {
        const offset = track.getOffsetOf(segment.point)
        let newOffset = offset + getRandomFloat(-0.1, 0.1)

        if (newOffset < 0) newOffset += track.length

        const newPoint = track.getPointAt(newOffset)
        const normal = track.getNormalAt(newOffset)

        segment.point = newPoint + normal * getRandomFloat(-1, 1) * trackWidth / 2

        // segment.handleIn += getRandomPoint(0.1)
        // segment.handleOut += getRandomPoint(0.1)
    }

    return path
}

function getRandomPoint(maxLength) {
    const angle = getRandomFloat(0, 360)
    const length = getRandomFloat(0, maxLength)

    return new Point({
        length: length,
        angle: angle
    })
}

function isInBounds(path) {
    const points = getPoints(path, numSplits)

    const firstPoint = track.getNearestPoint(points[0])
    const firstOffset = track.getOffsetOf(firstPoint)
    let k = Math.floor(firstOffset / track.length * trackSplits)

    for (let i = 0; i < numSplits; i++) {
        const point = points[i]
        
        k = a(point, k)

        if (k === null) return false
    }

    return true
}

function a(point, k) {
    for (j = 0; j < trackSplits / 10; j++) {
        dist = point.getDistance(trackPoints[k % trackSplits])

        if (dist < trackWidth / 2) return k

        k++
    }

    return null
}

function getPoints(path, splits) {
    const points = []
    const splitSize = path.length / splits

    for (let i = 0; i < splits; i++) {
        const point = path.getPointAt(i * splitSize)
        points.push(point)
    }

    return points
}

function getRacePath(offsets) {
    const path = new Path()

    for (let i = 0; i < numSplits; i++) {        
        path.add(getPointWithOffset(i, offsets[i]))
    }

    path.closePath()
    return path
}

function getPointWithOffset(index, offset) {
    const point = track.getPointAt(index * stepSize)
    let normal = track.getNormalAt(index * stepSize)
    normal *= offset * (trackWidth / 2)

    return point + normal
}


// Track generation
function generateTrack() {
    const numCorners = getRandomInt(10, 10)
    const cornerDist = (Math.PI * 2) / numCorners
    const path = new Path()
    let lastPoint

    lastPoint = new Point(
        Math.sin(0),
        Math.cos(0)
    )

    path.add(lastPoint)

    for (let i = 1; i < numCorners; i++) {
        offset = getRandomFloat(-cornerDist / 2, cornerDist / 2)
        const pos = cornerDist * i + getRandomFloat(-cornerDist / 2, cornerDist / 2)
        // const pos = cornerDist * i

        let point = new Point(
            Math.sin(pos),
            Math.cos(pos)
        )

        point *= getRandomFloat(0.5, 2)

        // if (i === 10) point *= 2

        path.add(point)
    }

    path.closePath()
    path.smooth({ type: 'geometric' })

    return path
}




// Laptime calculation
function getSectors(path) {
    let prev, curr, next, length, entryVelocity = endVelocity, exitVelocity, maxVelocity, radius
    const sectors = []

    const points = getPoints(path, numSplits)

    prev = points[points.length - 1]
    curr = points[0]

    for (let i = 0; i < points.length; i++) {
        next = points[(i + 1) % points.length]

        radius = getRadius(prev, curr, next)

        maxVelocity = getMaxVelocity(radius)

        length = (next - curr).length * trackMul

        exitVelocity = getExitVelocity(entryVelocity, length)

        if (exitVelocity > maxVelocity) exitVelocity = maxVelocity

        sectors.push({
            radius: radius,
            length: length,
            entryVelocity: entryVelocity,
            exitVelocity: exitVelocity
        })

        entryVelocity = exitVelocity
        prev = curr
        curr = next
    }

    for (let i = sectors.length - 2; i > 0; i--) {
        const sector = sectors[i]
        const nextSector = sectors[i + 1]

        if (sector.entryVelocity <= nextSector.entryVelocity) continue

        const maxEntryVelocity = getMaxEntryVelocity(nextSector.entryVelocity, sector.length, sector.radius)

        if (maxEntryVelocity < sector.entryVelocity) {
            sectors[i].entryVelocity = maxEntryVelocity
        }

        sectors[i].exitVelocity = sectors[i + 1].entryVelocity
    }

    // endVelocity = sectors[sectors.length - 1].exitVelocity

    return sectors
}

function getLapTime(path) {
    const sectors = getSectors(path)

    return sectors.reduce((x, y) => x + y.length / ((y.entryVelocity + y.exitVelocity) / 2), 0)
}

function getMaxVelocity(radius) {
    return Math.pow(Math.pow(mu * R, 2) / (Math.pow(mass / radius, 2) + Math.pow((1 / 2) * ro * A * Cd, 2)), 1 / 4)
}

function getExitVelocity(u, s) {
    const steps = 10

    let speed = u

    for (let i = 0; i < steps; i++) {
        const a = ((P / speed) - (1 / 2) * ro * speed * speed * A * Cd) / mass

        speed = Math.sqrt(speed * speed + 2 * s / steps * a)
    }

    return speed
}

function getMaxEntryVelocity(v, s, r) {
    const Fd = (1 / 2) * ro * v * v * A * Cd
    const Fb = Math.sqrt(mu * mu * R * R - (mass * mass * Math.pow(v, 4) / (r * r)))
    const Fs = Fd + Fb

    return Math.sqrt(v * v + 2 * s * Fs / mass)
}

function getRadius(prev, curr, next) {
    const a = (next - prev).length * trackMul
    const b = (next - curr).length * trackMul
    const c = (curr - prev).length * trackMul

    const angle = Math.acos((b * b + c * c - a * a) / (2 * b * c))

    if (a === 0) return 0

    return a / (2 * Math.sin(Math.PI - angle)) || Number.MAX_SAFE_INTEGER
}







main()





const buttons = document.getElementsByClassName('button')

for (let button of buttons) {
    button.addEventListener('click', (e) => {
        if (!mode) {
            mode = e.target.id
            e.target.classList.add('selected')

            for (let button2 of buttons) {
                button2.classList.remove('selectable')
            }
        }
    })
}










// let doneHC = false, doneHCSync = false, doneGA = false
// let canUpdateHC = true, canUpdateHCSync = true, canUpdateGA = true
// let lapTimeHC = 0, lapTimeHCSync = 0, lapTimeGA = 0
// let pathHC, pathHCSync, pathGA

// function modeSetup() {
//     path.strokeWidth = 0

//     pathHC = path.clone()
//     pathHC.strokeWidth = 0.02
//     pathHC.strokeColor = 'green'

//     pathHCSync = path.clone()
//     pathHCSync.strokeWidth = 0.02
//     pathHCSync.strokeColor = 'blue'

//     pathGA = path.clone()
//     pathGA.strokeWidth = 0.02
//     pathGA.strokeColor = 'red'
// }

// function modeAll() {
//     if (!pathHC) modeSetup()

//     if (canUpdateHC) setTimeout(() => {
//         canUpdateHC = false

//         canUpdateHC = true
//     }, 0)
// }