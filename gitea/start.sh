#!/usr/bin/env bash

# function custom_start() {
#     sleep 2
#     sed -i -e '/DISABLE_REGISTRATION/c\DISABLE_REGISTRATION = ${DISABLE_REGISTRATION}' $GITEA_CUSTOM/conf/app.ini
# }
# # Sync all files into GITEA_CUSTOM
# rsync --ignore-existing --exclude="app.ini" -av /custom/ $GITEA_CUSTOM/

# # Start gitea
# /bin/s6-svscan /etc/s6 && custom_start

echo $GITEA_CUSTOM/
if [ -f "$GITEA_CUSTOM/conf/app.ini" ]; then
    rsync --ignore-existing --exclude="app.ini" -av /custom/ $GITEA_CUSTOM/
    sed -i -e '/DISABLE_REGISTRATION/c\DISABLE_REGISTRATION = '${DISABLE_REGISTRATION}'' $GITEA_CUSTOM/conf/app.ini
else
    rsync -av /custom/ $GITEA_CUSTOM/
fi
/bin/s6-svscan /etc/s6
