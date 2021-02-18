const fs = require('fs')
const path = require('path')

// open the new input text files - split by the the 
// open the old prompt file
// find duplicates, numbers, convert quotes, check length etc and output new prompts file

const newInputFiles = ['input-1.txt']
const outputFile = 'prompts.txt', newOutputFile = 'new-prompts.txt'
    maxLength = 300, allowedCharRegex = /[^\u0d82-\u0ddf\u0df2\u200d!'\(\),\-\.:;\? ]/g // punctuation copied from symbols.py in mozilla tts

const newLines = [], oldPrompts = fs.readFileSync(path.join(__dirname, outputFile), 'utf-8').split(/\r?\n+/).map(l => l.split('\t'))
console.log(oldPrompts.filter(p => isNaN(p[0]) || !p[1])) // error check
const numberingStart = Math.max(...oldPrompts.map(p => Number(p[0]))) + 1

newInputFiles.forEach(file => {
    const lines = fs.readFileSync(path.join(__dirname, file), 'utf-8').split(/\r?\n+/).map(l => l.trim()).filter(l => l)  // not split by . anymore
    newLines.push(...lines)
})
console.log(`processing ${newLines.length} new lines. new numbering start from ${numberingStart}`)

let numAdded = 0
newLines.forEach(l => {
    l = l.replace(/[“”‘’]/g, "'")
    l = l.replace(/ර\u0dca\u200d/g, 'ර\u0dca') // get rid of rephaya - make it easier to pronounce for voice artists
    l = l.replace(/[\s\u00a0]+/g, ' ') // non breaking space 00a0
    if (/[\u0d82-\u0ddf\u0df2]$/.test(l)) l += '.' // add punctuation if not present
    if (oldPrompts.findIndex(p => p[1] == l) >= 0) { 
        console.error(`already exists: ${l}`)
        return
    }
    if (allowedCharRegex.test(l)) console.error(`line has invalid characters: ${l}`)
    if (l.length > maxLength) console.error(`line length ${l.length} is greater than max allowed: ${l}`)
    oldPrompts.push([numberingStart + numAdded++, l])
})

fs.writeFileSync(path.join(__dirname, newOutputFile), oldPrompts.map(p => p.join('\t')).join('\n'), 'utf-8')
console.log(`wrote new prompts file with ${oldPrompts.length} entries. Newly added: ${numAdded}`)