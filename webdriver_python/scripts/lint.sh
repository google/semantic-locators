#!/bin/bash

poetry run pylint src test --rcfile=.pylintrc
