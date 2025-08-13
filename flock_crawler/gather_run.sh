#!/bin/bash

# Which days of month to run? (Leading zeros, e.g. "01" or "15".)
valid_days=("01" "14")

# Current day in DD format
today_day=$(date +%d)

# Check if today is in our valid days
run_today=false
for d in "${valid_days[@]}"; do
  if [ "$today_day" == "$d" ]; then
    run_today=true
    break
  fi
done

# If it's not one of the two days, just exit
if [ "$run_today" != true ]; then
  exit 0
fi

# Create a folder to track when we've run the command
track_dir="$HOME/.gather_tracker"
mkdir -p "$track_dir"

# Use YYYY-MM-DD as a simple daily stamp
today_stamp=$(date +%Y-%m-%d)
stamp_file="$track_dir/$today_stamp"

# If we've already run it today, exit
if [ -e "$stamp_file" ]; then
  exit 0
fi

# Run your command (node gather + alert)
# Adjust the node path if needed.
node ./gather_searches.js && osascript -e 'display alert "Just ran gather"'

# Mark that we've run it today
touch "$stamp_file"

exit 0

