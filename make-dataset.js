/**
 * read the original flac files output from audacity macro
 * rename files, remove some silences, convert to wav and save
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

const soundInputFolder = path.join(__dirname, 'split-flac')
const soundFileRegex = /^(\d+)-(\d+)-(\d+)\.flac$/, newSoundRegex = /^sin_\d+_(\d+)\.wav$/
const soundOutputFolder = path.join(__dirname, 'final/wavs')
const promptsFile = path.join(__dirname, 'prompts.txt'), prompts = {}
fs.readFileSync(promptsFile, 'utf-8').split(/\r?\n+/).map(l => l.split('\t')).forEach(([pi, ptext]) => prompts[Number(pi)] = ptext.replace(/\u200d/g, ''))

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
        fileMapping[promptInd] = { oldfn, newfn: 'sin_01_' + String(promptInd).padStart(5, '0') + '.wav', text: prompts[promptInd] }
    })
})

console.log(`number of files checked ${Object.keys(fileMapping).length}`)

const soxPath = path.join(__dirname, '../sox-14.4.2/sox.exe')
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
        Object.entries(fileMapping)
            .map(([pi, {duration, text}]) => [pi, (duration - 0.5) / text.length]) // remove  the silence added at the end
            .sort((a, b) => b[1] - a[1])
            .map(vals => vals.join('\t'))
            .join('\n'),
        'utf-8')
}
processAudio()