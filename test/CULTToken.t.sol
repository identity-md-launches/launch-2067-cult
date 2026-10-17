// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {CULTToken} from "../src/CULTToken.sol";

interface Vm {
    function prank(address) external;
    function expectRevert(bytes4) external;
    function expectEmit(bool, bool, bool, bool) external;
}

contract CULTTokenTest {
    Vm constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    address constant ALICE = address(0xA11CE);
    address constant BOB = address(0xB0B);
    address constant SPENDER = address(0x5EED);
    address constant POOL = 0x000000000004444c5dc75cB358380D2e3dE08A90;
    uint256 constant SUPPLY = 1e27;
    CULTToken token;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function setUp() public {
        token = new CULTToken();
    }

    function test_WholeSupplyBelongsToDeployer() public view {
        require(token.totalSupply() == SUPPLY);
        require(token.balanceOf(address(this)) == SUPPLY);
        require(token.decimals() == 18);
        require(keccak256(bytes(token.name())) == keccak256("Cult"));
        require(keccak256(bytes(token.symbol())) == keccak256("CULT"));
    }

    function test_LaunchDistributionAndPoolTransfersArriveWhole() public {
        // ALICE is a local distributor stand-in. No distributor is deployed by this project.
        token.transfer(ALICE, SUPPLY / 10);
        token.transfer(POOL, SUPPLY * 9 / 10);
        vm.prank(ALICE);
        token.transfer(BOB, SUPPLY / 10);
        vm.prank(POOL);
        token.transfer(BOB, 123e18);
        vm.prank(BOB);
        token.transfer(POOL, 123e18);
        require(token.balanceOf(POOL) == SUPPLY * 9 / 10);
        require(token.balanceOf(BOB) == SUPPLY / 10);
        require(token.balanceOf(address(this)) == 0);
        require(token.totalSupply() == SUPPLY);
    }

    /// forge-config: default.fuzz.runs = 1000
    function testFuzz_TransferRoundTripPreservesSupply(uint256 raw) public {
        uint256 amount = raw % (SUPPLY + 1);
        token.transfer(ALICE, amount);
        require(token.balanceOf(ALICE) == amount);
        vm.prank(ALICE);
        token.transfer(address(this), amount);
        require(token.balanceOf(address(this)) == SUPPLY);
        require(token.balanceOf(ALICE) == 0);
        require(token.totalSupply() == SUPPLY);
    }

    /// forge-config: default.fuzz.runs = 1000
    function testFuzz_AllowancesConserveBalancesAndRevoke(uint256 raw) public {
        uint256 amount = raw % (SUPPLY + 1);
        token.approve(SPENDER, amount);
        vm.prank(SPENDER);
        token.transferFrom(address(this), ALICE, amount);
        require(token.allowance(address(this), SPENDER) == 0);
        require(token.balanceOf(address(this)) + token.balanceOf(ALICE) == SUPPLY);
        token.approve(SPENDER, 0);
        vm.expectRevert(CULTToken.InsufficientAllowance.selector);
        vm.prank(SPENDER);
        token.transferFrom(address(this), BOB, 1);
    }

    function test_InfiniteAllowanceAndSelfTransfer() public {
        token.approve(SPENDER, type(uint256).max);
        vm.prank(SPENDER);
        token.transferFrom(address(this), address(this), SUPPLY);
        require(token.balanceOf(address(this)) == SUPPLY);
        require(token.allowance(address(this), SPENDER) == type(uint256).max);
        token.transfer(ALICE, 0);
        require(token.balanceOf(ALICE) == 0);
    }

    function test_RejectedTransfersAreAtomic() public {
        vm.expectRevert(CULTToken.InvalidSender.selector);
        token.transferFrom(address(0), ALICE, 0);
        token.approve(SPENDER, type(uint128).max);
        vm.expectRevert(CULTToken.InsufficientBalance.selector);
        vm.prank(SPENDER);
        token.transferFrom(address(this), ALICE, SUPPLY + 1);
        require(token.allowance(address(this), SPENDER) == type(uint128).max);
        vm.expectRevert(CULTToken.InvalidReceiver.selector);
        token.transfer(address(0), 1);
        vm.expectRevert(CULTToken.InvalidSpender.selector);
        token.approve(address(0), 1);
        vm.expectRevert(CULTToken.InsufficientAllowance.selector);
        vm.prank(ALICE);
        token.transferFrom(address(this), ALICE, 1);
        require(token.balanceOf(address(this)) == SUPPLY);
    }

    function test_EventsReflectActualTransfersAndApprovals() public {
        vm.expectEmit(true, true, false, true);
        emit Approval(address(this), SPENDER, 17);
        token.approve(SPENDER, 17);
        vm.expectEmit(true, true, false, true);
        emit Transfer(address(this), ALICE, 17);
        vm.prank(SPENDER);
        token.transferFrom(address(this), ALICE, 17);
    }

    function test_NoPrivilegedEntrypointsEvenForDeployer() public {
        token.transfer(ALICE, 100);
        string[9] memory calls = [
            "mint(address,uint256)",
            "burnFrom(address,uint256)",
            "pause()",
            "blacklist(address)",
            "seize(address)",
            "transferOwnership(address)",
            "upgradeTo(address)",
            "initialize(address)",
            "owner()"
        ];
        for (uint256 i; i < calls.length; ++i) {
            (bool ok,) = address(token).call(abi.encodeWithSignature(calls[i], ALICE, 1));
            require(!ok, calls[i]);
        }
        vm.prank(ALICE);
        token.transfer(BOB, 100);
        require(token.balanceOf(BOB) == 100 && token.totalSupply() == SUPPLY);
    }

    function test_NoForbiddenRuntimeOpcodes() public view {
        bytes memory code = address(token).code;
        for (uint256 i; i < code.length; ++i) {
            uint8 op = uint8(code[i]);
            if (op >= 0x60 && op <= 0x7f) {
                i += op - 0x5f;
                continue;
            }
            require(op != 0xf4 && op != 0xf2 && op != 0xff);
        }
    }

    /// forge-config: default.fuzz.runs = 1000
    function testFuzz_SequenceConservesWholeSupply(uint256 seed) public {
        address[4] memory actors = [address(this), ALICE, BOB, SPENDER];
        for (uint256 i; i < 40; ++i) {
            seed = uint256(keccak256(abi.encode(seed, i)));
            address from = actors[seed % 4];
            address to = actors[(seed >> 8) % 4];
            uint256 amount = (seed >> 16) % (token.balanceOf(from) + 1);
            vm.prank(from);
            token.transfer(to, amount);
            uint256 sum;
            for (uint256 j; j < 4; ++j) {
                sum += token.balanceOf(actors[j]);
            }
            require(sum == SUPPLY && token.totalSupply() == SUPPLY);
        }
    }
}
