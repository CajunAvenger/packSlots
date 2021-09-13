const packgen = require('./packgen.js');
const fuzzy = require('./fuzzy.js');
const toolbox = require('./toolbox.js');

function generalCollater (library, set_code, count, user, style){	//print out pre-generated packs for Planesculptors
	let packs = [];
	let output = "";
	let rolling = 0;
	let thisSetData = library.setData[set_code];
	if(!style)
		style == "sheet";
	style = style.toLowerCase();
	/*
	There are three sheet styles, Random, Sheet, and Modified
	Sheet and Modified ensure a common* of each color is in each pack
	*greatest common slot, so applies to eg an all rare pack
	Random has no additional collation and just randomly picks for each slot
	
	Sheet generates an equal number of each card per rarity
	then slots them into packs so no cards are under- or over- represented in the set
	For PS you generate 1000 and so there's still some variability per draft

	Modified calculates an approximate number of non-monocolor slots to balance
	Example would be guaranteed White, Blue, Black, Red, and Green slots,
	then a slot that has a 70% chance to be colorless or multicolor.
	This counteracts colorless and multicolor cards being much less common
	as a result of the guaranteed color cards.
	This is based on the counts within the sets rather than a static number.
	*/	
	if(style != "random") {	//add common of each color
		let slotInfo = {};	//object of the different slots and their indexes
		let gcs;			//greatest common slot
		//make object to check most common slot
		for(let i = thisSetData.packSlots.length-1; i>=0; i--) {
			let name = packgen.stringifyPackSlot(thisSetData.packSlots[i]);
			if(!slotInfo[name])
				slotInfo[name] = [];
			slotInfo[name].push(i);
			gcs = name;
		}
		for(let s in slotInfo) {
			if(slotInfo[s].length > slotInfo[gcs]) {
				gcs = s;
			}else{
				if(slotInfo[s].length == slotInfo[gcs] && thisSetData.packSlots[slotInfo[s][0]].filters[0].match(/r=c/)) {//if equal, prefer the common
					gcs = s;
				}
			}
		}
		let gcfilter = thisSetData.packSlots[slotInfo[gcs][0]].filters[0];
		if(style == "modified") {
			//check rarity of most common card
			let gcr = "common";
			let gcrcheck = gcfilter.match(/r=([curmsbl])/i);
			if(gcrcheck) {
				let rarNames = {
					"c": "common",
					"u": "uncommon",
					"r": "rare",
					"m": "mythic rare",
					"s": "special",
					"b": "bonus",
					"l": "basic land"
				}
				gcr = rarNames[gcrcheck[1].toLowerCase()];
			}else{
				let r1 = determineRarityInSet(set_code, library);
				for(let r in r1) {
					if(r1[r] > r1[gcr])
						gcr = r;
				}
			}
			
			let ratio = correctCXRatio(library, gcr);//ratio for making non-mono colors more common to offset making monos more common
			let addCounter = 5+Math.ceil(ratio);		//how many guaranteed slots added
			if(slotInfo[gcs].length >= addCounter) {
				let cArray = ["c=w", "c=u", "c=b", "c=r", "c=g", "-c=1"];
				let cnArray = ["White", "Blue", "Black", "Red", "Green"];
				for(let i = 0; i<addCounter; i++) {
					if(i < cnArray.length) { //add colors
						thisSetData.packSlots[i+slotInfo[gcs].length-addCounter].conditionalScript = {
							filters: [`${JSON.parse(JSON.stringify(cArray[i]))} `+gcfilter, gcfilter],
							chances: [1, 1],
							condition: function(pack, library) {
								return !doesPackContain(pack, library, function(card) {return card.color == `{${JSON.parse(JSON.stringify(cnArray[i]))} `})
							}
						}
					}
					else{ //add non-color
						thisSetData.packSlots[i+slotInfo[gcs].length-addCounter].conditionalScript = {
							filters: [`${cArray[5]} `+gcfilter, gcfilter],
							chances: [Math.min(ratio, 1), 1],
							condition: function(pack, library) {
								return true;
							}
						}
						ratio--;
					}
				}
			}
		}
		else{ //herzi sheet method
			//determine average number of times cards of each rarity should appear
			let r1 = determineRarityInSet(set_code, library);
			let r2 = determineRarityAverages(library.setData[set_code].packSlots);
			let r = {};
			for(let r3 in r1)
				r[r3] = Math.floor(count * r2[r3] / r1[r3]);
			let counts = {};
			for(let card in library.cards) {
				if(library.cards[card].setID == set_code) {
					counts[card] = r[library.cards[card].rarity]
				}
			}
			/* r object looks something like this
			{
				someCommon_SET: 99,
				someUncommon_SET: 38,
				someRare_SET: 18,
				someMythic_SET: 9
			}
			*/
			let cArray = ["c=w", "c=u", "c=b", "c=r", "c=g"];
			let gciArray = slotInfo[gcs].reverse();
			for(let s in cArray) {
				let thisSlot = thisSetData.packSlots[gciArray[s]];
				thisSlot.filters.push(""+thisSlot.filters[0]); //add "" so its not a reference
				thisSlot.chances.push(1.0)
				thisSlot.filters[0] += " " + cArray[s];
			}
			//make a blank array for each pack we're generating
			for(let i=0; i<count; i++)
				packs.push([]);
			let i = 0;
			let filterArrays = {};
			
			//for each slot, get a random card for it and put it into the packs
			//guaranteed slots are first so we avoid an issue of running out of colors early
			for(let slot in thisSetData.packSlots) {
				let thisSlot = thisSetData.packSlots[slot];
				for(let p in packs) {
					//slightly modified draftDexScripts.generatePack() to use r instead of new filters each time
					let thisPack = packs[p];
					let prob = 0; //counts up probabilities
					let rando = Math.random(); //probability roll for this slot
					let foilFlag = false;
					let skip = false;
					let replaceFail = true;
					let hasntRemoved = true;
					let filtersToRun = thisSlot;
					if(thisSlot.hasOwnProperty("conditionalScript") && thisSlot.conditionalScript.condition(thisPack, library)) {
						filtersToRun = thisSlot.conditionalScript;
					}
					for(let filter in filtersToRun.filters) {
						if(!skip) {
							let thisFilter = filtersToRun.filters[filter];
							if(filtersToRun.hasOwnProperty("replace")) { //replace check
								if(gciArray.includes(parseInt(filtersToRun.replace)) && gciArray.indexOf(parseInt(filtersToRun.replace)) < 5) { //if this wants to replace a slot we've force rolled
									filtersToRun.replace = gciArray[cArray.length]; //move it to the first one we didn't use
								}
								let rand2 = Math.random();
								if(replaceFail && rand2 > filtersToRun.replaceChance) {
									skip = true;
									continue; //failed the replaceChance
								}else{
									replaceFail = false;
									if(filtersToRun.hasOwnProperty("foil") && filtersToRun.foil)
										foilFlag = true;
								}
							}
							if(!thisFilter.match(/e:/))
								thisFilter += " e:" + set_code //add set filter if it doesn't have a filter
							if(!filterArrays.hasOwnProperty(thisFilter) || filterArrays[thisFilter].length == 0) {//add new filters to the object
								filterArrays[thisFilter] = JSON.parse(JSON.stringify(toolbox.shuffleArray(fuzzy.scryDatabase(library, thisFilter)[0])));
							}
							if(thisSlot.hasOwnProperty('chanceFunction') && thisSlot.chanceFunction != "else") {
								rando = Math.random() //roll each time for and and independent
								prob = filtersToRun.chances[filter];
							}else{ //add up each chance
								prob += filtersToRun.chances[filter];
							}
							if(rando <= prob) { //successful roll
								if(filterArrays[thisFilter].length == 0) { 
									//yeet("burnout")
									continue; //if nothing matches, skip, may be a secondary filter
								}
								//remove the replaced cards
								if(filtersToRun.hasOwnProperty("replace") && hasntRemoved) {
									if(typeof filtersToRun.replace == "number") {
										counts[unFoil(thisPack[filtersToRun.replace])]++; //put that card back
										thisPack.splice(filtersToRun.replace, 1) //replace the other card
									}else if(filtersToRun.replace == "all"){ //replace all the cards
										thisPack = [];
									}
									hasntRemoved = false;
								}
								//add the card
								let noRepeat = true, loops = 0, foil_name;
								while(noRepeat) {
									foil_name = filterArrays[thisFilter][i%filterArrays[thisFilter].length];
									//if(foil_name == undefined)
									//	yeet(filterArrays[thisFilter])
									if(foilFlag)
										foil_name = makeFoil(foil_name);
									noRepeat = thisPack.includes(foil_name);
									
									if(counts[unFoil(foil_name)] == 1) {
										for(let c in filterArrays[thisFilter]) {
											if(counts[filterArrays[thisFilter][c]] > 1 && !thisPack.includes(filterArrays[thisFilter][c])) {
												foil_name = filterArrays[thisFilter][c];
												if(foilFlag)
													foil_name = makeFoil(foil_name);
												noRepeat = false;
												break;
											}
										}
									}
									else if(counts[unFoil(foil_name)] < 1) {
										filterArrays[thisFilter].splice(filterArrays[thisFilter].indexOf(unFoil(foil_name)), 1);
										if(filterArrays[thisFilter].length == 0) {//add new filters to the object
											filterArrays[thisFilter] = JSON.parse(JSON.stringify(toolbox.shuffleArray(fuzzy.scryDatabase(library, thisFilter)[0])));
										}
									}
									
									i++;
									loops++;
									if(loops > 20)
										noRepeat = false;
								}
								//if(foil_name == undefined)
								//	yeet("brr")
								thisPack.push(foil_name);
								counts[unFoil(foil_name)]--;
								if(counts[unFoil(foil_name)] < 1) {
									filterArrays[thisFilter].splice(filterArrays[thisFilter].indexOf(unFoil(foil_name)), 1);
									if(filterArrays[thisFilter].length == 0) {//add new filters to the object
										filterArrays[thisFilter] = JSON.parse(JSON.stringify(toolbox.shuffleArray(fuzzy.scryDatabase(library, thisFilter)[0])));
									}
								}
								if(!filtersToRun.hasOwnProperty('chanceFunction') || filtersToRun.chanceFunction != "and")
									skip = true; //move to next slot
							}
						}
					}
				}
			}
		}
	}
	let packCount = 15;
	for(let i=0; i<count; i++) {
		if(style == "sheet") {
			if(packs[i].length < packCount) { //sheet has generated packs already
				packCount = packs[i].length;
			}
		}else{ //random and modified generate theirs independent of each other
			let thisPack = draftDexScripts.generatePack(set_code, library);
			if(thisPack.length < packCount)
				packCount = thisPack.length;
			packs.push(thisPack);
		}
	}
	
	//write the file for Planesculptors
	for(let thisPack in packs) {
		packs[thisPack] = psPackSorter(packs[thisPack], library);
		for(let i=0; i<packCount;i++) {
			if(!packs[thisPack][i]) {
				/*console.log(thisPack)
				console.log(packs[thisPack])*/
			}
			else if(isFoil(packs[thisPack][i])) {
				//output += "FOIL "
			}
			output += library.cards[unFoil(packs[thisPack][i])].cardName + "\n";
		}
		output += "===========\n";
	}
	fs.writeFile(`packs_${user.id}.txt`, output.replace(/\n$/, ""), function(err){
		if(err) throw err;
		user.send({
			content: "Collated packs for Planesculptors:", 
			files: [{attachment:`packs_${user.id}.txt`, name:"packs.txt"}]
		})
	})
}
function generatePack(set, library, extraFilter) {					//generates a pack given a set code
	var newPack = [];
	let packSlots = library.setData[set].packSlots;
	let filterArrays = {}; //save these so we don't have to keep rolling them
	//TODO, a number parameter so multiple packs are more efficient?
	//and maybe something to the sheet system too so its DRYer
	let i = 0;
	for(let slot in packSlots) {
		let prob = 0; //counts up probabilities
		let rando = Math.random(); //probability roll for this slot
		let foilFlag = false;
		let skip = false;
		let replaceFail = true;
		let hasntRemoved = true;
		let filtersToRun = packSlots[slot]
		if(packSlots[slot].hasOwnProperty("conditionalScript") && packSlots[slot].conditionalScript.condition(newPack, library)) {
			filtersToRun = packSlots[slot].conditionalScript;
		}
		for(let filter in filtersToRun.filters) {
			if(!skip) {
				let thisFilter = filtersToRun.filters[filter];
				if(filtersToRun.hasOwnProperty("replace")) { //replace check
					let rand2 = Math.random();
					if(replaceFail && rand2 > filtersToRun.replaceChance) {
						skip = true;
						continue; //failed the replaceChance
					}else{
						replaceFail = false;
						if(filtersToRun.hasOwnProperty("foil") && filtersToRun.foil)
							foilFlag = true;
					}
				}
				if(!thisFilter.match(/e:/))
					thisFilter += " e:" + set //add set filter if it doesn't have a filter
				if(extraFilter)
					thisFilter += extraFilter; //apply any additional filters called
				if(!filterArrays.hasOwnProperty(thisFilter)) //add new filters to the object
					filterArrays[thisFilter] = toolbox.shuffleArray(fuzzy.scryDatabase(library, thisFilter)[0]);
				if(packSlots[slot].hasOwnProperty('chanceFunction') && packSlots[slot].chanceFunction != "else") {
					rando = Math.random() //roll each time for 'and' and 'independent'
					prob = filtersToRun.chances[filter];
				}else{ //add up each chance
					prob += filtersToRun.chances[filter];
				}
				if(rando <= prob) { //successful roll
					if(filterArrays[thisFilter].length == 0) 
						continue; //if nothing matches, skip, may be a secondary filter
					//remove the replaced cards
					if(filtersToRun.hasOwnProperty("replace") && hasntRemoved) {
						if(typeof filtersToRun.replace == "number") {
							newPack.splice(filtersToRun.replace, 1) //replace the other card
						}
						else if(filtersToRun.replace == "all") { //replace all the cards
							newPack = [];
						}
						hasntRemoved = false;
					}
					//add the card
					let noRepeat = true, loops = 0, foil_name;
					while(noRepeat) { //double check we don't have repeats
						foil_name = filterArrays[thisFilter][i%filterArrays[thisFilter].length];
						if(foilFlag)
							foil_name = makeFoil(foil_name);
						noRepeat = newPack.includes(foil_name);
						i++;
						loops++;
						if(loops > 20)
							noRepeat = false;
					}
					newPack.push(foil_name);
					if(!filtersToRun.hasOwnProperty('chanceFunction') || filtersToRun.chanceFunction != "and")
						skip = true; //move to next slot
				}
			}
		}
	}
	return newPack;
}

