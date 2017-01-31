#!/bin/bash
set -e

echo "Clone repo and get gh-pages branch"
git clone https://github.com/AndriusKv/veery.git gh-pages
cd ./gh-pages
git checkout gh-pages
cd ..

echo "Copy build to gh-pages"
rm -rf ./gh-pages/**/*
cp -r ./dist/. ./gh-pages

cd ./gh-pages
git config --global user.name "Travis CI"
git config --global user.email "ikandrius@gmail.com"

# If there are no changes then just bail.
if [[ -z $(git diff --exit-code) ]]; then
    echo "Nothing to commit"
    echo "Exiting"
    exit 0
fi

echo "Commit to gh-pages"
git add .
git commit -m "Deploy to GitHub Pages"

# Force push from the current repo's master branch to the remote repo's gh-pages branch.
git push --force "https://${GH_TOKEN}@${GH_REF}" gh-pages > /dev/null 2>&1
