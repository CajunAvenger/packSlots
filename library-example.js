var magic = {};
magic.cards = require('./magic/cards.json');
magic.setData = require('./magic/setData.json');
magic.name = "magic";
magic.bigName = "Magic";

exports.sendLibrary = function() {
	return magic;
}