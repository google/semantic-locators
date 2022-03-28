#!/bin/bash

cp ../javascript/wrapper/wrapper_bin.js src/data/

poetry run python -m unittest
poetry publish --build -u semantic-locators -p $1
