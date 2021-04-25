# Path Nirvana Sinhala TTS Dataset
 
High Quality Sinhala dataset for Text to speech algorithm training - specially designed for deep learning algorithms

Currently there is a lack of publically availble tts datasets for sinhala language of enough length for Sinhala language. This dataset which has 3300 sentences with 7.5 hours of recordings will help mitigate some of these problems. These single voice recodings were done during the first quarter of 2021. Some effort has been taken to capture most of the rarely used syllables in the Sinhala language, specially those with Sanskrit and Pali origins. There could be some errors (recording not matching with prompt). Though should be rare, if you find some do feel free to contribute to this repository.

## How to use
- split-flac folder contains the original recordings in lossless flac compression format
- final folder contains the the same files in wav format which is the format most fequently used in machine learning algorithms
- file-mappings.json file contains the prompts, file name of the recording and the length of the recording for all 3300 recordings

See LICENSE.txt file for license information. GPL

If you have any questions or want to share your TTS training results contact me.

Copyright 2021 Path Nirvana Foundation (pathnirvana@gmail.com)
