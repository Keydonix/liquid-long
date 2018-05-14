const DEFAULT_LEVERAGE_MULTIPLIER = 2.0
const DEFAULT_LEVERAGE_SIZE_IN_ETH = 1

/**
 * @typedef {Object} Transaction
 * @property {string} from
 * @property {string} to
 * @property {string} gas
 * @property {string} gasPrice
 * @property {string} value
 * @property {string} data
 *
 * @typedef {Object} JsonRpc
 * @property {'2.0'} jsonrpc
 * @property {number} id
 * @property {'eth_call'} method
 * @property {string} from
 * @property {Transaction[]} params
 *
 * @typedef {Object} State
 * @property {number} priceOfEthInUsd
 * @property {number} minLimitPriceOfEthInDai
 * @property {number} maxLimitPriceOfEthInDai
 * @property {number} estimatedPriceOfEthInDai
 * @property {number} limitPriceOfEthInDai
 * @property {number} leverageMultiplier
 * @property {number} leverageSizeInEth
 * @property {number} liquidationPriceOfEthInDai
 * @property {number} providerFeeInEth
 * @property {number} exchangeCostInEth
 * @property {number} totalCostInEth
 * @property {boolean} updatesPending
 */

function round(number, precision) {
	var shift = function (number, precision) {
		var numArray = ("" + number).split("e");
		return +(numArray[0] + "e" + (numArray[1] ? (+numArray[1] + precision) : precision));
	};
	return shift(Math.round(shift(number, +precision)), -precision);
}

function randomAround(center, range) {
	return (Math.random() * range) + center - (range / 2)
}

function randomAbove(minimum, range) {
	return (Math.random() * range) + minimum
}

function randomBelow(maximum, range) {
	return (Math.random() * range) + maximum - range
}

function require(constraint, message) {
	if (!constraint) throw new Error(`Constraint failed.${(message === undefined) ? '' : `  ${message}`}`);
}

/** @param {string} value */
function leftPad64Zeros(value) {
	require(typeof value === 'string', `typeof ${value} === 'string'`)
	require(value.length <= 64, `${value.length} <= 64`)
	require(value.length > 0, `${value.length} > 0`)
	require(/^[a-zA-Z0-9]*$/.test(value), `/[a-zA-Z0-9]{1,64}/.test(${value})`)
	return ('0000000000000000000000000000000000000000000000000000000000000000' + value).slice(-64)
}

/** @param {number} value */
function abiEncodeNumber(value) {
	return leftPad64Zeros(value.toString(16))
}

/** @param {JsonRpc} options */
async function sendAsync(options) {
	return new Promise((resolve, reject) => {
		web3.currentProvider.sendAsync(options, (error, response) => {
			if (response !== undefined && response.result !== undefined) {
				resolve(response.result)
			} else if (error !== undefined && error !== null) {
				reject(error)
			} else if (response.error !== undefined) {
				reject(response.error)
			} else {
				reject(`Unexpected sendAsync callback parameters.\n${error}\n${response}`)
			}
		})
	})
}

/** @param {Transaction} transaction */
async function ethCall(transaction) {
	if (transaction.from === undefined) transaction.from = '0x0000000000000000000000000000000000000000'
	const payload = {
		jsonrpc: '2.0',
		id: new Date().getTime(),
		method: 'eth_call',
		params: [transaction, 'latest']
	}
	const result = await sendAsync(payload)
	if (result === '0x') throw new Error(`eth_call execution failed, 0x was returned.`);
	return result
}

/** @param {number} milliseconds */
async function sleep(milliseconds) {
	return new Promise(resolve => setTimeout(resolve, milliseconds))
}

export class Maker {
	constructor(tubAddress) {
		this.tubAddress = tubAddress

		this.getEthDaiPrice = async () => {
			const getMedianizerAddress = async () => {
				// address public pip;
				const pipSignatureHash = 'd741e2f9'
				const transaction = {
					to: `0x${this.tubAddress}`,
					data: `0x${pipSignatureHash}`
				}
				const result = await ethCall(transaction)
				require(/^0x[a-zA-Z0-9]{64}$/.test(result), `/^0x[a-zA-Z0-9]{64}$/.test(${result})`)
				return result.substr(-40)
			}

			const readPriceFeed = async (medianizerAddress) => {
				// function read() constant returns (bytes32) {}
				const readSignatureHash = '57de26a4'
				const transaction = {
					to: `0x${medianizerAddress}`,
					data: `0x${readSignatureHash}`
				}
				const stringResult = await ethCall(transaction)
				require(/^0x[a-zA-Z0-9]{1,64}$/.test(stringResult), `/^0x[a-zA-Z0-9]{1,64}$/.test(${stringResult})`)
				// stringResult is a number in the range [0.00, 1,000,000,000,000.00] * 10^18. This means the number will be precise within a double before the division, and the division will remain precise.  Also, if we are off by a tiny amount we don't actually care.
				return parseInt(stringResult, 16) / 10**18
			}

			return await readPriceFeed(await getMedianizerAddress())
		}
	}
}

