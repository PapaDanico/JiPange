#!/usr/bin/env node

/**
 * JiPange Build Script
 * Bundles modular source into single HTML file for distribution
 *
 * Process:
 * 1. Extract HTML structure from Phase 4 template
 * 2. Bundle JS modules using esbuild
 * 3. Extract CSS from Phase 4
 * 4. Inline everything into final HTML
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

console.log('🏗️  Building JiPange...');

try {
    // Step 1: Read Phase 4 template
    console.log('📖 Reading Phase 4 template...');
    const phase4Path = path.join(projectRoot, 'jipange-phase4.html');
    const phase4Html = fs.readFileSync(phase4Path, 'utf-8');

    // Extract CSS from Phase 4
    console.log('🎨 Extracting CSS...');
    const styleMatch = phase4Html.match(/<style>([\s\S]*?)<\/style>/);
    const css = styleMatch ? styleMatch[1] : '';

    // Extract all <section> elements (screens)
    console.log('📺 Extracting screen sections...');
    const screenMatches = phase4Html.matchAll(/<section[^>]*id="screen[^"]*"[^>]*>[\s\S]*?<\/section>/g);
    const screens = Array.from(screenMatches).map(m => m[0]).join('\n');

    // Extract navbar structure
    console.log('🧭 Extracting navbar...');
    const navbarMatch = phase4Html.match(/<nav class="navbar">([\s\S]*?)<\/nav>/);
    const navbar = navbarMatch ? `<nav class="navbar">${navbarMatch[1]}</nav>` : '';

    // Step 2: Build JavaScript with esbuild
    console.log('📦 Bundling JavaScript modules...');
    const esbuildPath = path.join(projectRoot, 'node_modules/.bin/esbuild');
    const inputFile = path.join(projectRoot, 'src/main.js');
    const bundleFile = path.join(projectRoot, 'dist/bundle.js');

    execSync(`"${esbuildPath}" "${inputFile}" --bundle --format=iife --outfile="${bundleFile}"`, {
        stdio: 'pipe'
    });

    const bundledJs = fs.readFileSync(bundleFile, 'utf-8');
    console.log(`✓ JavaScript bundled (${Math.round(bundledJs.length / 1024)}KB)`);

    // Step 3: Extract external library scripts from Phase 4
    console.log('📚 Extracting external libraries...');
    const scriptMatches = phase4Html.matchAll(/<script[^>]*src="(https[^"]*)"[^>]*><\/script>/g);
    const externalScripts = Array.from(scriptMatches)
        .map(m => `<script src="${m[1]}"><\/script>`)
        .join('\n');

    // Step 4: Create final HTML
    console.log('🔨 Assembling final HTML...');
    const finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JiPange — Kenya's Financial Operating System</title>
    ${externalScripts}
    <style>
${css}
    </style>
</head>
<body>
    ${navbar}
    <div id="app-container">
        ${screens}
    </div>

    <script>
${bundledJs}
    </script>
</body>
</html>`;

    // Step 5: Write output
    const outputPath = path.join(projectRoot, 'dist/jipange.html');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, finalHtml, 'utf-8');
    console.log(`✓ Built: dist/jipange.html (${Math.round(finalHtml.length / 1024)}KB)`);

    // Step 6: Cleanup intermediate file
    fs.unlinkSync(bundleFile);

    console.log('✅ Build complete!');
    console.log('\nNext steps:');
    console.log('  1. Open dist/jipange.html in a browser');
    console.log('  2. Verify all screens render correctly');
    console.log('  3. Test navigation and form inputs');

} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}
