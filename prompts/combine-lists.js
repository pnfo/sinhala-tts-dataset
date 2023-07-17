// remove duplicates and combine lists 

import fs from 'fs'
import {loadPrompts} from '../common_functions.js'
import lodash from 'lodash'

const rootFolder = 'sinhala-prompts', 
    textLengthToTimeRatio = 0.1035, // median from 11 test recordings from Ven mettananada 
    maxPromptLength = 13 / textLengthToTimeRatio

const syl1 = loadPrompts(`${rootFolder}/prompts-syl-1.txt`), 
    syl2 = loadPrompts(`${rootFolder}/prompts-syl-2.txt`), 
    old = {}, common = {}, all = {}

fs.readFileSync(`${rootFolder}/prompts-old.txt`, 'utf-8').split('\n')
    .map(line => line.trim().split('\t'))
    .filter(([index, prompt]) => prompt.length <= maxPromptLength)
    .forEach(([index, prompt]) => old[prompt] = {index})

fs.readFileSync(`${rootFolder}/prompts-common-edited.txt`, 'utf-8').split('\n')
    .map(line => line.trim().split('\t'))
    .forEach(([index, freq, score, prompt]) => common[prompt] = {index, freq, score})

let duplicates = 0
Object.entries({syl1, syl2, old, common}).forEach(([name, list]) => {
    console.log(`list ${name} has ${Object.keys(list).length} prompts`)
    Object.keys(list).forEach(prompt => {
        if (all[prompt]) duplicates++
        else {
            all[prompt] = {name}
        }
    })
})

fs.writeFileSync(`${rootFolder}/prompts-mettananda.txt`, Object.entries(all)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([text, {name}], i) => `${i + 1}\t${name}\n${text}`).join('\n\n'), 'utf-8')

const totalSeconds = Object.keys(all).reduce((total, str) => total + str.length, 0) * textLengthToTimeRatio
console.log(`final list: ${Object.keys(all).length}, duration: ${(totalSeconds / 3600).toFixed(1)} hours, duplicates: ${duplicates}`)

const oshadi = lodash.shuffle(Object.entries(old)).slice(0, 1000)
fs.writeFileSync(`${rootFolder}/prompts-oshadi.txt`, oshadi
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([text, {index}], i) => `${i + 1}\n${text}`).join('\n\n'), 'utf-8')