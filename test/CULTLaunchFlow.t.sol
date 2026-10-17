// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {CULTToken} from "../src/CULTToken.sol";

interface CultFlowVm {
    function prank(address sender) external;
    function etch(address target, bytes calldata code) external;
    function expectRevert(bytes4 selector) external;
}

/// @dev Local stand-in for the Uniswap v4 PoolManager's ERC-20 accounting: `sync` snapshots its
/// balance, `settle` credits whatever arrived since, `take` pays out. A token with a transfer fee
/// shows up here as a settle that credits less than was sent, or a take that delivers less.
contract MockPoolManager {
    mapping(address => uint256) public reserves;
    address public synced;
    uint256 public syncedBalance;

    function sync(address currency) external {
        synced = currency;
        syncedBalance = CULTToken(currency).balanceOf(address(this));
    }

    function settle() external returns (uint256 paid) {
        address currency = synced;
        paid = CULTToken(currency).balanceOf(address(this)) - syncedBalance;
        reserves[currency] += paid;
        synced = address(0);
    }

    function take(address currency, address to, uint256 amount) external {
        reserves[currency] -= amount;
        require(CULTToken(currency).transfer(to, amount), "take transfer returned false");
    }
}

/// @dev Stands in for the launch factory: deploys the token and distributes it in one call, as the
/// real launch does in one transaction. Swarm share to the distributor first, then the pool seed
/// through the PoolManager, then any remainder to remainderTo.
contract MockLaunchFactory {
    uint256 constant SWARM_BPS = 1_000;

    function launch(MockPoolManager manager, address distributor, uint256 poolBps, address remainderTo)
        external
        returns (CULTToken token, uint256 swarm, uint256 seeded, uint256 remainder)
    {
        token = new CULTToken();
        uint256 supply = token.totalSupply();
        require(token.balanceOf(address(this)) == supply, "factory must hold the whole supply");
        swarm = supply * SWARM_BPS / 10_000;
        require(token.transfer(distributor, swarm), "swarm transfer");
        uint256 pool = supply * poolBps / 10_000;
        manager.sync(address(token));
        require(token.transfer(address(manager), pool), "seed transfer");
        seeded = manager.settle();
        remainder = token.balanceOf(address(this));
        require(token.transfer(remainderTo, remainder), "remainder transfer");
    }
}

