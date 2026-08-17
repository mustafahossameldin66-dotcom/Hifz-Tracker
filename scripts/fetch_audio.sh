#!/usr/bin/env bash
set -euo pipefail

# DOWNLOAD_LIMIT يأتي من env (افتراضي 5 إن لم يحدد)
DOWNLOAD_LIMIT="${DOWNLOAD_LIMIT:-5}"

# قوائم الأهداف ومجلداتهم المحلية
targets=( "al-minshawi-mujawad" "al-husari" "Fares_Abbad_MP3_Quran" )
declare -A ids_to_dirs=( 
  ["al-minshawi-mujawad"]="alminshawi"
  ["al-husari"]="alhasiry"
  ["Fares_Abbad_MP3_Quran"]="fares_abbad"
)

for id in "${targets[@]}"; do
  dir="public/audio/${ids_to_dirs[$id]}"
  mkdir -p "$dir"
  echo "Fetching metadata for $id"
  meta_file="/tmp/${id}.json"
  curl -s "https://archive.org/metadata/${id}" -o "$meta_file"
  if [ ! -s "$meta_file" ]; then
    echo "No metadata for $id"
    continue
  fi

  jq -r '.files[] | select(.format != null and (.format | test("mp3"; "i"))) | .name' "$meta_file" \
    | grep -v -E 'sample|thumb|jpg|png' \
    | head -n "$DOWNLOAD_LIMIT" \
    | while IFS= read -r fname; do
        url="https://archive.org/download/${id}/$(echo "$fname" | sed -e 's/ /%20/g')"
        echo "Downloading $url"
        curl -s -L -o "$dir/$fname" "$url" || echo "Failed $url"
      done
done
