#!/bin/bash

# GitHub automation script
# This script automates pushing to GitHub using stored secrets

set -e  # Exit on error

# Load variables from secrets
GITHUB_USERNAME=$GITHUB_USERNAME
GITHUB_TOKEN=$GITHUB_TOKEN
REPO_NAME="atlasgrowth"

# Check if secrets are available
if [ -z "$GITHUB_USERNAME" ] || [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_USERNAME or GITHUB_TOKEN not set"
  exit 1
fi

# Check if repository exists
if ! curl -s -u $GITHUB_USERNAME:$GITHUB_TOKEN https://api.github.com/repos/$GITHUB_USERNAME/$REPO_NAME | grep -q "full_name"; then
  echo "Repository $REPO_NAME does not exist. Creating it..."
  curl -u $GITHUB_USERNAME:$GITHUB_TOKEN https://api.github.com/user/repos -d "{\"name\":\"$REPO_NAME\"}"
fi

# Get default branch
DEFAULT_BRANCH=$(curl -s -u $GITHUB_USERNAME:$GITHUB_TOKEN https://api.github.com/repos/$GITHUB_USERNAME/$REPO_NAME | grep -o '"default_branch": "[^"]*"' | cut -d'"' -f4)
DEFAULT_BRANCH=${DEFAULT_BRANCH:-main}  # Fallback to 'main' if not found

# Check if git is initialized
if [ ! -d .git ]; then
  echo "Initializing git repository..."
  git init
  git config user.name "$GITHUB_USERNAME"
  git config user.email "$GITHUB_USERNAME@users.noreply.github.com"
  git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git
else
  echo "Git repository already initialized"
  if ! git remote | grep -q "origin"; then
    echo "Adding GitHub remote..."
    git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git
  else