export class Oasis {
	constructor(oasisAddress, wethAddress, daiAddress) {
		this.oasisAddress = oasisAddress
		this.wethAddress = wethAddress
		this.daiAddress = daiAddress

		this.getBuyAmount = async (daiToDraw) => {
			// FIXME: figure out how to handle daiToDraw being larger than available volume on Oasis
			// function getBuyAmount(address, address, uint256) {}
			const getBuyAmountSignatureHash = '144a2752'
			// rounding of daiToDraw is fine because all of this is used for giving the user an estimate, not an exact number
			const attodaiToDraw = abiEncodeNumber(daiToDraw * 10**18)
			const account = web3.eth.accounts[0]
			const transaction = {
				to: `0x${this.oasisAddress}`,
				data: `0x${getBuyAmountSignatureHash}${leftPad64Zeros(this.wethAddress)}${leftPad64Zeros(this.daiAddress)}${abiEncodeNumber(attodaiToDraw)}`,
			}
			const stringResult = await ethCall(transaction)
			require(/^0x[a-zA-Z0-9]{1,64}$/.test(stringResult), `/^0x[a-zA-Z0-9]{1,64}$/.test(${stringResult})`)
			// stringResult could be a number that doesn't fit into a double, but the UI doesn't care about losing some precision since we are using this to give the user a recommendation for what they will end up paying, and we are truncating to 2 decimals in the UI anyway
			return parseInt(stringResult, 16) / 10**18
		}
	}
}

export class Presentor {
	constructor() {
		/**
		 * Turn a state object into a rendered scene.  This function shouldn't be doing anything particularly complex as that could lead to things getting out of sync, it should just be displaying current state.
		 * @param {State} state
		 */
		this.render = (state) => {
			const numberOfEthDecimals = round(Math.log10(state.priceOfEthInUsd), 0) + 1
			// TODO: if web3.currentProvider not present, prompt user to use a web3 enabled browser
			// TODO: if priceOfEthInUsd is NaN, then display loading spinner
			// FIXME: if estimatedPriceOfEthInDai is NaN, it could mean we need a spinner (not yet fetched price data) or it could mean that no DAI is being drawn
			// TODO: if estimatedPriceOfEthInDai is infinity, let user know why
			this.ethPrice.innerText = round(state.priceOfEthInUsd, 2)
			this.estimatedEthPrice.innerText = round(state.estimatedPriceOfEthInDai, 2)
			this.limitEthPrice.setAttribute('min', round(state.minLimitPriceOfEthInDai, 2))
			this.limitEthPrice.setAttribute('max', round(state.maxLimitPriceOfEthInDai, 2))
			this.limitEthPrice.setAttribute('placeholder', round(state.estimatedPriceOfEthInDai, 2))
			this.liquidationPrice.innerText = round(state.liquidationPriceOfEthInDai, 2)
			this.feeProvider.innerText = round(state.providerFeeInEth, numberOfEthDecimals)
			this.feeExchange.innerText = round(state.exchangeCostInEth, numberOfEthDecimals)
			this.feeTotal.innerText = round(state.totalCostInEth, numberOfEthDecimals)

			// update input boxes (for clamping/defaulting) _unless_ they have focus (don't mess with them while user is editing)
			if (this.limitEthPrice !== document.activeElement) this.limitEthPrice.value = round(state.limitPriceOfEthInDai, 2)
			if (this.leverageMultiplier !== document.activeElement) this.leverageMultiplier.value = state.leverageMultiplier
			if (this.leverageSize !== document.activeElement) this.leverageSize.value = state.leverageSizeInEth
		}
	}

	get ethPrice() { return document.getElementById('eth-price') }
	get estimatedEthPrice() { return document.getElementById('estimated-eth-price') }
	get limitEthPrice() { return document.getElementById('limit-eth-price') }
	get leverageMultiplier() { return document.getElementById('leverage-multiplier') }
	get leverageSize() { return document.getElementById('leverage-size') }
	get liquidationPrice() { return document.getElementById('liquidation-price') }
	get feeProvider() { return document.getElementById('fee-provider') }
	get feeExchange() { return document.getElementById('fee-exchange') }
	get feeTotal() { return document.getElementById('fee-total') }
}

