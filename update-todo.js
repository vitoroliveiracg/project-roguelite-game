const fs = require('fs');
const https = require('https');

const repo = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;

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