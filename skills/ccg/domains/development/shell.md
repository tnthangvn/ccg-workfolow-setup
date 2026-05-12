---
name: shell
description: Shell Script Development. Bash, automation, system administration. Use when the user mentions Shell, Bash, scripting, automation, or Linux commands.
---

# 📜 Talisman Grimoire · Shell


## Bash Basics

### Variables and Strings
```bash
#!/bin/bash

# Variables
name="Alice"
age=25
readonly PI=3.14

# String Operations
str="Hello World"
echo ${#str}           # Length: 11
echo ${str:0:5}        # Substring: Hello
echo ${str/World/Bash} # Replacement: Hello Bash
echo ${str,,}          # Lowercase: hello world
echo ${str^^}          # Uppercase: HELLO WORLD

# Default Values
echo ${var:-default}   # If var is unset, return default
echo ${var:=default}   # If var is unset, set to and return default
```

### Arrays
```bash
# Indexed Array
arr=("a" "b" "c")
echo ${arr[0]}         # First element
echo ${arr[@]}         # All elements
echo ${#arr[@]}        # Array length

# Iteration
for item in "${arr[@]}"; do
    echo "$item"
done

# Associative Array (Bash 4+)
declare -A map
map[name]="Alice"
map[age]=25
echo ${map[name]}
```

### Conditionals
```bash
# String Comparison
if [[ "$str1" == "$str2" ]]; then
    echo "Equal"
fi

# Numeric Comparison
if [[ $a -eq $b ]]; then echo "Equal"; fi
if [[ $a -lt $b ]]; then echo "Less"; fi
if [[ $a -gt $b ]]; then echo "Greater"; fi

# File Tests
if [[ -f "$file" ]]; then echo "File exists"; fi
if [[ -d "$dir" ]]; then echo "Directory exists"; fi
if [[ -r "$file" ]]; then echo "Readable"; fi
if [[ -w "$file" ]]; then echo "Writable"; fi
if [[ -x "$file" ]]; then echo "Executable"; fi

# Logical Operations
if [[ $a -gt 0 && $b -gt 0 ]]; then echo "Both positive"; fi
if [[ $a -gt 0 || $b -gt 0 ]]; then echo "At least one positive"; fi
```

### Loops
```bash
# for loop
for i in {1..5}; do
    echo $i
done

for file in *.txt; do
    echo "Processing $file"
done

# while loop
while read -r line; do
    echo "$line"
done < file.txt

# until loop
count=0
until [[ $count -ge 5 ]]; do
    echo $count
    ((count++))
done
```

### Functions
```bash
# Define Function
greet() {
    local name="$1"
    echo "Hello, $name!"
    return 0
}

# Call
greet "Alice"
result=$?  # Get return value

# Return String
get_date() {
    echo "$(date +%Y-%m-%d)"
}
today=$(get_date)
```

## Useful Script Templates

### Script with Arguments
```bash
#!/bin/bash
set -euo pipefail

usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS] <input>

Options:
    -o, --output FILE   Output file
    -v, --verbose       Verbose mode
    -h, --help          Show this help
EOF
    exit 1
}

# Default values
OUTPUT=""
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case "$1" in
        -o|--output)
            OUTPUT="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        -*)
            echo "Unknown option: $1"
            usage
            ;;
        *)
            INPUT="$1"
            shift
            ;;
    esac
done

# Check required arguments
if [[ -z "${INPUT:-}" ]]; then
    echo "Error: Input is required"
    usage
fi

# Main logic
main() {
    if $VERBOSE; then
        echo "Processing $INPUT..."
    fi
    # Processing logic
}

main
```

### Logging Functions
```bash
#!/bin/bash

# Color Definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

die() {
    log_error "$1"
    exit 1
}
```

### Error Handling
```bash
#!/bin/bash
set -euo pipefail

# Error Handling
trap 'echo "Error on line $LINENO"; exit 1' ERR

# Cleanup Function
cleanup() {
    rm -f "$TEMP_FILE"
}
trap cleanup EXIT

TEMP_FILE=$(mktemp)
```

## Common Command Combinations

### Text Processing
```bash
# grep - Search
grep -r "pattern" .
grep -v "exclude"          # Exclude
grep -i "case insensitive" # Ignore case
grep -E "regex"            # Regular expression

# sed - Replace
sed 's/old/new/g' file
sed -i 's/old/new/g' file  # Edit in place
sed -n '10,20p' file       # Print lines

# awk - Process
awk '{print $1}' file      # First column
awk -F: '{print $1}' /etc/passwd
awk 'NR>1 {sum+=$1} END {print sum}' file

# Combination
cat file | grep "pattern" | awk '{print $2}' | sort | uniq -c
```

### File Operations
```bash
# Find
find . -name "*.txt"
find . -type f -mtime -7   # Modified within 7 days
find . -size +100M         # Greater than 100M
find . -name "*.log" -exec rm {} \;

# Batch Rename
for f in *.txt; do
    mv "$f" "${f%.txt}.md"
done

# Batch Process
find . -name "*.py" | xargs grep "TODO"
```

### Networking
```bash
# curl
curl -s https://api.example.com/data
curl -X POST -H "Content-Type: application/json" -d '{"key":"value"}' URL
curl -o output.file URL

# Port Check
nc -zv host 80
ss -tulpn | grep :80
```

## Best Practices

```bash
#!/bin/bash
# 1. Use set options
set -euo pipefail

# 2. Quote variables
echo "$variable"

# 3. Use [[ ]] instead of [ ]
if [[ -f "$file" ]]; then

# 4. Use $() instead of backticks
result=$(command)

# 5. Use local to declare local variables
func() {
    local var="value"
}

# 6. Check if command exists
command -v git &>/dev/null || die "git not found"

# 7. Use shellcheck for linting
# shellcheck script.sh
```

---