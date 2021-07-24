#!/bin/dash

percent=$(ddcutil  -t --bus 5  --sleep-multiplier .1 getvcp 10 | cut -c10-11)

echo {\"percentage\": $percent}
