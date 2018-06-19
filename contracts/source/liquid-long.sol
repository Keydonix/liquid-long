pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;
pragma experimental "v0.5.0";

/**
* @title SafeMath
* @dev Math operations with safety checks that throw on error
* https://github.com/OpenZeppelin/openzeppelin-solidity/blob/56515380452baad9fcd32c5d4502002af0183ce9/contracts/math/SafeMath.sol
*/
library SafeMath {

	/**
	* @dev Multiplies two numbers, throws on overflow.
	*/
	function mul(uint256 a, uint256 b) internal pure returns (uint256 c) {
		// Gas optimization: this is cheaper than asserting 'a' not being zero, but the
		// benefit is lost if 'b' is also tested.
		// See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
		if (a == 0) {
			return 0;
		}
		c = a * b;
		assert(c / a == b);
		return c;
	}

	/**
	* @dev Integer division of two numbers, truncating the quotient.
	*/
	function div(uint256 a, uint256 b) internal pure returns (uint256) {
		// assert(b > 0); // Solidity automatically throws when dividing by 0
		// uint256 c = a / b;
		// assert(a == b * c + a % b); // There is no case in which this doesn't hold
		return a / b;
	}

	/**
	* @dev Subtracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
	*/
	function sub(uint256 a, uint256 b) internal pure returns (uint256) {
		assert(b <= a);
		return a - b;
	}

	/**
	* @dev Adds two numbers, throws on overflow.
	*/
	function add(uint256 a, uint256 b) internal pure returns (uint256 c) {
		c = a + b;
		assert(c >= a);
		return c;
	}
}

/**
 * @title ERC20Basic
 * @dev Simpler version of ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/179
 * https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC20/ERC20Basic.sol
 */
contract ERC20Basic {
	function totalSupply() public view returns (uint256);
	function balanceOf(address who) public view returns (uint256);
	function transfer(address to, uint256 value) public returns (bool);
	event Transfer(address indexed from, address indexed to, uint256 value);
}

/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 * https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC20/ERC20.sol
 */
contract ERC20 is ERC20Basic {
	function allowance(address owner, address spender) public view returns (uint256);

	function transferFrom(address from, address to, uint256 value) public returns (bool);

	function approve(address spender, uint256 value) public returns (bool);
	event Approval(address indexed owner, address indexed spender, uint256 value);
}

/**
 * @title Ownable
 * @dev The Ownable contract has an owner address, and provides basic authorization control
 * functions, this simplifies the implementation of "user permissions".
 * https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/ownership/Ownable.sol
 */
contract Ownable {
	address public owner;


	event OwnershipRenounced(address indexed previousOwner);
	event OwnershipTransferred(
		address indexed previousOwner,
		address indexed newOwner
	);


	/**
	 * @dev The Ownable constructor sets the original `owner` of the contract to the sender
	 * account.
	 */
	constructor() public {
		owner = msg.sender;
	}

	/**
	 * @dev Throws if called by any account other than the owner.
	 */
	modifier onlyOwner() {
		require(msg.sender == owner);
		_;
	}

	/**
	 * @dev Allows the current owner to transfer control of the contract to a newOwner.
	 * @param newOwner The address to transfer ownership to.
	 */
	function transferOwnership(address newOwner) public onlyOwner {
		require(newOwner != address(0));
		emit OwnershipTransferred(owner, newOwner);
		owner = newOwner;
	}

	/**
	 * @dev Allows the current owner to relinquish control of the contract.
	 */
	function renounceOwnership() public onlyOwner {
		emit OwnershipRenounced(owner);
		owner = address(0);
	}
}

/**
 * @title Claimable
 * @dev Extension for the Ownable contract, where the ownership needs to be claimed.
 * This allows the new owner to accept the transfer.
 * https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/ownership/Claimable.sol
 */
contract Claimable is Ownable {
	address public pendingOwner;

	/**
	 * @dev Modifier throws if called by any account other than the pendingOwner.
	 */
	modifier onlyPendingOwner() {
		require(msg.sender == pendingOwner);
		_;
	}

	/**
	 * @dev Allows the current owner to set the pendingOwner address.
	 * @param newOwner The address to transfer ownership to.
	 */
	function transferOwnership(address newOwner) onlyOwner public {
		pendingOwner = newOwner;
	}

	/**
	 * @dev Allows the pendingOwner address to finalize the transfer.
	 */
	function claimOwnership() onlyPendingOwner public {
		emit OwnershipTransferred(owner, pendingOwner);
		owner = pendingOwner;
		pendingOwner = address(0);
	}
}

