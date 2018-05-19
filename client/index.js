'use strict';

/**
 * @param {number} number
 * @param {number} precision
 */
function round(number, precision) {
	/**
	 * @param {number} number
	 * @param {number} precision
	 */
	var shift = function (number, precision) {
		var numArray = ("" + number).split("e");
		return +(numArray[0] + "e" + (numArray[1] ? (+numArray[1] + precision) : precision));
	};
	return shift(Math.round(shift(number, +precision)), -precision);
}

/**
 * @param {boolean} constraint
 * @param {string} [message]
 */
function assert(constraint, message) {
	if (!constraint) throw new Error(`Constraint failed.${(message === undefined) ? '' : `  ${message}`}`);
}

/** @param {string} value */
function leftPad64Zeros(value) {
	assert(typeof value === 'string', `typeof ${value} === 'string'`)
	assert(value.length <= 64, `${value.length} <= 64`)
	assert(value.length > 0, `${value.length} > 0`)
	assert(/^[a-zA-Z0-9]*$/.test(value), `/[a-zA-Z0-9]{1,64}/.test(${value})`)
	return ('0000000000000000000000000000000000000000000000000000000000000000' + value).slice(-64)
}

/** @param {number} value */
function abiEncodeNumber(value) {
	return leftPad64Zeros(value.toString(16))
}

