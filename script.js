const numSplits = 100
const trackWidth = 0.15

const g = 9.8
const mu = 1.4
const mass = 500
const R = mass * g
const ro = 1.19
const A = 1.11
const Cd = 0.71
const P = 745.7 * 100 * 0.91

const trackMul = 100

let track, stepSize = 1, raceLine, racePath, curveIndex = 0, drawnTrack, lapTime, velocityMap, carOffset = 0, endVelocity = 20



function main() {
    track = generateTrack()
    track.strokeColor = 'black'
    track.strokeWidth = trackWidth
    // track.fullySelected = true

    console.log(track.length * trackMul)

    stepSize = track.length / numSplits

    racePath = track.clone()
    racePath.strokeColor = 'red'
    racePath.strokeWidth = 0.02
    racePath.fullySelected = true

    raceLine = new Array(racePath.segments.length).fill(0)

    car = new Path.Rectangle(racePath.getPointAt(carOffset), [0.05, 0.025])
    car.applyMatrix = false
    car.rotation = racePath.getTangentAt(carOffset).angle
    car.fillColor = 'white'
    
    // optimizePath2()

    // lapTime = getLapTime(racePath)

    // document.getElementById('lapTime').innerHTML = lapTime

    // drawVelocity()
}

function setupView() {
    view.scaling = 250
    view.center = [0,0]
}

function getRacePath(offsets) {
    const path = new Path()

    for (let i = 0; i < numSplits; i++) {        
        path.add(getPointWithOffset(i, offsets[i]))
    }

    path.closePath()
    return path
}

function drawVelocity() {
    if (drawnTrack) drawnTrack.forEach(path => { if (path) path.remove() })
    drawnTrack = []
    const points = getPoints(racePath, numSplits)
    const sectors = getSectors(racePath)
    let path, prev = points[points.length - 1], curr = points[0], next, velocity, vibrance

    for (let i = 0; i < points.length; i++) {
        next = points[(i + 1) % points.length]
        path = new Path()

        path.add(curr)
        path.add(next)

        velocity = (sectors[i].entryVelocity + sectors[i].exitVelocity) / 2
        vibrance = map(velocity, 0, 100, 1, 0)

        path.strokeColor = new Color(255, vibrance, vibrance)
        path.strokeWidth = 0.03

        drawnTrack.push(path)
  
        prev = curr
        curr = next
    }

    return path
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

function getPointWithOffset(index, offset) {
    const point = track.getPointAt(index * stepSize)
    let normal = track.getNormalAt(index * stepSize)
    normal *= offset * (trackWidth / 2)

    return point + normal
}

function generateTrack() {
    const numCorners = getRandomInt(8, 13)
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

        path.add(point)
    }

    path.closePath()
    path.smooth({ type: 'geometric' })

    return path
}

function getTotalCurvature(path) {
    let total = 0, prev, curr, next, angle1, angle2
    const points = path._segments.map(x => new Point(x._point._x, x._point._y))

    prev = points[points.length - 1]
    curr = points[0]

    for (let i = 0; i < points.length; i++) {
        next = points[(i + 1) % points.length]

        angle1 = (curr - prev).angle
        angle2 = (next - curr).angle

        total += Math.abs(angle1 - angle2) / 2

        prev = curr
        curr = next
    }

    return total
}

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

    endVelocity = sectors[sectors.length - 1].exitVelocity

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
    const a = ((P / u) - (1 / 2) * ro * u * u * A * Cd) / mass

    return Math.sqrt(u * u + 2 * s * a)
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

