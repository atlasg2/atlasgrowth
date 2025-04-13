
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
  echo "Please set these in the Secrets tab (Environment Variables)"
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
  git remote add origin https://$GITHUB_USERNAME:$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/$REPO_NAME.git
else
  echo "Git repository already initialized"
  if ! git remote | grep -q "origin"; then
    echo "Adding GitHub remote..."
    git remote add origin https://$GITHUB_USERNAME:$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/$REPO_NAME.git
  else
    echo "Updating GitHub remote..."
    git remote set-url origin https://$GITHUB_USERNAME:$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/$REPO_NAME.git
  fi
fi

# Add all changes
git add .

# Commit changes
echo "Enter a commit message (or press Enter for default message):"
read commit_message
commit_message=${commit_message:-"Update from Replit $(date +'%Y-%m-%d %H:%M:%S')"}

# Commit and push
git commit -m "$commit_message"

# Try to pull first to integrate remote changes
echo "Attempting to integrate remote changes..."
git pull --rebase origin $DEFAULT_BRANCH || {
  echo "Pull failed, trying to force push (use this carefully)..."
  read -p "Do you want to force push? This will overwrite remote changes (y/n): " force_push
  if [[ $force_push == "y" ]]; then
    git push -f -u origin $DEFAULT_BRANCH
  else
    echo "Push aborted. You may want to:"
    echo "1. Pull changes manually: git pull origin $DEFAULT_BRANCH"
    echo "2. Resolve any conflicts"
    echo "3. Run this script again"
    exit 1
  fi
} || {
  git push -u origin $DEFAULT_BRANCH || git push --set-upstream origin $DEFAULT_BRANCH
}

echo "Successfully pushed to GitHub!"