/**
 * @title Pausable
 * @dev Base contract which allows children to implement an emergency stop mechanism.
 * https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/lifecycle/Pausable.sol
 */
contract Pausable is Ownable {
	event Pause();
	event Unpause();

	bool public paused = false;


	/**
	 * @dev Modifier to make a function callable only when the contract is not paused.
	 */
	modifier whenNotPaused() {
		require(!paused);
		_;
	}

	/**
	 * @dev Modifier to make a function callable only when the contract is paused.
	 */
	modifier whenPaused() {
		require(paused);
		_;
	}

	/**
	 * @dev called by the owner to pause, triggers stopped state
	 */
	function pause() onlyOwner whenNotPaused public {
		paused = true;
		emit Pause();
	}

	/**
	 * @dev called by the owner to unpause, returns to normal state
	 */
	function unpause() onlyOwner whenPaused public {
		paused = false;
		emit Unpause();
	}
}

/**
 * @title PullPayment
 * @dev Base contract supporting async send for pull payments. Inherit from this
 * contract and use asyncSend instead of send or transfer.
 * https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/payment/PullPayment.sol
 */
contract PullPayment {
	using SafeMath for uint256;

	mapping(address => uint256) public payments;
	uint256 public totalPayments;

	/**
	* @dev Withdraw accumulated balance, called by payee.
	*/
	function withdrawPayments() public {
		address payee = msg.sender;
		uint256 payment = payments[payee];

		require(payment != 0);
		require(address(this).balance >= payment);

		totalPayments = totalPayments.sub(payment);
		payments[payee] = 0;

		payee.transfer(payment);
	}

	/**
	* @dev Called by the payer to store the sent amount as credit to be pulled.
	* @param dest The destination address of the funds.
	* @param amount The amount to transfer.
	*/
	function asyncSend(address dest, uint256 amount) internal {
		payments[dest] = payments[dest].add(amount);
		totalPayments = totalPayments.add(amount);
	}
}

contract Dai is ERC20 {

}

contract Weth is ERC20 {

}

contract Mkr is ERC20 {

}

contract Peth is ERC20 {

}

contract Oasis {
	function getBuyAmount(ERC20 tokenToBuy, ERC20 tokenToPay, uint256 amountToPay) external view returns(uint256 amountBought);
	function getPayAmount(ERC20 tokenToPay, ERC20 tokenToBuy, uint amountToBuy) public constant returns (uint amountPaid);
	function getBestOffer(ERC20 sell_gem, ERC20 buy_gem) public constant returns(uint offerId);
	function getWorseOffer(uint id) public constant returns(uint offerId);
	function getOffer(uint id) public constant returns (uint pay_amt, ERC20 pay_gem, uint buy_amt, ERC20 buy_gem);
}

contract Medianizer {
	function read() external view returns(bytes32);
}

contract Maker {
	function sai() external view returns(Dai);
	function gem() external view returns(Weth);
	function gov() external view returns(Mkr);
	function skr() external view returns(Peth);
	function pip() external view returns(Medianizer);

	// Join-Exit Spread
	 uint256 public gap;

	struct Cup {
		// CDP owner
		address  lad;
		// Locked collateral (in SKR)
		uint256  ink;
		// Outstanding normalised debt (tax only)
		uint256  art;
		// Outstanding normalised debt
		uint256  ire;
	}

	uint256 public cupi;
	mapping (bytes32 => Cup) public cups;

	function lad(bytes32 cup) public view returns (address);
	function per() public view returns (uint ray);
	function tab(bytes32 cup) public returns (uint);
	function rap(bytes32 cup) public returns (uint);
	function chi() public returns (uint);

	function open() public returns (bytes32 cup);
	function give(bytes32 cup, address guy) public;
	function lock(bytes32 cup, uint wad) public;
	function draw(bytes32 cup, uint wad) public;
	function join(uint wad) public;
}

