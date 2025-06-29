#!/bin/bash
cd /home/kavia/workspace/code-generation/notemaster-95080-aa8b63bc/notes_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

