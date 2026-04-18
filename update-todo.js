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

function normalizeStatus(character) {
  if (!character) return ' ';
  const status = character.trim().toLowerCase();
  if (status === 'x') return 'x';
  if (status === '~') return '~';
  return ' ';
}

function normalizeText(text) {
  return text.trim().replace(/\s+/g, ' ');
}

function parseTodoIssues(content) {
  const lines = content.split('\n');
  const issueHeaderRegex = /^\s*-\s*\[([ xX~]?)\]\s*(.+?)\s*\(#(\d+)\)\s*$/;
  const subtaskRegex = /^\s*-\s*\[([ xX~]?)\]\s*(.+)$/;

  const issues = [];
  let currentIssue = null;

  for (const line of lines) {
    const issueMatch = line.match(issueHeaderRegex);
    if (issueMatch) {
      if (currentIssue) {
        issues.push(currentIssue);
      }
      currentIssue = {
        number: issueMatch[3],
        status: normalizeStatus(issueMatch[1]),
        title: issueMatch[2].trim(),
        subtasks: []
      };
      continue;
    }

    if (currentIssue) {
      const subtaskMatch = line.match(subtaskRegex);
      if (subtaskMatch) {
        currentIssue.subtasks.push({
          status: normalizeStatus(subtaskMatch[1]),
          text: subtaskMatch[2].trim()
        });
      }
    }
  }

  if (currentIssue) {
    issues.push(currentIssue);
  }

  return issues;
}

function updateIssueBodyCheckboxes(body, subtasks) {
  const originalLines = body.split('\n');
  const lines = [...originalLines];
  const missing = [];

  for (const subtask of subtasks) {
    const normalizedTodo = normalizeText(subtask.text);
    let matched = false;

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^\s*([-*]\s*)\[[ xX~]?\]\s*(.+)$/);
      if (!match) continue;

      const existingText = normalizeText(match[2]);
      if (existingText === normalizedTodo) {
        const newLine = `${match[1]}[${subtask.status}] ${match[2].trim()}`;
        if (newLine !== lines[i]) {
          lines[i] = newLine;
        }
        matched = true;
        break;
      }
    }

    if (!matched) {
      missing.push(subtask);
    }
  }

  if (missing.length) {
    let insertIndex = lines.findIndex((line) => line.trim().toLowerCase().startsWith('descrição:'));
    if (insertIndex === -1) {
      insertIndex = lines.length;
    } else {
      insertIndex += 1;
    }

    for (const subtask of missing) {
      lines.splice(insertIndex, 0, `- [${subtask.status}] ${subtask.text}`);
      insertIndex++;
    }
  }

  return lines.join('\n');
}

async function updateIssuesFromTodo() {
  const existingContent = fs.existsSync('docs/todo.md') ? fs.readFileSync('docs/todo.md', 'utf8') : '';
  const todoIssues = parseTodoIssues(existingContent);

  for (const todoIssue of todoIssues) {
    const issueNumber = todoIssue.number;
    const patchData = {};

    try {
      const issue = await apiRequest(`/repos/${repo}/issues/${issueNumber}`);

      if (todoIssue.status === 'x' && issue.state !== 'closed') {
        patchData.state = 'closed';
      }

      if (todoIssue.status === ' ' && issue.state === 'closed') {
        patchData.state = 'open';
      }

      if (todoIssue.subtasks.length > 0) {
        const updatedBody = updateIssueBodyCheckboxes(issue.body || '', todoIssue.subtasks);
        if (updatedBody !== (issue.body || '')) {
          patchData.body = updatedBody;
        }
      }

      if (Object.keys(patchData).length > 0) {
        await apiRequest(`/repos/${repo}/issues/${issueNumber}`, 'PATCH', patchData);
        console.log(`Patched issue #${issueNumber}:`, patchData);
      }

      for (const subtask of todoIssue.subtasks) {
        if (subtask.status === '~') {
          await apiRequest(`/repos/${repo}/issues/${issueNumber}/comments`, 'POST', { body: `[${subtask.text}] parcialmente concluida` });
          console.log(`Added subtask comment to issue #${issueNumber}`);
        }
      }
    } catch (err) {
      console.warn(`Warning: Could not update issue #${issueNumber}: ${err.message}`);
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

      const separator = '\n---\n';
      const separatorIndex = existingContent.indexOf(separator);
      const startHeader = existingContent.indexOf('# TODO - Synced from GitHub Issues');
      const currentIssueSection = startHeader !== -1
        ? existingContent.slice(startHeader, separatorIndex !== -1 ? separatorIndex : undefined)
        : (separatorIndex !== -1 ? existingContent.slice(0, separatorIndex) : existingContent);
      const suffix = separatorIndex !== -1 ? existingContent.slice(separatorIndex + separator.length) : '';

      const issueBlocks = new Map();
      const lines = currentIssueSection.split('\n');
      let currentIssueNumber = null;
      let currentBlock = [];
      const issueHeaderRegex = /^- \[([ xX~]?)\] .+ \(#(\d+)\)$/;

      for (const line of lines) {
        const match = line.match(issueHeaderRegex);
        if (match) {
          if (currentIssueNumber !== null) {
            issueBlocks.set(currentIssueNumber, currentBlock.join('\n'));
          }
          currentIssueNumber = match[2];
          currentBlock = [line];
        } else if (currentIssueNumber !== null) {
          currentBlock.push(line);
        }
      }
      if (currentIssueNumber !== null) {
        issueBlocks.set(currentIssueNumber, currentBlock.join('\n'));
      }

      const openIssueNumbers = new Set();
      const newIssueBlocks = [];

      issues.forEach(issue => {
        if (issue.pull_request) return;
        openIssueNumbers.add(String(issue.number));
        const existingBlock = issueBlocks.get(String(issue.number));
        if (existingBlock) {
          const lines = existingBlock.split('\n');
          const headerMatch = lines[0].match(/^- \[([ xX~])\] .+ \(#\d+\)$/);
          const status = headerMatch ? headerMatch[1].trim() : ' ';
          const header = `- [${status}] ${issue.title} (#${issue.number})`;
          newIssueBlocks.push([header, ...lines.slice(1)].join('\n'));
        } else {
          let issueTodos = '';
          const bodyLines = (issue.body || '').split('\n');
          bodyLines.forEach(line => {
            if (line.trim().startsWith('- [ ]')) {
              issueTodos += '    ' + line.trim() + '\n';
            }
          });
          newIssueBlocks.push(`- [ ] ${issue.title} (#${issue.number})\n    descrição: ${issue.body ? issue.body.split('\n')[0] : 'No description.'}\n${issueTodos}`);
        }
      });

      // Preserve closed/completed issues that were marked X in local file
      issueBlocks.forEach((block, issueNumber) => {
        if (!openIssueNumbers.has(issueNumber) && /- \[[xX]\] /.test(block)) {
          newIssueBlocks.push(block);
        }
      });

      const issuesContent = '## Issues\n\n' + newIssueBlocks.join('\n\n') + '\n';
      const todoContent = '# TODO - Synced from GitHub Issues\n\n' + issuesContent + separator;
      const finalContent = suffix.trim() ? todoContent + '\n' + suffix.trim() + '\n' : todoContent;
      fs.writeFileSync('docs/todo.md', finalContent);
      console.log('TODO updated');
    });
  }).on('error', (err) => {
    console.error(err);
    process.exit(1);
  });
}

main();