export class Mutator {
	constructor() {
		/** @param {State} state */
		this.cdpSize = (state) => state.leverageMultiplier * state.leverageSizeInEth
		/** @param {State} state */
		this.loanSize = (state) => this.cdpSize(state) - state.leverageSizeInEth
		/** @param {State} state */
		this.daiToDraw = (state) => this.loanSize(state) * state.priceOfEthInUsd
		/** @param {State} state */
		this.proceedsOfDaiSaleInEth = (state) => this.daiToDraw(state) / state.limitPriceOfEthInDai

		/**
		 * @param {State} oldState
		 * @param {State} stateUpdate
		 */
		this.update = (oldState, stateUpdate) => {
			// blindly apply the state update object to the old state object, we'll take steps to sanitize after
			const newState = Object.assign({}, oldState, stateUpdate)

			// sanitize user input values
			if (isNaN(newState.limitPriceOfEthInDai)) newState.limitPriceOfEthInDai = newState.estimatedPriceOfEthInDai
			if (newState.limitPriceOfEthInDai < newState.priceOfEthInUsd) newState.limitPriceOfEthInDai = newState.priceOfEthInUsd
			if (isNaN(newState.leverageMultiplier)) newState.leverageMultiplier = 2
			if (newState.leverageMultiplier < 1) newState.leverageMultiplier = 1
			if (newState.leverageMultiplier > 3) newState.leverageMultiplier = 3
			if (isNaN(newState.leverageSizeInEth)) newState.leverageSizeInEth = 1
			if (newState.leverageSizeInEth <= 0) newState.leverageSizeInEth = 0

			// compute derived values
			newState.minLimitPriceOfEthInDai = newState.priceOfEthInUsd
			newState.maxLimitPriceOfEthInDai = newState.priceOfEthInUsd * 2
			newState.liquidationPriceOfEthInDai = 1.5 * this.daiToDraw(newState) / this.cdpSize(newState)
			newState.providerFeeInEth = this.loanSize(newState) * 0.01
			newState.exchangeCostInEth = this.loanSize(newState) - this.proceedsOfDaiSaleInEth(newState)
			newState.totalCostInEth = newState.providerFeeInEth + newState.exchangeCostInEth + newState.leverageSizeInEth

			return newState
		}
	}
}

export class CdpOpener {
	/**
	 * @param {Presentor} presentor
	 * @param {Mutator} mutator
	 * @param {Maker} maker
	 * @param {Oasis} oasis
	 */
	constructor(presentor, mutator, maker, oasis) {
		this.presentor = presentor
		this.mutator = mutator
		this.maker = maker
		this.oasis = oasis

		/** @type State */
		this.state = {
			priceOfEthInUsd: NaN,
			minWorstPriceOfEth: NaN,
			maxWorstPriceOfEth: NaN,
			estimatedPriceOfEthInDai: NaN,
			limitPriceOfEthInDai: NaN,
			leverageMultiplier: 2.0,
			leverageSizeInEth: 1.0,
			liquidationPriceOfEthInUsd: NaN,
			providerFeeInEth: 0.01,
			exchangeCostInEth: NaN,
			totalCostInEth: NaN,
			updatesPending: true,
		}

		/** @param {State} stateUpdate */
		this.updateAndRender = (stateUpdate) => {
			// create an updated state object
			const oldState = this.state
			this.state = this.mutator.update(oldState, stateUpdate);

			// trigger cascading updates if dependency has changed
			if (this.mutator.daiToDraw(this.state) !== this.mutator.daiToDraw(oldState)) {
				this.updateDaiSaleProceeds(this.mutator.daiToDraw(this.state)).catch(console.error)
				this.state.updatesPending = true
			}

			// apply the new state to the DOM
			this.presentor.render(this.state)
		}

		this.createCdp = () => {
			// TODO: validate all values
			// TODO: beware of onblur event firing after the onclick event causing submission with stale values!
			console.log('TODO: write CDP creation code')
		}

		this.updatePriceFeed = async () => {
			const priceOfEthInUsd = await this.maker.getEthDaiPrice()
			this.updateAndRender({ priceOfEthInUsd: priceOfEthInUsd })
			setTimeout(() => this.updatePriceFeed().catch(console.error), 1000)
		}

		/** @param {number} daiToDraw */
		this.updateDaiSaleProceeds = async (daiToDraw) => {
			const daiSaleProceeds = await this.oasis.getBuyAmount(daiToDraw);
			const estimatedPriceOfEthInDai = daiToDraw / daiSaleProceeds
			this.updateAndRender({ estimatedPriceOfEthInDai: estimatedPriceOfEthInDai })
		}

		/** @param {string} newValue */
		this.limitEthPriceChanged = (newValue) => {
			this.updateAndRender({ limitPriceOfEthInDai: parseFloat(newValue) })
		}

		/** @param {string} newValue */
		this.leverageMultiplierChanged = (newValue) => {
			this.updateAndRender({ leverageMultiplier: parseFloat(newValue) })
		}

		/** @param {string} newValue */
		this.leverageSizeChanged = (newValue) => {
			this.updateAndRender({ leverageSizeInEth: parseFloat(newValue) })
		}

		this.onLoad = (window, event) => {
			this.updatePriceFeed().catch(console.error)
		}
	}
}

const presentor = new Presentor()
const mutator = new Mutator()
const maker = new Maker('448a5065aebb8e423f0896e6c5d525c040f59af3')
const oasis = new Oasis('14fbca95be7e99c15cc2996c6c9d841e54b79425', 'c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', '89d24a6b4ccb1b6faa2625fe562bdd9a23260359')
const cdpOpener = new CdpOpener(presentor, mutator, maker, oasis)
window.addEventListener('load', cdpOpener.onLoad, { once: true })
window.createCdp = cdpOpener.createCdp
window.limitEthPriceChanged = cdpOpener.limitEthPriceChanged
window.leverageMultiplierChanged = cdpOpener.leverageMultiplierChanged
window.leverageSizeChanged = cdpOpener.leverageSizeChanged
