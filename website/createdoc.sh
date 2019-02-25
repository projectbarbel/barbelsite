#!/bin/sh

echo "ID?"
read ID
echo "TITLE?"
read TITLE
echo "LABEL?"
read LABEL

cat  << EOF > ../docs/$ID.md
---
id: $ID
title: $TITLE
sidebar_label: $LABEL
---
EOF
