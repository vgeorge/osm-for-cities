#!/usr/bin/env bash

# Grant read, write permissions
chmod 700 /data/gitea
chmod 700 $GITEA_CUSTOM

if [ -f "$GITEA_CUSTOM/conf/app.ini" ]; then
    rsync --ignore-existing --exclude="app.ini" -av /custom/ $GITEA_CUSTOM/
    sed -i -e '/DISABLE_REGISTRATION/c\DISABLE_REGISTRATION = '${DISABLE_REGISTRATION}'' $GITEA_CUSTOM/conf/app.ini
else
    rsync -av /custom/ $GITEA_CUSTOM/
fi
/bin/s6-svscan /etc/s6
