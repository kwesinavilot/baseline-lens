#!/usr/bin/env node

// Simple test script to verify CLI functionality
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Baseline Lens CLI functionality...\n');

// Test 1: Check if CLI can be invoked
try {
    console.log('1. Testing CLI help command...');
    const helpOutput = execSync('node out/cli/index.js --help', { encoding: 'utf8' });
    console.log('✅ CLI help command works');
} catch (error) {
    console.error('❌ CLI help command failed:', error.message);
    process.exit(1);
}

// Test 2: Test configuration validation
try {
    console.log('\n2. Testing configuration validation...');
    
    // Create a test config file
    const testConfig = {
        supportThreshold: 90,
        customBrowserMatrix: [],
        excludePatterns: ["**/node_modules/**"],
        includePatterns: [],
        enabledAnalyzers: {
            css: true,
            javascript: true,
            html: true
        },
        maxFileSize: 10485760,
        analysisTimeout: 5000,
        failOn: "high",
        outputFormat: "json"
    };
    
    fs.writeFileSync('test-config.json', JSON.stringify(testConfig, null, 2));
    
    const validateOutput = execSync('node out/cli/index.js validate-config -c test-config.json', { encoding: 'utf8' });
    console.log('✅ Configuration validation works');
    
    // Clean up
    fs.unlinkSync('test-config.json');
} catch (error) {
    console.error('❌ Configuration validation failed:', error.message);
    // Clean up on error
    if (fs.existsSync('test-config.json')) {
        fs.unlinkSync('test-config.json');
    }
}

// Test 3: Test CI config generation
try {
    console.log('\n3. Testing CI config generation...');
    
    const ciOutput = execSync('node out/cli/index.js init-ci --type github --output .github/workflows', { encoding: 'utf8' });
    console.log('✅ CI config generation works');
    
    // Check if files were created
    if (fs.existsSync('.github/workflows/baseline-lens.yml')) {
        console.log('✅ GitHub Actions workflow file created');
        // Clean up
        fs.rmSync('.github', { recursive: true, force: true });
    }
} catch (error) {
    console.error('❌ CI config generation failed:', error.message);
    // Clean up on error
    if (fs.existsSync('.github')) {
        fs.rmSync('.github', { recursive: true, force: true });
    }
}

// Test 4: Test show-config command
try {
    console.log('\n4. Testing show-config command...');
    const showConfigOutput = execSync('node out/cli/index.js show-config', { encoding: 'utf8' });
    console.log('✅ Show config command works');
} catch (error) {
    console.error('❌ Show config command failed:', error.message);
}

console.log('\n🎉 CLI functionality tests completed!');