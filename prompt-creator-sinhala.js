/*
get the syllables list from the bjt list of words
split all the paragraphs longer than given length to sentences and discard any longer than a given length
only add a sentence to the selected list only if it adds a some syllables not already in the selected list
*/
import fs from 'fs';
import path from 'path';
import { normalizeText } from './common_functions.js';
//import {sinhalaToRomanConvert} from '@pnfo/singlish-search/roman_convert.js'
import jsb from 'json-beautify';
import lodash from 'lodash';

const alPat = '(?:[ක-ෆ]\u0dca(?:[රයව][ා-ෟ]?)?)';
// basic - has the kaka issue - where the second ka is pronaunced differently
const s1Regex = new RegExp(`(?:[ක-ෆ]|[අ-ඖ])[ා-ෟ]?(${alPat}|ං|ඃ)*`, 'g');
// capture successive consos without following vowels in the same match
//const s2Regex = new RegExp(`(?:[ක-ෆ]|[අආඉඊඋඌඑඔ])([ක-ෆ]+(?![ා-ො\u0DCA])|[ා-ො])?(${alPat}|ං)*`, 'g');
const startReg = new RegExp(`^${alPat}+(ං|ඃ)?`);

function breakSyllables(word) {
    let match, syls = {}
    const word2 = word.replace(startReg, (m) => {
        syls[m] = 1;
        return '';
    });
    while ((match = s1Regex.exec(word2)) !== null) { // get all the matches
        syls[match[0]] = (syls[match[0]] || 0) + 1;
    }
    return Object.entries(syls);
}

function splitEntries(entries) {
    const prompts = []
    entries.forEach(({text, type}) => {
        if (text.length < maxPromptLength) {
            prompts.push({text, type})
        } else {
            prompts.push(...text.split('.').map(p => ({text: p.trim() + '.', type}))
                .filter(({text}) => text.length > minSplitPromptLength && text.length < maxPromptLength))
        }
    })
    promptsConsidered += prompts.length
    return prompts
}

function extractPrompts(entries, file) {
    lodash.shuffle(splitEntries(entries)).forEach(({type, text}) => {
        text = normalizeText(text, type)
        if (selected[text] || selectedFiles[file] >= maxPromptsPerFile) return
        const TSY = breakSyllables(text)
        const newSyls = TSY.filter(([s, c]) => !syls.select[s]), neededSyls = TSY.filter(([s, c]) => syls.need[s])
        if ((newSyls.length >= 2 || neededSyls.length >= 1) && TSY.length >= 10) {
            selected[text] = {type, newSyls: newSyls.length, length: text.length, file}
            TSY.forEach(([s, c]) => { 
                syls.select[s] = (syls.select[s] || 0) + c // add to selected syls
                delete syls.need[s]
            }) 
            countSelected++
            timeSelected += text.length * textLengthToTimeRatio
            selectedFiles[file] = (selectedFiles[file] || 0) + 1
            selectedTypes[type] = (selectedTypes[type] || 0) + 1
        }
    })
    entriesConsidered += entries.length
}

let allPrompts = {}
function extractCommon(entries, file) {
    splitEntries(entries).forEach(({type, text}) => {
        text = normalizeText(text, type)
        if (text.length > 5) allPrompts[text] = (allPrompts[text] || 0) + 1
    })
}
const sortLength = ([text, count]) => count >= 5 ? count + Math.round(text.length / 5) : count // prefer long sentences that are common

const minSplitPromptLength = 10, maxTimeNeeded = 3600 * 20, 
    textLengthToTimeRatio = 0.1035, // median from 11 test recordings from Ven mettananada 
    maxPromptLength = 13 / textLengthToTimeRatio, maxPromptsPerFile = 50, // there are around 191 files
    textInputFolder = '/Users/janaka/node/tipitaka.lk/public/static/text', datasetName = 'syl-2'
console.log(`max prompt length ${maxPromptLength}, dataset name ${datasetName}`)
const selected = {}, selectedFiles = {}, selectedTypes = {}
let countSelected = 0, timeSelected = 0, filesUsed = 0, promptsConsidered = 0, entriesConsidered = 0
const allSyls = JSON.parse(fs.readFileSync(`sinhala-prompts/all-syls.json`, 'utf-8'))
const syls = JSON.parse(fs.readFileSync(`sinhala-prompts/syls-syl-1.json`, 'utf-8'))  //{select: {}, need: {}} //

const files = fs.readdirSync(textInputFolder).filter(f => f.endsWith('json') && !f.startsWith('atta') && !f.startsWith('anya'))
lodash.shuffle(files).forEach(file => {
    if (timeSelected > maxTimeNeeded) return
    const entries = JSON.parse(fs.readFileSync(path.join(textInputFolder, file), 'utf-8')).pages.map(page => page.sinh.entries).flat()
    extractPrompts(entries, file)
    //extractCommon(entries, file)
    filesUsed++
    console.log(`${countSelected} prompts with length ${Math.round(timeSelected)}. processed ${file}.`)
})

syls.need = Object.fromEntries(Object.entries(allSyls).filter(([s, c]) => !syls.select[s] && c >= 2))
fs.writeFileSync(`sinhala-prompts/syls-${datasetName}.json`, jsb(syls, null, '\t', 100), 'utf-8')
fs.writeFileSync(`sinhala-prompts/prompts-${datasetName}.txt`, Object.entries(selected)
    .sort((a, b) => a[1].type.localeCompare(b[1].type))
    .map(([text, {type, file, length}], i) => `${i + 1}\t${type}\t${file.slice(0, -5)}\t${length}\n${text.replace(/ x /g, '\n')}`).join('\n\n'), 'utf-8')

// fs.writeFileSync(`sinhala-prompts/prompts-common.txt`, Object.entries(allPrompts)
//     .sort((a, b) => sortLength(b) - sortLength(a)).slice(0, 1000).sort((a, b) => a[0].localeCompare(b[0]))
//     .map(([text, count], i) => [i, count, sortLength([text, count]), text].join('\t')).join('\n'), 'utf-8')

console.log(`number of syllables ${Object.keys(syls.select).length}, needed ${Object.keys(syls.need).length}, files used ${filesUsed}`)
console.log(`prompts considered ${promptsConsidered}, entries considered ${entriesConsidered}`)
console.log(selectedTypes)
