#!/bin/sh
git fetch --all
git reset --hard origin/master
rm -rf /usr/share/nginx/html/file/kkliwu
\cp ./demo /usr/share/nginx/html/file/kklwu -rf