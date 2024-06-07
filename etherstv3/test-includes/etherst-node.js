//const PKIToken = artifacts.require("PKIToken");
//const Ethrust = artifacts.require("Ethrust");

const GAS_LIMIT = 3000000;


async function createAttribute(account) {

    // Create random 1 to N attributes
    let randomAttributesCount = generateRandomIntInclusive(1, ATTR_PER_ACCOUNT_MAX);
    let attrs = [];
    let signs = [];

    for(let i=0; i< randomAttributesCount;++i) {
        a = generateRandomAttribute();

        let attr = await this.ethrust.createAttribute(a['type'], /* a['has_proof'], */ a['id'], a['data'], {"from": account, "gas": GAS_LIMIT});

        attrId = attr.logs[0].args['attributeID'];
        let expiry = new Date().setFullYear(new Date().getFullYear() + 1)
        let signature = await this.ethrust.signAttribute(attrId, expiry, {"from": account, "gas": GAS_LIMIT});

        //console.log("attributeID : " + attr.logs[0].args['attributeID']);
        //console.log(this.ethrust.accounts[account]);
        if(!Array.isArray(this.ethrust.accounts[account]['attrIDs'])) {
            this.ethrust.accounts[account]['attrIDs'] = new Array();
        }
        if(!Array.isArray(this.ethrust.accounts[account]['signIDs'])) {
            this.ethrust.accounts[account]['signIDs'] = new Array();
        }

        this.ethrust.accounts[account]['attrIDs'].push(attr.logs[0].args['attributeID']);
        this.ethrust.accounts[account]['signIDs'].push(signature.logs[0].args['signatureID']);

        attrs.push(attr);
        signs.push(signature);
    }

    let returnData = new Map();
    //console.log("apa : " + returnData);
    returnData.set('attributeID', attrs);
    returnData.set('signatureID', signs);
    return returnData;
}


async function createAttributes(ethrust, accounts) {

    let promises = accounts.map(createAttribute, { ethrust: ethrust });

    let results = await Promise.all(promises);

    console.log("Created random " + accounts.length + " attributes");
    //console.log(results);

    let data = results.map(values => {
        let returnValues = new Array();
        for(a in values) {
            returnValues[a] = new Array();

            for(b in values[a]) {
                returnValues[a].push(values[a][b].logs[0].args['0'].toString());
            }
        }
        return returnValues;
    });

    return data;
}


async function addAndSignAttribute() {
    account = this.account;
    a = generateRandomAttribute();
    let attr = await this.ethrust.createAttribute(a['type'], /* a['has_proof'],*/ a['id'], a['data'], {"from": account});

    attrId = attr.logs[0].args['attributeID'];
    let expiry = new Date().setFullYear(new Date().getFullYear() + 1)
    let signature = await this.ethrust.signAttribute(attrId, expiry, {"from": account, "gas": GAS_LIMIT});

    if(!Array.isArray(this.ethrust.accounts[account]['attrIDs'])) {
        this.ethrust.accounts[account]['attrIDs'] = new Array();
    }
    if(!Array.isArray(this.ethrust.accounts[account]['signIDs'])) {
        this.ethrust.accounts[account]['signIDs'] = new Array();
    }

    this.ethrust.accounts[account]['attrIDs'].push(attr.logs[0].args['attributeID']);
    this.ethrust.accounts[account]['signIDs'].push(signature.logs[0].args['signatureID']);

    return signature;
}

async function trustSignature(ethrust, account, signatureID) {

    let status = await Main.etherst.trustSignature(signatureID, {"from": account, "gas": GAS_LIMIT});

    return status;
}

async function unTrustSignature(ethrust, account, signatureID) {
    let status = await Main.etherst.unTrustSignature(signatureID, {"from": account, "gas": GAS_LIMIT});

    return status;
}


/* Singleton class for Etherst */
function Main(){};


/* Signature class */
function Signature(id, signer, expiry) {
    this.id = id;
    this.signer = signer;
    this.expiry = expiry;
}

function SignatureFactory() {}

SignatureFactory.signatureMap = new Map();

SignatureFactory.prototype.createItem = function(id, signer, expiry) {
    signature = new Signature(id, signer, expiry);
    SignatureFactory.signatureMap.set(id, signature);
}


/* Attribute class */
function Attribute(attrType, id, data){
    this.attrType = attrType;
    this.id = id;
    this.data = data;
    this.signatureId = null;
}

