#!/bin/bash

SERVICE_NAME=d2c-weave-cluster-manager
SOURCE_DIR_NAME=/usr/lib/$SERVICE_NAME

if [[ -d "$SOURCE_DIR_NAME" ]]
then
  git -C $SOURCE_DIR_NAME pull
else
  git clone https://github.com/rollun-com/$SERVICE_NAME $SOURCE_DIR_NAME
fi

npm i --prefix $SOURCE_DIR_NAME

cp $SOURCE_DIR_NAME/systemd-service/$SERVICE_NAME.service /etc/systemd/system/$SERVICE_NAME.service

systemctl daemon-reload
service $SERVICE_NAME restart
systemctl $SERVICE_NAME enable
