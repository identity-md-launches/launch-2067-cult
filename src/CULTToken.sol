// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @notice Cult: a fixed-supply, permissionless ERC-20 with no administrative roles.
/// @dev The launch factory receives the entire supply as deployer. Distribution is external.
contract CULTToken {
    string public constant name = "Cult";
    string public constant symbol = "CULT";
    uint8 public constant decimals = 18;
    uint256 public constant totalSupply = 1_000_000_000 * 10 ** 18;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    error InvalidSender();
    error InvalidReceiver();
    error InvalidSpender();
    error InsufficientBalance();
    error InsufficientAllowance();

    constructor() {
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        if (spender == address(0)) revert InvalidSpender();
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 approved = allowance[from][msg.sender];
        if (approved != type(uint256).max) {
            if (approved < value) revert InsufficientAllowance();
            unchecked {
                allowance[from][msg.sender] = approved - value;
            }
        }
        _transfer(from, to, value);
        return true;
    }

    function _transfer(address from, address to, uint256 value) private {
        if (from == address(0)) revert InvalidSender();
        if (to == address(0)) revert InvalidReceiver();
        uint256 balance = balanceOf[from];
        if (balance < value) revert InsufficientBalance();
        unchecked {
            balanceOf[from] = balance - value;
            // The entire supply is below uint256.max, and no function can mint more.
            balanceOf[to] += value;
        }
        emit Transfer(from, to, value);
    }
}