Attribute.prototype.sign = async function(signer){
    let expiry = new Date().setFullYear(new Date().getFullYear() + 1);
    let signature = await Main.etherst.signAttribute(this.id, expiry, {"from": signer, "gas": GAS_LIMIT});
    let signatureId = signature.logs[0].args['signatureID'];
    SignatureFactory.createItem(signatureId, signer, expiry);
    this.signatureId = signatureId;
};


function AttributeFactory() {}

AttributeFactory.attributeMap = new Map();

AttributeFactory.createItem = function(node, attrType, id, data) {
    attribute = new Attribute(attrType, id, data);

    AttributeFactory.attributeMap.set(id, attribute);
}


function EtherstNode(account){
    this.account = account;

    this.attributes = new Array();
    this.signaturesMap = new Map();
}

EtherstNode.prototype.getAccount = function(){
    return this.account;
};

EtherstNode.prototype.increaseAllowance = async function(amount){
    // console.debug("EtherstNode increaseAllowance");
    await Main.pki.increaseAllowance(Main.etherst.address, amount, {"from": this.getAccount(), "gas": GAS_LIMIT});
};

EtherstNode.prototype.getPkiBalance = async function(){
    // console.debug("EtherstNode getPkiBalance");
    let bal = await Main.pki.balanceOf(this.getAccount());
    console.log("Accounts : " + this.getAccount() + " Type: " + this.node_type + " Balance : " + bal.toString());
    return bal;
};


EtherstNode.prototype.createAttribute = async function(attrType, id, data){
    // console.debug("EtherstNode createAttribute");
    let attr = await Main.etherst.createAttribute(attrType, id, data, {"from": this.getAccount(), "gas": GAS_LIMIT});
    attrId = attr.logs[0].args['attributeID'];
    // attr = new Attribute(attrType, attrId, data);
    AttributeFactory.createItem(this, attrType, attrId, data);

    this.attributes.push(attrId);
    return attrId;
    /*
    let expiry = new Date().setFullYear(new Date().getFullYear() + 1)
    let signature = await this.ethrust.signAttribute(attrId, expiry, {"from": account});
    */
};

EtherstNode.prototype.signAttribute = async function(attrId){
    // console.debug("EtherstNode signAttribute");
    let expiry = new Date().setFullYear(new Date().getFullYear() + 1);
    let signature = await Main.etherst.signAttribute(attrId, expiry, {"from": this.getAccount(), "gas": GAS_LIMIT});

    let signatureId = signature.logs[0].args['signatureID'];
    this.signaturesMap.set(attrId, signatureId);
    return signatureId;
};


EtherstNode.prototype.trustNode = async function(signatureId){
    //console.debug("@EtherstNode.trustNode : " + signatureId);
    let status = await Main.etherst.trustSignature(signatureId, {"from": this.getAccount(), "gas": GAS_LIMIT});
    //console.debug("@EtherstNode.trustNode : Done with " + signatureId);
    return status; 
};

EtherstNode.prototype.untrustNode = async function(signatureId){
    let status = await Main.etherst.unTrustSignature(signatureId, {"from": this.getAccount(), "gas": GAS_LIMIT});

    return status;  
};


/* BadEtherstNode inherits EtherstNode*/

function BadEtherstNode(account) {
    EtherstNode.call(this, account);
  
    this.node_type = "B";
}

BadEtherstNode.prototype = Object.create(EtherstNode.prototype);

Object.defineProperty(BadEtherstNode.prototype, 'constructor', {
    value: BadEtherstNode,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });


/* GoodEtherstNode inherits EtherstNode*/

function GoodEtherstNode(account) {
    EtherstNode.call(this, account);
  
    this.node_type = "G";
}

GoodEtherstNode.prototype = Object.create(EtherstNode.prototype);

Object.defineProperty(GoodEtherstNode.prototype, 'constructor', {
    value: GoodEtherstNode,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });


/* NormalEtherstNode inherits EtherstNode*/

function NormalEtherstNode(account) {
    EtherstNode.call(this, account);
  
    this.node_type = "N";
}

NormalEtherstNode.prototype = Object.create(EtherstNode.prototype);

Object.defineProperty(NormalEtherstNode.prototype, 'constructor', {
    value: NormalEtherstNode,
    enumerable: false, // so that it does not appear in 'for in' loop
    writable: true });    


module.exports  = { Main, BadEtherstNode, GoodEtherstNode, NormalEtherstNode, EtherstNode };