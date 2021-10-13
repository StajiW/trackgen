const interval = 0.1 * trackWidth / 2
const handleInterval = 1.1
const angleInterval = 1

function greedyLocalSearchStep(target) {
    const temp = target.clone()
    const bestPath = target.clone()
    let bestLapTime = getLapTime(target)

    for (let i = 0; i < target.segments.length; i++) {
        const point = target.segments[i].point.clone()
        const offset = target.getOffsetOf(point)
        const normal = target.getNormalAt(offset)

        const handleIn = target.segments[i].handleIn.clone()
        const handleOut = target.segments[i].handleOut.clone()

        // Center
        temp.segments[i].point = point.add(normal.multiply(interval))
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)

        temp.segments[i].point = point.subtract(normal.multiply(interval))
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)

        temp.segments[i].point = target.getPointAt(offset + interval)
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)

        temp.segments[i].point = target.getPointAt(offset - interval)
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)

        // HandleIn
        temp.segments[i].handleIn = handleIn.multiply(handleInterval)
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)

        temp.segments[i].handleIn = handleIn.divide(handleInterval)
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)

        temp.segments[i].handleIn.angle += angleInterval
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)

        temp.segments[i].handleIn.angle -= angleInterval
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)

        // HandleOut
        temp.segments[i].handleOut = handleOut.multiply(handleInterval)
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)

        temp.segments[i].handleOut = handleOut.divide(handleInterval)
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)

        temp.segments[i].handleOut.angle += angleInterval
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)

        temp.segments[i].handleOut.angle -= angleInterval
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, target)
    }

    target.copyContent(bestPath)
    temp.remove()
    bestPath.remove()

    return bestLapTime
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