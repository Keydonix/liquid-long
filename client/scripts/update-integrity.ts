import ssri = require('ssri')
import fs = require('fs')
import path = require('path')

async function readFile(path: string, options: { encoding: string; flag?: string; } | string): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		fs.readFile(path, options, (error: NodeJS.ErrnoException, result: string) => {
			if (error && !result) {
				reject(error)
			} else if (result && !error) {
				resolve(result)
			} else {
				reject(`fs.readFile returned both an error and data!\n${result}\n${error}`)
			}
		})
	})
}

async function writeFile(path: string, contents: any, options: { encoding?: string | null; mode?: number | string; flag?: string; } | string | undefined | null): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		fs.writeFile(path, contents, options, (error: any) => {
			if (error) {
				reject(error)
			} else {
				resolve()
			}
		})
	})
}

async function updateIntegrityHash() {
	const cssFilePath = path.join(__dirname, '../source/index.css')
	const jsFilePath = path.join(__dirname, '../source/index.js')
	const htmlFilePath = path.join(__dirname, '../source/index.html')

	// calculate the integrity hash for the javascript and css files
	const cssIntegrity = await ssri.fromStream(fs.createReadStream(cssFilePath, 'utf8'), { algorithms: ['sha384'], strict: true, single: true })
	const jsIntegrity = await ssri.fromStream(fs.createReadStream(jsFilePath, 'utf8'), { algorithms: ['sha384'], strict: true, single: true })

	// replace the integrity hash in the html file
	const oldHtml = await readFile(htmlFilePath, 'utf8')
	const newHtml = oldHtml
		.replace(/<link href="index\.css" rel="stylesheet" type="text\/css"[^>]*>/g, `<link href="index.css" rel="stylesheet" type="text/css" integrity="${cssIntegrity.toString()}">`)
		.replace(/<script src="index\.js" type="module"[^>]*><\/script>/g, `<script src="index.js" type="module" integrity="${jsIntegrity.toString()}"><\/script>`)
	await writeFile(htmlFilePath, newHtml, 'utf8')
}

updateIntegrityHash().then(() => {
	process.exit(0)
}).catch(error => {
	console.log(error)
	process.exit(1)
})
