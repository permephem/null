// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/NullWarrant.sol";

contract NullWarrantTest is Test {
    NullWarrant warrant;
    address owner;
    address authorizedIssuer;
    address unauthorizedUser;
    
    bytes32 ticketCommit = keccak256("test-ticket-123");
    
    event WarrantIssued(
        bytes32 indexed warrantId,
        bytes32 indexed ticketCommit,
        string reason,
        address indexed issuer
    );
    
    event WarrantExecuted(
        bytes32 indexed warrantId,
        bytes32 indexed ticketCommit,
        address indexed issuer
    );
    
    event AuthorizedIssuerSet(address indexed issuer, bool authorized);
    
    function setUp() public {
        owner = makeAddr("owner");
        authorizedIssuer = makeAddr("authorizedIssuer");
        unauthorizedUser = makeAddr("unauthorizedUser");
        
        vm.prank(owner);
        warrant = new NullWarrant(owner);
    }
    
    function testInitialState() public {
        assertEq(warrant.owner(), owner);
        assertTrue(warrant.isAuthorizedIssuer(owner));
        assertFalse(warrant.isAuthorizedIssuer(authorizedIssuer));
        assertFalse(warrant.isRevoked(ticketCommit));
    }
    
    function testSetAuthorizedIssuer() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit AuthorizedIssuerSet(authorizedIssuer, true);
        warrant.setAuthorizedIssuer(authorizedIssuer, true);
        
        assertTrue(warrant.isAuthorizedIssuer(authorizedIssuer));
        
        vm.prank(owner);
        warrant.setAuthorizedIssuer(authorizedIssuer, false);
        
        assertFalse(warrant.isAuthorizedIssuer(authorizedIssuer));
    }
    
    function testSetAuthorizedIssuerOnlyOwner() public {
        vm.prank(unauthorizedUser);
        vm.expectRevert();
        warrant.setAuthorizedIssuer(authorizedIssuer, true);
    }
    
    function testIssueWarrant() public {
        vm.prank(owner);
        warrant.setAuthorizedIssuer(authorizedIssuer, true);
        
        vm.prank(authorizedIssuer);
        bytes32 warrantId = warrant.issueWarrant(ticketCommit, "fraud");
        
        assertTrue(warrantId != bytes32(0));
        assertFalse(warrant.isRevoked(ticketCommit)); // Not revoked until executed
        
        // Execute the warrant
        vm.prank(authorizedIssuer);
        warrant.executeWarrant(warrantId);
        
        assertTrue(warrant.isRevoked(ticketCommit));
        
        // Check warrant details
        (NullWarrant.Warrant memory warrantData) = warrant.getWarrant(warrantId);
        assertEq(warrantData.ticketCommit, ticketCommit);
        assertEq(warrantData.reason, "fraud");
        assertEq(warrantData.issuer, authorizedIssuer);
        assertTrue(warrantData.executed);
    }
    
    function testIssueWarrantNotAuthorized() public {
        vm.prank(unauthorizedUser);
        vm.expectRevert("not authorized issuer");
        warrant.issueWarrant(ticketCommit, "fraud");
    }
    
    function testIssueWarrantAlreadyRevoked() public {
        vm.prank(owner);
        warrant.setAuthorizedIssuer(authorizedIssuer, true);
        
        // Issue first warrant
        vm.prank(authorizedIssuer);
        bytes32 warrantId = warrant.issueWarrant(ticketCommit, "fraud");
        
        // Execute the warrant
        vm.prank(authorizedIssuer);
        warrant.executeWarrant(warrantId);
        
        // Try to issue second warrant for same ticket
        vm.prank(authorizedIssuer);
        vm.expectRevert("already revoked");
        warrant.issueWarrant(ticketCommit, "policy_breach");
    }
    
    function testExecuteWarrant() public {
        vm.prank(owner);
        warrant.setAuthorizedIssuer(authorizedIssuer, true);
        
        // Issue warrant
        vm.prank(authorizedIssuer);
        bytes32 warrantId = warrant.issueWarrant(ticketCommit, "fraud");
        
        // Execute warrant (should already be executed by issueWarrant)
        vm.prank(authorizedIssuer);
        vm.expectEmit(true, true, false, true);
        emit WarrantExecuted(warrantId, ticketCommit, authorizedIssuer);
        warrant.executeWarrant(warrantId);
        
        assertTrue(warrant.isRevoked(ticketCommit));
    }
    
    function testExecuteWarrantNotAuthorized() public {
        vm.prank(owner);
        warrant.setAuthorizedIssuer(authorizedIssuer, true);
        
        vm.prank(authorizedIssuer);
        bytes32 warrantId = warrant.issueWarrant(ticketCommit, "fraud");
        
        vm.prank(unauthorizedUser);
        vm.expectRevert("not authorized issuer");
        warrant.executeWarrant(warrantId);
    }
    
    function testExecuteWarrantNotFound() public {
        vm.prank(owner);
        warrant.setAuthorizedIssuer(authorizedIssuer, true);
        
        vm.prank(authorizedIssuer);
        vm.expectRevert("warrant not found");
        warrant.executeWarrant(keccak256("nonexistent"));
    }
    
    function testEmergencyRevoke() public {
        vm.prank(owner);
        warrant.emergencyRevoke(ticketCommit, "emergency");
        
        assertTrue(warrant.isRevoked(ticketCommit));
    }
    
    function testEmergencyRevokeAlreadyRevoked() public {
        vm.prank(owner);
        warrant.emergencyRevoke(ticketCommit, "emergency");
        
        vm.prank(owner);
        vm.expectRevert("already revoked");
        warrant.emergencyRevoke(ticketCommit, "emergency2");
    }
    
    function testEmergencyRevokeOnlyOwner() public {
        vm.prank(unauthorizedUser);
        vm.expectRevert();
        warrant.emergencyRevoke(ticketCommit, "emergency");
    }
    
    function testReasonToString() public {
        // Test all reason types
        assertEq(warrant._reasonToString(NullWarrant.Reason.Fraud), "fraud");
        assertEq(warrant._reasonToString(NullWarrant.Reason.PolicyBreach), "policy_breach");
        assertEq(warrant._reasonToString(NullWarrant.Reason.Duplicate), "duplicate");
        assertEq(warrant._reasonToString(NullWarrant.Reason.InvalidTransfer), "invalid_transfer");
        assertEq(warrant._reasonToString(NullWarrant.Reason.VenueRequest), "venue_request");
    }
    
    function testCompleteFlow() public {
        // Set up authorized issuer
        vm.prank(owner);
        warrant.setAuthorizedIssuer(authorizedIssuer, true);
        
        // Issue warrant
        vm.prank(authorizedIssuer);
        bytes32 warrantId = warrant.issueWarrant(ticketCommit, "fraud");
        
        // Execute warrant
        vm.prank(authorizedIssuer);
        warrant.executeWarrant(warrantId);
        
        // Verify ticket is revoked
        assertTrue(warrant.isRevoked(ticketCommit));
        
        // Get warrant details
        (NullWarrant.Warrant memory warrantData) = warrant.getWarrant(warrantId);
        assertEq(warrantData.ticketCommit, ticketCommit);
        assertEq(warrantData.reason, "fraud");
        assertEq(warrantData.issuer, authorizedIssuer);
        assertTrue(warrantData.executed);
    }
}