/** @param {JsonRpcRequest} jsonRpc */
async function sendAsyncWeb3(jsonRpc) {
	assert(window.web3 !== undefined, `web3.currentProvider is undefined`)
	assert(window.web3.currentProvider !== undefined, `web3.currentProvider is undefined`)
	return new Promise((resolve, reject) => {
		window.web3.currentProvider.sendAsync(jsonRpc, (error, response) => {
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

/** @param {JsonRpcRequest} jsonRpc */
async function sendAsyncHosted(jsonRpc) {
	const response = await fetch('http://parity.zoltu.com:8545', {
		method: 'POST',
		headers: new Headers({
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		}),
		body: JSON.stringify(jsonRpc),
	})
	if (!response.ok) throw new Error(`Response contained non-success status code: ${response.status} ${response.statusText}\nRequest:\n${JSON.stringify(jsonRpc)}\nResponse:\n${await response.text()}`)
	const body = await response.json()
	if (body.error !== undefined) throw new Error(`RPC error: ${body.error.code} ${body.error.message}\nRequest:\n${JSON.stringify(jsonRpc)}\nResponse:\n${JSON.stringify(body)}`)
	assert(body.result !== undefined, `Malformed RPC response: result undefined\nRequest:\n${JSON.stringify(jsonRpc)}\nResponse:\n${JSON.stringify(body)}`)
	return body.result
}

/**
 * @param {JsonRpcRequest} jsonRpc
 * @param {boolean} [signerRequired]
 */
async function sendAsync(jsonRpc, signerRequired) {
	return ((window.web3 !== undefined && window.web3.currentProvider !== undefined) || signerRequired === true)
		? sendAsyncWeb3(jsonRpc)
		: sendAsyncHosted(jsonRpc)
}

/** @param {Transaction} transaction */
async function ethCall(transaction) {
	if (transaction.from === undefined) transaction.from = '0x0000000000000000000000000000000000000000'
	/** @type {JsonRpcRequest} */
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
	/** @param {string} tubAddress */
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
				assert(/^0x[a-zA-Z0-9]{64}$/.test(result), `/^0x[a-zA-Z0-9]{64}$/.test(${result})`)
				return result.substr(-40)
			}

			/** @param {string} medianizerAddress */
			const readPriceFeed = async (medianizerAddress) => {
				// function read() constant returns (bytes32) {}
				const readSignatureHash = '57de26a4'
				const transaction = {
					to: `0x${medianizerAddress}`,
					data: `0x${readSignatureHash}`
				}
				const stringResult = await ethCall(transaction)
				assert(/^0x[a-zA-Z0-9]{1,64}$/.test(stringResult), `/^0x[a-zA-Z0-9]{1,64}$/.test(${stringResult})`)
				// stringResult is a number in the range [0.00, 1,000,000,000,000.00] * 10^18. This means the number will be precise within a double before the division, and the division will remain precise.  Also, if we are off by a tiny amount we don't actually care.
				return parseInt(stringResult, 16) / 10 ** 18
			}

			return await readPriceFeed(await getMedianizerAddress())
		}

		Object.freeze(this)
	}
}

export class Oasis {
	/**
	 * @param {string} oasisAddress
	 * @param {string} wethAddress
	 * @param {string} daiAddress
	 */
	constructor(oasisAddress, wethAddress, daiAddress) {
		this.oasisAddress = oasisAddress
		this.wethAddress = wethAddress
		this.daiAddress = daiAddress

		/** @param {number} daiToDraw */
		this.getBuyAmount = async (daiToDraw) => {
			// function getBuyAmount(address, address, uint256) {}
			const getBuyAmountSignatureHash = '144a2752'
			// rounding of daiToDraw is fine because all of this is used for giving the user an estimate, not an exact number
			const attodaiToDraw = abiEncodeNumber(daiToDraw * 10 ** 18)
			const transaction = {
				to: `0x${this.oasisAddress}`,
				data: `0x${getBuyAmountSignatureHash}${leftPad64Zeros(this.wethAddress)}${leftPad64Zeros(this.daiAddress)}${attodaiToDraw}`,
			}
			try {
				const stringResult = await ethCall(transaction)
				assert(/^0x[a-zA-Z0-9]{1,64}$/.test(stringResult), `/^0x[a-zA-Z0-9]{1,64}$/.test(${stringResult})`)
				// stringResult could be a number that doesn't fit into a double, but the UI doesn't care about losing some precision since we are using this to give the user a recommendation for what they will end up paying, and we are truncating to 2 decimals in the UI anyway
				return parseInt(stringResult, 16) / 10 ** 18
			} catch (error) {
				// this happens if the orderbook doesn't have enough depth to liquidate all of the DAI
				return NaN
			}
		}

		Object.freeze(this)
	}
}

export class Presentor {
	/** @param {StateManager} stateManager */
	constructor(stateManager) {
		this.stateManager = stateManager
		// subscriptions is mutable because we will be lazily populating the callbacks
		this.subscriptions = {
			/** @type {function(string):void} */
			openLimitPriceChanged: undefined,
			/** @type {function(string):void} */
			leverageMultiplierChanged: undefined,
			/** @type {function(string):void} */
			leverageSizeChanged: undefined,
			/** @type {function():void} */
			cdpCreationInitiated: undefined,
		}
		/** Turn a state object into a rendered scene.  This function shouldn't be doing anything particularly complex as that could lead to things getting out of sync, it should just be displaying current state. */
		this.render = () => {
			const state = this.stateManager.getState()
			const numberOfEthDecimals = round(Math.log10(state.priceOfEthInUsd), 0) + 1
			// TODO: if web3.currentProvider not present, prompt user to use a web3 enabled browser
			// TODO: if priceOfEthInUsd is NaN, then display loading spinner
			// FIXME: if estimatedPriceOfEthInDai is NaN, it could mean we need a spinner (not yet fetched price data) or it could mean that no DAI is being drawn
			// TODO: if estimatedPriceOfEthInDai is infinity, let user know why
			if (state.mode === 'opening') {
				this.openCdpNav.className = 'active'
				this.closeCdpNav.className = ''
				this.openCdpForm.hidden = false
				this.closeCdpForm.hidden = true
			} else if(state.mode === 'closing') {
				this.openCdpNav.className = ''
				this.closeCdpNav.className = 'active'
				this.openCdpForm.hidden = true
				this.closeCdpForm.hidden = false
			} else {
				throw new Error(`Unexpected mode: ${state.mode}`)
			}
			this.ethPrice.innerText = round(state.priceOfEthInUsd, 2).toString(10)
			this.estimatedEthPrice.innerText = round(state.estimatedPriceOfEthInDai, 2).toString(10)
			this.limitEthPrice.setAttribute('min', round(state.minLimitPriceOfEthInDai, 2).toString(10))
			this.limitEthPrice.setAttribute('max', round(state.maxLimitPriceOfEthInDai, 2).toString(10))
			this.limitEthPrice.setAttribute('placeholder', round(state.estimatedPriceOfEthInDai, 2).toString(10))
			this.liquidationPrice.innerText = round(state.liquidationPriceOfEthInUsd, 2).toString(10)
			this.feeProvider.innerText = round(state.providerFeeInEth, numberOfEthDecimals).toString(10)
			this.feeExchange.innerText = round(state.exchangeCostInEth, numberOfEthDecimals).toString(10)
			this.feeTotal.innerText = round(state.totalCostInEth, numberOfEthDecimals).toString(10)

			// update input boxes (for clamping/defaulting) _unless_ they have focus (don't mess with them while user is editing)
			if (this.limitEthPrice !== document.activeElement) this.limitEthPrice.value = round(state.limitPriceOfEthInDai, 2).toString(10)
			if (this.leverageMultiplier !== document.activeElement) this.leverageMultiplier.value = state.leverageMultiplier.toString(10)
			if (this.leverageSize !== document.activeElement) this.leverageSize.value = state.leverageSizeInEth.toString(10)
		}

		/** @param {StateUpdate} stateUpdate */
		this.updateAndRender = (stateUpdate) => {
			const changed = this.stateManager.update(stateUpdate)
			if (!changed) return
			this.render()
		}

		/** @param {function(string): void} callback */
		this.subscribeToOpenLimitPriceChanged = (callback) => {
			assert(this.subscriptions.openLimitPriceChanged === undefined, `Only interaction callback supported at a time, did you accidentally double-subscribe?`)
			this.subscriptions.openLimitPriceChanged = callback
		}

		/** @param {function(string): void} callback */
		this.subscribeToLeverageMultiplierChanged = (callback) => {
			assert(this.subscriptions.leverageMultiplierChanged === undefined, `Only interaction callback supported at a time, did you accidentally double-subscribe?`)
			this.subscriptions.leverageMultiplierChanged = callback
		}

		/** @param {function(string): void} callback */
		this.subscribeToLeverageSizeChanged = (callback) => {
			assert(this.subscriptions.leverageSizeChanged === undefined, `Only interaction callback supported at a time, did you accidentally double-subscribe?`)
			this.subscriptions.leverageSizeChanged = callback
		}

		/** @param {function(): void} callback */
		this.subscribeToCdpCreationInitiated = (callback) => {
			this.subscriptions.cdpCreationInitiated = callback
		}

		this.onLoad = () => {
			// CONSIDER: expose subscriptions to navigation here and subscribe to them and update state elsewhere
			//     ?is navigation purely a presentation concern, not part of business logic?
			this.openCdpNav.addEventListener('click', () => this.updateAndRender({ mode: 'opening' }))
			this.closeCdpNav.addEventListener('click', () => this.updateAndRender({ mode: 'closing' }))
			/** @type {function(string):void} */
			const noop = () => {}
			this.limitEthPrice.addEventListener('blur', () => (this.subscriptions.openLimitPriceChanged || noop)(this.limitEthPrice.value))
			this.leverageMultiplier.addEventListener('blur', () => (this.subscriptions.leverageMultiplierChanged || noop)(this.leverageMultiplier.value))
			this.leverageSize.addEventListener('blur', () => (this.subscriptions.leverageSizeChanged || noop)(this.leverageSize.value))
			this.createCdpButton.addEventListener('click', () => this.subscriptions.cdpCreationInitiated())
		}

		window.addEventListener('load', this.onLoad, { once: true })
		Object.freeze(this)
	}

	get openCdpNav() { return document.getElementById('open-cdp-nav') }
	get closeCdpNav() { return document.getElementById('close-cdp-nav') }
	get openCdpForm() { return document.getElementById('open-cdp-form') }
	get closeCdpForm() { return document.getElementById('close-cdp-form') }
	get ethPrice() { return document.getElementById('eth-price') }
	get estimatedEthPrice() { return document.getElementById('estimated-eth-price') }
	get limitEthPrice() { return /** @type {HTMLInputElement} */ (document.getElementById('limit-eth-price')) }
	get leverageMultiplier() { return  /** @type {HTMLInputElement} */ (document.getElementById('leverage-multiplier')) }
	get leverageSize() { return  /** @type {HTMLInputElement} */ (document.getElementById('leverage-size')) }
	get liquidationPrice() { return document.getElementById('liquidation-price') }
	get feeProvider() { return document.getElementById('fee-provider') }
	get feeExchange() { return document.getElementById('fee-exchange') }
	get feeTotal() { return document.getElementById('fee-total') }
	get createCdpButton() { return document.getElementById('create-cdp-button') }
}

export class State {
	/** @param {StateUpdate} source */
	constructor(source) {
		// copy in the source, validating and falling back to defaults as we do
		this._mode = (source.mode === 'opening' || source.mode === 'closing') ? source.mode : 'opening'
		this._updatesPending = (typeof source.updatesPending === 'boolean') ? source.updatesPending : true
		this._priceOfEthInUsd = (Number.isFinite(source.priceOfEthInUsd)) ? source.priceOfEthInUsd : NaN
		this._estimatedPriceOfEthInDai = (Number.isFinite(source.estimatedPriceOfEthInDai)) ? source.estimatedPriceOfEthInDai : NaN
		this._limitPriceOfEthInDai = (Number.isFinite(source.limitPriceOfEthInDai)) ? source.limitPriceOfEthInDai : this._estimatedPriceOfEthInDai
		this._leverageMultiplier = (Number.isFinite(source.leverageMultiplier)) ? source.leverageMultiplier : 2
		this._leverageSizeInEth = (Number.isFinite(source.leverageSizeInEth)) ? source.leverageSizeInEth : 1

		// constrain values
		if (this._limitPriceOfEthInDai < this._priceOfEthInUsd) this._limitPriceOfEthInDai = this._priceOfEthInUsd
		if (this._leverageMultiplier < 1) this._leverageMultiplier = 1
		if (this._leverageMultiplier > 3) this._leverageMultiplier = 3
		if (this._leverageSizeInEth <= 0) this._leverageSizeInEth = 0

		/** @param {StateUpdate} stateUpdate */
		this.update = (stateUpdate) => {
			// fill in the state update with current values using the getters
			return new State({
				mode: stateUpdate.mode || this.mode,
				updatesPending: stateUpdate.updatesPending || this.updatesPending,
				priceOfEthInUsd: stateUpdate.priceOfEthInUsd || this.priceOfEthInUsd,
				estimatedPriceOfEthInDai: stateUpdate.estimatedPriceOfEthInDai || this.estimatedPriceOfEthInDai,
				limitPriceOfEthInDai: stateUpdate.limitPriceOfEthInDai || this.limitPriceOfEthInDai,
				leverageMultiplier: stateUpdate.leverageMultiplier || this.leverageMultiplier,
				leverageSizeInEth: stateUpdate.leverageSizeInEth || this.leverageSizeInEth,
			})
		}

		/** @param {State} other */
		this.equals = (other) => {
			return this._mode === other._mode
				&& this._updatesPending === other._updatesPending
				&& this._priceOfEthInUsd === other._priceOfEthInUsd
				&& this._estimatedPriceOfEthInDai === other._estimatedPriceOfEthInDai
				&& this._limitPriceOfEthInDai === other._limitPriceOfEthInDai
				&& this._leverageMultiplier === other._leverageMultiplier
				&& this._leverageSizeInEth === other._leverageSizeInEth
		}

		// immutability FTW!
		Object.freeze(this)
	}

	get mode() { return this._mode }
	// FIXME: we need a better system for update tracking, this single-flag solution falls apart if there are multiple simultaneous updates pending
	get updatesPending() { return this._updatesPending }
	get priceOfEthInUsd() { return this._priceOfEthInUsd }
	get estimatedPriceOfEthInDai() { return this._estimatedPriceOfEthInDai }
	get limitPriceOfEthInDai() { return this._limitPriceOfEthInDai }
	get leverageMultiplier() { return this._leverageMultiplier }
	get leverageSizeInEth() { return this._leverageSizeInEth }

	get minLimitPriceOfEthInDai() { return this.priceOfEthInUsd }
	get maxLimitPriceOfEthInDai() { return this.priceOfEthInUsd * 2 }
	get cdpSize() { return this.leverageMultiplier * this.leverageSizeInEth }
	get loanSize() { return this.cdpSize - this.leverageSizeInEth }
	get daiToDraw() { return this.loanSize * this.priceOfEthInUsd }
	get liquidationPriceOfEthInUsd() { return 1.5 * this.daiToDraw / this.cdpSize }
	get proceedsOfDaiSaleInEth() { return this.daiToDraw / this.limitPriceOfEthInDai }
	get providerFeeInEth() { return this.loanSize * 0.01 }
	get exchangeCostInEth() { return this.loanSize - this.proceedsOfDaiSaleInEth }
	get totalCostInEth() { return this.providerFeeInEth + this.exchangeCostInEth + this.leverageSizeInEth }
}

export class StateManager {
	/** @param {State} startingState */
	constructor(startingState) {
		let prevState = startingState
		let state = startingState

		/**
		 * @param {StateUpdate} stateUpdate
		 * @returns {boolean} Returns true if the state changed due to the update
		 */
		this.update = (stateUpdate) => {
			prevState = state
			state = state.update(stateUpdate)
			return !prevState.equals(state)
		}

		this.getState = () => state
		this.getPrevState = () => prevState
	}
}

export class CdpCloser {
	/**
	 * @param {StateManager} stateManager
	 * @param {Presentor} presentor
	 */
	constructor(stateManager, presentor) {
		this.stateManager = stateManager
		this.presentor = presentor

		Object.freeze(this)
	}
}

export class CdpOpener {
	/**
	 * @param {StateManager} stateManager
	 * @param {Presentor} presentor
	 * @param {Maker} maker
	 * @param {Oasis} oasis
	 */
	constructor(stateManager, presentor, maker, oasis) {
		this.presentor = presentor
		this.stateManager = stateManager
		this.maker = maker
		this.oasis = oasis

		/** @param {StateUpdate} stateUpdate */
		this.updateAndRender = (stateUpdate) => {
			this.presentor.updateAndRender(stateUpdate)

			// trigger cascading updates if
			if (this.stateManager.getState().daiToDraw !== this.stateManager.getPrevState().daiToDraw)
				this.updateDaiSaleProceeds(this.stateManager.getState().daiToDraw).catch(console.error)
		}

		this.createCdp = () => {
			// TODO: validate all values
			// TODO: beware of onblur event firing after the onclick event causing submission with stale values!
			console.log('TODO: write CDP creation code')
		}

		this.updatePriceFeed = async () => {
			this.updateAndRender({ updatesPending: true })
			const priceOfEthInUsd = await this.maker.getEthDaiPrice()
			this.updateAndRender({ updatesPending: false, priceOfEthInUsd: priceOfEthInUsd })
			setTimeout(() => this.updatePriceFeed().catch(console.error), 1000)
		}

		/** @param {number} daiToDraw */
		this.updateDaiSaleProceeds = async (daiToDraw) => {
			this.presentor.updateAndRender({ updatesPending: true })
			const daiSaleProceeds = await this.oasis.getBuyAmount(daiToDraw);
			const estimatedPriceOfEthInDai = daiToDraw / daiSaleProceeds
			this.presentor.updateAndRender({ updatesPending: false, estimatedPriceOfEthInDai: estimatedPriceOfEthInDai })
		}

		/** @param {string} newValueString */
		this.limitEthPriceChanged = (newValueString) => {
			const newValue = parseFloat(newValueString)
			if (this.stateManager.getState().limitPriceOfEthInDai === newValue) return
			this.updateAndRender({ limitPriceOfEthInDai: newValue })
		}

		/** @param {string} newValueString */
		this.leverageMultiplierChanged = (newValueString) => {
			const newValue = parseFloat(newValueString)
			if (this.stateManager.getState().leverageMultiplier === newValue) return
			this.updateAndRender({ leverageMultiplier: newValue })
		}

		/** @param {string} newValueString */
		this.leverageSizeChanged = (newValueString) => {
			const newValue = parseFloat(newValueString)
			if (this.stateManager.getState().leverageSizeInEth === newValue) return
			this.updateAndRender({ leverageSizeInEth: newValue })
		}

		this.onLoad = () => {
			this.presentor.subscribeToOpenLimitPriceChanged(this.limitEthPriceChanged)
			this.presentor.subscribeToLeverageMultiplierChanged(this.leverageMultiplierChanged)
			this.presentor.subscribeToLeverageSizeChanged(this.leverageSizeChanged)
			this.presentor.subscribeToCdpCreationInitiated(this.createCdp)
			this.updatePriceFeed().catch(console.error)
		}

		window.addEventListener('load', this.onLoad, { once: true })
		Object.freeze(this)
	}
}

const stateManager = new StateManager(new State({}))
const presentor = new Presentor(stateManager)
const maker = new Maker('448a5065aebb8e423f0896e6c5d525c040f59af3')
const oasis = new Oasis('14fbca95be7e99c15cc2996c6c9d841e54b79425', 'c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', '89d24a6b4ccb1b6faa2625fe562bdd9a23260359')
const cdpOpener = new CdpOpener(stateManager, presentor, maker, oasis)
const cdpCloser = new CdpCloser(stateManager, presentor)

// TODO: add window.onerror handler for presenting uncaught errors to the user (makes troubleshooting/support much easier)
// TODO: make sure we are on the expected network, display error to user if not
