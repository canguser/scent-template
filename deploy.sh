#!/bin/sh
git fetch --all
git reset --hard origin/v3.x
rm -rf /usr/share/nginx/html/file/kkliwu
\cp ./demo /usr/share/nginx/html/file/kklwu -rf