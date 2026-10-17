// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {CULTToken} from "../src/CULTToken.sol";

interface CultInvariantVm {
    function prank(address sender) external;
}

/// @dev Drives the token with random sequences of transfers, approvals and allowance spends from a
/// fixed set of holders (including the Uniswap v4 PoolManager address), and mirrors every successful
/// call in ghost state so the invariants can compare the token against an independent model.
contract CULTHandler {
    CultInvariantVm constant vm = CultInvariantVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address constant POOL_MANAGER = 0x000000000004444c5dc75cB358380D2e3dE08A90;

    CULTToken public immutable token;
    address[] public actors;

    mapping(address => uint256) public ghostBalance;
    mapping(address => mapping(address => uint256)) public ghostAllowance;
    uint256 public successfulCalls;
    uint256 public rejectedCalls;
    bool public rejectedCallChangedState;

    constructor(CULTToken token_, address[] memory actors_) {
        token = token_;
        actors = actors_;
        for (uint256 i; i < actors_.length; ++i) {
            ghostBalance[actors_[i]] = token_.balanceOf(actors_[i]);
        }
    }

    function actorCount() external view returns (uint256) {
        return actors.length;
    }

    function _actor(uint256 seed) internal view returns (address) {
        return actors[seed % actors.length];
    }

    function transfer(uint256 fromSeed, uint256 toSeed, uint256 amount) external {
        address from = _actor(fromSeed);
        address to = _actor(toSeed);
        amount = amount % (ghostBalance[from] + 1);
        vm.prank(from);
        require(token.transfer(to, amount), "transfer returned false");
        ghostBalance[from] -= amount;
        ghostBalance[to] += amount;
        ++successfulCalls;
    }

    function approve(uint256 ownerSeed, uint256 spenderSeed, uint256 amount) external {
        address owner = _actor(ownerSeed);
        address spender = _actor(spenderSeed);
        // Exercise the infinite-allowance branch regularly, not once in 2^256.
        if (amount % 5 == 0) amount = type(uint256).max;
        vm.prank(owner);
        require(token.approve(spender, amount), "approve returned false");
        ghostAllowance[owner][spender] = amount;
        ++successfulCalls;
    }

    function transferFrom(uint256 spenderSeed, uint256 fromSeed, uint256 toSeed, uint256 amount) external {
        address spender = _actor(spenderSeed);
        address from = _actor(fromSeed);
        address to = _actor(toSeed);
        uint256 allowed = ghostAllowance[from][spender];
        uint256 cap = ghostBalance[from] < allowed ? ghostBalance[from] : allowed;
        amount = amount % (cap + 1);
        vm.prank(spender);
        require(token.transferFrom(from, to, amount), "transferFrom returned false");
        if (allowed != type(uint256).max) ghostAllowance[from][spender] = allowed - amount;
        ghostBalance[from] -= amount;
        ghostBalance[to] += amount;
        ++successfulCalls;
    }

    /// @dev Every way a call should fail. Each must revert and leave balances and allowances untouched.
    function attemptInvalid(uint256 kind, uint256 aSeed, uint256 bSeed, uint256 extra) external {
        address a = _actor(aSeed);
        address b = _actor(bSeed);
        kind %= 5;
        bytes memory data;
        address caller = a;
        if (kind == 0) {
            // Overspend: one more than the whole balance.
            data = abi.encodeCall(CULTToken.transfer, (b, ghostBalance[a] + 1 + (extra % 1e30)));
        } else if (kind == 1) {
            data = abi.encodeCall(CULTToken.transfer, (address(0), extra % (ghostBalance[a] + 1)));
        } else if (kind == 2) {
            data = abi.encodeCall(CULTToken.approve, (address(0), extra));
        } else if (kind == 3) {
            // Spend above the allowance (skipped when it is unlimited).
            uint256 allowed = ghostAllowance[b][a];
            if (allowed > type(uint256).max - 1e30 - 1) return;
            data = abi.encodeCall(CULTToken.transferFrom, (b, a, allowed + 1 + (extra % 1e30)));
        } else {
            // Spend within the allowance but above the owner's balance.
            uint256 allowed = ghostAllowance[b][a];
            uint256 over = ghostBalance[b] + 1 + (extra % 1e30);
            if (allowed < over) return;
            data = abi.encodeCall(CULTToken.transferFrom, (b, a, over));
        }
        uint256 balA = token.balanceOf(a);
        uint256 balB = token.balanceOf(b);
        uint256 allowanceBA = token.allowance(b, a);
        vm.prank(caller);
        (bool ok,) = address(token).call(data);
        if (ok) rejectedCallChangedState = true;
        if (token.balanceOf(a) != balA || token.balanceOf(b) != balB || token.allowance(b, a) != allowanceBA) {
            rejectedCallChangedState = true;
        }
        ++rejectedCalls;
    }
}

/// @notice Random call sequences over the token. Supply is fixed, balances always sum to it, and every
/// balance and allowance matches an independent model of a plain fee-free ERC-20.
contract CULTInvariantTest {
    uint256 constant SUPPLY = 1e27;
    address constant POOL_MANAGER = 0x000000000004444c5dc75cB358380D2e3dE08A90;

    CULTToken token;
    CULTHandler handler;
    address[] actors;

    function setUp() public {
        token = new CULTToken();
        actors.push(address(0xA11CE));
        actors.push(address(0xB0B));
        actors.push(address(0xC4A1));
        actors.push(POOL_MANAGER);
        actors.push(address(0xD157));
        // Hand the whole supply to the first actor so every unit is inside the modelled set.
        require(token.transfer(actors[0], SUPPLY), "seed transfer failed");
        handler = new CULTHandler(token, actors);
    }

    function targetContracts() public view returns (address[] memory targets) {
        targets = new address[](1);
        targets[0] = address(handler);
    }

    function invariant_totalSupplyIsFixed() public view {
        require(token.totalSupply() == SUPPLY, "total supply changed");
    }

    function invariant_balancesSumToSupply() public view {
        uint256 sum;
        for (uint256 i; i < actors.length; ++i) {
            sum += token.balanceOf(actors[i]);
        }
        require(sum == SUPPLY, "balances do not sum to the supply");
        require(token.balanceOf(address(this)) == 0, "deployer regained tokens");
        require(token.balanceOf(address(token)) == 0, "token holds its own supply");
        require(token.balanceOf(address(0)) == 0, "zero address holds tokens");
    }

    function invariant_balancesMatchModel() public view {
        for (uint256 i; i < actors.length; ++i) {
            require(token.balanceOf(actors[i]) == handler.ghostBalance(actors[i]), "balance diverged from model");
        }
    }

    function invariant_allowancesMatchModel() public view {
        for (uint256 i; i < actors.length; ++i) {
            for (uint256 j; j < actors.length; ++j) {
                require(
                    token.allowance(actors[i], actors[j]) == handler.ghostAllowance(actors[i], actors[j]),
                    "allowance diverged from model"
                );
            }
        }
    }

    function invariant_rejectedCallsChangeNothing() public view {
        require(!handler.rejectedCallChangedState(), "a call that should revert succeeded or changed state");
    }

    function invariant_metadataIsConstant() public view {
        require(keccak256(bytes(token.name())) == keccak256("Cult"), "name changed");
        require(keccak256(bytes(token.symbol())) == keccak256("CULT"), "symbol changed");
        require(token.decimals() == 18, "decimals changed");
    }
}