function optimizePath() {
    lapTime = getLapTime(racePath)
    let newLapTime
    let tempPath = new Path()

    for (let i = raceLine.length - 1; i >= 0; i--) {
        tempPath.copyContent(racePath)

        const point = track.segments[i].point.clone()
        const offset = track.getOffsetOf(point)
        const normal = track.getNormalAt(offset)

        const trackPos = raceLine[i]

        // Increase trackPos
        if (trackPos < 1) {
            tempPath.segments[i].point = point + (normal * trackWidth / 2 * (trackPos + 0.1))

            newLapTime = applyIfFaster(tempPath, lapTime)

            if (newLapTime < lapTime) {
                raceLine[i] += 0.1
            }

            lapTime = newLapTime
        }

        // Decrease trackPos
        if (trackPos > -1) {
            tempPath.segments[i].point = point + (normal * trackWidth / 2 * (trackPos - 0.1))
            
            newLapTime = applyIfFaster(tempPath, lapTime)
            
            if (newLapTime < lapTime) {
                raceLine[i] -= 0.1
            } 

            lapTime = newLapTime
        }

        // Increase offset
        tempPath.segments[i].point = track.getPointAt((offset + 0.01) % track.length)
        lapTime = applyIfFaster(tempPath, lapTime)

        // Descrease offset
        tempPath.segments[i].point = track.getPointAt((offset - 0.01) % track.length)
        lapTime = applyIfFaster(tempPath, lapTime)

        // Increase handleIn
        tempPath.segments[i].handleIn *= 1.1
        lapTime = applyIfFaster(tempPath, lapTime)
        
        // Decrease handleIn
        tempPath.segments[i].handleIn /= 1.1
        lapTime = applyIfFaster(tempPath, lapTime)
        
        // Increase handleOut
        tempPath.segments[i].handleOut *= 1.1
        lapTime = applyIfFaster(tempPath, lapTime)

        // Decrease handleOut
        tempPath.segments[i].handleOut /= 1.1
        lapTime = applyIfFaster(tempPath, lapTime)

        // Turn angle
        tempPath.segments[i].handleIn.angle += 5
        tempPath.segments[i].handleOut.angle += 5
        lapTime = applyIfFaster(tempPath, lapTime)

        tempPath.segments[i].handleIn.angle -= 5
        tempPath.segments[i].handleOut.angle -= 5
        lapTime = applyIfFaster(tempPath, lapTime)
    }
}

function optimizePath2() {
    lapTime = getLapTime(racePath)
    let tempPath = new Path()

    for (let i = 0; i < raceLine.length; i++) {
        tempPath.copyContent(racePath)

        const point = track.segments[i].point.clone()
        const offset = track.getOffsetOf(point)
        const normal = track.getNormalAt(offset)

        for (let j = -10; j <= 10; j++) {
            const trackPos = j / 10

            tempPath.segments[i].point = point + (normal * (trackWidth / 2) * trackPos)

            lapTime = applyIfFaster(tempPath, lapTime)
        }
    }
}





function applyIfFaster(tempPath, lapTime) {
    const newLapTime = getLapTime(tempPath)

    if (newLapTime < lapTime && isInBounds(tempPath)) {
        lapTime = newLapTime
        racePath.copyContent(tempPath)

        return newLapTime
    }
    else {
        tempPath.remove()
        tempPath.copyContent(racePath)
    
        return lapTime
    }
}

function isInBounds(path) {
    const points = getPoints(path, numSplits)

    for (let i = 0; i < numSplits; i++) {
        const point = points[i]
        const pointOnTrack = track.getNearestPoint(point)

        if ((point - pointOnTrack).length > trackWidth / 2) return false
    }

    return true
}




setupView()
main()

view.onFrame = function(e) {
    if (document.getElementById('braking').checked) {
        if (!velocityMap) {
            velocityMap = getSectors(racePath).map(sector => (sector.entryVelocity + sector.exitVelocity) / 2)
            console.log(((P / 20) - (1 / 2) * ro * 20 * 20 * A * Cd) / mass)
        }

        if (drawnTrack) drawnTrack.forEach(x => x.remove())
            
        const velocity = velocityMap[Math.floor(carOffset / racePath.length * numSplits) % numSplits]

        carOffset += velocity * e.delta / trackMul

        document.getElementById('lapTime').innerHTML = velocity * 3.6

        car.position = racePath.getPointAt(carOffset)
        car.rotation = racePath.getTangentAt(carOffset).angle
    }
    else {
        optimizePath()

        drawVelocity()
    
        lapTime = getLapTime(racePath)
    
        document.getElementById('lapTime').innerHTML = lapTime
    }
}

view.onResize = (e) => {
    view.center = [0,0]
}






tool.onMouseDown = (e) => {
    for (segment of racePath.segments) {
        if ((segment.point - e.point).length < 0.1) segment.point = e.point

        lapTime = getLapTime(racePath)
    
        document.getElementById('lapTime').innerHTML = lapTime
    
        drawVelocity()
    }
}

