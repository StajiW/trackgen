function firstChoiceHillClimb(path) {
    let bestLapTime = getLapTime(path), lapTime
    let selection = getInitialSelection(path)
    let value

    while (true) {
        value = getRandom(selection)

        if (value === null) break

        lapTime = step(path, value)

        if (lapTime < bestLapTime) {
            bestLapTime = lapTime
            selection = getInitialSelection(path)
        }
    }

    return bestLapTime
}

function getInitialSelection(path) {
    const selection = []

    for (let i = 0; i < path.segments.length; i++) {
        selection.push([])
        for (let j = 0; j < 12; j++) {
            selection[i].push(j)
        }
    }

    return selection
}

function getRandom(selection) {
    let count = 0, value

    for (let i = 0; i < selection.length; i++) {
        count += selection[i].length
    }

    if (count === 0) return null

    let int = getRandomInt(0, count)

    count = 0

    for (let i = 0; i < selection.length; i++) {
        if (int < selection[i].length) {
            value = {
                i: i,
                j: selection[i][int]
            }
            selection[i].splice(int, 1)

            return value
        }

        int -= selection[i].length
    }

    return null
}

function hillClimbStep(state, value) {
    const path = state.clone()

    const i = value.i

    const point = path.segments[i].point.clone()
    const offset = path.getOffsetOf(point)
    const normal = path.getNormalAt(offset)

    const handleIn = path.segments[i].handleIn.clone()
    const handleOut = path.segments[i].handleOut.clone()

    const j = value.j

    switch (j) {
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

    const newLapTime = getLapTime(path)
    const lapTime = getLapTime(state)

    if (newLapTime < lapTime && isInBounds(path)) {
        state.copyContent(path)
        path.remove()
        return newLapTime
    }

    path.remove()
    return lapTime
}