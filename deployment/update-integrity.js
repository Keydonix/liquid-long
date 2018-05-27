const ssri = require('ssri')
const fs = require('fs')
const path = require('path')

/**
 * @param {string} path
 * @param {{ encoding?: string | null; flag?: string; } | string | undefined | null} options
 */
async function readFile(path, options) {
	return new Promise((resolve, reject) => {
		fs.readFile(path, options, (error, result) => {
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

/**
 * @param {string} path
 * @param {any} contents
 * @param {{ encoding?: string | null; mode?: number | string; flag?: string; } | string | undefined | null} options
 */
async function writeFile(path, contents, options) {
	return new Promise((resolve, reject) => {
		fs.writeFile(path, contents, options, (error) => {
			if (error) {
				reject(error)
			} else {
				resolve()
			}
		})
	})
}

async function updateIntegrityHash() {
	const cssFilePath = path.join(__dirname, '../client/index.css')
	const jsFilePath = path.join(__dirname, '../client/index.js')
	const htmlFilePath = path.join(__dirname, '../client/index.html')

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
