# bin/sh

cp -r .ccg  ~/.claude
cp -r agents  ~/.claude
cp -r skills   ~/.claude
cp -r commands ~/.claude

# Claude backend bridge + live-window auto-close.
# Installs claude shim so `--backend claude` runs with `--model sonnet`.
# Requires ~/.local/bin to precede the real claude on PATH.
mkdir -p ~/.local/bin
rm -f ~/.local/bin/claude
cp bin/claude    ~/.local/bin/claude
cp bin/xdg-open  ~/.local/bin/xdg-open
chmod +x ~/.local/bin/claude ~/.local/bin/xdg-open
