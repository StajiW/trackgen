const { getRandomInt, getRandomFloat } = require('./util')
const { isInBounds, getRandomRacePath } = require('./paths')
const { getLapTime } = require('./lapTime')

const trackWidth = 0.2

const generationSize = 100
let population

function geneticAlgorithm() {
    population = getInitialPopulation()
    sortPopulation()

    for (let i = 0; i < 500; i++) {
        geneticStep()
    }

    return population[0].path
}

function getInitialPopulation() {
    const array = []

    for (let i = 0; i < generationSize; i++) {
        const path = getRandomRacePath()

        array.push({
            path: path,
            lapTime: getLapTime(path)
        })
    }

    return array
}

function geneticStep() {
    for (let i = population.length / 2; i < population.length; i++) {
        population[i].path.remove()
    }

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
    // const alpha = getRandomInt(0, 10)
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

        child1.segments[i].point = point1.subtract((point1.subtract(point2)).multiply(beta))
        child1.segments[i].handleIn = handleIn1.subtract((handleIn1.subtract(handleIn2)).multiply(beta))
        child1.segments[i].handleOut = handleOut1.subtract((handleOut1.subtract(handleOut2)).multiply(beta))

        mutate(child1, i)

        child2.segments[i].point = point2.add((point1.subtract(point2)).multiply(beta))
        child2.segments[i].handleIn = handleIn2.add((handleIn1.subtract(handleIn2)).multiply(beta))
        child2.segments[i].handleOut = handleOut2.add((handleOut1.subtract(handleOut2)).multiply(beta))

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
    const chance = 0.1
    const interval = 0.1 * trackWidth / 2

    const point = path.segments[i].point
    const offset = path.getOffsetOf(point)
    const normal = path.getNormalAt(offset)

    const handleIn = path.segments[i].handleIn
    const handleOut = path.segments[i].handleOut

    if (Math.random() < chance) {
        path.segments[i].point = point.add(normal.multiply(2 * interval * Math.random() - interval))
    }
    if (Math.random() < chance) {
        path.segments[i].point = path.getPointAt(offset + 2 * interval * Math.random() - interval)
    }
    if (Math.random() < chance) {
        path.segments[i].handleIn = handleIn.multiply(getRandomFloat(0.9, 1.1))
    }
    if (Math.random() < chance) {
        path.segments[i].handleIn.angle += getRandomFloat(-5, 5)
    }
    if (Math.random() < chance) {
        path.segments[i].handleOut = handleOut.multiply(getRandomFloat(0.9, 1.1))
    }
    if (Math.random() < chance) {
        path.segments[i].handleOut.angle += getRandomFloat(-5, 5)
    }
}


module.exports = {
    geneticAlgorithm
}