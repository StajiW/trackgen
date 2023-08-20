const { getTrack, setTrack, isInBounds, getRandomRacePath } = require('./paths')
const { getLapTime } = require('./lapTime')
const { hillClimb } = require('./hillClimb')
const { firstChoiceHillClimb } = require('./firstChoiceHillClimb')
const { simulatedAnnealing } = require('./simulatedAnnealing')
const { geneticAlgorithm } = require('./geneticAlgorithm')
const { performance } = require('perf_hooks')
const fs = require('fs')
const math = require('mathjs')

function testHillClimb() {
    let track
    const results = []

    for (let i = 0; i < 100; i++) {
        console.log(i)

        track = getTrack(i)
        setTrack(track)

        const t0 = performance.now()
        const lapTime = hillClimb(track)
        const t1 = performance.now()

        results.push({
            lapTime: lapTime,
            runTime: (t1 - t0) / 1000
        })
    }

    fs.writeFileSync('hillClimb.json', JSON.stringify(results, null, 4))
}

function testSimulatedAnnealing() {
    let track
    const results = []

    for (let i = 0; i < 100; i++) {
        console.log(i)

        track = getTrack(i)
        setTrack(track)

        const t0 = performance.now()
        const lapTime = simulatedAnnealing(track)
        const t1 = performance.now()

        results.push({
            lapTime: lapTime,
            runTime: (t1 - t0) / 1000
        })
    }

    fs.writeFileSync('simulatedAnnealing.json', JSON.stringify(results, null, 4))
}


function testGeneticAlgorithm() {
    let track
    const results = []

    for (let i = 56; i < 100; i++) {
        console.log(i)

        track = getTrack(i)
        setTrack(track)

        const t0 = performance.now()
        const lapTime = geneticAlgorithm()
        const t1 = performance.now()

        results.push({
            lapTime: lapTime,
            runTime: (t1 - t0) / 1000
        })

        fs.appendFileSync('geneticAlgorithm2.json', JSON.stringify({
            lapTime: lapTime,
            runTime: (t1 - t0) / 1000
        }, null, 4))
    }

    fs.writeFileSync('geneticAlgorithm.json', JSON.stringify(results, null, 4))
}

function testFirstChoiceHillClimb() {
    let track
    const results = []

    for (let i = 0; i < 100; i++) {
        console.log(i)

        track = getTrack(i)
        setTrack(track)

        const t0 = performance.now()
        const lapTime = firstChoiceHillClimb(track)
        const t1 = performance.now()

        results.push({
            lapTime: lapTime,
            runTime: (t1 - t0) / 1000
        })
    }

    fs.writeFileSync('firstChoiceHillClimb.json', JSON.stringify(results, null, 4))
}

// testGeneticAlgorithm()

function printAverages() {
    ['greedyLocalSearch', 'firstChoiceHillClimb', 'simulatedAnnealing', 'geneticAlgorithm'].forEach(method => {
        const file = fs.readFileSync(`../${method}.json`)

        const json = JSON.parse(file)

        let totalLapTime = 0
        let totalRunTime = 0

        for (let entry of json) {
            totalLapTime += entry.lapTime
            totalRunTime += entry.runTime
        }

        const lapTimes = json.map(x => x.lapTime)
        const runTimes = json.map(x => x.runTime)

        console.log(method)
        console.log(totalLapTime / 100, math.std(lapTimes), Math.min(...lapTimes), lapTimes.indexOf(Math.min(...lapTimes)), Math.max(...lapTimes), lapTimes.indexOf(Math.max(...lapTimes)))
        console.log(totalRunTime / 100, math.std(runTimes), Math.min(...runTimes), runTimes.indexOf(Math.min(...runTimes)), Math.max(...runTimes), runTimes.indexOf(Math.max(...runTimes)))
        console.log()
    })
}

// printAverages()

// testHillClimb()

// testFirstChoiceHillClimb()

exportPath()



function exportPath() {
    const track = getTrack(0)
    setTrack(track)

    const path = geneticAlgorithm()

    const json = path.exportJSON()

    fs.writeFileSync(`GA.json`, json)
}