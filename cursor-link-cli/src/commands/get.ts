import chalk from 'chalk';
import ora from 'ora';
import { AuthManager } from '../utils/auth-client.js';

function resolveBaseUrl(): string {
	const manager = new AuthManager();
	// Prefer env var, then token-persisted base, then production default
	try {
		// Reuse logic from AuthManager via getStoredToken
		const token = manager.getStoredToken();
		if (process.env.CURSOR_LINK_URL && process.env.CURSOR_LINK_URL.trim().length > 0) {
			return process.env.CURSOR_LINK_URL;
		}
		if (token?.server_base_url && token.server_base_url.trim().length > 0) {
			return token.server_base_url;
		}
	} catch {}
	return (process.env.CURSOR_LINK_URL && process.env.CURSOR_LINK_URL.trim().length > 0)
		? (process.env.CURSOR_LINK_URL as string)
		: 'https://cursor.link';
}

function isLikelySlug(input: string): boolean {
	// slug looks like "some-title-abc" where last segment length is 3
	const idx = input.lastIndexOf('-');
	return idx > 0 && idx < input.length - 1 && input.slice(idx + 1).length === 3;
}

export async function getCommand(identifier: string) {
	try {
		if (!identifier || typeof identifier !== 'string') {
			console.log(chalk.red('❌ Please provide a rule slug or id'));
			console.log(chalk.gray('Usage: cursor-link get <slug-or-id>'));
			process.exit(1);
		}

		const baseUrl = resolveBaseUrl();
		const spinner = ora('Fetching rule...').start();

		let url = '';
		if (isLikelySlug(identifier)) {
			url = `${baseUrl}/api/rule/${encodeURIComponent(identifier)}`;
		} else {
			// Treat as ID; prefer registry universal item (JSON) if available; fallback to raw mdc
			url = `${baseUrl}/api/registry/rules/${encodeURIComponent(identifier)}`;
		}

		let res = await fetch(url);
		if (!res.ok && !isLikelySlug(identifier)) {
			// Fallback to raw file variant
			res = await fetch(`${baseUrl}/api/registry/${encodeURIComponent(identifier)}`);
		}

		if (!res.ok) {
			spinner.fail('Failed to fetch');
			const text = await res.text().catch(() => '');
			console.log(chalk.red(`❌ ${res.status} ${res.statusText}`));
			if (text) console.log(chalk.gray(text));
			process.exit(1);
		}

		spinner.stop();
		const contentType = res.headers.get('content-type') || '';
		if (contentType.includes('application/json')) {
			const json: unknown = await res.json().catch(() => ({}));
			const files = (json && typeof json === 'object' && Array.isArray((json as any).files)) ? (json as any).files as Array<any> : null;
			if (files && files[0] && typeof files[0].content === 'string') {
				console.log(files[0].content);
			} else if (json && typeof json === 'object' && typeof (json as any).content === 'string') {
				// Slug endpoint returns JSON with a `content` field
				console.log((json as any).content as string);
			} else {
				console.log(JSON.stringify(json, null, 2));
			}
		} else {
			const text = await res.text();
			console.log(text);
		}
	} catch (error: any) {
		console.error(chalk.red(`❌ ${error.message}`));
		process.exit(1);
	}
}
