export class CdpOpener {
	constructor() {
		// TODO: fetch this periodically from contracts
		this.priceOfEthInUsd = 500

		// TODO: update this from contract when user updates leverage-size
		// TODO: delay updates until 1 second of idle so we don't hammer the server when the user is typing in a multi-digit number
		// this is the best price we can buy ETH for at the current leverage-size
		this.bestPriceOfEthInDai = 525

		this.createCdp = () => {
			if (!document.getElementById('open-cdp-form').checkValidity()) return
			console.log('TODO: write CDP creation code')
		}

		this.update = () => {
			console.log('updating')
			document.getElementById('eth-price').innerText = this.priceOfEthInUsd
			// TODO: change best-eth-price to a spinner when we are fetching an updated price
			document.getElementById('best-eth-price').innerText = this.bestPriceOfEthInDai
			document.getElementById('liquidation-price').innerText = this.liquidationPrice
			document.getElementById('fee-provider').innerText = this.providerFee
			document.getElementById('fee-exchange').innerText = this.exchangeCost
			document.getElementById('fee-total').innerText = this.totalCost
		}

		this.onLoad = (window, event) => {
			this.update()
		}
	}

	get leverageMultiplier() {
		const leverageMultiplier = parseFloat(document.getElementById('leverage-multiplier').value)
		if (leverageMultiplier < 1 || leverageMultiplier > 3 || isNaN(leverageMultiplier)) return 2
		return leverageMultiplier
	}

	get leverageSize() {
		const leverageSize = parseFloat(document.getElementById('leverage-size').value)
		if (leverageSize <= 0 || leverageSize > 1000 || isNaN(leverageSize)) return 1
		return leverageSize
	}

	get loanSizeInEth() {
		return this.cdpSizeInEth - this.leverageSize
	}

	get liquidationPrice() {
		return 1.5 * this.daiToDraw / this.cdpSizeInEth
	}

	get cdpSizeInEth() {
		return this.leverageMultiplier * this.leverageSize
	}
	get daiToDraw() {
		return this.loanSizeInEth * this.priceOfEthInUsd
	}

	get providerFee() {
		return this.loanSizeInEth * 0.01
	}

	get exchangeCost() {
		// TODO: pad the price a bit (maybe 5%) to deal with slippage, we will refund the user any excess.
		const proceedsOfDaiSaleInEth = this.daiToDraw / this.bestPriceOfEthInDai
		return this.loanSizeInEth - proceedsOfDaiSaleInEth
	}

	get totalCost() {
		return this.providerFee + this.exchangeCost + this.leverageSize
	}
}

const cdpOpener = new CdpOpener()
window.addEventListener('load', cdpOpener.onLoad, { once: true })
window.createCdp = cdpOpener.createCdp
window.update = cdpOpener.update
