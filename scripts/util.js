function getRandomFloat(min, max) {
    return min + Math.random() * (max - min)
}

function getRandomInt(min, max) {
    return Math.floor(min + Math.random() * (max - min))
}

function map(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1)
}

function loadFile(filePath) {
    let result = null
    const xmlhttp = new XMLHttpRequest()
    xmlhttp.open("GET", filePath, false)
    xmlhttp.send()

    if (xmlhttp.status==200) {
        result = xmlhttp.responseText;
    }

    return result
}