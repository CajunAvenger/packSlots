LackeyBot packSlots code

This contains the code that LackeyBot runs for customized pack collation (packSlots) for its internal use and for generating Planesculptors pack files.

`packgen.js` generates packSlots code from user input strings, for example

```
9x Common

3x Uncommon

1x Rare

1x DFC

1x Foil
```

It also supports building fully custom slots by defining Scryfall-style filters to define what can roll and the chances to do so. For example, you could define an alternate rare-mythic slot that's mythic twice as often with this string:

`1x filters: "r=m","r=r" chances: 0.27,0.73`


`collator.js` generates arrays of card names (packs) from packSlots

`library-example.js` builds the magic library that is used.

`fuzzy.js` contains searching functions, allowing slots to be filtered by Scryfall filters

`toolbox.js` contains general scripts


This can be used for other programs, but will need either to be modified to support their system, or will need a translate function to LackeyBot's database. A translate function for mtgjson -> LackeyBot internal already exists.

