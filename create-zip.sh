#!/bin/bash

DIRECTORY_TO_ZIP="."
OUTPUT_ZIP_FILE="truffle-ai-chrome-ext.zip"

zip -r $OUTPUT_ZIP_FILE $DIRECTORY_TO_ZIP -x "*.git*" "*node_modules*" "*Taskfile.yml" "*create-zip.sh"
echo "Zip file $OUTPUT_ZIP_FILE created."