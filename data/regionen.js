// Familienfunke: regionale Auswahldaten für den Familien-Kompass.
// Quellen / Datenstand: Offizielle politische Gebietsstruktur der BA (August/Oktober 2026),
// https://statistik.arbeitsagentur.de/DE/Navigation/Grundlagen/Klassifikationen/Regionale-Gliederungen/Politische-Gebietsstruktur-Nav.html
// Namen und AGS ursprünglich aus öffentlichem Verzeichnis opendatalab-de/checkgermany,
// auf Gebietsstand 2026 abgeglichen: Göttingen 03159 (Fusion 2016),
// Eisenach 16056 kein Kreis seit 2021, Hanau 06415 kreisfrei seit 01.01.2026.
// Angaben zu Leistungen und Zuständigkeiten werden separat redaktionell recherchiert.
// Keine Personendaten, keine Netzwerkabfrage; Land-/Kreisauswahl bleibt lokal im Arbeitsspeicher.

export const BUNDESLAENDER = [
 [
  "10",
  "Saarland"
 ],
 [
  "11",
  "Berlin"
 ],
 [
  "12",
  "Brandenburg"
 ],
 [
  "13",
  "Mecklenburg-Vorpommern"
 ],
 [
  "14",
  "Sachsen"
 ],
 [
  "15",
  "Sachsen-Anhalt"
 ],
 [
  "16",
  "Thüringen"
 ],
 [
  "01",
  "Schleswig-Holstein"
 ],
 [
  "02",
  "Hamburg"
 ],
 [
  "03",
  "Niedersachsen"
 ],
 [
  "04",
  "Bremen"
 ],
 [
  "05",
  "Nordrhein-Westfalen"
 ],
 [
  "06",
  "Hessen"
 ],
 [
  "07",
  "Rheinland-Pfalz"
 ],
 [
  "08",
  "Baden-Württemberg"
 ],
 [
  "09",
  "Bayern"
 ]
];

