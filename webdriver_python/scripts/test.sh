#!/bin/bash

cp ../javascript/wrapper/wrapper_bin.js src/data/

poetry run python -m unittest
