#!/bin/bash

DIALOG_CANCEL=1
DIALOG_ESC=255
HEIGHT=20
WIDTH=40

while true; do
  exec 3>&1
  selection=$(dialog \
    --backtitle "System Maintenance" \
    --title "Power Menu" \
    --clear \
    --cancel-label "Exit" \
    --menu "Please select:" $HEIGHT $WIDTH 4 \
    "1" "Power Off" \
    "2" "Reboot" \
    "3" "Exit Sway" \
    2>&1 1>&3)
  exit_status=$?
  exec 3>&-
  case $exit_status in
    $DIALOG_CANCEL)
      clear
      echo "Program terminated."
      exit
      ;;
    $DIALOG_ESC)
      clear
      echo "Program aborted." >&2
      exit 1
      ;;
  esac
  case $selection in
    0 )
      clear
      echo "Program terminated."
      ;;
    1 )
      sudo shutdown
      exit 0
      ;;
    2 )
      sudo reboot
      exit 0
      ;;
    3 )
      swaymsg exit
      exit 0
      ;;
  esac
done