contract LiquidLong is Ownable, Claimable, Pausable, PullPayment {
	using SafeMath for uint256;

	uint256 public providerFeePerEth;

	Oasis public oasis;
	Maker public maker;
	Dai private dai;
	Weth private weth;
	Peth private peth;
	Mkr private mkr;

	event NewCup(address user, bytes32 cup);

	struct CDP {
		uint256 id;
		uint256 debtInAttodai;
		uint256 lockedAttoeth;
		uint256 feeInAttoeth;
		uint256 liquidationCostInAttoeth;
		uint256 liquidatableDebtInAttodai;
		uint256 liquidationCostAtFeedPriceInAttoeth;
		bool userOwned;
	}

	constructor(Oasis _oasis, Maker _maker) public {
		oasis = _oasis;
		maker = _maker;
		dai = maker.sai();
		weth = maker.gem();
		peth = maker.skr();
		mkr = maker.gov();

		// Oasis buy/sell
		dai.approve(address(_oasis), uint256(-1));
		weth.approve(address(_oasis), uint256(-1));
		// Wipe
		dai.approve(address(_maker), uint256(-1));
		mkr.approve(address(_maker), uint256(-1));
		// Join
		weth.approve(address(_maker), uint256(-1));
		// Lock
		peth.approve(address(_maker), uint256(-1));
	}

	function mul27(uint256 a, uint256 b) private pure returns (uint256) {
		return (a * b + 5 * 10**26) / 10**27;
	}

	function mul18(uint256 a, uint256 b) private pure returns (uint256) {
		return (a * b + 5 * 10**17) / 10**18;
	}

	function div18(uint256 a, uint256 b) private pure returns (uint256) {
		return (a * 10**18 + b / 2) / b;
	}

	function ethPriceInUsd() public view returns (uint256 _attousd) {
		return uint256(maker.pip().read());
	}

	function estimateDaiSaleProceeds(uint256 _attodaiToSell) public view returns (uint256 _daiPaid, uint256 _wethBought) {
		return getPayPriceAndAmount(dai, weth, _attodaiToSell);
	}

	function estimateDaiPurchaseCosts(uint256 _attodaiToBuy) public view returns (uint256 _wethPaid, uint256 _daiBought) {
		return getBuyPriceAndAmount(weth, dai, _attodaiToBuy);
	}

	// pay_amount and buy_amount form a ratio for price determination, and are not used for limiting order book inspection
	function getVolumeAtPrice(ERC20 _payGem, ERC20 _buyGem, uint256 _payAmount, uint256 _buyAmount) public view returns (uint256 _paidAmount, uint256 _boughtAmount) {
		uint256 _offerId = oasis.getBestOffer(_buyGem, _payGem);
		while (_offerId != 0) {
			(uint256 _offerPayAmount, , uint256 _offerBuyAmount,) = oasis.getOffer(_offerId);
			if (_offerPayAmount.mul(_payAmount) < _offerBuyAmount.mul(_buyAmount)) {
				break;
			}
			_paidAmount = _paidAmount.add(_offerBuyAmount);
			_boughtAmount = _boughtAmount.add(_offerPayAmount);
			_offerId = oasis.getWorseOffer(_offerId);
		}
		return (_paidAmount, _boughtAmount);
	}

	// buy/pay are from the perspective of the taker/caller (Oasis contracts use buy/pay terminology from perspective of the maker)
	function getBuyPriceAndAmount(ERC20 _payGem, ERC20 _buyGem, uint256 _buyDesiredAmount) public view returns (uint256 _paidAmount, uint256 _boughtAmount) {
		uint256 _offerId = oasis.getBestOffer(_buyGem, _payGem);
		while (_offerId != 0) {
			uint256 _buyRemaining = _buyDesiredAmount.sub(_boughtAmount);
			(uint256 _buyAvailableInOffer, , uint256 _payAvailableInOffer,) = oasis.getOffer(_offerId);
			if (_buyRemaining <= _buyAvailableInOffer) {
				// TODO: safe math after verifying this logic is correct
				uint256 _payRemaining = (_buyRemaining * _payAvailableInOffer / _buyAvailableInOffer);
				_paidAmount = _paidAmount.add(_payRemaining);
				_boughtAmount = _boughtAmount.add(_buyRemaining);
				break;
			}
			_paidAmount = _paidAmount.add(_payAvailableInOffer);
			_boughtAmount = _boughtAmount.add(_buyAvailableInOffer);
			_offerId = oasis.getWorseOffer(_offerId);
		}
		return (_paidAmount, _boughtAmount);
	}

	// buy/pay are from the perspective of the taker/caller (Oasis contracts use buy/pay terminology from perspective of the maker)
	function getPayPriceAndAmount(ERC20 _payGem, ERC20 _buyGem, uint256 _payDesiredAmount) public view returns (uint256 _paidAmount, uint256 _boughtAmount) {
		uint256 _offerId = oasis.getBestOffer(_buyGem, _payGem);
		while (_offerId != 0) {
			uint256 _payRemaining = _payDesiredAmount.sub(_paidAmount);
			(uint256 _buyAvailableInOffer, , uint256 _payAvailableInOffer,) = oasis.getOffer(_offerId);
			if (_payRemaining <= _payAvailableInOffer) {
				// TODO: safe math after verifying this logic is correct
				uint256 _buyRemaining = (_payRemaining * _buyAvailableInOffer / _payAvailableInOffer);
				_paidAmount = _paidAmount.add(_payRemaining);
				_boughtAmount = _boughtAmount.add(_buyRemaining);
				break;
			}
			_paidAmount = _paidAmount.add(_payAvailableInOffer);
			_boughtAmount = _boughtAmount.add(_buyAvailableInOffer);
			_offerId = oasis.getWorseOffer(_offerId);
		}
		return (_paidAmount, _boughtAmount);
	}

	function getCdps(address _user, uint256 _offset, uint256 _pageSize) public returns (CDP[] _cdps) {
		uint256 _cdpCount = cdpCount();
		uint256 _matchCount = 0;
		for (uint256 _i = _offset; _i <= _cdpCount && _i < _offset + _pageSize; ++_i) {
			(address _cdpOwner,,,) = maker.cups(bytes32(_i));
			if (_cdpOwner != _user) continue;
			++_matchCount;
		}
		_cdps = new CDP[](_matchCount);
		_matchCount = 0;
		for (uint256 _i = _offset; _i <= _cdpCount && _i < _offset + _pageSize; ++_i) {
			(address _cdpOwner, uint256 _collateral,,) = maker.cups(bytes32(_i));
			if (_cdpOwner != _user) continue;
			// this one line makes this function not `view`. tab calls chi, which calls drip which mutates state and we can't directly access _chi to bypass this
			uint256 _debtInAttodai = maker.tab(bytes32(_i));
			// Adjust locked attoeth to factor in peth/weth ratio
			uint256 _lockedAttoeth = mul27(_collateral + 1, mul18(maker.gap(), maker.per()));
			// We use two values in case order book can not satisfy closing CDP
			// Can be closed if _liqudationDebtInAttodai == _debtInAttodai
			(uint256 _liquidationCostInAttoeth, uint256 _liquidatableDebtInAttodai) = estimateDaiPurchaseCosts(_debtInAttodai);
			uint256 _liquidationCostAtFeedPriceInAttoeth = div18(_debtInAttodai, ethPriceInUsd());
			_cdps[_matchCount] = CDP({
				id: _i,
				debtInAttodai: _debtInAttodai,
				lockedAttoeth: _lockedAttoeth,
				feeInAttoeth: _liquidationCostInAttoeth / 100,
				liquidationCostInAttoeth: _liquidationCostInAttoeth,
				liquidatableDebtInAttodai: _liquidatableDebtInAttodai,
				liquidationCostAtFeedPriceInAttoeth: _liquidationCostAtFeedPriceInAttoeth,
				userOwned: true
			});
			++_matchCount;
		}
		return _cdps;
	}

	function cdpCount() public view returns (uint256 _cdpCount) {
		return maker.cupi();
	}

	// TODO: everything
	function openCdp(uint256 leverage, uint256 exchangeCostsInAttoeth, uint256 feesInAttoeth, uint256 affiliateFeeInAttoeth, address affiliateAddress) public payable returns (bytes32 _cup)  {
		require(leverage >= 100 && leverage <= 300);
		_cup = maker.open();
		emit NewCup(msg.sender, _cup);
		maker.give(_cup, msg.sender);
	}
}
