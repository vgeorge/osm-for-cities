#!/usr/bin/env bash

# Write custom files
rsync -av /custom/ $GITEA_CUSTOM/

# Grant read, write permissions, TODO: change 777
mkdir -p /data/gitea
chmod 777 -R /data/gitea/
chmod 777 -R $GITEA_CUSTOM/

# Replace values in $GITEA_CUSTOM/conf/app.ini
update_app_ini() {
    if [ -f "$GITEA_CUSTOM/conf/app.ini" ]; then
        while IFS='=' read -r line; do
            # Skip empty lines and comments
            if [[ "$line" =~ ^[[:space:]]*$ ]] || [[ "$line" =~ ^[[:space:]]*# ]]; then
                continue
            fi
            key=$(echo "$line" | cut -d'=' -f1)
            value=$(echo "$line" | cut -d'=' -f2-)
            sed -i "s/^\($key\s*=\s*\).*\$/\1$value/" "$GITEA_CUSTOM/conf/app.ini"
        done <"/config.ini"
    fi
}

# Start gitea
update_app_ini && /bin/s6-svscan /etc/s6
