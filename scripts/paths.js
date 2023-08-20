let trackPoints = null
let trackPath = null
const trackWidth = 0.2
const trackSplits = 1000
const pointsDist = 0.05





function getPoints(path, splits) {
    const points = []
    const splitSize = path.length / splits

    for (let i = 0; i < splits; i++) {
        const point = path.getPointAt(i * splitSize)
        points.push(point)
    }

    return points
}

function getPoints2(path) {
    const points = []

    const trackLength = path.length
    let offset = 0

    while (offset < trackLength) {
        const point = path.getPointAt(offset)
        points.push(point)
        offset += pointsDist
    }

    return points
}

function getTrack(index) {
    const file = loadFile(`tracks/${index}.json`, 'utf8')

    track = new Path()
    track.importJSON(file)

    return track
}

function importFile(fileName) {
    const file = loadFile(fileName, 'utf8')

    track = new Path()
    track.importJSON(file)

    return track
}

function generateTrack() {
    const numCorners = 10
    const cornerDist = (Math.PI * 2) / numCorners
    const path = new Path()
    
    for (let i = 0; i < numCorners; i++) {
        const pos = cornerDist * i + getRandomFloat(-cornerDist / 2, cornerDist / 2)

        let point = new Point(
            Math.sin(pos),
            Math.cos(pos)
        )

        point = point.multiply(getRandomFloat(0.5, 2))

        path.add(point)
    }

    path.closePath()
    path.smooth({ type: 'geometric' })

    return path
}


function exportTracks() {
    let track, json

    for (let i = 0; i < 100; i++) {
        track = generateTrack()

        json = track.exportJSON()

        fs.writeFileSync(`tracks/${i}.json`, json)

        track.remove()
    }
}

function setTrack(track) {
    if (trackPath) trackPath.remove()
    trackPath = track.clone()
    trackPoints = getPoints(track, 1000)
}

function isInBounds(path) {
    const points = getPoints2(path, numSplits)

    const firstPoint = trackPath.getNearestPoint(points[0])
    const firstOffset = trackPath.getOffsetOf(firstPoint)
    let k = Math.floor(firstOffset / trackPath.length * trackSplits)

    for (let i = 0; i < points.length; i++) {
        const point = points[i]
        
        k = a(point, k)

        if (k === null) return false
    }

    return true
}

function a(point, k) {
    for (j = 0; j < trackSplits / 10; j++) {
        dist = point.getDistance(trackPoints[k % trackSplits])

        if (dist <= trackWidth / 2) return k

        k++
    }

    return null
}


function getRandomRacePath() {
    const path = new Path()

    do {
        path.copyContent(trackPath)

        for (let segment of path.segments) {
            const offset = path.getOffsetOf(segment.point)
            let newOffset = offset + getRandomFloat(-0.1, 0.1)
    
            if (newOffset < 0) newOffset += track.length
            if (newOffset > track.length) newOffset -= track.length
    
            const newPoint = track.getPointAt(newOffset)
            const normal = track.getNormalAt(newOffset)
    
            segment.point = newPoint.add(normal.multiply(getRandomFloat(-1, 1) * trackWidth / 2))
    
            segment.handleIn.angle += getRandomFloat(-10, 10)
            segment.handleIn = segment.handleIn.multiply(getRandomFloat(0.75, 1.5))
            segment.handleOut.angle += getRandomFloat(-10, 10)
            segment.handleOut = segment.handleOut.multiply(getRandomFloat(0.75, 1.5))
        }
    } while (!isInBounds(path))


    return path
}
