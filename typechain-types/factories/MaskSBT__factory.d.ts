import { ContractFactory, ContractTransactionResponse } from "ethers";
import type { Signer, AddressLike, ContractDeployTransaction, ContractRunner } from "ethers";
import type { NonPayableOverrides } from "../common";
import type { MaskSBT, MaskSBTInterface } from "../MaskSBT";
type MaskSBTConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class MaskSBT__factory extends ContractFactory {
    constructor(...args: MaskSBTConstructorParams);
    getDeployTransaction(name: string, symbol: string, admin: AddressLike, overrides?: NonPayableOverrides & {
        from?: string;
    }): Promise<ContractDeployTransaction>;
    deploy(name: string, symbol: string, admin: AddressLike, overrides?: NonPayableOverrides & {
        from?: string;
    }): Promise<MaskSBT & {
        deploymentTransaction(): ContractTransactionResponse;
    }>;
    connect(runner: ContractRunner | null): MaskSBT__factory;
    static readonly bytecode = "0x6080604052346200036a5762002205803803806200001d816200036f565b9283398101906060818303126200036a5780516001600160401b03908181116200036a57836200004f91840162000395565b90602093848401518281116200036a576040916200006f91860162000395565b930151926001600160a01b03841684036200036a5782519082821162000354576000958654926001958685811c9516801562000349575b8386101462000335578190601f95868111620002e2575b5083908683116001146200027e578a9262000272575b5050600019600383901b1c191690861b1787555b81519384116200025e5784548581811c9116801562000253575b828210146200023f57838111620001f7575b50809284116001146200018c57506200016f9591908362000180575b5050600019600383901b1c191690821b1781555b60075561ffff19600a5416600a556200015c8162000407565b50620001688162000488565b506200052b565b50604051611c1b9081620005ca8239f35b0151905038806200012f565b8487528087209396601f198816915b828210620001df57505091849391876200016f989410620001c5575b505050811b01815562000143565b015160001960f88460031b161c19169055388080620001b7565b8087869782949787015181550196019401906200019b565b8588528188208480870160051c82019284881062000235575b0160051c019086905b8281106200022957505062000113565b89815501869062000219565b9250819262000210565b634e487b7160e01b88526022600452602488fd5b90607f169062000101565b634e487b7160e01b87526041600452602487fd5b015190503880620000d3565b8a8052848b208994509190601f1984168c5b87828210620002cb5750508411620002b1575b505050811b018755620000e7565b015160001960f88460031b161c19169055388080620002a3565b8385015186558c9790950194938401930162000290565b909150898052838a208680850160051c8201928686106200032b575b918a91869594930160051c01915b8281106200031c575050620000bd565b8c81558594508a91016200030c565b92508192620002fe565b634e487b7160e01b89526022600452602489fd5b94607f1694620000a6565b634e487b7160e01b600052604160045260246000fd5b600080fd5b6040519190601f01601f191682016001600160401b038111838210176200035457604052565b919080601f840112156200036a5782516001600160401b0381116200035457602090620003cb601f8201601f191683016200036f565b928184528282870101116200036a5760005b818110620003f357508260009394955001015290565b8581018301518482018401528201620003dd565b6001600160a01b031660008181527f54cdd369e4e8a8515e52ca72ec816c2101831ad1f18bf44102ed171459c9b4f8602052604081205490919060ff16620004845781805260066020526040822081835260205260408220600160ff198254161790553391600080516020620021e58339815191528180a4600190565b5090565b6001600160a01b031660008181527f0c3bb05773fb95f6688e1e7d9c896674dccd66884026cf30a3d5e3a9bfecd81160205260408120549091907fa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c217759060ff16620005265780835260066020526040832082845260205260408320600160ff19825416179055600080516020620021e5833981519152339380a4600190565b505090565b6001600160a01b031660008181527f3195c024b2ddd6d9b8f6c836aa52f67fe69376c8903d009b80229b3ce4425f5160205260408120549091907f9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a69060ff16620005265780835260066020526040832082845260205260408320600160ff19825416179055600080516020620021e5833981519152339380a460019056fe608060408181526004918236101561001657600080fd5b600092833560e01c91826301ffc9a7146111765750816306fdde03146110ab578163081812fc1461106f5781630906a4bf14611033578163095ea7b314610f4557816312a187f314610ede57816318160ddd14610ebf57816323b872dd14610ea7578163248a9ca314610e7c5781632d414ae514610e495781632f2ff15d14610e1f57816336568abe14610dd95781633f4ba83a14610d6f57816342842e0e14610d405781634cd412d514610d195781635c975abb14610cf55781636352211e14610cc45781636c36092314610c8857816370a0823114610c3357816375b238fc14610bf85781638456cb5914610b9d57816391d1485414610b56578163942c587514610a785781639470098914610a1757816395d89b4114610901578163a0d1376a146108dd578163a217fddf146108c2578163a22cb4651461080f578163a2309ff8146107f0578163a4559f26146107a8578163b88d4fde14610712578163b8a171fe14610398578163bb77f74914610370578163c87b56dd1461031e578163d237f29b146102f6578163d318a783146102ca578163d53913931461028f578163d547741f1461024b57508063d89135cd1461022d5763e985e9c5146101dd57600080fd5b3461022957806003193601126102295760ff816020936101fb61123b565b610203611256565b6001600160a01b0391821683526005875283832091168252855220549151911615158152f35b5080fd5b5034610229578160031936011261022957602090600f549051908152f35b9190503461028b578060031936011261028b5761028791356102826001610270611256565b9383875260066020528620015461139a565b611440565b5080f35b8280fd5b505034610229578160031936011261022957602090517f9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a68152f35b8284346102f35760203660031901126102f357506102ea6020923561172f565b90519015158152f35b80fd5b90503461028b57602036600319011261028b576020928291358152600b845220549051908152f35b8383346102295760203660031901126102295761033e61036c9335611524565b5081815161034b816112b0565b52805191610358836112b0565b8252519182916020835260208301906111fb565b0390f35b90503461028b57602036600319011261028b576020928291358152600c845220549051908152f35b9190503461028b578060031936011261028b576103b361123b565b916024938435907f9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a69586825260209660068852858320338452885260ff8684205416156106f857506104036116ce565b6002600754146106e857600260075560ff600a54161561069b576001600160a01b038681169490851561065a578415610622576104416009546116a9565b9788600955875191610452836112b0565b85835261045f8a83611826565b1661060c573b6104e7575b5050508085859252600b87528282822055600c87524282822055600d875220336001600160601b0360a01b8254161790556104a6600e546116a9565b600e55825133815242602082015284907f4708f02ca67aaf3cf4bdbdd5bbf8e3211b5d80ba94706e11df27c3ffa3a962e790604090a4600160075551908152f35b9083949189849a95839a956105298b9a9b519485938493630a85bd0160e11b9889865233908601528401528860448401526080606484015260848301906111fb565b0381898c5af18691816105c8575b5061059157505050503d600014610588573d61055281611304565b9061055f855192836112e2565b81528092823d92013e5b81519182610585575050505191633250574960e11b8352820152fd5b01fd5b60609150610569565b939892979596959194936001600160e01b031916036105b457505083388061046a565b8551633250574960e11b8152908101859052fd5b9091508581813d8311610605575b6105e081836112e2565b8101031261060157516001600160e01b031981168103610601579038610537565b8680fd5b503d6105d6565b505085516339e3563760e11b8152908101839052fd5b5060146064928988519362461bcd60e51b855284015282015273092dcecc2d8d2c840e4cac6cad2e0e840d0c2e6d60631b6044820152fd5b50601b6064928988519362461bcd60e51b85528401528201527f43616e6e6f74206d696e7420746f207a65726f206164647265737300000000006044820152fd5b8360236084928988519362461bcd60e51b85528401528201527f534254206d696e74696e672069732064697361626c656420666f72207072697660448201526261637960e81b6064820152fd5b8451633ee5aeb560e01b81528490fd5b855163e2517d3f60e01b8152338187015291820152604490fd5b9190503461028b57608036600319011261028b5761072e61123b565b610736611256565b60443591856064359567ffffffffffffffff87116102295736602388011215610229578601359561077261076988611304565b965196876112e2565b868652366024888301011161022957866107a597602460209301838901378601015261079f8383836114b7565b3361155f565b80f35b90503461028b57602036600319011261028b576020926001600160a01b0391839190356107e0846107d883611524565b1615156116ec565b8152600d85522054169051908152f35b505034610229578160031936011261022957602090600e549051908152f35b9190503461028b578060031936011261028b5761082a61123b565b90602435918215158093036108be5761084a60ff600a5460081c16611b99565b6001600160a01b03169283156108a95750338452600560205280842083855260205280842060ff1981541660ff8416179055519081527f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c3160203392a380f35b836024925191630b61174360e31b8352820152fd5b8480fd5b50503461022957816003193601126102295751908152602090f35b50503461022957816003193601126102295760209060ff600a541690519015158152f35b8284346102f357806003193601126102f3578151918160019283549384811c91818616958615610a0d575b60209687851081146109fa578899509688969785829a5291826000146109d3575050600114610978575b50505061036c92916109699103856112e2565b519282849384528301906111fb565b91908693508083527fb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf65b8284106109bb575050508201018161096961036c610956565b8054848a0186015288955087949093019281016109a2565b60ff19168782015293151560051b86019093019350849250610969915061036c9050610956565b634e487b7160e01b835260228a52602483fd5b92607f169261092c565b5050346102295760203660031901126102295760207ffe15e66f82958c688a852161423bd20de8c6a603677ead2a064db45cd995827e91610a5661126c565b610a5e611320565b15159060ff19600a541660ff831617600a5551908152a180f35b9190503461028b57602080600319360112610b5257823590610a98611320565b6001600160a01b03610aad816107d885611524565b828652600b82528386205493610ac284611524565b9582610acd86611792565b1615610b3d5750907fa022acdb72b5df9f1476594a7daf4d164a5458ddcf15632685c7235d99b820bb9291848852600b83528781812055600c83528781812055600d83528088206001600160601b0360a01b8154169055610b2f600f546116a9565b600f5551954287521694a480f35b846024925191637e27328960e01b8352820152fd5b8380fd5b90503461028b578160031936011261028b578160209360ff92610b77611256565b90358252600686528282206001600160a01b039091168252855220549151911615158152f35b50503461022957816003193601126102295760207f62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a25891610bdb611320565b610be36116ce565b600160ff19600854161760085551338152a180f35b505034610229578160031936011261022957602090517fa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c217758152f35b8284346102f35760203660031901126102f3576001600160a01b03610c5661123b565b16928315610c735750806020938392526003845220549051908152f35b91516322718ad960e21b815291820152602490fd5b90503461028b57602036600319011261028b57602092829135610cb56001600160a01b036107d883611524565b8152600c845220549051908152f35b8284346102f35760203660031901126102f35750610ce460209235611524565b90516001600160a01b039091168152f35b50503461022957816003193601126102295760209060ff6008541690519015158152f35b50503461022957816003193601126102295760209060ff600a5460081c1690519015158152f35b505034610229576107a590610d543661127b565b91925192610d61846112b0565b85845261079f8383836114b7565b90503461028b578260031936011261028b57610d89611320565b6008549060ff821615610dcb575060ff1916600855513381527f5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa90602090a180f35b8251638dfc202b60e01b8152fd5b838334610229578060031936011261022957610df3611256565b90336001600160a01b03831603610e105750610287919235611440565b5163334bd91960e11b81528390fd5b9190503461028b578060031936011261028b576102879135610e446001610270611256565b6113c0565b90503461028b57602036600319011261028b57358252600d6020908152918190205490516001600160a01b039091168152f35b90503461028b57602036600319011261028b5781602093600192358152600685522001549051908152f35b83346102f3576107a5610eb93661127b565b916114b7565b5050346102295781600319360112610229576020906009549051908152f35b5050346102295760203660031901126102295760207f6395945c71c961e52286907164a0dccda0cd35503efe6bf4a9296c69670611d491610f1d61126c565b610f25611320565b151590600a5461ff008360081b169061ff00191617600a5551908152a180f35b9190503461028b578060031936011261028b57610f6061123b565b91602435610f7560ff600a5460081c16611b99565b610f7e81611524565b33151580611020575b80610ff7575b610fe1576001600160a01b039485169482918691167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b9258880a48452602052822080546001600160a01b031916909117905580f35b835163a9fbf51f60e01b81523381850152602490fd5b506001600160a01b03811686526005602090815284872033885290528386205460ff1615610f8d565b506001600160a01b038116331415610f87565b90503461028b57602036600319011261028b576020928291356110606001600160a01b036107d883611524565b8152600b845220549051908152f35b90503461028b57602036600319011261028b5791826020933561109181611524565b50825283528190205490516001600160a01b039091168152f35b8284346102f357806003193601126102f35781519181825492600184811c9181861695861561116c575b60209687851081146109fa578899509688969785829a5291826000146109d35750506001146111115750505061036c92916109699103856112e2565b91908693508280527f290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e5635b828410611154575050508201018161096961036c610956565b8054848a01860152889550879490930192810161113b565b92607f16926110d5565b84913461028b57602036600319011261028b573563ffffffff60e01b811680910361028b5760209250637965db0b60e01b81149081156111b8575b5015158152f35b6380ac58cd60e01b8114915081156111ea575b81156111d9575b50836111b1565b6301ffc9a760e01b149050836111d2565b635b5e139f60e01b811491506111cb565b919082519283825260005b848110611227575050826000602080949584010152601f8019910116010190565b602081830181015184830182015201611206565b600435906001600160a01b038216820361125157565b600080fd5b602435906001600160a01b038216820361125157565b60043590811515820361125157565b6060906003190112611251576001600160a01b0390600435828116810361125157916024359081168103611251579060443590565b6020810190811067ffffffffffffffff8211176112cc57604052565b634e487b7160e01b600052604160045260246000fd5b90601f8019910116810190811067ffffffffffffffff8211176112cc57604052565b67ffffffffffffffff81116112cc57601f01601f191660200190565b3360009081527f0c3bb05773fb95f6688e1e7d9c896674dccd66884026cf30a3d5e3a9bfecd81160205260409020547fa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c217759060ff161561137c5750565b6044906040519063e2517d3f60e01b82523360048301526024820152fd5b80600052600660205260406000203360005260205260ff604060002054161561137c5750565b906000918083526006602052604083209160018060a01b03169182845260205260ff6040842054161560001461143b5780835260066020526040832082845260205260408320600160ff198254161790557f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d339380a4600190565b505090565b906000918083526006602052604083209160018060a01b03169182845260205260ff60408420541660001461143b578083526006602052604083208284526020526040832060ff1981541690557ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b339380a4600190565b91906001600160a01b03908181161561150b576114d78291843391611878565b93169216908282036114e857505050565b60649350604051926364283d7b60e01b8452600484015260248301526044820152fd5b604051633250574960e11b815260006004820152602490fd5b6000818152600260205260409020546001600160a01b0316908115611547575090565b60249060405190637e27328960e01b82526004820152fd5b90939192833b611571575b5050505050565b604051630a85bd0160e11b8082526001600160a01b0393841660048301529583166024820152604481019190915260806064820152949216926020929185906115be9060848301906111fb565b039483816000978189895af1869181611669575b50611633575050503d60001461162a573d6115ec81611304565b906115fa60405192836112e2565b81528093823d92013e5b8251928361162557604051633250574960e11b815260048101849052602490fd5b019050fd5b60609250611604565b919450915063ffffffff60e01b16036116515750388080808061156a565b60249060405190633250574960e11b82526004820152fd5b9091508481813d83116116a2575b61168181836112e2565b8101031261060157516001600160e01b0319811681036106015790386115d2565b503d611677565b60001981146116b85760010190565b634e487b7160e01b600052601160045260246000fd5b60ff600854166116da57565b60405163d93c066560e01b8152600490fd5b156116f357565b60405162461bcd60e51b8152602060048201526014602482015273151bdad95b88191bd95cc81b9bdd08195e1a5cdd60621b6044820152606490fd5b60018091600954925b838111156117495750505050600090565b6001600160a01b0361175a82611524565b1615158061177c575b61177557611770906116a9565b611738565b5050905090565b508160406000838152600b602052205414611763565b6000818152600260205260409020546001600160a01b031615801561181e575b6118155760ff600a5460081c16156117d0576117cd906118cb565b90565b60405162461bcd60e51b815260206004820152601f60248201527f5472616e7366657273206172652064697361626c656420666f722053425473006044820152606490fd5b6117cd906118cb565b5060016117b2565b9080600052600260205260018060a01b0380604060002054161590811561186d575b506118645760ff600a5460081c16156117d0576117cd9161195f565b6117cd9161195f565b905082161538611848565b919080600052600260205260018060a01b038060406000205416159081156118c0575b506118b75760ff600a5460081c16156117d0576117cd92611a18565b6117cd92611a18565b90508316153861189b565b6000818152600260205260408120546001600160a01b031691908261192d575b81815260026020526040812080546001600160a01b0319169055827fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8280a490565b6004602052604081206001600160601b0360a01b815416905582815260036020526040812060001981540190556118eb565b6000828152600260205260408120546001600160a01b03908116939284917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef91836119e6575b1692836119ce575b84815260026020526040812080546001600160a01b0319168517905580a490565b838152600360205260408120600181540190556119ad565b6004602052604085206001600160601b0360a01b815416905583855260036020526040852060001981540190556119a5565b916000928284526020916002835260018060a01b039460408681832054169683818995168015159081611add575b50505060029084957fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef95611aae575b169586611a98575b87845252812080546001600160a01b0319168517905580a490565b8684526003815282842060018154019055611a7d565b8885526004885283852080546001600160a01b0319169055868552600388528385208054600019019055611a75565b90809293959794965091611b4c575b5015611aff579182808995939694611a46565b8387918915600014611b23578151637e27328960e01b815260048101849052602490fd5b905163177e802f60e01b81526001600160a01b0390911660048201526024810191909152604490fd5b89811491508115611b7c575b8115611b66575b5038611aec565b9050878652600487528385872054161438611b5f565b8987526005885285872081885288528587205460ff169150611b58565b15611ba057565b60405162461bcd60e51b815260206004820152601f60248201527f417070726f76616c73206172652064697361626c656420666f722053425473006044820152606490fdfea264697066735822122086cdef6fd2c388c252a4d8a5d15bfee3d93f733657464d0a15fe6c91fb703d6764736f6c634300081400332f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d";
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "string";
            readonly name: "name";
            readonly type: "string";
        }, {
            readonly internalType: "string";
            readonly name: "symbol";
            readonly type: "string";
        }, {
            readonly internalType: "address";
            readonly name: "admin";
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
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "sender";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }, {
            readonly internalType: "address";
            readonly name: "owner";
            readonly type: "address";
        }];
        readonly name: "ERC721IncorrectOwner";
        readonly type: "error";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "operator";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "ERC721InsufficientApproval";
        readonly type: "error";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "approver";
            readonly type: "address";
        }];
        readonly name: "ERC721InvalidApprover";
        readonly type: "error";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "operator";
            readonly type: "address";
        }];
        readonly name: "ERC721InvalidOperator";
        readonly type: "error";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "owner";
            readonly type: "address";
        }];
        readonly name: "ERC721InvalidOwner";
        readonly type: "error";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "receiver";
            readonly type: "address";
        }];
        readonly name: "ERC721InvalidReceiver";
        readonly type: "error";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "sender";
            readonly type: "address";
        }];
        readonly name: "ERC721InvalidSender";
        readonly type: "error";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "ERC721NonexistentToken";
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
            readonly internalType: "address";
            readonly name: "owner";
            readonly type: "address";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "approved";
            readonly type: "address";
        }, {
            readonly indexed: true;
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "Approval";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "owner";
            readonly type: "address";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "operator";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "bool";
            readonly name: "approved";
            readonly type: "bool";
        }];
        readonly name: "ApprovalForAll";
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
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }, {
            readonly indexed: true;
            readonly internalType: "bytes32";
            readonly name: "receiptHash";
            readonly type: "bytes32";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "owner";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "timestamp";
            readonly type: "uint256";
        }];
        readonly name: "ReceiptBurned";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }, {
            readonly indexed: true;
            readonly internalType: "bytes32";
            readonly name: "receiptHash";
            readonly type: "bytes32";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "recipient";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "address";
            readonly name: "minter";
            readonly type: "address";
        }, {
            readonly indexed: false;
            readonly internalType: "uint256";
            readonly name: "timestamp";
            readonly type: "uint256";
        }];
        readonly name: "ReceiptMinted";
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
            readonly internalType: "bool";
            readonly name: "enabled";
            readonly type: "bool";
        }];
        readonly name: "SBTMintingToggled";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "from";
            readonly type: "address";
        }, {
            readonly indexed: true;
            readonly internalType: "address";
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly indexed: true;
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "Transfer";
        readonly type: "event";
    }, {
        readonly anonymous: false;
        readonly inputs: readonly [{
            readonly indexed: false;
            readonly internalType: "bool";
            readonly name: "enabled";
            readonly type: "bool";
        }];
        readonly name: "TransferToggled";
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
        readonly inputs: readonly [];
        readonly name: "ADMIN_ROLE";
        readonly outputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "";
            readonly type: "bytes32";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
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
        readonly name: "MINTER_ROLE";
        readonly outputs: readonly [{
            readonly internalType: "bytes32";
            readonly name: "";
            readonly type: "bytes32";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "approve";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "owner";
            readonly type: "address";
        }];
        readonly name: "balanceOf";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "burnReceipt";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "getApproved";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "getMintTimestamp";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "getOriginalMinter";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "getReceiptHash";
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
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "owner";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "operator";
            readonly type: "address";
        }];
        readonly name: "isApprovedForAll";
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
            readonly name: "receiptHash";
            readonly type: "bytes32";
        }];
        readonly name: "isReceiptMinted";
        readonly outputs: readonly [{
            readonly internalType: "bool";
            readonly name: "";
            readonly type: "bool";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly internalType: "bytes32";
            readonly name: "receiptHash";
            readonly type: "bytes32";
        }];
        readonly name: "mintReceipt";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly name: "mintTimestamps";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "name";
        readonly outputs: readonly [{
            readonly internalType: "string";
            readonly name: "";
            readonly type: "string";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly name: "originalMinter";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "ownerOf";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
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
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly name: "receiptHashes";
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
            readonly internalType: "address";
            readonly name: "from";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "safeTransferFrom";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "from";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }, {
            readonly internalType: "bytes";
            readonly name: "data";
            readonly type: "bytes";
        }];
        readonly name: "safeTransferFrom";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "sbtMintingEnabled";
        readonly outputs: readonly [{
            readonly internalType: "bool";
            readonly name: "";
            readonly type: "bool";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "operator";
            readonly type: "address";
        }, {
            readonly internalType: "bool";
            readonly name: "approved";
            readonly type: "bool";
        }];
        readonly name: "setApprovalForAll";
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
        readonly name: "symbol";
        readonly outputs: readonly [{
            readonly internalType: "string";
            readonly name: "";
            readonly type: "string";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "bool";
            readonly name: "enabled";
            readonly type: "bool";
        }];
        readonly name: "toggleSBTMinting";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "bool";
            readonly name: "enabled";
            readonly type: "bool";
        }];
        readonly name: "toggleTransfer";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "tokenURI";
        readonly outputs: readonly [{
            readonly internalType: "string";
            readonly name: "";
            readonly type: "string";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "totalBurned";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "totalMinted";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "totalSupply";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "transferEnabled";
        readonly outputs: readonly [{
            readonly internalType: "bool";
            readonly name: "";
            readonly type: "bool";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "from";
            readonly type: "address";
        }, {
            readonly internalType: "address";
            readonly name: "to";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "tokenId";
            readonly type: "uint256";
        }];
        readonly name: "transferFrom";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "unpause";
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }];
    static createInterface(): MaskSBTInterface;
    static connect(address: string, runner?: ContractRunner | null): MaskSBT;
}
export {};
//# sourceMappingURL=MaskSBT__factory.d.ts.map