#!/bin/bash

clear

if [ "$1" = "-r" ]; then
truffle migrate --reset
fi

truffle test test/sim_attack.js
