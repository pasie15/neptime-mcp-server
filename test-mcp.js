#!/usr/bin/env node
/**
 * Direct test of MCP server tools using the compiled code
 */

import { setApiKey, makeApiRequest } from './dist/services/api.js';

const API_KEY = 'a523b8a764910fc4d5689d3ba5820bb2be3a191d9f2f1d627b989c68220c8cf3';

async function test(name, fn) {
  console.log(`\n=== ${name} ===`);
  try {
    const result = await fn();
    console.log('✅ SUCCESS:', JSON.stringify(result, null, 2).substring(0, 300));
    return true;
  } catch (error) {
    console.log('❌ FAILED:', error.message);
    return false;
  }
}

async function runTests() {
  setApiKey(API_KEY);
  console.log('Testing MCP Server API calls...\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test video endpoints
  if (await test('List Videos', () => makeApiRequest('videos', 'GET', undefined, { limit: 2 }))) passed++; else failed++;
  if (await test('Search Videos', () => makeApiRequest('videos/search', 'GET', undefined, { q: 'test', limit: 2 }))) passed++; else failed++;
  if (await test('Trending Videos', () => makeApiRequest('videos/trending', 'GET', undefined, { limit: 2 }))) passed++; else failed++;
  if (await test('Get Video', () => makeApiRequest('videos/tDjpC8Q5ISvZ4vV', 'GET'))) passed++; else failed++;
  
  // Test channel endpoints
  if (await test('Get Channel', () => makeApiRequest('channels/1', 'GET'))) passed++; else failed++;
  if (await test('Channel Videos', () => makeApiRequest('channels/1/videos', 'GET', undefined, { limit: 2 }))) passed++; else failed++;
  
  // Test category endpoints
  if (await test('List Categories', () => makeApiRequest('categories', 'GET'))) passed++; else failed++;
  if (await test('Category Videos', () => makeApiRequest('categories/1/videos', 'GET', undefined, { limit: 2 }))) passed++; else failed++;
  
  // Test article endpoints
  if (await test('List Articles', () => makeApiRequest('articles', 'GET', undefined, { limit: 2 }))) passed++; else failed++;
  if (await test('Get Article', () => makeApiRequest('articles/21', 'GET'))) passed++; else failed++;
  
  // Test chunked upload init
  if (await test('Init Chunked Upload', () => makeApiRequest('videos/chunked/init', 'POST', {
    filename: 'test_video.mp4',
    filesize: 104857600,
    chunks: 2
  }))) passed++; else failed++;
  
  console.log('\n\n========== TEST SUMMARY ==========');
  console.log(`Passed: ${passed}/${passed + failed}`);
  console.log(`Failed: ${failed}/${passed + failed}`);
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
