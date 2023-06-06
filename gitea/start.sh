#!/usr/bin/env bash
set -x
function custom_start() {
    sleep 5
    sed -i -e '/DISABLE_REGISTRATION/c\DISABLE_REGISTRATION = ${DISABLE_REGISTRATION}' $GITEA_CUSTOM/conf/app.ini
}

# Move files to GITEA_CUSTOM dir
mv -f /custom/* $GITEA_CUSTOM

# start the gitea app
/bin/s6-svscan /etc/s6 && custom_start
