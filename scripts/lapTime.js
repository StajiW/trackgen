const numSplits = 200
const g = 9.8
const mu = 1.4
const mass = 500
const R = mass * g
const ro = 1.19
const A = 1.11
const Cd = 0.71
const P = 745.7 * 100 * 0.91
const trackMul = 100



function getLapTime(path) {
    const sectors = getSectors(path)

    return sectors.reduce((x, y) => x + y.length / ((y.entryVelocity + y.exitVelocity) / 2), 0)
}



function getSectors(path) {
    let prev, curr, next, length, entryVelocity = 20, exitVelocity, maxVelocity, radius
    const sectors = []

    const points = getPoints(path, numSplits)

    prev = points[points.length - 1]
    curr = points[0]

    for (let i = 0; i < points.length; i++) {
        next = points[(i + 1) % points.length]

        radius = getRadius(prev, curr, next)

        maxVelocity = getMaxVelocity(radius)

        length = next.subtract(curr).length * trackMul

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

    return sectors
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
    const a = next.subtract(prev).length * trackMul
    const b = next.subtract(curr).length * trackMul
    const c = curr.subtract(prev).length * trackMul

    const angle = Math.acos((b * b + c * c - a * a) / (2 * b * c))

    if (a === 0) return 0

    return a / (2 * Math.sin(Math.PI - angle)) || Number.MAX_SAFE_INTEGER
}