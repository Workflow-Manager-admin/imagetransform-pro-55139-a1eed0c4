#!/bin/bash
cd /home/kavia/workspace/code-generation/imagetransform-pro-55139-a1eed0c4/image_processing_frontend_workspace/image_processing_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

