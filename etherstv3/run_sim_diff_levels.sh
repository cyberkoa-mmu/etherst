#!/bin/bash

# Delay of seconds before each round of simulation to get Ganache get ready.
DELAY=60

TOTAL_NODES=60

BAD_PERCENT=20
GOOD_PERCENT=20
NORMAL_PERCENT=60

TRUST_AMOUNT=10
UNTRUST_AMOUNT=20


for i in {3..3}
do

   for j in 3
   do
      echo "Start simulation trust level = $i, untrust level = $j"
      env \
      ETHERST_TRUST_LEVEL=${i} \
      ETHERST_UNTRUST_LEVEL=${j} \
      ETHERST_TRUST_AMOUNT=${TRUST_AMOUNT} \
      ETHERST_UNTRUST_AMOUNT=${UNTRUST_AMOUNT} \
      TOTAL_NODES=${TOTAL_NODES} \
      BAD_PERCENT=${BAD_PERCENT} \
      GOOD_PERCENT=${GOOD_PERCENT} \
      NORMAL_PERCENT=${NORMAL_PERCENT} \
      truffle test test/sim_diff_levels.js
      echo "End simulation gracefully .. sleep for ${DELAY} seconds"
      sleep ${DELAY}
   done
done
