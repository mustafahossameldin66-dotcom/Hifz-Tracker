#!/usr/bin/env bash
set -euo pipefail

# DOWNLOAD_LIMIT يأتي من env (افتراضي 5 إن لم يُحدد)
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

  # جلب الميتاداتا (استمر حتى لو فشل، تابع للهدف التالي)
  if ! curl -s "https://archive.org/metadata/${id}" -o "$meta_file"; then
    echo "Failed to fetch metadata for $id — skipping"
    continue
  fi

  if [ ! -s "$meta_file" ]; then
    echo "No metadata for $id — skipping"
    continue
  fi

  # خزن أسماء الملفات في مصفوفة لتجنّب مشاكل الـpipe/broken pipe
  mapfile -t files < <( jq -r '.files[] | select(.format != null and (.format | test("mp3"; "i"))) | .name' "$meta_file" 2>/dev/null \
                      | grep -v -E 'sample|thumb|jpg|png' \
                      | head -n "$DOWNLOAD_LIMIT" )

  if [ ${#files[@]} -eq 0 ]; then
    echo "No MP3 files found for $id"
    continue
  fi

  for fname in "${files[@]}"; do
    # بناء رابط آمن للمسافات/حروف خاصة
    encoded=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$fname")
    url="https://archive.org/download/${id}/${encoded}"
    dest="$dir/$fname"
    echo "Downloading $url"
    # curl -f يجعلنا نعرف لو كانت استجابة http خطأ (4xx/5xx)
    if curl -s -L -f -o "$dest" "$url"; then
      echo "Saved: $dest"
    else
      echo "Failed to download: $url (will continue)"
      # لا نخرج من السكربت، نواصل الملفات التالية
      rm -f "$dest" 2>/dev/null || true
    fi
  done
done
