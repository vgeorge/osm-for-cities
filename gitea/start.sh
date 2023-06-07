#!/usr/bin/env bash

if [ -f "$GITEA_CUSTOM/conf/app.ini" ]; then
    rsync --ignore-existing --exclude="app.ini" -av /custom/ $GITEA_CUSTOM/
    sed -i -e '/DISABLE_REGISTRATION/c\DISABLE_REGISTRATION = '${DISABLE_REGISTRATION}'' $GITEA_CUSTOM/conf/app.ini
else
    rsync -av /custom/ $GITEA_CUSTOM/
fi

# Grant read, write permissions, TODO, change 777 
mkdir -p /data/gitea
chmod 777 -R /data/gitea/
chmod 777 -R $GITEA_CUSTOM/

# Start gitea
/bin/s6-svscan /etc/s6
