# Path Nirvana Sinhala TTS Dataset
 
High Quality Multi Speaker Sinhala dataset for Text to speech algorithm training - specially designed for deep learning algorithms

Currently there is a lack of publically availble tts datasets for sinhala language of enough length for Sinhala language. This dataset which has 6248 sentences with 13.8 hours of recordings will help mitigate some of these problems. These multi speaker voice recodings were done during the second quarter of 2023. Some effort has been taken to capture most of the rarely used syllables in the Sinhala language, specially those with Sanskrit and Pali origins. There could be some errors (recording not matching with prompt). Though should be rare, if you find some do feel free to contribute to this repository.

### There are two speakers
- Male voice Ven. Mettananda - around 5200 voice clips - 11.8 hours in length
- Female voice Mrs. Oshadi - around 1000 voice clips - 2 hours in length

### DEMO
I have trained [a VITS TTS model](https://github.com/pathnirvana/coqui-tts) using the dataset and samples from the synthesis are now available [here](https://pnfo.github.io/sinhala-tts-dataset/)

## How to use
- You can download the compressed tar file from the Releases which contains the `wavs` folder with all the audio clips

## Stats
- Number of Recordings: 6248
- Total Length: 13.7 hours
- Maximum Length: 15 seconds
- Minumum Length: 2 seconds
- Number of Unique Characters: 54 roman
- List of Roman Characters: ` !'(),-.:;=?abcdefghijklmnoprstuvyæñāēīōśşūǣḍḥḷṁṅṇṉṛṝṭ`
- Silences have been removed from both the beginning and the end of the recordings
- Sample Rate 22050Hz and 16-bit PCM encoded similar to the `ljspeech` dataset

### Output from the create-dataset script for the two releases
#### v2.0
```bash
Total labels => count: 6449, length: 13.9 hours, average length: 7.78
Outliers labels => count: 6399, length: 13.8 hours, average length: 7.78
Used labels => count: 6248, length: 13.7 hours, average length: 7.89
characters=" !'(),-.:;=?abcdefghijklmnoprstuvyæñāēīōśşūǣḍḥḷṁṅṇṉṛṝṭ"
characters=" !'(),-.:;=?[]ංඃඅආඇඈඉඊඋඌඍඑඒඓඔඕඖකඛගඝඞඟචඡජඣඤඥටඨඩඪණඬතථදධනඳපඵබභමඹයරලවශෂසහළෆ්ාැෑිීුූෘෙේෛොෝෞෲ‍‘’“”"
```
#### v2.1
```bash
Total labels => count: 6449, length: 13.9 hours, average length: 7.78
Outliers labels => count: 6399, length: 13.8 hours, average length: 7.78
Used labels => count: 6386, length: 13.8 hours, average length: 7.77
characters=" !'(),-.:;=?abcdefghijklmnoprstuvyæñāēīōśşūǣḍḥḷṁṅṇṉṛṝṭ"
characters=" !'(),-.:;=?[]ංඃඅආඇඈඉඊඋඌඍඑඒඓඔඕඖකඛගඝඞඟචඡජඣඤඥටඨඩඪණඬතථදධනඳපඵබභමඹයරලවශෂසහළෆ්ාැෑිීුූෘෙේෛොෝෞෲ‍‘’“”"
```

## metadata.csv
- contains a subset of the recordings which are less than 15 seconds long in the `ljspeech` format

The first version of this dataset contained around 7 hours of speech from a single speaker. It has since been moved to the `old dataset` folder

See LICENSE.txt file for license information. GPL

If you have any questions or want to share your TTS training results contact me.

Copyright 2021 Path Nirvana Foundation (path.nirvana@gmail.com)
