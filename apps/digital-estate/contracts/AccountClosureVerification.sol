// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AccountClosureVerification
 * @dev Smart contract for verifying account closures and managing service providers
 * @notice This contract manages verification requests and service provider integrations
 */
contract AccountClosureVerification is Ownable, ReentrancyGuard {
    
    enum VerificationStatus {
        PENDING,            // 0: Verification pending
        VERIFIED,           // 1: Account closure verified
        FAILED,             // 2: Verification failed
        DISPUTED,           // 3: Verification disputed
        PERMANENTLY_VERIFIED // 4: Permanently verified closure
    }
    
    struct VerificationRequest {
        bytes32 requestId;          // Request identifier
        bytes32 accountId;          // Account identifier
        string serviceProvider;     // Service provider
        string verificationMethod;  // Verification method
        uint256 requestedAt;        // Request timestamp
        uint256 expiresAt;          // Expiration timestamp
        VerificationStatus status;  // Current status
        string evidenceUri;         // IPFS URI to evidence
        address verifier;           // Verifier address
    }
    
    struct ServiceProvider {
        string name;                // Provider name
        string apiEndpoint;         // API endpoint for verification
        bool supportsAutomation;    // Whether provider supports automated verification
        bool requiresManualReview;  // Whether provider requires manual review
        uint256 verificationFee;    // Fee for verification
        bool active;                // Whether provider is active
    }
    
    struct VerificationResult {
        bytes32 requestId;          // Request identifier
        bool successful;            // Whether verification was successful
        string resultCode;          // Result code from provider
        string resultMessage;       // Result message from provider
        uint256 verifiedAt;         // Verification timestamp
        string evidenceUri;         // IPFS URI to verification evidence
    }
    
    // State variables
    mapping(bytes32 => VerificationRequest) public verificationRequests;
    mapping(string => ServiceProvider) public serviceProviders;
    mapping(bytes32 => VerificationResult) public verificationResults;
    mapping(address => bool) public authorizedVerifiers;
    mapping(address => bool) public authorizedProviders;
    
    // Statistics
    uint256 public totalRequests;
    uint256 public totalVerified;
    uint256 public totalFailed;
    uint256 public totalDisputed;
    
    // Events
    event VerificationRequested(
        bytes32 indexed requestId,
        bytes32 indexed accountId,
        string serviceProvider,
        string verificationMethod,
        uint256 expiresAt
    );
    
    event VerificationCompleted(
        bytes32 indexed requestId,
        bytes32 indexed accountId,
        VerificationStatus status,
        string resultCode,
        string resultMessage,
        string evidenceUri
    );
    
    event ServiceProviderRegistered(
        string indexed providerName,
        string apiEndpoint,
        bool supportsAutomation,
        bool requiresManualReview,
        uint256 verificationFee
    );
    
    event ServiceProviderUpdated(
        string indexed providerName,
        bool active,
        uint256 verificationFee
    );
    
    event VerifierAuthorized(address indexed verifier, bool authorized);
    event ProviderAuthorized(address indexed provider, bool authorized);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Request account closure verification
     * @param accountId Account identifier
     * @param serviceProvider Service provider name
     * @param verificationMethod Verification method
     * @param expiresAt Expiration timestamp
     * @return requestId Unique request identifier
     */
    function requestVerification(
        bytes32 accountId,
        string calldata serviceProvider,
        string calldata verificationMethod,
        uint256 expiresAt
    ) external returns (bytes32) {
        require(accountId != bytes32(0), "Invalid account ID");
        require(bytes(serviceProvider).length > 0, "Service provider required");
        require(bytes(verificationMethod).length > 0, "Verification method required");
        require(expiresAt > block.timestamp, "Invalid expiration time");
        require(serviceProviders[serviceProvider].active, "Service provider not active");
        
        // Generate unique request ID
        bytes32 requestId = keccak256(abi.encodePacked(
            accountId,
            serviceProvider,
            verificationMethod,
            block.timestamp,
            msg.sender
        ));
        
        // Ensure request doesn't already exist
        require(verificationRequests[requestId].requestId == bytes32(0), "Request already exists");
        
        // Create verification request
        VerificationRequest memory request = VerificationRequest({
            requestId: requestId,
            accountId: accountId,
            serviceProvider: serviceProvider,
            verificationMethod: verificationMethod,
            requestedAt: block.timestamp,
            expiresAt: expiresAt,
            status: VerificationStatus.PENDING,
            evidenceUri: "",
            verifier: address(0)
        });
        
        verificationRequests[requestId] = request;
        totalRequests++;
        
        emit VerificationRequested(requestId, accountId, serviceProvider, verificationMethod, expiresAt);
        
        return requestId;
    }
    
    /**
     * @dev Complete verification request
     * @param requestId Request identifier
     * @param successful Whether verification was successful
     * @param resultCode Result code from provider
     * @param resultMessage Result message from provider
     * @param evidenceUri IPFS URI to verification evidence
     */
    function completeVerification(
        bytes32 requestId,
        bool successful,
        string calldata resultCode,
        string calldata resultMessage,
        string calldata evidenceUri
    ) external {
        require(authorizedVerifiers[msg.sender], "Not authorized verifier");
        require(verificationRequests[requestId].requestId != bytes32(0), "Request not found");
        require(verificationRequests[requestId].status == VerificationStatus.PENDING, "Request not pending");
        require(verificationRequests[requestId].expiresAt > block.timestamp, "Request expired");
        require(bytes(evidenceUri).length > 0, "Evidence URI required");
        
        VerificationRequest storage request = verificationRequests[requestId];
        request.status = successful ? VerificationStatus.VERIFIED : VerificationStatus.FAILED;
        request.evidenceUri = evidenceUri;
        request.verifier = msg.sender;
        
        // Create verification result
        VerificationResult memory result = VerificationResult({
            requestId: requestId,
            successful: successful,
            resultCode: resultCode,
            resultMessage: resultMessage,
            verifiedAt: block.timestamp,
            evidenceUri: evidenceUri
        });
        
        verificationResults[requestId] = result;
        
        // Update statistics
        if (successful) {
            totalVerified++;
        } else {
            totalFailed++;
        }
        
        emit VerificationCompleted(
            requestId,
            request.accountId,
            request.status,
            resultCode,
            resultMessage,
            evidenceUri
        );
    }
    
    /**
     * @dev Dispute verification result
     * @param requestId Request identifier
     * @param disputeReason Reason for dispute
     * @param evidenceUri IPFS URI to dispute evidence
     */
    function disputeVerification(
        bytes32 requestId,
        string calldata disputeReason,
        string calldata evidenceUri
    ) external {
        require(verificationRequests[requestId].requestId != bytes32(0), "Request not found");
        require(verificationRequests[requestId].status != VerificationStatus.PENDING, "Request still pending");
        require(verificationRequests[requestId].status != VerificationStatus.DISPUTED, "Already disputed");
        require(bytes(disputeReason).length > 0, "Dispute reason required");
        require(bytes(evidenceUri).length > 0, "Evidence URI required");
        
        VerificationRequest storage request = verificationRequests[requestId];
        request.status = VerificationStatus.DISPUTED;
        
        totalDisputed++;
        
        emit VerificationCompleted(
            requestId,
            request.accountId,
            VerificationStatus.DISPUTED,
            "DISPUTED",
            disputeReason,
            evidenceUri
        );
    }
    
    /**
     * @dev Register a service provider
     * @param name Provider name
     * @param apiEndpoint API endpoint for verification
     * @param supportsAutomation Whether provider supports automated verification
     * @param requiresManualReview Whether provider requires manual review
     * @param verificationFee Fee for verification
     */
    function registerServiceProvider(
        string calldata name,
        string calldata apiEndpoint,
        bool supportsAutomation,
        bool requiresManualReview,
        uint256 verificationFee
    ) external {
        require(authorizedProviders[msg.sender], "Not authorized provider");
        require(bytes(name).length > 0, "Provider name required");
        require(bytes(apiEndpoint).length > 0, "API endpoint required");
        require(serviceProviders[name].name == "", "Provider already registered");
        
        ServiceProvider memory provider = ServiceProvider({
            name: name,
            apiEndpoint: apiEndpoint,
            supportsAutomation: supportsAutomation,
            requiresManualReview: requiresManualReview,
            verificationFee: verificationFee,
            active: true
        });
        
        serviceProviders[name] = provider;
        
        emit ServiceProviderRegistered(
            name,
            apiEndpoint,
            supportsAutomation,
            requiresManualReview,
            verificationFee
        );
    }
    
    /**
     * @dev Update service provider
     * @param name Provider name
     * @param active Whether provider is active
     * @param verificationFee New verification fee
     */
    function updateServiceProvider(
        string calldata name,
        bool active,
        uint256 verificationFee
    ) external {
        require(authorizedProviders[msg.sender], "Not authorized provider");
        require(serviceProviders[name].name != "", "Provider not found");
        
        serviceProviders[name].active = active;
        serviceProviders[name].verificationFee = verificationFee;
        
        emit ServiceProviderUpdated(name, active, verificationFee);
    }
    
    /**
     * @dev Authorize a verifier
     * @param verifier Verifier address
     * @param authorized Whether to authorize or revoke
     */
    function setVerifierAuthorization(address verifier, bool authorized) external onlyOwner {
        authorizedVerifiers[verifier] = authorized;
        emit VerifierAuthorized(verifier, authorized);
    }
    
    /**
     * @dev Authorize a provider
     * @param provider Provider address
     * @param authorized Whether to authorize or revoke
     */
    function setProviderAuthorization(address provider, bool authorized) external onlyOwner {
        authorizedProviders[provider] = authorized;
        emit ProviderAuthorized(provider, authorized);
    }
    
    /**
     * @dev Get verification request
     * @param requestId Request identifier
     * @return request Verification request information
     */
    function getVerificationRequest(bytes32 requestId) external view returns (VerificationRequest memory request) {
        return verificationRequests[requestId];
    }
    
    /**
     * @dev Get verification result
     * @param requestId Request identifier
     * @return result Verification result information
     */
    function getVerificationResult(bytes32 requestId) external view returns (VerificationResult memory result) {
        return verificationResults[requestId];
    }
    
    /**
     * @dev Get service provider
     * @param name Provider name
     * @return provider Service provider information
     */
    function getServiceProvider(string calldata name) external view returns (ServiceProvider memory provider) {
        return serviceProviders[name];
    }
    
    /**
     * @dev Get contract statistics
     * @return requests Total number of requests
     * @return verified Total number of verified requests
     * @return failed Total number of failed requests
     * @return disputed Total number of disputed requests
     */
    function getStats() external view returns (uint256 requests, uint256 verified, uint256 failed, uint256 disputed) {
        return (totalRequests, totalVerified, totalFailed, totalDisputed);
    }
    
    /**
     * @dev Convert VerificationStatus enum to string
     * @param status Verification status enum
     * @return String representation of status
     */
    function verificationStatusToString(VerificationStatus status) external pure returns (string memory) {
        if (status == VerificationStatus.PENDING) return "pending";
        if (status == VerificationStatus.VERIFIED) return "verified";
        if (status == VerificationStatus.FAILED) return "failed";
        if (status == VerificationStatus.DISPUTED) return "disputed";
        if (status == VerificationStatus.PERMANENTLY_VERIFIED) return "permanently_verified";
        return "unknown";
    }
}
