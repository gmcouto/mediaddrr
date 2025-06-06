#!/bin/sh
set -e

# Set defaults if not provided
: "${PUID:=1000}"
: "${PGID:=1000}"
: "${UMASK:=002}"

# Get the user name for the given PUID
USER_NAME=$(echo $(getent passwd "$PUID") | cut -d: -f1)

# Try to remove user if exists, skip if it fails (suppress output)
deluser $USER_NAME >/dev/null 2>&1 || true

# Get the group name for the given PGID
GROUP_NAME=$(echo $(getent group $PGID) | cut -d: -f1)

# Try to remove group if exists, skip if it fails (suppress output)
(delgroup $GROUP_NAME >/dev/null 2>&1 || true)

# Try to create group with desired GID, skip if it fails (group may already exist, suppress output)
addgroup -g "$PGID" "appgroup" >/dev/null 2>&1 || true

# Create user with specified UID and assign to group (suppress output)
adduser -G appgroup -D -u $PUID appuser >/dev/null 2>&1 || true

# Set ownership
chown -R "$PUID":"$PGID" /app/config
chmod -R a+rwx /app/config

# Set umask and run the app as appuser
umask "$UMASK"

# Run the application as appuser
which su-exec || echo "su-exec not found!"

exec su-exec appuser "$@" 