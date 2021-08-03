/*
This is an basic chaincode for an Bank Account, which implements basic functions like.
-- Create Assets. -- Invoke Assets. -- addMoneyToAccount. -- removeMoneyFromAccount. -- TransferMoney. --ConfirmRemove. --GetHistoryForAsset
--I did implement an ReadAfterWrite Vulnerbility --> Maybe you can find it.

--If you Need an other function--> Just Ask!

How to Deploy:
./network.sh up createChannel -ca

//Remove the Application Folder.
./network.sh deployCC -ccn basic -ccp ../bank-account/ -ccl javascript

run from Application Folder:
node app.js

*/
'use strict';

const { Contract } = require('fabric-contract-api');

class AssetTransfer extends Contract {

    async InitLedger(ctx) {
        const assets = [
            {
                //Should use a random generated number
                ID: 'creditcard1',
                Limit: -2000,
                Type: 'regular',
                Interest: 0.05,
                Owner: 'Robert Betschinger',
                Balance: 300,
            },
            {
                ID: 'creditcard2',
                Limit: -1000,
                Type: 'student',
                Interest: 0.03,
                Owner: 'Brad Gerald',
                Balance: 400,
            }
        ];

        for (const asset of assets) {
            asset.docType = 'asset';
            await ctx.stub.putState(asset.ID, Buffer.from(JSON.stringify(asset)));
            console.info(`Asset ${asset.ID} initialized`);
        }
    }



    // CreateAsset issues a new asset to the world state with given details.
    async CreateAsset(ctx, id, limit, type, owner, balance) {
        const exists = await this.AssetExists(ctx, id);
        if (exists) {
            throw new Error(`The asset ${id} already exists`);
        }
        const asset = {
            ID: id,
            Limit: limit,
            Type: type,
            Owner: owner,
            Balance: balance,
        };
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
        return JSON.stringify(asset);
    }




    async addToAccount(ctx,id,amount){
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The Bank-Account ${id} does not exist`);
        }

    const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
    var assetAsJson = JSON.parse(assetJSON);
    var oldValue =  parseInt(assetAsJson['Balance'])
    var newvalue = parseInt(oldValue + parseInt(amount));
        newvalue = parseInt(newvalue)
    
    // overwriting original asset with new asset
    const updatedAsset = {
        ID: id,
        Limit: assetAsJson['Limit'],
        Type: assetAsJson['Type'],
        Owner: assetAsJson['Owner'],
        Balance: newvalue,
    };
    return ctx.stub.putState(id, Buffer.from(JSON.stringify(updatedAsset)));
    }


   
    async removeFromAccount(ctx,id,amount){
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The Bank-Account ${id} does not exist`);
        }

    const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
    var assetAsJson = JSON.parse(assetJSON);
    var oldValue =  assetAsJson['Balance']

    var newvalue = parseInt(oldValue - amount);

    // overwriting original asset with new asset
    const updatedAsset = {
        ID: id,
        Limit: assetAsJson['Limit'],
        Type: assetAsJson['Type'],
        Owner: assetAsJson['Owner'],
        Balance: newvalue,
    };
    return ctx.stub.putState(id, Buffer.from(JSON.stringify(updatedAsset)));
    }


    //Transfer Money from One Account to another.
    async TransferMoney(ctx,sendingid,receivingid,amount){

        const existreceiver = await this.AssetExists(ctx, receivingid);
        if (!existreceiver) {
            throw new Error(`The Receiving Bank Account ${id} does not exist`);
        }
        const existsender = await this.AssetExists(ctx, sendingid);
        if (!existsender) {
            throw new Error(`The Sender Bank Account ${id} does not exist`);
        }

       let resultRemoveMoney = await this.removeFromAccount(ctx,sendingid,amount)
    
       let resultAddMoney = await this.addToAccount(ctx,receivingid,amount)
        //basiclly allows an DoubleSpending Attack
       let confirmRemove = await this.confirmRemove(ctx,sendingid,amount)
       return(JSON.stringify(resultRemoveMoney + '_______' + resultAddMoney + '________' + confirmRemove))
    }



    async confirmRemove(ctx,id,amount){
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The Bank-Account ${id} does not exist`);
        }
    const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
    var assetAsJson = JSON.parse(assetJSON);

    var oldValue =  parseInt(assetAsJson['Balance'])
   
    var newvalue = parseInt(oldValue + parseInt(amount));
    newvalue = parseInt(newvalue)
    //Never will be True
     if(newvalue === oldValue - parseInt(amount)){
        return 'Succesfully Removed the Amount from the Account'
     }
     //Otherwise overwrite again!!!
    // overwriting original asset with new asset
    const updatedAsset = {
        ID: id,
        Limit: assetAsJson['Limit'],
        Type: assetAsJson['Type'],
        Owner: assetAsJson['Owner'],
        Balance: newvalue,
    };
    return ctx.stub.putState(id, Buffer.from(JSON.stringify(updatedAsset)));
    }
    


  // ReadAsset returns the asset stored in the world state with given id.
  async ReadAsset(ctx, id) {
    const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
    if (!assetJSON || assetJSON.length === 0) {
        throw new Error(`The asset ${id} does not exist`);
    }
    return assetJSON.toString();
}


    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async UpdateAsset(ctx, id, limit, type, owner, amount) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }

        // overwriting original asset with new asset
        const updatedAsset = {
            ID: id,
            Limit: limit,
            Type: type,
            Owner: owner,
            Balance: amount,
        };
        return ctx.stub.putState(id, Buffer.from(JSON.stringify(updatedAsset)));
    }


  
    // DeleteAsset deletes an given asset from the world state.
    async DeleteAsset(ctx, id) {
        const exists = await this.AssetExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }




    // AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }

    
    // TransferAsset updates the owner field of asset with given id in the world state.
    async TransferAsset(ctx, id, newOwner) {
        const assetString = await this.ReadAsset(ctx, id);
        const asset = JSON.parse(assetString);
        asset.Owner = newOwner;
        return ctx.stub.putState(id, Buffer.from(JSON.stringify(asset)));
    }



    // GetAllAssets returns all assets found in the world state.
    async GetAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: result.value.key, Record: record });
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }


    //Needed for GetHistory Function
    // This is JavaScript so without Funcation Decorators, all functions are assumed
	// to be transaction functions
	//
	// For internal functions... prefix them with _
	async _GetAllResults(iterator, isHistory) {
		let allResults = [];
		let res = await iterator.next();
		while (!res.done) {
			if (res.value && res.value.value.toString()) {
				let jsonRes = {};
				console.log(res.value.value.toString('utf8'));
				if (isHistory && isHistory === true) {
					jsonRes.TxId = res.value.txId;
					jsonRes.Timestamp = res.value.timestamp;
					try {
						jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
					} catch (err) {
						console.log(err);
						jsonRes.Value = res.value.value.toString('utf8');
					}
				} else {
					jsonRes.Key = res.value.key;
					try {
						jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
					} catch (err) {
						console.log(err);
						jsonRes.Record = res.value.value.toString('utf8');
					}
				}
				allResults.push(jsonRes);
			}
			res = await iterator.next();
		}
		iterator.close();
		return allResults;
	}


    // GetAssetHistory returns the chain of custody for an asset since issuance.
	async GetAssetHistory(ctx, assetName) {

		let resultsIterator = await ctx.stub.getHistoryForKey(assetName);
		let results = await this._GetAllResults(resultsIterator, true);

		return JSON.stringify(results);
	}
}

module.exports = AssetTransfer;