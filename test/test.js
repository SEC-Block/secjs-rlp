const test = require('tape')
const rlp = require('../encode')
const fs = require("fs")

//const sec_block_js = require("./sec_blockchain-transaction-model.js")
//const sec_shop_js = require("./sec_shop-transaction-model.js")


test('SEC RLP test', t => {
	t.plan(4)
	var contents = fs.readFileSync("test_json.json")
	var ebook = fs.readFileSync("ebook_genesisBlock.json")
	var sec_block = fs.readFileSync("sec_blockchain-transaction-model.json")
	var sec_shop = fs.readFileSync("sec_shop-transaction-model.json")
	
	contents_rlp_encode = rlp.jsonToRlp(contents)
	contents_json_format = rlp.jsonKeyArray(contents)
	
	ebook_rlp_encode = rlp.jsonToRlp(ebook)
	ebook_json_format = rlp.jsonKeyArray(ebook)
	
	sec_block_rlp_encode = rlp.jsonToRlp(sec_block)
	sec_block_json_format = rlp.jsonKeyArray(sec_block)
	
	sec_shop_rlp_encode = rlp.jsonToRlp(sec_shop)
	sec_shop_json_format = rlp.jsonKeyArray(sec_shop)
	
	//js_sec_block_rlp_encode = rlp.jsonToRlp(sec_block_js)
	//js_sec_block_json_format = rlp.jsonKeyArray(sec_block_js)
	
	//js_sec_shop_rlp_encode = rlp.jsonToRlp(sec_shop_js)
	//js_sec_shop_json_format = rlp.jsonKeyArray(sec_shop_js)
	
	if(0){
		console.log("--------------------------")
		console.log(rlp.decode(ebook_rlp_encode))
		console.log("--------------------------")
		console.log(ebook_json_format)
		console.log("--------------------------")
		console.log(JSON.parse(rlp.rlpToJson(ebook_rlp_encode, ebook_json_format)))
		console.log("--------------------------")
		console.log(JSON.parse(ebook))
		console.log("--------------------------")
	}
	
	if(0){
		console.log("--------------------------")
		console.log(contents_rlp_encode)
		console.log("--------------------------")
		console.log(rlp.decode(contents_rlp_encode))
		console.log("--------------------------")
		console.log(contents_json_format)
		console.log("--------------------------")
	}
	
	t.deepEqual(JSON.parse(rlp.rlpToJson(contents_rlp_encode, contents_json_format)), JSON.parse(contents))
	t.deepEqual(JSON.parse(rlp.rlpToJson(ebook_rlp_encode, ebook_json_format)), JSON.parse(ebook))
	
	t.deepEqual(JSON.parse(rlp.rlpToJson(sec_block_rlp_encode, sec_block_json_format)), JSON.parse(sec_block))
	t.deepEqual(JSON.parse(rlp.rlpToJson(sec_shop_rlp_encode, sec_shop_json_format)), JSON.parse(sec_shop))
	
	//t.deepEqual(JSON.parse(rlp.rlpToJson(js_sec_block_rlp_encode, js_sec_block_json_format)), JSON.parse(sec_block))
	//t.deepEqual(JSON.parse(rlp.rlpToJson(js_sec_shop_rlp_encode, js_sec_shop_json_format)), JSON.parse(sec_shop))
})


function display_longbuffer(buffer){
	var arr = new Array();
	 
	for (var i = 0; i < buffer.length; i++) {
		arr.push(buffer[i].toString(16));
	}
	 
	console.log(arr.join(' '));
}