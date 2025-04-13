
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
commit_message=${commit_message:-"Initial commit from Replit $(date +'%Y-%m-%d %H:%M:%S')"}

# Commit changes
git commit -m "$commit_message"

# For first-time push, let's try to fetch and then force push with lease
echo "Checking remote status..."

# Try to fetch first
if git fetch origin $DEFAULT_BRANCH; then
  echo "Remote branch exists. Will need to integrate changes."
  
  # Check if there are remote changes
  if git branch -r | grep -q "origin/$DEFAULT_BRANCH"; then
    echo "The remote repository already has content."
    echo "Options:"
    echo "1. Force push your changes (replaces remote content)"
    echo "2. Pull and merge remote changes"
    echo "3. Cancel and exit"
    read -p "Choose option (1-3): " option
    
    case $option in
      1)
        echo "Force pushing your changes..."
        git push -f origin $DEFAULT_BRANCH
        ;;
      2)
        echo "Pulling and merging remote changes..."
        git pull --allow-unrelated-histories origin $DEFAULT_BRANCH
        git push origin $DEFAULT_BRANCH
        ;;
      3)
        echo "Operation cancelled."
        exit 0
        ;;
      *)
        echo "Invalid option. Exiting."
        exit 1
        ;;
    esac
  else
    # Empty remote repository (just created)
    echo "Pushing to new remote repository..."
    git push -u origin $DEFAULT_BRANCH
  fi
else
  # Remote branch doesn't exist yet
  echo "Setting up new remote branch..."
  git push -u origin $DEFAULT_BRANCH
fi

echo "Successfully pushed to GitHub!"
