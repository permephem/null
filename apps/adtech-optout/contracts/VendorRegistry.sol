// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VendorRegistry
 * @dev Registry for adtech vendors with opt-out endpoints and compliance policies
 * @notice This contract maintains the vendor registry with taxonomy, endpoints, and compliance requirements
 */
contract VendorRegistry is Ownable, ReentrancyGuard {
    
    enum VendorCategory {
        DSP,                     // 0: Demand Side Platform
        SSP,                     // 1: Supply Side Platform
        CDP,                     // 2: Customer Data Platform
        CMP,                     // 3: Consent Management Platform
        DMP,                     // 4: Data Management Platform
        ANALYTICS,               // 5: Analytics
        RETARGETING,             // 6: Retargeting
        FINGERPRINTING,          // 7: Fingerprinting
        CROSS_SITE_TRACKING      // 8: Cross-site tracking
    }
    
    enum Jurisdiction {
        US_CPRA,                 // 0: California Consumer Privacy Act
        EU_GDPR,                 // 1: General Data Protection Regulation
        US_COPPA,                // 2: Children's Online Privacy Protection Act
        US_VCDPA,                // 3: Virginia Consumer Data Protection Act
        US_CTDPA,                // 4: Connecticut Data Privacy Act
        US_CPA,                  // 5: Colorado Privacy Act
        US_UCPA,                 // 6: Utah Consumer Privacy Act
        US_TCPA,                 // 7: Texas Consumer Privacy Act
        US_MTCDPA,               // 8: Montana Consumer Data Privacy Act
        US_ORCDPA,               // 9: Oregon Consumer Data Privacy Act
        US_DELAWARE_DPDPA,       // 10: Delaware Personal Data Privacy Act
        US_NJCDPA,               // 11: New Jersey Consumer Data Privacy Act
        US_NHCDPA,               // 12: New Hampshire Consumer Data Privacy Act
        US_TNICPA,               // 13: Tennessee Information Protection Act
        US_ICDPA,                // 14: Iowa Consumer Data Protection Act
        US_INCDPA,               // 15: Indiana Consumer Data Protection Act
        US_FLDPA,                // 16: Florida Digital Privacy Act
        US_KYCDPA,               // 17: Kentucky Consumer Data Protection Act
        US_NECDPA,               // 18: Nebraska Consumer Data Privacy Act
        US_ALCDPA,               // 19: Alabama Consumer Data Privacy Act
        US_AKCDPA,               // 20: Alaska Consumer Data Privacy Act
        US_AZCDPA,               // 21: Arizona Consumer Data Privacy Act
        US_ARCDPA,               // 22: Arkansas Consumer Data Privacy Act
        US_CACDPA,               // 23: California Consumer Data Privacy Act
        US_COCDPA,               // 24: Colorado Consumer Data Privacy Act
        US_CTCDPA,               // 25: Connecticut Consumer Data Privacy Act
        US_DCCDPA,               // 26: Delaware Consumer Data Privacy Act
        US_FLCDPA,               // 27: Florida Consumer Data Privacy Act
        US_GACDPA,               // 28: Georgia Consumer Data Privacy Act
        US_HICDPA,               // 29: Hawaii Consumer Data Privacy Act
        US_IDCDPA,               // 30: Idaho Consumer Data Privacy Act
        US_ILCDPA,               // 31: Illinois Consumer Data Privacy Act
        US_INCDPA,               // 32: Indiana Consumer Data Privacy Act
        US_IACDPA,               // 33: Iowa Consumer Data Privacy Act
        US_KSCDPA,               // 34: Kansas Consumer Data Privacy Act
        US_KYCDPA,               // 35: Kentucky Consumer Data Privacy Act
        US_LACDPA,               // 36: Louisiana Consumer Data Privacy Act
        US_MECDPA,               // 37: Maine Consumer Data Privacy Act
        US_MDCDPA,               // 38: Maryland Consumer Data Privacy Act
        US_MACDPA,               // 39: Massachusetts Consumer Data Privacy Act
        US_MICDPA,               // 40: Michigan Consumer Data Privacy Act
        US_MNCDPA,               // 41: Minnesota Consumer Data Privacy Act
        US_MSCDPA,               // 42: Mississippi Consumer Data Privacy Act
        US_MOCDPA,               // 43: Missouri Consumer Data Privacy Act
        US_MTCDPA,               // 44: Montana Consumer Data Privacy Act
        US_NECDPA,               // 45: Nebraska Consumer Data Privacy Act
        US_NVCDPA,               // 46: Nevada Consumer Data Privacy Act
        US_NHCDPA,               // 47: New Hampshire Consumer Data Privacy Act
        US_NJCDPA,               // 48: New Jersey Consumer Data Privacy Act
        US_NMCDPA,               // 49: New Mexico Consumer Data Privacy Act
        US_NYCDPA,               // 50: New York Consumer Data Privacy Act
        US_NCCDPA,               // 51: North Carolina Consumer Data Privacy Act
        US_NDCDPA,               // 52: North Dakota Consumer Data Privacy Act
        US_OHCDPA,               // 53: Ohio Consumer Data Privacy Act
        US_OKCDPA,               // 54: Oklahoma Consumer Data Privacy Act
        US_ORCDPA,               // 55: Oregon Consumer Data Privacy Act
        US_PACDPA,               // 56: Pennsylvania Consumer Data Privacy Act
        US_RICDPA,               // 57: Rhode Island Consumer Data Privacy Act
        US_SCCDPA,               // 58: South Carolina Consumer Data Privacy Act
        US_SDCDPA,               // 59: South Dakota Consumer Data Privacy Act
        US_TNCDPA,               // 60: Tennessee Consumer Data Privacy Act
        US_TXCDPA,               // 61: Texas Consumer Data Privacy Act
        US_UTCDPA,               // 62: Utah Consumer Data Privacy Act
        US_VTCDPA,               // 63: Vermont Consumer Data Privacy Act
        US_VACDPA,               // 64: Virginia Consumer Data Privacy Act
        US_WACDPA,               // 65: Washington Consumer Data Privacy Act
        US_WVCDPA,               // 66: West Virginia Consumer Data Privacy Act
        US_WICDPA,               // 67: Wisconsin Consumer Data Privacy Act
        US_WYCDPA                // 68: Wyoming Consumer Data Privacy Act
    }
    
    struct OptOutEndpoint {
        string method;           // HTTP method (GET, POST, etc.)
        string endpoint;         // Opt-out endpoint URL
        string[] requiredParams; // Required parameters for opt-out
        string[] evidenceExpected; // Expected evidence of successful opt-out
        uint256 ttlDays;         // Time-to-live in days
        bool active;             // Whether endpoint is active
    }
    
    struct GpcPolicy {
        bool honors;             // Whether vendor honors GPC
        uint256 ttlDays;         // GPC TTL in days
        string[] requiredHeaders; // Required GPC headers
        bool active;             // Whether GPC policy is active
    }
    
    struct Vendor {
        string vendorId;         // Unique vendor identifier
        string name;             // Vendor name
        string domain;           // Primary domain
        VendorCategory[] categories; // Vendor categories
        OptOutEndpoint optOut;   // Opt-out endpoint configuration
        GpcPolicy gpcPolicy;     // GPC policy configuration
        Jurisdiction[] jurisdictions; // Applicable jurisdictions
        bool compliant;          // Whether vendor is compliant
        uint256 violations;      // Number of violations
        uint256 lastViolation;   // Timestamp of last violation
        bool blacklisted;        // Whether vendor is blacklisted
        uint256 registeredAt;    // Registration timestamp
        address registeredBy;    // Address that registered the vendor
    }
    
    struct VendorUpdate {
        string vendorId;         // Vendor identifier
        string field;            // Field being updated
        string value;            // New value
        uint256 timestamp;       // Update timestamp
        address updatedBy;       // Address that made the update
    }
    
    // State variables
    mapping(string => Vendor) public vendors;
    mapping(string => VendorUpdate[]) public vendorUpdates;
    mapping(address => bool) public authorizedRegistrars;
    mapping(string => bool) public vendorExists;
    
    // Statistics
    uint256 public totalVendors;
    uint256 public totalViolations;
    uint256 public totalBlacklisted;
    
    // Events
    event VendorRegistered(
        string indexed vendorId,
        string name,
        string domain,
        VendorCategory[] categories,
        address indexed registeredBy
    );
    
    event VendorUpdated(
        string indexed vendorId,
        string field,
        string value,
        address indexed updatedBy
    );
    
    event VendorBlacklisted(
        string indexed vendorId,
        string reason,
        uint256 blacklistedAt
    );
    
    event VendorComplianceUpdated(
        string indexed vendorId,
        bool compliant,
        uint256 violations,
        uint256 lastViolation
    );
    
    event RegistrarAuthorized(address indexed registrar, bool authorized);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Register a new vendor
     * @param vendorId Unique vendor identifier
     * @param name Vendor name
     * @param domain Primary domain
     * @param categories Vendor categories
     * @param optOut Opt-out endpoint configuration
     * @param gpcPolicy GPC policy configuration
     * @param jurisdictions Applicable jurisdictions
     */
    function registerVendor(
        string calldata vendorId,
        string calldata name,
        string calldata domain,
        VendorCategory[] calldata categories,
        OptOutEndpoint calldata optOut,
        GpcPolicy calldata gpcPolicy,
        Jurisdiction[] calldata jurisdictions
    ) external {
        require(authorizedRegistrars[msg.sender] || msg.sender == owner(), "Not authorized registrar");
        require(bytes(vendorId).length > 0, "Vendor ID required");
        require(bytes(name).length > 0, "Vendor name required");
        require(bytes(domain).length > 0, "Vendor domain required");
        require(categories.length > 0, "At least one category required");
        require(jurisdictions.length > 0, "At least one jurisdiction required");
        require(!vendorExists[vendorId], "Vendor already exists");
        
        // Create vendor
        Vendor memory vendor = Vendor({
            vendorId: vendorId,
            name: name,
            domain: domain,
            categories: categories,
            optOut: optOut,
            gpcPolicy: gpcPolicy,
            jurisdictions: jurisdictions,
            compliant: true,
            violations: 0,
            lastViolation: 0,
            blacklisted: false,
            registeredAt: block.timestamp,
            registeredBy: msg.sender
        });
        
        vendors[vendorId] = vendor;
        vendorExists[vendorId] = true;
        totalVendors++;
        
        emit VendorRegistered(vendorId, name, domain, categories, msg.sender);
    }
    
    /**
     * @dev Update vendor information
     * @param vendorId Vendor identifier
     * @param field Field being updated
     * @param value New value
     */
    function updateVendor(
        string calldata vendorId,
        string calldata field,
        string calldata value
    ) external {
        require(authorizedRegistrars[msg.sender] || msg.sender == owner(), "Not authorized registrar");
        require(vendorExists[vendorId], "Vendor not found");
        require(bytes(field).length > 0, "Field required");
        require(bytes(value).length > 0, "Value required");
        
        // Record update
        VendorUpdate memory update = VendorUpdate({
            vendorId: vendorId,
            field: field,
            value: value,
            timestamp: block.timestamp,
            updatedBy: msg.sender
        });
        
        vendorUpdates[vendorId].push(update);
        
        emit VendorUpdated(vendorId, field, value, msg.sender);
    }
    
    /**
     * @dev Update vendor compliance status
     * @param vendorId Vendor identifier
     * @param compliant Whether vendor is compliant
     * @param violations Number of violations
     * @param lastViolation Timestamp of last violation
     */
    function updateVendorCompliance(
        string calldata vendorId,
        bool compliant,
        uint256 violations,
        uint256 lastViolation
    ) external {
        require(authorizedRegistrars[msg.sender] || msg.sender == owner(), "Not authorized registrar");
        require(vendorExists[vendorId], "Vendor not found");
        
        Vendor storage vendor = vendors[vendorId];
        vendor.compliant = compliant;
        vendor.violations = violations;
        vendor.lastViolation = lastViolation;
        
        if (violations > 0) {
            totalViolations += violations;
        }
        
        emit VendorComplianceUpdated(vendorId, compliant, violations, lastViolation);
    }
    
    /**
     * @dev Blacklist a vendor
     * @param vendorId Vendor identifier
     * @param reason Reason for blacklisting
     */
    function blacklistVendor(
        string calldata vendorId,
        string calldata reason
    ) external {
        require(authorizedRegistrars[msg.sender] || msg.sender == owner(), "Not authorized registrar");
        require(vendorExists[vendorId], "Vendor not found");
        require(bytes(reason).length > 0, "Reason required");
        
        Vendor storage vendor = vendors[vendorId];
        vendor.blacklisted = true;
        vendor.compliant = false;
        totalBlacklisted++;
        
        emit VendorBlacklisted(vendorId, reason, block.timestamp);
    }
    
    /**
     * @dev Authorize a registrar
     * @param registrar Registrar address
     * @param authorized Whether to authorize or revoke
     */
    function setRegistrarAuthorization(address registrar, bool authorized) external onlyOwner {
        authorizedRegistrars[registrar] = authorized;
        emit RegistrarAuthorized(registrar, authorized);
    }
    
    /**
     * @dev Get vendor information
     * @param vendorId Vendor identifier
     * @return vendor Vendor information
     */
    function getVendor(string calldata vendorId) external view returns (Vendor memory vendor) {
        return vendors[vendorId];
    }
    
    /**
     * @dev Get vendor updates
     * @param vendorId Vendor identifier
     * @return updates Array of vendor updates
     */
    function getVendorUpdates(string calldata vendorId) external view returns (VendorUpdate[] memory updates) {
        return vendorUpdates[vendorId];
    }
    
    /**
     * @dev Get contract statistics
     * @return vendors Total number of vendors
     * @return violations Total number of violations
     * @return blacklisted Total number of blacklisted vendors
     */
    function getStats() external view returns (uint256 vendors, uint256 violations, uint256 blacklisted) {
        return (totalVendors, totalViolations, totalBlacklisted);
    }
    
    /**
     * @dev Convert VendorCategory enum to string
     * @param category Vendor category enum
     * @return String representation of category
     */
    function vendorCategoryToString(VendorCategory category) external pure returns (string memory) {
        if (category == VendorCategory.DSP) return "dsp";
        if (category == VendorCategory.SSP) return "ssp";
        if (category == VendorCategory.CDP) return "cdp";
        if (category == VendorCategory.CMP) return "cmp";
        if (category == VendorCategory.DMP) return "dmp";
        if (category == VendorCategory.ANALYTICS) return "analytics";
        if (category == VendorCategory.RETARGETING) return "retargeting";
        if (category == VendorCategory.FINGERPRINTING) return "fingerprinting";
        if (category == VendorCategory.CROSS_SITE_TRACKING) return "cross_site_tracking";
        return "unknown";
    }
    
    /**
     * @dev Convert Jurisdiction enum to string
     * @param jurisdiction Jurisdiction enum
     * @return String representation of jurisdiction
     */
    function jurisdictionToString(Jurisdiction jurisdiction) external pure returns (string memory) {
        if (jurisdiction == Jurisdiction.US_CPRA) return "us_cpra";
        if (jurisdiction == Jurisdiction.EU_GDPR) return "eu_gdpr";
        if (jurisdiction == Jurisdiction.US_COPPA) return "us_coppa";
        if (jurisdiction == Jurisdiction.US_VCDPA) return "us_vcdpa";
        if (jurisdiction == Jurisdiction.US_CTDPA) return "us_ctdpa";
        if (jurisdiction == Jurisdiction.US_CPA) return "us_cpa";
        if (jurisdiction == Jurisdiction.US_UCPA) return "us_ucpa";
        if (jurisdiction == Jurisdiction.US_TCPA) return "us_tcpa";
        if (jurisdiction == Jurisdiction.US_MTCDPA) return "us_mtcdpa";
        if (jurisdiction == Jurisdiction.US_ORCDPA) return "us_orcdpa";
        if (jurisdiction == Jurisdiction.US_DELAWARE_DPDPA) return "us_delaware_dpdpa";
        if (jurisdiction == Jurisdiction.US_NJCDPA) return "us_njcdpa";
        if (jurisdiction == Jurisdiction.US_NHCDPA) return "us_nhcdpa";
        if (jurisdiction == Jurisdiction.US_TNICPA) return "us_tnicpa";
        if (jurisdiction == Jurisdiction.US_ICDPA) return "us_icdpa";
        if (jurisdiction == Jurisdiction.US_INCDPA) return "us_incdpa";
        if (jurisdiction == Jurisdiction.US_FLDPA) return "us_fldpa";
        if (jurisdiction == Jurisdiction.US_KYCDPA) return "us_kycdpa";
        if (jurisdiction == Jurisdiction.US_NECDPA) return "us_necdpa";
        if (jurisdiction == Jurisdiction.US_ALCDPA) return "us_alcdpa";
        if (jurisdiction == Jurisdiction.US_AKCDPA) return "us_akcdpa";
        if (jurisdiction == Jurisdiction.US_AZCDPA) return "us_azcdpa";
        if (jurisdiction == Jurisdiction.US_ARCDPA) return "us_arcdpa";
        if (jurisdiction == Jurisdiction.US_CACDPA) return "us_cacdpa";
        if (jurisdiction == Jurisdiction.US_COCDPA) return "us_cocdpa";
        if (jurisdiction == Jurisdiction.US_CTCDPA) return "us_ctcdpa";
        if (jurisdiction == Jurisdiction.US_DCCDPA) return "us_dccdpa";
        if (jurisdiction == Jurisdiction.US_FLCDPA) return "us_flcdpa";
        if (jurisdiction == Jurisdiction.US_GACDPA) return "us_gacdpa";
        if (jurisdiction == Jurisdiction.US_HICDPA) return "us_hicdpa";
        if (jurisdiction == Jurisdiction.US_IDCDPA) return "us_idcdpa";
        if (jurisdiction == Jurisdiction.US_ILCDPA) return "us_ilcdpa";
        if (jurisdiction == Jurisdiction.US_INCDPA) return "us_incdpa";
        if (jurisdiction == Jurisdiction.US_IACDPA) return "us_iacdpa";
        if (jurisdiction == Jurisdiction.US_KSCDPA) return "us_kscdpa";
        if (jurisdiction == Jurisdiction.US_KYCDPA) return "us_kycdpa";
        if (jurisdiction == Jurisdiction.US_LACDPA) return "us_lacdpa";
        if (jurisdiction == Jurisdiction.US_MECDPA) return "us_mecdpa";
        if (jurisdiction == Jurisdiction.US_MDCDPA) return "us_mdcdpa";
        if (jurisdiction == Jurisdiction.US_MACDPA) return "us_macdpa";
        if (jurisdiction == Jurisdiction.US_MICDPA) return "us_micdpa";
        if (jurisdiction == Jurisdiction.US_MNCDPA) return "us_mncdpa";
        if (jurisdiction == Jurisdiction.US_MSCDPA) return "us_mscdpa";
        if (jurisdiction == Jurisdiction.US_MOCDPA) return "us_mocdpa";
        if (jurisdiction == Jurisdiction.US_MTCDPA) return "us_mtcdpa";
        if (jurisdiction == Jurisdiction.US_NECDPA) return "us_necdpa";
        if (jurisdiction == Jurisdiction.US_NVCDPA) return "us_nvcdpa";
        if (jurisdiction == Jurisdiction.US_NHCDPA) return "us_nhcdpa";
        if (jurisdiction == Jurisdiction.US_NJCDPA) return "us_njcdpa";
        if (jurisdiction == Jurisdiction.US_NMCDPA) return "us_nmcdpa";
        if (jurisdiction == Jurisdiction.US_NYCDPA) return "us_nycdpa";
        if (jurisdiction == Jurisdiction.US_NCCDPA) return "us_nccdpa";
        if (jurisdiction == Jurisdiction.US_NDCDPA) return "us_ndcdpa";
        if (jurisdiction == Jurisdiction.US_OHCDPA) return "us_ohcdpa";
        if (jurisdiction == Jurisdiction.US_OKCDPA) return "us_okcdpa";
        if (jurisdiction == Jurisdiction.US_ORCDPA) return "us_orcdpa";
        if (jurisdiction == Jurisdiction.US_PACDPA) return "us_pacdpa";
        if (jurisdiction == Jurisdiction.US_RICDPA) return "us_ricdpa";
        if (jurisdiction == Jurisdiction.US_SCCDPA) return "us_sccdpa";
        if (jurisdiction == Jurisdiction.US_SDCDPA) return "us_sdcdpa";
        if (jurisdiction == Jurisdiction.US_TNCDPA) return "us_tncdpa";
        if (jurisdiction == Jurisdiction.US_TXCDPA) return "us_txcdpa";
        if (jurisdiction == Jurisdiction.US_UTCDPA) return "us_utcdpa";
        if (jurisdiction == Jurisdiction.US_VTCDPA) return "us_vtcdpa";
        if (jurisdiction == Jurisdiction.US_VACDPA) return "us_vacdpa";
        if (jurisdiction == Jurisdiction.US_WACDPA) return "us_wacdpa";
        if (jurisdiction == Jurisdiction.US_WVCDPA) return "us_wvcdpa";
        if (jurisdiction == Jurisdiction.US_WICDPA) return "us_wicdpa";
        if (jurisdiction == Jurisdiction.US_WYCDPA) return "us_wycdpa";
        return "unknown";
    }
}
