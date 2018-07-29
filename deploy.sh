#!/usr/bin/env bash

# exit on any failure
set -e

# usage:
usage() {
  cat 1>&2 <<EOF
./deploy production
./deploy development DB_NAME
EOF
  exit 0;
}
[ -z "$1" ] && usage

DJANGO_ENV=$1   # production/development
if [ "$DJANGO_ENV" == "production" ]; then
  REPO=tarjimly-matching-learnables
  PORT=9015
  args+=(--log-driver=journald --restart=always --cpuset-cpus=4,5)
elif [ "$DJANGO_ENV" == "development" ]; then
  [[ -z "$2" ]] && usage;
  REPO=dev-tarjimly-matching-learnables
  PORT=9016
  args+=(--env DB_NAME=$2 --cpuset-cpus=6)
else
  usage
fi

# stop and remove existing container
if [ -n "$(docker ps --all --quiet --filter name=^/${REPO}$)" ]; then
  docker stop ${REPO}
  docker rm ${REPO}
fi

# get APP_PATH (parent of config)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_PATH="$SCRIPT_DIR/"

# start container
set -x
args+=(
  --name=${REPO}
  --volume=${APP_PATH}:/app
  --workdir=/app
  --detach
  --publish 127.0.0.1:$PORT:8000
  --env DJANGO_ENV=${DJANGO_ENV}
  --env TERM=xterm-256color
  --tty
  python:3
  /bin/sh -c "pip3 install -r requirements.txt && (./manage.py runserver 0.0.0.0:8000 & ./cacher.py)"
)
docker run "${args[@]}"

echo "started $REPO"
# container logs
docker logs --follow ${REPO}
