/**
 * Build Optimization Script
 * Analyzes and optimizes the build process
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BuildOptimizer {
    constructor() {
        this.buildDir = path.join(__dirname, '../build');
        this.analysis = {
            bundleSize: 0,
            chunkCount: 0,
            duplicateDeps: [],
            unusedDeps: [],
            recommendations: []
        };
    }

    /**
     * Analyze build output
     */
    analyzeBuild() {
        console.log('🔍 Analyzing build output...');

        if (!fs.existsSync(this.buildDir)) {
            console.error('❌ Build directory not found. Run npm run build first.');
            return false;
        }

        this.analyzeBundleSize();
        this.analyzeChunks();
        this.analyzeDependencies();
        this.generateRecommendations();

        return true;
    }

    /**
     * Analyze bundle size
     */
    analyzeBundleSize() {
        const staticDir = path.join(this.buildDir, 'static');
        if (!fs.existsSync(staticDir)) return;

        const files = fs.readdirSync(staticDir);
        let totalSize = 0;

        files.forEach(file => {
            const filePath = path.join(staticDir, file);
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
        });

        this.analysis.bundleSize = totalSize;
        console.log(`📦 Total bundle size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    }

    /**
     * Analyze chunks
     */
    analyzeChunks() {
        const staticDir = path.join(this.buildDir, 'static');
        if (!fs.existsSync(staticDir)) return;

        const files = fs.readdirSync(staticDir);
        const jsFiles = files.filter(file => file.endsWith('.js'));

        this.analysis.chunkCount = jsFiles.length;
        console.log(`📄 Number of chunks: ${jsFiles.length}`);

        // Analyze chunk sizes
        jsFiles.forEach(file => {
            const filePath = path.join(staticDir, file);
            const stats = fs.statSync(filePath);
            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
            console.log(`  - ${file}: ${sizeMB} MB`);
        });
    }

    /**
     * Analyze dependencies
     */
    analyzeDependencies() {
        const packageJsonPath = path.join(__dirname, '../package.json');
        if (!fs.existsSync(packageJsonPath)) return;

        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const dependencies = Object.keys(packageJson.dependencies || {});

        console.log(`📚 Total dependencies: ${dependencies.length}`);

        // Check for potential duplicates
        this.checkDuplicateDependencies(dependencies);

        // Check for unused dependencies
        this.checkUnusedDependencies(dependencies);
    }

    /**
     * Check for duplicate dependencies
     */
    checkDuplicateDependencies(dependencies) {
        const duplicates = [];

        // Common duplicate patterns
        const duplicatePatterns = [
            { pattern: /lodash/, alternatives: ['lodash-es', 'lodash/fp'] },
            { pattern: /moment/, alternatives: ['date-fns', 'dayjs'] },
            { pattern: /axios/, alternatives: ['fetch', 'ky'] }
        ];

        duplicatePatterns.forEach(({ pattern, alternatives }) => {
            const matches = dependencies.filter(dep => pattern.test(dep));
            if (matches.length > 1) {
                duplicates.push({
                    type: 'duplicate',
                    dependencies: matches,
                    alternatives
                });
            }
        });

        this.analysis.duplicateDeps = duplicates;
    }

    /**
     * Check for unused dependencies
     */
    checkUnusedDependencies(dependencies) {
        const unused = [];

        // Common unused dependencies
        const potentiallyUnused = [
            'react-router-dom', // If not using routing
            'gsap', // If not using animations
            'chart.js', // If not using charts
            'moment' // If using date-fns instead
        ];

        potentiallyUnused.forEach(dep => {
            if (dependencies.includes(dep)) {
                unused.push(dep);
            }
        });

        this.analysis.unusedDeps = unused;
    }

    /**
     * Generate optimization recommendations
     */
    generateRecommendations() {
        const recommendations = [];

        // Bundle size recommendations
        if (this.analysis.bundleSize > 2 * 1024 * 1024) { // 2MB
            recommendations.push({
                type: 'warning',
                message: 'Bundle size is large (>2MB)',
                suggestions: [
                    'Consider code splitting with React.lazy()',
                    'Use dynamic imports for large components',
                    'Remove unused dependencies',
                    'Optimize images and assets'
                ]
            });
        }

        // Chunk count recommendations
        if (this.analysis.chunkCount > 10) {
            recommendations.push({
                type: 'info',
                message: 'High number of chunks',
                suggestions: [
                    'Consider combining small chunks',
                    'Use webpack-bundle-analyzer to visualize chunks',
                    'Optimize chunk splitting strategy'
                ]
            });
        }

        // Duplicate dependencies
        if (this.analysis.duplicateDeps.length > 0) {
            recommendations.push({
                type: 'warning',
                message: 'Duplicate dependencies found',
                suggestions: [
                    'Remove duplicate dependencies',
                    'Use alternatives for better tree shaking',
                    'Consider using a single date library'
                ]
            });
        }

        // Unused dependencies
        if (this.analysis.unusedDeps.length > 0) {
            recommendations.push({
                type: 'info',
                message: 'Potentially unused dependencies',
                suggestions: [
                    'Remove unused dependencies',
                    'Use depcheck to find unused deps',
                    'Consider lighter alternatives'
                ]
            });
        }

        this.analysis.recommendations = recommendations;
    }

    /**
     * Generate optimization report
     */
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            analysis: this.analysis,
            recommendations: this.analysis.recommendations
        };

        const reportPath = path.join(__dirname, '../build-optimization-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        console.log('\n📊 Build Optimization Report:');
        console.log('================================');
        console.log(`Bundle Size: ${(this.analysis.bundleSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Chunk Count: ${this.analysis.chunkCount}`);
        console.log(`Duplicate Dependencies: ${this.analysis.duplicateDeps.length}`);
        console.log(`Unused Dependencies: ${this.analysis.unusedDeps.length}`);

        console.log('\n💡 Recommendations:');
        this.analysis.recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec.message}`);
            rec.suggestions.forEach(suggestion => {
                console.log(`   - ${suggestion}`);
            });
        });

        console.log(`\n📄 Full report saved to: ${reportPath}`);
    }

    /**
     * Run optimization commands
     */
    runOptimizations() {
        console.log('\n🚀 Running optimizations...');

        // Install bundle analyzer
        try {
            execSync('npm install --save-dev webpack-bundle-analyzer', { stdio: 'inherit' });
            console.log('✅ Bundle analyzer installed');
        } catch (error) {
            console.log('⚠️  Bundle analyzer installation failed');
        }

        // Run dependency check
        try {
            execSync('npx depcheck', { stdio: 'inherit' });
            console.log('✅ Dependency check completed');
        } catch (error) {
            console.log('⚠️  Dependency check failed');
        }
    }

    /**
     * Main optimization process
     */
    optimize() {
        console.log('🔧 Starting build optimization...');

        if (!this.analyzeBuild()) {
            return;
        }

        this.generateReport();
        this.runOptimizations();

        console.log('\n✅ Build optimization completed!');
    }
}

// Run optimization if called directly
if (require.main === module) {
    const optimizer = new BuildOptimizer();
    optimizer.optimize();
}

module.exports = BuildOptimizer;
