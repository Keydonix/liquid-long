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

/** @param {string} address */
function isAddress(address) {
	if (typeof address !== 'string') return false
	if (!/^[a-zA-Z0-9]{40}$/.test(address)) return false
	return true
}

/** @param {string} address */
function assertIsAddress(address) {
	if (isAddress(address)) return
	throw new Error(`${address} is not an address (40 hex character string)`)
}

/** @param {string} value */
function assertIsHexEncodedNumber(value) {
	assert(/^[a-zA-Z0-9]{1,64}$/.test(value), `/^[a-zA-Z0-9]{1,64}$/.test(${value})`)
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

/** @param {number} milliseconds */
async function sleep(milliseconds) {
	return new Promise(resolve => setTimeout(resolve, milliseconds))
}

/**
 * @param {number} milliseconds
 * @param {function(): void} callback
 */
async function schedule(milliseconds, callback) {
	await sleep(milliseconds)
	await callback()
}

/** @param {Networks} networkId */
function networkIdToEtherscanSubdomain(networkId) {
	switch (networkId) {
		case '1': return 'www'
		case '3': return 'ropsten'
		case '4': return 'rinkeby'
		case '42': return 'kovan'
		default: throw new Error(`Unknown network ID: ${networkId}`)
	}
}

export class EthereumClient {
	constructor() {
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
		 * @returns {Promise<any>}
		 */
		async function submitJsonRpc(jsonRpc, signerRequired) {
			const result = await (
				((window.web3 !== undefined && window.web3.currentProvider !== undefined) || signerRequired === true)
					? sendAsyncWeb3(jsonRpc)
					: sendAsyncHosted(jsonRpc)
			)
			if (result === '0x') throw new Error(`${jsonRpc.method} execution failed, 0x was returned`)
			return result
		}

		/**
		 * @param {JsonRpcMethods} method
		 * @param {any[]} params
		 * @returns {JsonRpcRequest}
		 */
		function constructJsonRpcPayload(method, params) {
			return {
				jsonrpc: '2.0',
				id: new Date().getTime(),
				method: method,
				params: params,
			}
		}

		/** @returns {Promise<string>} */
		this.netVersion = async () => {
			const payload = constructJsonRpcPayload('net_version', [])
			const result = await submitJsonRpc(payload)
			if (typeof result !== 'string') throw new Error(`Expected net_version to return a string but instead got ${result}.`)
			return result
		}

		/**
		 * @param {Transaction} transaction
		 * @returns {Promise<string>}
		 */
		this.ethCall = async (transaction) => {
			if (transaction.from === undefined) transaction.from = '0x0000000000000000000000000000000000000000'
			const payload = constructJsonRpcPayload('eth_call', [transaction, 'latest'])
			const result = await submitJsonRpc(payload)
			return result.substring(2)
		}

		/**
		 * @returns {Promise<string|null>}
		 */
		this.ethCoinbase = async () => {
			const payload = constructJsonRpcPayload('eth_coinbase', [])
			const result = await submitJsonRpc(payload)
			if (result === null) return null
			const coinbase = result.substring(2)
			if (coinbase === '') return null
			assertIsAddress(coinbase)
			return coinbase
		}
	}
}

export class State {
	/** @param {StateUpdate} source */
	constructor(source) {
		/** @returns {Networks} */
		function sanitizeNetworkId() {
			switch (source.networkId) {
				case '1':
				case '3':
				case '4':
				case '42':
					return source.networkId
				default:
					return '1'
			}
		}

		/** @returns {string | null} */
		function sanitizeAccount() {
			if (typeof source.account !== 'string') return null
			if (!isAddress(source.account)) return null
			return source.account
		}

		/** @returns {Modes} */
		function sanitizeMode() {
			switch (source.mode) {
				case 'opening':
				case 'closing':
					return source.mode
				default:
					return 'opening'
			}
		}

		/** @returns {number} */
		function sanitizePriceOfEthInUsd() {
			return Number.isFinite(source.priceOfEthInUsd)
				? source.priceOfEthInUsd
				: NaN
		}

		/** @returns {number | 'insufficient depth'} */
		function sanitizeEstimatedPriceOfEthInDai() {
			if (source.estimatedPriceOfEthInDai === 'insufficient depth') return 'insufficient depth'
			return Number.isFinite(source.estimatedPriceOfEthInDai)
				? source.estimatedPriceOfEthInDai
				: NaN
		}

		/**
		 * @param {number} priceOfEthInUsd
		 * @param {number | 'insufficient depth'} estimatedPriceOfEthInDai
		 * @returns {number}
		 */
		function sanitizeLimitPriceOfEthInDai(priceOfEthInUsd, estimatedPriceOfEthInDai) {
			const unconstrained = Number.isFinite(source.limitPriceOfEthInDai)
				? source.limitPriceOfEthInDai
				: (estimatedPriceOfEthInDai !== 'insufficient depth')
					? estimatedPriceOfEthInDai
					: priceOfEthInUsd
			return Math.max(unconstrained, priceOfEthInUsd)
		}

		/** @returns {number} */
		function sanitizeLeverageMultiplier() {
			const unconstrained = Number.isFinite(source.leverageMultiplier)
				? source.leverageMultiplier
				: 2
			return Math.min(Math.max(unconstrained, 1), 3)
		}

		/** @returns {number} */
		function sanitizeLeverageSizeInEth() {
			const unconstrained = Number.isFinite(source.leverageSizeInEth)
				? source.leverageSizeInEth
				: 1
			return Math.max(unconstrained, 1)
		}

		/** @returns {CDP[]} */
		function sanitizeCdps() {
			const cdps = (source.cdps !== undefined && source.cdps !== null) ? source.cdps : []
			cdps.forEach(Object.freeze)
			Object.freeze(cdps)
			return cdps
		}

		// copy in the source, validating and falling back to defaults as we do
		this._networkId = sanitizeNetworkId()
		this._account = sanitizeAccount()
		this._mode = sanitizeMode()
		this._priceOfEthInUsd = sanitizePriceOfEthInUsd()
		this._estimatedPriceOfEthInDai = sanitizeEstimatedPriceOfEthInDai()
		this._limitPriceOfEthInDai = sanitizeLimitPriceOfEthInDai(this._priceOfEthInUsd, this._estimatedPriceOfEthInDai)
		this._leverageMultiplier = sanitizeLeverageMultiplier()
		this._leverageSizeInEth = sanitizeLeverageSizeInEth()
		this._cdps = sanitizeCdps()

		/** @param {StateUpdate} stateUpdate */
		this.update = (stateUpdate) => {
			// fill in the state update with current values using the getters
			return new State({
				networkId: (stateUpdate.networkId !== undefined) ? stateUpdate.networkId : this.networkId,
				account: (stateUpdate.account !== undefined) ? stateUpdate.account : this.account,
				mode: (stateUpdate.mode !== undefined) ? stateUpdate.mode : this.mode,
				priceOfEthInUsd: (stateUpdate.priceOfEthInUsd !== undefined) ? stateUpdate.priceOfEthInUsd : this.priceOfEthInUsd,
				estimatedPriceOfEthInDai: (stateUpdate.estimatedPriceOfEthInDai !== undefined) ? stateUpdate.estimatedPriceOfEthInDai : this.estimatedPriceOfEthInDai,
				limitPriceOfEthInDai: (stateUpdate.limitPriceOfEthInDai !== undefined) ? stateUpdate.limitPriceOfEthInDai : this.limitPriceOfEthInDai,
				leverageMultiplier: (stateUpdate.leverageMultiplier !== undefined) ? stateUpdate.leverageMultiplier : this.leverageMultiplier,
				leverageSizeInEth: (stateUpdate.leverageSizeInEth !== undefined) ? stateUpdate.leverageSizeInEth : this.leverageSizeInEth,
				cdps: (stateUpdate.cdps !== undefined) ? stateUpdate.cdps : this.cdps,
			})
		}

		/** @param {State} other */
		this.equals = (other) => {
			return this._networkId === other._networkId
				&& this._account === other._account
				&& this._mode === other._mode
				&& (this._priceOfEthInUsd === other._priceOfEthInUsd || (Number.isNaN(this._priceOfEthInUsd) && Number.isNaN(other._priceOfEthInUsd)))
				&& (this._estimatedPriceOfEthInDai === other._estimatedPriceOfEthInDai || (Number.isNaN(this._estimatedPriceOfEthInDai) && Number.isNaN(other._estimatedPriceOfEthInDai)))
				&& this._limitPriceOfEthInDai === other._limitPriceOfEthInDai
				&& this._leverageMultiplier === other._leverageMultiplier
				&& this._leverageSizeInEth === other._leverageSizeInEth
				&& JSON.stringify(this._cdps) === JSON.stringify(other._cdps)
		}

		// immutability FTW!
		Object.freeze(this)
	}

	/** @returns {Networks} */
	get networkId() { return this._networkId }
	/** @returns {string | null} */
	get account() { return this._account }
	/** @returns {Modes} */
	get mode() { return this._mode }
	/** @returns {number} */
	get priceOfEthInUsd() { return this._priceOfEthInUsd }
	/** @returns {number | InsufficientDepth} */
	get estimatedPriceOfEthInDai() { return this._estimatedPriceOfEthInDai }
	/** @returns {number} */
	get limitPriceOfEthInDai() { return this._limitPriceOfEthInDai }
	/** @returns {number} */
	get leverageMultiplier() { return this._leverageMultiplier }
	/** @returns {number} */
	get leverageSizeInEth() { return this._leverageSizeInEth }

	/** @returns {number} */
	get minLimitPriceOfEthInDai() { return (this.priceOfEthInUsd !== undefined && this.priceOfEthInUsd !== null) ? this.priceOfEthInUsd : 0 }
	/** @returns {number} */
	get maxLimitPriceOfEthInDai() { return (this.priceOfEthInUsd !== undefined && this.priceOfEthInUsd !== null) ? this.priceOfEthInUsd * 2: 1000000 }
	/** @returns {number} */
	get cdpSize() { return this.leverageMultiplier * this.leverageSizeInEth }
	/** @returns {number} */
	get loanSize() { return this.cdpSize - this.leverageSizeInEth }
	/** @returns {number} */
	get daiToDraw() { return this.loanSize * this.priceOfEthInUsd }
	/** @returns {number} */
	get liquidationPriceOfEthInUsd() { return 1.5 * this.daiToDraw / this.cdpSize }
	/** @returns {number} */
	get proceedsOfDaiSaleInEth() { return this.daiToDraw / this.limitPriceOfEthInDai }
	/** @returns {number} */
	get providerFeeInEth() { return this.loanSize * 0.01 }
	/** @returns {number} */
	get exchangeCostInEth() { return this.loanSize - this.proceedsOfDaiSaleInEth }
	/** @returns {number} */
	get totalCostInEth() { return this.providerFeeInEth + this.exchangeCostInEth + this.leverageSizeInEth }

	/** @returns {CDP[]} */
	get cdps() { return this._cdps }
}

export class StateManager {
	/** @param {State} startingState */
	constructor(startingState) {
		let state = startingState
		/** @type {(function(State): void)[]} */
		const subscribers = []

		/**
		 * @param {StateUpdate} stateUpdate
		 * @returns {boolean} Returns true if the state changed due to the update
		 */
		this.update = (stateUpdate) => {
			const newState = state.update(stateUpdate)
			if (state.equals(newState)) return false
			const prevState = state
			state = newState
			subscribers.forEach(subscriber => subscriber(prevState))
			return true
		}

		/** @param {function(State): void} callback */
		this.subscribeToStateChanges = (callback) => {
			subscribers.push(callback)
		}

		this.getState = () => state
	}
}

export class ContractAddresses {
	/**
	 * @param {StateManager} stateManager
	 */
	constructor(stateManager) {
		const tubAddresses = {
			'1': '448a5065aebb8e423f0896e6c5d525c040f59af3',
			'42': 'a71937147b55deb8a530c7229c442fd3f31b7db2',
		}
		const oasisAddresses = {
			'1': '14fbca95be7e99c15cc2996c6c9d841e54b79425',
			'42': '8cf1Cab422A0b6b554077A361f8419cDf122a9F9',
		}
		const wethAddresses = {
			'1': 'c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
			'42': 'd0a1e359811322d97991e03f863a0c30c2cf029c',
		}
		const daiAddresses = {
			'1': '89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
			'42': 'c4375b7de8af5a38a93548eb8453a498222c4ff2',
		}

		this.getWethAddress = () => {
			const networkId = stateManager.getState().networkId
			const wethAddress = wethAddresses[networkId]
			if (wethAddress === undefined) throw new Error(`WETH address for network ${networkId} not available.`)
			return wethAddress
		}
		this.getDaiAddress = () => {
			const networkId = stateManager.getState().networkId
			const daiAddress = daiAddresses[networkId]
			if (daiAddress === undefined) throw new Error(`DAI address for network ${networkId} not available.`)
			return daiAddress
		}
		this.getOasisAddress = () => {
			const networkId = stateManager.getState().networkId
			const oasisAddress = oasisAddresses[networkId]
			if (oasisAddress === undefined) throw new Error(`Oasis address for network ${networkId} not available.`)
			return oasisAddress
		}
		this.getTubAddress = () => {
			const networkId = stateManager.getState().networkId
			const tubAddress = tubAddresses[networkId]
			if (tubAddress === undefined) throw new Error(`TUB address for network ${networkId} not available.`)
			return tubAddress
		}
	}
}

export class Presentor {
	/** @param {StateManager} stateManager */
	constructor(stateManager) {
		// subscriptions is mutable because we will be lazily populating the callbacks
		const subscriptions = {
			/** @type {(function(string):void) | undefined} */
			openLimitPriceChanged: undefined,
			/** @type {(function(string):void) | undefined} */
			leverageMultiplierChanged: undefined,
			/** @type {(function(string):void) | undefined} */
			leverageSizeChanged: undefined,
			/** @type {(function():void) | undefined} */
			cdpCreationInitiated: undefined,
		}

		/** @param {State} state */
		const numberOfEthDecimals = (state) => (typeof state.priceOfEthInUsd === 'number' && Number.isFinite(state.priceOfEthInUsd)) ? round(Math.log10(state.priceOfEthInUsd), 0) + 1 : 4

		const renderOpen = () => {
			const state = stateManager.getState()


			this.ethPrice.innerHTML = Number.isFinite(state.priceOfEthInUsd) ? round(state.priceOfEthInUsd, 2).toString(10) : '<span class="loading"></span>'
			this.estimatedEthPrice.innerHTML = (Number.isFinite(state.estimatedPriceOfEthInDai) && typeof state.estimatedPriceOfEthInDai === 'number')
				? round(state.estimatedPriceOfEthInDai, 2).toString(10)
				: (state.estimatedPriceOfEthInDai === 'insufficient depth')
					? '<span data-tip="OasisDEX does not have enough ETH available for purchase to open this CDP">⚠</span>'
					: '<span class="loading"></span>'
			this.limitEthPrice.setAttribute('min', round(state.minLimitPriceOfEthInDai, 2).toString(10))
			this.limitEthPrice.setAttribute('max', round(state.maxLimitPriceOfEthInDai, 2).toString(10))
			this.limitEthPrice.setAttribute('placeholder', round((state.estimatedPriceOfEthInDai !== 'insufficient depth') ? state.estimatedPriceOfEthInDai : state.priceOfEthInUsd, 2).toString(10))
			this.liquidationPrice.innerHTML = Number.isFinite(state.liquidationPriceOfEthInUsd) ? round(state.liquidationPriceOfEthInUsd, 2).toString(10) : '<span class="loading"></span>'
			this.feeProvider.innerHTML = Number.isFinite(state.providerFeeInEth) ? round(state.providerFeeInEth, numberOfEthDecimals(state)).toString(10) : '<span class="loading"></span>'
			this.feeExchange.innerHTML = Number.isFinite(state.exchangeCostInEth) ? round(state.exchangeCostInEth, numberOfEthDecimals(state)).toString(10) : '<span class="loading"></span>'
			this.feeTotal.innerHTML = Number.isFinite(state.totalCostInEth) ? round(state.totalCostInEth, numberOfEthDecimals(state)).toString(10) : '<span class="loading"></span>'

			// update input boxes (for clamping/defaulting) _unless_ they have focus (don't mess with them while user is editing)
			if (this.limitEthPrice !== document.activeElement) this.limitEthPrice.value = round(state.limitPriceOfEthInDai, 2).toString(10)
			if (this.leverageMultiplier !== document.activeElement) this.leverageMultiplier.value = state.leverageMultiplier.toString(10)
			if (this.leverageSize !== document.activeElement) this.leverageSize.value = state.leverageSizeInEth.toString(10)
		}

		const renderClose = () => {
			const state = stateManager.getState()

			this.myCdpsTable.innerHTML = ""

			for (let cdp of state.cdps) {
				const cdpRow = document.importNode(this.myCdpRowTemplate.content, true)
				const columns = cdpRow.querySelectorAll('td')
				columns[0].textContent = cdp.id.toString(10)
				columns[1].textContent = round(cdp.lockedEth, numberOfEthDecimals(state)).toString(10)
				columns[2].textContent = round(cdp.debtInDai, 2).toString(10)
				columns[3].textContent = round(cdp.ourFee, numberOfEthDecimals(state)).toString(10)
				columns[4].textContent = round(cdp.exchangeFee, numberOfEthDecimals(state)).toString(10)
				// FIXME: this currently uses ETH:USD price feed but it should use ETH:DAI market price for each CDP
				columns[5].textContent = round(cdp.lockedEth - (cdp.debtInDai / state._priceOfEthInUsd)- cdp.ourFee - cdp.exchangeFee, numberOfEthDecimals(state)).toString(10)
				if (cdp.state !== 'user-controlled') columns[6].querySelectorAll('button').forEach(child => child.setAttribute('disabled', ''), {})
				if (cdp.state !== 'contract-controlled') columns[7].querySelectorAll('button').forEach(child => child.setAttribute('disabled', ''), {})
				this.myCdpsTable.appendChild(cdpRow)
			}
		}

		/** Turn a state object into a rendered scene.  This function shouldn't be doing any data processing, it should just be displaying current state. */
		this.render = () => {
			const state = stateManager.getState()
			// TODO: if web3.currentProvider not present, alert user and disable signing
			this.networkName.innerHTML = `Network: ${
				(state.networkId === '1') ? 'Foundation'
				: (state.networkId === '3') ? '<span data-tip="Unsupported Network" style="color: darkred">Ropsten</span>'
				: (state.networkId === '4') ? '<span data-tip="Unsupported Network" style="color: darkred">Rinkeby</span>'
				: (state.networkId === '42') ? 'Kovan'
				: '<span class="loading"></span>'}`
			if (state.mode === 'opening') {
				this.openCdpNav.classList.add('active')
				this.closeCdpNav.classList.remove('active')
				this.openCdpForm.hidden = false
				this.closeCdpForm.hidden = true
			} else if (state.mode === 'closing') {
				this.openCdpNav.classList.remove('active')
				this.closeCdpNav.classList.add('active')
				this.openCdpForm.hidden = true
				this.closeCdpForm.hidden = false
			} else {
				throw new Error(`Unexpected mode: ${state.mode}`)
			}
			this.accountLabel.innerText = (state.account !== null) ? `0x${state.account}` : ''
			this.accountLabel.setAttribute('href', `https://${networkIdToEtherscanSubdomain(state.networkId)}.etherscan.io/address/0x${state.account}`)

			renderOpen.bind(this)()
			renderClose.bind(this)()
		}

		/** @param {function(string): void} callback */
		this.subscribeToOpenLimitPriceChanged = (callback) => {
			assert(subscriptions.openLimitPriceChanged === undefined, `Only one interaction callback supported at a time, did you accidentally double-subscribe?`)
			subscriptions.openLimitPriceChanged = callback
		}

		/** @param {function(string): void} callback */
		this.subscribeToLeverageMultiplierChanged = (callback) => {
			assert(subscriptions.leverageMultiplierChanged === undefined, `Only one interaction callback supported at a time, did you accidentally double-subscribe?`)
			subscriptions.leverageMultiplierChanged = callback
		}

		/** @param {function(string): void} callback */
		this.subscribeToLeverageSizeChanged = (callback) => {
			assert(subscriptions.leverageSizeChanged === undefined, `Only one interaction callback supported at a time, did you accidentally double-subscribe?`)
			subscriptions.leverageSizeChanged = callback
		}

		/** @param {function(): void} callback */
		this.subscribeToCdpCreationInitiated = (callback) => {
			subscriptions.cdpCreationInitiated = callback
		}

		this.onLoad = async () => {
			// CONSIDER: expose subscriptions to navigation here and subscribe to them and update state elsewhere
			//     ?is navigation purely a presentation concern, not part of business logic?
			this.openCdpNav.addEventListener('click', () => stateManager.update({ mode: 'opening' }))
			this.closeCdpNav.addEventListener('click', () => stateManager.update({ mode: 'closing' }))
			const noop = () => { }
			this.limitEthPrice.addEventListener('blur', () => (subscriptions.openLimitPriceChanged || noop)(this.limitEthPrice.value))
			this.leverageMultiplier.addEventListener('blur', () => (subscriptions.leverageMultiplierChanged || noop)(this.leverageMultiplier.value))
			this.leverageSize.addEventListener('blur', () => (subscriptions.leverageSizeChanged || noop)(this.leverageSize.value))
			this.createCdpButton.addEventListener('click', () => (subscriptions.cdpCreationInitiated || noop)())

			stateManager.subscribeToStateChanges(this.render)
		}

		window.addEventListener('load', () => this.onLoad().catch(console.error), { once: true })
		Object.freeze(this)
	}

	get networkName() { return /** @type {HTMLElement} */ (document.getElementById('network-name')) }
	get openCdpNav() { return /** @type {HTMLElement} */ (document.getElementById('open-cdp-nav')) }
	get closeCdpNav() { return /** @type {HTMLElement} */ (document.getElementById('close-cdp-nav')) }
	get accountLabel() { return /** @type {HTMLElement} */ (document.getElementById('account-label')) }

	get openCdpForm() { return /** @type {HTMLElement} */ (document.getElementById('open-cdp-form')) }
	get ethPrice() { return /** @type {HTMLElement} */ (document.getElementById('eth-price')) }
	get estimatedEthPrice() { return /** @type {HTMLElement} */ (document.getElementById('estimated-eth-price')) }
	get limitEthPrice() { return /** @type {HTMLInputElement} */ (document.getElementById('limit-eth-price')) }
	get leverageMultiplier() { return  /** @type {HTMLInputElement} */ (document.getElementById('leverage-multiplier')) }
	get leverageSize() { return  /** @type {HTMLInputElement} */ (document.getElementById('leverage-size')) }
	get liquidationPrice() { return /** @type {HTMLElement} */ (document.getElementById('liquidation-price')) }
	get feeProvider() { return /** @type {HTMLElement} */ (document.getElementById('fee-provider')) }
	get feeExchange() { return /** @type {HTMLElement} */ (document.getElementById('fee-exchange')) }
	get feeTotal() { return /** @type {HTMLElement} */ (document.getElementById('fee-total')) }
	get createCdpButton() { return /** @type {HTMLElement} */ (document.getElementById('create-cdp-button')) }

	get closeCdpForm() { return /** @type { HTMLFormElement} */ (document.getElementById('close-cdp-form')) }
	get myCdpRowTemplate() { return /** @type {HTMLTemplateElement} */ (document.getElementById('cdp-row')) }
	get myCdpsTable() { return /** @type {HTMLTableSectionElement} */ (document.getElementById('my-cdps-table')) }
}

export class Maker {
	/**
	 * @param {EthereumClient} ethereumClient
	 * @param {ContractAddresses} contractAddresses
	 */
	constructor(ethereumClient, contractAddresses) {
		this.getEthUsdPrice = async () => {
			// TODO: add some kind of caching for medianizer address so we aren't hitting the local node so hard every time we access the price feed
			const getMedianizerAddress = async () => {
				// address public pip;
				const pipSignatureHash = 'd741e2f9'
				const transaction = {
					to: `0x${contractAddresses.getTubAddress()}`,
					data: `0x${pipSignatureHash}`
				}
				const result = await ethereumClient.ethCall(transaction)
				const address = result.substr(-40)
				assertIsAddress(address)
				return address
			}

			/** @param {string} medianizerAddress */
			const readPriceFeed = async (medianizerAddress) => {
				// function read() constant returns (bytes32) {}
				const readSignatureHash = '57de26a4'
				const transaction = {
					to: `0x${medianizerAddress}`,
					data: `0x${readSignatureHash}`
				}
				const stringResult = await ethereumClient.ethCall(transaction)
				assertIsHexEncodedNumber(stringResult)
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
	 * @param {EthereumClient} ethereumClient
	 * @param {ContractAddresses} contractAddresses
	 */
	constructor(ethereumClient, contractAddresses) {
		/** @param {number} daiToDraw */
		this.getBuyAmount = async (daiToDraw) => {
			// function getBuyAmount(address, address, uint256) {}
			const getBuyAmountSignatureHash = '144a2752'
			// rounding of daiToDraw is fine because all of this is used for giving the user an estimate, not an exact number
			const attodaiToDraw = abiEncodeNumber(daiToDraw * 10 ** 18)
			const transaction = {
				to: `0x${contractAddresses.getOasisAddress()}`,
				data: `0x${getBuyAmountSignatureHash}${leftPad64Zeros(contractAddresses.getWethAddress())}${leftPad64Zeros(contractAddresses.getDaiAddress())}${attodaiToDraw}`,
			}
			try {
				const stringResult = await ethereumClient.ethCall(transaction)
				assertIsHexEncodedNumber(stringResult)
				// stringResult could be a number that doesn't fit into a double, but the UI doesn't care about losing some precision since we are using this to give the user a recommendation for what they will end up paying, and we are truncating to 2 decimals in the UI anyway
				return parseInt(stringResult, 16) / 10 ** 18
			} catch (error) {
				// this happens if the orderbook doesn't have enough depth to liquidate all of the DAI
				return 'insufficient depth'
			}
		}

		Object.freeze(this)
	}
}

export class LiquidLong {
	/**
	 * @param {EthereumClient} ethereumClient
	 * @param {ContractAddresses} contractAddresses
	 */
	constructor(ethereumClient, contractAddresses) {
		/** @type {CDP[]} */
		const samples = [
			{id: 1, debtInDai: 500, lockedEth: 1, ourFee: 0.01, exchangeFee: 0.1, state: 'user-controlled'},
			{id: 10, debtInDai: 0, lockedEth: 1, ourFee: 0.01, exchangeFee: 0.1, state: 'contract-controlled'},
			{id: 53, debtInDai: 1000, lockedEth: 2, ourFee: 0.01, exchangeFee: 0.1, state: 'user-controlled'},
			{id: 72, debtInDai: 1000, lockedEth: 1, ourFee: 0.01, exchangeFee: 0.1, state: 'user-controlled'},
			{id: 999, debtInDai: 500, lockedEth: 1, ourFee: 0.01, exchangeFee: 0.1, state: 'user-controlled'},
			{id: 1248, debtInDai: 750, lockedEth: 1, ourFee: 0.01, exchangeFee: 0.1, state: 'user-controlled'},
			{id: 1600, debtInDai: 500, lockedEth: 1, ourFee: 0.01, exchangeFee: 0.1, state: 'contract-controlled'},
		]
		const cdpsPerPage = 3

		/**
		 * @param {string} account
		 * @param {number} startId
		 * @returns {Promise<CDP[]>}
		 */
		const getCdpsPage = async (account, startId) => {
			return samples.filter(cdp =>  startId <= cdp.id && cdp.id < startId + cdpsPerPage)
		}

		/** @returns {Promise<number>} */
		const getCdpCount = async () => {
			return 2000
		}

		/**
		 * @param {string} account
		 * @returns {Promise<CDP[]>}
		 */
		this.getCdps = async (account) => {
			const cdpCount = await getCdpCount()
			/** @type {CDP[]} */
			let cdps = []
			for (let i = 0; i <= cdpCount; i += cdpsPerPage) {
				cdps = cdps.concat(await getCdpsPage(account, i))
			}
			return cdps
		}

		Object.freeze(this)
	}
}

export class Poller {
	/**
	 * @param {EthereumClient} ethereumClient
	 * @param {StateManager} stateManager
	 * @param {Maker} maker
	 * @param {Oasis} oasis
	 * @param {LiquidLong} liquidLong
	 */
	constructor(ethereumClient, stateManager, maker, oasis, liquidLong) {
		this.pollNetworkId = async () => {
			const networkId = await ethereumClient.netVersion()
			// intentionally not awaited to avoid stack overflow
			schedule(1000, this.pollNetworkId)
			if (networkId !== '1' && networkId !== '3' && networkId !== '4' && networkId !== '42') throw new Error(`Unsupported network ${networkId}`)
			if (networkId === stateManager.getState().networkId) return
			// we need to reset any data fetched from the blockchain if the network changes
			stateManager.update({
				networkId: networkId,
				account: null,
				priceOfEthInUsd: null,
				estimatedPriceOfEthInDai: null,
				limitPriceOfEthInDai: null,
				leverageMultiplier: null,
				leverageSizeInEth: null,
			})
		}

		this.pollCoinbase = async () => {
			const coinbase = await ethereumClient.ethCoinbase()
			// intentionally not awaited to avoid stack overflow
			schedule(1000, this.pollCoinbase)
			if (coinbase === stateManager.getState().account) return
			// we need to reset any data that is account specific when the account changes
			stateManager.update({
				account: coinbase
			})
		}

		this.pollEthPrice = async () => {
			const priceOfEthInUsd = await maker.getEthUsdPrice()
			// intentionally not awaited to avoid stack overflow
			schedule(1000, this.pollEthPrice)
			stateManager.update({ priceOfEthInUsd: priceOfEthInUsd })
		}

		this.pollDaiProceeds = async () => {
			const daiProceeds = await oasis.getBuyAmount(stateManager.getState().daiToDraw)
			// intentionally not awaited to avoid stack overflow
			schedule(1000, this.pollDaiProceeds)
			const estimatedPriceOfEthInDai = (daiProceeds === 'insufficient depth') ? 'insufficient depth' : stateManager.getState().daiToDraw / daiProceeds
			stateManager.update({ estimatedPriceOfEthInDai: estimatedPriceOfEthInDai })
		}

		this.pollOwnedCdps = async () => {
			const account = await ethereumClient.ethCoinbase()
			const cdps = (account === null) ? [] : await liquidLong.getCdps(account)
			schedule(10000, this.pollOwnedCdps)
			stateManager.update({ cdps: cdps })
		}

		this.onLoad = async () => {
			await this.pollNetworkId()
			await this.pollCoinbase()
			await this.pollEthPrice()
			await this.pollDaiProceeds()
			await this.pollOwnedCdps()
		}

		window.addEventListener('load', () => this.onLoad().catch(console.error), { once: true })
		Object.freeze(this)
	}
}

export class CdpOpener {
	/**
	 * @param {StateManager} stateManager
	 * @param {Presentor} presentor
	 * @param {Oasis} oasis
	 */
	constructor(stateManager, presentor, oasis) {
		this.createCdp = () => {
			// TODO: validate all values
			// TODO: beware of onblur event firing after the onclick event causing submission with stale values!
			console.log('TODO: write CDP creation code')
		}

		/** @param {State} prevState */
		this.stateChanged = async (prevState) => {
			if (stateManager.getState().daiToDraw !== prevState.daiToDraw && (!Number.isNaN(stateManager.getState().daiToDraw)))
				this.updateDaiSaleProceeds(stateManager.getState().daiToDraw).catch(console.error)
		}

		/** @param {number} daiToDraw */
		this.updateDaiSaleProceeds = async (daiToDraw) => {
			const daiSaleProceeds = await oasis.getBuyAmount(daiToDraw);
			const estimatedPriceOfEthInDai = (daiSaleProceeds === 'insufficient depth') ? 'insufficient depth' : stateManager.getState().daiToDraw / daiSaleProceeds
			stateManager.update({ estimatedPriceOfEthInDai: estimatedPriceOfEthInDai })
		}

		/** @param {string} newValueString */
		this.limitEthPriceChanged = (newValueString) => {
			const newValue = parseFloat(newValueString)
			if (stateManager.getState().limitPriceOfEthInDai === newValue) return
			stateManager.update({ limitPriceOfEthInDai: newValue })
		}

		/** @param {string} newValueString */
		this.leverageMultiplierChanged = (newValueString) => {
			const newValue = parseFloat(newValueString)
			if (stateManager.getState().leverageMultiplier === newValue) return
			stateManager.update({ leverageMultiplier: newValue })
		}

		/** @param {string} newValueString */
		this.leverageSizeChanged = (newValueString) => {
			const newValue = parseFloat(newValueString)
			if (stateManager.getState().leverageSizeInEth === newValue) return
			stateManager.update({ leverageSizeInEth: newValue })
		}

		this.onLoad = () => {
			presentor.subscribeToOpenLimitPriceChanged(this.limitEthPriceChanged)
			presentor.subscribeToLeverageMultiplierChanged(this.leverageMultiplierChanged)
			presentor.subscribeToLeverageSizeChanged(this.leverageSizeChanged)
			presentor.subscribeToCdpCreationInitiated(this.createCdp)
			stateManager.subscribeToStateChanges(this.stateChanged)
		}

		window.addEventListener('load', this.onLoad, { once: true })
		Object.freeze(this)
	}
}

const ethereumClient = new EthereumClient()
const stateManager = new StateManager(new State({}))
const contractAddresses = new ContractAddresses(stateManager)
const presentor = new Presentor(stateManager)
const maker = new Maker(ethereumClient, contractAddresses)
const oasis = new Oasis(ethereumClient, contractAddresses)
const liquidLong = new LiquidLong(ethereumClient, contractAddresses)
const poller = new Poller(ethereumClient, stateManager, maker, oasis, liquidLong)
const cdpOpener = new CdpOpener(stateManager, presentor, oasis)

// TODO: add window.onerror handler for presenting uncaught errors to the user (makes troubleshooting/support much easier)
