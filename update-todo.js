const fs = require('fs');
const https = require('https');

const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;

function apiRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: method,
      headers: {
        'User-Agent': 'GitHub-Actions',
        'Authorization': 'token ' + token,
        'Content-Type': 'application/json'
      }
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`API request failed: ${res.statusCode} ${body}`));
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function updateIssuesFromTodo() {
  const existingContent = fs.existsSync('docs/todo.md') ? fs.readFileSync('docs/todo.md', 'utf8') : '';
  const lines = existingContent.split('\n');
  const issueRegex = /- \[([xX~])\] .+ \(#(\d+)\)/;
  const subtaskRegex = /^\s{4,}- \[([xX~])\] (.+)$/;
  
  let currentIssueNumber = null;

  for (const line of lines) {
    // Check for main issue
    const issueMatch = line.match(issueRegex);
    if (issueMatch) {
      const status = issueMatch[1].toLowerCase();
      currentIssueNumber = issueMatch[2];
      try {
        if (status === 'x') {
          await apiRequest(`/repos/${repo}/issues/${currentIssueNumber}`, 'PATCH', { state: 'closed' });
          console.log(`Closed issue #${currentIssueNumber}`);
        } else if (status === '~') {
          await apiRequest(`/repos/${repo}/issues/${currentIssueNumber}/comments`, 'POST', { body: 'parcialmente integrada' });
          console.log(`Added comment to issue #${currentIssueNumber}`);
        }
      } catch (err) {
        console.warn(`Warning: Could not update issue #${currentIssueNumber}: ${err.message}`);
      }
    }
    
    // Check for subtasks
    const subtaskMatch = line.match(subtaskRegex);
    if (subtaskMatch && currentIssueNumber) {
      const status = subtaskMatch[1].toLowerCase();
      const subtaskText = subtaskMatch[2];
      try {
        if (status === '~') {
          await apiRequest(`/repos/${repo}/issues/${currentIssueNumber}/comments`, 'POST', { body: `[${subtaskText}] parcialmente concluida` });
          console.log(`Added subtask comment to issue #${currentIssueNumber}`);
        }
      } catch (err) {
        console.warn(`Warning: Could not add subtask comment to issue #${currentIssueNumber}: ${err.message}`);
      }
    }
  }
}

async function main() {
  // First, update issues based on current todo.md
  await updateIssuesFromTodo();

  // Then, fetch current issues and update todo.md
  const options = {
    hostname: 'api.github.com',
    path: '/repos/' + repo + '/issues',
    headers: {
      'User-Agent': 'GitHub-Actions',
      'Authorization': 'token ' + token
    }
  };

  https.get(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      const issues = JSON.parse(data);
      const existingContent = fs.existsSync('docs/todo.md') ? fs.readFileSync('docs/todo.md', 'utf8') : '';

      let issuesContent = '## Issues\n\n';
      issues.forEach(issue => {
        if (!issue.pull_request) {
          let issueTodos = '';
          const lines = (issue.body || '').split('\n');
          lines.forEach(line => {
            if (line.trim().startsWith('- [ ]')) {
              issueTodos += '    ' + line.trim() + '\n';
            }
          });
          issuesContent += '- [ ] ' + issue.title + ' (#' + issue.number + ')\n    descrição: ' + (issue.body ? issue.body.split('\n')[0] : 'No description.') + '\n' + issueTodos + '\n';
        }
      });

      const todoContent = '# TODO - Synced from GitHub Issues\n\n' + issuesContent + '\n---\n\n' + existingContent;
      fs.writeFileSync('docs/todo.md', todoContent);
      console.log('TODO updated');
    });
  }).on('error', (err) => {
    console.error(err);
    process.exit(1);
  });
}

main();