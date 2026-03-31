#!/bin/bash
ROOT_PATH=$(dirname "$(readlink -f "$0")")
cd "$ROOT_PATH"

show_menu() {
    clear
    echo "======================================================"
    echo "                   SENTINEL PROBE"
    echo "======================================================"
    echo " 1) Setup System"
    echo " 2) Start Services"
    echo " 3) Stop All Services"
    echo " 4) Exit"
    echo "======================================================"
    echo -n "Select an option [1-4]: "
}

while true; do
    show_menu
    read choice
    case $choice in
        1)
            bash scripts/setup_linux.sh
            read -p "Press Enter to return to menu..."
            ;;
        2)
            bash scripts/start.sh
            read -p "Press Enter to return to menu..."
            ;;
        3)
            bash scripts/stop.sh
            read -p "Press Enter to return to menu..."
            ;;
        4)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid option. Please try again."
            sleep 1
            ;;
    esac
done