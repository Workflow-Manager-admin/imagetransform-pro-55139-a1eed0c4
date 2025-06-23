#!/bin/bash
cd /home/kavia/workspace/code-generation/imagetransform-pro-55139-a1eed0c4/image_processing_backend_workspace/image_processing_backend
source venv/bin/activate
flake8 .
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi

