function fractionToBinary(frac) {
    var bitString = '',
            i = 0;
    
    while(frac > 0 && bitString.length < 24) {// mantissa is of length 24
        if(frac >= Math.pow(2, -(i+1))) {
            frac -= Math.pow(2, -(i+1));
            bitString += '1';
        }
        else {
            bitString += '0';
        }
    
        i++;
    }
    
    return bitString;
}

/**
 * Normalizes a given (string) mantissa so that it has only one leading digit 
 * @param {String} mantissa The mantissa to normalize
 * @throws Exception
 */
function normalizeMantissa(/*string*/mantissa) {
    // TODO: doesnt support fractional values: 0 < value < 1
    var exp = 0,
        originalInput = mantissa;
    
    mantissa = mantissa.split('');
    if(mantissa[0] == '0' || mantissa.indexOf('.') == -1) throw 'Unexpected error in normalizing mantissa on input: ' + originalInput;
    
    while(mantissa[0] == ('1') && mantissa[1] != '.') {
        exp++;
        var indexOfDot = mantissa.indexOf('.');
        mantissa[indexOfDot] = mantissa[indexOfDot-1];
        mantissa[indexOfDot-1] = '.';
    }
    
    return {
        exponent: (exp + 127).toString(2),
        mantissa: ('000000000000000000000000' + (mantissa.join('').substr(2,23))).substr(-23)
    };
}

// http://www.binaryconvert.com/result_float.html
function binaryToFloat(bin) {
    if(typeof bin != 'string') {
        bin = bin + '';
    }
    
    var signBit = +(parseFloat(bin) < 0),
        containsDecimal = (bin.indexOf('.') >= 0),
        numParts = containsDecimal ? bin.split('.') : [bin],
        bitStringToNormalize,
        normalizer;
    
    if(containsDecimal) {
        bitStringToNormalize = parseInt(numParts[0]).toString(2) + '.' + fractionToBinary(parseFloat('.'+numParts[1]));
    }
    else {
        bitStringToNormalize = parseInt(numParts[0]).toString(2) + '.000000000000000000000000';
    }
    
    normalizer = normalizeMantissa(bitStringToNormalize)
    return signBit + normalizer.exponent + normalizer.mantissa;
}

function bitStringToHex(bitstring) {
    var bits = [];
    
    for(var i = 0; i < 4; i++) {
        bits.push(parseInt(bitstring.substr(i*8, 8), 2));
    }
        
    return bits.map(function(n) {
            return '0x'+('00'+n.toString(16)).substr(-2);
    }).reverse();
}

function decToHex(dec) {
    if(dec === -1 || dec === '-1') {
        return ['0xff', '0xff', '0xff', '0xff']; // special case: -1
    }
    
    if(dec === 0 || dec === '0') {
        return ['0x00', '0x00', '0x00', '0x00']; // special case: 0
    }
    
    return bitStringToHex(binaryToFloat(dec));
}

module.exports = decToHex;