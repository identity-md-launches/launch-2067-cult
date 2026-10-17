// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import {CULTToken} from "../src/CULTToken.sol";

interface CultSmokeVm {
    function prank(address sender) external;
    function expectRevert(bytes4 selector) external;
    function expectEmit(bool topic1, bool topic2, bool topic3, bool data, address emitter) external;
}

/// @dev Test-only deployer used to check the constructor's immediate supply recipient.
contract CultSmokeFactory {
    function deploy(bytes32 salt) external returns (CULTToken) {
        return new CULTToken{salt: salt}();
    }
}

contract CULTLaunchSmokeTest {
    CultSmokeVm constant vm = CultSmokeVm(address(uint160(uint256(keccak256("hevm cheat code")))));
    uint256 constant SUPPLY = 1e27;
    address constant RECIPIENT = address(0xA11CE);
    address constant SPENDER = address(0x5EED);

    event Transfer(address indexed from, address indexed to, uint256 value);

    function test_Create2DeploymentMintsEntireSupplyToFactory() public {
        CultSmokeFactory factory = new CultSmokeFactory();
        bytes32 salt = keccak256("CULT launch smoke test");
        address predicted = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(bytes1(0xff), address(factory), salt, keccak256(type(CULTToken).creationCode))
                    )
                )
            )
        );

        vm.expectEmit(true, true, false, true, predicted);
        emit Transfer(address(0), address(factory), SUPPLY);
        CULTToken token = factory.deploy(salt);

        require(address(token) == predicted, "creation code needs no constructor arguments");
        require(token.totalSupply() == SUPPLY, "manifest supply mismatch");
        require(token.balanceOf(address(factory)) == SUPPLY, "factory must receive all supply");
        require(token.balanceOf(address(this)) == 0, "factory caller must receive nothing");
        require(token.balanceOf(address(token)) == 0, "token must reserve nothing");
    }

    function test_WholeBalanceTransferAndOverspend() public {
        CULTToken token = new CULTToken();
        vm.expectEmit(true, true, false, true, address(token));
        emit Transfer(address(this), RECIPIENT, SUPPLY);
        require(token.transfer(RECIPIENT, SUPPLY), "transfer must return true");

        vm.expectRevert(CULTToken.InsufficientBalance.selector);
        token.transfer(RECIPIENT, 1);
        require(token.balanceOf(address(this)) == 0, "deployer balance must be empty");
        require(token.balanceOf(RECIPIENT) == SUPPLY, "recipient must receive all supply without tax");
        require(token.totalSupply() == SUPPLY, "transfers must not change supply");
    }

    function test_InvalidRecipientPreservesAllowanceForNextTransfer() public {
        CULTToken token = new CULTToken();
        require(token.approve(SPENDER, 7e18), "approval must return true");

        vm.expectRevert(CULTToken.InvalidReceiver.selector);
        vm.prank(SPENDER);
        token.transferFrom(address(this), address(0), 3e18);

        require(token.allowance(address(this), SPENDER) == 7e18, "failed transfer spent allowance");
        require(token.balanceOf(address(this)) == SUPPLY, "failed transfer moved tokens");
        require(token.balanceOf(address(0)) == 0, "failed transfer credited zero address");

        vm.prank(SPENDER);
        require(token.transferFrom(address(this), RECIPIENT, 3e18), "valid transfer must still succeed");
        require(token.allowance(address(this), SPENDER) == 4e18, "successful spend must reduce allowance");
        require(token.balanceOf(RECIPIENT) == 3e18, "allowance transfer arrived short");
        require(token.balanceOf(address(this)) == SUPPLY - 3e18, "sender debit mismatch");
        require(token.totalSupply() == SUPPLY, "allowance transfers must not change supply");
    }
}
