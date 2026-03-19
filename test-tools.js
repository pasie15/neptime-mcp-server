#!/usr/bin/env node
/**
 * Test script for Neptime MCP Server tools
 */

import axios from 'axios';

const API_KEY = 'a523b8a764910fc4d5689d3ba5820bb2be3a191d9f2f1d627b989c68220c8cf3';
const BASE_URL = 'https://neptime.io/public_api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  params: {
    api_key: API_KEY
  }
});

async function testEndpoint(name, method, endpoint, data = null, params = null) {
  console.log(`\n=== Testing: ${name} ===`);
  try {
    const response = await api({
      method,
      url: endpoint,
      data,
      params
    });
    console.log('✅ SUCCESS:', JSON.stringify(response.data, null, 2).substring(0, 500));
    return { success: true, data: response.data };
  } catch (error) {
    console.log('❌ FAILED:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

async function runTests() {
  console.log('Starting Neptime API Tests...\n');
  
  const results = [];
  
  // Video endpoints
  results.push(await testEndpoint('List Videos', 'GET', '/videos', null, { limit: 2 }));
  results.push(await testEndpoint('Search Videos', 'GET', '/videos/search', null, { q: 'test', limit: 2 }));
  results.push(await testEndpoint('Trending Videos', 'GET', '/videos/trending', null, { limit: 2 }));
  results.push(await testEndpoint('Get Video', 'GET', '/videos/tDjpC8Q5ISvZ4vV'));
  
  // Channel endpoints
  results.push(await testEndpoint('Get Channel', 'GET', '/channels/1'));
  results.push(await testEndpoint('Get Channel Videos', 'GET', '/channels/1/videos', null, { limit: 2 }));
  
  // Category endpoints
  results.push(await testEndpoint('List Categories', 'GET', '/categories'));
  results.push(await testEndpoint('Category Videos', 'GET', '/categories/1/videos', null, { limit: 2 }));
  
  // Article endpoints
  results.push(await testEndpoint('List Articles', 'GET', '/articles', null, { limit: 2 }));
  results.push(await testEndpoint('Get Article', 'GET', '/articles/21'));
  
  // Chunked upload endpoints
  results.push(await testEndpoint('Init Chunked Upload', 'POST', '/videos/chunked/init', {
    filename: 'test_video.mp4',
    filesize: 104857600,
    chunks: 2
  }));
  
  // Summary
  console.log('\n\n========== TEST SUMMARY ==========');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  console.log(`Passed: ${passed}/${results.length}`);
  console.log(`Failed: ${failed}/${results.length}`);
}

runTests().catch(console.error);
