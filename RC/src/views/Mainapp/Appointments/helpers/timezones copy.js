const timezones = [
    {
      "abbreviation": "A",
      "name": "Alpha Time Zone",
      "location": "Military",
      "offset": "UTC +1"
    },
    {
      "abbreviation": "ACDT",
      "name": "Australian Central Daylight Time CDT - Central Daylight Time\nCDST - Central Daylight Savings Time",
      "location": "Australia",
      "offset": "UTC +10:30"
    },
    {
      "abbreviation": "ACST",
      "name": "Australian Central Standard Time CST - Central Standard Time",
      "location": "Australia",
      "offset": "UTC +9:30"
    },
    {
      "abbreviation": "ACT",
      "name": "Acre Time",
      "location": "South America",
      "offset": "UTC -5"
    },
    {
      "abbreviation": "ACT",
      "name": "Australian Central Time",
      "location": "Australia",
      "offset": "UTC +9:30 / +10:30"
    },
    {
      "abbreviation": "ACWST",
      "name": "Australian Central Western Standard Time",
      "location": "Australia",
      "offset": "UTC +8:45"
    },
    {
      "abbreviation": "ADT",
      "name": "Arabia Daylight Time AST - Arabia Summer Time",
      "location": "Asia",
      "offset": "UTC +3"
    },
    {
      "abbreviation": "ADT",
      "name": "Atlantic Daylight Time ADST - Atlantic Daylight Saving Time\nAST - Atlantic Summer Time \nHAA - Heure Avancée de l'Atlantique (French)\n",
      "location": "North AmericaAtlantic\n",
      "offset": "UTC -3"
    },
    {
      "abbreviation": "AEDT",
      "name": "Australian Eastern Daylight Time EDT - Eastern Daylight Time\nEDST - Eastern Daylight Saving Time",
      "location": "AustraliaPacific\n",
      "offset": "UTC +11"
    },
    {
      "abbreviation": "AEST",
      "name": "Australian Eastern Standard Time EST - Eastern Standard Time\nAET - Australian Eastern Time",
      "location": "Australia",
      "offset": "UTC +10"
    },
    {
      "abbreviation": "AET",
      "name": "Australian Eastern Time",
      "location": "Australia",
      "offset": "UTC +10:00 / +11:00"
    },
    {
      "abbreviation": "AFT",
      "name": "Afghanistan Time",
      "location": "Asia",
      "offset": "UTC +4:30"
    },
    {
      "abbreviation": "AKDT",
      "name": "Alaska Daylight Time ADST - Alaska Daylight Saving Time",
      "location": "North America",
      "offset": "UTC -8"
    },
    {
      "abbreviation": "AKST",
      "name": "Alaska Standard Time AT - Alaska Time",
      "location": "North America",
      "offset": "UTC -9"
    },
    {
      "abbreviation": "ALMT",
      "name": "Alma-Ata Time",
      "location": "Asia",
      "offset": "UTC +6"
    },
    {
      "abbreviation": "AMST",
      "name": "Amazon Summer Time",
      "location": "South America",
      "offset": "UTC -3"
    },
    {
      "abbreviation": "AMST",
      "name": "Armenia Summer Time AMDT - Armenia Daylight Time",
      "location": "Asia",
      "offset": "UTC +5"
    },
    {
      "abbreviation": "AMT",
      "name": "Amazon Time",
      "location": "South America",
      "offset": "UTC -4"
    },
    {
      "abbreviation": "AMT",
      "name": "Armenia Time",
      "location": "Asia",
      "offset": "UTC +4"
    },
    {
      "abbreviation": "ANAST",
      "name": "Anadyr Summer Time",
      "location": "Asia",
      "offset": "UTC +12"
    },
    {
      "abbreviation": "ANAT",
      "name": "Anadyr Time",
      "location": "Asia",
      "offset": "UTC +12"
    },
    {
      "abbreviation": "AQTT",
      "name": "Aqtobe Time",
      "location": "Asia",
      "offset": "UTC +5"
    },
    {
      "abbreviation": "ART",
      "name": "Argentina Time",
      "location": "AntarcticaSouth America\n",
      "offset": "UTC -3"
    },
    {
      "abbreviation": "AST",
      "name": "Arabia Standard Time AST - Arabic Standard Time\nAST - Al Manamah Standard Time",
      "location": "Asia",
      "offset": "UTC +3"
    },
    {
      "abbreviation": "AST",
      "name": "Atlantic Standard Time AT - Atlantic Time \nAST - Tiempo Estándar del Atlántico (Spanish)\nHNA - Heure Normale de l'Atlantique (French)\n",
      "location": "North AmericaAtlantic\nCaribbean\n",
      "offset": "UTC -4"
    },
    {
      "abbreviation": "AT",
      "name": "Atlantic Time",
      "location": "North AmericaAtlantic\n",
      "offset": "UTC -3:00 / -4:00"
    },
    {
      "abbreviation": "AWDT",
      "name": "Australian Western Daylight Time WDT - Western Daylight Time\nWST - Western Summer Time",
      "location": "Australia",
      "offset": "UTC +9"
    },
    {
      "abbreviation": "AWST",
      "name": "Australian Western Standard Time WST - Western Standard Time\nWAT - Western Australia Time",
      "location": "Australia",
      "offset": "UTC +8"
    },
    {
      "abbreviation": "AZOST",
      "name": "Azores Summer Time AZODT - Azores Daylight Time",
      "location": "Atlantic",
      "offset": "UTC +0"
    },
    {
      "abbreviation": "AZOT",
      "name": "Azores Time AZOST - Azores Standard Time",
      "location": "Atlantic",
      "offset": "UTC -1"
    },
    {
      "abbreviation": "AZST",
      "name": "Azerbaijan Summer Time",
      "location": "Asia",
      "offset": "UTC +5"
    },
    {
      "abbreviation": "AZT",
      "name": "Azerbaijan Time",
      "location": "Asia",
      "offset": "UTC +4"
    },
    {
      "abbreviation": "AoE",
      "name": "Anywhere on Earth",
      "location": "Pacific",
      "offset": "UTC -12"
    },
    {
      "abbreviation": "B",
      "name": "Bravo Time Zone",
      "location": "Military",
      "offset": "UTC +2"
    },
    {
      "abbreviation": "BNT",
      "name": "Brunei Darussalam Time BDT - Brunei Time",
      "location": "Asia",
      "offset": "UTC +8"
    },
    {
      "abbreviation": "BOT",
      "name": "Bolivia Time",
      "location": "South America",
      "offset": "UTC -4"
    },
    {
      "abbreviation": "BRST",
      "name": "Brasília Summer Time BST - Brazil Summer Time\nBST - Brazilian Summer Time",
      "location": "South America",
      "offset": "UTC -2"
    },
    {
      "abbreviation": "BRT",
      "name": "Brasília Time BT - Brazil Time\nBT - Brazilian Time",
      "location": "South America",
      "offset": "UTC -3"
    },
    {
      "abbreviation": "BST",
      "name": "Bangladesh Standard Time",
      "location": "Asia",
      "offset": "UTC +6"
    },
    {
      "abbreviation": "BST",
      "name": "Bougainville Standard Time",
      "location": "Pacific",
      "offset": "UTC +11"
    },
    {
      "abbreviation": "BST",
      "name": "British Summer Time BDT - British Daylight Time\nBDST - British Daylight Saving Time",
      "location": "Europe",
      "offset": "UTC +1"
    },
    {
      "abbreviation": "BTT",
      "name": "Bhutan Time",
      "location": "Asia",
      "offset": "UTC +6"
    },
    {
      "abbreviation": "C",
      "name": "Charlie Time Zone",
      "location": "Military",
      "offset": "UTC +3"
    },
    {
      "abbreviation": "CAST",
      "name": "Casey Time",
      "location": "Antarctica",
      "offset": "UTC +8"
    },
    {
      "abbreviation": "CAT",
      "name": "Central Africa Time",
      "location": "Africa",
      "offset": "UTC +2"
    },
    {
      "abbreviation": "CCT",
      "name": "Cocos Islands Time",
      "location": "Indian Ocean",
      "offset": "UTC +6:30"
    },
    {
      "abbreviation": "CDT",
      "name": "Central Daylight Time CDST - Central Daylight Saving Time\nNACDT - North American Central Daylight Time \nHAC - Heure Avancée du Centre (French)\n",
      "location": "North America",
      "offset": "UTC -5"
    },
    {
      "abbreviation": "CDT",
      "name": "Cuba Daylight Time",
      "location": "Caribbean",
      "offset": "UTC -4"
    },
    {
      "abbreviation": "CEST",
      "name": "Central European Summer Time CEDT - Central European Daylight Time\nECST - European Central Summer Time \nMESZ - Mitteleuropäische Sommerzeit (German)\n",
      "location": "EuropeAntarctica\n",
      "offset": "UTC +2"
    },
    {
      "abbreviation": "CET",
      "name": "Central European Time ECT - European Central Time\nCET - Central Europe Time \nMEZ - Mitteleuropäische Zeit (German)\n",
      "location": "EuropeAfrica\nAntarctica\n",
      "offset": "UTC +1"
    },
    {
      "abbreviation": "CHADT",
      "name": "Chatham Island Daylight Time CDT - Chatham Daylight Time",
      "location": "Pacific",
      "offset": "UTC +13:45"
    },
    {
      "abbreviation": "CHAST",
      "name": "Chatham Island Standard Time",
      "location": "Pacific",
      "offset": "UTC +12:45"
    },
    {
      "abbreviation": "CHOST",
      "name": "Choibalsan Summer Time",
      "location": "Asia",
      "offset": "UTC +9:00 / +8:00"
    },
    {
      "abbreviation": "CHOST",
      "name": "Choibalsan Summer Time CHODT - Choibalsan Daylight Time\nCHODST - Choibalsan Daylight Saving Time",
      "location": "Asia",
      "offset": "UTC +9"
    },
    {
      "abbreviation": "CHOT",
      "name": "Choibalsan Time",
      "location": "Asia",
      "offset": "UTC +8"
    },
    {
      "abbreviation": "CHUT",
      "name": "Chuuk Time",
      "location": "Pacific",
      "offset": "UTC +10"
    },
    {
      "abbreviation": "CIDST",
      "name": "Cayman Islands Daylight Saving Time",
      "location": "Caribbean",
      "offset": "UTC -4"
    },
    {
      "abbreviation": "CIST",
      "name": "Cayman Islands Standard Time CIT - Cayman Islands Time",
      "location": "Caribbean",
      "offset": "UTC -5"
    },
    {
      "abbreviation": "CKT",
      "name": "Cook Island Time",
      "location": "Pacific",
      "offset": "UTC -10"
    },
    {
      "abbreviation": "CLST",
      "name": "Chile Summer Time CLDT - Chile Daylight Time",
      "location": "South AmericaAntarctica\n",
      "offset": "UTC -3"
    },
    {
      "abbreviation": "CLT",
      "name": "Chile Standard Time CT - Chile Time\nCLST - Chile Standard Time",
      "location": "South AmericaAntarctica\n",
      "offset": "UTC -4"
    },
    {
      "abbreviation": "COT",
      "name": "Colombia Time",
      "location": "South America",
      "offset": "UTC -5"
    },
    {
      "abbreviation": "CST",
      "name": "Central Standard Time CT - Central Time\nNACST - North American Central Standard Time \nCST - Tiempo Central Estándar (Spanish)\nHNC - Heure Normale du Centre (French)\n",
      "location": "North AmericaCentral America\n",
      "offset": "UTC -6"
    },
    {
      "abbreviation": "CST",
      "name": "China Standard Time",
      "location": "Asia",
      "offset": "UTC +8"
    },
    {
      "abbreviation": "CST",
      "name": "Cuba Standard Time",
      "location": "Caribbean",
      "offset": "UTC -5"
    },
    {
      "abbreviation": "CT",
      "name": "Central Time",
      "location": "North America",
      "offset": "UTC -5:00 / -6:00"
    },
    {
      "abbreviation": "CVT",
      "name": "Cape Verde Time",
      "location": "Africa",
      "offset": "UTC -1"
    },
    {
      "abbreviation": "CXT",
      "name": "Christmas Island Time",
      "location": "Australia",
      "offset": "UTC +7"
    },
    {
      "abbreviation": "ChST",
      "name": "Chamorro Standard Time GST - Guam Standard Time",
      "location": "Pacific",
      "offset": "UTC +10"
    },
    {
      "abbreviation": "D",
      "name": "Delta Time Zone",
      "location": "Military",
      "offset": "UTC +4"
    },
    {
      "abbreviation": "DAVT",
      "name": "Davis Time",
      "location": "Antarctica",
      "offset": "UTC +7"
    },
    {
      "abbreviation": "DDUT",
      "name": "Dumont-d'Urville Time",
      "location": "Antarctica",
      "offset": "UTC +10"
    },
    {
      "abbreviation": "E",
      "name": "Echo Time Zone",
      "location": "Military",
      "offset": "UTC +5"
    },
    {
      "abbreviation": "EASST",
      "name": "Easter Island Summer Time EADT - Easter Island Daylight Time",
      "location": "Pacific",
      "offset": "UTC -5"
    },
    {
      "abbreviation": "EAST",
      "name": "Easter Island Standard Time",
      "location": "Pacific",
      "offset": "UTC -6"
    },
    {
      "abbreviation": "EAT",
      "name": "Eastern Africa Time EAT - East Africa Time",
      "location": "AfricaIndian Ocean\n",
      "offset": "UTC +3"
    },
    {
      "abbreviation": "ECT",
      "name": "Ecuador Time",
      "location": "South America",
      "offset": "UTC -5"
    },
    {
      "abbreviation": "EDT",
      "name": "Eastern Daylight Time EDST - Eastern Daylight Savings Time\nNAEDT - North American Eastern Daylight Time \nHAE - Heure Avancée de l'Est (French)\nEDT - Tiempo de verano del Este (Spanish)\n",
      "location": "North AmericaCaribbean\n",
      "offset": "UTC -4"
    },
    {
      "abbreviation": "EEST",
      "name": "Eastern European Summer Time EEDT - Eastern European Daylight Time \nOESZ - Osteuropäische Sommerzeit (German)\n",
      "location": "EuropeAsia\n",
      "offset": "UTC +3"
    },
    {
      "abbreviation": "EET",
      "name": "Eastern European Time OEZ - Osteuropäische Zeit (German)\n",
      "location": "EuropeAsia\nAfrica\n",
      "offset": "UTC +2"
    },
    {
      "abbreviation": "EGST",
      "name": "Eastern Greenland Summer Time EGST - East Greenland Summer Time",
      "location": "North America",
      "offset": "UTC +0"
    },
    {
      "abbreviation": "EGT",
      "name": "East Greenland Time EGT - Eastern Greenland Time",
      "location": "North America",
      "offset": "UTC -1"
    },
    {
      "abbreviation": "EST",
      "name": "Eastern Standard Time ET - Eastern Time \nNAEST - North American Eastern Standard Time \nET - Tiempo del Este (Spanish)\nHNE - Heure Normale de l'Est (French)\n",
      "location": "North AmericaCaribbean\nCentral America\n",
      "offset": "UTC -5"
    },
    {
      "abbreviation": "ET",
      "name": "Eastern Time",
      "location": "North AmericaCaribbean\n",
      "offset": "UTC -4:00 / -5:00"
    },
    {
      "abbreviation": "F",
      "name": "Foxtrot Time Zone",
      "location": "Military",
      "offset": "UTC +6"
    },
    {
      "abbreviation": "FET",
      "name": "Further-Eastern European Time",
      "location": "Europe",
      "offset": "UTC +3"
    },
    {
      "abbreviation": "FJST",
      "name": "Fiji Summer Time FJDT - Fiji Daylight Time",
      "location": "Pacific",
      "offset": "UTC +13"
    },
    {
      "abbreviation": "FJT",
      "name": "Fiji Time",
      "location": "Pacific",
      "offset": "UTC +12"
    },
    {
      "abbreviation": "FKST",
      "name": "Falkland Islands Summer Time FKDT - Falkland Island Daylight Time",
      "location": "South America",
      "offset": "UTC -3"
    },
    {
      "abbreviation": "FKT",
      "name": "Falkland Island Time FKST - Falkland Island Standard Time",
      "location": "South America",
      "offset": "UTC -4"
    },
    {
      "abbreviation": "FNT",
      "name": "Fernando de Noronha Time",
      "location": "South America",
      "offset": "UTC -2"
    },
    {
      "abbreviation": "G",
      "name": "Golf Time Zone",
      "location": "Military",
      "offset": "UTC +7"
    },
    {
      "abbreviation": "GALT",
      "name": "Galapagos Time",
      "location": "Pacific",
      "offset": "UTC -6"
    },
    {
      "abbreviation": "GAMT",
      "name": "Gambier Time GAMT - Gambier Islands Time",
      "location": "Pacific",
      "offset": "UTC -9"
    },
    {
      "abbreviation": "GET",
      "name": "Georgia Standard Time",
      "location": "Asia",
      "offset": "UTC +4"
    },
    {
      "abbreviation": "GFT",
      "name": "French Guiana Time",
      "location": "South America",
      "offset": "UTC -3"
    },
    {
      "abbreviation": "GILT",
      "name": "Gilbert Island Time",
      "location": "Pacific",
      "offset": "UTC +12"
    },
    {
      "abbreviation": "GMT",
      "name": "Greenwich Mean Time UTC - Coordinated Universal Time\nGT - Greenwich Time",
      "location": "EuropeAfrica\nNorth America\nAntarctica\n",
      "offset": "UTC +0"
    },
    {
      "abbreviation": "GST",
      "name": "Gulf Standard Time",
      "location": "Asia",
      "offset": "UTC +4"
    },
    {
      "abbreviation": "GST",
      "name": "South Georgia Time",
      "location": "South America",
      "offset": "UTC -2"
    },
    {
      "abbreviation": "GYT",
      "name": "Guyana Time",
      "location": "South America",
      "offset": "UTC -4"
    },
    {
      "abbreviation": "H",
      "name": "Hotel Time Zone",
      "location": "Military",
      "offset": "UTC +8"
    },
    {
      "abbreviation": "HADT",
      "name": "Hawaii-Aleutian Daylight Time HDT - Hawaii Daylight Time",
      "location": "North America",
      "offset": "UTC -9"
    },
    {
      "abbreviation": "HAST",
      "name": "Hawaii-Aleutian Standard Time HST - Hawaii Standard Time",
      "location": "North AmericaPacific\n",
      "offset": "UTC -10"
    },
    {
      "abbreviation": "HKT",
      "name": "Hong Kong Time",
      "location": "Asia",
      "offset": "UTC +8"
    },
    {
      "abbreviation": "HOVST",
      "name": "Hovd Summer Time",
      "location": "Asia",
      "offset": "UTC +8:00 / +7:00"
    },
    {
      "abbreviation": "HOVST",
      "name": "Hovd Summer Time HOVDT - Hovd Daylight Time\nHOVDST - Hovd Daylight Saving Time",
      "location": "Asia",
      "offset": "UTC +8"
    },
    {
      "abbreviation": "HOVT",
      "name": "Hovd Time",
      "location": "Asia",
      "offset": "UTC +7"
    },
    {
      "abbreviation": "I",
      "name": "India Time Zone",
      "location": "Military",
      "offset": "UTC +9"
    },
    {
      "abbreviation": "ICT",
      "name": "Indochina Time",
      "location": "Asia",
      "offset": "UTC +7"
    },
    {
      "abbreviation": "IDT",
      "name": "Israel Daylight Time",
      "location": "Asia",
      "offset": "UTC +3"
    },
    {
      "abbreviation": "IOT",
      "name": "Indian Chagos Time",
      "location": "Indian Ocean",
      "offset": "UTC +6"
    },
    {
      "abbreviation": "IRDT",
      "name": "Iran Daylight Time IRST - Iran Summer Time\nIDT - Iran Daylight Time",
      "location": "Asia",
      "offset": "UTC +4:30"
    },
    {
      "abbreviation": "IRKST",
      "name": "Irkutsk Summer Time",
      "location": "Asia",
      "offset": "UTC +9"
    },
    {
      "abbreviation": "IRKT",
      "name": "Irkutsk Time",
      "location": "Asia",
      "offset": "UTC +8"
    },
    {
      "abbreviation": "IRST",
      "name": "Iran Standard Time IT - Iran Time",
      "location": "Asia",
      "offset": "UTC +3:30"
    },
    {
      "abbreviation": "IST",
      "name": "India Standard Time IT - India Time\nIST - Indian Standard Time",
      "location": "Asia",
      "offset": "UTC +5:30"
    },
    {
      "abbreviation": "IST",
      "name": "Irish Standard Time IST - Irish Summer Time",
      "location": "Europe",
      "offset": "UTC +1"
    },
    {
      "abbreviation": "IST",
      "name": "Israel Standard Time",
      "location": "Asia",
      "offset": "UTC +2"
    },
    {
      "abbreviation": "JST",
      "name": "Japan Standard Time",
      "location": "Asia",
      "offset": "UTC +9"
    },
    {
      "abbreviation": "K",
      "name": "Kilo Time Zone",
      "location": "Military",
      "offset": "UTC +10"
    },
    {
      "abbreviation": "KGT",
      "name": "Kyrgyzstan Time",
      "location": "Asia",
      "offset": "UTC +6"
    },
    {
      "abbreviation": "KOST",
      "name": "Kosrae Time",
      "location": "Pacific",
      "offset": "UTC +11"
    },
    {
      "abbreviation": "KRAST",
      "name": "Krasnoyarsk Summer Time",
      "location": "Asia",
      "offset": "UTC +8"
    },
    {
      "abbreviation": "KRAT",
      "name": "Krasnoyarsk Time",
      "location": "Asia",
      "offset": "UTC +7"
    },
    {
      "abbreviation": "KST",
      "name": "Korea Standard Time KST - Korean Standard Time\nKT - Korea Time",
      "location": "Asia",
      "offset": "UTC +9"
    },
    {
      "abbreviation": "KUYT",
      "name": "Kuybyshev Time SAMST - Samara Summer Time",
      "location": "Europe",
      "offset": "UTC +4"
    },
    {
      "abbreviation": "L",
      "name": "Lima Time Zone",
      "location": "Military",
      "offset": "UTC +11"
    },
    {
      "abbreviation": "LHDT",
      "name": "Lord Howe Daylight Time",
      "location": "Australia",
      "offset": "UTC +11"
    },
    {
      "abbreviation": "LHST",
      "name": "Lord Howe Standard Time",
      "location": "Australia",
      "offset": "UTC +10:30"
    },
    {
      "abbreviation": "LINT",
      "name": "Line Islands Time",
      "location": "Pacific",
      "offset": "UTC +14"
    },
    {
      "abbreviation": "M",
      "name": "Mike Time Zone",
      "location": "Military",
      "offset": "UTC +12"
    },
    {
      "abbreviation": "MAGST",
      "name": "Magadan Summer Time MAGST - Magadan Island Summer Time",
      "location": "Asia",
      "offset": "UTC +12"
    },
    {
      "abbreviation": "MAGT",
      "name": "Magadan Time MAGT - Magadan Island Time",
      "location": "Asia",
      "offset": "UTC +11"
    },
    {
      "abbreviation": "MART",
      "name": "Marquesas Time",
      "location": "Pacific",
      "offset": "UTC -9:30"
    },
    {
      "abbreviation": "MAWT",
      "name": "Mawson Time",
      "location": "Antarctica",
      "offset": "UTC +5"
    },
    {
      "abbreviation": "MDT",
      "name": "Mountain Daylight Time MDST - Mountain Daylight Saving Time\nNAMDT - North American Mountain Daylight Time \nHAR - Heure Avancée des Rocheuses (French)\n",
      "location": "North America",
      "offset": "UTC -6"
    },
    {
      "abbreviation": "MHT",
      "name": "Marshall Islands Time",
      "location": "Pacific",
      "offset": "UTC +12"
    },
    {
      "abbreviation": "MMT",
      "name": "Myanmar Time",
      "location": "Asia",
      "offset": "UTC +6:30"
    },
    {
      "abbreviation": "MSD",
      "name": "Moscow Daylight Time Moscow Summer Time",
      "location": "Europe",
      "offset": "UTC +4"
    },
    {
      "abbreviation": "MSK",
      "name": "Moscow Standard Time MCK - Moscow Time",
      "location": "EuropeAsia\n",
      "offset": "UTC +3"
    },
    {
      "abbreviation": "MST",
      "name": "Mountain Standard Time MT - Mountain Time\nNAMST - North American Mountain Standard Time \nHNR - Heure Normale des Rocheuses (French)\n",
      "location": "North America",
      "offset": "UTC -7"
    },
    {
      "abbreviation": "MT",
      "name": "Mountain Time",
      "location": "North America",
      "offset": "UTC -6:00 / -7:00"
    },
    {
      "abbreviation": "MUT",
      "name": "Mauritius Time",
      "location": "Africa",
      "offset": "UTC +4"
    },
    {
      "abbreviation": "MVT",
      "name": "Maldives Time",
      "location": "Asia",
      "offset": "UTC +5"
    },
    {
      "abbreviation": "MYT",
      "name": "Malaysia Time MST - Malaysian Standard Time",
      "location": "Asia",
      "offset": "UTC +8"
    },
    {
      "abbreviation": "N",
      "name": "November Time Zone",
      "location": "Military",
      "offset": "UTC -1"
    },
    {
      "abbreviation": "NCT",
      "name": "New Caledonia Time",
      "location": "Pacific",
      "offset": "UTC +11"
    },
    {
      "abbreviation": "NDT",
      "name": "Newfoundland Daylight Time HAT - Heure Avancée de Terre-Neuve (French)\n",
      "location": "North America",
      "offset": "UTC -2:30"
    },
    {
      "abbreviation": "NFT",
      "name": "Norfolk Time NFT - Norfolk Island Time",
      "location": "Australia",
      "offset": "UTC +11"
    },
    {
      "abbreviation": "NOVST",
      "name": "Novosibirsk Summer Time OMSST - Omsk Summer Time",
      "location": "Asia",
      "offset": "UTC +7"
    },
    {
      "abbreviation": "NOVT",
      "name": "Novosibirsk Time OMST - Omsk Standard Time",
      "location": "Asia",
      "offset": "UTC +6"
    },
    {
      "abbreviation": "NPT",
      "name": "Nepal Time",
      "location": "Asia",
      "offset": "UTC +5:45"
    },
    {
      "abbreviation": "NRT",
      "name": "Nauru Time",
      "location": "Pacific",
      "offset": "UTC +12"
    },
    {
      "abbreviation": "NST",
      "name": "Newfoundland Standard Time HNT - Heure Normale de Terre-Neuve (French)\n",
      "location": "North America",
      "offset": "UTC -3:30"
    },
    {
      "abbreviation": "NUT",
      "name": "Niue Time",
      "location": "Pacific",
      "offset": "UTC -11"
    },
    {
      "abbreviation": "NZDT",
      "name": "New Zealand Daylight Time",
      "location": "PacificAntarctica\n",
      "offset": "UTC +13"
    },
    {
      "abbreviation": "NZST",
      "name": "New Zealand Standard Time",
      "location": "PacificAntarctica\n",
      "offset": "UTC +12"
    },
    {
      "abbreviation": "O",
      "name": "Oscar Time Zone",
      "location": "Military",
      "offset": "UTC -2"
    },
    {
      "abbreviation": "OMSST",
      "name": "Omsk Summer Time NOVST - Novosibirsk Summer Time",
      "location": "Asia",
      "offset": "UTC +7"
    },
    {
      "abbreviation": "OMST",
      "name": "Omsk Standard Time OMST - Omsk Time\nNOVT - Novosibirsk Time",
      "location": "Asia",
      "offset": "UTC +6"
    },
    {
      "abbreviation": "ORAT",
      "name": "Oral Time",
      "location": "Asia",
      "offset": "UTC +5"
    },
    {
      "abbreviation": "P",
      "name": "Papa Time Zone",
      "location": "Military",
      "offset": "UTC -3"
    },
    {
      "abbreviation": "PDT",
      "name": "Pacific Daylight Time PDST - Pacific Daylight Saving Time\nNAPDT - North American Pacific Daylight Time \nHAP - Heure Avancée du Pacifique (French)\n",
      "location": "North America",
      "offset": "UTC -7"
    },
    {
      "abbreviation": "PET",
      "name": "Peru Time",
      "location": "South America",
      "offset": "UTC -5"
    },
    {
      "abbreviation": "PETST",
      "name": "Kamchatka Summer Time",
      "location": "Asia",
      "offset": "UTC +12"
    },
    {
      "abbreviation": "PETT",
      "name": "Kamchatka Time PETT - Petropavlovsk-Kamchatski Time",
      "location": "Asia",
      "offset": "UTC +12"
    },
    {
      "abbreviation": "PGT",
      "name": "Papua New Guinea Time",
      "location": "Pacific",
      "offset": "UTC +10"
    },
    {
      "abbreviation": "PHOT",
      "name": "Phoenix Island Time",
      "location": "Pacific",
      "offset": "UTC +13"
    },
    {
      "abbreviation": "PHT",
      "name": "Philippine Time PST - Philippine Standard Time",
      "location": "Asia",
      "offset": "UTC +8"
    },
    {
      "abbreviation": "PKT",
      "name": "Pakistan Standard Time PKT - Pakistan Time",
      "location": "Asia",
      "offset": "UTC +5"
    },
    {
      "abbreviation": "PMDT",
      "name": "Pierre & Miquelon Daylight Time",
      "location": "North America",
      "offset": "UTC -2"
    },
    {
      "abbreviation": "PMST",
      "name": "Pierre & Miquelon Standard Time",
      "location": "North America",
      "offset": "UTC -3"
    },
    {
      "abbreviation": "PONT",
      "name": "Pohnpei Standard Time",
      "location": "Pacific",
      "offset": "UTC +11"
    },
    {
      "abbreviation": "PST",
      "name": "Pacific Standard Time PT - Pacific Time\nNAPST - North American Pacific Standard Time \nPT - Tiempo del Pacífico (Spanish)\nHNP - Heure Normale du Pacifique (French)\n",
      "location": "North America",
      "offset": "UTC -8"
    },
    {
      "abbreviation": "PST",
      "name": "Pitcairn Standard Time",
      "location": "Pacific",
      "offset": "UTC -8"
    },
    {
      "abbreviation": "PT",
      "name": "Pacific Time",
      "location": "North America",
      "offset": "UTC -7:00 / -8:00"
    },
    {
      "abbreviation": "PWT",
      "name": "Palau Time",
      "location": "Pacific",
      "offset": "UTC +9"
    },
    {
      "abbreviation": "PYST",
      "name": "Paraguay Summer Time",
      "location": "South America",
      "offset": "UTC -3"
    },
    {
      "abbreviation": "PYT",
      "name": "Paraguay Time",
      "location": "South America",
      "offset": "UTC -4"
    },
    {
      "abbreviation": "PYT",
      "name": "Pyongyang Time PYST - Pyongyang Standard Time",
      "location": "Asia",
      "offset": "UTC +8:30"
    },
    {
      "abbreviation": "Q",
      "name": "Quebec Time Zone",
      "location": "Military",
      "offset": "UTC -4"
    },
    {
      "abbreviation": "QYZT",
      "name": "Qyzylorda Time",
      "location": "Asia",
      "offset": "UTC +6"
    },
    {
      "abbreviation": "R",
      "name": "Romeo Time Zone",
      "location": "Military",
      "offset": "UTC -5"
    },
    {
      "abbreviation": "RET",
      "name": "Reunion Time",
      "location": "Africa",
      "offset": "UTC +4"
    },
    {
      "abbreviation": "ROTT",
      "name": "Rothera Time",
      "location": "Antarctica",
      "offset": "UTC -3"
    },
    {
      "abbreviation": "S",
      "name": "Sierra Time Zone",
      "location": "Military",
      "offset": "UTC -6"
    },
    {
      "abbreviation": "SAKT",
      "name": "Sakhalin Time",
      "location": "Asia",
      "offset": "UTC +11"
    },
    {
      "abbreviation": "SAMT",
      "name": "Samara Time SAMT - Samara Standard Time",
      "location": "Europe",
      "offset": "UTC +4"
    },
    {
      "abbreviation": "SAST",
      "name": "South Africa Standard Time SAST - South African Standard Time",
      "location": "Africa",
      "offset": "UTC +2"
    },
    {
      "abbreviation": "SBT",
      "name": "Solomon Islands Time SBT - Solomon Island Time",
      "location": "Pacific",
      "offset": "UTC +11"
    },
    {
      "abbreviation": "SCT",
      "name": "Seychelles Time",
      "location": "Africa",
      "offset": "UTC +4"
    },
    {
      "abbreviation": "SGT",
      "name": "Singapore Time SST - Singapore Standard Time",
      "location": "Asia",
      "offset": "UTC +8"
    },
    {
      "abbreviation": "SRET",
      "name": "Srednekolymsk Time",
      "location": "Asia",
      "offset": "UTC +11"
    },
    {
      "abbreviation": "SRT",
      "name": "Suriname Time",
      "location": "South America",
      "offset": "UTC -3"
    },
    {
      "abbreviation": "SST",
      "name": "Samoa Standard Time",
      "location": "Pacific",
      "offset": "UTC -11"
    },
    {
      "abbreviation": "SYOT",
      "name": "Syowa Time",
      "location": "Antarctica",
      "offset": "UTC +3"
    },
    {
      "abbreviation": "T",
      "name": "Tango Time Zone",
      "location": "Military",
      "offset": "UTC -7"
    },
    {
      "abbreviation": "TAHT",
      "name": "Tahiti Time",
      "location": "Pacific",
      "offset": "UTC -10"
    },
    {
      "abbreviation": "TFT",
      "name": "French Southern and Antarctic Time KIT - Kerguelen (Islands) Time",
      "location": "Indian Ocean",
      "offset": "UTC +5"
    },
    {
      "abbreviation": "TJT",
      "name": "Tajikistan Time",
      "location": "Asia",
      "offset": "UTC +5"
    },
    {
      "abbreviation": "TKT",
      "name": "Tokelau Time",
      "location": "Pacific",
      "offset": "UTC +13"
    },
    {
      "abbreviation": "TLT",
      "name": "East Timor Time",
      "location": "Asia",
      "offset": "UTC +9"
    },
    {
      "abbreviation": "TMT",
      "name": "Turkmenistan Time",
      "location": "Asia",
      "offset": "UTC +5"
    },
    {
      "abbreviation": "TOT",
      "name": "Tonga Time",
      "location": "Pacific",
      "offset": "UTC +13"
    },
    {
      "abbreviation": "TVT",
      "name": "Tuvalu Time",
      "location": "Pacific",
      "offset": "UTC +12"
    },
    {
      "abbreviation": "U",
      "name": "Uniform Time Zone",
      "location": "Military",
      "offset": "UTC -8"
    },
    {
      "abbreviation": "ULAST",
      "name": "Ulaanbaatar Summer Time",
      "location": "Asia",
      "offset": "UTC +9:00 / +8:00"
    },
    {
      "abbreviation": "ULAST",
      "name": "Ulaanbaatar Summer Time ULAST - Ulan Bator Summer Time",
      "location": "Asia",
      "offset": "UTC +9"
    },
    {
      "abbreviation": "ULAT",
      "name": "Ulaanbaatar Time ULAT - Ulan Bator Time",
      "location": "Asia",
      "offset": "UTC +8"
    },
    {
      "abbreviation": "ULAT",
      "name": "Ulaanbaatar Time",
      "location": "Asia",
      "offset": "UTC +9:00 / +8:00"
    },
    {
      "abbreviation": "UTC",
      "name": "Coordinated Universal Time",
      "location": "Worldwide",
      "offset": "UTC"
    },
    {
      "abbreviation": "UYST",
      "name": "Uruguay Summer Time",
      "location": "South America",
      "offset": "UTC -2"
    },
    {
      "abbreviation": "UYT",
      "name": "Uruguay Time",
      "location": "South America",
      "offset": "UTC -3"
    },
    {
      "abbreviation": "UZT",
      "name": "Uzbekistan Time",
      "location": "Asia",
      "offset": "UTC +5"
    },
    {
      "abbreviation": "V",
      "name": "Victor Time Zone",
      "location": "Military",
      "offset": "UTC -9"
    },
    {
      "abbreviation": "VET",
      "name": "Venezuelan Standard Time HLV - Hora Legal de Venezuela (Spanish)\n",
      "location": "South America",
      "offset": "UTC -4"
    },
    {
      "abbreviation": "VLAST",
      "name": "Vladivostok Summer Time",
      "location": "Asia",
      "offset": "UTC +11"
    },
    {
      "abbreviation": "VLAT",
      "name": "Vladivostok Time",
      "location": "Asia",
      "offset": "UTC +10"
    },
    {
      "abbreviation": "VOST",
      "name": "Vostok Time",
      "location": "Antarctica",
      "offset": "UTC +6"
    },
    {
      "abbreviation": "VUT",
      "name": "Vanuatu Time EFATE - Efate Time",
      "location": "Pacific",
      "offset": "UTC +11"
    },
    {
      "abbreviation": "W",
      "name": "Whiskey Time Zone",
      "location": "Military",
      "offset": "UTC -10"
    },
    {
      "abbreviation": "WAKT",
      "name": "Wake Time",
      "location": "Pacific",
      "offset": "UTC +12"
    },
    {
      "abbreviation": "WARST",
      "name": "Western Argentine Summer Time",
      "location": "South America",
      "offset": "UTC -3"
    },
    {
      "abbreviation": "WAST",
      "name": "West Africa Summer Time",
      "location": "Africa",
      "offset": "UTC +2"
    },
    {
      "abbreviation": "WAT",
      "name": "West Africa Time",
      "location": "Africa",
      "offset": "UTC +1"
    },
    {
      "abbreviation": "WEST",
      "name": "Western European Summer Time WEDT - Western European Daylight Time \nWESZ - Westeuropäische Sommerzeit (German)\n",
      "location": "EuropeAfrica\n",
      "offset": "UTC +1"
    },
    {
      "abbreviation": "WET",
      "name": "Western European Time GMT - Greenwich Mean Time \nWEZ - Westeuropäische Zeit (German)\n",
      "location": "EuropeAfrica\n",
      "offset": "UTC +0"
    },
    {
      "abbreviation": "WFT",
      "name": "Wallis and Futuna Time",
      "location": "Pacific",
      "offset": "UTC +12"
    },
    {
      "abbreviation": "WGST",
      "name": "Western Greenland Summer Time WGST - West Greenland Summer Time",
      "location": "North America",
      "offset": "UTC -2"
    },
    {
      "abbreviation": "WGT",
      "name": "West Greenland Time WGT - Western Greenland Time",
      "location": "North America",
      "offset": "UTC -3"
    },
    {
      "abbreviation": "WIB",
      "name": "Western Indonesian Time WIB - Waktu Indonesia Barat",
      "location": "Asia",
      "offset": "UTC +7"
    },
    {
      "abbreviation": "WIT",
      "name": "Eastern Indonesian Time WIT - Waktu Indonesia Timur",
      "location": "Asia",
      "offset": "UTC +9"
    },
    {
      "abbreviation": "WITA",
      "name": "Central Indonesian Time WITA - Waktu Indonesia Tengah",
      "location": "Asia",
      "offset": "UTC +8"
    },
    {
      "abbreviation": "WST",
      "name": "West Samoa Time ST - Samoa Time",
      "location": "Pacific",
      "offset": "UTC +13"
    },
    {
      "abbreviation": "WST",
      "name": "Western Sahara Summer Time",
      "location": "Africa",
      "offset": "UTC +1"
    },
    {
      "abbreviation": "WT",
      "name": "Western Sahara Standard Time WT - Western Sahara Time",
      "location": "Africa",
      "offset": "UTC +0"
    },
    {
      "abbreviation": "X",
      "name": "X-ray Time Zone",
      "location": "Military",
      "offset": "UTC -11"
    },
    {
      "abbreviation": "Y",
      "name": "Yankee Time Zone",
      "location": "Military",
      "offset": "UTC -12"
    },
    {
      "abbreviation": "YAKST",
      "name": "Yakutsk Summer Time",
      "location": "Asia",
      "offset": "UTC +10"
    },
    {
      "abbreviation": "YAKT",
      "name": "Yakutsk Time",
      "location": "Asia",
      "offset": "UTC +9"
    },
    {
      "abbreviation": "YAPT",
      "name": "Yap Time",
      "location": "Pacific",
      "offset": "UTC +10"
    },
    {
      "abbreviation": "YEKST",
      "name": "Yekaterinburg Summer Time",
      "location": "Asia",
      "offset": "UTC +6"
    },
    {
      "abbreviation": "YEKT",
      "name": "Yekaterinburg Time",
      "location": "Asia",
      "offset": "UTC +5"
    },
    {
      "abbreviation": "Z",
      "name": "Zulu Time Zone",
      "location": "Military",
      "offset": "UTC +0"
    }
];

const Timezones = timezones.map(timezone => ({
...timezone, name: `${timezone.name.split('-')[0]} (${timezone.offset})`
}));

export default Timezones;
