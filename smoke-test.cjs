#!/usr/bin/env node

/**
 * Smoke Test Suite for BananaLeaf
 * Quick verification that core functionality works
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const REPORTS_DIR = path.join(__dirname, 'reports');

// Test scenarios
const TEST_SCENARIOS = [
    {
        name: 'Homepage Load',
        url: '/',
        checks: [
            { type: 'text', selector: 'body', text: 'BananaLeaf' },
            { type: 'text', selector: 'h3', text: 'Master Inventory' },
            { type: 'navigation', links: ['Legal Compliance', 'Retailer OS', 'User Profile'] }
        ]
    },
    {
        name: 'Legal Pages',
        url: '/legal',
        checks: [
            { type: 'text', selector: 'h1', text: 'Terms of Service' },
            { type: 'text', selector: 'body', text: 'Privacy Policy' },
            { type: 'text', selector: 'body', text: 'Age Policy' },
            { type: 'element', selector: 'button', text: 'Back to App' }
        ]
    },
    {
        name: 'User Profile',
        url: '/profile',
        checks: [
            { type: 'text', selector: 'h1', text: 'User Profile' },
            { type: 'element', selector: '[data-testid="profile-tabs"]' },
            { type: 'text', selector: 'body', text: 'Account Overview' }
        ]
    },
    {
        name: 'Vendor Dashboard',
        url: '/vendor',
        checks: [
            { type: 'text', selector: 'body', text: 'Retailer OS' },
            { type: 'element', selector: '[data-testid="vendor-dashboard"]' }
        ]
    },
    {
        name: 'Admin Dashboard',
        url: '/admin',
        checks: [
            { type: 'text', selector: 'body', text: 'Admin OS' },
            { type: 'element', selector: '[data-testid="admin-dashboard"]' }
        ]
    },
    {
        name: 'Click-Through Key Paths',
        url: '/',
        checks: [
            { type: 'text', selector: 'footer', text: 'Marketplace' }
        ],
        clickActions: true
    }
];

class SmokeTester {
    constructor() {
        this.results = [];
        this.browser = null;
        this.ensureReportsDirectory();
    }

    ensureReportsDirectory() {
        if (!fs.existsSync(REPORTS_DIR)) {
            fs.mkdirSync(REPORTS_DIR, { recursive: true });
        }
    }

    async initBrowser() {
        this.browser = await puppeteer.chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
    }

    async closeBrowser() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async runCheck(page, check) {
        try {
            switch (check.type) {
                case 'text': {
                    await page.waitForSelector(check.selector, { timeout: 8000 });
                    const text = await page.$eval(check.selector, el => el.textContent || '');
                    return text.includes(check.text);
                }
                case 'element': {
                    const element = await page.$(check.selector);
                    if (!element) return false;
                    if (check.text) {
                        const elementText = await page.evaluate(el => el.textContent || '', element);
                        return elementText.includes(check.text);
                    }
                    return true;
                }
                case 'navigation': {
                    for (const link of check.links) {
                        const linkSelector = `a[href='${link}'], button:has-text('${link}'), [role='link']:has-text('${link}')`;
                        const linkEl = await page.$(linkSelector);
                        if (!linkEl) {
                            return false;
                        }
                    }
                    return true;
                }
                default:
                    return false;
            }
        } catch (error) {
            console.error(`Check failed: ${check.type} - ${error.message}`);
            return false;
        }
    }

    async runClickActions(page) {
        try {
            // Click legal compliance from the top nav
            await this.clickByText(page, 'Legal Compliance');
            await page.waitForTimeout(500);
            await page.waitForSelector('h1');
            const termsText = await page.$eval('h1', el => el.textContent || '');
            if (!termsText.toLowerCase().includes('terms')) throw new Error('Terms of Service not loaded');

            // Click privacy card
            await this.clickByText(page, 'Privacy Policy');
            await page.waitForTimeout(500);
            const privacyH1 = await page.$eval('h1', el => el.textContent || '');
            if (!privacyH1.toLowerCase().includes('privacy')) throw new Error('Privacy Policy not loaded');

            // Go back to app
            await this.clickByText(page, 'Back to App');
            await page.waitForTimeout(500);

            // Click flavor explorer button
            await this.clickByText(page, 'Flavor DNA Engine');
            await page.waitForTimeout(500);

            // Click first product card (if exists)
            const cardExists = await page.$('div.cursor-pointer.group');
            if (cardExists) {
                await page.evaluate(() => {
                    const card = document.querySelector('div.cursor-pointer.group');
                    if (card) card.click();
                });
                await page.waitForTimeout(500);
            }

            return true;
        } catch (error) {
            console.error('Click actions failed:', error.message);
            return false;
        }
    }

    async clickByText(page, textToFind) {
        const elementHandle = await page.evaluateHandle((text) => {
            const candidates = Array.from(document.querySelectorAll('a, button, span, div'));
            return candidates.find(el => (el.textContent || '').trim() === text) || null;
        }, textToFind);

        if (!elementHandle) {
            throw new Error(`Clickable element not found: ${textToFind}`);
        }

        const element = elementHandle.asElement();
        if (!element) {
            throw new Error(`Element handle not clickable: ${textToFind}`);
        }

        await element.click();
        await page.waitForTimeout(300);
    }

    async runScenario(scenario) {
        console.log(`🧪 Running: ${scenario.name}`);

        const page = await this.browser.newPage();
        const startTime = Date.now();
        let passed = 0;
        let failed = 0;
        const checkResults = [];

        try {
            // Set a reasonable timeout
            page.setDefaultTimeout(10000);

            // Navigate to the page
            await page.goto(`${BASE_URL}${scenario.url}`, { waitUntil: 'networkidle' });

            // Run all checks
            for (const check of scenario.checks) {
                const checkPassed = await this.runCheck(page, check);
                checkResults.push({
                    check: `${check.type}: ${check.selector || check.text}`,
                    passed: checkPassed
                });

                if (checkPassed) {
                    passed++;
                } else {
                    failed++;
                }
            }

            // Run click-through paths if required
            if (scenario.clickActions) {
                const clickPass = await this.runClickActions(page);
                if (clickPass) {
                    passed++;
                } else {
                    failed++;
                }
                checkResults.push({ check: 'clickActions', passed: clickPass });
            }

        } catch (error) {
            console.error(`❌ Scenario failed: ${error.message}`);
            failed = scenario.checks.length + (scenario.clickActions ? 1 : 0);
        } finally {
            await page.close();
        }

        const duration = Date.now() - startTime;
        const result = {
            scenario: scenario.name,
            url: `${BASE_URL}${scenario.url}`,
            passed,
            failed,
            total: scenario.checks.length,
            duration,
            success: failed === 0,
            checks: checkResults
        };

        this.results.push(result);
        return result;
    }

    printResult(result) {
        const status = result.success ? '✅' : '❌';
        const percentage = Math.round((result.passed / result.total) * 100);

        console.log(`${status} ${result.scenario} - ${result.passed}/${result.total} checks passed (${percentage}%) - ${result.duration}ms`);
    }

    async runAllTests() {
        console.log('🚀 Starting smoke test suite...\n');

        await this.initBrowser();

        try {
            for (const scenario of TEST_SCENARIOS) {
                const result = await this.runScenario(scenario);
                this.printResult(result);
            }
        } finally {
            await this.closeBrowser();
        }

        this.generateReport();
        this.printSummary();
    }

    generateReport() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(REPORTS_DIR, `smoke-test-${timestamp}.json`);

        const report = {
            timestamp: new Date().toISOString(),
            baseUrl: BASE_URL,
            results: this.results,
            summary: {
                totalScenarios: this.results.length,
                passedScenarios: this.results.filter(r => r.success).length,
                failedScenarios: this.results.filter(r => !r.success).length,
                totalChecks: this.results.reduce((sum, r) => sum + r.total, 0),
                passedChecks: this.results.reduce((sum, r) => sum + r.passed, 0),
                failedChecks: this.results.reduce((sum, r) => sum + r.failed, 0),
                averageDuration: Math.round(this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length)
            }
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    }

    printSummary() {
        const passedScenarios = this.results.filter(r => r.success).length;
        const totalScenarios = this.results.length;
        const passedChecks = this.results.reduce((sum, r) => sum + r.passed, 0);
        const totalChecks = this.results.reduce((sum, r) => sum + r.total, 0);

        console.log('\n📊 Smoke Test Summary:');
        console.log('='.repeat(50));
        console.log(`Scenarios: ${passedScenarios}/${totalScenarios} passed`);
        console.log(`Checks: ${passedChecks}/${totalChecks} passed`);
        console.log(`Success Rate: ${Math.round((passedChecks / totalChecks) * 100)}%`);

        if (passedScenarios === totalScenarios) {
            console.log('🎉 All smoke tests passed!');
        } else {
            console.log('\n❌ Failed scenarios:');
            this.results.filter(r => !r.success).forEach(result => {
                console.log(`   ${result.scenario}`);
                result.checks.filter(c => !c.passed).forEach(check => {
                    console.log(`     - ${check.check}`);
                });
            });
        }
    }
}

// CLI interface
if (require.main === module) {
    const tester = new SmokeTester();
    tester.runAllTests().catch(error => {
        console.error('Smoke test failed:', error);
        process.exit(1);
    });
}

module.exports = { SmokeTester };