const PKIToken = artifacts.require("PKIToken");
const Ethrust = artifacts.require("Ethrust");


const APPROVED_AMOUNT = 50;

const TOTAL_ACCOUNT_COUNT = 100;
const SIM_ACCOUNT_COUNT = 90;


const ATTR_PER_ACCOUNT_MAX = 6;
ACTIVITY_COUNT = SIM_ACCOUNT_COUNT * 2;



Array.prototype.extend = function (other_array) {
    /* You should include a test to check whether other_array really is an array */
    other_array.forEach(function(v) {this.push(v)}, this);
}

function generateRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
}

function generateRandomIntInclusiveAndNotIn(min, max, excluded) {
    let no = -1;
    //do {
        no = generateRandomIntInclusive(min, max);
    //} while(excluded.includes(no))

    return no;
}

function numberGenerator(arr, min, max, total, allowDuplicate) {
  if (arr.length >= total) return;
  let newNumber = NaN;

  if(!allowDuplicate) {
      do {
          newNumber = generateRandomIntInclusive(min, max);
      }
      while (arr.indexOf(newNumber) >= 0)
  } else {
       newNumber = generateRandomIntInclusive(min, max);
  }

  arr.push(newNumber);

  numberGenerator(arr, min, max, total, allowDuplicate);
};


function generateRandomString(size) {
    size = 0 - size
    return Math.random().toString(36).slice(size);
}


function generateRandomAttribute() {
    let randomType = generateRandomString(5);

    let randomData = generateRandomString(10).repeat(10);

    let randomIdentifier = generateRandomIntInclusive(1, 5000);
    randomIdentifier = web3.utils.fromAscii(String(randomIdentifier));

    let randomProof = (generateRandomIntInclusive(1, 5000) % 2 == 1);

    randomAttribute = new Array();
    randomAttribute["type"] = randomType;
    randomAttribute["id"] = randomIdentifier;
    randomAttribute["data"] = randomData;
    randomAttribute["has_proof"] = randomProof;

    return randomAttribute;
}

async function showBalance(pki, accounts, i) {
    let bal = await pki.balanceOf(accounts[i]);
    console.log("Balance of accounts [" + i + "]," + bal.toString());
}

async function showAllBalances(pki, accounts) {
    for(let i=0; i<accounts.length; ++i) {
        await showBalance(pki, accounts, i);
    }
    console.log("Done showBalances");
}



async function increaseAllowance(account) {
    await this.pki.increaseAllowance(this.ethrust.address, APPROVED_AMOUNT, {"from": account});
}


async function increaseAllowances(pki, ethrust, accounts) {

    let promises = accounts.map(increaseAllowance, { pki: pki, ethrust: ethrust });

    await Promise.all(promises);

    console.log("Increase " + accounts.length + " allowances");

}


