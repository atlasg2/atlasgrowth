
#!/bin/bash

# GitHub automation script
# This script automates pushing to GitHub using stored secrets

# Load variables from secrets
GITHUB_USERNAME=$GITHUB_USERNAME
GITHUB_TOKEN=$GITHUB_TOKEN
REPO_NAME="atlasgrowth"

# Check if secrets are available
if [ -z "$GITHUB_USERNAME" ] || [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GitHub credentials not found in secrets"
  echo "Please make sure GITHUB_USERNAME and GITHUB_TOKEN are set in Replit secrets"
  exit 1
fi

# Check if git is initialized
if [ ! -d .git ]; then
  echo "Initializing git repository..."
  git init
  
  # Configure git
  git config user.name "$GITHUB_USERNAME"
  git config user.email "$GITHUB_USERNAME@users.noreply.github.com"
  
  # Add remote with authentication
  git remote add origin https://$GITHUB_USERNAME:$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/$REPO_NAME.git
else
  echo "Git repository already initialized"
  
  # Check if remote exists
  if ! git remote | grep -q "origin"; then
    echo "Adding GitHub remote..."
    git remote add origin https://$GITHUB_USERNAME:$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/$REPO_NAME.git
  else
    echo "Updating GitHub remote..."
    git remote set-url origin https://$GITHUB_USERNAME:$GITHUB_TOKEN@github.com/$GITHUB_USERNAME/$REPO_NAME.git
  fi
fi

# Ask for commit message
echo "Enter commit message:"
read commit_message

if [ -z "$commit_message" ]; then
  commit_message="Update from Replit on $(date)"
fi

# Add all files, commit and push
git add .
git commit -m "$commit_message"

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin main

echo "Done!"
