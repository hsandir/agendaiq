#!/usr/bin/env node

/**
 * Test GitHub API connection
 * This script verifies that your GitHub token is properly configured
 */

require('dotenv').config({ path: '.env.local' });

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'hsandir';
const GITHUB_REPO = process.env.GITHUB_REPO || 'agendaiq';

async function testConnection() {
  console.log('🔍 Testing GitHub API connection...\n');

  // Check if token exists
  if (!GITHUB_TOKEN || GITHUB_TOKEN === 'YOUR_NEW_GITHUB_TOKEN_HERE') {
    console.error('❌ GitHub token not configured!');
    console.log('\nPlease add your GitHub token to .env.local:');
    console.log('GITHUB_TOKEN=your_actual_token_here\n');
    process.exit(1);
  }

  // Mask the token for display
  const maskedToken = GITHUB_TOKEN.substring(0, 8) + '...' + GITHUB_TOKEN.substring(GITHUB_TOKEN.length - 4);
  console.log(`📋 Repository: ${GITHUB_OWNER}/${GITHUB_REPO}`);
  console.log(`🔑 Token: ${maskedToken}\n`);

  try {
    // Test API connection
    console.log('📡 Connecting to GitHub API...');
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const repoData = await response.json();
    console.log('✅ Successfully connected to GitHub!\n');
    console.log('📊 Repository Info:');
    console.log(`   Name: ${repoData.full_name}`);
    console.log(`   Description: ${repoData.description || 'No description'}`);
    console.log(`   Stars: ${repoData.stargazers_count}`);
    console.log(`   Open Issues: ${repoData.open_issues_count}`);

    // Test workflow access
    console.log('\n🔄 Testing GitHub Actions access...');
    const workflowResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs?per_page=1`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!workflowResponse.ok) {
      throw new Error(`Cannot access workflows: HTTP ${workflowResponse.status}`);
    }

    const workflowData = await workflowResponse.json();
    console.log('✅ GitHub Actions access confirmed!');
    console.log(`   Total workflow runs: ${workflowData.total_count}`);

    console.log('\n🎉 All tests passed! Your GitHub token is properly configured.');
    console.log('You can now use the CI/CD Monitor with real data.\n');

  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error(`Error: ${error.message}\n`);
    
    if (error.message.includes('401')) {
      console.log('🔐 This usually means your token is invalid or expired.');
      console.log('Please generate a new token at: https://github.com/settings/tokens');
      console.log('Required scopes: repo, workflow\n');
    } else if (error.message.includes('404')) {
      console.log('📁 Repository not found. Check GITHUB_OWNER and GITHUB_REPO in .env.local\n');
    } else if (error.message.includes('403')) {
      console.log('🚫 Permission denied. Your token might not have the required scopes.');
      console.log('Required scopes: repo, workflow\n');
    }
    
    process.exit(1);
  }
}

// Run the test
testConnection().catch(console.error);