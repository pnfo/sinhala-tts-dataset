/**
 * read the original flac files output from audacity macro
 * rename files, remove some silences, convert to wav and save (only if not already present in the output folder)
 * compute statistics and find outliers
 * crean prompts (remove zwj) and make train/val files
 */
'use strict'

const fs = require('fs')
const path = require('path')
//const sox = require('./../sox-runner')
const exec = require('child_process').exec
const PromisePool = require('es6-promise-pool')
const jsb = require('json-beautify')
const {sinhalaToRomanConvert} = require('./roman_char_mapping')

const datasetFilterDuration = 100 // longer recordings than this will be omitted from the dataset

const soundInputFolder = path.join(__dirname, 'split-flac')
const soundFileRegex = /^(\d+)-(\d+)-(\d+)\.flac$/, newSoundRegex = /^sin_\d+_(\d+)\.wav$/
const soundOutputFolder = path.join(__dirname, 'wavs')
const promptsFile = path.join(__dirname, 'prompts.txt'), prompts = {}
fs.readFileSync(promptsFile, 'utf-8').split(/\r?\n+/).map(l => l.split('\t'))
    .forEach(([pi, ptext]) => {
        // TODO breakout this to function that can be used for all tts input text with other normalizations
        ptext = ptext.replace(/\[\{/g, '(') // only the normal bracket is supported
        ptext = ptext.replace(/\]\}/g, ')')
        ptext = ptext.replace(/["“”‘’]/g, "'") // all quotes to single straight quotes
        ptext = ptext.replace(/\s+/g, ' ') // collapse whitespace
        const sinhala = ptext.replace(/\u200d/g, '') // remove yansa, rakar, bandi
        const roman = sinhalaToRomanConvert(sinhala)
        prompts[Number(pi)] = {sinhala, roman}
    })

const fileGroups = {}, fileMapping = {}
fs.readdirSync(soundInputFolder).filter(fn => soundFileRegex.test(fn)).forEach(fn => {
    const match = soundFileRegex.exec(fn), [start, end, fi] = match.slice(1).map(p => Number(p)), group = fileGroups[start]
    if (!group) {
        fileGroups[start] = { start, end, files: { [fi]: fn }}
    } else {
        if (group.end != end || group.files[fi]) console.error(`error in file ${fn}. current data ${JSON.stringify(group)}`)
        group.files[fi] = fn
    }
})
Object.entries(fileGroups).forEach(([start, group]) => {
    if (!group.files[0] && !group.files[1]) console.error(`group ${start}, first file is missing `)
    const firstInd = group.files[0] ? 0 : 1
    Object.entries(group.files).forEach(([fi, oldfn]) => {
        const promptInd = Number(start) + Number(fi) - firstInd
        if (promptInd > group.end || fileMapping[promptInd]) console.error(`prompt ind ${promptInd} already exists or out of range ${group.end}`)
        const {sinhala, roman} = prompts[promptInd]
        fileMapping[promptInd] = { 
            oldfn, 
            newfn: 'sin_01_' + String(promptInd).padStart(5, '0') + '.wav', 
            sinhala, roman,
        }
    })
})

console.log(`number of files checked ${Object.keys(fileMapping).length}`)

const soxPath = 'sox' // path.join(__dirname, '../sox-14.4.2/sox.exe')
const existingFiles = fs.readdirSync(soundOutputFolder), reprocessAll = false
const convertCommands = Object.values(fileMapping).filter(({newfn}) => existingFiles.indexOf(newfn) < 0 || reprocessAll)
    .map(({oldfn, newfn}) => {
        const inputFile = path.join(soundInputFolder, oldfn), outputFile = path.join(soundOutputFolder, newfn)
        return `"${soxPath}" "${inputFile}" --rate 22050 "${outputFile}" silence -l 1 0.1 1% -1 1.0 1%`
    })

const makeExecTasks = function * (cmdAr) {
    for (let ind = 0; ind < cmdAr.length; ind++) { 
        yield new Promise(function (resolve, reject) {
            exec(cmdAr[ind], (error, stdout, stderr) => {
                if (error) reject([ind, error])
                else resolve([ind, stdout || stderr])
            })
        })
    }
}

async function processAudio() {
    const pool = new PromisePool(makeExecTasks(convertCommands), 5)
    await pool.start()
    console.log(`converted ${convertCommands.length} audio files to wav`)

    // get lengths of the existing files and check for outliers (including the new files created just now)
    const newOutputFiles = fs.readdirSync(soundOutputFolder).filter(f => newSoundRegex.test(f))
    const infoCommands = newOutputFiles.map(newfn => `"${soxPath}" --i -D "${path.join(soundOutputFolder, newfn)}"`)
    const infoPool = new PromisePool(makeExecTasks(infoCommands), 5)
    infoPool.addEventListener('fulfilled', e => {
        const [ind, audioLen] = e.data.result
        const [_1, pi] = newSoundRegex.exec(newOutputFiles[ind]), promptInd = Number(pi)
        fileMapping[promptInd].duration = Number(audioLen.trim())
    })
    await infoPool.start()
    console.log(`got duration of ${infoCommands.length} audio files from wav`)

    // write complete info about files and legths
    fs.writeFileSync(path.join(__dirname, 'file-mapping.json'), jsb(fileMapping, null, '\t', 100), 'utf-8')
    
    fs.writeFileSync(path.join(__dirname, 'file-length-ratios.tsv'),
        'index\tduration\ttext_length\tratio\n' +
        Object.entries(fileMapping)
            .map(([pi, {duration, roman:text}]) => [pi, duration, text.length, (duration - 0.5) / text.length]) // remove  the silence added at the end
            //.sort((a, b) => b[3] - a[3]) // can be sorted later in excel
            .map(vals => vals.join('\t'))
            .join('\n'),
        'utf-8')

    const chars = {}
    Object.values(fileMapping).forEach(({roman:text}) => {
        text.split('').map(c => chars[c] = chars[c] ? chars[c] + 1 : 1)
    })
    console.log(`num chars: ${Object.keys(chars).length}, list of chars: ${Object.keys(chars).sort().join('')}`)
    fs.writeFileSync(path.join(__dirname, 'characters.tsv'),
        'char\tcount\n' + Object.entries(chars).map(pair => pair.join('\t')).join('\n'), 'utf-8')

    const filtered = Object.values(fileMapping).filter(({duration}) => duration < datasetFilterDuration)
    fs.writeFileSync(path.join(__dirname, 'metadata.csv'),
        filtered.map(({newfn, sinhala, roman}) => ([newfn.split('.')[0], sinhala, roman]).join('|')).join('\n'),
        'utf-8'
    )
    const stats = {count: 0, duration: 0, characters: 0, min: 100, max: 0}
    filtered.forEach(({roman:text, duration}) => {
        stats.count++
        stats.duration += duration
        stats.characters += text.length
        stats.max = Math.max(duration, stats.max)
        stats.min = Math.min(duration, stats.min)
    })
    console.log(stats)
}

async function wrapper(){
    try {
        await processAudio()
    } catch(e) {
        console.log(e)
    }    
}
wrapper()