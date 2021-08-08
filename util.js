function getRandomFloat(min, max) {
    return min + Math.random() * (max - min)
}

function getRandomInt(min, max) {
    return Math.floor(min + Math.random() * (max - min))
}

function map(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1)
}