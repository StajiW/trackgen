const coolingRate = 0.95
const N = 100

function simulatedAnnealing(state) {
    let lapTime = getLapTime(state)
    let bestLapTime = lapTime
    let temperature = (0.2 / -Math.log(0.1)) * lapTime
    let counter = 0

    while (temperature > 0.01 || counter < 5) {
        step(state, temperature)

        lapTime = getLapTime(state)

        if (lapTime < bestLapTime) {
            bestLapTime = lapTime
            counter = 0
        }
        else counter++

        temperature = temperature * coolingRate
    }

    return bestLapTime
}

function simulatedAnnealingStep(state, temperature) {
    let lapTime = getLapTime(state)
    let newState

    for (let i = 0; i < N; i++) {
        while (true) {
            newState = getNeighbor(state)

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

    return lapTime
}

function getNeighbor(state) {
    const path = state.clone()

    const i = getRandomInt(0, path.segments.length)

    const point = path.segments[i].point.clone()
    const offset = path.getOffsetOf(point)
    const normal = path.getNormalAt(offset)

    const handleIn = path.segments[i].handleIn.clone()
    const handleOut = path.segments[i].handleOut.clone()

    const int = getRandomInt(0, 12)

    switch (int) {
        case 0:
            path.segments[i].point = point.add(normal.multiply(interval))
            break
        case 1:
            path.segments[i].point = point.subtract(normal.multiply(interval))
            break
        case 2:
            path.segments[i].point = path.getPointAt(offset + interval)
            break
        case 3:
            path.segments[i].point = path.getPointAt(offset - interval)
            break
        case 4:
            path.segments[i].handleIn = handleIn.multiply(handleInterval)
            break
        case 5:
            path.segments[i].handleIn = handleIn.divide(handleInterval)
            break
        case 6:
            path.segments[i].handleIn.angle += angleInterval
            break
        case 7:
            path.segments[i].handleIn.angle -= angleInterval
            break
        case 8:
            path.segments[i].handleOut = handleOut.multiply(handleInterval)
            break
        case 9:
            path.segments[i].handleOut = handleOut.divide(handleInterval)
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
