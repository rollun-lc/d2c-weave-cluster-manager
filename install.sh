#!/bin/bash

SERVICE_NAME="d2c-weave-cluster-manager"
SOURCE_DIR_NAME="/usr/lib/$SERVICE_NAME"

# log
cat env > /root/test.env

# clone/pull repo
if [[ -d "$SOURCE_DIR_NAME" ]]
then
  git -C $SOURCE_DIR_NAME pull
else
  git clone https://github.com/rollun-com/$SERVICE_NAME $SOURCE_DIR_NAME
fi

# setup env vars

cat > "$SOURCE_DIR_NAME"/.env << EOL
D2C_USER=$D2C_USER
D2C_PASS=$D2C_PASS
EOL

# update libs
npm i --prefix $SOURCE_DIR_NAME

# update systemd service
cp $SOURCE_DIR_NAME/systemd-service/$SERVICE_NAME.service /etc/systemd/system/$SERVICE_NAME.service

systemctl daemon-reload
service $SERVICE_NAME restart
systemctl enable $SERVICE_NAME
