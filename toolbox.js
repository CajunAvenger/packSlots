/* Toolbox
 Various utility scripts.
*/

function arrayDuplicates(array1, array2) {						//returns array of duplicate elements between two arrays
	let shortArray = [];
	let longArray = [];
	let dupeArray = [];
	if(array1.length > array2.length) {
		shortArray = array2;
		longArray = array1;		
	}else{
		shortArray = array1;
		longArray = array2;	
	}
	for(let value in shortArray) {
		if(longArray.includes(shortArray[value]))
			dupeArray.push(shortArray[value]);
	}
	return dupeArray;
}
function rand(low, high) { 										//rand(x) or rand(x,y) gets a random number from 0-x or random number from x-y
	if(high == undefined)
		high = 0;
	let dif = Math.abs(low-high)+1;
	let rand = Math.floor(Math.random()*dif);
	rand += Math.min(low, high);
	return rand;
}
function shuffleArray(array) { 									//shuffles arrays
    let counter = array.length;
    while (counter > 0) { 								// While there are elements in the array
        let index = Math.floor(Math.random() * counter);// Pick a random index
		counter--;										// Decrease counter by 1
        let temp = array[counter]; 						// And swap the last element with it
        array[counter] = array[index];
        array[index] = temp;
    }
    return array;
}
function timeSince(startTime) { 								//get milliseconds from now to given time, negative values are future
	let checkTime = new Date().getTime();
	return checkTime - startTime;
}
function toTitleCase(str) { 									//changes string To Title Case
	return str.replace(
			/\w\S*/g,
			function(txt) {
				return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
			}
	);
}
function globalCapture(regString, matchString, caseSense) { 	//returns array of capture group regexes of a global regex check, functionally allowing capture groups on a global regex
	let flags = "";
	if(!caseSense)
		flags += "i";
	let globalRegex = new RegExp(regString, 'g'+flags);
	let captureRegex = new RegExp(regString, flags);
	let finalArrays = [];
	
	let globalMatches = matchString.match(globalRegex);
	if(globalMatches) {
		for(let m in globalMatches) {
			let localMatches = globalMatches[m].match(captureRegex);
			if(localMatches) {
				finalArrays.push(localMatches);
			}
		}
	}
	return finalArrays;
}