export const KREISE_NACH_LAND = {
 "10": [
  [
   "10041",
   "Regionalverband Saarbrücken (Landkreis/Kreis)"
  ],
  [
   "10042",
   "Merzig-Wadern (Landkreis/Kreis)"
  ],
  [
   "10043",
   "Neunkirchen (Landkreis/Kreis)"
  ],
  [
   "10044",
   "Saarlouis (Landkreis/Kreis)"
  ],
  [
   "10045",
   "Saarpfalz-Kreis (Landkreis/Kreis)"
  ],
  [
   "10046",
   "St. Wendel (Landkreis/Kreis)"
  ]
 ],
 "11": [
  [
   "11000",
   "Berlin (kreisfreie Stadt)"
  ]
 ],
 "12": [
  [
   "12051",
   "Brandenburg an der Havel (kreisfreie Stadt)"
  ],
  [
   "12052",
   "Cottbus (kreisfreie Stadt)"
  ],
  [
   "12053",
   "Frankfurt (Oder) (kreisfreie Stadt)"
  ],
  [
   "12054",
   "Potsdam (kreisfreie Stadt)"
  ],
  [
   "12060",
   "Barnim (Landkreis/Kreis)"
  ],
  [
   "12061",
   "Dahme-Spreewald (Landkreis/Kreis)"
  ],
  [
   "12062",
   "Elbe-Elster (Landkreis/Kreis)"
  ],
  [
   "12063",
   "Havelland (Landkreis/Kreis)"
  ],
  [
   "12064",
   "Märkisch-Oderland (Landkreis/Kreis)"
  ],
  [
   "12065",
   "Oberhavel (Landkreis/Kreis)"
  ],
  [
   "12066",
   "Oberspreewald-Lausitz (Landkreis/Kreis)"
  ],
  [
   "12067",
   "Oder-Spree (Landkreis/Kreis)"
  ],
  [
   "12068",
   "Ostprignitz-Ruppin (Landkreis/Kreis)"
  ],
  [
   "12069",
   "Potsdam-Mittelmark (Landkreis/Kreis)"
  ],
  [
   "12070",
   "Prignitz (Landkreis/Kreis)"
  ],
  [
   "12071",
   "Spree-Neiße (Landkreis/Kreis)"
  ],
  [
   "12072",
   "Teltow-Fläming (Landkreis/Kreis)"
  ],
  [
   "12073",
   "Uckermark (Landkreis/Kreis)"
  ]
 ],
 "13": [
  [
   "13003",
   "Rostock (kreisfreie Stadt)"
  ],
  [
   "13004",
   "Schwerin (kreisfreie Stadt)"
  ],
  [
   "13071",
   "Mecklenburgische Seenplatte (Landkreis/Kreis)"
  ],
  [
   "13072",
   "Landkreis Rostock (Landkreis/Kreis)"
  ],
  [
   "13073",
   "Vorpommern-Rügen (Landkreis/Kreis)"
  ],
  [
   "13074",
   "Nordwestmecklenburg (Landkreis/Kreis)"
  ],
  [
   "13075",
   "Vorpommern-Greifswald (Landkreis/Kreis)"
  ],
  [
   "13076",
   "Ludwigslust-Parchim (Landkreis/Kreis)"
  ]
 ],
 "14": [
  [
   "14511",
   "Chemnitz (kreisfreie Stadt)"
  ],
  [
   "14521",
   "Erzgebirgskreis (Landkreis/Kreis)"
  ],
  [
   "14522",
   "Mittelsachsen (Landkreis/Kreis)"
  ],
  [
   "14523",
   "Vogtlandkreis (Landkreis/Kreis)"
  ],
  [
   "14524",
   "Zwickau (Landkreis/Kreis)"
  ],
  [
   "14612",
   "Dresden (kreisfreie Stadt)"
  ],
  [
   "14625",
   "Bautzen (Landkreis/Kreis)"
  ],
  [
   "14626",
   "Görlitz (Landkreis/Kreis)"
  ],
  [
   "14627",
   "Meißen (Landkreis/Kreis)"
  ],
  [
   "14628",
   "Sächsische Schweiz-Osterzgebirge (Landkreis/Kreis)"
  ],
  [
   "14713",
   "Leipzig (kreisfreie Stadt)"
  ],
  [
   "14729",
   "Leipzig (Landkreis/Kreis)"
  ],
  [
   "14730",
   "Nordsachsen (Landkreis/Kreis)"
  ]
 ],
 "15": [
  [
   "15001",
   "Dessau-Roßlau (kreisfreie Stadt)"
  ],
  [
   "15002",
   "Halle (Saale) (kreisfreie Stadt)"
  ],
  [
   "15003",
   "Magdeburg (kreisfreie Stadt)"
  ],
  [
   "15081",
   "Altmarkkreis Salzwedel (Landkreis/Kreis)"
  ],
  [
   "15082",
   "Anhalt-Bitterfeld (Landkreis/Kreis)"
  ],
  [
   "15083",
   "Börde (Landkreis/Kreis)"
  ],
  [
   "15084",
   "Burgenlandkreis (Landkreis/Kreis)"
  ],
  [
   "15085",
   "Harz (Landkreis/Kreis)"
  ],
  [
   "15086",
   "Jerichower Land (Landkreis/Kreis)"
  ],
  [
   "15087",
   "Mansfeld-Südharz (Landkreis/Kreis)"
  ],
  [
   "15088",
   "Saalekreis (Landkreis/Kreis)"
  ],
  [
   "15089",
   "Salzlandkreis (Landkreis/Kreis)"
  ],
  [
   "15090",
   "Stendal (Landkreis/Kreis)"
  ],
  [
   "15091",
   "Wittenberg (Landkreis/Kreis)"
  ]
 ],
 "16": [
  [
   "16051",
   "Erfurt (kreisfreie Stadt)"
  ],
  [
   "16052",
   "Gera (kreisfreie Stadt)"
  ],
  [
   "16053",
   "Jena (kreisfreie Stadt)"
  ],
  [
   "16054",
   "Suhl (kreisfreie Stadt)"
  ],
  [
   "16055",
   "Weimar (kreisfreie Stadt)"
  ],
  [
   "16061",
   "Eichsfeld (Landkreis/Kreis)"
  ],
  [
   "16062",
   "Nordhausen (Landkreis/Kreis)"
  ],
  [
   "16063",
   "Wartburgkreis (Landkreis/Kreis)"
  ],
  [
   "16064",
   "Unstrut-Hainich-Kreis (Landkreis/Kreis)"
  ],
  [
   "16065",
   "Kyffhäuserkreis (Landkreis/Kreis)"
  ],
  [
   "16066",
   "Schmalkalden-Meiningen (Landkreis/Kreis)"
  ],
  [
   "16067",
   "Gotha (Landkreis/Kreis)"
  ],
  [
   "16068",
   "Sömmerda (Landkreis/Kreis)"
  ],
  [
   "16069",
   "Hildburghausen (Landkreis/Kreis)"
  ],
  [
   "16070",
   "Ilm-Kreis (Landkreis/Kreis)"
  ],
  [
   "16071",
   "Weimarer Land (Landkreis/Kreis)"
  ],
  [
   "16072",
   "Sonneberg (Landkreis/Kreis)"
  ],
  [
   "16073",
   "Saalfeld-Rudolstadt (Landkreis/Kreis)"
  ],
  [
   "16074",
   "Saale-Holzland-Kreis (Landkreis/Kreis)"
  ],
  [
   "16075",
   "Saale-Orla-Kreis (Landkreis/Kreis)"
  ],
  [
   "16076",
   "Greiz (Landkreis/Kreis)"
  ],
  [
   "16077",
   "Altenburger Land (Landkreis/Kreis)"
  ]
 ],
 "01": [
  [
   "01001",
   "Flensburg (kreisfreie Stadt)"
  ],
  [
   "01002",
   "Kiel (kreisfreie Stadt)"
  ],
  [
   "01003",
   "Lübeck, Hansestadt (kreisfreie Stadt)"
  ],
  [
   "01004",
   "Neumünster (kreisfreie Stadt)"
  ],
  [
   "01051",
   "Dithmarschen (Landkreis/Kreis)"
  ],
  [
   "01053",
   "Herzogtum Lauenburg (Landkreis/Kreis)"
  ],
  [
   "01054",
   "Nordfriesland (Landkreis/Kreis)"
  ],
  [
   "01055",
   "Ostholstein (Landkreis/Kreis)"
  ],
  [
   "01056",
   "Pinneberg (Landkreis/Kreis)"
  ],
  [
   "01057",
   "Plön (Landkreis/Kreis)"
  ],
  [
   "01058",
   "Rendsburg-Eckernförde (Landkreis/Kreis)"
  ],
  [
   "01059",
   "Schleswig-Flensburg (Landkreis/Kreis)"
  ],
  [
   "01060",
   "Segeberg (Landkreis/Kreis)"
  ],
  [
   "01061",
   "Steinburg (Landkreis/Kreis)"
  ],
  [
   "01062",
   "Stormarn (Landkreis/Kreis)"
  ]
 ],
 "02": [
  [
   "02000",
   "Hamburg, Freie und Hansestadt (kreisfreie Stadt)"
  ]
 ],
 "03": [
  [
   "03101",
   "Braunschweig (kreisfreie Stadt)"
  ],
  [
   "03102",
   "Salzgitter (kreisfreie Stadt)"
  ],
  [
   "03103",
   "Wolfsburg (kreisfreie Stadt)"
  ],
  [
   "03151",
   "Gifhorn (Landkreis/Kreis)"
  ],
  [
   "03153",
   "Goslar (Landkreis/Kreis)"
  ],
  [
   "03154",
   "Helmstedt (Landkreis/Kreis)"
  ],
  [
   "03155",
   "Northeim (Landkreis/Kreis)"
  ],
  [
   "03157",
   "Peine (Landkreis/Kreis)"
  ],
  [
   "03158",
   "Wolfenbüttel (Landkreis/Kreis)"
  ],
  [
   "03159",
   "Göttingen (Landkreis/Kreis)"
  ],
  [
   "03241",
   "Region Hannover (Landkreis/Kreis)"
  ],
  [
   "03251",
   "Diepholz (Landkreis/Kreis)"
  ],
  [
   "03252",
   "Hameln-Pyrmont (Landkreis/Kreis)"
  ],
  [
   "03254",
   "Hildesheim (Landkreis/Kreis)"
  ],
  [
   "03255",
   "Holzminden (Landkreis/Kreis)"
  ],
  [
   "03256",
   "Nienburg (Weser) (Landkreis/Kreis)"
  ],
  [
   "03257",
   "Schaumburg (Landkreis/Kreis)"
  ],
  [
   "03351",
   "Celle (Landkreis/Kreis)"
  ],
  [
   "03352",
   "Cuxhaven (Landkreis/Kreis)"
  ],
  [
   "03353",
   "Harburg (Landkreis/Kreis)"
  ],
  [
   "03354",
   "Lüchow-Dannenberg (Landkreis/Kreis)"
  ],
  [
   "03355",
   "Lüneburg (Landkreis/Kreis)"
  ],
  [
   "03356",
   "Osterholz (Landkreis/Kreis)"
  ],
  [
   "03357",
   "Rotenburg (Wümme) (Landkreis/Kreis)"
  ],
  [
   "03358",
   "Heidekreis (Landkreis/Kreis)"
  ],
  [
   "03359",
   "Stade (Landkreis/Kreis)"
  ],
  [
   "03360",
   "Uelzen (Landkreis/Kreis)"
  ],
  [
   "03361",
   "Verden (Landkreis/Kreis)"
  ],
  [
   "03401",
   "Delmenhorst (kreisfreie Stadt)"
  ],
  [
   "03402",
   "Emden (kreisfreie Stadt)"
  ],
  [
   "03403",
   "Oldenburg (Oldenburg) (kreisfreie Stadt)"
  ],
  [
   "03404",
   "Osnabrück (kreisfreie Stadt)"
  ],
  [
   "03405",
   "Wilhelmshaven (kreisfreie Stadt)"
  ],
  [
   "03451",
   "Ammerland (Landkreis/Kreis)"
  ],
  [
   "03452",
   "Aurich (Landkreis/Kreis)"
  ],
  [
   "03453",
   "Cloppenburg (Landkreis/Kreis)"
  ],
  [
   "03454",
   "Emsland (Landkreis/Kreis)"
  ],
  [
   "03455",
   "Friesland (Landkreis/Kreis)"
  ],
  [
   "03456",
   "Grafschaft Bentheim (Landkreis/Kreis)"
  ],
  [
   "03457",
   "Leer (Landkreis/Kreis)"
  ],
  [
   "03458",
   "Oldenburg (Landkreis/Kreis)"
  ],
  [
   "03459",
   "Osnabrück (Landkreis/Kreis)"
  ],
  [
   "03460",
   "Vechta (Landkreis/Kreis)"
  ],
  [
   "03461",
   "Wesermarsch (Landkreis/Kreis)"
  ],
  [
   "03462",
   "Wittmund (Landkreis/Kreis)"
  ]
 ],
 "04": [
  [
   "04011",
   "Bremen (kreisfreie Stadt)"
  ],
  [
   "04012",
   "Bremerhaven (kreisfreie Stadt)"
  ]
 ],
 "05": [
  [
   "05111",
   "Düsseldorf (kreisfreie Stadt)"
  ],
  [
   "05112",
   "Duisburg (kreisfreie Stadt)"
  ],
  [
   "05113",
   "Essen (kreisfreie Stadt)"
  ],
  [
   "05114",
   "Krefeld (kreisfreie Stadt)"
  ],
  [
   "05116",
   "Mönchengladbach (kreisfreie Stadt)"
  ],
  [
   "05117",
   "Mülheim an der Ruhr (kreisfreie Stadt)"
  ],
  [
   "05119",
   "Oberhausen (kreisfreie Stadt)"
  ],
  [
   "05120",
   "Remscheid (kreisfreie Stadt)"
  ],
  [
   "05122",
   "Solingen, Klingenstadt (kreisfreie Stadt)"
  ],
  [
   "05124",
   "Wuppertal (kreisfreie Stadt)"
  ],
  [
   "05154",
   "Kleve (Landkreis/Kreis)"
  ],
  [
   "05158",
   "Mettmann (Landkreis/Kreis)"
  ],
  [
   "05162",
   "Rhein-Kreis Neuss (Landkreis/Kreis)"
  ],
  [
   "05166",
   "Viersen (Landkreis/Kreis)"
  ],
  [
   "05170",
   "Wesel (Landkreis/Kreis)"
  ],
  [
   "05314",
   "Bonn (kreisfreie Stadt)"
  ],
  [
   "05315",
   "Köln (kreisfreie Stadt)"
  ],
  [
   "05316",
   "Leverkusen (kreisfreie Stadt)"
  ],
  [
   "05334",
   "Städteregion Aachen (Landkreis/Kreis)"
  ],
  [
   "05358",
   "Düren (Landkreis/Kreis)"
  ],
  [
   "05362",
   "Rhein-Erft-Kreis (Landkreis/Kreis)"
  ],
  [
   "05366",
   "Euskirchen (Landkreis/Kreis)"
  ],
  [
   "05370",
   "Heinsberg (Landkreis/Kreis)"
  ],
  [
   "05374",
   "Oberbergischer Kreis (Landkreis/Kreis)"
  ],
  [
   "05378",
   "Rheinisch-Bergischer Kreis (Landkreis/Kreis)"
  ],
  [
   "05382",
   "Rhein-Sieg-Kreis (Landkreis/Kreis)"
  ],
  [
   "05512",
   "Bottrop (kreisfreie Stadt)"
  ],
  [
   "05513",
   "Gelsenkirchen (kreisfreie Stadt)"
  ],
  [
   "05515",
   "Münster (kreisfreie Stadt)"
  ],
  [
   "05554",
   "Borken (Landkreis/Kreis)"
  ],
  [
   "05558",
   "Coesfeld (Landkreis/Kreis)"
  ],
  [
   "05562",
   "Recklinghausen (Landkreis/Kreis)"
  ],
  [
   "05566",
   "Steinfurt (Landkreis/Kreis)"
  ],
  [
   "05570",
   "Warendorf (Landkreis/Kreis)"
  ],
  [
   "05711",
   "Bielefeld (kreisfreie Stadt)"
  ],
  [
   "05754",
   "Gütersloh (Landkreis/Kreis)"
  ],
  [
   "05758",
   "Herford (Landkreis/Kreis)"
  ],
  [
   "05762",
   "Höxter (Landkreis/Kreis)"
  ],
  [
   "05766",
   "Lippe (Landkreis/Kreis)"
  ],
  [
   "05770",
   "Minden-Lübbecke (Landkreis/Kreis)"
  ],
  [
   "05774",
   "Paderborn (Landkreis/Kreis)"
  ],
  [
   "05911",
   "Bochum (kreisfreie Stadt)"
  ],
  [
   "05913",
   "Dortmund (kreisfreie Stadt)"
  ],
  [
   "05914",
   "Hagen, Stadt der FernUniversität (kreisfreie Stadt)"
  ],
  [
   "05915",
   "Hamm (kreisfreie Stadt)"
  ],
  [
   "05916",
   "Herne (kreisfreie Stadt)"
  ],
  [
   "05954",
   "Ennepe-Ruhr-Kreis (Landkreis/Kreis)"
  ],
  [
   "05958",
   "Hochsauerlandkreis (Landkreis/Kreis)"
  ],
  [
   "05962",
   "Märkischer Kreis (Landkreis/Kreis)"
  ],
  [
   "05966",
   "Olpe (Landkreis/Kreis)"
  ],
  [
   "05970",
   "Siegen-Wittgenstein (Landkreis/Kreis)"
  ],
  [
   "05974",
   "Soest (Landkreis/Kreis)"
  ],
  [
   "05978",
   "Unna (Landkreis/Kreis)"
  ]
 ],
 "06": [
  [
   "06411",
   "Darmstadt, Wissenschaftsstadt (kreisfreie Stadt)"
  ],
  [
   "06412",
   "Frankfurt am Main (kreisfreie Stadt)"
  ],
  [
   "06413",
   "Offenbach am Main (kreisfreie Stadt)"
  ],
  [
   "06414",
   "Wiesbaden (kreisfreie Stadt)"
  ],
  [
   "06415",
   "Hanau, Brüder-Grimm-Stadt (kreisfreie Stadt)"
  ],
  [
   "06431",
   "Bergstraße (Landkreis/Kreis)"
  ],
  [
   "06432",
   "Darmstadt-Dieburg (Landkreis/Kreis)"
  ],
  [
   "06433",
   "Groß-Gerau (Landkreis/Kreis)"
  ],
  [
   "06434",
   "Hochtaunuskreis (Landkreis/Kreis)"
  ],
  [
   "06435",
   "Main-Kinzig-Kreis (Landkreis/Kreis)"
  ],
  [
   "06436",
   "Main-Taunus-Kreis (Landkreis/Kreis)"
  ],
  [
   "06437",
   "Odenwaldkreis (Landkreis/Kreis)"
  ],
  [
   "06438",
   "Offenbach (Landkreis/Kreis)"
  ],
  [
   "06439",
   "Rheingau-Taunus-Kreis (Landkreis/Kreis)"
  ],
  [
   "06440",
   "Wetteraukreis (Landkreis/Kreis)"
  ],
  [
   "06531",
   "Gießen (Landkreis/Kreis)"
  ],
  [
   "06532",
   "Lahn-Dill-Kreis (Landkreis/Kreis)"
  ],
  [
   "06533",
   "Limburg-Weilburg (Landkreis/Kreis)"
  ],
  [
   "06534",
   "Marburg-Biedenkopf (Landkreis/Kreis)"
  ],
  [
   "06535",
   "Vogelsbergkreis (Landkreis/Kreis)"
  ],
  [
   "06611",
   "Kassel, documenta-Stadt (kreisfreie Stadt)"
  ],
  [
   "06631",
   "Fulda (Landkreis/Kreis)"
  ],
  [
   "06632",
   "Hersfeld-Rotenburg (Landkreis/Kreis)"
  ],
  [
   "06633",
   "Kassel (Landkreis/Kreis)"
  ],
  [
   "06634",
   "Schwalm-Eder-Kreis (Landkreis/Kreis)"
  ],
  [
   "06635",
   "Waldeck-Frankenberg (Landkreis/Kreis)"
  ],
  [
   "06636",
   "Werra-Meißner-Kreis (Landkreis/Kreis)"
  ]
 ],
 "07": [
  [
   "07111",
   "Koblenz, kreisfreie Stadt (kreisfreie Stadt)"
  ],
  [
   "07131",
   "Ahrweiler (Landkreis/Kreis)"
  ],
  [
   "07132",
   "Altenkirchen (Westerwald) (Landkreis/Kreis)"
  ],
  [
   "07133",
   "Bad Kreuznach (Landkreis/Kreis)"
  ],
  [
   "07134",
   "Birkenfeld (Landkreis/Kreis)"
  ],
  [
   "07135",
   "Cochem-Zell (Landkreis/Kreis)"
  ],
  [
   "07137",
   "Mayen-Koblenz (Landkreis/Kreis)"
  ],
  [
   "07138",
   "Neuwied (Landkreis/Kreis)"
  ],
  [
   "07140",
   "Rhein-Hunsrück-Kreis (Landkreis/Kreis)"
  ],
  [
   "07141",
   "Rhein-Lahn-Kreis (Landkreis/Kreis)"
  ],
  [
   "07143",
   "Westerwaldkreis (Landkreis/Kreis)"
  ],
  [
   "07211",
   "Trier, kreisfreie Stadt (kreisfreie Stadt)"
  ],
  [
   "07231",
   "Bernkastel-Wittlich (Landkreis/Kreis)"
  ],
  [
   "07232",
   "Eifelkreis Bitburg-Prüm (Landkreis/Kreis)"
  ],
  [
   "07233",
   "Vulkaneifel (Landkreis/Kreis)"
  ],
  [
   "07235",
   "Trier-Saarburg (Landkreis/Kreis)"
  ],
  [
   "07311",
   "Frankenthal (Pfalz), kreisfreie Stadt (kreisfreie Stadt)"
  ],
  [
   "07312",
   "Kaiserslautern, kreisfreie Stadt (kreisfreie Stadt)"
  ],
  [
   "07313",
   "Landau in der Pfalz, kreisfreie Stadt (kreisfreie Stadt)"
  ],
  [
   "07314",
   "Ludwigshafen am Rhein, kreisfreie Stadt (kreisfreie Stadt)"
  ],
  [
   "07315",
   "Mainz, kreisfreie Stadt (kreisfreie Stadt)"
  ],
  [
   "07316",
   "Neustadt an der Weinstraße, kreisfreie Stadt (kreisfreie Stadt)"
  ],
  [
   "07317",
   "Pirmasens, kreisfreie Stadt (kreisfreie Stadt)"
  ],
  [
   "07318",
   "Speyer, kreisfreie Stadt (kreisfreie Stadt)"
  ],
  [
   "07319",
   "Worms, kreisfreie Stadt (kreisfreie Stadt)"
  ],
  [
   "07320",
   "Zweibrücken, kreisfreie Stadt (kreisfreie Stadt)"
  ],
  [
   "07331",
   "Alzey-Worms (Landkreis/Kreis)"
  ],
  [
   "07332",
   "Bad Dürkheim (Landkreis/Kreis)"
  ],
  [
   "07333",
   "Donnersbergkreis (Landkreis/Kreis)"
  ],
  [
   "07334",
   "Germersheim (Landkreis/Kreis)"
  ],
  [
   "07335",
   "Kaiserslautern (Landkreis/Kreis)"
  ],
  [
   "07336",
   "Kusel (Landkreis/Kreis)"
  ],
  [
   "07337",
   "Südliche Weinstraße (Landkreis/Kreis)"
  ],
  [
   "07338",
   "Rhein-Pfalz-Kreis (Landkreis/Kreis)"
  ],
  [
   "07339",
   "Mainz-Bingen (Landkreis/Kreis)"
  ],
  [
   "07340",
   "Südwestpfalz (Landkreis/Kreis)"
  ]
 ],
 "08": [
  [
   "08111",
   "Stuttgart (kreisfreie Stadt)"
  ],
  [
   "08115",
   "Böblingen (Landkreis/Kreis)"
  ],
  [
   "08116",
   "Esslingen (Landkreis/Kreis)"
  ],
  [
   "08117",
   "Göppingen (Landkreis/Kreis)"
  ],
  [
   "08118",
   "Ludwigsburg (Landkreis/Kreis)"
  ],
  [
   "08119",
   "Rems-Murr-Kreis (Landkreis/Kreis)"
  ],
  [
   "08121",
   "Heilbronn (kreisfreie Stadt)"
  ],
  [
   "08125",
   "Heilbronn (Landkreis/Kreis)"
  ],
  [
   "08126",
   "Hohenlohekreis (Landkreis/Kreis)"
  ],
  [
   "08127",
   "Schwäbisch Hall (Landkreis/Kreis)"
  ],
  [
   "08128",
   "Main-Tauber-Kreis (Landkreis/Kreis)"
  ],
  [
   "08135",
   "Heidenheim (Landkreis/Kreis)"
  ],
  [
   "08136",
   "Ostalbkreis (Landkreis/Kreis)"
  ],
  [
   "08211",
   "Baden-Baden (kreisfreie Stadt)"
  ],
  [
   "08212",
   "Karlsruhe (kreisfreie Stadt)"
  ],
  [
   "08215",
   "Karlsruhe (Landkreis/Kreis)"
  ],
  [
   "08216",
   "Rastatt (Landkreis/Kreis)"
  ],
  [
   "08221",
   "Heidelberg (kreisfreie Stadt)"
  ],
  [
   "08222",
   "Mannheim (kreisfreie Stadt)"
  ],
  [
   "08225",
   "Neckar-Odenwald-Kreis (Landkreis/Kreis)"
  ],
  [
   "08226",
   "Rhein-Neckar-Kreis (Landkreis/Kreis)"
  ],
  [
   "08231",
   "Pforzheim (kreisfreie Stadt)"
  ],
  [
   "08235",
   "Calw (Landkreis/Kreis)"
  ],
  [
   "08236",
   "Enzkreis (Landkreis/Kreis)"
  ],
  [
   "08237",
   "Freudenstadt (Landkreis/Kreis)"
  ],
  [
   "08311",
   "Freiburg im Breisgau (kreisfreie Stadt)"
  ],
  [
   "08315",
   "Breisgau-Hochschwarzwald (Landkreis/Kreis)"
  ],
  [
   "08316",
   "Emmendingen (Landkreis/Kreis)"
  ],
  [
   "08317",
   "Ortenaukreis (Landkreis/Kreis)"
  ],
  [
   "08325",
   "Rottweil (Landkreis/Kreis)"
  ],
  [
   "08326",
   "Schwarzwald-Baar-Kreis (Landkreis/Kreis)"
  ],
  [
   "08327",
   "Tuttlingen (Landkreis/Kreis)"
  ],
  [
   "08335",
   "Konstanz (Landkreis/Kreis)"
  ],
  [
   "08336",
   "Lörrach (Landkreis/Kreis)"
  ],
  [
   "08337",
   "Waldshut (Landkreis/Kreis)"
  ],
  [
   "08415",
   "Reutlingen (Landkreis/Kreis)"
  ],
  [
   "08416",
   "Tübingen (Landkreis/Kreis)"
  ],
  [
   "08417",
   "Zollernalbkreis (Landkreis/Kreis)"
  ],
  [
   "08421",
   "Ulm (kreisfreie Stadt)"
  ],
  [
   "08425",
   "Alb-Donau-Kreis (Landkreis/Kreis)"
  ],
  [
   "08426",
   "Biberach (Landkreis/Kreis)"
  ],
  [
   "08435",
   "Bodenseekreis (Landkreis/Kreis)"
  ],
  [
   "08436",
   "Ravensburg (Landkreis/Kreis)"
  ],
  [
   "08437",
   "Sigmaringen (Landkreis/Kreis)"
  ]
 ],
 "09": [
  [
   "09161",
   "Ingolstadt (kreisfreie Stadt)"
  ],
  [
   "09162",
   "München (kreisfreie Stadt)"
  ],
  [
   "09163",
   "Rosenheim (kreisfreie Stadt)"
  ],
  [
   "09171",
   "Altötting (Landkreis/Kreis)"
  ],
  [
   "09172",
   "Berchtesgadener Land (Landkreis/Kreis)"
  ],
  [
   "09173",
   "Bad Tölz-Wolfratshausen (Landkreis/Kreis)"
  ],
  [
   "09174",
   "Dachau (Landkreis/Kreis)"
  ],
  [
   "09175",
   "Ebersberg (Landkreis/Kreis)"
  ],
  [
   "09176",
   "Eichstätt (Landkreis/Kreis)"
  ],
  [
   "09177",
   "Erding (Landkreis/Kreis)"
  ],
  [
   "09178",
   "Freising (Landkreis/Kreis)"
  ],
  [
   "09179",
   "Fürstenfeldbruck (Landkreis/Kreis)"
  ],
  [
   "09180",
   "Garmisch-Partenkirchen (Landkreis/Kreis)"
  ],
  [
   "09181",
   "Landsberg am Lech (Landkreis/Kreis)"
  ],
  [
   "09182",
   "Miesbach (Landkreis/Kreis)"
  ],
  [
   "09183",
   "Mühldorf a.Inn (Landkreis/Kreis)"
  ],
  [
   "09184",
   "München (Landkreis/Kreis)"
  ],
  [
   "09185",
   "Neuburg-Schrobenhausen (Landkreis/Kreis)"
  ],
  [
   "09186",
   "Pfaffenhofen a.d.Ilm (Landkreis/Kreis)"
  ],
  [
   "09187",
   "Rosenheim (Landkreis/Kreis)"
  ],
  [
   "09188",
   "Starnberg (Landkreis/Kreis)"
  ],
  [
   "09189",
   "Traunstein (Landkreis/Kreis)"
  ],
  [
   "09190",
   "Weilheim-Schongau (Landkreis/Kreis)"
  ],
  [
   "09261",
   "Landshut (kreisfreie Stadt)"
  ],
  [
   "09262",
   "Passau (kreisfreie Stadt)"
  ],
  [
   "09263",
   "Straubing (kreisfreie Stadt)"
  ],
  [
   "09271",
   "Deggendorf (Landkreis/Kreis)"
  ],
  [
   "09272",
   "Freyung-Grafenau (Landkreis/Kreis)"
  ],
  [
   "09273",
   "Kelheim (Landkreis/Kreis)"
  ],
  [
   "09274",
   "Landshut (Landkreis/Kreis)"
  ],
  [
   "09275",
   "Passau (Landkreis/Kreis)"
  ],
  [
   "09276",
   "Regen (Landkreis/Kreis)"
  ],
  [
   "09277",
   "Rottal-Inn (Landkreis/Kreis)"
  ],
  [
   "09278",
   "Straubing-Bogen (Landkreis/Kreis)"
  ],
  [
   "09279",
   "Dingolfing-Landau (Landkreis/Kreis)"
  ],
  [
   "09361",
   "Amberg (kreisfreie Stadt)"
  ],
  [
   "09362",
   "Regensburg (kreisfreie Stadt)"
  ],
  [
   "09363",
   "Weiden i.d.OPf. (kreisfreie Stadt)"
  ],
  [
   "09371",
   "Amberg-Sulzbach (Landkreis/Kreis)"
  ],
  [
   "09372",
   "Cham (Landkreis/Kreis)"
  ],
  [
   "09373",
   "Neumarkt i.d.OPf. (Landkreis/Kreis)"
  ],
  [
   "09374",
   "Neustadt a.d.Waldnaab (Landkreis/Kreis)"
  ],
  [
   "09375",
   "Regensburg (Landkreis/Kreis)"
  ],
  [
   "09376",
   "Schwandorf (Landkreis/Kreis)"
  ],
  [
   "09377",
   "Tirschenreuth (Landkreis/Kreis)"
  ],
  [
   "09461",
   "Bamberg (kreisfreie Stadt)"
  ],
  [
   "09462",
   "Bayreuth (kreisfreie Stadt)"
  ],
  [
   "09463",
   "Coburg (kreisfreie Stadt)"
  ],
  [
   "09464",
   "Hof (kreisfreie Stadt)"
  ],
  [
   "09471",
   "Bamberg (Landkreis/Kreis)"
  ],
  [
   "09472",
   "Bayreuth (Landkreis/Kreis)"
  ],
  [
   "09473",
   "Coburg (Landkreis/Kreis)"
  ],
  [
   "09474",
   "Forchheim (Landkreis/Kreis)"
  ],
  [
   "09475",
   "Hof (Landkreis/Kreis)"
  ],
  [
   "09476",
   "Kronach (Landkreis/Kreis)"
  ],
  [
   "09477",
   "Kulmbach (Landkreis/Kreis)"
  ],
  [
   "09478",
   "Lichtenfels (Landkreis/Kreis)"
  ],
  [
   "09479",
   "Wunsiedel i.Fichtelgebirge (Landkreis/Kreis)"
  ],
  [
   "09561",
   "Ansbach (kreisfreie Stadt)"
  ],
  [
   "09562",
   "Erlangen (kreisfreie Stadt)"
  ],
  [
   "09563",
   "Fürth (kreisfreie Stadt)"
  ],
  [
   "09564",
   "Nürnberg (kreisfreie Stadt)"
  ],
  [
   "09565",
   "Schwabach (kreisfreie Stadt)"
  ],
  [
   "09571",
   "Ansbach (Landkreis/Kreis)"
  ],
  [
   "09572",
   "Erlangen-Höchstadt (Landkreis/Kreis)"
  ],
  [
   "09573",
   "Fürth (Landkreis/Kreis)"
  ],
  [
   "09574",
   "Nürnberger Land (Landkreis/Kreis)"
  ],
  [
   "09575",
   "Neustadt a.d.Aisch-Bad Windsheim (Landkreis/Kreis)"
  ],
  [
   "09576",
   "Roth (Landkreis/Kreis)"
  ],
  [
   "09577",
   "Weißenburg-Gunzenhausen (Landkreis/Kreis)"
  ],
  [
   "09661",
   "Aschaffenburg (kreisfreie Stadt)"
  ],
  [
   "09662",
   "Schweinfurt (kreisfreie Stadt)"
  ],
  [
   "09663",
   "Würzburg (kreisfreie Stadt)"
  ],
  [
   "09671",
   "Aschaffenburg (Landkreis/Kreis)"
  ],
  [
   "09672",
   "Bad Kissingen (Landkreis/Kreis)"
  ],
  [
   "09673",
   "Rhön-Grabfeld (Landkreis/Kreis)"
  ],
  [
   "09674",
   "Haßberge (Landkreis/Kreis)"
  ],
  [
   "09675",
   "Kitzingen (Landkreis/Kreis)"
  ],
  [
   "09676",
   "Miltenberg (Landkreis/Kreis)"
  ],
  [
   "09677",
   "Main-Spessart (Landkreis/Kreis)"
  ],
  [
   "09678",
   "Schweinfurt (Landkreis/Kreis)"
  ],
  [
   "09679",
   "Würzburg (Landkreis/Kreis)"
  ],
  [
   "09761",
   "Augsburg (kreisfreie Stadt)"
  ],
  [
   "09762",
   "Kaufbeuren (kreisfreie Stadt)"
  ],
  [
   "09763",
   "Kempten (Allgäu) (kreisfreie Stadt)"
  ],
  [
   "09764",
   "Memmingen (kreisfreie Stadt)"
  ],
  [
   "09771",
   "Aichach-Friedberg (Landkreis/Kreis)"
  ],
  [
   "09772",
   "Augsburg (Landkreis/Kreis)"
  ],
  [
   "09773",
   "Dillingen a.d.Donau (Landkreis/Kreis)"
  ],
  [
   "09774",
   "Günzburg (Landkreis/Kreis)"
  ],
  [
   "09775",
   "Neu-Ulm (Landkreis/Kreis)"
  ],
  [
   "09776",
   "Lindau (Bodensee) (Landkreis/Kreis)"
  ],
  [
   "09777",
   "Ostallgäu (Landkreis/Kreis)"
  ],
  [
   "09778",
   "Unterallgäu (Landkreis/Kreis)"
  ],
  [
   "09779",
   "Donau-Ries (Landkreis/Kreis)"
  ],
  [
   "09780",
   "Oberallgäu (Landkreis/Kreis)"
  ]
 ]
};
