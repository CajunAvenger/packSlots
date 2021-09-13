LackeyBot packSlots code

This contains the code that LackeyBot runs for customized pack collation (packSlots) for its internal use and for generating Planesculptors pack files.

`packgen` generates packSlots code from user input strings, for example

`9x Common

3x Uncommon

1x Rare

1x DFC

1x Foil`

`collator` generates arrays of card names (packs) from packSlots

`library-example` builds the magic library that is used.

`fuzzy` contains searching functions, allowing slots to be filtered by Scryfall filters

`toolbox` contains general scripts


This can be used for other programs, but will need either to be modified to support their system, or will need a translate function to LackeyBot's database. A translate function for mtgjson -> LackeyBot internal already exists.

