import { ContractFactory, ContractTransactionResponse } from "ethers";
import type { Signer, AddressLike, ContractDeployTransaction, ContractRunner } from "ethers";
import type { NonPayableOverrides } from "../common";
import type { CanonRegistry, CanonRegistryInterface } from "../CanonRegistry";
type CanonRegistryConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class CanonRegistry__factory extends ContractFactory {
    constructor(...args: CanonRegistryConstructorParams);
    getDeployTransaction(_foundationTreasury: AddressLike, _implementerTreasury: AddressLike, _admin: AddressLike, overrides?: NonPayableOverrides & {
        from?: string;
    }): Promise<ContractDeployTransaction>;
    deploy(_foundationTreasury: AddressLike, _implementerTreasury: AddressLike, _admin: AddressLike, overrides?: NonPayableOverrides & {
        from?: string;
    }): Promise<CanonRegistry & {
        deploymentTransaction(): ContractTransactionResponse;
    }>;
    connect(runner: ContractRunner | null): CanonRegistry__factory;
    static readonly bytecode = "0x608034620000e457601f6200110d38819003918201601f19168301916001600160401b03831184841017620000e957808492606094604052833981010312620000e4576200004d81620000ff565b906200008f6200006e60406200006660208501620000ff565b9301620000ff565b6001805566038d7ea4c68000600555620000888162000114565b5062000194565b506200009b8262000236565b50620000a78162000236565b50600680546001600160a01b039384166001600160a01b03199182161790915560078054929093169116179055604051610e199081620002d48239f35b600080fd5b634e487b7160e01b600052604160045260246000fd5b51906001600160a01b0382168203620000e457565b6001600160a01b031660008181527fad3228b676f7d3cd4284a5443f17f1962b36e491b30a40b2405849e597ba5fb5602052604081205490919060ff166200019057818052816020526040822081835260205260408220600160ff198254161790553391600080516020620010ed8339815191528180a4600190565b5090565b6001600160a01b031660008181527ffaf93c3d007e112089dc8351e013e6685ef67703975d0224b26fc45941d4f1f560205260408120549091907fe2b7fb3b832174769106daebcfd6d1970523240dda11281102db9363b83b0dc49060ff166200023157808352826020526040832082845260205260408320600160ff19825416179055600080516020620010ed833981519152339380a4600190565b505090565b6001600160a01b031660008181527f9e5c930214a7bc8a78d251e617445bcdba028aed2ede5828cc6cd6c8261656f560205260408120549091907fe1dcbdb91df27212a29bc27177c840cf2f819ecf2187432e1fac86c2dd5dfca99060ff166200023157808352826020526040832082845260205260408320600160ff19825416179055600080516020620010ed833981519152339380a460019056fe6080604081815260049182361015610022575b505050361561002057600080fd5b005b600092833560e01c91826301ffc9a7146109515750816302e74d08146108af578163248a9ca31461088557816327e235e31461084f5781632f2ff15d1461082557816336568abe146107df578382633ccfd60b1461077d575081633f4ba83a1461071357816346860698146106f15781634a21aaf7146106c85781634d158c641461066b5781634f0b5801146106415781635c975abb1461061d57816360c6d8ae146105fe57816362271737146105085781636ef25c3a146104e9578163784e0375146104ba578163797cbf0f1461049e5781638456cb591461044357816391d14854146103fd578163926d7d7f146103c25781639ffb4635146103a3578163a217fddf14610388578163b7133f7614610360578163ce7ee5ac14610337578163d11a57ec146102fc578163d547741f146102b957508063d73792a91461029e578063db2e21bc1461024e578063e0fd74761461022f5763fafb45e4146101895780610012565b7f147477090d1a38a0ba9a2daec1b976f238fa8296212b87c29c843da563fd43586101ff6101b636610a03565b94979596929093986101c6610a5b565b6101ce610c99565b6101d6610cb7565b6101e4600554341015610c28565b878b52600360205243818c2055519485944293339387610cfb565b0390a461020b34610d75565b610216600854610c67565b60085561022534600954610c8c565b6009556001805580f35b503461024a578160031936011261024a576020905160018152f35b5080fd5b503461024a578160031936011261024a57610267610ad5565b818080804780156102788115610d3c565b8290610295575b3390f11561028b575080f35b51903d90823e3d90fd5b506108fc61027f565b503461024a578160031936011261024a5760209051600d8152f35b919050346102f857806003193601126102f8576102f491356102ef60016102de6109bf565b938387528660205286200154610b0f565b610bb3565b5080f35b8280fd5b50503461024a578160031936011261024a57602090517fe1dcbdb91df27212a29bc27177c840cf2f819ecf2187432e1fac86c2dd5dfca98152f35b50503461024a578160031936011261024a5760065490516001600160a01b039091168152602090f35b9050346102f85760203660031901126102f85760209282913581526003845220549051908152f35b50503461024a578160031936011261024a5751908152602090f35b50503461024a578160031936011261024a576020906008549051908152f35b50503461024a578160031936011261024a57602090517fe2b7fb3b832174769106daebcfd6d1970523240dda11281102db9363b83b0dc48152f35b9050346102f857816003193601126102f8578160209360ff9261041e6109bf565b903582528186528282206001600160a01b039091168252855220549151911615158152f35b50503461024a578160031936011261024a5760207f62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a25891610481610ad5565b610489610c99565b600160ff19600254161760025551338152a180f35b50503461024a578160031936011261024a5760209051600c8152f35b50507f7820de5780d9f3bc73bb8589ea42f1d8bbc877665ac835afb0ec51b91579093a6101ff6101b636610a03565b50503461024a578160031936011261024a576020906005549051908152f35b905060a03660031901126102f8578035602435916084359060ff82168092036105fa57610533610a5b565b61053b610c99565b610543610cb7565b600282116105b7575061055a600554341015610c28565b818552600360205243848620558285524384862055835193604435855260643560208601528401524260608401527f604d869801121e8ddc6fdde8e1a1ffd5b5862f0e609bb1acbe4281c4fb495e1e60803394a461020b34610d75565b606490602086519162461bcd60e51b8352820152601760248201527f496e76616c6964206173737572616e6365206c6576656c0000000000000000006044820152fd5b8580fd5b50503461024a578160031936011261024a576020906009549051908152f35b50503461024a578160031936011261024a5760209060ff6002541690519015158152f35b9050346102f85760203660031901126102f857602092829135815260038452205415159051908152f35b50503461024a573660031901126106c5576106846109a4565b61068c6109bf565b610694610ad5565b60018060a01b0390816bffffffffffffffffffffffff60a01b93168360065416176006551690600754161760075580f35b80fd5b50503461024a578160031936011261024a5760075490516001600160a01b039091168152602090f35b83903461024a57602036600319011261024a5761070c610ad5565b3560055580f35b9050346102f857826003193601126102f85761072d610ad5565b6002549060ff82161561076f575060ff1916600255513381527f5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa90602090a180f35b8251638dfc202b60e01b8152fd5b91503461024a578160031936011261024a578180809261079b610cb7565b3382528060205285822054908115906107b48215610d3c565b338452602052828781205582906107d6575b3390f11561028b57506001805580f35b506108fc6107c6565b83833461024a578060031936011261024a576107f96109bf565b90336001600160a01b0383160361081657506102f4919235610bb3565b5163334bd91960e11b81528390fd5b919050346102f857806003193601126102f8576102f4913561084a60016102de6109bf565b610b35565b9050346102f85760203660031901126102f85760209282916001600160a01b036108776109a4565b168252845220549051908152f35b9050346102f85760203660031901126102f857816020936001923581528085522001549051908152f35b905060803660031901126102f85735906064356001600160a01b038116919082900361094d576108dd610a5b565b6108e5610c99565b6108ed610cb7565b6108fb600554341015610c28565b8284526003602052438185205580519182523360208301524290820152604435917fa828ce56b756abf42eeaac5c17472caa81d977580934977f915de5f21d337999606060243593a461020b34610d75565b8380fd5b8491346102f85760203660031901126102f8573563ffffffff60e01b81168091036102f85760209250637965db0b60e01b8114908115610993575b5015158152f35b6301ffc9a760e01b1490508361098c565b600435906001600160a01b03821682036109ba57565b600080fd5b602435906001600160a01b03821682036109ba57565b9181601f840112156109ba5782359167ffffffffffffffff83116109ba57602083818601950101116109ba57565b9060a06003198301126109ba5760043591602435916044359167ffffffffffffffff916064358381116109ba5782610a3d916004016109d5565b939093926084359182116109ba57610a57916004016109d5565b9091565b3360009081527ffaf93c3d007e112089dc8351e013e6685ef67703975d0224b26fc45941d4f1f560205260409020547fe2b7fb3b832174769106daebcfd6d1970523240dda11281102db9363b83b0dc49060ff1615610ab75750565b6044906040519063e2517d3f60e01b82523360048301526024820152fd5b3360009081527fad3228b676f7d3cd4284a5443f17f1962b36e491b30a40b2405849e597ba5fb5602052604081205460ff1615610ab75750565b80600052600060205260406000203360005260205260ff6040600020541615610ab75750565b9060009180835282602052604083209160018060a01b03169182845260205260ff60408420541615600014610bae57808352826020526040832082845260205260408320600160ff198254161790557f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d339380a4600190565b505090565b9060009180835282602052604083209160018060a01b03169182845260205260ff604084205416600014610bae5780835282602052604083208284526020526040832060ff1981541690557ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b339380a4600190565b15610c2f57565b60405162461bcd60e51b815260206004820152601060248201526f496e73756666696369656e742066656560801b6044820152606490fd5b6000198114610c765760010190565b634e487b7160e01b600052601160045260246000fd5b91908201809211610c7657565b60ff60025416610ca557565b60405163d93c066560e01b8152600490fd5b600260015414610cc8576002600155565b604051633ee5aeb560e01b8152600490fd5b908060209392818452848401376000828201840152601f01601f1916010190565b929093610d1a606095610d289499989799608087526080870191610cda565b918483036020860152610cda565b6001600160a01b0390951660408201520152565b15610d4357565b60405162461bcd60e51b815260206004820152600a6024820152694e6f2062616c616e636560b01b6044820152606490fd5b801590808004600114821715610c7657600c810291818304600c141715610c765760018060a01b039081600654166000526004602052610dbe600d604060002092048254610c8c565b9055600754166000526004602052610ddf600d604060002092048254610c8c565b905556fea26469706673582212206b69c6fb4590f0295670e130d0b67fdaef4544500711bc2eba1cfe836e1d3b4e64736f6c634300081400332f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d";
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "_foundationTreasury";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "_implementerTreasury";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "_admin";
            readonly type: "address";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "constructor";
    }, {
        readonly inputs: readonly [];
        readonly name: "AccessControlBadConfirmation";
        readonly type: "error";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "account";
            readonly type: "address";
        }, {
            readonly internalType: "bytes32";
            readonly name: "neededRole";
            readonly type: "bytes32";
        }];
        readonly name: "AccessControlUnauthorizedAccount";
        readonly type: "error";
    }, {
        readonly inputs: readonly [];
        readonly name: "EnforcedPause";
        readonly type: "error";
    }, {
        readonly inputs: readonly [];
        readonly name: "ExpectedPause";
        readonly type: "error";
    }, {
        readonly inputs: readonly [];
        readonly name: "ReentrancyGuardReentrantCall";
        readonly type: "error";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "bytes32";
            readonly name: "warrantDigest";
            readonly type: "bytes32";
        }, {
            readonly indexed: true;
            readonly internalType: "bytes32";
            readonly name: "attestationDigest";
            readonly type: "bytes32";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "relayer";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "bytes32";
            readonly name: "subjectTag";
            readonly type: "bytes32";
        }, {
            readonly indexed: false;
            readonly internalType: "bytes32";
            readonly name: "controllerDidHash";
            readonly type: "bytes32";
        }, {
            readonly indexed: false;
            readonly internalType: "uint8";
            readonly name: "assurance";
            readonly type: "uint8";
        }, {
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "timestamp";
            readonly type: "uint256";
        }];
        readonly name: "Anchored";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "bytes32";
            readonly name: "attestationHash";
            readonly type: "bytes32";
        }, {
            readonly indexed: true;
            readonly internalType: "bytes32";
            readonly name: "warrantHash";
            readonly type: "bytes32";
        }, {
            readonly indexed: true;
            readonly internalType: "bytes32";
            readonly name: "enterpriseHash";
            readonly type: "bytes32";
        }, {
            readonly indexed: false;
            readonly internalType: "string";
            readonly name: "enterpriseId";
            readonly type: "string";
        }, {
            readonly indexed: false;
            readonly internalType: "string";
            readonly name: "attestationId";
            readonly type: "string";
        }, {
            readonly indexed: false;
            readonly internalType: "address";
            readonly name: "submitter";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "ts";
            readonly type: "uint256";
        }];
        readonly name: "AttestationAnchored";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: false;
            readonly internalType: "address";
            readonly name: "account";
            readonly type: "address";
        }];
        readonly name: "Paused";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "bytes32";
            readonly name: "receiptHash";
            readonly type: "bytes32";
        }, {
            readonly indexed: true;
            readonly internalType: "bytes32";
            readonly name: "warrantHash";
            readonly type: "bytes32";
        }, {
            readonly indexed: true;
            readonly internalType: "bytes32";
            readonly name: "attestationHash";
            readonly type: "bytes32";
        }, {
            readonly indexed: false;
            readonly internalType: "address";
            readonly name: "subjectWallet";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "address";
            readonly name: "submitter";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "ts";
            readonly type: "uint256";
        }];
        readonly name: "ReceiptAnchored";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "bytes32";
            readonly name: "role";
            readonly type: "bytes32";
        }, {
            readonly indexed: true;
            readonly internalType: "bytes32";
            readonly name: "previousAdminRole";
            readonly type: "bytes32";
        }, {
            readonly indexed: true;
            readonly internalType: "bytes32";
            readonly name: "newAdminRole";
            readonly type: "bytes32";
        }];
        readonly name: "RoleAdminChanged";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "bytes32";
            readonly name: "role";
            readonly type: "bytes32";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "account";
            readonly type: "address";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "sender";
            readonly type: "address";
        }];
        readonly name: "RoleGranted";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "bytes32";
            readonly name: "role";
            readonly type: "bytes32";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "account";
            readonly type: "address";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "sender";
            readonly type: "address";
        }];
        readonly name: "RoleRevoked";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: false;
            readonly internalType: "address";
            readonly name: "account";
            readonly type: "address";
        }];
        readonly name: "Unpaused";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "bytes32";
            readonly name: "warrantHash";
            readonly type: "bytes32";
        }, {
            readonly indexed: true;
            readonly internalType: "bytes32";
            readonly name: "subjectHandleHash";
            readonly type: "bytes32";
        }, {
            readonly indexed: true;
            readonly internalType: "bytes32";
            readonly name: "enterpriseHash";
            readonly type: "bytes32";
        }, {
            readonly indexed: false;
            readonly internalType: "string";
            readonly name: "enterpriseId";
            readonly type: "string";
        }, {
            readonly indexed: false;
            readonly internalType: "string";
            readonly name: "warrantId";
            readonly type: "string";
        }, {
            readonly indexed: false;
            readonly internalType: "address";
            readonly name: "submitter";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "ts";
            readonly type: "uint256";
        }];
        readonly name: "WarrantAnchored";
        readonly type: "event";
    }, {
        readonly inputs: readonly [];
        readonly name: "DEFAULT_ADMIN_ROLE";
        readonly outputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "";
            readonly type: "bytes32";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "FEE_DENOMINATOR";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "FOUNDATION_FEE";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "IMPLEMENTER_FEE";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "RELAYER_ROLE";
        readonly outputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "";
            readonly type: "bytes32";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "TREASURY_ROLE";
        readonly outputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "";
            readonly type: "bytes32";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "warrantDigest";
            readonly type: "bytes32";
        }, {
            readonly internalType: "bytes32";
            readonly name: "attestationDigest";
            readonly type: "bytes32";
        }, {
            readonly internalType: "bytes32";
            readonly name: "subjectTag";
            readonly type: "bytes32";
        }, {
            readonly internalType: "bytes32";
            readonly name: "controllerDidHash";
            readonly type: "bytes32";
        }, {
            readonly internalType: "uint8";
            readonly name: "assurance";
            readonly type: "uint8";
        }];
        readonly name: "anchor";
        readonly outputs: readonly [];
        readonly stateMutability: "payable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "attestationHash";
            readonly type: "bytes32";
        }, {
            readonly internalType: "bytes32";
            readonly name: "warrantHash";
            readonly type: "bytes32";
        }, {
            readonly internalType: "bytes32";
            readonly name: "enterpriseHash";
            readonly type: "bytes32";
        }, {
            readonly internalType: "string";
            readonly name: "enterpriseId";
            readonly type: "string";
        }, {
            readonly internalType: "string";
            readonly name: "attestationId";
            readonly type: "string";
        }];
        readonly name: "anchorAttestation";
        readonly outputs: readonly [];
        readonly stateMutability: "payable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "receiptHash";
            readonly type: "bytes32";
        }, {
            readonly internalType: "bytes32";
            readonly name: "warrantHash";
            readonly type: "bytes32";
        }, {
            readonly internalType: "bytes32";
            readonly name: "attestationHash";
            readonly type: "bytes32";
        }, {
            readonly internalType: "address";
            readonly name: "subjectWallet";
            readonly type: "address";
        }];
        readonly name: "anchorReceipt";
        readonly outputs: readonly [];
        readonly stateMutability: "payable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "warrantHash";
            readonly type: "bytes32";
        }, {
            readonly internalType: "bytes32";
            readonly name: "subjectHandleHash";
            readonly type: "bytes32";
        }, {
            readonly internalType: "bytes32";
            readonly name: "enterpriseHash";
            readonly type: "bytes32";
        }, {
            readonly internalType: "string";
            readonly name: "enterpriseId";
            readonly type: "string";
        }, {
            readonly internalType: "string";
            readonly name: "warrantId";
            readonly type: "string";
        }];
        readonly name: "anchorWarrant";
        readonly outputs: readonly [];
        readonly stateMutability: "payable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }];
        readonly name: "balances";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "baseFee";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "emergencyWithdraw";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "foundationTreasury";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "role";
            readonly type: "bytes32";
        }];
        readonly name: "getRoleAdmin";
        readonly outputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "";
            readonly type: "bytes32";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "role";
            readonly type: "bytes32";
        }, {
            readonly internalType: "address";
            readonly name: "account";
            readonly type: "address";
        }];
        readonly name: "grantRole";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "role";
            readonly type: "bytes32";
        }, {
            readonly internalType: "address";
            readonly name: "account";
            readonly type: "address";
        }];
        readonly name: "hasRole";
        readonly outputs: readonly [{
            readonly internalType: "bool";
            readonly name: "";
            readonly type: "bool";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "implementerTreasury";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "hash";
            readonly type: "bytes32";
        }];
        readonly name: "isAnchored";
        readonly outputs: readonly [{
            readonly internalType: "bool";
            readonly name: "";
            readonly type: "bool";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "hash";
            readonly type: "bytes32";
        }];
        readonly name: "lastAnchorBlock";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "pause";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "paused";
        readonly outputs: readonly [{
            readonly internalType: "bool";
            readonly name: "";
            readonly type: "bool";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "role";
            readonly type: "bytes32";
        }, {
            readonly internalType: "address";
            readonly name: "callerConfirmation";
            readonly type: "address";
        }];
        readonly name: "renounceRole";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "role";
            readonly type: "bytes32";
        }, {
            readonly internalType: "address";
            readonly name: "account";
            readonly type: "address";
        }];
        readonly name: "revokeRole";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "_baseFee";
            readonly type: "uint256";
        }];
        readonly name: "setBaseFee";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "_foundationTreasury";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "_implementerTreasury";
            readonly type: "address";
        }];
        readonly name: "setTreasuries";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "bytes4";
            readonly name: "interfaceId";
            readonly type: "bytes4";
        }];
        readonly name: "supportsInterface";
        readonly outputs: readonly [{
            readonly internalType: "bool";
            readonly name: "";
            readonly type: "bool";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "totalAnchors";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "totalFeesCollected";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "unpause";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "withdraw";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly stateMutability: "payable";
        readonly type: "receive";
    }];
    static createInterface(): CanonRegistryInterface;
    static connect(address: string, runner?: ContractRunner | null): CanonRegistry;
}
export {};
//# sourceMappingURL=CanonRegistry__factory.d.ts.map