async function createAttribute(account) {

    // Create random 1 to N attributes
    let randomAttributesCount = generateRandomIntInclusive(1, ATTR_PER_ACCOUNT_MAX);
    let attrs = [];
    let signs = [];

    for(let i=0; i< randomAttributesCount;++i) {
        a = generateRandomAttribute();

        let attr = await this.ethrust.createAttribute(a['type'], /* a['has_proof'], */ a['id'], a['data'], {"from": account});

        attrId = attr.logs[0].args['attributeID'];
        let expiry = new Date().setFullYear(new Date().getFullYear() + 1)
        let signature = await this.ethrust.signAttribute(attrId, expiry, {"from": account});

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
    let signature = await this.ethrust.signAttribute(attrId, expiry, {"from": account});

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

    let status = await ethrust.trustSignature(signatureID, {"from": account});

    return status;
}

async function unTrustSignature(ethrust, account, signatureID) {
    let status = await ethrust.unTrustSignature(signatureID, {"from": account});

    return status;
}

function getRandomSignatureID(ethrust, accounts, account) {

    let randomIndex = -1;
    do {
        randomIndex = generateRandomIntInclusive(0, ethrust.arrAccounts.length - 1);
    } while(accounts[randomIndex]==account)

    let randomSignIndex = generateRandomIntInclusive(0, ethrust.accounts[ethrust.arrAccounts[randomIndex]]['signIDs'].length - 1);

    let signatureID = ethrust.accounts[ethrust.arrAccounts[randomIndex]]['signIDs'][randomSignIndex]

    let data = new Map();
    data.set('account', randomIndex);
    data.set('signatureID', signatureID);
    return data;
}


async function doTrustSignature(ethrust, accounts, account) {
    let data = getRandomSignatureID(ethrust, accounts, account);
    console.log(`${account} trust signature ${data.get('signatureID')} of account[${data.get('account')}]`);
    return await trustSignature(ethrust, account, data.get('signatureID'));
}

async function doUnTrustSignature(ethrust, accounts, account) {
    let data = getRandomSignatureID(ethrust, accounts, account);
    console.log(`${account} untrust signature ${data.get('signatureID')} of account[${data.get('account')}]`);

    return await unTrustSignature(ethrust, account, data.get('signatureID'));
}


async function randomActivities(pki, ethrust, accounts) {

    let activities = [trustSignature, unTrustSignature];

    let activityIndex = [];

    numberGenerator(activityIndex, 0, activities.length-1, ACTIVITY_COUNT, true);

    //console.log(activityIndex);

    let randomActivities = [];
    for(let i=0; i < activityIndex.length; ++i) {
        randomActivities.push(activities[activityIndex[i]]);
    }
    //console.log(randomActivities);

    let promises = randomActivities.map(activityHandler, {pki: pki, ethrust: ethrust, accounts: accounts });
    await Promise.all(promises);

}


async function activityHandler(activity) {
    pki = this.pki;
    ethrust = this.ethrust;
    accounts = this.accounts;

    let randomIndex = generateRandomIntInclusive(1, accounts.length - 1);

    account = accounts[randomIndex];
    //console.log(activity);

    switch(activity.name) {
        case 'addAndSignAttribute':
            //doAddAndSignAttribute(pki, ethrust, accounts, account);
            break;
        case 'trustSignature':
            doTrustSignature(ethrust, accounts, account);
            break;
        case 'unTrustSignature':
            doUnTrustSignature(ethrust, accounts, account);
            break;
    }

}


let attributeIds = []
let signatureIds = []



contract("Simulation", async accounts => {
    it("Start simulation", async () => {
        /*
        let accountIndex = [];
        let result = [];
       //numberGenerator(result, 2, 10, 6, myIndex);


       //for(let i=0; i < 10; ++i) {
           numberGenerator(accountIndex, 1, 9, 10,[]);
         //  result.extend(accountIndex);
        //}


       console.log(accountIndex);
       */
       let pki = await PKIToken.deployed();
       let ethrust = await Ethrust.deployed();


       // Create a Map to keep the accounts related simulation data such as attribute
       ethrust.accounts = new Map();
       ethrust.arrAccounts = new Array();


       // Initialise the account[0] as facet
       let status = await pki.increaseAllowance(ethrust.address, 100000, {"from": accounts[0]});

       let myAccounts = [];
       let accountIndex = []

       //let accounts = await web3.eth.getAccounts();

       // Prepare random accounts
       numberGenerator(accountIndex, 1, TOTAL_ACCOUNT_COUNT - 1, SIM_ACCOUNT_COUNT , false);


       // for(let i=0; i<99;i++) {
       //   accountIndex[i] = i+1;
       // }

       console.log("Accounts : " + accountIndex.toString());
       for(let i=0; i<accountIndex.length; ++i) {
           myAccounts.push(accounts[accountIndex[i]]);
       }

       for(let i=0; i<accountIndex.length; ++i) {
           let account = myAccounts[i];
           if(!Array.isArray(ethrust.accounts[account])) {
               ethrust.accounts[account] = new Array();
               ethrust.arrAccounts.push(account);
           }
       }

       await increaseAllowances(pki, ethrust, myAccounts);
       //await increaseAllowances(pki, ethrust, accounts.slice(1));

       // All accounts except facet (accounts[0]), create attributes
       let data = await createAttributes(ethrust, myAccounts);
       //let data = await createAttributes(ethrust, accounts.slice(1));

       for(let i=0; i<accountIndex.length; ++i) {
           console.log(`${myAccounts[i]}  : ${ethrust.accounts[myAccounts[i]]}`);
           console.log(ethrust.accounts[myAccounts[i]]);
       }

       // Start random activities
       await randomActivities(pki, ethrust, accounts);

       await showAllBalances(pki, myAccounts);

     });

    /*
  it("should add an attribute from account[2]", async () => {

    let pki = await PKIToken.deployed();
    let ethrust = await Ethrust.deployed();

    // increase allowance for accounts[0] (facet of PKIToken)
    let accounts = await web3.eth.getAccounts();

    let status = await pki.increaseAllowance(ethrust.address, 100000, {"from": accounts[0]});

    let attrId = await ethrust.createAttribute("IC", "0x1", "000101-04-5876", "testhash1", {"from": accounts[2]});
    //console.log(attrId);

    let balance = await pki.balanceOf(accounts[2]);
    console.log(balance.toString());
    console.log(attrId.logs[0].args['attributeID'].toString());
    assert.equal(attrId.logs[0].args['data'], "000101-04-5876");
  });
  */
/*
  it("Add attribute and sign it", async () => {
      let pki = await PKIToken.deployed();
      let ethrust = await Ethrust.deployed();

      // increase allowance for accounts[0] (facet of PKIToken)
      let accounts = await web3.eth.getAccounts();

      let status = await pki.increaseAllowance(ethrust.address, 100000, {"from": accounts[0]});

      let attrId = await ethrust.createAttribute("IC", "0x1", "000101-04-5876", "testhash1", {"from": accounts[2]});

      attrId = attrId.logs[0].args['attributeID'];
      let expiry = new Date().setFullYear(new Date().getFullYear() + 1)
      let signatureId = await ethrust.signAttribute(attrId, expiry, {"from": accounts[2]});

      signatureId = signatureId.logs[0].args['signatureID'];
      assert.equal(signatureId >= 0, true);
  });
*/
/*
  it("Add attribute, sign it, trusted by another account", async () => {

      const APPROVED_AMOUNT = 50;
      let pki = await PKIToken.deployed();
      let ethrust = await Ethrust.deployed();

      // increase allowance for accounts[0] (facet of PKIToken)
      let accounts = await web3.eth.getAccounts();

      let status = await pki.increaseAllowance(ethrust.address, 100000, {"from": accounts[0]});

      // Increase allowance
      // need to issue from here, cannot be in Ethrust (because caller is always Ethrust if call from Ethrust)
      status = await pki.increaseAllowance(ethrust.address, APPROVED_AMOUNT, {"from": accounts[2]});
      status = await pki.increaseAllowance(ethrust.address, APPROVED_AMOUNT, {"from": accounts[3]});

      let attrId = await ethrust.createAttribute("IC", "0x1", "000101-04-5876", "testhash1", {"from": accounts[2]});

      console.log(attrId.logs[0]);

      attrId = attrId.logs[0].args['attributeID'];
      let expiry = new Date().setFullYear(new Date().getFullYear() + 1)
      let signatureId = await ethrust.signAttribute(attrId, expiry, {"from": accounts[2]});

      // console.log("whole logs[0].args");
      // console.log(signatureId.logs[0].args);
      // console.log("whole logs[0].args[signatureID]");
      //
      // console.log(signatureId.logs[0].args['signatureID']);
      //
      // console.log("signatureID");
      signatureId = signatureId.logs[0].args['signatureID'];

      // Trust from account[3]
      status = await ethrust.trustSignature(signatureId, {"from": accounts[3]});

      console.log(status);
      // Retrust
      //status = await ethrust.trustSignature(signatureId, {"from": accounts[3]});
      console.log(status.logs[0]);


      status = await ethrust.unTrustSignature(signatureId, {"from": accounts[4]});

      console.log("untrust by account[4], balance of accounts[4]");

      let bal = await pki.balanceOf(accounts[4]);
      console.log("Balance of accounts [4]: " + bal.toString());


      console.log(status.logs[0]);

      status = await ethrust.unTrustSignature(signatureId, {"from": accounts[5]});
      console.log("untrust by account[5]");
      bal = await pki.balanceOf(accounts[5]);
      console.log("Balance of accounts [5]: " + bal.toString());



      console.log(status.logs[0]);

      showAllBalances(pki, accounts);


      assert.equal(signatureId >= 0, true);
  });

*/
/*
  it("Start simulations", async () => {

      console.log("random create 50 attributes from different accounts");
      let pki = await PKIToken.deployed();
      let ethrust = await Ethrust.deployed();

      // increase allowance for accounts[0] (facet of PKIToken)
      let accounts = await web3.eth.getAccounts();

      let status = await pki.increaseAllowance(ethrust.address, 100000, {"from": accounts[0]});

      // Increase allowance
      // need to issue from here, cannot be in Ethrust (because caller is always Ethrust if call from Ethrust)
      //status = await pki.increaseAllowance(ethrust.address, APPROVED_AMOUNT, {"from": accounts[2]});
      //status = await pki.increaseAllowance(ethrust.address, APPROVED_AMOUNT, {"from": accounts[3]});

      let result = await createAttributes(ethrust, accounts);

      console.log(result);

  });

*/

  /*
  it("should send coin correctly", async () => {
    // Get initial balances of first and second account.
    let account_one = accounts[0];
    let account_two = accounts[1];

    let amount = 10;

    let instance = await PKIToken.deployed();
    let pki = instance;

    let balance = await pki.getBalance.call(account_one);
    let account_one_starting_balance = balance.toNumber();

    balance = await pki.getBalance.call(account_two);
    let account_two_starting_balance = balance.toNumber();
    await pki.sendCoin(account_two, amount, { from: account_one });

    balance = await pki.getBalance.call(account_one);
    let account_one_ending_balance = balance.toNumber();

    balance = await pki.getBalance.call(account_two);
    let account_two_ending_balance = balance.toNumber();

    assert.equal(
      account_one_ending_balance,
      account_one_starting_balance - amount,
      "Amount wasn't correctly taken from the sender"
    );
    assert.equal(
      account_two_ending_balance,
      account_two_starting_balance + amount,
      "Amount wasn't correctly sent to the receiver"
    );
  });
  */
});
