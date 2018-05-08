const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const DAI_ADDRESS = '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359'
const OASIS_ADDRESS = '0x14fbca95be7e99c15cc2996c6c9d841e54b79425'

const DEFAULT_LEVERAGE_MULTIPLIER = 2.0
const DEFAULT_LEVERAGE_SIZE_IN_ETH = 1

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

async function sleep(milliseconds) {
	return new Promise(resolve => setTimeout(resolve, milliseconds))
}

export class Maker {
	constructor() {
		this.getEthDaiPrice = async () => {
			// TODO: return await ???
			await sleep(randomAround(3000, 2000))
			return randomAround(500, 25)
		}
	}
}

export class Oasis {
	constructor(oasisAddress, wethAddress, daiAddress) {
		this.oasisAddress = oasisAddress
		this.wethAddress = wethAddress
		this.daiAddress = daiAddress

		this.getBuyAmount = async (daiToDraw) => {
			// TODO: return await getBuyAmount(this.wethAddress, this.daiAddress, daiToDraw)
			await sleep(randomAround(3000, 2000))
			return daiToDraw / randomAround(500, 50)
		}
	}
}

export class CdpOpener {
	/**
	 * @param {Maker} maker
	 * @param {Oasis} oasis
	 */
	constructor(maker, oasis) {
		this.maker = maker
		this.oasis = oasis

		this.priceOfEthInUsd = NaN
		this.estimatedPriceOfEthInDai = NaN

		this.createCdp = () => {
			if (!document.getElementById('open-cdp-form').checkValidity()) return
			console.log('TODO: write CDP creation code')
		}

		this.updatePriceFeed = async () => {
			const previous = this.priceOfEthInUsd
			this.priceOfEthInUsd = await this.maker.getEthDaiPrice()
			if (this.priceOfEthInUsd === previous) {
				setTimeout(this.updatePriceFeed, 1000)
				return
			}
			document.getElementById('eth-price').innerText = round(this.priceOfEthInUsd, 2)
			this.updateDerived()
			await this.updateDaiSaleProceeds()
			setTimeout(this.updatePriceFeed, 1000)
		}

		this.updateDaiSaleProceeds = async () => {
			const previous = this.estimatedPriceOfEthInDai
			this.estimatedPriceOfEthInDai = this.daiToDraw / (await this.oasis.getBuyAmount(this.daiToDraw))
			if (previous === this.estimatedPriceOfEthInDai) return
			document.getElementById('worst-eth-price').setAttribute('placeholder', round(this.estimatedPriceOfEthInDai, 2))
			this.updateDerived()
		}

		this.updateDerived = () => {
			document.getElementById('worst-eth-price').setAttribute('min', this.priceOfEthInUsd)
			document.getElementById('worst-eth-price').setAttribute('max', this.priceOfEthInUsd * 2)
			document.getElementById('liquidation-price').innerText = round(this.liquidationPrice, 2)
			document.getElementById('fee-provider').innerText = this.providerFee
			document.getElementById('fee-exchange').innerText = round(this.exchangeCost, this.numberOfEthDecimals)
			document.getElementById('fee-total').innerText = round(this.totalCost, this.numberOfEthDecimals)
		}

		this.onLoad = async (window, event) => {
			this.updatePriceFeed()
		}
	}

	get numberOfEthDecimals() {
		return round(Math.log10(this.priceOfEthInUsd), 0) + 1
	}

	get leverageMultiplier() {
		const leverageMultiplier = parseFloat(document.getElementById('leverage-multiplier').value)
		if (leverageMultiplier < 1 || leverageMultiplier > 3 || isNaN(leverageMultiplier)) return DEFAULT_LEVERAGE_MULTIPLIER
		return leverageMultiplier
	}

	get leverageSizeInEth() {
		const leverageSizeInEth = parseFloat(document.getElementById('leverage-size').value)
		if (leverageSizeInEth <= 0 || leverageSizeInEth > 1000 || isNaN(leverageSizeInEth)) return DEFAULT_LEVERAGE_SIZE_IN_ETH
		return leverageSizeInEth
	}

	get cdpSizeInEth() {
		return this.leverageMultiplier * this.leverageSizeInEth
	}

	get loanSizeInEth() {
		return this.cdpSizeInEth - this.leverageSizeInEth
	}

	get daiToDraw() {
		return this.loanSizeInEth * this.priceOfEthInUsd
	}

	get worstPriceOfEthInDai() {
		const worstPriceOfEthInDai = parseFloat(document.getElementById('worst-eth-price').value)
		if (worstPriceOfEthInDai < this.priceOfEthInUsd || isNaN(worstPriceOfEthInDai)) return this.estimatedPriceOfEthInDai
		return worstPriceOfEthInDai
	}

	get liquidationPrice() {
		return 1.5 * this.daiToDraw / this.cdpSizeInEth
	}

	get proceedsOfDaiSaleInEth() {
		return this.daiToDraw / this.worstPriceOfEthInDai
	}

	get providerFee() {
		return this.loanSizeInEth * 0.01
	}

	get exchangeCost() {
		return this.loanSizeInEth - this.proceedsOfDaiSaleInEth
	}

	get totalCost() {
		return this.providerFee + this.exchangeCost + this.leverageSizeInEth
	}
}

const maker = new Maker()
const oasis = new Oasis(OASIS_ADDRESS, WETH_ADDRESS, DAI_ADDRESS)
const cdpOpener = new CdpOpener(maker, oasis)
window.addEventListener('load', cdpOpener.onLoad, { once: true })
window.createCdp = cdpOpener.createCdp
window.update = cdpOpener.updateDerived
