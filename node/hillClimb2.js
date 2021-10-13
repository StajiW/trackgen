const { getLapTime } = require('./lapTime')
const { isInBounds } = require('./paths')

const trackWidth = 0.2

const interval = 0.1 * trackWidth / 2
const handleInterval = 1.1
const angleInterval = 1

function hillClimb(path) {
    let lapTime = getLapTime(path)
    let lastLapTime = Number.MAX_SAFE_INTEGER

    while (lapTime < lastLapTime) {
        lastLapTime = lapTime
        lapTime = step(path)
    }

    return lapTime
}

function step(target) {
    const temp = target.clone()
    const bestPath = target.clone()
    let lapTime = getLapTime(target)
    let bestLapTime = lapTime

    for (let i = 0; i < target.segments.length; i++) {
        const point = target.segments[i].point.clone()
        const offset = target.getOffsetOf(point)
        const normal = target.getNormalAt(offset)

        const handleIn = target.segments[i].handleIn.clone()
        const handleOut = target.segments[i].handleOut.clone()

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
        temp.segments[i].handleIn = handleIn.multiply(handleInterval)
        lapTime1 = getLapTime(temp)
        temp.copyContent(target)
        temp.segments[i].handleIn = handleIn.divide(handleInterval)
        lapTime2 = getLapTime(temp)

        if (lapTime1 <= lapTime2 && lapTime1 < lapTime) {
            bestPath.segments[i].point = target.getPointAt(offset + interval)
        }
        else if (lapTime2 <= lapTime1 && lapTime2 < lapTime) {
            bestPath.segments[i].point = target.getPointAt(offset - interval)
        }

        temp.segments[i].handleIn.angle += angleInterval
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, bestPath)

        temp.segments[i].handleIn.angle -= angleInterval
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, bestPath)

        // HandleOut
        temp.segments[i].handleOut = handleOut.multiply(handleInterval)
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, bestPath)

        temp.segments[i].handleOut = handleOut.divide(handleInterval)
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, bestPath)

        temp.segments[i].handleOut.angle += angleInterval
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, bestPath)

        temp.segments[i].handleOut.angle -= angleInterval
        bestLapTime = getNewLapTime(temp, bestPath, bestLapTime, bestPath)
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

module.exports = {
    hillClimb
}