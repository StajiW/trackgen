const numSplits = 100
const trackWidth = 0.2
let track, stepSize = 1, raceLine, racePath, curveIndex = 0, velocityTable, drawnTrack



function main() {
    track = generateTrack()
    track.strokeColor = 'black'
    track.strokeWidth = trackWidth
    track.fullySelected = true

    // track.shadowColor = 'black'
    // track.shadowBlur = 0.02

    stepSize = track.length / numSplits
    
    raceLine = new Array(100).fill(0)
    racePath = getRacePath(raceLine)
    // racePath.simplify(0.00005)
    // racePath.smooth()
    
    // racePath.strokeColor = 'red'
    // racePath.strokeWidth = 0.02
    // racePath.fullySelected = true

    velocityTable = new Array(100).fill(0)
}

function setupView() {
    view.scaling = 200
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

function drawRacePath(offsets) {
    if (drawnTrack) drawnTrack.forEach(path => { if (path) path.remove() })
    drawnTrack = []
    let path

    for (let i = 0; i < numSplits; i++) {
        path = new Path()
        
        path.add(getPointWithOffset(i, offsets[i]))

        path.add(getPointWithOffset((i + 1) % numSplits, offsets[(i + 1) % numSplits]))

        path.strokeWidth = 0.02
        const colorMap = map(velocityTable[i], 0, 80, 1, 0)
        path.strokeColor = new Color(255, colorMap, colorMap)

        drawnTrack.push(path)
    }

    return path
}

function getPointWithOffset(index, offset) {
    const point = track.getPointAt(index * stepSize)
    let normal = track.getNormalAt(index * stepSize)
    normal *= offset * (trackWidth / 2)

    return point + normal
}

function generateTrack() {
    const numCorners = getRandomInt(5, 10)
    const cornerDist = (Math.PI * 2) / numCorners
    const path = new Path()
    let offset, lastPoint

    lastPoint = new Point(
        Math.sin(0),
        Math.cos(0)
    )

    path.add(lastPoint)

    for (let i = 1; i < numCorners; i++) {
        offset = getRandomFloat(-cornerDist / 2, cornerDist / 2)
        const pos = cornerDist * i + getRandomFloat(-cornerDist / 2, cornerDist / 2)

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

function getLapTime(path) {
    const g = 0.4
    const mu = 9.8

    let time = 0, prev, curr, next, length, angle, angle1, angle2, radius, velocity = 20, maxVelocity
    const radiuses = []

    const points = path._segments.map(x => new Point(x._point._x, x._point._y))

    prev = points[points.length - 1]
    curr = points[0]

    for (let i = 0; i < points.length; i++) {
        next = points[(i + 1) % points.length]

        angle1 = (curr - prev).angle
        angle2 = (next - curr).angle

        angle = Math.abs(angle1 - angle2) / 2

        length = ((curr - prev).length + (next - curr).length) * 200

        radius = getRadius(angle, length)

        radiuses.push(radius)

        maxVelocity = Math.sqrt(g * mu * radius)

        if (maxVelocity - velocity > 5) velocity += 5
        else velocity = maxVelocity

        time += length / velocity

        prev = curr
        curr = next

        velocityTable[i] = velocity
    }

    return time
}

function getRadius(angle, length) {
    const x = angle / 360
    const circumference = length / x
    return circumference / (2 * Math.PI)
}

function addRandomCurve(offsets, index) {
    const temp = offsets.slice()
    // const index = getRandomInt(0, offsets.length)
    const width = getRandomInt(5, 20)
    // const width = 5
    let lapTime = getLapTime(racePath), newLapTime
    let bestPath = temp.slice()

    for (let k = -10; k <= 10; k++) {
        const offset = k / 10

        const startVal = raceLine[(index - width + offsets.length) % offsets.length]
        const endVal = raceLine[(index + width) % offsets.length]
    
        for (let i = index - width; i < index; i++) {
            let j = i % offsets.length
            if (j < 0) j += offsets.length
            temp[j] = map(i, index - width, index, startVal, offset)
        }
    
        for (let i = index; i < index + width; i++) {
            temp[i % offsets.length] = map(i, index, index + width, offset, endVal)
        }
    
        const path = getRacePath(temp)

        newLapTime = getLapTime(path) 
    
        if (newLapTime < lapTime) {
            lapTime = newLapTime
            bestPath = temp.slice()
        }
    }

    return bestPath
}

// function testAngles() {
//     let prev, curr, next, angle
//     const points = raceLine._segments.map(x => new Point(x._point._x, x._point._y))

//     curr = points[0]

//     for (let i = 0; i < numSplits; i++) {
//         next = points[(i + 1) % numSplits]

//         angle = (next - curr).angle

//         const point = curr + new Point({
//             length: trackWidth / 2,
//             angle: angle - 90
//         })

//         const circle = new Path.Circle(point, 0.02)
//         circle.fillColor = 'blue'

//         curr = next
//     }

//     return total
// }




setupView()
main()

// view.onFrame = function(e) {
//     raceLine = addRandomCurve(raceLine, curveIndex).slice()
//     if (racePath) racePath.remove()
//     racePath = getRacePath(raceLine)
//     // racePath.strokeColor = 'red'
//     // racePath.strokeWidth = 0.02

//     drawRacePath(raceLine)

//     curveIndex++
// }








