# bin/sh

cp -r .ccg  ~/.claude
cp -r agents  ~/.claude
cp -r skills   ~/.claude
cp -r commands ~/.claude

# Cursor backend bridge + live-window auto-close (see CURSOR-BACKEND.md).
# Installs PATH shims so `--backend codex` actually runs cursor-agent.
# Requires ~/.local/bin to precede the real codex (nvm) on PATH.
mkdir -p ~/.local/bin
cp bin/codex     ~/.local/bin/codex
cp bin/xdg-open  ~/.local/bin/xdg-open
chmod +x ~/.local/bin/codex ~/.local/bin/xdg-open