//playing with numbers
function convertNumbers (number) { 								//converts numbers +-999,999,999,999 to number words
	let digiArray = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
	let magArray = ['ten','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
	let decArray = ['hundred','thousand','million','billion']//,'trillion','quadrillion','quintillion','sextillion','septillion','octillion','nonillion'];
	//really struggles with trillion and beyond
	if(typeof number == 'number') {
		let output = "";
		if(number < 0)
			output += "negative "
		if(number < 100)
			return output + convert99(number)
		let dec = Math.trunc((String(number).length-1)/3); // <1000 -> 0, <million -> 1, <billion -> 2...
		let result = decArray[dec];
		if(result == 'hundred') 
			return output + convert100(number);
		while(number > 0) {
			let numString = String(number);
			let numLead = "";
			let leadVal = numString.length%3;
			if(leadVal == 0)
				leadVal = 3;
			for(i=0;i<leadVal;i++)
				numLead += numString.charAt(i);
			let leadNumbers = parseInt(numLead);
			if(result == "hundred" && leadNumbers < 100) {
				output = output.replace(/, $/, "") + " and " + convert99(leadNumbers)
			}else if(result == "hundred") {
				output += convert100(leadNumbers);
			}else{
				output += convert100(leadNumbers) + " " + result + ", ";
			}
			let thousands = numString.length - leadVal;
			let multi = parseInt(fillLength("1", thousands+1, null, "0"))
			number -= leadNumbers*multi;
			dec = Math.trunc((String(number).length-1)/3);
			result = decArray[dec];
		}
		//output = output.replace(/, $/,"");
		return output;
	}
	else if(typeof number == 'string') {
		let numArray = [ 'zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety','hundred','thousand','million','billion'];
		let valArray = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,30,40,50,60,70,80,90,100,1000,1000000,1000000000];//,1000000000000,1000000000000000,1000000000000000000,1000000000000000000000,1000000000000000000000000,1000000000000000000000000000,1000000000000000000000000000000,1000000000000000000000000000000000];
		let finalResult = 0;
		let onesString = "(one|two|three|four|five|six|seven|eight|nine)";
		let tensString = "(ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)";
		let decString = "(thousand|million|billion)";
		let tensReg = '('+tensString+')-?('+onesString+')?';
		let hundReg = onesString+' hundred ?a?n?d? ?('+tensString+'?(-?'+onesString+')?)?';
		let decReg = '('+tensString+'?-?'+onesString+'? ?(hundred)?( and )?('+tensString+'?(-?'+onesString+')?)?)? '+decString;
		let numRegString = '('+decReg+'|'+hundReg+'|'+tensReg+'|'+onesString+')';
		let bigRegEx = new RegExp(numRegString, 'g');
		let lilRegEx = new RegExp(numRegString, 'i');
		let numPuller = number.match(bigRegEx);
		if(hasValue(numPuller)) {
			for(let i=0; i<numPuller.length; i++) {
				if(numPuller[i] != undefined) {
					let numMatch = numPuller[i].match(lilRegEx);
					if(numMatch[1] != undefined) {
						let decRegEx = new RegExp(decReg,'i'); //1:100X, 10: X
						let hundRegEx = new RegExp(hundReg, 'i'); //1: 100, 3: 10, 5: 1
						let tensRegEx = new RegExp(tensReg, 'i'); //1: 10, 2: 1
						let onesRegEx = new RegExp(onesString, 'i'); //1: 1
						
						let decMatch = numMatch[1].match(decRegEx);
						let hundMatch = numMatch[1].match(hundRegEx);
						let tensMatch = numMatch[1].match(tensRegEx);
						let onesMatch = numMatch[1].match(onesRegEx);
						if(hasValue(decMatch)) {
							let tempValue = valArray[numArray.indexOf(decMatch[10])];
							if(decMatch[1] != undefined) {
								let decHundMatch = decMatch[1].match(hundRegEx);
								if(decHundMatch != undefined) {
									tempValue *= score100(decHundMatch);
								}else{
									tempValue *= valArray[numArray.indexOf(decMatch[1])];
								}
							}
							finalResult += tempValue;
						}else if(hasValue(hundMatch)) {
							finalResult += score100(hundMatch);
						}else if(hasValue(tensMatch)) {
							finalResult += valArray[numArray.indexOf(tensMatch[1])];
							if(tensMatch[3] != undefined)
								finalResult += valArray[numArray.indexOf(tensMatch[3])];
						}else if(hasValue(onesMatch)) {
							finalResult += valArray[numArray.indexOf(onesMatch[1])];
						}
					}
				}
			}
		}else{
			return NaN;
		}
		if(number.match(/^negative/))
			finalResult *= -1;
		return finalResult;
	}
}
function score100(numberline) {									//turn a "X hundred and Yty-Z" line into a number
	//numberline[1] is hundreds
	//numberline[3] is tens
	//numberline[5] is ones
	let numArray = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety','hundred','thousand','million','billion'];
	let valArray = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,30,40,50,60,70,80,90,100,1000,1000000,1000000000];//,1000000000000,1000000000000000,1000000000000000000,1000000000000000000000,1000000000000000000000000,1000000000000000000000000000,1000000000000000000000000000000,1000000000000000000000000000000000];
	let result = 0;
	if(hasValue(numberline[1]))
		result += 100*valArray[numArray.indexOf(numberline[1])];
	if(hasValue(numberline[3]))
		result += valArray[numArray.indexOf(numberline[3])];
	if(hasValue(numberline[5]))
		result += valArray[numArray.indexOf(numberline[5])];
	return result;
}
function convert100 (number) {									//turn 100 to 999 into words
	if(number < 100)
		return convert99(number);
	let digiArray = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
	let magn = Math.trunc(number/100);
	let remain = number-100*magn;
	let result = digiArray[magn] + " hundred and " + convert99(remain);
	result = result.replace(" and zero","");
	return result
}
function convert99 (number) { 									//turn 0 to 99 into words
	let digiArray = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
	let magArray = ['one','ten','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
	if(number < 20)
		return digiArray[number];
	let mag = Math.trunc(number / 10)
	let digi = number%10
	let result = magArray[mag];
	if(digi > 0)
		result += "-" + digiArray[digi]
	return result;
}
function digiDecimal(digitString){ 								//convert string 0-) to number 0-72
	let _0zArray = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","!","@","#","$","%","^","&","*","(",")"]
	return _0zArray.indexOf(digitString);
}
function digiAlpha(digitString){ 								//convert number 0-36 to string 0-) [0-9, a-z, A-Z, !-)]
	let _0zArray = ["0","1","2","3","4","5","6","7","8","9","a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","!","@","#","$","%","^","&","*","(",")"]
	return _0zArray[digitString];
}
function convertDecimal(digit, currentBase) { 					//convert from any base to base 10
	if(currentBase == 10)
		return digit;
	let equiv = 0;
	let digitString = String(digit);
	for(let i = digitString.length-1; i>=0; i--) {
		let pow = digitString.length - i - 1;
		equiv += digiDecimal(digitString[i]) * Math.pow(currentBase, pow)
	}
	return equiv;
}
function convertBases(digit, currentBase, newBase){ 			//converts from any base (1-36) to any other base
	currentBase = Math.trunc(Math.min(72, Math.max(1,currentBase)));
	newBase = Math.trunc(Math.min(72, Math.max(1,newBase)));
	let negFlag = false;
	if(typeof digit == 'number' && digit < 0) {
		digit *= -1;
		negFlag = true;
	}
	let equiv = convertDecimal(digit, currentBase);
	if(newBase == 1) {
		equiv = parseInt(Array(equiv).fill(1).join(""));
	}
	else if(newBase != 10) {
		let digitString = String(digit);
		let equivString = "";
		while(equiv > 0) {
			let rem = equiv % newBase;
			let res = (equiv / newBase) - (rem/newBase);
			equivString = digiAlpha(rem) + equivString;
			equiv = res;
		}
		equiv = equivString;
		if(newBase < 10)
			equiv = parseInt(equiv);
	}
	if(negFlag)
		equiv *= -1;
	return equiv;
}

exports.arrayDuplicates = arrayDuplicates;
exports.globalCapture = globalCapture;
exports.rand = rand;
exports.shuffleArray = shuffleArray;
exports.timeSince = timeSince;
exports.toTitleCase = toTitleCase;
exports.convertNumbers = convertNumbers;