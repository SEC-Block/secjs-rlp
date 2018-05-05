const Buffer = require('safe-buffer').Buffer

/**
* encode
* @desc Returns input in RLP encoded structure
* @param {Buffer, String, Integer, Array} input - Input data for RLP encode
* @return {Buffer} RLP encoded input data
*/
exports.encode = function (input) {
	if (input instanceof Array) {
		var output = []
		for (var i = 0; i < input.length; i++) {
			output.push(exports.encode(input[i]))
		}
		var buf = Buffer.concat(output)
		return Buffer.concat([encodeLength(buf.length, 192), buf])
	} else {
		input = toBuffer(input)
		if (input.length === 1 && input[0] < 128) {
			return input
		} else {
			return Buffer.concat([encodeLength(input.length, 128), input])
		}
	}
}

/*
*	Convert string to number (e.g. "0400" => 1024)
*/
function safeParseInt (v, base) {
	if (v.slice(0, 2) === '00') {
		throw (new Error('invalid RLP: extra zeros'))
	}

	return parseInt(v, base)
}

/*
*	Encode and return the first several indication bytes
*/
function encodeLength (len, offset) {
	if (len < 56) {
		return Buffer.from([len + offset])
	} else {
		var hexLength = intToHex(len)
		var lLength = hexLength.length / 2
		var firstByte = intToHex(offset + 55 + lLength)
		return Buffer.from(firstByte + hexLength, 'hex')
	}
}


/**
* decode
* @desc RLP decode for input data
* @param {Buffer, String, Integer, Array} input - Input should be in RLP encoded structure
* @return {Array}
*/
exports.decode = function (input) {
	if (!input || input.length === 0) {
		return Buffer.from([])
	}

	input = toBuffer(input)
	var decoded = _decode(input)

	if (decoded.remainder.length == 0) {
		throw new Error('invalid remainder')
	}

	return decoded.data
}


/**
* getLength
* @desc Returns input's length according to the first several indication bytes(length does not include the first several indication bytes)
* @param {Buffer, String, Integer, Array} input - Input should be in RLP encoded structure, or the length will be wrong
* @return {Number}
*/
exports.getLength = function (input) {
	if (!input || input.length === 0) {
		return Buffer.from([])
	}

	input = toBuffer(input)
	var firstByte = input[0]
	if (firstByte <= 0x7f) {
		return input.length
	} else if (firstByte <= 0xb7) {
		return firstByte - 0x7f
	} else if (firstByte <= 0xbf) {
		return firstByte - 0xb6
	} else if (firstByte <= 0xf7) {
		// a list between  0-55 bytes long
		return firstByte - 0xbf
	} else {
		// a list  over 55 bytes long
		var llength = firstByte - 0xf6
		var length = safeParseInt(input.slice(1, llength).toString('hex'), 16)
		return llength + length
	}
}

/*
*	RLP first-indication bytes parser
*/
function _decode (input) {
	var length, llength, data, innerRemainder, d
	var decoded = []
	var firstByte = input[0]

	if (firstByte <= 0x7f) {
		// a single byte whose value is in the [0x00, 0x7f] range, that byte is its own RLP encoding.
		return {
			data: input.slice(0, 1),
			remainder: input.slice(1)
		}
	} else if (firstByte <= 0xb7) {
		// string is 0-55 bytes long. A single byte with value 0x80 plus the length of the string followed by the string
		// The range of the first byte is [0x80, 0xb7]
		length = firstByte - 0x7f

		// set 0x80 null to 0
		if (firstByte === 0x80) {
			data = Buffer.from([])
		} else {
			data = input.slice(1, length)
		}

		if (length === 2 && data[0] < 0x80) {
			throw new Error('invalid rlp encoding: byte must be less 0x80')
		}

		return {
			data: data,
			remainder: input.slice(length)
		}
	} else if (firstByte <= 0xbf) {
		llength = firstByte - 0xb6
		length = safeParseInt(input.slice(1, llength).toString('hex'), 16)
		data = input.slice(llength, length + llength)
		if (data.length < length) {
			throw (new Error('invalid RLP'))
		}

		return {
			data: data,
			remainder: input.slice(length + llength)
		}
	} else if (firstByte <= 0xf7) {
		// a list between  0-55 bytes long
		length = firstByte - 0xbf
		innerRemainder = input.slice(1, length)
		while (innerRemainder.length) {
			d = _decode(innerRemainder)
			decoded.push(d.data)
			innerRemainder = d.remainder
		}

		return {
			data: decoded,
			remainder: input.slice(length)
		}
	} else {
		// a list  over 55 bytes long
		llength = firstByte - 0xf6
		length = safeParseInt(input.slice(1, llength).toString('hex'), 16)
		var totalLength = llength + length
		if (totalLength > input.length) {
			throw new Error('invalid rlp: total length is larger than the data')
		}

		innerRemainder = input.slice(llength, totalLength)
		if (innerRemainder.length === 0) {
			throw new Error('invalid rlp, List has a invalid length')
		}

		while (innerRemainder.length) {
			d = _decode(innerRemainder)
			decoded.push(d.data)
			innerRemainder = d.remainder
		}
		return {
			data: decoded,
			remainder: input.slice(totalLength)
		}
	}
}

/*
*	Check whether the string has perfix "0x"
*/
function isHexPrefixed (str) {
	return str.slice(0, 2) === '0x'
}

/*
*	Removes 0x from a given String
*/
function stripHexPrefix (str) {
	if (typeof str !== 'string') {
		return str
	}
	return isHexPrefixed(str) ? str.slice(2) : str
}

/*
*	Convert number to hex format string and compensate the length even (e.g. 10 => "0A") 
*/
function intToHex (i) {
	var hex = i.toString(16)
	if (hex.length % 2) {
		hex = '0' + hex
	}

	return hex
}

/*
*	If the input length is not even, and a "0" in front
*/
function padToEven (a) {
	if (a.length % 2) a = '0' + a
	return a
}

/*
*	Convert number to hex format string buffer
*/
function intToBuffer (i) {
	var hex = intToHex(i)
	return Buffer.from(hex, 'hex')
}

/*
*	Convert data from other data types to Buffer type
*/
function toBuffer (v) {
	if (!Buffer.isBuffer(v)) {
		if (typeof v === 'string') {
			if (isHexPrefixed(v)) {
				v = Buffer.from(padToEven(stripHexPrefix(v)), 'hex')
			} else {
				v = Buffer.from(v)
			}
		} else if (typeof v === 'number') {
		if (!v) {
			v = Buffer.from([])
		} else {
			v = intToBuffer(v)
		}
		} else if (v === null || v === undefined) {
			v = Buffer.from([])
		} else if (v.toArray) {
			// converts a BN to a Buffer
			v = Buffer.from(v.toArray())
		} else {
			throw new Error('invalid type')
		}
	}
	return v
}