function doesPackContain(packArray, library, cb) {					//check if any card in the pack matches the cb function
	for(let c in packArray) {
		let name = unFoil(packArray[c]);
		let card = library.cards[name];
		let bool = cb(card);
		if(bool) {
			return true;
		}
	}
	return false;
}
function correctCXRatio(library, rarity) {
	/*
		When adding a card of each color, the ratio of non-mono / mono cards gets screwed up
		add the original ratio of non-mono slots to put it back on balance
	*/
	let colors = ["{White} ","{Blue} ","{Black} ","{Red} ","{Green} "];
	let Xc = 0;
	let Sc = 0;
	for(let card in library.cards) {
		let thisCard = library.cards[card];
		if(thisCard.rarity == rarity) {
			if(!colors.includes(thisCard.color))
				Xc++;
			Sc++;
		}
	}
	if(Xc == Sc)
		return 0;
	let corr = Xc/((Sc-Xc)/5);
	return corr;
}
function determineRarityInSet(set_code, library) {					//number of cards of each rarity in a set
	let rarities = {
		"basic land": 0,
		"common": 0,
		"uncommon": 0,
		"rare": 0,
		"mythic rare": 0,
		"bonus": 0,
		"special": 0,
		"masterpiece": 0
	}
	for(let card in library.cards) {
		if(library.cards[card].setID == set_code)
			rarities[library.cards[card].rarity]++;
	}
	return rarities;
}
function determineRarityAverages(slots) {							//average cards of each rarity in a pack
	let rarities = {
		"basic land": 0,
		"common": 0,
		"uncommon": 0,
		"rare": 0,
		"mythic rare": 0,
		"bonus": 0,
		"special": 0,
		"masterpiece": 0
	}
	let slotInfo = {};
	/*
	{
		"r=c": {
			1.0: 9,
			0.625: 1
		}
	}
	*/
	for(let s in slots) {
		let thisSlot = slots[s];
		for(let f in thisSlot.filters) {
			let thisFilter = thisSlot.filters[f];
			let thisChance = thisSlot.chances[f];
			if(thisSlot.hasOwnProperty('replace'))
				thisChance *= thisSlot.replaceChance;
			if(!slotInfo[thisFilter])
				slotInfo[thisFilter] = {}
			if(!slotInfo[thisFilter][thisChance])
				slotInfo[thisFilter][thisChance] = 0;
			slotInfo[thisFilter][thisChance]++;
		}
		if(thisSlot.hasOwnProperty('replace')) {
			let replaceSlot = slots[thisSlot.replace];
			for(let f in replaceSlot.filters) {
				let thisFilter = replaceSlot.filters[f];
				let thisChance = -1*thisSlot.replaceChance;
				if(!slotInfo[thisFilter])
					slotInfo[thisFilter] = {}
				if(!slotInfo[thisFilter][thisChance])
					slotInfo[thisFilter][thisChance] = 0;
				slotInfo[thisFilter][thisChance]++;
			}
		}
	}
	for(let thisFilter in slotInfo) {
		let thisSlot = slotInfo[thisFilter];
		let rs = [];
		let rcheck = thisFilter.match(/\br([<>=]*)([curmbs])/i) //check for rare filter
		if(!rcheck) {
			rs = ["common", "uncommon", "rare", "mythic rare", "bonus", "special"]
		}
		else{
			let e = (rcheck[1] == "=" || rcheck[1] == ">=" || rcheck[1] == "=>" || rcheck[1] == "<=" || rcheck[1] == "=<");
			let g = (rcheck[1] == ">");
			let l = (rcheck[1] == "<");
			if((rcheck[2] == "c" && e) || (rcheck[2].match(/[urmbs]/i) && l))
				rs.push("common");
			if((rcheck[2] == "u" && e) || (rcheck[2].match(/[rmbs]/i) && l) || (rcheck[2].match(/[c]/i) && g))
				rs.push("uncommon");
			if((rcheck[2] == "r" && e) || (rcheck[2].match(/[mbs]/i) && l) || (rcheck[2].match(/[cu]/i) && g))
				rs.push("rare");
			if((rcheck[2] == "m" && e) || (rcheck[2].match(/[bs]/i) && l) || (rcheck[2].match(/[cur]/i) && g))
				rs.push("mythic rare");
			if((rcheck[2] == "b" && e) || (rcheck[2].match(/[s]/i) && l) || (rcheck[2].match(/[curm]/i) && g))
				rs.push("bonus");
			if((rcheck[2] == "s" && e) || (rcheck[2].match(/[curmb]/i) && g))
				rs.push("special");
		}
		for(let c in thisSlot) {
			 let multi = c * thisSlot[c];
			 for(let r in rs)
				 rarities[rs[r]] += multi;
		}
	}
	return rarities;
}

function makeFoil(string){											//adds ★ to a card name
	return "★ " + string;
}
function unFoil(string){											//removes ★ from a card name
	if(string == undefined)
		return "";
	return string.replace("★ ", "");
}
function isFoil(string){											//checks if card name has a ★ 
	if(string == undefined)
		return false;
	return string.match("★ ");
}

function psPackSorter (packArray, library) {						//sorts packs ps-style
	rarityArray = ["basic land", "common", "uncommon", "special", "bonus", "rare", "mythic rare", "masterpiece"];
	packArray.sort(function(a, b) {
		let result = (isFoil(a) == null) - (isFoil(b) == null);
		if(result)	//sort by foil
			return result;
		result = rarityArray.indexOf(library.cards[unFoil(b)].rarity) - rarityArray.indexOf(library.cards[unFoil(a)].rarity);
		if(result) //then by rarity
			return result;
		result = library.cards[unFoil(a)].cardID - library.cards[unFoil(b)].cardID;
		return result; //then by color
	})
	return packArray;
}

