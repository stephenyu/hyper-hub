#!/usr/bin/env bash
rm -rf build
tsc
cp src/runner.js bin/
