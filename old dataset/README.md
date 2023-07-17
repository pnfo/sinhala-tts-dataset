# Path Nirvana Sinhala TTS Dataset
 
High Quality Sinhala dataset for Text to speech algorithm training - specially designed for deep learning algorithms

Currently there is a lack of publically availble tts datasets for sinhala language of enough length for Sinhala language. This dataset which has 3300 sentences with 7.5 hours of recordings will help mitigate some of these problems. These single voice recodings were done during the first quarter of 2021. Some effort has been taken to capture most of the rarely used syllables in the Sinhala language, specially those with Sanskrit and Pali origins. There could be some errors (recording not matching with prompt). Though should be rare, if you find some do feel free to contribute to this repository.

## How to use
- `split-flac` folder contains the original recordings in lossless flac compression format
- `wav` folder contains the the same files in wav format which is the format most fequently used in machine learning algorithms. Sample Rate 22050Hz and 16-bit PCM encoded similar to the `ljspeech` dataset
- `file-mappings.json` file contains the prompts, file names and the lengths of the recording for all 3300 recordings

## Stats
- Number of Recordings: 3300
- Total Length: 7 hours 5 minutes
- Total number of Characters: 293,104 sinhala or 339,992 roman
- Maximum Length: 33.4 seconds
- Minumum Length: 1 seconds
- Number of Unique Characters: 85 sinhala or 53 roman
- List of Roman Characters: ` !'(),-.:;?abcdefghijklmnoprstuvyæñāēīōśşūǣḍḥḷṁṅṇṉṛṝṭ`
- Silences have been removed from both the beginning and the end of the recordings
- Silences in the middle of the recording clipped to 0.75 seconds

## metadata.csv
- contains a subset of the recordings which are less than 16 seconds long in the `ljspeech` format

## filtered dataset less than 16 seconds
- For some deep learning TTS models longer recordings can cause problems. If you remove the longest 100 or so recordings from the dataset the longest length would be just 16 seconds.
- Number of Recordings: 3225
- Total Length: 6 hours 41 minutes
- Total number of Characters: 322,756 roman

See LICENSE.txt file for license information. GPL

If you have any questions or want to share your TTS training results contact me.

Copyright 2021 Path Nirvana Foundation (pathnirvana@gmail.com)
