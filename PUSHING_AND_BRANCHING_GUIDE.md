# Git: Creating Branches & Pushing Code (with Troubleshooting)

## 1. Creating a New Branch
```sh
git checkout -b your-branch-name
```
- Replace `your-branch-name` with your desired branch name.
- If the branch already exists, switch to it:
  ```sh
  git checkout your-branch-name
  ```

## 2. Pushing a Branch to GitHub
```sh
git push --set-upstream origin your-branch-name
```
- This creates the branch on GitHub and sets it to track the remote branch.
- For future pushes, you can just use:
  ```sh
  git push
  ```

## 3. Checking Your Remote URL
Make sure you are using SSH (recommended):
```sh
git remote -v
```
Should show:
```
origin  git@github.com:your-username/your-repo.git (fetch)
origin  git@github.com:your-username/your-repo.git (push)
```
If not, set it:
```sh
git remote set-url origin git@github.com:your-username/your-repo.git
```

## 4. Troubleshooting
### a. SSH Authentication
- Test your SSH connection:
  ```sh
  ssh -T git@github.com
  ```
- You should see: `Hi your-username! You've successfully authenticated...`
- If you see errors about the SSH agent, start it:
  ```sh
  eval "$(ssh-agent -s)"
  ssh-add ~/.ssh/id_rsa
  ```

### b. GUI (Cursor/VS Code) Issues
- Make sure your remote is set to SSH, not HTTPS.
- Restart the GUI after making changes in the terminal.
- If prompted to push to a fork, check your permissions and remote URL.
- If you can push from the terminal but not the GUI, the issue is with the GUI's configuration or cache.

## 5. Useful Commands
- See all branches:
  ```sh
  git branch
  ```
- See remote branches:
  ```sh
  git branch -r
  ```
- See current branch:
  ```sh
  git branch --show-current
  ```

---
**Tip:** If you ever get stuck, try pushing from the terminal first. If that works, the problem is with your GUI setup, not your Git or GitHub permissions. 