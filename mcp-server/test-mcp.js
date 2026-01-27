#!/usr/bin/env node

/**
 * Simple test script for the MCP server
 * This simulates what Claude Desktop would send to the server
 */

import { spawn } from 'child_process';

// Start the MCP server
const server = spawn('node', ['index.js'], {
  cwd: process.cwd()
});

let output = '';

server.stdout.on('data', (data) => {
  output += data.toString();
  console.log('Server response:', data.toString());
});

server.stderr.on('data', (data) => {
  console.log('Server log:', data.toString());
});

// Wait for server to start
setTimeout(() => {
  console.log('\n=== Testing list_tools ===');

  const listToolsRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  };

  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

  setTimeout(() => {
    console.log('\n=== Testing list_jobs ===');

    const listJobsRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "list_jobs",
        arguments: {}
      }
    };

    server.stdin.write(JSON.stringify(listJobsRequest) + '\n');

    setTimeout(() => {
      console.log('\n=== Testing get_job_details ===');

      const jobDetailsRequest = {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "get_job_details",
          arguments: {
            job_id: "associate"
          }
        }
      };

      server.stdin.write(JSON.stringify(jobDetailsRequest) + '\n');

      setTimeout(() => {
        console.log('\n=== Test complete ===');
        server.kill();
        process.exit(0);
      }, 1000);
    }, 1000);
  }, 1000);
}, 1000);

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
});
