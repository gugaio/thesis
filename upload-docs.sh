#!/usr/bin/env bash

SESSION_ID="$1"
DIRECTORY="$2"
API_URL="http://localhost:4000"

if [ -z "$SESSION_ID" ] || [ -z "$DIRECTORY" ]; then
  echo "Usage: ./upload-all.sh <session_id> <directory>"
  exit 1
fi

if [ ! -d "$DIRECTORY" ]; then
  echo "Directory not found: $DIRECTORY"
  exit 1
fi

echo "Uploading all files from $DIRECTORY to session $SESSION_ID"
echo "------------------------------------------------------------"

find "$DIRECTORY" -type f | while read -r FILE; do
  echo "Uploading: $FILE"

  API_URL=$API_URL node apps/thesis-cli/dist/index.js \
    upload-doc \
    --session "$SESSION_ID" \
    --file "$FILE"

  echo "--------------------------------------------"
done

echo "Done."
