const ssri = require('ssri')
const fs = require('fs')
const path = require('path')

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

async function writeFile(path, contents, options) {
	return new Promise((resolve, reject) => {
		fs.writeFile(path, contents, options, (error, result) => {
			if (error) {
				reject(error)
			} else {
				resolve(result)
			}
		})
	})
}

async function updateIntegrityHash() {
	const jsFilePath = path.join(__dirname, '../client/index.js')
	const htmlFilePath = path.join(__dirname, '../client/index.html')

	// calculate the integrity hash for the javascript file
	const integrity = await ssri.fromStream(fs.createReadStream(jsFilePath, 'utf8'), { algorithms: ['sha384']})

	// replace the integrity hash in the html file
	const oldHtml = await readFile(htmlFilePath, 'utf8')
	const newHtml = oldHtml.replace(/<script src="index.js" type="module"[^>]*><\/script>/g, `<script src="index.js" type="module" integrity="${integrity.toString()}"><\/script>`)
	await writeFile(htmlFilePath, newHtml, 'utf8')
}

updateIntegrityHash().then(() => {
	process.exit(0)
}).catch(error => {
	console.log(error)
	process.exit(1)
})
