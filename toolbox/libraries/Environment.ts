export function getEnv(name: string, fallback?: string): string {
	const value = process.env[name]
	if (value !== undefined) return value
	if (fallback === undefined) throw new Error(`${name} environment variable required`)
	return fallback
}
