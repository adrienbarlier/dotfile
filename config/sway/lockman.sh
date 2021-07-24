#!/bin/sh
# Times the screen off and puts it to background
swayidle \
    timeout  5 'swaymsg "output * dpms off"' \
    resume 'swaymsg "output * dpms on"' &
# Locks the screen immediately
swaylock -e -f -L -t -i /home/adrien/Documents/darkg.png --indicator-radius 100 --indicator-thickness 25 --separator-color 00000000 --line-color 00000000 --line-clear-color 00000000 --line-ver-color 00000000 --line-wrong-color 00000000 --text-color 00000000 --text-clear-color 00000000 --text-ver-color 00000000 --text-wrong-color 00000000






# Kills last background task so idle timer doesn't keep running
kill %%
