pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;
pragma experimental "v0.5.0";

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
}

contract LiquidLong is Ownable, Claimable, Pausable {
	Oasis public oasis;
	Maker public maker;
	Dai private dai;
	Weth private weth;
	Mkr private mkr;

	struct CDP {
		uint256 id;
		uint256 debtInAttodai;
		uint256 lockedAttoeth;
		uint256 feeInAttoeth;
		uint256 exchangeCostInAttoeth;
		bool userOwned;
	}

	constructor(Oasis _oasis, Maker _maker) public {
		oasis = _oasis;
		maker = _maker;
		dai = maker.sai();
		weth = maker.gem();
		mkr = maker.gov();
	}

	function mul27(uint256 a, uint256 b) private pure returns (uint256) {
		return (a * b + 5 * 10**26) / 10**27;
	}

	function mul18(uint256 a, uint256 b) private pure returns (uint256) {
		return (a * b + 5 * 10**17) / 10**18;
	}

	function ethPriceInUsd() public view returns (uint256 _attousd) {
		return uint256(maker.pip().read());
	}

	function estimateDaiSaleProceeds(uint256 _attodaiToSell) public view returns (uint256 _attoeth) {
		return oasis.getPayAmount(dai, weth, _attodaiToSell);
	}

	function estimateDaiPurchaseCosts(uint256 _attodaiToBuy) public view returns (uint256 _attoeth) {
		return oasis.getPayAmount(weth, dai, _attodaiToBuy);
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
			// this is fine... (no, I don't have any idea what this does)
			uint256 _lockedAttoeth = mul27(_collateral + 1, mul18(maker.gap(), maker.per()));
			uint256 _costToBuyDaiInAttoeth = estimateDaiPurchaseCosts(_debtInAttodai);
			uint256 _feedCostToBuyDaiInAttoeth = mul18(_debtInAttodai, ethPriceInUsd());
			uint256 _exchangeCostInAttoeth = (_costToBuyDaiInAttoeth > _feedCostToBuyDaiInAttoeth) ? _costToBuyDaiInAttoeth - _feedCostToBuyDaiInAttoeth : 0;
			_cdps[_matchCount] = CDP({
				id: _i,
				debtInAttodai: _debtInAttodai,
				lockedAttoeth: _lockedAttoeth,
				feeInAttoeth: _costToBuyDaiInAttoeth / 100,
				exchangeCostInAttoeth: _exchangeCostInAttoeth,
				userOwned: true
			});
			++_matchCount;
		}
		return _cdps;
	}

	function cdpCount() public view returns (uint256 _cdpCount) {
		return maker.cupi();
	}
}
