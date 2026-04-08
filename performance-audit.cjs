#!/usr/bin/env node

/**
 * Performance Monitoring Script for BananaLeaf
 * Uses Lighthouse to audit performance, accessibility, SEO, and best practices
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const REPORTS_DIR = path.join(__dirname, 'reports');

// Routes to audit
const ROUTES_TO_AUDIT = [
    '/',
    '/legal',
    '/profile',
    '/vendor',
    '/admin'
];

function runLighthouseAudit(url, outputPath) {
    try {
        console.log(`🔍 Auditing ${url}...`);

        const command = `npx lighthouse ${url} --output=json --output-path=${outputPath} --quiet --chrome-flags="--headless --no-sandbox --disable-gpu"`;

        execSync(command, { stdio: 'inherit' });

        console.log(`✅ Audit completed for ${url}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to audit ${url}:`, error.message);
        return false;
    }
}

function generatePerformanceReport() {
    // Ensure reports directory exists
    if (!fs.existsSync(REPORTS_DIR)) {
        fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const results = [];

    console.log('🚀 Starting Lighthouse performance audit...\n');

    for (const route of ROUTES_TO_AUDIT) {
        const url = `${BASE_URL}${route}`;
        const outputPath = path.join(REPORTS_DIR, `lighthouse-${route.replace(/\//g, '-') || 'home'}-${timestamp}.json`);

        const success = runLighthouseAudit(url, outputPath);

        if (success && fs.existsSync(outputPath)) {
            try {
                const report = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
                results.push({
                    route,
                    url,
                    performance: Math.round(report.categories.performance.score * 100),
                    accessibility: Math.round(report.categories.accessibility.score * 100),
                    seo: Math.round(report.categories.seo.score * 100),
                    bestPractices: Math.round(report.categories['best-practices'].score * 100),
                    reportPath: outputPath
                });
            } catch (error) {
                console.error(`❌ Failed to parse report for ${route}:`, error.message);
            }
        }
    }

    // Generate summary report
    const summaryPath = path.join(REPORTS_DIR, `performance-summary-${timestamp}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        results,
        summary: {
            totalRoutes: results.length,
            averagePerformance: Math.round(results.reduce((sum, r) => sum + r.performance, 0) / results.length),
            averageAccessibility: Math.round(results.reduce((sum, r) => sum + r.accessibility, 0) / results.length),
            averageSEO: Math.round(results.reduce((sum, r) => sum + r.seo, 0) / results.length),
            averageBestPractices: Math.round(results.reduce((sum, r) => sum + r.bestPractices, 0) / results.length)
        }
    }, null, 2));

    console.log(`\n📊 Performance summary saved to: ${summaryPath}`);

    // Generate HTML report
    const htmlReport = generateHTMLReport(results, timestamp);
    const htmlPath = path.join(REPORTS_DIR, `performance-report-${timestamp}.html`);
    fs.writeFileSync(htmlPath, htmlReport);

    console.log(`📄 HTML report saved to: ${htmlPath}`);

    // Print summary to console
    console.log('\n📈 Performance Audit Summary:');
    console.log('='.repeat(50));
    results.forEach(result => {
        console.log(`${result.route.padEnd(10)} | Perf: ${result.performance.toString().padStart(3)} | Acc: ${result.accessibility.toString().padStart(3)} | SEO: ${result.seo.toString().padStart(3)} | BP: ${result.bestPractices.toString().padStart(3)}`);
    });
    console.log('='.repeat(50));

    const avgPerf = Math.round(results.reduce((sum, r) => sum + r.performance, 0) / results.length);
    const avgAcc = Math.round(results.reduce((sum, r) => sum + r.accessibility, 0) / results.length);
    const avgSEO = Math.round(results.reduce((sum, r) => sum + r.seo, 0) / results.length);
    const avgBP = Math.round(results.reduce((sum, r) => sum + r.bestPractices, 0) / results.length);

    console.log(`Average Scores | Perf: ${avgPerf} | Acc: ${avgAcc} | SEO: ${avgSEO} | BP: ${avgBP}`);

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (avgPerf < 90) console.log('• Performance score below 90 - consider optimizing images, reducing bundle size, and improving loading times');
    if (avgAcc < 90) console.log('• Accessibility score below 90 - review ARIA labels, color contrast, and keyboard navigation');
    if (avgSEO < 90) console.log('• SEO score below 90 - check meta tags, structured data, and page speed');
    if (avgBP < 90) console.log('• Best practices score below 90 - review security headers, deprecated APIs, and modern web standards');
}

function generateHTMLReport(results, timestamp) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BananaLeaf Performance Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
        .header p { margin: 10px 0 0 0; opacity: 0.9; }
        .content { padding: 30px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric-card { background: #f8f9fa; border-radius: 8px; padding: 20px; border-left: 4px solid #667eea; }
        .metric-card h3 { margin: 0 0 10px 0; color: #333; font-size: 1.1em; }
        .score { font-size: 2.5em; font-weight: bold; color: #667eea; }
        .score.good { color: #28a745; }
        .score.warning { color: #ffc107; }
        .score.danger { color: #dc3545; }
        .routes-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .routes-table th, .routes-table td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        .routes-table th { background: #f8f9fa; font-weight: 600; color: #495057; }
        .routes-table tr:hover { background: #f8f9fa; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-top: 30px; }
        .recommendations h3 { color: #856404; margin-top: 0; }
        .recommendations ul { margin: 10px 0 0 0; padding-left: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>BananaLeaf Performance Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        <div class="content">
            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>Performance</h3>
                    <div class="score ${getScoreClass(results.reduce((sum, r) => sum + r.performance, 0) / results.length)}">
                        ${Math.round(results.reduce((sum, r) => sum + r.performance, 0) / results.length)}
                    </div>
                </div>
                <div class="metric-card">
                    <h3>Accessibility</h3>
                    <div class="score ${getScoreClass(results.reduce((sum, r) => sum + r.accessibility, 0) / results.length)}">
                        ${Math.round(results.reduce((sum, r) => sum + r.accessibility, 0) / results.length)}
                    </div>
                </div>
                <div class="metric-card">
                    <h3>SEO</h3>
                    <div class="score ${getScoreClass(results.reduce((sum, r) => sum + r.seo, 0) / results.length)}">
                        ${Math.round(results.reduce((sum, r) => sum + r.seo, 0) / results.length)}
                    </div>
                </div>
                <div class="metric-card">
                    <h3>Best Practices</h3>
                    <div class="score ${getScoreClass(results.reduce((sum, r) => sum + r.bestPractices, 0) / results.length)}">
                        ${Math.round(results.reduce((sum, r) => sum + r.bestPractices, 0) / results.length)}
                    </div>
                </div>
            </div>

            <h2>Route Performance Details</h2>
            <table class="routes-table">
                <thead>
                    <tr>
                        <th>Route</th>
                        <th>Performance</th>
                        <th>Accessibility</th>
                        <th>SEO</th>
                        <th>Best Practices</th>
                    </tr>
                </thead>
                <tbody>
${results.map(result => `
                    <tr>
                        <td><code>${result.route}</code></td>
                        <td><span class="score ${getScoreClass(result.performance)}">${result.performance}</span></td>
                        <td><span class="score ${getScoreClass(result.accessibility)}">${result.accessibility}</span></td>
                        <td><span class="score ${getScoreClass(result.seo)}">${result.seo}</span></td>
                        <td><span class="score ${getScoreClass(result.bestPractices)}">${result.bestPractices}</span></td>
                    </tr>`).join('')}
                </tbody>
            </table>

            <div class="recommendations">
                <h3>💡 Recommendations</h3>
                <ul>
                    ${generateRecommendations(results)}
                </ul>
            </div>
        </div>
    </div>
</body>
</html>`;
}

function getScoreClass(score) {
    if (score >= 90) return 'good';
    if (score >= 70) return 'warning';
    return 'danger';
}

function generateRecommendations(results) {
    const recommendations = [];
    const avgPerf = results.reduce((sum, r) => sum + r.performance, 0) / results.length;
    const avgAcc = results.reduce((sum, r) => sum + r.accessibility, 0) / results.length;
    const avgSEO = results.reduce((sum, r) => sum + r.seo, 0) / results.length;
    const avgBP = results.reduce((sum, r) => sum + r.bestPractices, 0) / results.length;

    if (avgPerf < 90) recommendations.push('Performance score below 90 - consider optimizing images, reducing bundle size, and improving loading times');
    if (avgAcc < 90) recommendations.push('Accessibility score below 90 - review ARIA labels, color contrast, and keyboard navigation');
    if (avgSEO < 90) recommendations.push('SEO score below 90 - check meta tags, structured data, and page speed');
    if (avgBP < 90) recommendations.push('Best practices score below 90 - review security headers, deprecated APIs, and modern web standards');

    if (recommendations.length === 0) {
        recommendations.push('All scores are excellent! Keep up the great work.');
    }

    return recommendations.map(rec => `<li>${rec}</li>`).join('');
}

if (require.main === module) {
    generatePerformanceReport();
}

module.exports = { generatePerformanceReport };