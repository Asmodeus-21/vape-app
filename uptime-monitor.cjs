#!/usr/bin/env node

/**
 * Uptime Monitoring Script for VapesHub
 * Monitors site availability and response times
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://vapeshub.vercel.app';
const MONITOR_INTERVAL = 5 * 60 * 1000; // 5 minutes
const LOGS_DIR = path.join(__dirname, 'logs');

// Routes to monitor
const ROUTES_TO_MONITOR = [
    '/',
    '/legal',
    '/profile',
    '/vendor',
    '/admin'
];

class UptimeMonitor {
    constructor() {
        this.results = [];
        this.isRunning = false;
        this.ensureLogsDirectory();
    }

    ensureLogsDirectory() {
        if (!fs.existsSync(LOGS_DIR)) {
            fs.mkdirSync(LOGS_DIR, { recursive: true });
        }
    }

    async checkUrl(url) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const client = url.startsWith('https:') ? https : http;

            const req = client.get(url, { timeout: 10000 }, (res) => {
                const responseTime = Date.now() - startTime;
                const statusCode = res.statusCode;
                const isUp = statusCode >= 200 && statusCode < 400;

                resolve({
                    url,
                    statusCode,
                    responseTime,
                    isUp,
                    timestamp: new Date().toISOString(),
                    error: null
                });
            });

            req.on('error', (error) => {
                const responseTime = Date.now() - startTime;
                resolve({
                    url,
                    statusCode: null,
                    responseTime,
                    isUp: false,
                    timestamp: new Date().toISOString(),
                    error: error.message
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    url,
                    statusCode: null,
                    responseTime: 10000,
                    isUp: false,
                    timestamp: new Date().toISOString(),
                    error: 'Timeout after 10 seconds'
                });
            });
        });
    }

    async runHealthCheck() {
        console.log(`🔍 Running health check at ${new Date().toLocaleString()}`);

        const checks = ROUTES_TO_MONITOR.map(route => this.checkUrl(`${BASE_URL}${route}`));
        const results = await Promise.all(checks);

        this.results.push(...results);
        this.logResults(results);
        this.printSummary(results);

        return results;
    }

    logResults(results) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const logPath = path.join(LOGS_DIR, `uptime-${timestamp}.json`);

        const logEntry = {
            timestamp: new Date().toISOString(),
            checks: results
        };

        fs.writeFileSync(logPath, JSON.stringify(logEntry, null, 2));
    }

    printSummary(results) {
        const upCount = results.filter(r => r.isUp).length;
        const totalCount = results.length;
        const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

        console.log(`📊 Health Check Summary: ${upCount}/${totalCount} routes up`);
        console.log(`⏱️  Average response time: ${Math.round(avgResponseTime)}ms`);
        console.log('');

        results.forEach(result => {
            const status = result.isUp ? '✅' : '❌';
            const statusText = result.isUp ? `${result.statusCode}` : `DOWN (${result.error})`;
            console.log(`${status} ${result.url.replace(BASE_URL, '')} - ${statusText} (${result.responseTime}ms)`);
        });

        console.log('');

        // Alert if any routes are down
        const downRoutes = results.filter(r => !r.isUp);
        if (downRoutes.length > 0) {
            console.log('🚨 ALERT: The following routes are currently down:');
            downRoutes.forEach(route => {
                console.log(`   ${route.url} - ${route.error}`);
            });
        }
    }

    generateReport() {
        const reportPath = path.join(LOGS_DIR, 'uptime-report.json');
        const allResults = this.results;

        const report = {
            generatedAt: new Date().toISOString(),
            monitoredUrl: BASE_URL,
            totalChecks: allResults.length,
            uptimePercentage: (allResults.filter(r => r.isUp).length / allResults.length) * 100,
            averageResponseTime: allResults.reduce((sum, r) => sum + r.responseTime, 0) / allResults.length,
            routes: ROUTES_TO_MONITOR.map(route => {
                const routeResults = allResults.filter(r => r.url === `${BASE_URL}${route}`);
                return {
                    route,
                    checks: routeResults.length,
                    up: routeResults.filter(r => r.isUp).length,
                    uptimePercentage: (routeResults.filter(r => r.isUp).length / routeResults.length) * 100,
                    averageResponseTime: routeResults.reduce((sum, r) => sum + r.responseTime, 0) / routeResults.length
                };
            })
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`📄 Uptime report saved to: ${reportPath}`);

        return report;
    }

    async startMonitoring(duration = null) {
        this.isRunning = true;
        console.log(`🚀 Starting uptime monitoring for ${BASE_URL}`);
        console.log(`📏 Monitoring interval: ${MONITOR_INTERVAL / 1000} seconds`);
        if (duration) {
            console.log(`⏰ Will run for ${duration / 1000 / 60} minutes`);
        }
        console.log('');

        const startTime = Date.now();
        let checkCount = 0;

        const monitoringLoop = async () => {
            if (!this.isRunning) return;

            if (duration && Date.now() - startTime > duration) {
                console.log('⏰ Monitoring duration completed');
                this.stopMonitoring();
                return;
            }

            checkCount++;
            console.log(`🔄 Check #${checkCount}`);
            await this.runHealthCheck();
            console.log('');

            if (this.isRunning) {
                setTimeout(monitoringLoop, MONITOR_INTERVAL);
            }
        };

        // Run initial check
        await monitoringLoop();
    }

    stopMonitoring() {
        this.isRunning = false;
        console.log('🛑 Uptime monitoring stopped');
        this.generateReport();
    }

    async runOnce() {
        console.log('🔍 Running one-time health check...\n');
        await this.runHealthCheck();
        this.generateReport();
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const monitor = new UptimeMonitor();

    if (args.includes('--once')) {
        monitor.runOnce();
    } else if (args.includes('--duration')) {
        const durationIndex = args.indexOf('--duration');
        const duration = parseInt(args[durationIndex + 1]) * 60 * 1000; // Convert minutes to ms
        monitor.startMonitoring(duration);
    } else {
        // Default: run for 1 hour
        monitor.startMonitoring(60 * 60 * 1000);
    }

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Received SIGINT, stopping monitoring...');
        monitor.stopMonitoring();
        process.exit(0);
    });
}

module.exports = { UptimeMonitor };