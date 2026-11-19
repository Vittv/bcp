// english wikipedia articles for the 1662 English and 1962 Canadian
// calendars, keyed by the shared registry slug. only verified titles belong
// here; an entry without an article falls back to a wikipedia search.
export type OlderFeastWikiLink = {
  /** english wikipedia article title. */
  title: string;
  /** label shown in the app, defaults to the article title. */
  label?: string;
};

export const OLDER_FEAST_WIKI: Record<string, OlderFeastWikiLink[]> = {
  "nativity-of-mary": [
    { title: "Nativity of Mary", label: "Nativity of the Blessed Virgin Mary" },
  ],
  christmas: [{ title: "Christmas", label: "Christmas Day" }],
  "circumcision-of-our-lord": [
    { title: "Circumcision of Jesus", label: "Circumcision of our Lord" },
  ],
  epiphany: [{ title: "Epiphany (holiday)", label: "Epiphany" }],
  "st-philip-and-st-james": [
    { title: "Philip the Apostle", label: "St Philip" },
    { title: "James, son of Alphaeus", label: "St James" },
  ],
  "the-invention-of-the-holy-cross": [
    { title: "Feast of the Cross", label: "Invention of the Holy Cross" },
  ],
  "holy-name": [
    { title: "Feast of the Holy Name of Jesus", label: "The Name of Jesus" },
  ],
  "conception-of-mary": [
    {
      title: "Immaculate Conception",
      label: "Conception of the Blessed Virgin Mary",
    },
  ],
  "lucian-pr-mart": [
    { title: "Lucian of Antioch", label: "Lucian of Antioch" },
  ],
  "hilarie-b-conf": [
    { title: "Hilary of Poitiers", label: "Hilary of Poitiers" },
  ],
  "prisca-rom-virg-mart": [{ title: "Saint Prisca", label: "Saint Prisca" }],
  "fabian-b-of-rome-mart": [
    { title: "Pope Fabian", label: "Fabian, Bishop of Rome" },
  ],
  "agnes-rom-virg-mart": [{ title: "Agnes of Rome", label: "Agnes of Rome" }],
  "vincent-span-deac-m": [
    { title: "Vincent of Saragossa", label: "Vincent of Saragossa" },
  ],
  "k-charles-mart": [
    { title: "Charles I of England", label: "Charles I, King and Martyr" },
  ],
  "blasius-an-armen-b-m": [{ title: "Saint Blaise", label: "Saint Blaise" }],
  "agatha-a-sicilian-v-m": [
    { title: "Agatha of Sicily", label: "Agatha of Sicily" },
  ],
  "valentine-bish-m": [
    { title: "Saint Valentine", label: "Valentine, Bishop and Martyr" },
  ],
  "david-arch-b-of-menevia": [
    { title: "Saint David", label: "David of Wales" },
  ],
  "cedde-or-chad-b-of-litchf": [
    { title: "Chad of Mercia", label: "Chad, Bishop of Lichfield" },
  ],
  "perpetua-mauritan-m": [
    { title: "Perpetua and Felicity", label: "Perpetua of Carthage" },
  ],
  "gregorio-m-b-of-rome-c": [
    { title: "Pope Gregory I", label: "Gregory the Great" },
  ],
  "edward-k-of-ye-west-saxons": [
    { title: "Edward the Martyr", label: "Edward, King of the West Saxons" },
  ],
  "benedict-abbot": [
    { title: "Benedict of Nursia", label: "Benedict of Nursia" },
  ],
  "richard-b-of-chichester": [
    { title: "Richard of Chichester", label: "Richard, Bishop of Chichester" },
  ],
  "ambrose-b-of-millan": [{ title: "Ambrose", label: "Ambrose of Milan" }],
  "alphege-arch-b-of-cant": [
    {
      title: "Ælfheah of Canterbury",
      label: "Alphege, Archbishop of Canterbury",
    },
  ],
  "s-george-m": [{ title: "Saint George", label: "Saint George" }],
  "invention-of-the-cross": [
    { title: "Feast of the Cross", label: "Invention of the Cross" },
  ],
  "s-john-evang-ante-port-latin": [
    { title: "John the Apostle", label: "John the Evangelist" },
  ],
  "dunstan-arch-b-of-cant": [
    { title: "Dunstan", label: "Dunstan, Archbishop of Canterbury" },
  ],
  "aug-ye-first-arch-b-of-cant": [
    { title: "Augustine of Canterbury", label: "Augustine of Canterbury" },
  ],
  "ven-bede-pr": [{ title: "Bede", label: "Bede the Venerable" }],
  "ch-ii-nat-et-ret": [{ title: "Charles II of England", label: "Charles II" }],
  "nicomede-rom-pr-m": [{ title: "Saint Nicomedes", label: "Saint Nicomedes" }],
  "boniface-b-of-mentz-m": [
    { title: "Saint Boniface", label: "Boniface, Bishop of Mainz" },
  ],
  "s-alban-m": [{ title: "Saint Alban", label: "Saint Alban" }],
  "transl-of-edwd-k-of-ye-w-sax": [
    { title: "Edward the Martyr", label: "Edward, King of the West Saxons" },
  ],
  "transl-of-s-martin-b-c": [
    { title: "Martin of Tours", label: "Martin of Tours" },
  ],
  "swithun-b-of-winch-transl": [{ title: "Swithun" }],
  "margaret-v-m-at-antioch": [
    { title: "Margaret the Virgin", label: "Margaret of Antioch" },
  ],
  "s-marie-magdalen": [{ title: "Mary Magdalene" }],
  "s-anne-mother-to-ye-bl-v-m": [{ title: "Saint Anne" }],
  "lammas-day": [{ title: "Lammas" }],
  "transfigur-of-our-lord": [{ title: "Transfiguration of Jesus" }],
  "s-laur-arch-d-of-rome-m": [
    { title: "Saint Lawrence", label: "Laurence of Rome" },
  ],
  fast: [{ title: "Fasting" }],
  "s-aug-b-of-hippo-c-d": [{ title: "Augustine of Hippo" }],
  "behead-of-s-john-bapt": [
    {
      title: "Beheading of John the Baptist",
      label: "Beheading of St John the Baptist",
    },
  ],
  "giles-abbot-conf": [{ title: "Giles" }],
  "enurchus-b-of-orleans": [
    { title: "Euverte d'Orléans", label: "Evurtius of Orléans" },
  ],
  "nativ-of-ye-bl-virg-mary": [
    { title: "Nativity of Mary", label: "Nativity of the Blessed Virgin Mary" },
  ],
  "lambert-b-m": [{ title: "Lambert of Maastricht" }],
  "s-cypr-ar-b-of-carth-m": [{ title: "Cyprian" }],
  "s-hierome-pr-conf-doct": [{ title: "Jerome" }],
  "remigius-b-of-rhemes": [
    { title: "Saint Remigius", label: "Remigius of Reims" },
  ],
  "faith-virg-m": [{ title: "Saint Faith", label: "Faith of Conques" }],
  "s-denys-areop-b-m": [{ title: "Dionysius the Areopagite" }],
  "transl-of-k-edward-conf": [{ title: "Edward the Confessor" }],
  "ethelrede-virg": [{ title: "Æthelthryth", label: "Ethelreda (Audrey)" }],
  "crispine-mart": [{ title: "Crispin and Crispinian", label: "Crispin" }],
  "papists-conspiracy": [{ title: "Gunpowder Plot" }],
  "leonard-confess": [{ title: "Leonard of Noblac" }],
  "s-martin-b-conf": [{ title: "Martin of Tours" }],
  "britius-bishop": [{ title: "Brice of Tours" }],
  "machutus-b": [{ title: "Malo (saint)", label: "Machutus (Saint Malo)" }],
  "hugh-b-of-lincoln": [{ title: "Hugh of Lincoln" }],
  "cecilia-virg-m": [{ title: "Cecilia of Rome", label: "Cecilia" }],
  "s-clemt-1-b-of-r-m": [{ title: "Clement of Rome", label: "Clement I" }],
  "catherine-virg-m": [{ title: "Catherine of Alexandria" }],
  "nicholas-b-of-myra-in-lycia": [
    { title: "Saint Nicholas", label: "Nicholas of Myra" },
  ],
  "concep-of-ye-bl-v-mary": [
    {
      title: "Immaculate Conception",
      label: "Conception of the Blessed Virgin Mary",
    },
  ],
  "lucie-virg-m": [{ title: "Saint Lucy", label: "Lucy of Syracuse" }],
  "o-sapientia": [{ title: "O Antiphons", label: "O Sapientia" }],
  "silvester-b-of-rome": [{ title: "Pope Sylvester I", label: "Silvester I" }],
  "the-octave-day-of-christmas-and-circumcision-of-our-lord-being-new-year-s-day":
    [{ title: "Circumcision of Jesus", label: "Circumcision of our Lord" }],
  "william-laud-archbishop-of-canterbury-martyr-1645": [
    { title: "William Laud" },
  ],
  "benedict-biscop-abbot-and-scholar-689": [{ title: "Benedict Biscop" }],
  "john-horden-missionary-first-bishop-of-moosonee-1893": [
    { title: "John Horden" },
  ],
  "the-octave-day-of-the-epiphany": [{ title: "Octave (liturgy)" }],
  "hilary-doctor-bishop-of-poitiers-france-368": [
    { title: "Hilary of Poitiers" },
  ],
  "henry-missionary-bishop-in-finland-1150": [
    { title: "Henry (bishop of Finland)" },
  ],
  "agnes-virgin-and-martyr-rome-c-304": [{ title: "Agnes of Rome" }],
  "vincent-deacon-and-martyr-spain-c-304": [{ title: "Vincent of Saragossa" }],
  "st-timothy-and-st-titus-apostolic-men": [
    { title: "Saint Timothy" },
    { title: "Saint Titus" },
  ],
  "polycarp-bishop-of-smyrna-apostolic-man-martyr-155-or-156": [
    { title: "Polycarp" },
  ],
  "john-chrysostom-doctor-bishop-of-constantinople-407": [
    { title: "John Chrysostom" },
  ],
  "charles-stuart-king-beheaded-1649": [{ title: "Charles I of England" }],
  "anskar-missionary-first-bishop-in-sweden-864": [{ title: "Ansgar" }],
  "c-dmon-first-recorded-christian-poet-in-england-c-680": [
    { title: "Cædmon" },
  ],
  "valentine-bishop-and-martyr": [{ title: "Saint Valentine" }],
  "lindel-tsen-bishop-in-china-consecrated-1929-and-paul-sasaki-bishop-in-japan-consecrated-1935":
    [{ title: "Lindel Tsen" }, { title: "Paul Shinji Sasaki" }],
  "george-herbert-pastor-and-poet-1633": [{ title: "George Herbert" }],
  "st-david-of-wales-archbishop-of-menevia-c-544": [{ title: "Saint David" }],
  "chad-missionary-and-first-bishop-of-lichfield-672": [
    { title: "Chad of Mercia" },
  ],
  "john-wesley-preacher-1791-charles-wesley-poet-1788": [
    { title: "John Wesley" },
    { title: "Charles Wesley" },
  ],
  "perpetua-and-her-companions-martyrs-africa-203": [
    { title: "Perpetua and Felicity" },
  ],
  "thomas-aquinas-doctor-and-poet-1274": [{ title: "Thomas Aquinas" }],
  "gregory-the-great-doctor-bishop-of-rome-604": [{ title: "Pope Gregory I" }],
  "st-patrick-of-ireland-missionary-and-bishop-461": [
    { title: "Saint Patrick" },
  ],
  "thomas-ken-bishop-of-bath-and-wells-poet-1711": [{ title: "Thomas Ken" }],
  "cuthbert-missionary-bishop-of-lindisfarne-687": [{ title: "Cuthbert" }],
  "benedict-abbot-of-monte-cassino-italy-c-540": [
    { title: "Benedict of Nursia" },
  ],
  "thomas-cranmer-translator-and-reviser-of-the-liturgy-archbishop-of-canterbury-martyr-1556":
    [{ title: "Thomas Cranmer" }],
  "john-keble-of-oxford-scholar-and-poet-1866": [{ title: "John Keble" }],
  "henry-budd-first-north-american-indian-to-be-ordained-to-the-ministry-1850":
    [{ title: "Henry Budd" }],
  "richard-bishop-of-chichester-1253": [{ title: "Richard of Chichester" }],
  "reginald-heber-bishop-in-india-poet-1826": [{ title: "Reginald Heber" }],
  "ambrose-doctor-and-poet-bishop-of-milan-397": [{ title: "Ambrose" }],
  "leo-the-great-doctor-bishop-of-rome-461": [{ title: "Pope Leo I" }],
  "alphege-archbishop-of-canterbury-martyr-1012": [
    { title: "Ælfheah of Canterbury" },
  ],
  "anselm-doctor-archbishop-of-canterbury-1109": [
    { title: "Anselm of Canterbury" },
  ],
  "st-george-of-england-martyr-c-304": [{ title: "Saint George" }],
  "st-james-the-brother-of-the-lord-martyr-62": [
    { title: "James, brother of Jesus" },
  ],
  "athanasius-doctor-bishop-of-alexandria-373": [
    { title: "Athanasius of Alexandria" },
  ],
  "monnica-the-mother-of-augustine-of-hippo-387": [{ title: "Saint Monica" }],
  "gregory-of-nazianzus-doctor-bishop-of-constantinople-389": [
    { title: "Gregory of Nazianzus" },
  ],
  "cyril-and-methodius-missionaries-to-the-slavs-885": [
    { title: "Cyril and Methodius" },
  ],
  "florence-nightingale-nurse-1910": [{ title: "Florence Nightingale" }],
  "the-council-of-nicaea-325": [{ title: "First Council of Nicaea" }],
  "aldhelm-bishop-of-sherborne-scholar-and-poet-709": [{ title: "Aldhelm" }],
  "augustine-missionary-first-archbishop-of-canterbury-597-605": [
    { title: "Augustine of Canterbury" },
  ],
  "bede-presbyter-doctor-and-historian-735": [{ title: "Bede" }],
  "joan-of-arc-1431": [{ title: "Joan of Arc" }],
  "justin-martyr-doctor-c-165": [{ title: "Justin Martyr" }],
  "boniface-missionary-bishop-of-mainz-germany-martyr-754": [
    { title: "Saint Boniface" },
  ],
  "columba-abbot-of-iona-ireland-and-scotland-597": [{ title: "Columba" }],
  "basil-the-great-doctor-bishop-of-caesarea-cappadocia-379": [
    { title: "Basil of Caesarea" },
  ],
  "alban-first-recorded-martyr-in-britain-c-304": [{ title: "Saint Alban" }],
  "iren-us-doctor-bishop-of-lyons-france-c-200": [{ title: "Irenaeus" }],
  "the-octave-day-of-st-john-the-baptist": [],
  "confederation-of-canada-1867-dominion-day": [{ title: "Dominion Day" }],
  "the-octave-day-of-st-peter-and-st-paul": [],
  "thomas-more-chancellor-of-england-martyr-1535": [{ title: "Thomas More" }],
  "stephen-langton-archbishop-of-canterbury-1228": [
    { title: "Stephen Langton" },
  ],
  "swithun-bishop-of-winchester-c-862": [{ title: "Swithun" }],
  "margaret-virgin-and-martyr-antioch-of-pisidia": [
    { title: "Margaret the Virgin" },
  ],
  "st-anne-the-mother-of-the-blessed-virgin-mary": [{ title: "Saint Anne" }],
  "olaf-king-of-norway-martyr-1030": [{ title: "Olaf Haraldsson" }],
  "william-wilberforce-emancipator-of-the-slaves-1833": [
    { title: "William Wilberforce" },
  ],
  "the-maccabean-martyrs": [{ title: "Woman with seven sons" }],
  "oswald-king-of-northumbria-martyr-641": [{ title: "Oswald of Northumbria" }],
  "laurence-archdeacon-of-rome-martyr-258": [{ title: "Saint Lawrence" }],
  "charles-inglis-first-anglican-bishop-in-canada-consecrated-1787": [
    { title: "Charles Inglis (bishop)" },
  ],
  "hippolytus-doctor-bishop-in-rome-martyr-235": [
    { title: "Hippolytus of Rome" },
  ],
  "jeremy-taylor-bishop-of-down-ireland-1667": [{ title: "Jeremy Taylor" }],
  "bernard-abbot-of-clairvaux-france-doctor-and-poet-1153": [
    { title: "Bernard of Clairvaux" },
  ],
  "augustine-doctor-bishop-of-hippo-africa-430": [
    { title: "Augustine of Hippo" },
  ],
  "robert-mcdonald-missionary-in-the-western-arctic-1913": [
    { title: "Robert McDonald (missionary)" },
  ],
  "the-beheading-of-st-john-the-baptist": [
    { title: "Beheading of John the Baptist" },
  ],
  "aidan-missionary-bishop-of-lindisfarne-651": [
    { title: "Aidan of Lindisfarne" },
  ],
  "giles-abbot-southern-france-c-720": [{ title: "Saint Giles" }],
  "robert-wolfall-presbyter-first-recorded-anglican-communion-service-in-canada-frobisher-bay-1578":
    [{ title: "Robert Wolfall" }],
  "edmund-james-peck-missionary-to-the-eskimo-1924": [{ title: "Edmund Peck" }],
  "cyprian-doctor-bishop-of-carthage-martyr-258": [{ title: "Cyprian" }],
  "first-general-synod-of-the-anglican-church-of-canada-1893": [],
  "ninian-missionary-first-bishop-in-galloway-scotland-c-430": [
    { title: "Ninian" },
  ],
  "john-coleridge-patteson-missionary-first-bishop-of-melanesia-martyr-1871": [
    { title: "John Patteson (bishop)" },
  ],
  "lancelot-andrewes-bishop-of-winchester-translator-of-the-scriptures-1626": [
    { title: "Lancelot Andrewes" },
  ],
  "jerome-doctor-presbyter-in-rome-and-bethlehem-translator-of-the-scriptures-420":
    [{ title: "Jerome" }],
  "remigius-bishop-of-rheims-france-c-530": [{ title: "Saint Remigius" }],
  "francis-of-assisi-1226": [{ title: "Francis of Assisi" }],
  "william-tyndale-translator-of-the-scriptures-into-english-martyr-1536": [
    { title: "William Tyndale" },
  ],
  "st-denys-of-france-first-bishop-of-paris-martyr-272": [
    { title: "Denis of Paris" },
  ],
  "robert-grosseteste-scholar-bishop-of-lincoln-1253": [
    { title: "Robert Grosseteste" },
  ],
  "paulinus-missionary-archbishop-of-york-644": [{ title: "Paulinus of York" }],
  "st-philip-of-c-sarea-apostolic-man": [{ title: "Philip the Evangelist" }],
  "edward-the-confessor-king-westminster-1066": [
    { title: "Edward the Confessor" },
  ],
  "hugh-latimer-and-nicholas-ridley-bishops-martyrs-1555": [
    { title: "Hugh Latimer" },
    { title: "Nicholas Ridley (martyr)" },
  ],
  "etheldreda-or-audrey-queen-abbess-of-ely-679": [{ title: "Æthelthryth" }],
  "crispin-and-crispinian-martyrs-285": [{ title: "Crispin and Crispinian" }],
  "cedd-missionary-bishop-of-the-east-saxons-664": [{ title: "Cedd" }],
  "alfred-king-of-the-west-saxons-899": [{ title: "Alfred the Great" }],
  "james-hannington-missionary-and-bishop-martyr-1885": [
    { title: "James Hannington" },
  ],
  "all-souls-commemoration-of-the-faithful-departed": [
    { title: "All Souls' Day" },
  ],
  "richard-hooker-doctor-of-the-church-of-england-1600": [
    { title: "Richard Hooker" },
  ],
  "willibrord-missionary-bishop-of-utrecht-holland-739": [
    { title: "Willibrord" },
  ],
  "the-octave-day-of-all-saints-the-founders-benefactors-and-missionaries-of-the-church-in-canada":
    [],
  "martin-bishop-of-tours-france-c-397": [{ title: "Martin of Tours" }],
  "charles-simeon-of-cambridge-pastor-1836": [{ title: "Charles Simeon" }],
  "hugh-bishop-of-lincoln-1200": [{ title: "Hugh of Lincoln" }],
  "margaret-queen-of-scotland-1093": [{ title: "Margaret of Scotland" }],
  "hilda-abbess-of-whitby-680": [{ title: "Hilda of Whitby" }],
  "cecilia-virgin-and-martyr-rome": [{ title: "Cecilia of Rome" }],
  "clement-apostolic-man-bishop-of-rome-c-100": [{ title: "Clement of Rome" }],
  "catherine-virgin-and-martyr-alexandria": [
    { title: "Catherine of Alexandria" },
  ],
  "clement-of-alexandria-doctor-c-210": [{ title: "Clement of Alexandria" }],
  "nicolas-bishop-of-myra-c-342": [{ title: "Saint Nicholas" }],
  "o-sapientia-an-ancient-advent-anthem": [{ title: "O Antiphons" }],
  "ignatius-bishop-of-antioch-martyr-in-rome-c-115": [
    { title: "Ignatius of Antioch" },
  ],
  "thomas-becket-archbishop-of-canterbury-1170": [{ title: "Thomas Becket" }],
  "john-wycliffe-of-oxford-scholar-translator-of-the-scriptures-into-english-1384":
    [{ title: "John Wycliffe" }],
  "john-west-missionary-red-river-canada-1845": [
    { title: "John West (missionary)" },
  ],
};