/// @notice The launch as configured in launch.json: 10% swarm, poolBps 9000 seeded into a v4 pool,
/// remainder (zero here) to 0x…dEaD, then traders buying from and selling into the PoolManager.
contract CULTLaunchFlowTest {
    CultFlowVm constant vm = CultFlowVm(address(uint160(uint256(keccak256("hevm cheat code")))));

    // Values copied from launch.json.
    address constant POOL_MANAGER = 0x000000000004444c5dc75cB358380D2e3dE08A90;
    address constant REMAINDER_TO = 0x000000000000000000000000000000000000dEaD;
    uint256 constant POOL_BPS = 9_000;
    uint256 constant INITIAL_MARKET_CAP = 2_500e18;
    uint160 constant INITIAL_SQRT_PRICE = 125270724187523965593206900;
    uint256 constant SUPPLY = 1e27;

    address constant DISTRIBUTOR = address(0xD157);
    address constant CLAIMANT = address(0xC1A1);
    address constant TRADER = address(0x7EAD);

    MockPoolManager manager;
    MockLaunchFactory factory;
    CULTToken token;

    function setUp() public {
        vm.etch(POOL_MANAGER, address(new MockPoolManager()).code);
        manager = MockPoolManager(POOL_MANAGER);
        factory = new MockLaunchFactory();
        uint256 swarm;
        uint256 seeded;
        uint256 remainder;
        (token, swarm, seeded, remainder) = factory.launch(manager, DISTRIBUTOR, POOL_BPS, REMAINDER_TO);
        require(swarm == SUPPLY / 10, "swarm share is not 10%");
        require(seeded == SUPPLY * POOL_BPS / 10_000, "pool seed arrived short");
        require(remainder == 0, "poolBps 9000 plus the swarm 10% leaves no remainder");
    }

    function test_LaunchFlowsArriveExactly() public view {
        require(token.balanceOf(DISTRIBUTOR) == 1e26, "distributor short");
        require(token.balanceOf(POOL_MANAGER) == 9e26, "pool manager short");
        require(manager.reserves(address(token)) == 9e26, "settled seed short");
        require(token.balanceOf(REMAINDER_TO) == 0, "remainder should be empty");
        require(token.balanceOf(address(factory)) == 0, "factory kept tokens");
        require(token.totalSupply() == SUPPLY, "launch changed the supply");
    }

    function test_DistributorClaimsArriveWhole() public {
        vm.prank(DISTRIBUTOR);
        require(token.transfer(CLAIMANT, 2e25), "claim returned false");
        vm.prank(DISTRIBUTOR);
        require(token.transfer(address(0xC1A2), 8e25), "claim returned false");
        require(token.balanceOf(CLAIMANT) == 2e25, "claim short");
        require(token.balanceOf(address(0xC1A2)) == 8e25, "claim short");
        require(token.balanceOf(DISTRIBUTOR) == 0, "distributor kept something");
        vm.expectRevert(CULTToken.InsufficientBalance.selector);
        vm.prank(DISTRIBUTOR);
        token.transfer(CLAIMANT, 1);
    }

    /// @dev Buy (PoolManager pays the trader) and sell back (trader pays the PoolManager, which
    /// settles the measured delta). With no fee both legs move exactly the stated amount.
    function testFuzz_BuyAndSellThroughPoolManagerAreExact(uint256 buyRaw, uint256 sellRaw) public {
        uint256 bought = buyRaw % (9e26 + 1);
        manager.take(address(token), TRADER, bought);
        require(token.balanceOf(TRADER) == bought, "buy arrived short");
        require(token.balanceOf(POOL_MANAGER) == 9e26 - bought, "pool paid more than it said");

        uint256 sold = sellRaw % (bought + 1);
        manager.sync(address(token));
        vm.prank(TRADER);
        require(token.transfer(POOL_MANAGER, sold), "sell transfer returned false");
        require(manager.settle() == sold, "sell settled short");
        require(token.balanceOf(TRADER) == bought - sold, "trader debit mismatch");
        require(manager.reserves(address(token)) == token.balanceOf(POOL_MANAGER), "pool reserves diverged");
        require(token.totalSupply() == SUPPLY, "swaps changed the supply");
    }

    function test_SellMoreThanHeldReverts() public {
        manager.take(address(token), TRADER, 5e18);
        manager.sync(address(token));
        vm.expectRevert(CULTToken.InsufficientBalance.selector);
        vm.prank(TRADER);
        token.transfer(POOL_MANAGER, 5e18 + 1);
        require(manager.settle() == 0, "a reverted sell credited the pool");
        require(token.balanceOf(TRADER) == 5e18, "a reverted sell moved tokens");
    }

    function test_PoolManagerCannotPayOutMoreThanItHolds() public {
        vm.expectRevert(CULTToken.InsufficientBalance.selector);
        vm.prank(POOL_MANAGER);
        token.transfer(TRADER, 9e26 + 1);
        require(token.balanceOf(POOL_MANAGER) == 9e26, "failed payout moved tokens");
    }

    /// @dev The PoolManager address gets no special treatment: it cannot pull a holder's tokens.
    function test_PoolManagerHasNoAllowanceByDefault() public {
        vm.expectRevert(CULTToken.InsufficientAllowance.selector);
        vm.prank(POOL_MANAGER);
        token.transferFrom(DISTRIBUTOR, POOL_MANAGER, 1);
    }

    /// @dev initialPrice is provenance only, but it must agree with the economics: with CULT as
    /// currency0, price = (sqrtPriceX96 / 2^96)^2 = initialMarketCapWei / totalSupply = 2.5e-6.
    function test_ManifestInitialPriceMatchesEconomics() public pure {
        uint256 squared = uint256(INITIAL_SQRT_PRICE) * uint256(INITIAL_SQRT_PRICE);
        uint256 impliedCap = ((squared >> 96) * SUPPLY) >> 96;
        uint256 diff =
            impliedCap > INITIAL_MARKET_CAP ? impliedCap - INITIAL_MARKET_CAP : INITIAL_MARKET_CAP - impliedCap;
        require(diff * 1e6 <= INITIAL_MARKET_CAP, "initialPrice disagrees with initialMarketCapWei by more than 1ppm");
        require(POOL_BPS + 1_000 <= 10_000, "pool and swarm shares exceed the supply");
    }

    /// @dev Factory-style distribution for any poolBps the economics allow: every flow is exact and
    /// the remainder goes to remainderTo, so nothing stays behind in the factory.
    function testFuzz_AnyPoolBpsDistributesWholeSupply(uint256 bpsRaw) public {
        uint256 bps = bpsRaw % 9_001;
        MockLaunchFactory other = new MockLaunchFactory();
        address distributor = address(0xD158);
        address remainderTo = address(0xFEED);
        // A fresh manager-less run: etch a second manager so reserves start empty.
        address managerAt = address(0x4444);
        vm.etch(managerAt, address(new MockPoolManager()).code);
        (CULTToken t, uint256 swarm, uint256 seeded, uint256 remainder) =
            other.launch(MockPoolManager(managerAt), distributor, bps, remainderTo);
        require(t.balanceOf(distributor) == swarm && swarm == SUPPLY / 10, "swarm short");
        require(t.balanceOf(managerAt) == seeded && seeded == SUPPLY * bps / 10_000, "seed short");
        require(t.balanceOf(remainderTo) == remainder && swarm + seeded + remainder == SUPPLY, "remainder short");
        require(t.balanceOf(address(other)) == 0, "factory kept tokens");
    }
}
