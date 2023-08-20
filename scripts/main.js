paper.install(window)

let tool

let mode
let done = false
let first = true
let lapTime
let bestLapTime
let canUpdate = true
let iteration = 0
let car
let carOffset = 0
let cars
let lines
let colorLines
let sectors

let hillClimbSelection
let temperature
let counter
let population

window.onload = () => {
    paper.setup('canvas')
    tool = new Tool()

    let track = getTrack(0)
    setTrack(track)
    track.strokeWidth = trackWidth
    track.strokeColor = 'white'
    track.shadowColor = 'grey'
    track.shadowBlur = 0.1

    const raceLine = track.clone()
    raceLine.strokeWidth = 0.02
    raceLine.strokeColor = 'red'
    raceLine.shadowBlur = 0
    raceLine.fullySelected = true


    lapTime = getLapTime(raceLine)
    bestLapTime = lapTime

    view.onFrame = (e) => {
        const lastLapTime = lapTime

        document.getElementById('lapTime').innerHTML = `lap time:&nbsp;&nbsp;${getLapTime(raceLine).toFixed(3)}`
        document.getElementById('duration').innerHTML = `iteration: ${iteration}`

        if (done) {
            if (!car) {
                sectors = getSectors(raceLine)

                const splitSize = raceLine.length / numSplits

                for (let i = 0; i < numSplits; i++) {
                    const path = new Path()

                    path.add(raceLine.getPointAt(i * splitSize))
                    path.add(raceLine.getPointAt((i + 1) * splitSize))
                    path.strokeWidth = 0.02
                    const vibrance = 1 - map((sectors[i].entryVelocity + sectors[i].exitVelocity) / 2, 10, 40, 0, 1)
                    path.strokeColor = new Color(255, vibrance, vibrance)
                }

                raceLine.strokeColor = 'white'

                car = new Path.Rectangle({
                    point: raceLine.getPointAt(0),
                    size: [0.05, 0.025]
                })
                car.fillColor = 'black'
                car.applyMatrix = false
            }
            
            const index = Math.floor((carOffset / raceLine.length) * numSplits)
        
            const speed = (sectors[index].entryVelocity + sectors[index].exitVelocity) / 2
        
            carOffset += speed * e.delta / trackMul
            if (carOffset >= raceLine.length) carOffset -= raceLine.length
        
            car.position = raceLine.getPointAt(carOffset)
            car.rotation = raceLine.getTangentAt(carOffset).angle
        }

        if (!mode || done || !canUpdate) return

        iteration++

        canUpdate = false

        if (mode === 'greedyLocalSearch') {
            lapTime = greedyLocalSearchStep(raceLine)
            if (lapTime >= lastLapTime) done = true
        }
        else if (mode === 'hillClimb') {
            if (first) hillClimbSelection = getInitialSelection(raceLine)

            const index = getRandom(hillClimbSelection)

            if (index === null) done = true
            else {
                lapTime = hillClimbStep(raceLine, index)
    
                if (lapTime < bestLapTime) {
                    bestLapTime = lapTime
                    hillClimbSelection = getInitialSelection(raceLine)
                }
            }
        }
        else if (mode === 'simulatedAnnealing') {
            if (first) {
                temperature = (0.2 / -Math.log(0.1)) * lapTime
                counter = 0
            }

            if (temperature > 0.01 || counter < 5) {
                lapTime = simulatedAnnealingStep(raceLine, temperature)

                if (lapTime < bestLapTime) {
                    bestLapTime = lapTime
                    counter = 0
                }
                else counter++
        
                temperature = temperature * coolingRate
            }
            else done = true
        }
        else if (mode === 'geneticAlgorithm') {
            if (first) {
                population = getInitialPopulation()
                sortPopulation()
                counter = 0
            }

            if (counter < 500) {
                geneticStep()

                raceLine.copyContent(population[0].path)
                lapTime = population[0].lapTime
                counter++
            }
            else {
                done = true
            }
        }
        else if (mode === 'showAll') {
            if (first) {
                for (let button of buttons) {
                    button.classList.add('colored')
                }

                raceLine.strokeColor = 'white'
                raceLine.fullySelected = false

                const GLSPath = importFile('./raceLines/greedyLocalSearch.json')
                GLSPath.strokeWidth = 0.006
                GLSPath.strokeColor = 'green'
                GLSPath.dashArray = [0.02, 0.02]
    
                const HCPath = importFile('./raceLines/firstChoiceHillClimb.json')
                HCPath.strokeWidth = 0.006
                HCPath.strokeColor = 'blue'
                HCPath.dashArray = [0.02, 0.02]
    
                const SAPath = importFile('./raceLines/simulatedAnnealing.json')
                SAPath.strokeWidth = 0.006
                SAPath.strokeColor = 'red'
                SAPath.dashArray = [0.02, 0.02]
    
                const GAPath = importFile('./raceLines/geneticAlgorithm.json')
                GAPath.strokeWidth = 0.006
                GAPath.strokeColor = 'orange'
                GAPath.dashArray = [0.02, 0.02]

                lines = [GLSPath, HCPath, SAPath, GAPath]

                cars = []
                            
                lines.forEach(x => {
                    console.log(x.strokeColor)

                    const c = {
                        carOffset: 0,
                        rect: new Path.Rectangle(x.getPointAt(0), [0.05, 0.025]),
                        path: x,
                        sectors: getSectors(x)
                    }

                    c.rect.applyMatrix = false
                    c.rect.angle = x.getTangentAt(0).angle
                    c.rect.fillColor = x.strokeColor

                    cars.push(c)
                })
            }

            cars.forEach(c => {
                const index = Math.floor((c.carOffset / c.path.length) * numSplits)
            
                const speed = (c.sectors[index].entryVelocity + c.sectors[index].exitVelocity) / 2
            
                c.carOffset += speed * e.delta / trackMul
                if (c.carOffset >= c.path.length) c.carOffset -= c.path.length
            
                c.rect.position = c.path.getPointAt(c.carOffset)
                c.rect.rotation = c.path.getTangentAt(c.carOffset).angle
            })

            iteration = 0
            // done = true
        }

        canUpdate = true
        first = false








        

    }

    view.onResize = () => {
        view.center = [0, 0]
    }

    view.scaling = 200
    view.center = [0, 0]

    tool.onMouseDrag = (event) => {
        // if (!mode || done) {
        //     for (let segment of path.segments) {
        //         if ((segment.point.subtract(event.point)).length < 0.1) {
        //             segment.point = event.point.clone()
        //             return
        //         }
        //     }
        // }

        var delta = event.downPoint.subtract(event.point)
        view.scrollBy(delta)
    }

    const random = document.getElementById('random')
    random.addEventListener('click', (e) => {
        track.copyContent(generateTrack())
        setTrack(track)

        raceLine.copyContent(track)
        raceLine.strokeWidth = 0.02
        raceLine.strokeColor = 'red'

        const showAll = document.getElementById('showAll')
        if (!showAll.classList.contains('inactive')) showAll.classList.add('inactive')
    })

    
    const buttons = document.getElementsByClassName('button')

    for (let button of buttons) {
        button.addEventListener('click', (e) => {
            if (!mode) {
                mode = e.target.id
                e.target.classList.add('selected')

                for (let button2 of buttons) {
                    button2.classList.remove('selectable')
                }

                random.classList.add('inactive')
            }
        })
    }




    window.addEventListener('wheel', (e) => {
        view.zoom += e.wheelDelta / 5
    })









}
